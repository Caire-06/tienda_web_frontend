import { useEffect, useState } from "react";
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

function MisCompras() {
    const navigate = useNavigate();
    const { usuario, token } = useAuth();

    // Pedido seleccionado para ver su detalle en el modal
    const [detalle, setDetalle] = useState<Pedido | null>(null);

    // Historial real guardado en PostgreSQL (vía GET /api/pedidos/mis-compras)
    const [pedidosBackend, setPedidosBackend] = useState<Pedido[]>([]);
    const [cargando, setCargando] = useState(false);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);

    useEffect(() => {
        if (!usuario || !token) {
            setPedidosBackend([]);
            return;
        }
        let activo = true;
        setCargando(true);
        setErrorCarga(null);
        listarMisCompras(token)
            .then((lista) => { if (activo) setPedidosBackend(lista); })
            .catch(() => { if (activo) setErrorCarga("No se pudo cargar tu historial desde el servidor."); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [usuario, token]);

    if (!usuario) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
                <Header />
                <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <h1 className="text-2xl font-black">Mis compras</h1>
                    <p className="text-sm text-slate-500">Inicia sesión para ver tu historial de compras.</p>
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

    // Historial definitivo desde PostgreSQL (vía GET /api/pedidos/mis-compras).
    // No se mezclan pedidos locales: la fuente definitiva es el backend.
    const pedidos = pedidosBackend;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-black">Historial de Compras</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {pedidos.length === 0
                            ? "Aquí aparecerá el historial de tus pedidos y facturas electrónicas"
                            : `${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""} registrado${pedidos.length !== 1 ? "s" : ""}`}
                    </p>
                </div>

                {cargando && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Cargando tu historial…</p>
                )}
                {errorCarga && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200">
                        {errorCarga}
                    </div>
                )}

                {pedidos.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-2xl text-slate-400">
                            🛒
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
                ) : (
                    <div className="tabla-wrap">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>N° Pedido</th>
                                    <th>Fecha</th>
                                    <th>Estado / Entrega</th>
                                    <th>Total</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.map((p) => (
                                    <tr key={p.numero}>
                                        <td className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{p.numero}</td>
                                        <td className="text-xs text-slate-500 font-mono">{formatearFechaHora(p.fecha)}</td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className={`font-semibold text-xs ${
                                                    p.estado === "Pendiente de pago"
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : "text-slate-800 dark:text-slate-200"
                                                }`}>{p.estado || "Pendiente"}</span>
                                                <span className="text-[10px] text-slate-400">
                                                    {p.codigoLoteDespacho
                                                        ? `Vía ${p.empresaTransporte || "Courier"} (${p.codigoLoteDespacho})`
                                                        : etiquetaTipoEntrega(p.tipoEntrega)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="font-mono font-bold text-slate-900 dark:text-white">
                                            S/ {p.total.toLocaleString("es-PE")}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button className="btn-mini" onClick={() => setDetalle(p)}>
                                                    Ver detalle
                                                </button>
                                                {p.estado === "Pendiente de pago" || p.estadoPago === "Por verificar" ? (
                                                    <span
                                                        title="El comprobante oficial se emitirá cuando el administrador valide tu depósito bancario."
                                                        className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-[11px] font-semibold cursor-help"
                                                    >
                                                        ⏳ En verificación
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => void descargarComprobantePdf(p)}
                                                        title={`Descargar ${obtenerSerieComprobante(p).serie}.pdf`}
                                                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                                                    >
                                                        PDF
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal con el detalle de la compra */}
                {detalle && (
                    <div className="modal-fondo">
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-head">
                                <div>
                                    <h2>Detalle de Compra</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {detalle.numero} · {formatearFechaHora(detalle.fecha)}
                                    </p>
                                </div>
                                <button className="modal-cerrar" onClick={() => setDetalle(null)}>
                                    ✕
                                </button>
                            </div>

                            {/* Cronología de fechas con hora */}
                            <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                <div>
                                    <span className="text-slate-400 block">Compra:</span>
                                    <strong className="font-mono">{formatearFechaHora(detalle.fecha)}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">En Preparación:</span>
                                    <strong className="font-mono">{formatearFechaHora(detalle.fechaProcesando)}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">{detalle.tipoEntrega === "recojo" ? "Listo Recojo:" : "Envío:"}</span>
                                    <strong className="font-mono">{formatearFechaHora(detalle.fechaEnvio)}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Entregado:</span>
                                    <strong className="font-mono">{formatearFechaHora(detalle.fechaEntrega)}</strong>
                                </div>
                            </div>

                            {detalle.comprobante && (
                                <div className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span><strong>Estado:</strong> <span className="text-blue-600 dark:text-blue-400 font-bold">{detalle.estado || "Pendiente"}</span></span>
                                        <span><strong>Entrega:</strong> {etiquetaTipoEntrega(detalle.tipoEntrega)}</span>
                                    </div>
                                    <hr className="border-slate-200 dark:border-slate-700 my-1" />
                                    <div><strong>Comprobante:</strong> {detalle.comprobante.tipo} Electrónica ({detalle.comprobante.documento})</div>
                                    <div><strong>Titular:</strong> {detalle.comprobante.nombreRazonSocial}</div>
                                    {detalle.metodoPago && (
                                        <div>
                                            <strong>Método de pago:</strong> {etiquetaMetodoPago(detalle.metodoPago)}
                                            {detalle.estadoPago && ` (${detalle.estadoPago})`}
                                            {detalle.codigoOperacionPago && ` · Op. ${detalle.codigoOperacionPago}`}
                                        </div>
                                    )}
                                    {detalle.comprobantePagoUrl && (
                                        <div>
                                            <a href={detalle.comprobantePagoUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                                Ver captura de transferencia adjunta ↗
                                            </a>
                                        </div>
                                    )}
                                    {detalle.tipoEntrega === "agencia_destino" && (
                                        <div className="text-amber-600 dark:text-amber-400 font-medium">
                                            ℹ️ Flete por pagar en destino al recibir o recoger en agencia.
                                        </div>
                                    )}
                                    {detalle.codigoLoteDespacho && (
                                        <div className="pt-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                            📦 Despachado con {detalle.empresaTransporte} (Lote {detalle.codigoLoteDespacho})
                                        </div>
                                    )}
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
                                                <td className="font-mono text-xs">S/ {it.precio.toLocaleString("es-PE")}</td>
                                                <td className="font-mono font-bold text-xs">S/ {(it.precio * it.cantidad).toLocaleString("es-PE")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                {detalle.estado === "Pendiente de pago" || detalle.estadoPago === "Por verificar" ? (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs max-w-sm">
                                        <span className="text-sm">⏳</span>
                                        <span>Comprobante en verificación: se emitirá y habilitará para descarga una vez confirmado el depósito bancario.</span>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => void descargarComprobantePdf(detalle)}
                                        className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Descargar {obtenerSerieComprobante(detalle).serie} (PDF)
                                    </button>
                                )}
                                <div className="flex items-center gap-3 ml-auto">
                                    <span className="text-sm font-bold uppercase text-slate-500">
                                        {detalle.estado === "Pendiente de pago" || detalle.estadoPago === "Por verificar"
                                            ? "Total a Abonar"
                                            : "Total Pagado"}
                                    </span>
                                    <strong className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                                        S/ {detalle.total.toLocaleString("es-PE")}
                                    </strong>
                                </div>
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
