import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarPedidosPendientesDespacho,
    listarLotesDespacho,
    crearLoteDespacho,
    completarLoteDespacho,
    type DespachoLoteDTO,
} from "../../../services/despachosApi";
import { actualizarEstadoPedido, listarPedidosAdmin } from "../../../services/pedidosApi";
import { etiquetaTipoEntrega, formatearFechaHora, type Pedido } from "../../../data/pedidos";

const EMPRESAS_COURIER = [
    "Olva Courier",
    "Shalom Express",
    "Urbano Express",
    "Motorizado TechStore",
    "Dinet Logística",
];

function badgeDeEstado(estado?: string) {
    const e = (estado || "Pendiente").toLowerCase();
    if (e === "pendiente") return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
    if (e === "procesando") return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
    if (e === "listo para recojo") return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300";
    if (e === "enviado") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300";
    if (e === "entregado") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
    return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300";
}

function Despachos() {
    const { token } = useAuth();
    const [tab, setTab] = useState<"pendientes" | "lotes">("pendientes");
    const [filtroModalidad, setFiltroModalidad] = useState<string>("todas");
    const [pedidosActivos, setPedidosActivos] = useState<Pedido[]>([]);
    const [lotes, setLotes] = useState<DespachoLoteDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [actualizandoNumero, setActualizandoNumero] = useState<string | null>(null);

    // Selección múltiple para armar lote courier (solo envíos, no recojo en tienda)
    const [seleccionados, setSeleccionados] = useState<string[]>([]);

    // Modal de Consolidación de Lote
    const [modalLoteAbierto, setModalLoteAbierto] = useState(false);
    const [guardandoLote, setGuardandoLote] = useState(false);
    const [empresaTransporte, setEmpresaTransporte] = useState(EMPRESAS_COURIER[0]);
    const [numeroGuiaRemision, setNumeroGuiaRemision] = useState("");
    const [conductor, setConductor] = useState("");
    const [placaVehiculo, setPlacaVehiculo] = useState("");
    const [observaciones, setObservaciones] = useState("");

    // Modales de Detalle
    const [pedidoPicking, setPedidoPicking] = useState<Pedido | null>(null);
    const [loteDetalle, setLoteDetalle] = useState<DespachoLoteDTO | null>(null);

    const cargar = async () => {
        if (!token) return;
        setCargando(true);
        try {
            const [todosPedidos, pendientesData, lData] = await Promise.all([
                listarPedidosAdmin(token).catch(() => []),
                listarPedidosPendientesDespacho(token).catch(() => []),
                listarLotesDespacho(token).catch(() => []),
            ]);
            // Incluir TODOS los pedidos activos (Delivery Propio, Agencia y Recojo en Tienda)
            const fuente = todosPedidos.length > 0 ? todosPedidos : pendientesData;
            const activos = fuente.filter(
                (p) => p.estado !== "Entregado" && p.estado !== "Cancelado"
            );
            setPedidosActivos(activos);
            setLotes(lData);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [token]);

    const cambiarEstadoRapido = async (pedido: Pedido, nuevoEstado: string) => {
        if (!token) return;
        setActualizandoNumero(pedido.numero);
        try {
            const actualizado = await actualizarEstadoPedido(token, pedido.numero, nuevoEstado);
            if (nuevoEstado === "Entregado" || nuevoEstado === "Cancelado") {
                setPedidosActivos((prev) => prev.filter((p) => p.numero !== pedido.numero));
                setSeleccionados((prev) => prev.filter((n) => n !== pedido.numero));
            } else {
                setPedidosActivos((prev) => prev.map((p) => (p.numero === pedido.numero ? actualizado : p)));
            }
            if (pedidoPicking?.numero === pedido.numero) {
                setPedidoPicking(actualizado);
            }
        } catch (err: any) {
            alert(err.message || "Error al actualizar el estado");
        } finally {
            setActualizandoNumero(null);
        }
    };

    const toggleSeleccion = (numero: string) => {
        setSeleccionados((prev) =>
            prev.includes(numero) ? prev.filter((n) => n !== numero) : [...prev, numero]
        );
    };

    const pedidosFiltrados = pedidosActivos.filter((p) => {
        if (filtroModalidad === "todas") return true;
        if (filtroModalidad === "delivery_propio") return p.tipoEntrega === "delivery_propio" || p.tipoEntrega === "envio";
        return p.tipoEntrega === filtroModalidad;
    });

    const elegiblesLote = pedidosFiltrados.filter((p) => !p.codigoLoteDespacho && p.tipoEntrega !== "recojo");

    const toggleTodos = () => {
        if (seleccionados.length === elegiblesLote.length && elegiblesLote.length > 0) {
            setSeleccionados([]);
        } else {
            setSeleccionados(elegiblesLote.map((p) => p.numero));
        }
    };

    const handleDespacharLote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || seleccionados.length === 0) return;
        setGuardandoLote(true);
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
            await cargar();
            setSeleccionados([]);
            setModalLoteAbierto(false);
            setNumeroGuiaRemision("");
            setConductor("");
            setPlacaVehiculo("");
            setObservaciones("");
            alert(`Lote ${nuevo.codigoLote} despachado con ${nuevo.cantidadPedidos} pedidos a ${nuevo.empresaTransporte}.`);
            setTab("lotes");
        } catch (err: any) {
            alert(err.message || "Error al generar el lote de despacho");
        } finally {
            setGuardandoLote(false);
        }
    };

    const handleCompletarLote = async (lote: DespachoLoteDTO) => {
        if (!token) return;
        if (!window.confirm(`¿Confirmar que el lote ${lote.codigoLote} fue entregado en su totalidad?`)) return;
        try {
            const actualizado = await completarLoteDespacho(token, lote.id);
            setLotes((prev) => prev.map((l) => (l.id === lote.id ? actualizado : l)));
            await cargar();
        } catch (err: any) {
            alert(err.message || "Error al completar el lote");
        }
    };

    const valorSeleccionado = pedidosActivos
        .filter((p) => seleccionados.includes(p.numero))
        .reduce((acc, p) => acc + Number(p.total || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Despachos y Preparación</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Prepara pedidos de tienda y envío, registra horas exactas y agrupa entregas para el courier.
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
                            onClick={() => setModalLoteAbierto(true)}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <span>📦</span> Enviar Juntos en Lote ({seleccionados.length})
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
                    <span>Pedidos por Atender (Tienda y Envío)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        {pedidosActivos.length}
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
                    Cargando pedidos en almacén...
                </div>
            ) : tab === "pendientes" ? (
                <div className="space-y-3">
                    {/* Filtro rápido por modalidad */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: "todas", label: "Todos" },
                            { id: "delivery_propio", label: "🛵 Delivery Propio" },
                            { id: "agencia_destino", label: "📦 Agencia (Olva / Shalom)" },
                            { id: "recojo", label: "🏪 Recojo en Tienda" },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => {
                                    setFiltroModalidad(f.id);
                                    setSeleccionados([]);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    filtroModalidad === f.id
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {pedidosFiltrados.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">
                            ¡Todo al día! No hay pedidos pendientes en esta modalidad.
                        </div>
                    ) : (
                        <div className="tabla-wrap">
                            <table className="tabla">
                                <thead>
                                    <tr>
                                        <th className="w-10">
                                            <input
                                                type="checkbox"
                                                checked={elegiblesLote.length > 0 && seleccionados.length === elegiblesLote.length}
                                                onChange={toggleTodos}
                                                className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                                                title="Seleccionar todos los envíos elegibles para lote"
                                            />
                                        </th>
                                        <th>N° Pedido &amp; Fechas</th>
                                        <th>Cliente</th>
                                        <th>Modalidad / Ítems</th>
                                        <th>Estado Actual</th>
                                        <th>Opciones de Flujo (Almacén)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidosFiltrados.map((p) => {
                                        const isSelected = seleccionados.includes(p.numero);
                                        const esRecojo = p.tipoEntrega === "recojo";
                                        const yaEnLote = Boolean(p.codigoLoteDespacho);
                                        const estadoActual = p.estado || "Pendiente";
                                        const procesandoAccion = actualizandoNumero === p.numero;
                                        const totalUnidades = (p.items || []).reduce((acc, it) => acc + it.cantidad, 0);

                                        return (
                                            <tr
                                                key={p.numero}
                                                className={`transition-colors ${
                                                    isSelected ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                                                }`}
                                            >
                                                <td>
                                                    {esRecojo ? (
                                                        <span className="text-xs" title="Recojo en tienda (se alista en mostrador)">🏪</span>
                                                    ) : !yaEnLote ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSeleccion(p.numero)}
                                                            className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-mono text-emerald-600 font-bold" title={`Lote ${p.codigoLoteDespacho}`}>
                                                            📦
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {p.numero}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">
                                                        Compra: {formatearFechaHora(p.fecha)}
                                                    </div>
                                                    {p.fechaProcesando && (
                                                        <div className="text-[10px] text-blue-600 dark:text-blue-400">
                                                            Prep.: {formatearFechaHora(p.fechaProcesando)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="font-semibold text-xs">
                                                    {p.cliente || p.comprobante?.nombreRazonSocial || "Cliente"}
                                                </td>
                                                <td className="text-xs">
                                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {etiquetaTipoEntrega(p.tipoEntrega)}
                                                    </div>
                                                    {p.tipoEntrega === "agencia_destino" && (
                                                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                            Flete por pagar al recibir
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => setPedidoPicking(p)}
                                                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mt-0.5"
                                                    >
                                                        Ver {totalUnidades} {totalUnidades === 1 ? "producto" : "productos"} y horas →
                                                    </button>
                                                </td>
                                                <td>
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeDeEstado(estadoActual)}`}>
                                                        {estadoActual}
                                                    </span>
                                                    {p.codigoLoteDespacho && (
                                                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                                            {p.codigoLoteDespacho} ({p.empresaTransporte})
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {estadoActual === "Pendiente" && (
                                                            <button
                                                                disabled={procesandoAccion}
                                                                onClick={() => cambiarEstadoRapido(p, "Procesando")}
                                                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                                            >
                                                                ▶ Empezar preparación
                                                            </button>
                                                        )}

                                                        {estadoActual === "Procesando" && esRecojo && (
                                                            <button
                                                                disabled={procesandoAccion}
                                                                onClick={() => cambiarEstadoRapido(p, "Listo para recojo")}
                                                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                                            >
                                                                ✅ Listo para recojo
                                                            </button>
                                                        )}

                                                        {estadoActual === "Procesando" && !esRecojo && (
                                                            <button
                                                                disabled={procesandoAccion}
                                                                onClick={() => {
                                                                    if (!isSelected) toggleSeleccion(p.numero);
                                                                    setModalLoteAbierto(true);
                                                                }}
                                                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                                            >
                                                                🚚 Despachar a Courier
                                                            </button>
                                                        )}

                                                        {(estadoActual === "Enviado" || estadoActual === "Listo para recojo") && (
                                                            <button
                                                                disabled={procesandoAccion}
                                                                onClick={() => cambiarEstadoRapido(p, "Entregado")}
                                                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                                                            >
                                                                ✔ Marcar Entregado
                                                            </button>
                                                        )}

                                                        <button
                                                            disabled={procesandoAccion}
                                                            onClick={() => {
                                                                if (window.confirm(`¿Cancelar el pedido ${p.numero}?`)) {
                                                                    cambiarEstadoRapido(p, "Cancelado");
                                                                }
                                                            }}
                                                            className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-50"
                                                            title="Cancelar pedido"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
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
                                <th>Fecha / Hora Salida</th>
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
            {modalLoteAbierto && (
                <div className="modal-fondo">
                    <div className="modal-mediano max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>📦 Generar Lote de Despacho</h2>
                            <button className="modal-cerrar" onClick={() => setModalLoteAbierto(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs flex justify-between items-center">
                            <div>
                                <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                                    {seleccionados.length} {seleccionados.length === 1 ? "pedido seleccionado" : "pedidos agrupados"}
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
                                    placeholder="Notas adicionales para el seguimiento administrativo..."
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalLoteAbierto(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardandoLote}
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {guardandoLote ? "Registrando Despacho..." : "Confirmar y Despachar Lote"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Lista de Empaque & Registro de Fechas con Hora */}
            {pedidoPicking && (
                <div className="modal-fondo">
                    <div className="modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>Lista de Empaque: {pedidoPicking.numero}</h2>
                            <button className="modal-cerrar" onClick={() => setPedidoPicking(null)}>
                                ✕
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 mb-3 space-y-1">
                            <div>Cliente: <strong className="text-slate-800 dark:text-slate-200">{pedidoPicking.cliente}</strong></div>
                            <div>Entrega: <strong className="text-slate-800 dark:text-slate-200">{etiquetaTipoEntrega(pedidoPicking.tipoEntrega)}</strong></div>
                        </div>

                        {/* Trazabilidad de Fechas con Hora */}
                        <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                                <span className="text-slate-400 block">Fecha Compra:</span>
                                <strong className="font-mono">{formatearFechaHora(pedidoPicking.fecha)}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Inicio Preparación:</span>
                                <strong className="font-mono">{formatearFechaHora(pedidoPicking.fechaProcesando)}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block">{pedidoPicking.tipoEntrega === "recojo" ? "Listo Recojo:" : "Fecha Envío:"}</span>
                                <strong className="font-mono">{formatearFechaHora(pedidoPicking.fechaEnvio)}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Entrega Final:</span>
                                <strong className="font-mono">{formatearFechaHora(pedidoPicking.fechaEntrega)}</strong>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-slate-800 mb-4">
                            {(pedidoPicking.items || []).map((it) => (
                                <div key={it.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{it.nombre}</span>
                                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                        {it.cantidad} ud(s).
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                            {pedidoPicking.estado === "Pendiente" && (
                                <button
                                    onClick={() => cambiarEstadoRapido(pedidoPicking, "Procesando")}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                >
                                    ▶ Empezar preparación
                                </button>
                            )}
                            <button
                                onClick={() => setPedidoPicking(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
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
