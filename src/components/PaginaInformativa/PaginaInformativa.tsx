import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

interface EnlaceRapido {
    etiqueta: string;
    ruta: string;
}

interface PaginaInformativaProps {
    etiqueta: string;
    titulo: string;
    subtitulo: string;
    actualizado?: string;
    enlacesRelacionados?: EnlaceRapido[];
    children: ReactNode;
}

/**
 * Plantilla común para las vistas informativas y legales accesibles desde el pie de página.
 */
function PaginaInformativa({
    etiqueta,
    titulo,
    subtitulo,
    actualizado,
    enlacesRelacionados = [],
    children,
}: PaginaInformativaProps) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-12 space-y-8">
                {/* Migas de pan y encabezado */}
                <div className="space-y-4">
                    <nav
                        aria-label="Ruta de navegación"
                        className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
                    >
                        <button
                            type="button"
                            onClick={() => navigate("/inicio")}
                            className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
                        >
                            Inicio
                        </button>
                        <span>/</span>
                        <span className="text-slate-700 dark:text-slate-200 font-semibold">
                            {titulo}
                        </span>
                    </nav>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                            {etiqueta}
                        </span>
                        {actualizado && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {actualizado}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                            {titulo}
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                            {subtitulo}
                        </p>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="space-y-6">{children}</div>

                {/* Bloque de asistencia y accesos relacionados */}
                <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
                    <div className="space-y-1.5">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            ¿Necesitas atención personalizada?
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                            Nuestro equipo en San Juan de Lurigancho atiende tus consultas de lunes a sábado de 9:00 a. m. a 7:00 p. m.
                        </p>
                        {enlacesRelacionados.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {enlacesRelacionados.map((enlace) => (
                                    <button
                                        key={enlace.ruta}
                                        type="button"
                                        onClick={() => navigate(enlace.ruta)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        {enlace.etiqueta}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/contactanos")}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-center"
                    >
                        Ir a Contáctanos →
                    </button>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default PaginaInformativa;
