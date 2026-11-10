import PaginaInformativa from "../../components/PaginaInformativa/PaginaInformativa";

const CLAUSULAS_TERMINOS = [
    {
        titulo: "1. Identificación y ámbito de aplicación",
        contenido:
            "El presente sitio web es operado por TechStore (TechStore Perú S.A.C.), con punto de atención en Av. Próceres de la Independencia 2450, San Juan de Lurigancho, Lima, Perú, y correo electrónico contacto@techstore.com. El uso de la plataforma y la realización de pedidos implican la aceptación íntegra de estos Términos y Condiciones.",
    },
    {
        titulo: "2. Registro de cuenta y veracidad de la información",
        contenido:
            "El usuario puede navegar y comprar como invitado o registrarse en TechStore. Al crear una cuenta o completar sus datos de envío y facturación, declara que la información proporcionada (nombres, DNI/RUC, correo, teléfono y dirección) es verídica y se compromete a custodiar adecuadamente su contraseña de acceso.",
    },
    {
        titulo: "3. Stock, precios y disponibilidad de productos",
        contenido:
            "Todos los precios mostrados en el catálogo se expresan en soles peruanos (S/) e incluyen el Impuesto General a las Ventas (IGV). Solo se habilitan para compra en línea los artículos que cuentan con stock activo en almacén; en caso de variación extraordinaria de inventario antes de confirmar el despacho, TechStore coordinará con el cliente el reemplazo o reembolso correspondiente.",
    },
    {
        titulo: "4. Modalidades de pago y validación de pedidos",
        contenido:
            "Los pagos mediante tarjeta de crédito/débito y Yape/Plin (ingresando número de operación numérico válido) permiten confirmar la orden de forma inmediata. En pagos por transferencia bancaria (BCP, BBVA o Interbank), el pedido permanece temporalmente en estado 'Pendiente de pago' hasta que el administrador verifique el abono en cuenta con el código de operación registrado.",
    },
    {
        titulo: "5. Despacho, entregas y comprobantes electrónicos",
        contenido:
            "El cliente elige en la pasarela de pago entre Delivery Propio en San Juan de Lurigancho (S/ 15.00 o gratis desde S/ 499.00), envío por Agencia Courier Olva o Shalom con flete por pagar en destino, o Recojo en Tienda gratuito. La emisión de Boleta o Factura se realiza conforme a los datos tributarios ingresados por el comprador.",
    },
    {
        titulo: "6. Garantía, cambios y devoluciones",
        contenido:
            "En concordancia con el Código de Protección y Defensa del Consumidor (Ley N.° 29571), los productos cuentan con garantía por defectos de fábrica presentando el comprobante de compra. Las solicitudes de cambio o devolución proceden dentro de los 7 días calendario posteriores a la entrega siempre que el equipo, accesorios y empaques se conserven en óptimo estado y sin signos de mal uso.",
    },
    {
        titulo: "7. Propiedad intelectual y carácter académico del proyecto",
        contenido:
            "La estructura, interfaz, código y contenidos visuales de la plataforma forman parte del proyecto académico TechStore (UTP — Desarrollo Full Stack). Queda prohibido el uso automatizado no autorizado o la alteración maliciosa de los servicios web de la aplicación.",
    },
];

function TerminosCondiciones() {
    return (
        <PaginaInformativa
            etiqueta="Información Legal"
            titulo="Términos y condiciones"
            subtitulo="Condiciones generales que regulan el acceso, navegación, compra de productos y atención postventa en la tienda en línea TechStore."
            actualizado="Vigente desde noviembre de 2026"
            enlacesRelacionados={[
                { etiqueta: "Política de privacidad", ruta: "/politica-de-privacidad" },
                { etiqueta: "Envíos y entregas", ruta: "/envios-y-entregas" },
            ]}
        >
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
                {CLAUSULAS_TERMINOS.map((clausula) => (
                    <section key={clausula.titulo} className="p-6 sm:p-7 space-y-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            {clausula.titulo}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {clausula.contenido}
                        </p>
                    </section>
                ))}
            </div>
        </PaginaInformativa>
    );
}

export default TerminosCondiciones;

