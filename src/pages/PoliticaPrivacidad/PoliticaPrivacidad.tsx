import PaginaInformativa from "../../components/PaginaInformativa/PaginaInformativa";

const SECCIONES_PRIVACIDAD = [
    {
        titulo: "1. Responsable del tratamiento de datos",
        contenido:
            "TechStore (Av. Próceres de la Independencia 2450, San Juan de Lurigancho, Lima — correo: contacto@techstore.com) garantiza la confidencialidad y protección de los datos personales recopilados a través de su tienda virtual en conformidad con la Ley N.° 29733, Ley de Protección de Datos Personales del Perú, y su reglamento.",
    },
    {
        titulo: "2. Datos personales que recopilamos",
        contenido:
            "Al registrarte o realizar un pedido, recopilamos los datos estrictamente necesarios para la relación comercial: nombres y apellidos, número de DNI o RUC, correo electrónico, teléfono de contacto, dirección de envío, referencia, dirección fiscal (para facturas) y las referencias operativas de tu compra.",
    },
    {
        titulo: "3. Finalidad del uso de la información",
        contenido:
            "Utilizamos tus datos exclusivamente para autenticar tu cuenta de usuario, precargar y sincronizar tus datos de despacho desde tu perfil, emitir boletas o facturas electrónicas, validar pagos y coordinar la entrega de productos o la atención de consultas y garantías.",
    },
    {
        titulo: "4. Seguridad y resguardo técnico",
        contenido:
            "Las contraseñas se almacenan encriptadas mediante algoritmos criptográficos unidireccionales (BCrypt) y las sesiones se protegen mediante tokens JWT. TechStore no almacena códigos de seguridad CVV de tarjetas de crédito o débito en su base de datos.",
    },
    {
        titulo: "5. Transferencia y acceso por terceros",
        contenido:
            "TechStore no comercializa ni cede tus datos personales a terceros con fines publicitarios externos. La información indispensable de entrega (destinatario, teléfono y dirección o agencia) únicamente se comparte con operadores logísticos como Olva Courier o Shalom cuando el pedido requiere envío externo.",
    },
    {
        titulo: "6. Derechos del titular de los datos (ARCO)",
        contenido:
            "Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición actualizando directamente tu perfil desde la sección Mi Cuenta o enviando una solicitud al correo contacto@techstore.com indicando tu nombre completo y documento de identidad.",
    },
];

function PoliticaPrivacidad() {
    return (
        <PaginaInformativa
            etiqueta="Información Legal"
            titulo="Política de privacidad"
            subtitulo="Conoce qué datos recopilamos en TechStore, cómo los protegemos y de qué manera puedes actualizarlos o ejercer tus derechos de privacidad."
            actualizado="Vigente desde noviembre de 2026"
            enlacesRelacionados={[
                { etiqueta: "Términos y condiciones", ruta: "/terminos-y-condiciones" },
                { etiqueta: "Métodos de pago", ruta: "/metodos-de-pago" },
            ]}
        >
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
                {SECCIONES_PRIVACIDAD.map((seccion) => (
                    <section key={seccion.titulo} className="p-6 sm:p-7 space-y-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            {seccion.titulo}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {seccion.contenido}
                        </p>
                    </section>
                ))}
            </div>
        </PaginaInformativa>
    );
}

export default PoliticaPrivacidad;

