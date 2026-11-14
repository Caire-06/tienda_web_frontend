import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
    listarLotesDespacho,
    listarPedidosPendientesDespacho,
    completarLoteDespacho,
    type DespachoLoteDTO,
} from "../../../services/despachosApi";
import { etiquetaTipoEntrega, formatearFechaHora, type Pedido } from "../../../data/pedidos";
import {
    IconoActualizar,
    IconoCamion,
    IconoCerrar,
    IconoCheckCirculo,
    IconoEtiqueta,
    IconoFlechaDerecha,
    IconoLista,
    IconoPaquete,
    IconoReloj,
} from "../../../components/Iconos/Iconos";

const INTERVALO_ACTUALIZACION_MS = 20_000;

function badgeDeEstado(estado?: string) {
    const e = (estado || "Pendiente").toLowerCase();
    if (e === "pendiente") return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50";
    if (e === "procesando") return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50";
    if (e === "listo para recojo") return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50";
    if (e === "enviado") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50";
    if (e === "entregado") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50";
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
}

function haceCuanto(fecha: Date | null): string {
    if (!fecha) return "sincronizando…";
    const segundos = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 1000));
    if (segundos < 5) return "actualizado ahora";
    if (segundos < 60) return `hace ${segundos} s`;
    return `hace ${Math.floor(segundos / 60)} min`;
}

function AdminDespachos() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [tab, setTab] = useState<"lotes" | "cola">("lotes");
    const [lotes, setLotes] = useState<DespachoLoteDTO[]>([]);
    const [pendientes, setPendientes] = useState<Pedido[]>([]);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
    const [loteDetalle, setLoteDetalle] = useState<DespachoLoteDTO | null>(null);

    const solicitudEnCurso = useRef(false);

    const cargar = useCallback(
        async (silencioso = false) => {
            if (!token || solicitudEnCurso.current) return;
            solicitudEnCurso.current = true;
            if (silencioso) setActualizando(true);
            else setCargando(true);
            try {
                const [lData, pData] = await Promise.all([
                    listarLotesDespacho(token),
                    listarPedidosPendientesDespacho(token),
                ]);
                setLotes(lData);
                setPendientes(pData);
                setUltimaActualizacion(new Date());
            } finally {
                solicitudEnCurso.current = false;
                setCargando(false);
                setActualizando(false);
            }
        },
        [token]
    );

    useEffect(() => {
        void cargar();

        const intervalo = window.setInterval(() => {
            if (document.visibilityState === "visible") void cargar(true);
        }, INTERVALO_ACTUALIZACION_MS);
        const alEnfocar = () => void cargar(true);
        const alCambiarVisibilidad = () => {
            if (document.visibilityState === "visible") void cargar(true);
        };
        window.addEventListener("focus", alEnfocar);
        document.addEventListener("visibilitychange", alCambiarVisibilidad);
        return () => {
            window.clearInterval(intervalo);
            window.removeEventListener("focus", alEnfocar);
            document.removeEventListener("visibilitychange", alCambiarVisibilidad);
        };
    }, [cargar]);

    const [, setTick] = useState(0);
    useEffect(() => {
        const id = window.setInterval(() => setTick((t) => t + 1), 5_000);
        return () => window.clearInterval(id);
    }, []);

    const handleCompletarLote = async (lote: DespachoLoteDTO) => {
        if (!token) return;
        if (!window.confirm(`¿Confirmar entrega completa del lote ${lote.codigoLote}? Todos los pedidos incluidos pasarán a "Entregado".`)) return;
        try {
            const actualizado = await completarLoteDespacho(token, lote.id);
            setLotes((prev) => prev.map((l) => (l.id === lote.id ? actualizado : l)));
            if (loteDetalle?.id === lote.id) setLoteDetalle(actualizado);
            void cargar(true);
        } catch (err: any) {
            alert(err.message || "Error al actualizar el lote");
        }
    };

    const enTransito = lotes.filter((l) => l.estado === "En_Transito").length;
    const completados = lotes.filter((l) => l.estado === "Completado").length;
    const totalPedidosDespachados = lotes.reduce((acc, l) => acc + l.cantidadPedidos, 0);

    const tarjetas = [
        {
            etiqueta: "En cola de almacén",
            valor: `${pendientes.length}`,
            detalle: pendientes.length === 1 ? "pedido" : "pedidos",
            icono: <IconoReloj size={18} />,
            color: pendientes.length > 0 ? "amber" : "emerald",
        },
        {
            etiqueta: "Lotes en tránsito",
            valor: `${enTransito}`,
            detalle: enTransito === 1 ? "lote" : "lotes",
            icono: <IconoCamion size={18} />,
            color: "indigo",
        },
        {
            etiqueta: "Lotes entregados",
            valor: `${completados}`,
            detalle: completados === 1 ? "lote" : "lotes",
            icono: <IconoCheckCirculo size={18} />,
            color: "emerald",
        },
        {
            etiqueta: "Pedidos despachados",
            valor: `${totalPedidosDespachados}`,
            detalle: "acumulado",
            icono: <IconoPaquete size={18} />,
            color: "blue",
        },
    ] as const;

    const clasesColor: Record<string, string> = {
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    };

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
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        {haceCuanto(ultimaActualizacion)}
                    </span>
                    <button
                        onClick={() => void cargar(true)}
                        disabled={actualizando}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                        <IconoActualizar size={14} className={actualizando ? "animate-spin" : ""} />
                        {actualizando ? "Actualizando…" : "Actualizar"}
                    </button>
                    <button
                        onClick={() => navigate("/almacen/despachos")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                    >
                        Ir a bandeja de almacén <IconoFlechaDerecha size={14} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}

            {/* KPI Cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {tarjetas.map((t) => (
                    <div
                        key={t.etiqueta}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${clasesColor[t.color]}`}>
                            {t.icono}
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                                {t.etiqueta}
                            </span>
                            <strong className="block text-xl font-black font-mono text-slate-900 dark:text-white">
                                {t.valor} <span className="text-[11px] font-semibold text-slate-400">{t.detalle}</span>
                            </strong>
                        </div>
                    </div>
                ))}
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
                    <IconoEtiqueta size={13} />
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
                    <IconoLista size={13} />
                    <span>Cola Pendiente de Preparación</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        {pendientes.length}
                    </span>
                </button>
            </div>

            {cargando ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                    <IconoActualizar size={16} className="animate-spin" />
                    Consultando registros logísticos…
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
                                    <td colSpan={9} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                                                <IconoCamion size={22} />
                                            </div>
                                            Aún no se registran despachos consolidados desde Almacén.
                                        </div>
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
                                    <td colSpan={6} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
                                            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center">
                                                <IconoCheckCirculo size={22} />
                                            </div>
                                            Almacén al día: no hay pedidos esperando preparación ni despacho.
                                        </div>
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
                                            {etiquetaTipoEntrega(p.tipoEntrega)}
                                        </td>
                                        <td className="text-xs text-slate-500 font-mono">{formatearFechaHora(p.fecha)}</td>
                                        <td>
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeDeEstado(p.estado)}`}>
                                                {p.estado || "Pendiente"}
                                            </span>
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
                <div className="modal-fondo" onClick={() => setLoteDetalle(null)}>
                    <div className="modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2 className="inline-flex items-center gap-2">
                                <IconoEtiqueta size={18} /> Auditoría: {loteDetalle.codigoLote}
                            </h2>
                            <button className="modal-cerrar" onClick={() => setLoteDetalle(null)} aria-label="Cerrar">
                                <IconoCerrar size={18} />
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
