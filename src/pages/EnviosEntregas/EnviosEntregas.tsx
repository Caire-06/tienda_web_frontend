import PaginaInformativa from "../../components/PaginaInformativa/PaginaInformativa";
import {
    IconoCamion,
    IconoCheckCirculo,
    IconoMoto,
    IconoPaquete,
    IconoReloj,
    IconoTienda,
} from "../../components/Iconos/Iconos";

const MODALIDADES_ENVIO = [
    {
        icono: <IconoMoto size={22} />,
        iconoClase: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
        titulo: "Delivery Propio (Zona SJL)",
        badge: "Gratis desde S/ 499",
        badgeClass: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300",
        tarifa: "Tarifa fija: S/ 15.00 (Gratis en pedidos mayores o iguales a S/ 499.00)",
        plazo: "Entrega en 24 a 48 horas hábiles.",
        detalle:
            "Reparto directo dentro de San Juan de Lurigancho. Registra tu dirección exacta y una referencia cercana para agilizar la entrega.",
    },
    {
        icono: <IconoPaquete size={22} />,
        iconoClase: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
        titulo: "Agencia Courier (Olva / Shalom)",
        badge: "Pago en destino",
        badgeClass: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300",
        tarifa: "Envío por web: S/ 0.00 (el flete se abona al courier en agencia o entrega)",
        plazo: "Lima Metropolitana: 1 a 3 días hábiles · Provincias: 2 a 5 días hábiles.",
        detalle:
            "Despachamos a todo el Perú mediante Olva Courier o Shalom. Puedes indicar agencia de destino o domicilio según cobertura.",
    },
    {
        icono: <IconoTienda size={22} />,
        iconoClase: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
        titulo: "Recojo en Tienda Central",
        badge: "Sin costo",
        badgeClass: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300",
        tarifa: "Costo de envío: Gratis",
        plazo: "Disponible desde el mismo día hábil tras confirmación del pedido.",
        detalle:
            "Av. Próceres de la Independencia 2450, San Juan de Lurigancho, Lima. Horario: Lunes a Sábado de 9:00 a. m. a 7:00 p. m.",
    },
];

const ESTADOS_PEDIDO = [
    {
        estado: "Pendiente de pago",
        icono: <IconoReloj size={13} />,
        descripcion:
            "Aplica a compras por transferencia bancaria mientras validamos tu número de operación.",
    },
    {
        estado: "Pendiente",
        icono: <IconoPaquete size={13} />,
        descripcion:
            "Tu pago fue confirmado y nuestro almacén está alistando y embalando los equipos.",
    },
    {
        estado: "En camino",
        icono: <IconoCamion size={13} />,
        descripcion:
            "El pedido ya salió a reparto local, fue entregado al courier o está listo para recojo.",
    },
    {
        estado: "Entregado",
        icono: <IconoCheckCirculo size={13} />,
        descripcion:
            "Entrega completada satisfactoriamente al destinatario o en tienda.",
    },
];

function EnviosEntregas() {
    return (
        <PaginaInformativa
            etiqueta="Logística y Despachos"
            titulo="Envíos y entregas"
            subtitulo="Despachamos tus compras de forma rápida y trazable en San Juan de Lurigancho, Lima Metropolitana y provincias del Perú."
            enlacesRelacionados={[
                { etiqueta: "Ver métodos de pago", ruta: "/metodos-de-pago" },
                { etiqueta: "Preguntas frecuentes", ruta: "/preguntas-frecuentes" },
            ]}
        >
            {/* Modalidades de entrega */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {MODALIDADES_ENVIO.map((item) => (
                    <article
                        key={item.titulo}
                        className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-4 shadow-xs"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className={`inline-flex w-10 h-10 rounded-xl items-center justify-center ${item.iconoClase}`}
                                    aria-hidden="true"
                                >
                                    {item.icono}
                                </span>
                                <span
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${item.badgeClass}`}
                                >
                                    {item.badge}
                                </span>
                            </div>

                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {item.titulo}
                            </h2>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {item.detalle}
                            </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {item.tarifa}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400">
                                {item.plazo}
                            </p>
                        </div>
                    </article>
                ))}
            </div>

            {/* Seguimiento del pedido */}
            <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xs">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Ciclo de estados de tu pedido
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Si iniciaste sesión antes de comprar, puedes consultar el avance actualizado de tu entrega desde la sección Mis Compras.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {ESTADOS_PEDIDO.map((paso) => (
                        <div
                            key={paso.estado}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2"
                        >
                            <span className="inline-flex w-7 h-7 rounded-full bg-blue-600 text-white items-center justify-center">
                                {paso.icono}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {paso.estado}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {paso.descripcion}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Requisitos para entrega */}
            <section className="rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 p-6 space-y-2">
                <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                    Recomendaciones al recibir o recoger tu pedido
                </h2>
                <ul className="text-xs text-amber-900 dark:text-amber-300/90 space-y-1">
                    <li>• Ten a la mano tu DNI y número de pedido (<span className="font-mono font-semibold">TS-...</span>) al momento de recibir o recoger en tienda.</li>
                    <li>• Revisa que el embalaje y los sellos de seguridad estén intactos antes de firmar la conformidad de entrega.</li>
                    <li>• Para envíos por agencia courier, el flete varía según peso y destino y se paga directamente a Olva Courier o Shalom.</li>
                </ul>
            </section>
        </PaginaInformativa>
    );
}

export default EnviosEntregas;

