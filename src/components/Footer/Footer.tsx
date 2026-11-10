import { useNavigate } from "react-router-dom";

function Footer() {
    const navigate = useNavigate();

    const linkButtonClass =
        "text-left text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer";

    return (
        <footer className="mt-auto w-full bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Marca */}
                    <div className="lg:col-span-2 space-y-4">
                        <button
                            className="flex items-center gap-2.5 cursor-pointer group"
                            onClick={() => navigate("/inicio")}
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                TechStore
                            </span>
                        </button>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                            Tu tienda minorista de tecnología en San Juan de Lurigancho: laptops, pantallas,
                            audífonos y periféricos con control de inventarios y trazabilidad con Kardex.
                        </p>
                    </div>

                    {/* Tienda */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            Tienda
                        </h3>
                        <ul className="space-y-2">
                            <li><button className={linkButtonClass} onClick={() => navigate("/inicio")}>Inicio</button></li>
                            <li><button className={linkButtonClass} onClick={() => navigate("/productos")}>Productos</button></li>
                            <li><button className={linkButtonClass} onClick={() => navigate("/productos")}>Categorías</button></li>
                            <li><button className={linkButtonClass} onClick={() => navigate("/carrito")}>Carrito</button></li>
                        </ul>
                    </div>

                    {/* Ayuda */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            Ayuda
                        </h3>
                        <ul className="space-y-2">
                            <li><button type="button" className={linkButtonClass} onClick={() => navigate("/preguntas-frecuentes")}>Preguntas frecuentes</button></li>
                            <li><button type="button" className={linkButtonClass} onClick={() => navigate("/metodos-de-pago")}>Métodos de pago</button></li>
                            <li><button type="button" className={linkButtonClass} onClick={() => navigate("/envios-y-entregas")}>Envíos y entregas</button></li>
                            <li><button type="button" className={linkButtonClass} onClick={() => navigate("/contactanos")}>Contáctanos</button></li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            Contacto
                        </h3>
                        <ul className="space-y-2 text-xs">
                            <li className="flex flex-col">
                                <span className="text-slate-400 font-medium">Ubicación</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">San Juan de Lurigancho, Lima</span>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-slate-400 font-medium">Correo</span>
                                <a
                                    href="mailto:contacto@techstore.com"
                                    className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    contacto@techstore.com
                                </a>
                            </li>
                            <li className="flex flex-col">
                                <span className="text-slate-400 font-medium">Horario</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Lun - Sáb: 9:00 a.m. – 7:00 p.m.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <span>
                        © 2026 TechStore — Proyecto Desarrollo Full Stack (UTP - San Juan de Lurigancho).
                    </span>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate("/terminos-y-condiciones")}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                            Términos y condiciones
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/politica-de-privacidad")}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                            Política de privacidad
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
