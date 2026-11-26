import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarMovimientos,
    listarInventariosIniciales,
    listarPendientesRegularizacion,
    regularizarInventarioInicial,
} from "../../../services/kardexApi";
import type { Movimiento, ProductoInv } from "../../../context/InventarioContext";
import { limpiarDecimal, parsearNumeroSeguro } from "../../../utils/validaciones";

const REGISTROS_POR_PAGINA = 8;

function fechaCorta(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10) || "—";
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}`;
}

function diaISO(iso: string) {
    return iso.slice(0, 10);
}

function fmtImporte(valor?: number) {
    const n = valor ?? 0;
    return Number(n).toFixed(2);
}

function esEntrada(m: Movimiento) {
    return m.tipo === "Entrada" || m.tipo === "Inventario inicial";
}

function esSalida(m: Movimiento) {
    return m.tipo === "Salida";
}

function suma(lista: Movimiento[], selector: (m: Movimiento) => number | undefined) {
    return lista.reduce((acc, m) => acc + (selector(m) || 0), 0);
}

async function cargarDatos(token: string): Promise<{
    movimientos: Movimiento[];
    pendientes: ProductoInv[];
    inicialesRegistrados: number;
}> {
    const [movimientos, pendientes, iniciales] = await Promise.all([
        listarMovimientos(token),
        listarPendientesRegularizacion(token),
        listarInventariosIniciales(token),
    ]);
    return {
        movimientos,
        pendientes,
        inicialesRegistrados: iniciales.length,
    };
}

function Kardex() {
    const { token } = useAuth();
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);

    const [producto, setProducto] = useState("Todos");
    const [tipo, setTipo] = useState("Todos");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [pagina, setPagina] = useState(1);

    // Regularización de productos que ya existían antes del control de costo inicial.
    const [pendientes, setPendientes] = useState<ProductoInv[]>([]);
    const [inicialesRegistrados, setInicialesRegistrados] = useState(0);
    const [costos, setCostos] = useState<Record<number, string>>({});
    const [guardandoId, setGuardandoId] = useState<number | null>(null);
    const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

    const aplicarFiltros = async () => {
        if (!token) return;
        setCargando(true);
        try {
            const datos = await cargarDatos(token);
            setMovimientos(datos.movimientos);
            setPendientes(datos.pendientes);
            setInicialesRegistrados(datos.inicialesRegistrados);
            setErrorCarga(null);
        } catch (err) {
            setErrorCarga(err instanceof Error ? err.message : "No se pudo cargar el Kardex");
            setMovimientos([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (!token) {
            setCargando(false);
            return;
        }
        void aplicarFiltros();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const productosDisponibles = useMemo(
        () => Array.from(new Set(movimientos.map((m) => m.producto).filter(Boolean))).sort(),
        [movimientos]
    );

    // Los filtros se aplican sobre el histórico completo, no solo sobre la página visible.
    const filtrados = useMemo(() => movimientos.filter((m) => {
        if (producto !== "Todos" && m.producto !== producto) return false;
        if (tipo !== "Todos" && m.tipo !== tipo) return false;
        if (desde && diaISO(m.fecha) < desde) return false;
        if (hasta && diaISO(m.fecha) > hasta) return false;
        return true;
    }), [movimientos, producto, tipo, desde, hasta]);

    const cambiarFiltro = (setter: (valor: string) => void, valor: string) => {
        setter(valor);
        setPagina(1);
    };

    const limpiar = () => {
        setProducto("Todos");
        setTipo("Todos");
        setDesde("");
        setHasta("");
        setPagina(1);
    };

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / REGISTROS_POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtrados.slice(
        (paginaActual - 1) * REGISTROS_POR_PAGINA,
        paginaActual * REGISTROS_POR_PAGINA
    );

    // ===== Cuadros calculados sobre TODOS los movimientos (no sobre la página ni los filtros) =====
    const entradas = movimientos.filter(esEntrada);
    const compras = movimientos.filter((m) => m.tipo === "Entrada");
    const iniciales = movimientos.filter((m) => m.tipo === "Inventario inicial");
    const salidas = movimientos.filter(esSalida);
    const inconsistentes = movimientos.filter((m) => m.inconsistente);

    const totalEntradasCant = suma(entradas, (m) => m.cantidad);
    const totalEntradasVal = suma(entradas, (m) => m.valorTotal);
    const totalSalidasCant = suma(salidas, (m) => m.cantidad);
    const totalSalidasVal = suma(salidas, (m) => m.valorTotal);

    // Último saldo de cada producto. El backend entrega los movimientos del más reciente
    // al más antiguo; se compara fecha/id para no depender del orden de la respuesta.
    const ultimosPorProducto = new Map<number, Movimiento>();
    movimientos.forEach((m) => {
        const actual = ultimosPorProducto.get(m.productoId);
        if (!actual || `${m.fecha}|${m.id}` > `${actual.fecha}|${actual.id}`) {
            ultimosPorProducto.set(m.productoId, m);
        }
    });
    const saldoFinalCant = Array.from(ultimosPorProducto.values())
        .reduce((acc, m) => acc + (m.stockNuevo || 0), 0);
    const saldoFinalVal = Array.from(ultimosPorProducto.values())
        .reduce((acc, m) => acc + (m.saldoValorNuevo || 0), 0);

    const inventarioInicialVal = suma(iniciales, (m) => m.valorTotal);
    const comprasNetas = suma(compras, (m) => m.valorTotal);
    const inventarioFinal = saldoFinalVal;
    const costoVentas = inventarioInicialVal + comprasNetas - inventarioFinal;

    const selectClass =
        "px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer";

    const regularizar = async (p: ProductoInv) => {
        if (!token) return;
        const texto = (costos[p.id] ?? "").trim();
        if (!texto) {
            setAviso({ ok: false, texto: `Ingresa el costo unitario inicial de "${p.nombre}".` });
            return;
        }
        const costo = parsearNumeroSeguro(texto);
        if (!Number.isFinite(costo) || costo < 0) {
            setAviso({ ok: false, texto: "El costo unitario inicial debe ser un número mayor o igual a cero." });
            return;
        }

        setGuardandoId(p.id);
        setAviso(null);
        try {
            await regularizarInventarioInicial(token, p.id, costo);
            setAviso({
                ok: true,
                texto: `"${p.nombre}" regularizado con su stock físico actual (${p.stock} u.). No se duplicaron existencias ni se recontabilizaron ventas.`,
            });
            setCostos((prev) => {
                const copia = { ...prev };
                delete copia[p.id];
                return copia;
            });
            await aplicarFiltros();
        } catch (err) {
            setAviso({
                ok: false,
                texto: err instanceof Error ? err.message : "No se pudo regularizar el inventario inicial.",
            });
        } finally {
            setGuardandoId(null);
        }
    };

    const exportarCSV = () => {
        const header = [
            "#", "Fecha", "Tipo", "Guía", "Factura", "Detalle",
            "Ent. Cant.", "Ent. P.U.", "Ent. P.T.",
            "Sal. Cant.", "Sal. P.U.", "Sal. P.T.",
            "Saldo Cant.", "Saldo P.U.", "Saldo P.T.", "Observación",
        ];
        const filas = filtrados.map((m) => [
            m.id,
            m.fecha,
            m.tipo,
            m.guia ?? "",
            m.factura ?? "",
            m.detalle ?? m.tipo,
            esEntrada(m) ? String(m.cantidad) : "",
            esEntrada(m) ? fmtImporte(m.valorUnitario) : "",
            esEntrada(m) ? fmtImporte(m.valorTotal) : "",
            esSalida(m) ? String(m.cantidad) : "",
            esSalida(m) ? fmtImporte(m.valorUnitario) : "",
            esSalida(m) ? fmtImporte(m.valorTotal) : "",
            String(m.stockNuevo),
            m.saldoPromedio != null ? fmtImporte(m.saldoPromedio) : "",
            fmtImporte(m.saldoValorNuevo),
            m.observacion ?? "",
        ]);
        const csv = [header, ...filas]
            .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kardex_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const Th = ({ children, colSpan, rowSpan, className }: {
        children?: ReactNode; colSpan?: number; rowSpan?: number; className?: string;
    }) => (
        <th colSpan={colSpan} rowSpan={rowSpan} className={className}>{children}</th>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Kardex Valorizado</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Control cronológico detallado de entradas, salidas y existencias (promedio ponderado móvil).
                    </p>
                </div>
                <button
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    onClick={exportarCSV}
                >
                    Exportar CSV
                </button>
                <button
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    onClick={() => window.print()}
                >
                    Imprimir
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-wrap gap-2.5 items-center shadow-xs">
                <select
                    className={selectClass}
                    value={producto}
                    onChange={(e) => cambiarFiltro(setProducto, e.target.value)}
                >
                    <option value="Todos">Todos los productos</option>
                    {productosDisponibles.map((nombre) => (
                        <option key={nombre} value={nombre}>{nombre}</option>
                    ))}
                </select>

                <select
                    className={selectClass}
                    value={tipo}
                    onChange={(e) => cambiarFiltro(setTipo, e.target.value)}
                >
                    <option value="Todos">Todos los tipos</option>
                    <option value="Entrada">Entrada</option>
                    <option value="Inventario inicial">Inventario inicial</option>
                    <option value="Salida">Salida</option>
                </select>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Desde:</span>
                    <input
                        type="date"
                        className={selectClass}
                        value={desde}
                        onChange={(e) => cambiarFiltro(setDesde, e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Hasta:</span>
                    <input
                        type="date"
                        className={selectClass}
                        value={hasta}
                        onChange={(e) => cambiarFiltro(setHasta, e.target.value)}
                    />
                </div>

                <button
                    className="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    onClick={limpiar}
                >
                    Limpiar
                </button>
            </div>

            {errorCarga && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">
                    {errorCarga}
                </div>
            )}

            {/* Cuadros de resumen: siempre sobre el histórico completo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Cuadro 1: Totales del movimiento
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Histórico completo · {movimientos.length} movimientos</p>
                    <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Inventario inicial (cant. / valor):</span>
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                                {suma(iniciales, (m) => m.cantidad)} · S/ {fmtImporte(inventarioInicialVal)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Compras / entradas (cant. / valor):</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {suma(compras, (m) => m.cantidad)} · S/ {fmtImporte(comprasNetas)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Total entradas (cant. / valor):</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                {totalEntradasCant} · S/ {fmtImporte(totalEntradasVal)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Total salidas (cant. / valor):</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                {totalSalidasCant} · S/ {fmtImporte(totalSalidasVal)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                            <span className="text-slate-500">Saldo final:</span>
                            <span className={`font-bold ${saldoFinalCant < 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>
                                {saldoFinalCant} · S/ {fmtImporte(saldoFinalVal)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Cuadro 2: Cálculo del costo de ventas
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Salidas valorizadas al costo promedio vigente</p>
                    <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Inventario inicial:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">S/ {fmtImporte(inventarioInicialVal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Compras netas:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">S/ {fmtImporte(comprasNetas)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Inventario final:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">S/ {fmtImporte(inventarioFinal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Salidas valorizadas (Kardex):</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">S/ {fmtImporte(totalSalidasVal)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                            <span className="text-slate-500">Costo de ventas (COGS):</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">S/ {fmtImporte(costoVentas)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chips de resumen */}
            <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    Entradas: {compras.length}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    Inventario inicial: {iniciales.length}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                    Salidas: {salidas.length}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Total: {movimientos.length}
                </span>
                {inconsistentes.length > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
                        ⚠ Inconsistencias: {inconsistentes.length}
                    </span>
                )}
            </div>

            {/* Regularización de inventario inicial */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            Regularizar inventario inicial
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                            Productos que ya existían antes de registrar el costo inicial. Se usa su <b>stock físico actual</b>
                            como cantidad del evento; no duplica existencias ni recontabiliza compras o ventas históricas.
                        </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                        {inicialesRegistrados} registrados · {pendientes.length} pendientes
                    </span>
                </div>

                {aviso && (
                    <p className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${
                        aviso.ok
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                    }`}>
                        {aviso.texto}
                    </p>
                )}

                {pendientes.length === 0 ? (
                    <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                        Todos los productos activos tienen su costo unitario inicial registrado.
                    </p>
                ) : (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {pendientes.map((p) => (
                            <div
                                key={p.id}
                                className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{p.nombre}</p>
                                    <p className="text-[10px] text-slate-500">Stock físico: {p.stock} u.</p>
                                </div>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Costo S/"
                                    className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                    value={costos[p.id] ?? ""}
                                    onChange={(e) => setCostos((prev) => ({ ...prev, [p.id]: limpiarDecimal(e.target.value) }))}
                                />
                                <button
                                    type="button"
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
                                    disabled={guardandoId !== null}
                                    onClick={() => void regularizar(p)}
                                >
                                    {guardandoId === p.id ? "..." : "Regularizar"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="tabla-wrap">
                <table className="tabla">
                    <thead>
                        <tr>
                            <Th>#</Th>
                            <Th>Fecha</Th>
                            <Th>Guía</Th>
                            <Th>Factura</Th>
                            <Th>Detalle</Th>
                            <Th colSpan={3} className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">Entradas</Th>
                            <Th colSpan={3} className="bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300">Salidas</Th>
                            <Th colSpan={3} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Saldos</Th>
                        </tr>
                        <tr>
                            <Th /><Th /><Th /><Th /><Th />
                            <Th className="text-emerald-700 dark:text-emerald-400">Cant.</Th>
                            <Th className="text-emerald-700 dark:text-emerald-400">P.U.</Th>
                            <Th className="text-emerald-700 dark:text-emerald-400">P.T.</Th>
                            <Th className="text-red-700 dark:text-red-400">Cant.</Th>
                            <Th className="text-red-700 dark:text-red-400">P.U.</Th>
                            <Th className="text-red-700 dark:text-red-400">P.T.</Th>
                            <Th className="text-slate-700 dark:text-slate-300">Cant.</Th>
                            <Th className="text-slate-700 dark:text-slate-300">P.U.</Th>
                            <Th className="text-slate-700 dark:text-slate-300">P.T.</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan={14} className="text-center py-10 text-sm text-slate-500">
                                    Cargando movimientos...
                                </td>
                            </tr>
                        ) : (
                            visibles.map((m) => {
                                const entrada = esEntrada(m);
                                const salida = esSalida(m);
                                return (
                                    <tr
                                        key={m.id}
                                        className={m.inconsistente ? "bg-amber-50/70 dark:bg-amber-950/20" : undefined}
                                    >
                                        <td className="text-xs text-slate-500 font-mono">{m.id}</td>
                                        <td className="text-xs text-slate-500">{fechaCorta(m.fecha)}</td>
                                        <td className="text-xs text-slate-600 dark:text-slate-400 font-mono">{m.guia || "—"}</td>
                                        <td className="text-xs text-slate-600 dark:text-slate-400 font-mono">{m.factura || "—"}</td>
                                        <td>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`badge ${
                                                    m.tipo === "Entrada" ? "ok"
                                                        : m.tipo === "Inventario inicial" ? "pend"
                                                        : "off"
                                                }`}>
                                                    {m.tipo === "Entrada" ? "↑ Entrada"
                                                        : m.tipo === "Inventario inicial" ? "◈ Inicial"
                                                        : "↓ Salida"}
                                                </span>
                                                {m.inconsistente && (
                                                    <span
                                                        title={m.observacion ?? "Inconsistencia histórica"}
                                                        className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-400"
                                                    >
                                                        ⚠ Inconsistente
                                                    </span>
                                                )}
                                            </div>
                                            <span className="block text-xs text-slate-600 dark:text-slate-400">
                                                {m.detalle || m.tipo}
                                            </span>
                                            {m.observacion && (
                                                <span className="block text-[10px] text-orange-600 dark:text-orange-400">
                                                    {m.observacion}
                                                </span>
                                            )}
                                        </td>
                                        <td className="font-mono text-xs text-emerald-700 dark:text-emerald-400">{entrada ? m.cantidad : ""}</td>
                                        <td className="font-mono text-xs text-emerald-700 dark:text-emerald-400">{entrada ? fmtImporte(m.valorUnitario) : ""}</td>
                                        <td className="font-mono text-xs text-emerald-700 dark:text-emerald-400">{entrada ? fmtImporte(m.valorTotal) : ""}</td>
                                        <td className="font-mono text-xs text-red-600 dark:text-red-400">{salida ? m.cantidad : ""}</td>
                                        <td className="font-mono text-xs text-red-600 dark:text-red-400">{salida ? fmtImporte(m.valorUnitario) : ""}</td>
                                        <td className="font-mono text-xs text-red-600 dark:text-red-400">{salida ? fmtImporte(m.valorTotal) : ""}</td>
                                        <td className={`font-mono font-bold text-xs ${(m.stockNuevo ?? 0) < 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>
                                            {m.stockNuevo}
                                        </td>
                                        <td className="font-mono text-xs text-slate-800 dark:text-slate-200">
                                            {m.saldoPromedio != null ? fmtImporte(m.saldoPromedio) : "—"}
                                        </td>
                                        <td className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                            S/ {fmtImporte(m.saldoValorNuevo)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                {!cargando && filtrados.length === 0 && (
                    <div className="text-center py-10 text-sm text-slate-500">
                        Sin movimientos para los filtros seleccionados.
                    </div>
                )}
            </div>

            {/* Paginación */}
            {filtrados.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2">
                    <span>
                        Página {paginaActual} de {totalPaginas} · {filtrados.length} de {movimientos.length} movimientos
                    </span>
                    <div className="flex gap-1">
                        <button
                            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
                            disabled={paginaActual === 1}
                            onClick={() => setPagina(paginaActual - 1)}
                        >
                            ‹
                        </button>
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                            <button
                                key={n}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                    n === paginaActual
                                        ? "bg-emerald-600 text-white"
                                        : "border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                                onClick={() => setPagina(n)}
                            >
                                {n}
                            </button>
                        ))}
                        <button
                            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
                            disabled={paginaActual === totalPaginas}
                            onClick={() => setPagina(paginaActual + 1)}
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Kardex;
