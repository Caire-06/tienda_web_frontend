
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../context/AuthContext";
import {
    etiquetaMetodoPago,
    etiquetaTipoEntrega,
    formatearFechaHora,
    obtenerSerieComprobante,
} from "../../data/pedidos";
import type { Pedido } from "../../data/pedidos";
import { listarMisCompras } from "../../services/pedidosApi";
import { descargarComprobantePdf } from "../../services/comprobantePdf";
import {
    IconoActualizar,
    IconoAlerta,
    IconoCalendario,
    IconoCamion,
    IconoCarrito,
    IconoCerrar,
    IconoCheckCirculo,
    IconoDocumento,
    IconoEtiqueta,
    IconoLista,
    IconoPaquete,
    IconoReloj,
    IconoTarjeta,
    IconoTienda,
    IconoUbicacion,
} from "../../components/Iconos/Iconos";

const INTERVALO_ACTUALIZACION_MS = 15_000;

function badgeDeEstado(estado?: string) {
    const e = (estado || "Pendiente").toLowerCase();
    if (e === "pendiente de pago") return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50";
    if (e === "pendiente") return "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50";
    if (e === "procesando") return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50";
    if (e === "listo para recojo") return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50";
    if (e === "enviado") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50";
    if (e === "entregado") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50";
    return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50";
}

function badgeDePago(estadoPago?: string) {
    const e = (estadoPago || "").toLowerCase();
    if (e === "pagado") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
    if (e === "por verificar") return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";
    if (e === "rechazado") return "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
}

function iconoDeEstado(estado?: string) {
    const e = (estado || "Pendiente").toLowerCase();
    if (e === "pendiente de pago") return <IconoReloj size={20} />;
    if (e === "pendiente") return <IconoPaquete size={20} />;
    if (e === "procesando") return <IconoLista size={20} />;
    if (e === "enviado") return <IconoCamion size={20} />;
    if (e === "listo para recojo") return <IconoTienda size={20} />;
    if (e === "entregado") return <IconoCheckCirculo size={20} />;
    return <IconoCerrar size={20} />;
}

function colorDeIconoEstado(estado?: string) {
    const e = (estado || "Pendiente").toLowerCase();
    if (e === "pendiente de pago" || e === "pendiente") return "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400";
    if (e === "procesando") return "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400";
    if (e === "enviado") return "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400";
    if (e === "listo para recojo") return "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400";
    if (e === "entregado") return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400";
    return "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400";
}

const FILTROS = [
    "Todos",
    "Pendiente de pago",
    "Pendiente",
    "Procesando",
    "Enviado",
    "Entregado",
];

