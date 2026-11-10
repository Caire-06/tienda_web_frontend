import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listarMovimientos } from "../../../services/kardexApi";
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

function Kardex() {
    const { token } = useAuth();
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [cargando, setCargando] = useState(true);

    const [producto, setProducto] = useState("Todos");
    const [tipo, setTipo] = useState("Todos");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [pagina, setPagina] = useState(1);

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

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / 8));
    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtrados.slice((paginaActual - 1) * 8, paginaActual * 8);

    const totalEntradas = filtrados.filter((m) => m.tipo === "Entrada").length;
    const totalSalidas = filtrados.filter((m) => m.tipo === "Salida").length;

    const selectClass =
        "px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer";

    useEffect(() => {
        let activo = true;
        if (!token) {
            setCargando(false);
            return;
        }
        setCargando(true);
        listarMovimientos(token)
            .then((lista) => { if (activo) setMovimientos(lista); })
            .catch(() => { if (activo) setMovimientos([]); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Kardex Físico y Valorado</h1>
                <p className="text-sm text-slate-500 mt-1">Control cronológico detallado de entradas, salidas y existencias.</p>
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

            {/* Chips de Resumen */}
            <div className="flex gap-2">
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
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Stock Anterior</th>
                            <th>Stock Resultante</th>
                            <th>Motivo / Referencia</th>
                            <th>Operador</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan={8} className="text-center py-10 text-sm text-slate-500">Cargando movimientos...</td>
                            </tr>
                        ) : (
                            visibles.map((m) => (
                                <tr key={m.id}>
                                    <td className="text-xs text-slate-500">{fechaCorta(m.fecha)}</td>
                                    <td className="font-semibold text-xs">{m.producto}</td>
                                    <td>
                                        <span className={`badge ${m.tipo === "Entrada" ? "ok" : "off"}`}>
                                            {m.tipo === "Entrada" ? "↑ Entrada" : "↓ Salida"}
                                        </span>
                                    </td>
                                    <td className={`font-mono font-bold text-xs ${m.tipo === "Entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                        {m.tipo === "Entrada" ? `+${m.cantidad}` : `-${m.cantidad}`}
                                    </td>
                                    <td className="font-mono text-xs text-slate-500">{m.stockAnterior}</td>
                                    <td className="font-mono font-bold text-xs">{m.stockNuevo}</td>
                                    <td className="text-xs text-slate-600 dark:text-slate-400">{m.motivo}</td>
                                    <td className="text-xs text-slate-500">{m.usuario}</td>
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
                        Página {paginaActual} de {totalPaginas} · {filtrados.length} registros
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
