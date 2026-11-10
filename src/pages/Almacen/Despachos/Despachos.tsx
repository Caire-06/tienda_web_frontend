import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarPedidosPendientesDespacho,
    listarLotesDespacho,
    crearLoteDespacho,
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

const EMPRESAS_COURIER = [
    "Olva Courier",
    "Shalom Express",
    "Urbano Express",
    "Motorizado TechStore",
    "Dinet Logística",
];

function Despachos() {
    const { token } = useAuth();
    const [tab, setTab] = useState<"pendientes" | "lotes">("pendientes");
    const [pendientes, setPendientes] = useState<Pedido[]>([]);
    const [lotes, setLotes] = useState<DespachoLoteDTO[]>([]);
    const [cargando, setCargando] = useState(true);

    // Selección múltiple para armar lote
    const [seleccionados, setSeleccionados] = useState<string[]>([]);

    // Modal de Consolidación de Lote
    const [modalAbierto, setModalAbierto] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [empresaTransporte, setEmpresaTransporte] = useState(EMPRESAS_COURIER[0]);
    const [numeroGuiaRemision, setNumeroGuiaRemision] = useState("");
    const [conductor, setConductor] = useState("");
    const [placaVehiculo, setPlacaVehiculo] = useState("");
    const [observaciones, setObservaciones] = useState("");

    // Modal para ver detalle de un Lote
    const [loteDetalle, setLoteDetalle] = useState<DespachoLoteDTO | null>(null);

    const cargar = async () => {
        if (!token) return;
        setCargando(true);
        try {
            const [pData, lData] = await Promise.all([
                listarPedidosPendientesDespacho(token),
                listarLotesDespacho(token),
            ]);
            setPendientes(pData);
            setLotes(lData);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [token]);

    const toggleSeleccion = (numero: string) => {
        setSeleccionados((prev) =>
            prev.includes(numero) ? prev.filter((n) => n !== numero) : [...prev, numero]
        );
    };

    const toggleTodos = () => {
        if (seleccionados.length === pendientes.length) {
            setSeleccionados([]);
        } else {
            setSeleccionados(pendientes.map((p) => p.numero));
        }
    };

    const handleDespacharLote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || seleccionados.length === 0) return;
        setGuardando(true);
        try {
            const nuevo = await crearLoteDespacho(token, {
                numerosPedidos: seleccionados,
                empresaTransporte,
                numeroGuiaRemision: numeroGuiaRemision.trim() || undefined,
                conductor: conductor.trim() || undefined,
                placaVehiculo: placaVehiculo.trim() || undefined,
                observaciones: observaciones.trim() || undefined,
            });
            setLotes((prev) => [nuevo, ...prev]);
            setPendientes((prev) => prev.filter((p) => !seleccionados.includes(p.numero)));
            setSeleccionados([]);
            setModalAbierto(false);
            setNumeroGuiaRemision("");
            setConductor("");
            setPlacaVehiculo("");
            setObservaciones("");
            alert(`Lote ${nuevo.codigoLote} despachado a ${nuevo.empresaTransporte} con ${nuevo.cantidadPedidos} pedidos. El Administrador ya puede supervisarlo.`);
            setTab("lotes");
        } catch (err: any) {
            alert(err.message || "Error al generar el lote de despacho");
        } finally {
            setGuardando(false);
        }
    };

    const handleCompletarLote = async (lote: DespachoLoteDTO) => {
        if (!token) return;
        if (!window.confirm(`¿Confirmar que el lote ${lote.codigoLote} fue entregado en su totalidad al cliente final?`)) return;
        try {
            const actualizado = await completarLoteDespacho(token, lote.id);
            setLotes((prev) => prev.map((l) => (l.id === lote.id ? actualizado : l)));
        } catch (err: any) {
            alert(err.message || "Error al completar el lote");
        }
    };

    const valorSeleccionado = pendientes
        .filter((p) => seleccionados.includes(p.numero))
        .reduce((acc, p) => acc + Number(p.total || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Despachos y Envíos</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Prepara pedidos pendientes y agrúpalos en lotes de despacho para entregarlos juntos al courier.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={cargar}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                    >
                        ↻ Actualizar
                    </button>
                    {tab === "pendientes" && (
                        <button
                            disabled={seleccionados.length === 0}
                            onClick={() => setModalAbierto(true)}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <span>📦</span> Consolidar Lote ({seleccionados.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Pestañas */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
                <button
                    onClick={() => setTab("pendientes")}
                    className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        tab === "pendientes"
                            ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                    <span>Pedidos por Despachar</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        {pendientes.length}
                    </span>
                </button>
                <button
                    onClick={() => setTab("lotes")}
                    className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        tab === "lotes"
                            ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                    <span>Lotes Despachados al Courier</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {lotes.length}
                    </span>
                </button>
            </div>

            {cargando ? (
                <div className="text-center py-12 text-sm text-slate-500">
                    Cargando bandeja logística...
                </div>
            ) : tab === "pendientes" ? (
                <div className="space-y-3">
                    {pendientes.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">
                            No hay pedidos pendientes de preparación o envío en este momento.
                        </div>
                    ) : (
                        <div className="tabla-wrap">
                            <table className="tabla">
                                <thead>
                                    <tr>
                                        <th className="w-10">
                                            <input
                                                type="checkbox"
                                                checked={pendientes.length > 0 && seleccionados.length === pendientes.length}
                                                onChange={toggleTodos}
                                                className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                                            />
                                        </th>
                                        <th>N° Pedido</th>
                                        <th>Cliente</th>
                                        <th>Modalidad</th>
                                        <th>Productos</th>
                                        <th>Fecha Compra</th>
                                        <th>Estado</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendientes.map((p) => {
                                        const isSelected = seleccionados.includes(p.numero);
                                        return (
                                            <tr
                                                key={p.numero}
                                                onClick={() => toggleSeleccion(p.numero)}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                                                }`}
                                            >
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSeleccion(p.numero)}
                                                        className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                                                    />
                                                </td>
                                                <td className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    {p.numero}
                                                </td>
                                                <td className="font-semibold text-xs">
                                                    {p.cliente || p.comprobante?.nombreRazonSocial || "Cliente"}
                                                </td>
                                                <td className="text-xs">
                                                    {p.tipoEntrega === "recojo" ? "Recojo Tienda" : "Envío Courier"}
                                                </td>
                                                <td className="text-xs text-slate-500">
                                                    {(p.items || []).reduce((acc, it) => acc + it.cantidad, 0)} uds.
                                                </td>
                                                <td className="text-xs text-slate-500">{fechaCorta(p.fecha)}</td>
                                                <td>
                                                    <span className="badge pend">{p.estado || "Pendiente"}</span>
                                                </td>
                                                <td className="font-mono font-bold text-xs">
                                                    S/ {Number(p.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="tabla-wrap">
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Código Lote</th>
                                <th>Empresa Courier</th>
                                <th>N° Guía Remisión</th>
                                <th>Pedidos Agrupados</th>
                                <th>Despachado Por</th>
                                <th>Fecha Salida</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lotes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-sm text-slate-500">
                                        Aún no se han generado lotes de despacho consolidados.
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
                                            <span className="font-bold text-xs">{l.cantidadPedidos} pedidos</span>
                                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
                                                {l.numerosPedidos.join(", ")}
                                            </div>
                                        </td>
                                        <td className="text-xs text-slate-500">{l.usuarioRegistro}</td>
                                        <td className="text-xs text-slate-500">{l.fechaDespacho}</td>
                                        <td>
                                            <span className={`badge ${l.estado === "Completado" ? "ok" : "pend"}`}>
                                                {l.estado === "En_Transito" ? "En Tránsito" : l.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <button className="btn-mini" onClick={() => setLoteDetalle(l)}>
                                                    Ver Manifiesto
                                                </button>
                                                {l.estado === "En_Transito" && (
                                                    <button
                                                        className="btn-mini sec"
                                                        onClick={() => handleCompletarLote(l)}
                                                    >
                                                        Confirmar Entrega
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
            )}

            {/* Modal para Consolidar y Enviar Lote */}
            {modalAbierto && (
                <div className="modal-fondo">
                    <div className="modal-mediano max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>📦 Generar Lote de Despacho</h2>
                            <button className="modal-cerrar" onClick={() => setModalAbierto(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs flex justify-between items-center">
                            <div>
                                <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                                    {seleccionados.length} pedidos agrupados en este envío
                                </span>
                                <span className="text-[11px] font-mono text-slate-500">
                                    {seleccionados.join(", ")}
                                </span>
                            </div>
                            <strong className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-300">
                                S/ {valorSeleccionado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </strong>
                        </div>

                        <form onSubmit={handleDespacharLote} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Empresa de Transporte / Delivery *
                                </label>
                                <select
                                    required
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                    value={empresaTransporte}
                                    onChange={(e) => setEmpresaTransporte(e.target.value)}
                                >
                                    {EMPRESAS_COURIER.map((emp) => (
                                        <option key={emp} value={emp}>{emp}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        N° Guía de Remisión (Opcional)
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        placeholder="Auto-generado si se deja vacío"
                                        value={numeroGuiaRemision}
                                        onChange={(e) => setNumeroGuiaRemision(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Placa del Vehículo
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        placeholder="ej: B8Z-421"
                                        value={placaVehiculo}
                                        onChange={(e) => setPlacaVehiculo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Conductor / Responsable del Courier
                                </label>
                                <input
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="Nombre completo del repartidor"
                                    value={conductor}
                                    onChange={(e) => setConductor(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Observaciones de Empaque
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="Notas adicionales para auditoría del administrador..."
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalAbierto(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {guardando ? "Registrando Despacho..." : "Confirmar y Despachar Lote"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detalle de Manifiesto */}
            {loteDetalle && (
                <div className="modal-fondo">
                    <div className="modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>Manifiesto {loteDetalle.codigoLote}</h2>
                            <button className="modal-cerrar" onClick={() => setLoteDetalle(null)}>
                                ✕
                            </button>
                        </div>
                        <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                            <div className="py-2 flex justify-between">
                                <dt className="text-slate-500">Courier / Transporte</dt>
                                <dd className="font-bold">{loteDetalle.empresaTransporte}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                                <dt className="text-slate-500">Guía de Remisión</dt>
                                <dd className="font-mono font-bold">{loteDetalle.numeroGuiaRemision}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                                <dt className="text-slate-500">Conductor / Placa</dt>
                                <dd>{loteDetalle.conductor} ({loteDetalle.placaVehiculo})</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                                <dt className="text-slate-500">Despachado por</dt>
                                <dd className="font-mono font-semibold">{loteDetalle.usuarioRegistro}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                                <dt className="text-slate-500">Fecha Salida</dt>
                                <dd>{loteDetalle.fechaDespacho}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                                <dt className="text-slate-500">Pedidos ({loteDetalle.cantidadPedidos})</dt>
                                <dd className="font-mono text-right max-w-[200px]">{loteDetalle.numerosPedidos.join(", ")}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                                <dt className="text-slate-500">Valorizado Total</dt>
                                <dd className="font-mono font-black text-emerald-600">
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

export default Despachos;
