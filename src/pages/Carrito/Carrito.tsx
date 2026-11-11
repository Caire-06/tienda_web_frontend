import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ProductCard from "../../components/ProductCard/ProductCard";
import { ImagenProducto } from "../../components/ImagenProducto/ImagenProducto";
import { useCarrito } from "../../context/CarritoContext";
import { useInventario } from "../../context/InventarioContext";
import { useAuth } from "../../context/AuthContext";
import { generarNumeroPedido, guardarPedido } from "../../data/pedidos";
import { crearPedidoBackend } from "../../services/pedidosApi";
import type { TipoComprobante, MetodoPago, ComprobanteInfo, EstadoPedido, Pedido } from "../../data/pedidos";
import { consultarDNI, consultarRUC } from "../../services/sunatApi";
import { descargarComprobantePdf } from "../../services/comprobantePdf";
import { apiUrl } from "../../config/api";
import {
    esCorreoValido,
    limpiarCodigoAlfanumerico,
    limpiarSoloLetras,
} from "../../utils/validaciones";

// Envío gratis desde este monto para Delivery Propio en zona; si no, tarifa zonal fija
const UMBRAL_ENVIO_GRATIS = 499;
const COSTO_DELIVERY_PROPIO = 15;

function Carrito() {
    const navigate = useNavigate();
    const { items, cambiarCantidad, quitar, vaciar, subtotal, catalogo } = useCarrito();
    const { registrarSalida } = useInventario();
    const productos = catalogo;
    const { usuario, token } = useAuth();

    // Pedido confirmado (solo frontend): guarda el total y muestra éxito
    const [pedidoOk, setPedidoOk] = useState<string | null>(null);
    const [estadoPedidoEmitido, setEstadoPedidoEmitido] = useState<EstadoPedido>("Pendiente");
    const [totalPagado, setTotalPagado] = useState(0);
    const [comprobanteEmitido, setComprobanteEmitido] = useState<ComprobanteInfo | null>(null);
    const [pedidoEmitido, setPedidoEmitido] = useState<Pedido | null>(null);
    const [generandoPdf, setGenerandoPdf] = useState(false);

    // Modal de pasarela de pagos y comprobante
    const [mostrarCheckout, setMostrarCheckout] = useState(false);
    const [pasoCheckout, setPasoCheckout] = useState<1 | 2 | 3>(1);

    // Datos de Envío y Contacto (Paso 1): 3 modalidades
    const [tipoEntrega, setTipoEntrega] = useState<"delivery_propio" | "agencia_destino" | "recojo">("delivery_propio");
    const [correoContacto, setCorreoContacto] = useState("");
    const [celularContacto, setCelularContacto] = useState("");
    const [direccionEnvio, setDireccionEnvio] = useState("");
    const [referenciaEnvio, setReferenciaEnvio] = useState("");
    const [distritoEnvio, setDistritoEnvio] = useState("San Juan de Lurigancho");

    // Datos del comprobante (SUNAT / RENIEC)
    const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>("Boleta");
    const [documento, setDocumento] = useState("");
    const [nombreRazonSocial, setNombreRazonSocial] = useState("");
    const [direccionFiscal, setDireccionFiscal] = useState("");
    const [estadoSunat, setEstadoSunat] = useState("");
    const [cargandoApi, setCargandoApi] = useState(false);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    // Datos del método de pago
    const [metodoPago, setMetodoPago] = useState<MetodoPago>("tarjeta");
    const [numeroTarjeta, setNumeroTarjeta] = useState("");
    const [nombreTitular, setNombreTitular] = useState("");
    const [vencimiento, setVencimiento] = useState("");
    const [cvv, setCvv] = useState("");
    const [codigoYape, setCodigoYape] = useState("");
    const [codigoSeguridadYape, setCodigoSeguridadYape] = useState("");
    const [numeroOperacionTransf, setNumeroOperacionTransf] = useState("");
    const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
    const [errorPago, setErrorPago] = useState<string | null>(null);
    const [procesandoPago, setProcesandoPago] = useState(false);

    // Precargar datos guardados del perfil cuando el usuario ha iniciado sesión
    useEffect(() => {
        if (!token) return;
        let activo = true;
        fetch(apiUrl("/api/perfil"), { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : null))
            .then((perfil) => {
                if (!activo || !perfil) return;
                if (perfil.correo) setCorreoContacto((prev) => prev || String(perfil.correo));
                if (perfil.telefono) setCelularContacto((prev) => prev || String(perfil.telefono));
                if (perfil.direccion) setDireccionEnvio((prev) => prev || String(perfil.direccion));
                if (perfil.ciudad) setDistritoEnvio((prev) => prev || String(perfil.ciudad));
                const docPerfil = String(perfil.documento || "").trim();
                const nombrePerfil = `${perfil.nombres || ""} ${perfil.apellidos || ""}`.trim();
                if (/^\d{8}$/.test(docPerfil)) {
                    setDocumento((prev) => prev || docPerfil);
                    if (nombrePerfil) {
                        setNombreRazonSocial((prev) => prev || nombrePerfil);
                        setEstadoSunat((prev) => prev || "Datos cargados desde tu perfil");
                    }
                } else if (nombrePerfil && nombrePerfil !== usuario?.acceso) {
                    setNombreRazonSocial((prev) => prev || nombrePerfil);
                }
            })
            .catch(() => {});
        return () => {
            activo = false;
        };
    }, [token, usuario?.acceso]);

    // Une cada item con los datos actuales del inventario
    const lineas = items
        .map((item) => ({ ...item, producto: productos.find((p) => p.id === item.id)! }))
        .filter((l) => l.producto && l.producto.activo);

    const envioGratis = subtotal >= UMBRAL_ENVIO_GRATIS;
    const envio =
        lineas.length === 0 || tipoEntrega !== "delivery_propio" || envioGratis
            ? 0
            : COSTO_DELIVERY_PROPIO;
    const total = subtotal + envio;

    // Cálculo tributario SUNAT (18% IGV incluido sobre el total cobrado)
    const baseImponible = Math.round((total / 1.18) * 100) / 100;
    const igv = Math.round((total - baseImponible) * 100) / 100;

    // Barra de progreso hacia el envío gratis
    const progreso = Math.min(100, Math.round((subtotal / UMBRAL_ENVIO_GRATIS) * 100));
    const faltante = UMBRAL_ENVIO_GRATIS - subtotal;

    // Consulta de API SUNAT / RENIEC
    const handleConsultarDocumento = async () => {
        setErrorApi(null);
        setEstadoSunat("");

        if (!documento.trim()) {
            setErrorApi(`Ingresa el número de ${tipoComprobante === "Boleta" ? "DNI" : "RUC"}`);
            return;
        }

        setCargandoApi(true);
        try {
            if (tipoComprobante === "Boleta") {
                const res = await consultarDNI(documento);
                setNombreRazonSocial(res.nombreCompleto);
                setEstadoSunat("IDENTIFICADO (RENIEC)");
            } else {
                const res = await consultarRUC(documento);
                setNombreRazonSocial(res.razonSocial);
                setDireccionFiscal(res.direccion);
                setEstadoSunat(`${res.estado} - ${res.condicion}`);
            }
        } catch (err: unknown) {
            const error = err as Error;
            setErrorApi(error.message || "Error al consultar el documento");
        } finally {
            setCargandoApi(false);
        }
    };

    // Formateadores de inputs de pago
    const handleTarjetaInput = (val: string) => {
        const limpia = val.replace(/\D/g, "").slice(0, 16);
        const formateada = limpia.match(/.{1,4}/g)?.join(" ") || limpia;
        setNumeroTarjeta(formateada);
    };

    const handleVencimientoInput = (val: string) => {
        const limpia = val.replace(/\D/g, "").slice(0, 4);
        if (limpia.length >= 3) {
            setVencimiento(`${limpia.slice(0, 2)}/${limpia.slice(2)}`);
        } else {
            setVencimiento(limpia);
        }
    };

    // Confirmación y procesamiento del pago
    const ejecutarPago = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorPago(null);

        if (!nombreRazonSocial.trim()) {
            setPasoCheckout(2);
            setErrorApi("Ingresa el nombre o razón social para emitir tu comprobante.");
            return;
        }

        // Validaciones específicas por método de pago
        let codigoOperacionPago: string | undefined;
        if (metodoPago === "tarjeta") {
            const digitosTarjeta = numeroTarjeta.replace(/\D/g, "");
            if (digitosTarjeta.length !== 16) {
                setErrorPago("El número de tarjeta debe tener 16 dígitos.");
                return;
            }
            if (nombreTitular.trim().length < 3) {
                setErrorPago("Ingresa el nombre completo del titular de la tarjeta.");
                return;
            }
            const matchVenc = vencimiento.match(/^(\d{2})\/(\d{2})$/);
            if (!matchVenc) {
                setErrorPago("Ingresa el vencimiento en formato MM/AA.");
                return;
            }
            const mes = Number(matchVenc[1]);
            const anio = 2000 + Number(matchVenc[2]);
            const hoy = new Date();
            if (mes < 1 || mes > 12 || anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1)) {
                setErrorPago("La fecha de vencimiento de la tarjeta no es válida o está vencida.");
                return;
            }
            if (!/^\d{3,4}$/.test(cvv)) {
                setErrorPago("El CVV debe contener 3 o 4 dígitos numéricos.");
                return;
            }
        } else if (metodoPago === "yape") {
            if (!/^\d{6,8}$/.test(codigoYape)) {
                setErrorPago("El código/nro. de operación de Yape o Plin debe tener de 6 a 8 dígitos numéricos.");
                return;
            }
            if (codigoSeguridadYape && !/^\d{3}$/.test(codigoSeguridadYape)) {
                setErrorPago("El código de seguridad de Yape debe tener exactamente 3 dígitos numéricos.");
                return;
            }
            codigoOperacionPago = codigoSeguridadYape
                ? `${codigoYape} · Seg: ${codigoSeguridadYape}`
                : codigoYape;
        } else if (metodoPago === "transferencia") {
            if (numeroOperacionTransf.trim().length < 4) {
                setErrorPago("Ingresa el número de operación bancaria (mínimo 4 caracteres).");
                return;
            }
            codigoOperacionPago = numeroOperacionTransf.trim();
        }

        setProcesandoPago(true);
        try {
            const fecha = new Date().toISOString();
            const infoComprobante: ComprobanteInfo = {
                tipo: tipoComprobante,
                documento: documento || (tipoComprobante === "Boleta" ? "00000000" : "20000000001"),
                nombreRazonSocial: nombreRazonSocial.trim(),
                direccion: tipoComprobante === "Factura" ? direccionFiscal : undefined,
                subtotal: baseImponible,
                igv,
                total,
            };

            const itemsPedido = lineas.map((l) => ({
                id: l.producto.id,
                nombre: l.producto.nombre,
                precio: l.producto.precio,
                cantidad: l.cantidad,
                imagen: l.producto.imagen,
            }));

            let numero = generarNumeroPedido();
            let estadoResultante: EstadoPedido = metodoPago === "transferencia" ? "Pendiente de pago" : "Pendiente";
            let pedidoConfirmado: Pedido;

            if (token) {
                const creado = await crearPedidoBackend(token, {
                    items: itemsPedido,
                    total,
                    metodoPago,
                    comprobante: {
                        tipo: infoComprobante.tipo,
                        documento: infoComprobante.documento,
                        nombreRazonSocial: infoComprobante.nombreRazonSocial,
                        direccion: infoComprobante.direccion ?? null,
                        subtotal: infoComprobante.subtotal,
                        igv: infoComprobante.igv,
                        total: infoComprobante.total,
                    },
                    tipoEntrega,
                    costoEnvio: envio,
                    correoContacto: correoContacto.trim(),
                    celularContacto: celularContacto.trim(),
                    direccionEnvio: direccionEnvio.trim(),
                    referenciaEnvio: referenciaEnvio.trim(),
                    distritoEnvio: distritoEnvio.trim(),
                    codigoOperacionPago,
                });
                numero = creado.numero;
                if (creado.estado) estadoResultante = creado.estado;
                pedidoConfirmado = {
                    ...creado,
                    items: creado.items.length > 0 ? creado.items : itemsPedido,
                    costoEnvio: creado.costoEnvio ?? envio,
                    metodoPago: creado.metodoPago ?? metodoPago,
                    estadoPago: creado.estadoPago ?? (metodoPago === "transferencia" ? "Por verificar" : "Pagado"),
                    codigoOperacionPago: creado.codigoOperacionPago ?? codigoOperacionPago,
                    comprobante: creado.comprobante ?? infoComprobante,
                };
            } else {
                pedidoConfirmado = {
                    numero,
                    fecha,
                    usuarioId: "invitado",
                    cliente: infoComprobante.nombreRazonSocial,
                    items: itemsPedido,
                    total,
                    costoEnvio: envio,
                    metodoPago,
                    estadoPago: metodoPago === "transferencia" ? "Por verificar" : "Pagado",
                    codigoOperacionPago,
                    comprobante: infoComprobante,
                    tipoEntrega,
                    estado: estadoResultante,
                };
                guardarPedido(pedidoConfirmado);
            }

            lineas.forEach((l) =>
                registrarSalida(
                    l.producto.id,
                    l.cantidad,
                    `Venta ${numero} (${tipoComprobante})`,
                    usuario?.nombre ?? nombreRazonSocial
                )
            );

            setPedidoEmitido(pedidoConfirmado);
            setComprobanteEmitido(infoComprobante);
            setEstadoPedidoEmitido(estadoResultante);
            setTotalPagado(total);
            setPedidoOk(numero);
            setMostrarCheckout(false);
            vaciar();
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "No se pudo completar el registro del pedido.";
            setErrorPago(msg);
        } finally {
            setProcesandoPago(false);
        }
    };

    // Productos sugeridos: los más vendidos que no estén en el carrito
    const sugeridos = productos
        .filter((p) => p.activo && p.stock > 0 && !items.some((i) => i.id === p.id))
        .sort((a, b) => b.vendidos - a.vendidos)
        .slice(0, 4);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Tu carrito
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {lineas.length === 0
                            ? "Aún no agregaste productos"
                            : `${lineas.length} producto${lineas.length !== 1 ? "s" : ""} en tu compra`}
                    </p>
                </div>

                {/* ===== Compra confirmada ===== */}
                {pedidoOk ? (
                    <section className="mt-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-14 shadow-sm max-w-2xl mx-auto">
                        {estadoPedidoEmitido === "Pendiente de pago" ? (
                            <>
                                <div className="w-20 h-20 mx-auto flex items-center justify-center bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full mb-4 text-3xl font-black">
                                    ⏳
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                                    ¡Pedido registrado! Pago pendiente de verificación
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-lg mx-auto">
                                    Pedido <strong className="text-slate-900 dark:text-white font-mono">{pedidoOk}</strong> por <strong className="text-slate-900 dark:text-white font-mono">S/ {totalPagado.toLocaleString("es-PE")}</strong>.
                                    Registramos tu solicitud con el número de operación bancaria; un administrador confirmará el abono para iniciar la preparación en almacén.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 mx-auto flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full mb-4">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                                    ¡Pago procesado con éxito!
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-lg mx-auto">
                                    Pedido <strong className="text-slate-900 dark:text-white font-mono">{pedidoOk}</strong> por <strong className="text-slate-900 dark:text-white font-mono">S/ {totalPagado.toLocaleString("es-PE")}</strong>.
                                    Tu comprobante electrónico ha sido emitido satisfactoriamente.
                                </p>
                            </>
                        )}

                        {comprobanteEmitido && (
                            <div className="bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 my-6 max-w-md mx-auto text-left shadow-xs">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                        {comprobanteEmitido.tipo} Electrónica
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                        RUC: 20601234567
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                                    <div><strong>Receptor:</strong> {comprobanteEmitido.nombreRazonSocial}</div>
                                    <div><strong>{comprobanteEmitido.tipo === "Boleta" ? "DNI" : "RUC"}:</strong> {comprobanteEmitido.documento}</div>
                                    {comprobanteEmitido.direccion && (
                                        <div><strong>Dirección:</strong> {comprobanteEmitido.direccion}</div>
                                    )}
                                    <div className="flex flex-col gap-1 border-t border-slate-200 dark:border-slate-800 pt-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
                                        <span>Op. Gravada: S/ {comprobanteEmitido.subtotal.toFixed(2)}</span>
                                        <span>IGV (18%): S/ {comprobanteEmitido.igv.toFixed(2)}</span>
                                        <strong className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                            Total: S/ {comprobanteEmitido.total.toFixed(2)}
                                        </strong>
                                    </div>
                                    {pedidoEmitido && (
                                        <button
                                            type="button"
                                            disabled={generandoPdf}
                                            onClick={async () => {
                                                setGenerandoPdf(true);
                                                try {
                                                    await descargarComprobantePdf(pedidoEmitido);
                                                } finally {
                                                    setGenerandoPdf(false);
                                                }
                                            }}
                                            className="mt-3 w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <span>
                                                {generandoPdf
                                                    ? "Generando PDF..."
                                                    : `Descargar ${comprobanteEmitido.tipo} PDF`}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mt-6">
                            <button 
                                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow cursor-pointer" 
                                onClick={() => navigate("/productos")}
                            >
                                Seguir comprando
                            </button>
                            <button 
                                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm transition-all cursor-pointer" 
                                onClick={() => navigate("/mis-compras")}
                            >
                                Ver en Mis compras
                            </button>
                        </div>
                    </section>
                ) : lineas.length === 0 ? (
                    /* ===== Carrito vacío ===== */
                    <section className="mt-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 sm:p-16 shadow-sm max-w-xl mx-auto flex flex-col items-center">
                        <svg className="text-slate-400 dark:text-slate-600 mb-4" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Tu carrito está vacío
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Explora el catálogo y encuentra tecnología a los mejores precios.
                        </p>
                        <button 
                            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow cursor-pointer" 
                            onClick={() => navigate("/productos")}
                        >
                            Ver productos
                        </button>
                    </section>
                ) : (
                    /* ===== Carrito con productos ===== */
                    <>
                        {/* Barra envío gratis */}
                        <section className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs">
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                {envioGratis ? (
                                    <span><strong className="text-emerald-600 dark:text-emerald-400 font-bold">¡Tienes envío gratis!</strong> Aprovecha tu compra.</span>
                                ) : (
                                    <span>Te faltan <strong className="text-blue-600 dark:text-blue-400 font-bold">S/ {faltante.toLocaleString("es-PE")}</strong> para envío gratis</span>
                                )}
                            </div>
                            <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500" 
                                    style={{ width: `${progreso}%` }} 
                                />
                            </div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                                {progreso}%
                            </span>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Lista de productos */}
                            <section className="lg:col-span-8 flex flex-col gap-4">
                                {lineas.map(({ producto, cantidad }) => (
                                    <article 
                                        key={producto.id} 
                                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-blue-500/40 hover:shadow-sm transition-all"
                                    >
                                        <ImagenProducto
                                            src={producto.imagen}
                                            alt={producto.nombre}
                                            compact
                                            onClick={() => navigate(`/productos/${producto.id}`)}
                                            className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 cursor-pointer flex-shrink-0 border border-slate-100 dark:border-slate-800"
                                        />
                                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                                {producto.categoria}
                                            </span>
                                            <h3 
                                                onClick={() => navigate(`/productos/${producto.id}`)}
                                                className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer line-clamp-2 mt-0.5 transition-colors"
                                            >
                                                {producto.nombre}
                                            </h3>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block mt-1">
                                                S/ {producto.precio.toLocaleString("es-PE")} c/u
                                            </span>

                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                                                    <button
                                                        onClick={() => cambiarCantidad(producto.id, cantidad - 1)}
                                                        aria-label="Quitar uno"
                                                        className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors text-base font-bold cursor-pointer"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="min-w-[36px] text-center text-sm font-bold text-slate-900 dark:text-white font-mono">
                                                        {cantidad}
                                                    </span>
                                                    <button
                                                        onClick={() => cambiarCantidad(producto.id, cantidad + 1)}
                                                        disabled={cantidad >= producto.stock}
                                                        aria-label="Agregar uno"
                                                        className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base font-bold cursor-pointer"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 underline cursor-pointer transition-colors"
                                                    onClick={() => quitar(producto.id)}
                                                >
                                                    Quitar
                                                </button>
                                            </div>

                                            {cantidad >= producto.stock && (
                                                <span className="block text-xs font-medium text-amber-600 dark:text-amber-400 mt-2">
                                                    Stock máximo disponible ({producto.stock})
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 sm:self-center font-mono text-lg font-black text-slate-900 dark:text-white whitespace-nowrap">
                                            <strong>S/ {(producto.precio * cantidad).toLocaleString("es-PE")}</strong>
                                        </div>
                                    </article>
                                ))}

                                <button 
                                    className="self-start text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 underline cursor-pointer transition-colors py-2" 
                                    onClick={vaciar}
                                >
                                    Vaciar carrito
                                </button>
                            </section>

                            {/* Resumen */}
                            <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm sticky top-24">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                    Resumen de compra
                                </h2>
                                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400 mb-2.5 font-medium">
                                    <span>Subtotal (Base Imponible)</span>
                                    <span className="font-mono text-slate-800 dark:text-slate-200">S/ {baseImponible.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400 mb-2.5 font-medium">
                                    <span>I.G.V. (18%)</span>
                                    <span className="font-mono text-slate-800 dark:text-slate-200">S/ {igv.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400 mb-2.5 font-medium">
                                    <span>Envío / Entrega</span>
                                    {tipoEntrega === "recojo" ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Gratis (Recojo)</span>
                                    ) : tipoEntrega === "agencia_destino" ? (
                                        <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">Pago en destino</span>
                                    ) : (
                                        <span className={envioGratis ? "text-emerald-600 dark:text-emerald-400 font-bold" : "font-mono text-slate-800 dark:text-slate-200"}>
                                            {envioGratis ? "Gratis (Zona)" : `S/ ${envio.toFixed(2)}`}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 my-4 pt-4 text-base font-bold text-slate-900 dark:text-white">
                                    <span>Total</span>
                                    <strong className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                                        S/ {total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                    </strong>
                                </div>

                                <button
                                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => {
                                        setMostrarCheckout(true);
                                        setPasoCheckout(1);
                                    }}
                                >
                                    Continuar al Pago
                                </button>
                                <button 
                                    className="w-full mt-2.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer" 
                                    onClick={() => navigate("/productos")}
                                >
                                    Seguir comprando
                                </button>

                                <div className="mt-5 flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                                    <span>🔒 Facturación Electrónica SUNAT</span>
                                    <span>🛡️ Pago 100% cifrado y seguro</span>
                                </div>
                            </aside>
                        </div>
                    </>
                )}

                {/* ===== MODAL DE PASARELA DE PAGOS Y FACTURACIÓN SUNAT ===== */}
                {mostrarCheckout && (
                    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                            <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Pasarela de Pago Segura
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Emisión electrónica SUNAT & Procesamiento cifrado
                                    </p>
                                </div>
                                <button
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-sm font-bold"
                                    onClick={() => setMostrarCheckout(false)}
                                    aria-label="Cerrar modal"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Pestañas de pasos */}
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
                                <button
                                    type="button"
                                    className={`py-2 px-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        pasoCheckout === 1 
                                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60" 
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                                    }`}
                                    onClick={() => setPasoCheckout(1)}
                                >
                                    1. Envío
                                </button>
                                <button
                                    type="button"
                                    className={`py-2 px-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        pasoCheckout === 2 
                                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60" 
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                                    }`}
                                    onClick={() => setPasoCheckout(2)}
                                >
                                    2. Comprobante
                                </button>
                                <button
                                    type="button"
                                    className={`py-2 px-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        pasoCheckout === 3 
                                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60" 
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                                    }`}
                                    onClick={() => setPasoCheckout(3)}
                                >
                                    3. Pago
                                </button>
                            </div>

                            <form onSubmit={ejecutarPago} className="space-y-4">
                                {/* ===== PASO 1: DATOS DE ENVÍO Y CONTACTO ===== */}
                                {pasoCheckout === 1 && (
                                    <div className="space-y-4">
                                        {usuario ? (
                                            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl px-3.5 py-2.5 text-xs text-blue-800 dark:text-blue-200">
                                                Cargamos tus datos guardados. Si agregas o actualizas tu celular, dirección o DNI, se guardarán en tu perfil al confirmar el pedido.
                                            </div>
                                        ) : (
                                            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                                                <p className="text-xs text-amber-900 dark:text-amber-200">
                                                    <strong>¿Ya tienes una cuenta?</strong> Inicia sesión para cargar tus datos guardados y sincronizar tu compra.
                                                </p>
                                                <button 
                                                    type="button" 
                                                    className="px-3 py-1.5 rounded-lg border border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 text-xs font-bold transition-all cursor-pointer whitespace-nowrap" 
                                                    onClick={() => navigate("/login")}
                                                >
                                                    Iniciar Sesión
                                                </button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                                            <button
                                                type="button"
                                                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                                                    tipoEntrega === "delivery_propio"
                                                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-500"
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                                onClick={() => {
                                                    setTipoEntrega("delivery_propio");
                                                    if (!distritoEnvio) setDistritoEnvio("San Juan de Lurigancho");
                                                }}
                                            >
                                                <strong className="text-xs font-bold text-slate-900 dark:text-white">
                                                    🛵 Delivery Propio
                                                </strong>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Zona SJL · {envioGratis ? "Gratis" : `S/ ${COSTO_DELIVERY_PROPIO}`}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                                                    tipoEntrega === "agencia_destino"
                                                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-500"
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                                onClick={() => setTipoEntrega("agencia_destino")}
                                            >
                                                <strong className="text-xs font-bold text-slate-900 dark:text-white">
                                                    📦 Agencia Courier
                                                </strong>
                                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                                    Olva / Shalom (Pago destino)
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                                                    tipoEntrega === "recojo"
                                                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-500"
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                                onClick={() => setTipoEntrega("recojo")}
                                            >
                                                <strong className="text-xs font-bold text-slate-900 dark:text-white">
                                                    🏪 Recojo en Tienda
                                                </strong>
                                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                                    SJL · Gratis
                                                </span>
                                            </button>
                                        </div>

                                        {tipoEntrega === "agencia_destino" && (
                                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 mb-2">
                                                <strong>Importante — Flete por Pagar:</strong> El envío mediante <strong>Olva Courier o Shalom</strong> no está incluido en este monto web. Al recibir tu paquete o recogerlo en agencia, abonarás la tarifa de transporte directamente al courier.
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                Correo Electrónico *
                                            </label>
                                            <input 
                                                type="email" 
                                                placeholder="Ej. usuario@correo.com" 
                                                value={correoContacto}
                                                onChange={(e) => setCorreoContacto(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                Teléfono Celular *
                                            </label>
                                            <input 
                                                type="tel" 
                                                inputMode="numeric" 
                                                pattern="[0-9]*" 
                                                maxLength={9}
                                                placeholder="Ej. 999888777" 
                                                value={celularContacto}
                                                onChange={(e) => setCelularContacto(e.target.value.replace(/\D/g, "").slice(0, 9))}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                required
                                            />
                                        </div>

                                        {tipoEntrega !== "recojo" && (
                                            <>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        {tipoEntrega === "agencia_destino" ? "Dirección de Entrega o Agencia (Olva / Shalom) *" : "Dirección de Envío *"}
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Calle, Avenida, Jr." 
                                                        value={direccionEnvio}
                                                        onChange={(e) => setDireccionEnvio(e.target.value)}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            Distrito *
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={distritoEnvio}
                                                            onChange={(e) => setDistritoEnvio(e.target.value)}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            Referencia
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Cerca de..." 
                                                            value={referenciaEnvio}
                                                            onChange={(e) => setReferenciaEnvio(e.target.value)}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {errorEnvio && (
                                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-700 dark:text-red-300">
                                                {errorEnvio}
                                            </div>
                                        )}

                                        <div className="flex gap-3 justify-end mt-5 pt-3 border-t border-slate-200 dark:border-slate-800">
                                            <button
                                                type="button"
                                                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer"
                                                onClick={() => {
                                                    setErrorEnvio(null);
                                                    if (!esCorreoValido(correoContacto)) {
                                                        setErrorEnvio("Ingresa un correo electrónico válido.");
                                                        return;
                                                    }
                                                    if (!/^\d{9}$/.test(celularContacto.trim())) {
                                                        setErrorEnvio("Ingresa un teléfono celular válido de 9 dígitos.");
                                                        return;
                                                    }
                                                    if (tipoEntrega !== "recojo" && (!direccionEnvio.trim() || !distritoEnvio.trim())) {
                                                        setErrorEnvio("Completa la dirección y distrito de entrega.");
                                                        return;
                                                    }
                                                    setPasoCheckout(2);
                                                }}
                                            >
                                                Continuar al Comprobante →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ===== PASO 2: DATOS DE FACTURACIÓN SUNAT ===== */}
                                {pasoCheckout === 2 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <button
                                                type="button"
                                                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                                                    tipoComprobante === "Boleta" 
                                                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-500" 
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                                onClick={() => {
                                                    setTipoComprobante("Boleta");
                                                    setDocumento("");
                                                    setNombreRazonSocial("");
                                                    setEstadoSunat("");
                                                    setErrorApi(null);
                                                }}
                                            >
                                                <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                                    Boleta de Venta
                                                </strong>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Para persona natural (DNI)
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                                                    tipoComprobante === "Factura" 
                                                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-500" 
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                                onClick={() => {
                                                    setTipoComprobante("Factura");
                                                    setDocumento("");
                                                    setNombreRazonSocial("");
                                                    setEstadoSunat("");
                                                    setErrorApi(null);
                                                }}
                                            >
                                                <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                                    Factura Electrónica
                                                </strong>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Con RUC para empresas
                                                </span>
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {tipoComprobante === "Boleta" ? "DNI del titular (8 dígitos)" : "RUC de la empresa (11 dígitos)"}
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={tipoComprobante === "Boleta" ? 8 : 11}
                                                    placeholder={tipoComprobante === "Boleta" ? "Ej. 72819402" : "Ej. 20601234567"}
                                                    value={documento}
                                                    onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ""))}
                                                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs whitespace-nowrap transition-all cursor-pointer"
                                                    onClick={handleConsultarDocumento}
                                                    disabled={cargandoApi}
                                                >
                                                    {cargandoApi ? "Consultando..." : `Consultar ${tipoComprobante === "Boleta" ? "RENIEC" : "SUNAT"}`}
                                                </button>
                                            </div>
                                            {errorApi && <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">{errorApi}</p>}
                                            {estadoSunat && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">✓ {estadoSunat}</p>}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {tipoComprobante === "Boleta" ? "Nombres y Apellidos" : "Razón Social"}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={tipoComprobante === "Boleta" ? "Nombres del cliente" : "Razón social de la empresa"}
                                                value={nombreRazonSocial}
                                                onChange={(e) => setNombreRazonSocial(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                required
                                            />
                                        </div>

                                        {tipoComprobante === "Factura" && (
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    Dirección Fiscal
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Dirección fiscal registrada en SUNAT"
                                                    value={direccionFiscal}
                                                    onChange={(e) => setDireccionFiscal(e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                    required
                                                />
                                            </div>
                                        )}

                                        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col gap-2 text-xs font-medium my-3">
                                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                                <span>Envío / Modalidad:</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {tipoEntrega === "recojo"
                                                        ? "Recojo en tienda (Gratis)"
                                                        : tipoEntrega === "agencia_destino"
                                                            ? "Agencia (Pago en destino)"
                                                            : envio === 0
                                                                ? "Delivery Propio (Gratis)"
                                                                : `Delivery Propio (S/ ${envio.toFixed(2)})`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                                <span>Op. Gravada:</span>
                                                <span className="font-mono text-slate-800 dark:text-slate-200">S/ {baseImponible.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                                <span>I.G.V. (18%):</span>
                                                <span className="font-mono text-slate-800 dark:text-slate-200">S/ {igv.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-t border-dashed border-slate-300 dark:border-slate-700 pt-2 text-slate-900 dark:text-white text-sm font-bold">
                                                <span>Total a pagar:</span>
                                                <strong className="text-blue-600 dark:text-blue-400 font-mono text-base">
                                                    S/ {total.toFixed(2)}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end mt-5 pt-3 border-t border-slate-200 dark:border-slate-800">
                                            <button
                                                type="button"
                                                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer"
                                                onClick={() => setPasoCheckout(1)}
                                            >
                                                ← Volver a envío
                                            </button>
                                            <button
                                                type="button"
                                                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer"
                                                onClick={() => {
                                                    setErrorApi(null);
                                                    const docLimpio = documento.trim();
                                                    if (tipoComprobante === "Boleta" && !/^\d{8}$/.test(docLimpio)) {
                                                        setErrorApi("Ingresa un DNI válido de 8 dígitos para la boleta.");
                                                        return;
                                                    }
                                                    if (tipoComprobante === "Factura" && (!/^\d{11}$/.test(docLimpio) || !["10", "15", "17", "20"].includes(docLimpio.slice(0, 2)))) {
                                                        setErrorApi("Ingresa un RUC válido de 11 dígitos (inicia con 10, 15, 17 o 20).");
                                                        return;
                                                    }
                                                    if (!nombreRazonSocial.trim()) {
                                                        setErrorApi(tipoComprobante === "Boleta"
                                                            ? "Consulta o ingresa tus Nombres y Apellidos."
                                                            : "Consulta o ingresa la Razón Social.");
                                                        return;
                                                    }
                                                    if (tipoComprobante === "Factura" && !direccionFiscal.trim()) {
                                                        setErrorApi("Ingresa la Dirección Fiscal para emitir la factura.");
                                                        return;
                                                    }
                                                    setErrorPago(null);
                                                    setPasoCheckout(3);
                                                }}
                                            >
                                                Continuar a Medios de Pago →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ===== PASO 3: MEDIO DE PAGO ===== */}
                                {pasoCheckout === 3 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-2.5 mb-4">
                                            <button
                                                type="button"
                                                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all cursor-pointer ${
                                                    metodoPago === "tarjeta" 
                                                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-500" 
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                                onClick={() => setMetodoPago("tarjeta")}
                                            >
                                                <span className="text-2xl mb-1">💳</span>
                                                <strong className="text-xs font-bold text-slate-900 dark:text-white">Tarjeta</strong>
                                                <small className="text-[10px] text-slate-500 dark:text-slate-400">Débito / Crédito</small>
                                            </button>

                                            <button
                                                type="button"
                                                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all cursor-pointer ${
                                                    metodoPago === "yape" 
                                                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-500" 
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                                onClick={() => setMetodoPago("yape")}
                                            >
                                                <span className="text-2xl mb-1">📱</span>
                                                <strong className="text-xs font-bold text-slate-900 dark:text-white">Yape / Plin</strong>
                                                <small className="text-[10px] text-slate-500 dark:text-slate-400">Pago móvil QR</small>
                                            </button>

                                            <button
                                                type="button"
                                                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all cursor-pointer ${
                                                    metodoPago === "transferencia" 
                                                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-500" 
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                                onClick={() => setMetodoPago("transferencia")}
                                            >
                                                <span className="text-2xl mb-1">🏦</span>
                                                <strong className="text-xs font-bold text-slate-900 dark:text-white">Transferencia</strong>
                                                <small className="text-[10px] text-slate-500 dark:text-slate-400">BCP / BBVA / Interbank</small>
                                            </button>
                                        </div>

                                        {/* Tarjeta de crédito/débito */}
                                        {metodoPago === "tarjeta" && (
                                            <div className="space-y-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Número de Tarjeta
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="4557 1234 5678 9010"
                                                        value={numeroTarjeta}
                                                        onChange={(e) => handleTarjetaInput(e.target.value)}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                                        required
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Nombre del Titular
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Como figura en la tarjeta"
                                                        value={nombreTitular}
                                                        onChange={(e) => setNombreTitular(limpiarSoloLetras(e.target.value, 80))}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            Vencimiento (MM/AA)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="12/28"
                                                            value={vencimiento}
                                                            onChange={(e) => handleVencimientoInput(e.target.value)}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            CVV (3 dígitos)
                                                        </label>
                                                        <input
                                                            type="password"
                                                            maxLength={4}
                                                            placeholder="•••"
                                                            value={cvv}
                                                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Yape / Plin */}
                                        {metodoPago === "yape" && (
                                            <div className="space-y-3">
                                                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                                                    <div className="flex flex-col items-center justify-center p-3 bg-white text-slate-900 rounded-xl shadow-xs border border-slate-200">
                                                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                            <rect x="3" y="3" width="7" height="7" rx="1" />
                                                            <rect x="14" y="3" width="7" height="7" rx="1" />
                                                            <rect x="3" y="14" width="7" height="7" rx="1" />
                                                            <rect x="14" y="14" width="3" height="3" />
                                                            <rect x="18" y="14" width="3" height="7" />
                                                            <rect x="14" y="18" width="3" height="3" />
                                                        </svg>
                                                        <span className="text-[10px] font-bold mt-1 text-slate-700">Escanear QR</span>
                                                    </div>
                                                    <div className="text-xs text-slate-700 dark:text-slate-300 flex flex-col gap-1.5 flex-1">
                                                        <p>Monto a yapear/plinear: <strong className="text-blue-600 dark:text-blue-400 font-mono text-sm">S/ {total.toFixed(2)}</strong></p>
                                                        <p>Titular: <strong className="text-slate-900 dark:text-white">TechStore Perú S.A.C.</strong></p>
                                                        <p>Número: <strong className="font-mono text-slate-900 dark:text-white">+51 999 888 777</strong></p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            Nro. de Operación (6 a 8 dígitos) *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="\d{6,8}"
                                                            maxLength={8}
                                                            placeholder="Ej. 07795505"
                                                            value={codigoYape}
                                                            onChange={(e) => setCodigoYape(e.target.value.replace(/\D/g, "").slice(0, 8))}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            Código de seguridad Yape (3 dígitos)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="\d{3}"
                                                            maxLength={3}
                                                            placeholder="Ej. 505 (opcional Plin)"
                                                            value={codigoSeguridadYape}
                                                            onChange={(e) => setCodigoSeguridadYape(e.target.value.replace(/\D/g, "").slice(0, 3))}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    Solo se aceptan dígitos numéricos tal como figuran en tu constancia de Yape o Plin.
                                                </p>
                                            </div>
                                        )}

                                        {/* Transferencia */}
                                        {metodoPago === "transferencia" && (
                                            <div className="space-y-3">
                                                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-700 dark:text-slate-300 flex flex-col gap-1.5 font-mono">
                                                    <div><strong>BCP Soles:</strong> 193-48192039-0-12 (CCI: 00219300481920390123)</div>
                                                    <div><strong>BBVA Soles:</strong> 0011-0182-0200481920 (CCI: 01118200020048192011)</div>
                                                    <div><strong>Interbank:</strong> 200-3001849102 (CCI: 00320000300184910245)</div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Nro. de Operación Bancaria *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        maxLength={30}
                                                        placeholder="Ej. 00481920"
                                                        value={numeroOperacionTransf}
                                                        onChange={(e) => setNumeroOperacionTransf(limpiarCodigoAlfanumerico(e.target.value, 30, true))}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                                                        required
                                                    />
                                                </div>

                                                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                                    <strong className="text-slate-800 dark:text-slate-200">Adjuntar captura de comprobante:</strong>{" "}
                                                    Funcionalidad en proceso (disponible en futuras actualizaciones). Por el momento, registra tu número de operación bancaria para que el administrador valide el abono.
                                                </div>

                                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                                                    <strong>Verificación manual:</strong> Al confirmar, tu pedido quedará en estado <strong>Pendiente de pago</strong> hasta que el administrador valide la operación en cuenta.
                                                </div>
                                            </div>
                                        )}

                                        {errorPago && (
                                            <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-700 dark:text-red-300">
                                                {errorPago}
                                            </div>
                                        )}

                                        <div className="flex gap-3 justify-end mt-5 pt-3 border-t border-slate-200 dark:border-slate-800">
                                            <button
                                                type="button"
                                                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer"
                                                onClick={() => setPasoCheckout(2)}
                                            >
                                                ← Volver a comprobante
                                            </button>
                                            <button
                                                type="submit"
                                                className={`w-full py-3 px-4 rounded-xl disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer ${
                                                    metodoPago === "transferencia"
                                                        ? "bg-amber-600 hover:bg-amber-700"
                                                        : "bg-emerald-600 hover:bg-emerald-700"
                                                }`}
                                                disabled={procesandoPago}
                                            >
                                                {procesandoPago
                                                    ? "Registrando pedido..."
                                                    : metodoPago === "transferencia"
                                                        ? `Registrar Transferencia (S/ ${total.toFixed(2)})`
                                                        : `Confirmar y Pagar S/ ${total.toFixed(2)}`}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                {/* Sugeridos */}
                {!pedidoOk && sugeridos.length > 0 && (
                    <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            También te puede interesar
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {sugeridos.map((p) => (
                                <ProductCard key={p.id} producto={p} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default Carrito;
