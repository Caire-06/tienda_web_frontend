import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listarMovimientosPaginado } from "../../../services/kardexApi";
import type { Movimiento } from "../../../context/InventarioContext";

function fechaCorta(iso: string) {
    const d = new Date(iso);
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

function Kardex() {
    const { token } = useAuth();
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [cargando, setCargando] = useState(true);

    const [producto, setProducto] = useState("Todos");
    const [tipo, setTipo] = useState("Todos");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    const filtrados = movimientos.filter((m) => {
        if (producto !== "Todos" && m.producto !== producto) return false;
        if (tipo !== "Todos" && m.tipo !== tipo) return false;
        if (desde && diaISO(m.fecha) < desde) return false;
        if (hasta && diaISO(m.fecha) > hasta) return false;
        return true;
    });

    const cambiarProducto = (val: string) => { setProducto(val); setPagina(1); };
    const cambiarTipo = (val: string) => { setTipo(val); setPagina(1); };
    const cambiarDesde = (val: string) => { setDesde(val); setPagina(1); };
    const cambiarHasta = (val: string) => { setHasta(val); setPagina(1); };
    const limpiar = () => {
        setProducto("Todos");
        setTipo("Todos");
        setDesde("");
        setHasta("");
        setPagina(1);
    };

    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtrados;

    const totalEntradas = filtrados.filter((m) => m.tipo === "Entrada").length;
    const totalSalidas = filtrados.filter((m) => m.tipo === "Salida").length;

    // Cuadro 1: totales del movimiento (entradas, salidas y saldo final)
    const movEntradasFiltrados = filtrados.filter((m) => m.tipo === "Entrada");
    const movSalidasFiltrados = filtrados.filter((m) => m.tipo === "Salida");
    const totalEntradasCant = movEntradasFiltrados.reduce((acc, m) => acc + (m.cantidad || 0), 0);
    const totalEntradasVal = movEntradasFiltrados.reduce((acc, m) => acc + (m.valorTotal ?? 0), 0);
    const totalSalidasCant = movSalidasFiltrados.reduce((acc, m) => acc + (m.cantidad || 0), 0);
    const totalSalidasVal = movSalidasFiltrados.reduce((acc, m) => acc + (m.valorTotal ?? 0), 0);
    const ultimoMovimiento = filtrados.length > 0
        ? filtrados.reduce((a, b) => (a.fecha > b.fecha ? a : b))
        : null;
    const saldoFinalCant = ultimoMovimiento?.stockNuevo ?? 0;
    const saldoFinalVal = ultimoMovimiento?.saldoValNuevo ?? 0;

    // Cuadro 2: costo de ventas = inventario inicial + compras netas - inventario final
    const comprasNetas = totalEntradasVal;
    const inventarioFinal = saldoFinalVal;
    const inventarioInicial = inventarioFinal - comprasNetas + totalSalidasVal;
    const costoVentas = inventarioInicial + comprasNetas - inventarioFinal;

    const selectClass =
        "px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer";

    useEffect(() => {
        let activo = true;
        if (!token) {
            setCargando(false);
            return;
        }
        setCargando(true);
        listarMovimientosPaginado(token, pagina, 8)
            .then((res) => {
                if (activo) {
                    setMovimientos(res.contenido);
                    setTotalPaginas(res.totalPaginas);
                    setTotalRegistros(res.totalElementos);
                }
            })
            .catch(() => { if (activo) setMovimientos([]); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token, pagina]);

    const exportarCSV = () => {
        const header = ["#", "Fecha", "Guía", "Factura", "Detalle", "Ent. Cant.", "Ent. P.U.", "Ent. P.T.", "Sal. Cant.", "Sal. P.U.", "Sal. P.T.", "Saldo Cant.", "Saldo P.U.", "Saldo P.T."];
        const filas = filtrados.map((m) => [
            m.id,
            m.fecha,
            m.guia ?? "",
            m.factura ?? "",
            m.detalle ?? m.tipo,
            m.tipo === "Entrada" ? String(m.cantidad) : "",
            m.tipo === "Entrada" ? fmtImporte(m.valorUnitario) : "",
            m.tipo === "Entrada" ? fmtImporte(m.valorTotal) : "",
            m.tipo === "Salida" ? String(m.cantidad) : "",
            m.tipo === "Salida" ? fmtImporte(m.valorUnitario) : "",
            m.tipo === "Salida" ? fmtImporte(m.valorTotal) : "",
            String(m.stockNuevo),
            m.saldoPromedio != null ? fmtImporte(m.saldoPromedio) : "",
            fmtImporte(m.saldoValNuevo),
        ]);
        const csv = [header, ...filas].map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kardex_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const imprimir = () => { window.print(); };

    const Th = ({ children, colSpan, rowSpan, className }: { children?: ReactNode; colSpan?: number; rowSpan?: number; className?: string }) => (
        <th colSpan={colSpan} rowSpan={rowSpan} className={className}>{children}</th>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Kardex Valorizado</h1>
                    <p className="text-sm text-slate-500 mt-1">Control cronológico detallado de entradas, salidas y existencias (promedio ponderado móvil).</p>
                </div>
                <button
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    onClick={exportarCSV}
                >
                    Exportar CSV
                </button>
                <button
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    onClick={imprimir}
                >
                    Imprimir
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-wrap gap-2.5 items-center shadow-xs">
                <select className={selectClass} value={producto} onChange={(e) => cambiarProducto(e.target.value)}>
                    <option>Todos</option>
                    {Array.from(new Set(movimientos.map((m) => m.producto).filter(Boolean))).map((nombre) => (
                        <option key={nombre} value={nombre}>{nombre}</option>
                    ))}
                </select>

                <select className={selectClass} value={tipo} onChange={(e) => cambiarTipo(e.target.value)}>
                    <option>Todos</option>
                    <option>Entrada</option>
                    <option>Salida</option>
                </select>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Desde:</span>
                    <input type="date" className={selectClass} value={desde} onChange={(e) => cambiarDesde(e.target.value)} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Hasta:</span>
                    <input type="date" className={selectClass} value={hasta} onChange={(e) => cambiarHasta(e.target.value)} />
                </div>

                <button
                    className="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    onClick={limpiar}
                >
                    Limpiar
                </button>
            </div>

            {/* Cuadros de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Cuadro 1: Totales del movimiento</h3>
                    <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Total entradas (cant. / valor):</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{totalEntradasCant} · S/ {fmtImporte(totalEntradasVal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Total salidas (cant. / valor):</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{totalSalidasCant} · S/ {fmtImporte(totalSalidasVal)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                            <span className="text-slate-500">Saldo final:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{saldoFinalCant} · S/ {fmtImporte(saldoFinalVal)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Cuadro 2: Cálculo del costo de ventas</h3>
                    <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Inventario inicial:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">S/ {fmtImporte(inventarioInicial)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Compras netas:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">S/ {fmtImporte(comprasNetas)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Inventario final:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">S/ {fmtImporte(inventarioFinal)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                            <span className="text-slate-500">Costo de ventas (COGS):</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">S/ {fmtImporte(costoVentas)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chips de Resumen */}
            <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    Entradas: {totalEntradas}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                    Salidas: {totalSalidas}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Total: {filtrados.length}
                </span>
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
                            <Th />
                            <Th />
                            <Th />
                            <Th />
                            <Th />
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
                                <td colSpan={14} className="text-center py-10 text-sm text-slate-500">Cargando movimientos...</td>
                            </tr>
                        ) : (
                            visibles.map((m) => (
                                <tr key={m.id}>
                                    <td className="text-xs text-slate-500 font-mono">{m.id}</td>
                                    <td className="text-xs text-slate-500">{fechaCorta(m.fecha)}</td>
                                    <td className="text-xs text-slate-600 dark:text-slate-400 font-mono">{m.guia || "—"}</td>
                                    <td className="text-xs text-slate-600 dark:text-slate-400 font-mono">{m.factura || "—"}</td>
                                    <td>
                                        <span className={`badge ${m.tipo === "Entrada" ? "ok" : "off"}`}>
                                            {m.tipo === "Entrada" ? "↑ Entrada" : "↓ Salida"}
                                        </span>{" "}
                                        <span className="text-xs text-slate-600 dark:text-slate-400">{m.detalle || m.tipo}</span>
                                    </td>
                                    <td className="font-mono text-xs text-emerald-700 dark:text-emerald-400">{m.tipo === "Entrada" ? m.cantidad : ""}</td>
                                    <td className="font-mono text-xs text-emerald-700 dark:text-emerald-400">{m.tipo === "Entrada" ? fmtImporte(m.valorUnitario) : ""}</td>
                                    <td className="font-mono text-xs text-emerald-700 dark:text-emerald-400">{m.tipo === "Entrada" ? fmtImporte(m.valorTotal) : ""}</td>
                                    <td className="font-mono text-xs text-red-600 dark:text-red-400">{m.tipo === "Salida" ? m.cantidad : ""}</td>
                                    <td className="font-mono text-xs text-red-600 dark:text-red-400">{m.tipo === "Salida" ? fmtImporte(m.valorUnitario) : ""}</td>
                                    <td className="font-mono text-xs text-red-600 dark:text-red-400">{m.tipo === "Salida" ? fmtImporte(m.valorTotal) : ""}</td>
                                    <td className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{m.stockNuevo}</td>
                                    <td className="font-mono text-xs text-slate-800 dark:text-slate-200">{m.saldoPromedio != null ? fmtImporte(m.saldoPromedio) : "—"}</td>
                                    <td className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">S/ {fmtImporte(m.saldoValNuevo)}</td>
                                </tr>
                            ))
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
                        Página {paginaActual} de {totalPaginas} · {totalRegistros} movimientos registrados
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
