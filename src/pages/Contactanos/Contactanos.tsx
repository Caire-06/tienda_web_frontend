import { useState } from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { esCorreoValido, limpiarSoloLetras } from "../../utils/validaciones";

function Contactanos() {
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [asunto, setAsunto] = useState("Consulta general");
    const [mensaje, setMensaje] = useState("");
    const [errorForm, setErrorForm] = useState("");
    const [enviado, setEnviado] = useState(false);

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorForm("");
        if (nombre.trim().length < 2) {
            setErrorForm("Ingresa tu nombre completo (mínimo 2 caracteres).");
            return;
        }
        if (!esCorreoValido(correo)) {
            setErrorForm("Ingresa un correo electrónico válido.");
            return;
        }
        if (mensaje.trim().length < 10) {
            setErrorForm("Describe tu consulta con al menos 10 caracteres.");
            return;
        }
        setEnviado(true);
    };

    const inputClass =
        "w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500";

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-8">
                <div className="text-center sm:text-left space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Contáctanos</h1>
                    <p className="text-sm text-slate-500 max-w-xl">
                        Escríbenos por cualquier consulta sobre productos, stock, garantías o compras institucionales en San Juan de Lurigancho.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Información de contacto */}
                    <section className="space-y-4">
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="m22 7-10 6L2 7" />
                                </svg>
                            </div>
                            <div>
                                <strong className="block text-sm font-bold text-slate-900 dark:text-white">Correo corporativo</strong>
                                <span className="text-xs text-slate-500">contacto@techstore.com</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </div>
                            <div>
                                <strong className="block text-sm font-bold text-slate-900 dark:text-white">Central Telefónica / WhatsApp</strong>
                                <span className="text-xs text-slate-500">+51 999 888 777</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <div>
                                <strong className="block text-sm font-bold text-slate-900 dark:text-white">Tienda Central y Despacho</strong>
                                <span className="text-xs text-slate-500">Av. Próceres de la Independencia 2450, San Juan de Lurigancho, Lima</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <div>
                                <strong className="block text-sm font-bold text-slate-900 dark:text-white">Horario de atención presencial</strong>
                                <span className="text-xs text-slate-500">Lunes a Sábado, 9:00 a. m. – 7:00 p. m.</span>
                            </div>
                        </div>
                    </section>

                    {/* Formulario */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
                        {enviado ? (
                            <div className="text-center py-10 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl font-bold">
                                    ✓
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Mensaje enviado</h3>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                    Gracias {nombre}, nuestro equipo de soporte te responderá a {correo} a la brevedad.
                                </p>
                                <button
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all cursor-pointer"
                                    onClick={() => { setEnviado(false); setNombre(""); setCorreo(""); setMensaje(""); }}
                                >
                                    Enviar otro mensaje
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={enviar} className="space-y-4">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Envíanos un mensaje</h2>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Nombre completo
                                    </label>
                                    <input
                                        className={inputClass}
                                        type="text"
                                        placeholder="Tu nombre completo"
                                        value={nombre}
                                        onChange={(e) => setNombre(limpiarSoloLetras(e.target.value, 100))}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Correo electrónico
                                    </label>
                                    <input
                                        className={inputClass}
                                        type="email"
                                        placeholder="tucorreo@ejemplo.com"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Asunto
                                    </label>
                                    <select
                                        className={`${inputClass} cursor-pointer`}
                                        value={asunto}
                                        onChange={(e) => setAsunto(e.target.value)}
                                    >
                                        <option>Consulta general</option>
                                        <option>Stock y especificaciones</option>
                                        <option>Estado de mi compra</option>
                                        <option>Garantía y facturación</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Mensaje
                                    </label>
                                    <textarea
                                        className={inputClass}
                                        placeholder="Detalla tu consulta..."
                                        rows={4}
                                        value={mensaje}
                                        onChange={(e) => setMensaje(e.target.value)}
                                        required
                                    />
                                </div>

                                {errorForm && (
                                    <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
                                        {errorForm}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                                >
                                    Enviar mensaje
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Contactanos;
