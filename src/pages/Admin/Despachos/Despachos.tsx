import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
    listarLotesDespacho,
    listarPedidosPendientesDespacho,
    completarLoteDespacho,
    type DespachoLoteDTO,
} from "../../../services/despachosApi";
import type { Pedido } from "../../../data/pedidos";

function fechaCorta(fechaStr: string) {
    if (!fechaStr) return "—";
    try {
        const d = new Date(fechaStr);
        if (isNaN(d.getTime())) return fechaStr;
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
        return fechaStr;
    }
}

function AdminDespachos() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [tab, setTab] = useState<"lotes" | "cola">("lotes");
    const [lotes, setLotes] = useState<DespachoLoteDTO[]>([]);
    const [pendientes, setPendientes] = useState<Pedido[]>([]);
    const [cargando, setCargando] = useState(true);
    const [loteDetalle, setLoteDetalle] = useState<DespachoLoteDTO | null>(null);

    const cargar = async () => {
        if (!token) return;
        setCargando(true);
        try {
            const [lData, pData] = await Promise.all([
                listarLotesDespacho(token),
                listarPedidosPendientesDespacho(token),
            ]);
            setLotes(lData);
            setPendientes(pData);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [token]);

    const handleCompletarLote = async (lote: DespachoLoteDTO) => {
        if (!token) return;
        if (!window.confirm(`¿Confirmar entrega completa del lote ${lote.codigoLote}? Todos los pedidos incluidos pasarán a "Entregado".`)) return;
        try {
            const actualizado = await completarLoteDespacho(token, lote.id);
            setLotes((prev) => prev.map((l) => (l.id === lote.id ? actualizado : l)));
            if (loteDetalle?.id === lote.id) setLoteDetalle(actualizado);
        } catch (err: any) {
            alert(err.message || "Error al actualizar el lote");
        }
    };

    const enTransito = lotes.filter((l) => l.estado === "En_Transito").length;
    const completados = lotes.filter((l) => l.estado === "Completado").length;
    const totalPedidosDespachados = lotes.reduce((acc, l) => acc + l.cantidadPedidos, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        Control de Despachos y Courier
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Supervisión en tiempo real de lotes preparados por Almacén, empresas de delivery asignadas y cola de salida.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={cargar}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                    >
                        ↻ Actualizar
                    </button>
                    <button
                        onClick={() => navigate("/almacen/despachos")}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                    >
                        Ir a Bandeja de Almacén →
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className={`admin-card ${pendientes.length > 0 ? "alerta" : ""}`}>
                    <span>En Cola de Almacén</span>
                    <strong>{pendientes.length} pedidos</strong>
                </div>
                <div className="admin-card">
                    <span>Lotes en Tránsito</span>
                    <strong className="text-amber-600">{enTransito}</strong>
                </div>
                <div className="admin-card">
                    <span>Lotes Entregados</span>
                    <strong className="text-emerald-600">{completados}</strong>
                </div>
                <div className="admin-card">
                    <span>Pedidos Despachados</span>
                    <strong>{totalPedidosDespachados}</strong>
                </div>
            </section>

            {/* Pestañas */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
                <button
                    onClick={() => setTab("lotes")}
                    className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        tab === "lotes"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                    <span>Manifiestos Enviados por Almacén</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {lotes.length}
                    </span>
                </button>
                <button
                    onClick={() => setTab("cola")}
                    className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        tab === "cola"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                    <span>Cola Pendiente de Preparación</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        {pendientes.length}
                    </span>
                </button>
            </div>

            {cargando ? (
                <div className="text-center py-12 text-sm text-slate-500">
                    Consultando registros logísticos...
                </div>
            ) : tab === "lotes" ? (
                <div className="tabla-wrap">
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Código Lote</th>
                                <th>Empresa Courier</th>
                                <th>N° Guía Remisión</th>
                                <th>Operador (Almacén)</th>
                                <th>Pedidos Incluidos</th>
                                <th>Valorizado</th>
                                <th>Fecha Salida</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lotes.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-8 text-sm text-slate-500">
                                        Aún no se registran despachos consolidados desde Almacén.
                                    </td>
                                </tr>
                            ) : (
                                lotes.map((l) => (
                                    <tr key={l.id}>
                                        <td className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                            {l.codigoLote}
                                        </td>
                                        <td className="font-semibold text-xs">{l.empresaTransporte}</td>
                                        <td className="font-mono text-xs">{l.numeroGuiaRemision}</td>
                                        <td>
                                            <span className="badge font-mono text-[11px]">{l.usuarioRegistro}</span>
                                        </td>
                                        <td>
                                            <span className="font-bold text-xs">{l.cantidadPedidos} pedidos</span>
                                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                                                {l.numerosPedidos.join(", ")}
                                            </div>
                                        </td>
                                        <td className="font-mono font-bold text-xs">
                                            S/ {Number(l.totalValorizado).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-xs text-slate-500">{l.fechaDespacho}</td>
                                        <td>
                                            <span className={`badge ${l.estado === "Completado" ? "ok" : "pend"}`}>
                                                {l.estado === "En_Transito" ? "En Tránsito" : l.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <button className="btn-mini" onClick={() => setLoteDetalle(l)}>
                                                    Auditar
                                                </button>
                                                {l.estado === "En_Transito" && (
                                                    <button
                                                        className="btn-mini sec"
                                                        onClick={() => handleCompletarLote(l)}
                                                    >
                                                        Finalizar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="tabla-wrap">
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>N° Pedido</th>
                                <th>Cliente</th>
                                <th>Modalidad</th>
                                <th>Fecha de Compra</th>
                                <th>Estado Actual</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendientes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-sm text-slate-500">
                                        Almacén al día: no hay pedidos esperando preparación ni despacho.
                                    </td>
                                </tr>
                            ) : (
                                pendientes.map((p) => (
                                    <tr key={p.numero}>
                                        <td className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                            {p.numero}
                                        </td>
                                        <td className="font-semibold text-xs">
                                            {p.cliente || p.comprobante?.nombreRazonSocial || "Cliente"}
                                        </td>
                                        <td className="text-xs">
                                            {p.tipoEntrega === "recojo" ? "Recojo Tienda" : "Envío Courier"}
                                        </td>
                                        <td className="text-xs text-slate-500">{fechaCorta(p.fecha)}</td>
                                        <td>
                                            <span className="badge pend">{p.estado || "Pendiente"}</span>
                                        </td>
                                        <td className="font-mono font-bold text-xs">
                                            S/ {Number(p.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Auditoría de Lote */}
            {loteDetalle && (
                <div className="modal-fondo">
                    <div className="modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>Auditoría: {loteDetalle.codigoLote}</h2>
                            <button className="modal-cerrar" onClick={() => setLoteDetalle(null)}>
                                ✕
                            </button>
                        </div>
                        <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500">Courier / Transporte</dt>
                                <dd className="font-bold">{loteDetalle.empresaTransporte}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500">Guía de Remisión</dt>
                                <dd className="font-mono font-bold">{loteDetalle.numeroGuiaRemision}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500">Conductor / Placa</dt>
                                <dd>{loteDetalle.conductor} ({loteDetalle.placaVehiculo})</dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500">Responsable de Almacén</dt>
                                <dd className="font-mono font-semibold text-blue-600">{loteDetalle.usuarioRegistro}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500">Fecha de Salida</dt>
                                <dd>{loteDetalle.fechaDespacho}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500">Pedidos Incluidos ({loteDetalle.cantidadPedidos})</dt>
                                <dd className="font-mono text-right max-w-[210px]">{loteDetalle.numerosPedidos.join(", ")}</dd>
                            </div>
                            {loteDetalle.observaciones && (
                                <div className="py-2.5">
                                    <dt className="text-slate-500 mb-1">Observaciones</dt>
                                    <dd className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        {loteDetalle.observaciones}
                                    </dd>
                                </div>
                            )}
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500">Valor Total del Lote</dt>
                                <dd className="font-mono font-black text-blue-600">
                                    S/ {Number(loteDetalle.totalValorizado).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDespachos;

