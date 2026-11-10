import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { listarPedidosAdmin } from "../../../services/pedidosApi";
import { etiquetaTipoEntrega, formatearFechaHora, type Pedido } from "../../../data/pedidos";

function obtenerSerieComprobante(v: Pedido): { serie: string; tipo: string } {
    const tipo = v.comprobante?.tipo ? v.comprobante.tipo.toUpperCase() : "BOLETA";
    const prefijo = tipo === "FACTURA" ? "F001-" : "B001-";
    const numeroLimpio = v.numero.replace(/^PED-/, "");
    return {
        serie: prefijo + numeroLimpio,
        tipo: tipo,
    };
}

function badgeDeEstado(estado?: string) {
    const e = (estado || "Pendiente").toLowerCase();
    if (e === "pendiente") return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
    if (e === "procesando") return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
    if (e === "listo para recojo") return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300";
    if (e === "enviado") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300";
    if (e === "entregado") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
    return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300";
}

function Ventas() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [ventas, setVentas] = useState<Pedido[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState("");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [detalle, setDetalle] = useState<Pedido | null>(null);

    const cargar = async () => {
        if (!token) return;
        setCargando(true);
        setError(null);
        try {
            const data = await listarPedidosAdmin(token);
            setVentas(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar ventas");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [token]);

    const filtradas = ventas.filter((v) => {
        if (desde && v.fecha.slice(0, 10) < desde) return false;
        if (hasta && v.fecha.slice(0, 10) > hasta) return false;
        const q = busqueda.trim().toLowerCase();
        if (q) {
            const nMatch = v.numero.toLowerCase().includes(q);
            const cMatch = (v.cliente || "").toLowerCase().includes(q);
            const dMatch = v.comprobante?.documento ? v.comprobante.documento.includes(q) : false;
            const sMatch = obtenerSerieComprobante(v).serie.toLowerCase().includes(q);
            if (!nMatch && !cMatch && !dMatch && !sMatch) return false;
        }
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        Registro de Ventas
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Supervisión de compras, emisión de comprobantes oficiales y estado logístico gestionado por Almacén.
                    </p>
                </div>
                <button
                    onClick={cargar}
                    className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                >
                    ↻ Actualizar
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-wrap gap-3 items-center shadow-xs">
                <input
                    className="flex-1 min-w-[240px] px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Buscar por N° pedido, comprobante (B001/F001), cliente o RUC/DNI..."
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
                            <th>N° Pedido</th>
                            <th>Cliente</th>
                            <th>Comprobante</th>
                            <th>Fecha</th>
                            <th>Estado (Logística Almacén)</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-sm text-slate-500">
                                    Cargando ventas...
                                </td>
                            </tr>
                        ) : filtradas.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-sm text-slate-500">
                                    No hay ventas registradas para los filtros seleccionados.
                                </td>
                            </tr>
                        ) : (
                            filtradas.map((v) => {
                                const doc = obtenerSerieComprobante(v);
                                const esFactura = doc.tipo === "FACTURA";
                                const estado = v.estado || "Pendiente";
                                return (
                                    <tr key={v.numero}>
                                        <td>
                                            <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                                {v.numero}
                                            </div>
                                        </td>
                                        <td className="font-semibold text-slate-900 dark:text-white">
                                            {v.cliente || v.comprobante?.nombreRazonSocial || "Cliente"}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`badge ${esFactura ? "rol-admin" : "ok"}`}>
                                                    {doc.tipo}
                                                </span>
                                                <span className="font-mono text-xs font-bold">{doc.serie}</span>
                                            </div>
                                            {v.comprobante?.documento && (
                                                <div className="text-[11px] text-slate-400">
                                                    Doc: {v.comprobante.documento}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-xs text-slate-500 font-mono">{formatearFechaHora(v.fecha)}</td>
                                        <td>
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeDeEstado(estado)}`}>
                                                    {estado}
                                                </span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                    {v.codigoLoteDespacho
                                                        ? `Lote ${v.codigoLoteDespacho} · ${v.empresaTransporte || "Courier"}`
                                                        : etiquetaTipoEntrega(v.tipoEntrega)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="font-mono font-bold text-slate-900 dark:text-white">
                                            S/ {Number(v.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <button className="btn-mini" onClick={() => setDetalle(v)}>
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {detalle && (
                <div className="modal-fondo">
                    <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <h2>Detalle de Pedido: {detalle.numero}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {formatearFechaHora(detalle.fecha)} · {detalle.cliente || detalle.comprobante?.nombreRazonSocial}
                                </p>
                            </div>
                            <button className="modal-cerrar" onClick={() => setDetalle(null)}>
                                ✕
                            </button>
                        </div>

                        {/* Trazabilidad de Fechas y Horas por Etapa */}
                        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div>
                                <span className="text-slate-400 block font-semibold">Compra:</span>
                                <strong className="font-mono text-slate-800 dark:text-slate-200">{formatearFechaHora(detalle.fecha)}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-semibold">En Preparación:</span>
                                <strong className="font-mono text-slate-800 dark:text-slate-200">{formatearFechaHora(detalle.fechaProcesando)}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-semibold">{detalle.tipoEntrega === "recojo" ? "Listo Recojo:" : "Envío Courier:"}</span>
                                <strong className="font-mono text-slate-800 dark:text-slate-200">{formatearFechaHora(detalle.fechaEnvio)}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-semibold">Entrega Final:</span>
                                <strong className="font-mono text-slate-800 dark:text-slate-200">{formatearFechaHora(detalle.fechaEntrega)}</strong>
                            </div>
                        </div>

                        {/* Flujo de Estados del Pedido */}
                        <div className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">
                                Flujo del Pedido
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                                    <div className="font-bold text-blue-700 dark:text-blue-300">1. Pedido</div>
                                    <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{detalle.numero}</div>
                                </div>
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                                    <div className="font-bold text-emerald-700 dark:text-emerald-300">2. Pago</div>
                                    <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{detalle.metodoPago || "Completado"}</div>
                                </div>
                                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800">
                                    <div className="font-bold text-violet-700 dark:text-violet-300">3. Comprobante</div>
                                    <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                        {obtenerSerieComprobante(detalle).serie}
                                    </div>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                                    <div className="font-bold text-amber-700 dark:text-amber-300">4. Modalidad</div>
                                    <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                        {detalle.codigoLoteDespacho
                                            ? `${detalle.codigoLoteDespacho} (${detalle.empresaTransporte})`
                                            : etiquetaTipoEntrega(detalle.tipoEntrega)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Estado Operativo (Solo Supervisión — Almacén gestiona los cambios) */}
                        <div className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Estado Actual:
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeDeEstado(detalle.estado)}`}>
                                        {detalle.estado || "Pendiente"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    El control físico de preparación y despacho lo gestiona directamente Almacén.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setDetalle(null);
                                    navigate("/almacen/despachos");
                                }}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                            >
                                Ver en Almacén →
                            </button>
                        </div>

                        {detalle.comprobante && (
                            <div className="mb-4 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo y Documento:</span>
                                    <strong>{detalle.comprobante.tipo} {detalle.comprobante.documento}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Razón Social:</span>
                                    <strong>{detalle.comprobante.nombreRazonSocial}</strong>
                                </div>
                            </div>
                        )}

                        <div className="tabla-wrap mb-4">
                            <table className="tabla">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cant.</th>
                                        <th>P. Unitario</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalle.items.map((it) => (
                                        <tr key={it.id}>
                                            <td className="font-semibold text-xs">{it.nombre}</td>
                                            <td className="font-mono text-xs">{it.cantidad}</td>
                                            <td className="font-mono text-xs">
                                                S/ {Number(it.precio).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="font-mono font-bold text-xs">
                                                S/ {(Number(it.precio) * it.cantidad).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                            <div>
                                <span className="text-sm font-bold uppercase text-slate-500 block">Monto Total Cobrado</span>
                                <span className="text-[11px] text-slate-400">
                                    {detalle.tipoEntrega === "agencia_destino"
                                        ? "Flete de agencia por pagar al recibir"
                                        : detalle.costoEnvio && detalle.costoEnvio > 0
                                            ? `Incluye envío S/ ${Number(detalle.costoEnvio).toFixed(2)}`
                                            : "Envío S/ 0.00"}
                                </span>
                            </div>
                            <strong className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                                S/ {Number(detalle.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Ventas;
