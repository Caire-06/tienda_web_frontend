import { formatoImporte as fmtImporte } from "../../../utils/formatoImporte";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listarMovimientos } from "../../../services/kardexApi";
import type { Movimiento } from "../../../context/InventarioContext";

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

function esEntrada(m: Movimiento) {
    return m.tipo === "Entrada" || m.tipo === "Inventario inicial";
}

function esSalida(m: Movimiento) {
    return m.tipo === "Salida";
}

function suma(lista: Movimiento[], selector: (m: Movimiento) => number | undefined) {
    return lista.reduce((acc, m) => acc + (selector(m) || 0), 0);
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

    const aplicarFiltros = async () => {
        if (!token) return;
        setCargando(true);
        try {
            setMovimientos(await listarMovimientos(token));
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
        () => Array.from(new Map(movimientos.map((m) => [m.productoId, m.producto])).entries()).sort((a, b) => a[1].localeCompare(b[1])),
        [movimientos]
    );

    // Los filtros se aplican sobre el histórico completo, no solo sobre la página visible.
    const filtrados = useMemo(() => movimientos.filter((m) => {
        if (producto !== "Todos" && String(m.productoId) !== producto) return false;
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

    // Saldos reales por producto, sin excluir movimientos por tipo.
    const alcance = movimientos.filter(m => producto === "Todos" || String(m.productoId) === producto);
    const periodo = alcance.filter(m => (!desde || diaISO(m.fecha) >= desde) && (!hasta || diaISO(m.fecha) <= hasta));
    const entradas = periodo.filter(esEntrada);
    const compras = periodo.filter(m => m.tipo === "Entrada");
    const iniciales = periodo.filter(m => m.tipo === "Inventario inicial");
    const salidas = periodo.filter(esSalida);
    const inconsistentes = filtrados.filter(m => m.inconsistente);
    const totalEntradasCant = suma(entradas, m => m.cantidad);
    const totalEntradasVal = suma(entradas, m => m.valorTotal);
    const totalSalidasCant = suma(salidas, m => m.cantidad);
    const totalSalidasVal = suma(salidas, m => m.valorTotal);
    const ultimoSaldo = (lista: Movimiento[]) => {
        const ultimos = new Map<number, Movimiento>();
        lista.forEach(m => { if (!ultimos.has(m.productoId)) ultimos.set(m.productoId, m); });
        return [...ultimos.values()];
    };
    const apertura = desde ? ultimoSaldo(alcance.filter(m => diaISO(m.fecha) < desde)) : [];
    const cierre = ultimoSaldo(alcance.filter(m => !hasta || diaISO(m.fecha) <= hasta));
    const saldoFinalCant = suma(cierre, m => m.stockNuevo);
    const saldoFinalVal = suma(cierre, m => m.saldoValorNuevo);
    const inventarioInicialVal = suma(apertura, m => m.saldoValorNuevo) + suma(iniciales, m => m.valorTotal);
    const comprasNetas = suma(compras, m => m.valorTotal);
    const costoVentas = inventarioInicialVal + comprasNetas - saldoFinalVal;

    const selectClass =
        "px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer";

    const exportarCSV = () => {
        const fmtCSV = (valor?: number) => Number(valor ?? 0).toFixed(2);
        const header = [
            "#", "Fecha", "Tipo", "Guía", "Factura", "Producto", "Detalle",
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
            m.producto,
            m.detalle ?? m.tipo,
            esEntrada(m) ? String(m.cantidad) : "",
            esEntrada(m) ? fmtCSV(m.valorUnitario) : "",
            esEntrada(m) ? fmtCSV(m.valorTotal) : "",
            esSalida(m) ? String(m.cantidad) : "",
            esSalida(m) ? fmtCSV(m.valorUnitario) : "",
            esSalida(m) ? fmtCSV(m.valorTotal) : "",
            String(m.stockNuevo),
            m.saldoPromedio != null ? fmtCSV(m.saldoPromedio) : "",
            fmtCSV(m.saldoValorNuevo),
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
        <div className="space-y-4 min-w-0">
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
                    {productosDisponibles.map(([id, nombre]) => (
                        <option key={id} value={String(id)}>{nombre}</option>
                    ))}
                </select>

                <select className={selectClass} aria-label="Tipo de movimiento" value={tipo}
                    onChange={(e) => cambiarFiltro(setTipo, e.target.value)}>
                    <option value="Todos">Todos</option>
                    <option value="Inventario inicial">Inventario inicial</option>
                    <option value="Entrada">Entradas</option>
                    <option value="Salida">Salidas</option>
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

            {/* Resumen histórico, separado de los filtros de movimientos. */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <h2 className="text-sm font-black text-slate-900 dark:text-white">Resumen del inventario</h2>
                <p className="text-xs text-slate-500 mt-1">{producto === "Todos" ? "Todos los productos" : productosDisponibles.find(([id]) => String(id) === producto)?.[1]} · {periodo.length} movimientos del período. El saldo incluye todos los tipos de movimiento.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs">
                    {[
                        [desde ? "Apertura + inventarios iniciales" : "Inventario inicial", suma(apertura, m => m.stockNuevo) + suma(iniciales, m => m.cantidad), inventarioInicialVal],
                        ["Compras posteriores", suma(compras, (m) => m.cantidad), comprasNetas],
                        ["Salidas de pedidos", totalSalidasCant, totalSalidasVal],
                        ["Saldo disponible", saldoFinalCant, saldoFinalVal],
                    ].map(([nombre, cantidad, valor]) => (
                        <div key={String(nombre)} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                            <p className="text-slate-500">{nombre}</p>
                            <p className="font-bold mt-1">{cantidad} unidades</p>
                            <p className="font-bold">S/ {fmtImporte(Number(valor))}</p>
                        </div>
                    ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">Selección visible: {filtrados.length} movimientos · {suma(filtrados, m => m.cantidad)} unidades movidas · S/ {fmtImporte(suma(filtrados, m => m.valorTotal))} (importe bruto de movimientos, no saldo).</p>
                <details className="mt-3 text-xs">
                    <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">Ver conciliación del costo de las salidas</summary>
                    <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                        <p>Inventario inicial + compras − saldo disponible = S/ {fmtImporte(costoVentas)}</p>
                        <p>Salidas valorizadas al costo promedio: S/ {fmtImporte(totalSalidasVal)}</p>
                        <p>Total entradas: {totalEntradasCant} unidades · S/ {fmtImporte(totalEntradasVal)}</p>
                        <p>Incluye pedidos activos que reservan stock; no equivale necesariamente al costo contable de ventas entregadas.</p>
                        {Math.abs(costoVentas - totalSalidasVal) > 0.01 && <p className="text-red-600">Advertencia: diferencia en la conciliación.</p>}
                    </div>
                </details>
            </section>

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
                    Total: {periodo.length}
                </span>
                {inconsistentes.length > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
                        ⚠ Inconsistencias: {inconsistentes.length}
                    </span>
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
                            <Th>Producto</Th>
                            <Th>Detalle</Th>
                            <Th colSpan={3} className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">Entradas</Th>
                            <Th colSpan={3} className="bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300">Salidas</Th>
                            <Th colSpan={3} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Saldos</Th>
                        </tr>
                        <tr>
                            <Th /><Th /><Th /><Th /><Th /><Th />
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
                                <td colSpan={15} className="text-center py-10 text-sm text-slate-500">
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
                                        <td className="text-xs font-semibold">{m.producto}</td>
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
                        Página {paginaActual} de {totalPaginas} · {filtrados.length} de {periodo.length} movimientos
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
