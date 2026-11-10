import { useState } from "react";
import { todasLasVentas, fechaCorta } from "../../../data/ventas";
import type { Venta } from "../../../data/ventas";
import { actualizarEstadoPedido } from "../../../data/pedidos";
import type { EstadoPedido } from "../../../data/pedidos";

function Ventas() {
    const [busqueda, setBusqueda] = useState("");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [detalle, setDetalle] = useState<Venta | null>(null);
    const [, setRefresh] = useState(0);

    const filtradas = todasLasVentas().filter((v) => {
        if (desde && v.fecha.slice(0, 10) < desde) return false;
        if (hasta && v.fecha.slice(0, 10) > hasta) return false;
        const q = busqueda.trim().toLowerCase();
        if (q && !v.numero.toLowerCase().includes(q) && !v.cliente.toLowerCase().includes(q) && !(v.documento && v.documento.includes(q))) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Registro de Ventas</h1>
                <p className="text-sm text-slate-500 mt-1">{filtradas.length} comprobantes y transacciones encontradas.</p>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-wrap gap-3 items-center shadow-xs">
                <input
                    className="flex-1 min-w-[240px] px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Buscar por correlativo N°, cliente, RUC o DNI..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Desde:</span>
                    <input
                        type="date"
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        value={desde}
                        onChange={(e) => setDesde(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Hasta:</span>
                    <input
                        type="date"
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        value={hasta}
                        onChange={(e) => setHasta(e.target.value)}
                    />
                </div>
            </div>

            <div className="tabla-wrap">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>N° Venta</th>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Estado / Despacho</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtradas.map((v) => (
                            <tr key={v.numero}>
                                <td className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{v.numero}</td>
                                <td className="font-semibold text-slate-900 dark:text-white">{v.cliente}</td>
                                <td className="text-xs text-slate-500">{fechaCorta(v.fecha)}</td>
                                <td>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{v.estado}</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            {v.tipoEntrega === "recojo" ? "Recojo en tienda" : "Envío Courier"}
                                        </span>
                                    </div>
                                </td>
                                <td className="font-mono font-bold text-slate-900 dark:text-white">
                                    S/ {v.total.toLocaleString("es-PE")}
                                </td>
                                <td>
                                    <button className="btn-mini" onClick={() => setDetalle(v)}>
                                        Ver detalle
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtradas.length === 0 && (
                    <div className="text-center py-10 text-sm text-slate-500">
                        No hay ventas para los filtros seleccionados.
                    </div>
                )}
            </div>

            {detalle && (
                <div className="modal-fondo">
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <h2>Comprobante {detalle.numero}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{fechaCorta(detalle.fecha)} · {detalle.cliente}</p>
                            </div>
                            <button className="modal-cerrar" onClick={() => setDetalle(null)}>✕</button>
                        </div>

                        <div className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Cambiar estado:
                                </label>
                                <select
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                    value={detalle.estado}
                                    onChange={(e) => {
                                        const nuevo = e.target.value as EstadoPedido;
                                        actualizarEstadoPedido(detalle.numero, nuevo);
                                        setDetalle({ ...detalle, estado: nuevo });
                                        setRefresh(r => r + 1);
                                    }}
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Procesando">Procesando</option>
                                    <option value="Enviado">Enviado</option>
                                    <option value="Listo para recojo">Listo para recojo</option>
                                    <option value="Entregado">Entregado</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>
                            <span className="text-xs text-slate-500">
                                Modalidad: <strong className="text-slate-800 dark:text-slate-200">{detalle.tipoEntrega === "recojo" ? "Recojo en tienda" : "Envío a domicilio"}</strong>
                            </span>
                        </div>

                        <div className="tabla-wrap mb-4">
                            <table className="tabla">
                                <thead>
                                    <tr><th>Producto</th><th>Cant.</th><th>P. Unitario</th><th>Subtotal</th></tr>
                                </thead>
                                <tbody>
                                    {detalle.items.map((it) => (
                                        <tr key={it.id}>
                                            <td className="font-semibold text-xs">{it.nombre}</td>
                                            <td className="font-mono text-xs">{it.cantidad}</td>
                                            <td className="font-mono text-xs">S/ {it.precio.toLocaleString("es-PE")}</td>
                                            <td className="font-mono font-bold text-xs">S/ {(it.precio * it.cantidad).toLocaleString("es-PE")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                            <span className="text-sm font-bold uppercase text-slate-500">Monto Total</span>
                            <strong className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                                S/ {detalle.total.toLocaleString("es-PE")}
                            </strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Ventas;
