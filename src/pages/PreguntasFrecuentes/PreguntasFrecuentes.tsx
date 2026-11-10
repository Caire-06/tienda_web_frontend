import { useState } from "react";
import PaginaInformativa from "../../components/PaginaInformativa/PaginaInformativa";

type CategoriaFaq = "Todas" | "Compras y Pagos" | "Envíos" | "Garantía y Cuenta";

interface PreguntaFaq {
    id: string;
    categoria: Exclude<CategoriaFaq, "Todas">;
    pregunta: string;
    respuesta: string;
}

const CATEGORIAS_FAQ: CategoriaFaq[] = [
    "Todas",
    "Compras y Pagos",
    "Envíos",
    "Garantía y Cuenta",
];

const PREGUNTAS_FRECUENTES: PreguntaFaq[] = [
    {
        id: "como-comprar",
        categoria: "Compras y Pagos",
        pregunta: "¿Cómo realizo una compra en TechStore?",
        respuesta:
            "Agrega los productos con stock disponible al carrito, haz clic en el ícono de carrito y completa los 3 pasos de la pasarela: 1) modalidad de entrega y datos de contacto, 2) tipo de comprobante (Boleta o Factura) y 3) método de pago.",
    },
    {
        id: "metodos-pago",
        categoria: "Compras y Pagos",
        pregunta: "¿Qué métodos de pago aceptan?",
        respuesta:
            "Aceptamos tarjetas de crédito o débito (Visa y Mastercard), pagos móviles con Yape o Plin (registrando el número de operación de 6 a 8 dígitos numéricos) y transferencias bancarias en soles a nuestras cuentas BCP, BBVA e Interbank.",
    },
    {
        id: "comprobantes",
        categoria: "Compras y Pagos",
        pregunta: "¿Emiten Boleta o Factura electrónica?",
        respuesta:
            "Sí. En el paso 2 del pago puedes elegir Boleta (ingresando tu DNI de 8 dígitos) o Factura (con RUC de 11 dígitos y dirección fiscal). Además contamos con consulta rápida para autocompletar los datos tributarios.",
    },
    {
        id: "transferencia-pendiente",
        categoria: "Compras y Pagos",
        pregunta: "¿Por qué mi pedido por transferencia figura como Pendiente de pago?",
        respuesta:
            "Las transferencias bancarias pasan por una verificación manual para confirmar el abono en cuenta con tu número de operación. Una vez validado por el administrador, el pedido pasa a despacho.",
    },
    {
        id: "modalidades-envio",
        categoria: "Envíos",
        pregunta: "¿Cuáles son las opciones y costos de entrega?",
        respuesta:
            "Ofrecemos Delivery Propio en San Juan de Lurigancho (S/ 15.00, o gratis en compras desde S/ 499.00), envío por Agencia Courier Olva o Shalom a nivel nacional con flete por pagar en destino, y Recojo en Tienda SJL totalmente gratis.",
    },
    {
        id: "tiempos-entrega",
        categoria: "Envíos",
        pregunta: "¿Cuánto tarda en llegar mi pedido y cómo hago seguimiento?",
        respuesta:
            "El Delivery Propio en SJL se entrega entre 24 y 48 horas hábiles. Los envíos por courier demoran de 2 a 5 días hábiles según destino. Si compraste con tu cuenta, puedes revisar el estado actualizado (Pendiente, En camino o Entregado) desde Mis Compras.",
    },
    {
        id: "recojo-tienda",
        categoria: "Envíos",
        pregunta: "¿Dónde recojo mi pedido si elegí Recojo en Tienda?",
        respuesta:
            "En nuestra tienda central ubicada en Av. Próceres de la Independencia 2450, San Juan de Lurigancho, Lima, de lunes a sábado entre las 9:00 a. m. y 7:00 p. m., presentando tu documento de identidad y código de pedido.",
    },
    {
        id: "garantia",
        categoria: "Garantía y Cuenta",
        pregunta: "¿Los productos cuentan con garantía y política de cambios?",
        respuesta:
            "Todos los equipos cuentan con garantía oficial frente a fallas de fábrica presentando tu comprobante electrónico. También puedes solicitar cambio o devolución dentro de los 7 días calendario posteriores a la entrega si el producto conserva su empaque original sellado o completo.",
    },
    {
        id: "cuenta-compra",
        categoria: "Garantía y Cuenta",
        pregunta: "¿Necesito registrarme para poder comprar?",
        respuesta:
            "No es obligatorio, pero al iniciar sesión tus datos personales, contacto y dirección se precargan en el formulario de compra y podrás consultar tu historial completo y estados de envío en la sección Mis Compras.",
    },
];

function PreguntasFrecuentes() {
    const [categoriaActiva, setCategoriaActiva] = useState<CategoriaFaq>("Todas");
    const [abiertaId, setAbiertaId] = useState<string>(PREGUNTAS_FRECUENTES[0].id);

    const filtradas =
        categoriaActiva === "Todas"
            ? PREGUNTAS_FRECUENTES
            : PREGUNTAS_FRECUENTES.filter((item) => item.categoria === categoriaActiva);

    return (
        <PaginaInformativa
            etiqueta="Centro de Ayuda"
            titulo="Preguntas frecuentes"
            subtitulo="Resolvemos las dudas más comunes sobre compras, comprobantes electrónicos, pagos, entregas y garantía en TechStore."
            enlacesRelacionados={[
                { etiqueta: "Ver métodos de pago", ruta: "/metodos-de-pago" },
                { etiqueta: "Ver envíos y entregas", ruta: "/envios-y-entregas" },
            ]}
        >
            {/* Filtros por tema */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIAS_FAQ.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoriaActiva(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            categoriaActiva === cat
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Acordeón */}
            <div className="space-y-3">
                {filtradas.map((item) => {
                    const estaAbierta = abiertaId === item.id;
                    return (
                        <article
                            key={item.id}
                            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                        >
                            <button
                                type="button"
                                aria-expanded={estaAbierta}
                                onClick={() => setAbiertaId(estaAbierta ? "" : item.id)}
                                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                        {item.categoria}
                                    </span>
                                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                        {item.pregunta}
                                    </h2>
                                </div>
                                <span
                                    aria-hidden="true"
                                    className={`w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                                        estaAbierta ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                                    }`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </span>
                            </button>

                            {estaAbierta && (
                                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                                    {item.respuesta}
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </PaginaInformativa>
    );
}

export default PreguntasFrecuentes;