function MisCompras() {
    const navigate = useNavigate();
    const { usuario, token } = useAuth();

    const [detalleNumero, setDetalleNumero] = useState<string | null>(null);
    const [pedidosBackend, setPedidosBackend] = useState<Pedido[]>([]);
    const [cargando, setCargando] = useState(false);
    const [actualizando, setActualizando] = useState(false);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);
    const [filtroEstado, setFiltroEstado] = useState("Todos");

    // Evita que se ejecuten varias consultas simultáneamente.
    const solicitudEnCurso = useRef(false);

    // Consulta los pedidos del cliente desde el backend.
    const cargarPedidos = useCallback(
        async (silencioso = false) => {
            if (!usuario || !token || solicitudEnCurso.current) return;

            solicitudEnCurso.current = true;

            if (silencioso) {
                setActualizando(true);
            } else {
                setCargando(true);
            }

            try {
                const lista = await listarMisCompras(token);
                setPedidosBackend(lista);
                setErrorCarga(null);
            } catch {
                setErrorCarga(
                    "No se pudo actualizar tu historial en este momento. Reintentaremos automáticamente."
                );
            } finally {
                solicitudEnCurso.current = false;
                setCargando(false);
                setActualizando(false);
            }
        },
        [usuario, token]
    );

    // Carga inicial y actualización automática cada 15 segundos.
    useEffect(() => {
        if (!usuario || !token) {
            setPedidosBackend([]);
            return;
        }

        void cargarPedidos();

        const intervalo = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void cargarPedidos(true);
            }
        }, INTERVALO_ACTUALIZACION_MS);

        // Actualiza cuando el usuario vuelve a la ventana.
        const alEnfocar = () => {
            void cargarPedidos(true);
        };

        // Actualiza cuando el usuario vuelve a la pestaña.
        const alCambiarVisibilidad = () => {
            if (document.visibilityState === "visible") {
                void cargarPedidos(true);
            }
        };

        window.addEventListener("focus", alEnfocar);
        document.addEventListener("visibilitychange", alCambiarVisibilidad);

        return () => {
            window.clearInterval(intervalo);
            window.removeEventListener("focus", alEnfocar);
            document.removeEventListener("visibilitychange", alCambiarVisibilidad);
        };
    }, [usuario, token, cargarPedidos]);

    if (!usuario) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
                <Header />
                <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <IconoCarrito size={28} />
                    </div>
                    <h1 className="text-2xl font-black">Mis compras</h1>
                    <p className="text-sm text-slate-500">
                        Inicia sesión para ver tu historial de compras.
                    </p>
                    <button
                        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
                        onClick={() => navigate("/login")}
                    >
                        Ir al login
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    // El detalle se obtiene de la lista más reciente de pedidos.
    const detalle = detalleNumero
        ? pedidosBackend.find((p) => p.numero === detalleNumero) ?? null
        : null;

    const abrirDetalle = (pedido: Pedido) => {
        setDetalleNumero(pedido.numero);
        void cargarPedidos(true);
    };

    const pedidos = pedidosBackend.filter((p) => {
        if (filtroEstado === "Todos") return true;
        return (p.estado || "Pendiente") === filtroEstado;
    });

    const contar = (estado: string) =>
        pedidosBackend.filter((p) => (p.estado || "Pendiente") === estado).length;

    const enCamino = contar("Enviado") + contar("Listo para recojo");
    const entregados = contar("Entregado");

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
                {/* Encabezado y botón de actualización manual */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black">Historial de Compras</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {pedidosBackend.length === 0
                                ? "Aquí aparecerá el historial de tus pedidos y facturas electrónicas"
                                : `${pedidosBackend.length} pedido${pedidosBackend.length !== 1 ? "s" : ""} registrado${pedidosBackend.length !== 1 ? "s" : ""}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void cargarPedidos(true)}
                            disabled={actualizando || cargando}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                            title="Actualizar historial"
                        >
                            <IconoActualizar
                                size={14}
                                className={actualizando || cargando ? "animate-spin" : ""}
                            />
                            Actualizar
                        </button>
                    </div>
                </div>

                {errorCarga && (
                    <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200">
                        <IconoAlerta size={16} className="shrink-0 mt-0.5" />
                        <span>{errorCarga}</span>
                    </div>
                )}

                {pedidosBackend.length > 0 && (
                    <>
                        {/* Resumen rápido */}
                        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                    <IconoPaquete size={14} /> Total
                                </div>
                                <strong className="block mt-1 text-2xl font-black font-mono">
                                    {pedidosBackend.length}
                                </strong>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                                    <IconoLista size={14} /> En proceso
                                </div>
                                <strong className="block mt-1 text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                                    {contar("Pendiente") + contar("Procesando")}
                                </strong>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-bold uppercase tracking-wider">
                                    <IconoCamion size={14} /> En camino
                                </div>
                                <strong className="block mt-1 text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                                    {enCamino}
                                </strong>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                    <IconoCheckCirculo size={14} /> Entregados
                                </div>
                                <strong className="block mt-1 text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                                    {entregados}
                                </strong>
                            </div>
                        </section>

                        {/* Filtros por estado */}
                        <div className="flex flex-wrap gap-2">
                            {FILTROS.map((f) => {
                                const activo = filtroEstado === f;
                                const cantidad =
                                    f === "Todos" ? pedidosBackend.length : contar(f);

                                return (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => setFiltroEstado(f)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                            activo
                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                        }`}
                                    >
                                        {f}{" "}
                                        <span
                                            className={`ml-1 ${
                                                activo ? "text-blue-100" : "text-slate-400"
                                            }`}
                                        >
                                            ({cantidad})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {cargando && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                        <IconoActualizar size={16} className="animate-spin" />
                        Cargando tu historial…
                    </div>
                )}

                {pedidosBackend.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                            <IconoCarrito size={28} />
                        </div>
                        <h3 className="text-lg font-bold">Sin compras todavía</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                            Cuando finalices una compra en el carrito, aparecerá registrada con su estado aquí.
                        </p>
                        <button
                            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
                            onClick={() => navigate("/productos")}
                        >
                            Explorar catálogo
                        </button>
                    </div>
                ) : pedidos.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                            <IconoPaquete size={22} />
                        </div>
                        <p className="text-sm text-slate-500">
                            No tienes pedidos en estado “{filtroEstado}”.
                        </p>
                        <button
                            type="button"
                            onClick={() => setFiltroEstado("Todos")}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                            Ver todos los pedidos
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {pedidos.map((p) => {
                            const estado = p.estado || "Pendiente";
                            const totalUnidades = (p.items || []).reduce(
                                (acc, it) => acc + it.cantidad,
                                0
                            );

                            return (
                                <article
                                    key={p.numero}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div
                                                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorDeIconoEstado(estado)}`}
                                            >
                                                {iconoDeEstado(estado)}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                                        {p.numero}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeDeEstado(estado)}`}
                                                    >
                                                        {estado}
                                                    </span>
                                                    {p.estadoPago && (
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeDePago(p.estadoPago)}`}
                                                        >
                                                            Pago: {p.estadoPago}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500">
                                                    <span className="inline-flex items-center gap-1">
                                                        <IconoCalendario size={12} />{" "}
                                                        {formatearFechaHora(p.fecha)}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1">
                                                        {p.tipoEntrega === "recojo" ? (
                                                            <IconoTienda size={12} />
                                                        ) : p.tipoEntrega === "agencia_destino" ? (
                                                            <IconoPaquete size={12} />
                                                        ) : (
                                                            <IconoCamion size={12} />
                                                        )}
                                                        {etiquetaTipoEntrega(p.tipoEntrega)}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1">
                                                        <IconoLista size={12} /> {totalUnidades}{" "}
                                                        {totalUnidades === 1 ? "producto" : "productos"}
                                                    </span>

                                                    {p.codigoLoteDespacho && (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            <IconoEtiqueta size={12} />{" "}
                                                            {p.empresaTransporte || "Courier"} · {p.codigoLoteDespacho}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-3 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                                            <div className="sm:text-right">
                                                <span className="block text-[10px] uppercase font-bold text-slate-400">
                                                    Total
                                                </span>
                                                <strong className="font-mono text-lg font-black text-slate-900 dark:text-white">
                                                    S/{" "}
                                                    {p.total.toLocaleString("es-PE", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </strong>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                                                    onClick={() => abrirDetalle(p)}
                                                >
                                                    Ver detalle
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => void descargarComprobantePdf(p)}
                                                    title={`Descargar ${obtenerSerieComprobante(p).serie}.pdf`}
                                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                                >
                                                    <IconoDocumento size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Modal con el detalle de la compra */}
                {detalle && (
                    <div
                        className="modal-fondo"
                        onClick={() => setDetalleNumero(null)}
                    >
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-head">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2>Detalle de Compra</h2>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeDeEstado(detalle.estado)}`}
                                        >
                                            {detalle.estado || "Pendiente"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {detalle.numero} · {formatearFechaHora(detalle.fecha)}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-cerrar"
                                    onClick={() => setDetalleNumero(null)}
                                    aria-label="Cerrar detalle"
                                >
                                    <IconoCerrar size={18} />
                                </button>
                            </div>

                            {/* Seguimiento visual del pedido */}
                            <div className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Seguimiento del pedido
                                    </h3>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {detalle.codigoLoteDespacho
                                            ? `Lote ${detalle.codigoLoteDespacho}`
                                            : etiquetaTipoEntrega(detalle.tipoEntrega)}
                                    </span>
                                </div>

                                {(() => {
                                    const esRecojo = detalle.tipoEntrega === "recojo";
                                    const cancelado =
                                        (detalle.estado || "").toLowerCase() === "cancelado";

                                    const pasos = [
                                        {
                                            titulo: "Compra registrada",
                                            descripcion: "Pedido recibido en el sistema",
                                            fecha: detalle.fecha,
                                            hecho: true,
                                            icono: <IconoCarrito size={15} />,
                                        },
                                        {
                                            titulo: "En preparación",
                                            descripcion: "Almacén alista tus productos",
                                            fecha: detalle.fechaProcesando,
                                            hecho: Boolean(detalle.fechaProcesando),
                                            icono: <IconoLista size={15} />,
                                        },
                                        {
                                            titulo: esRecojo ? "Listo para recojo" : "En camino",
                                            descripcion: esRecojo
                                                ? "Puedes recogerlo en tienda"
                                                : "Entregado al courier",
                                            fecha: detalle.fechaEnvio,
                                            hecho: Boolean(detalle.fechaEnvio),
                                            icono: esRecojo
                                                ? <IconoTienda size={15} />
                                                : <IconoCamion size={15} />,
                                        },
                                        {
                                            titulo: "Entregado",
                                            descripcion: esRecojo
                                                ? "Recogido por el cliente"
                                                : "Recibido por el cliente",
                                            fecha: detalle.fechaEntrega,
                                            hecho: Boolean(detalle.fechaEntrega),
                                            icono: <IconoCheckCirculo size={15} />,
                                        },
                                    ];

                                    const indiceActual = pasos.reduce(
                                        (ultimo, paso, i) => paso.hecho ? i : ultimo,
                                        0
                                    );

                                    return (
                                        <ol className="space-y-1">
                                            {pasos.map((paso, i) => {
                                                const esActual = i === indiceActual && !cancelado;

                                                return (
                                                    <li key={paso.titulo} className="flex gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <span
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                                                    paso.hecho
                                                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
                                                                }`}
                                                            >
                                                                {paso.icono}
                                                            </span>

                                                            {i < pasos.length - 1 && (
                                                                <span
                                                                    className={`w-0.5 flex-1 my-1 ${
                                                                        paso.hecho
                                                                            ? "bg-emerald-500/50"
                                                                            : "bg-slate-200 dark:bg-slate-700"
                                                                    }`}
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="pb-2.5 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span
                                                                    className={`text-xs font-bold ${
                                                                        paso.hecho
                                                                            ? "text-slate-900 dark:text-white"
                                                                            : "text-slate-400"
                                                                    }`}
                                                                >
                                                                    {paso.titulo}
                                                                </span>

                                                                {esActual && paso.hecho && (
                                                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase tracking-wide">
                                                                        Estado actual
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className="text-[11px] text-slate-500">
                                                                {paso.descripcion}
                                                            </p>
                                                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                                {paso.hecho
                                                                    ? formatearFechaHora(paso.fecha)
                                                                    : "Pendiente"}
                                                            </p>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    );
                                })()}

                                {detalle.estado === "Cancelado" && (
                                    <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                        <IconoAlerta size={14} /> Este pedido fue cancelado.
                                    </div>
                                )}
                            </div>

                            {/* Pago, comprobante y entrega */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <IconoTarjeta size={13} /> Pago
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeDePago(detalle.estadoPago)}`}
                                        >
                                            {detalle.estadoPago || "Sin estado"}
                                        </span>

                                        {detalle.metodoPago && (
                                            <span className="text-xs text-slate-600 dark:text-slate-300">
                                                {etiquetaMetodoPago(detalle.metodoPago)}
                                            </span>
                                        )}
                                    </div>

                                    {detalle.codigoOperacionPago && (
                                        <p className="text-[11px] text-slate-500 font-mono">
                                            Operación: {detalle.codigoOperacionPago}
                                        </p>
                                    )}

                                    {detalle.fechaConfirmacionPago && (
                                        <p className="text-[11px] text-slate-500">
                                            Confirmado: {formatearFechaHora(detalle.fechaConfirmacionPago)}
                                        </p>
                                    )}

                                    {detalle.comprobantePagoUrl && (
                                        <a
                                            href={detalle.comprobantePagoUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                        >
                                            <IconoDocumento size={12} /> Ver captura de transferencia
                                        </a>
                                    )}
                                </div>

                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {detalle.tipoEntrega === "recojo"
                                            ? <IconoTienda size={13} />
                                            : <IconoUbicacion size={13} />}{" "}
                                        Entrega
                                    </div>

                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        {etiquetaTipoEntrega(detalle.tipoEntrega)}
                                    </p>

                                    {detalle.comprobante?.nombreRazonSocial && (
                                        <p className="text-[11px] text-slate-500">
                                            {detalle.comprobante.nombreRazonSocial}
                                        </p>
                                    )}

                                    {detalle.codigoLoteDespacho && (
                                        <p className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                            <IconoEtiqueta size={12} />{" "}
                                            {detalle.empresaTransporte} · Lote {detalle.codigoLoteDespacho}
                                        </p>
                                    )}

                                    {detalle.tipoEntrega === "agencia_destino" && (
                                        <p className="inline-flex items-start gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            <IconoAlerta size={12} className="shrink-0 mt-0.5" /> Flete por pagar en destino al recibir o recoger en agencia.
                                        </p>
                                    )}

                                    {detalle.comprobante && (
                                        <p className="text-[11px] text-slate-500">
                                            {detalle.comprobante.tipo} electrónica ({detalle.comprobante.documento})
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Productos */}
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
                                                    S/ {it.precio.toLocaleString("es-PE", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="font-mono font-bold text-xs">
                                                    S/ {(it.precio * it.cantidad).toLocaleString("es-PE", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totales */}
                            <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal productos</span>
                                    <span className="font-mono">
                                        S/ {(detalle.total - (detalle.costoEnvio || 0)).toLocaleString("es-PE", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>

                                <div className="flex justify-between text-slate-500">
                                    <span>Costo de envío</span>
                                    <span className="font-mono">
                                        {(detalle.costoEnvio || 0) === 0
                                            ? "Gratis"
                                            : `S/ ${Number(detalle.costoEnvio).toLocaleString("es-PE", {
                                                minimumFractionDigits: 2,
                                            })}`}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700">
                                    <span className="text-sm font-bold uppercase text-slate-500">
                                        Total pagado
                                    </span>
                                    <strong className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                                        S/ {detalle.total.toLocaleString("es-PE", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </strong>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-end items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => void descargarComprobantePdf(detalle)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                                >
                                    <IconoDocumento size={14} />
                                    Descargar {obtenerSerieComprobante(detalle).serie} (PDF)
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDetalleNumero(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default MisCompras;
