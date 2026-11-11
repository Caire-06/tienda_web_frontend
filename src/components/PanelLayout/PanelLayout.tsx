import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

export interface PanelNavItem {
    to: string;
    label: string;
    end?: boolean;
    icono: ReactNode;
}

export interface PanelNavSeccion {
    titulo: string;
    items: PanelNavItem[];
}

interface PanelLayoutProps {
    accent: "blue" | "emerald";
    brandSubtitulo: string;
    headerTitulo: string;
    headerBadge: string;
    secciones: PanelNavSeccion[];
    nombreUsuario: string;
    rolEtiqueta: string;
    onLogout: () => void;
}

const ESTILOS_ACCENT = {
    blue: {
        logoBg: "bg-blue-600",
        subtitulo: "text-blue-600 dark:text-blue-400",
        headerBadge: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
        rolText: "text-purple-600 dark:text-purple-400",
        navActivo:
            "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-blue-200/50 dark:border-blue-800/40",
    },
    emerald: {
        logoBg: "bg-emerald-600",
        subtitulo: "text-emerald-600 dark:text-emerald-400",
        headerBadge: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
        rolText: "text-emerald-600 dark:text-emerald-400",
        navActivo:
            "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs border border-emerald-200/50 dark:border-emerald-800/40",
    },
} as const;

/**
 * Shell compartido y responsivo para los paneles Admin y Almacén.
 * - PC (lg+): barra lateral sticky persistente.
 * - Móvil / Tablet (< lg): menú lateral desplegable (drawer) con botón hamburguesa, backdrop y tecla Escape.
 */
export function PanelLayout({
    accent,
    brandSubtitulo,
    headerTitulo,
    headerBadge,
    secciones,
    nombreUsuario,
    rolEtiqueta,
    onLogout,
}: PanelLayoutProps) {
    const navigate = useNavigate();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const paleta = ESTILOS_ACCENT[accent];

    useEffect(() => {
        if (!menuAbierto) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuAbierto(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [menuAbierto]);

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
            isActive
                ? paleta.navActivo
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
        }`;

    const iconBtnClass =
        "w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0";

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors overflow-x-hidden">
            {/* Backdrop oscuro en móvil/tablet cuando el menú desplegable está abierto */}
            {menuAbierto && (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
                    onClick={() => setMenuAbierto(false)}
                    aria-hidden="true"
                />
            )}

            {/* Barra lateral: drawer desplegable en < lg y sticky fija en >= lg */}
            <aside
                aria-label={`Menú de ${headerTitulo}`}
                className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 transform transition-transform duration-200 ease-out shadow-2xl lg:shadow-none lg:static lg:w-64 lg:shrink-0 lg:h-screen lg:sticky lg:top-0 lg:z-40 lg:translate-x-0 ${
                    menuAbierto ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Cabecera del sidebar + botón cerrar en móvil/tablet */}
                <div className="shrink-0 flex items-center justify-between gap-2 px-1 py-1">
                    <button
                        type="button"
                        className="flex items-center gap-2.5 px-2 py-1 cursor-pointer group text-left min-w-0"
                        onClick={() => {
                            setMenuAbierto(false);
                            navigate("/inicio");
                        }}
                    >
                        <div className={`w-8 h-8 rounded-lg ${paleta.logoBg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <span className="block text-base font-black tracking-tight text-slate-900 dark:text-white truncate">
                                TechStore
                            </span>
                            <span className={`block text-[10px] font-bold uppercase tracking-widest truncate ${paleta.subtitulo}`}>
                                {brandSubtitulo}
                            </span>
                        </div>
                    </button>

                    <button
                        type="button"
                        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => setMenuAbierto(false)}
                        aria-label="Cerrar menú lateral"
                    >
                        ✕
                    </button>
                </div>

                {/* Zona de navegación con scroll interno independiente */}
                <div className="flex-1 overflow-y-auto space-y-4 py-3 min-h-0">
                    {secciones.map((seccion, idx) => (
                        <div
                            key={seccion.titulo}
                            className={idx > 0 ? "pt-2 border-t border-slate-200 dark:border-slate-800" : ""}
                        >
                            <span className="block text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-3 mb-2">
                                {seccion.titulo}
                            </span>
                            <nav className="space-y-1">
                                {seccion.items.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        className={linkClass}
                                        onClick={() => setMenuAbierto(false)}
                                    >
                                        {item.icono}
                                        <span className="truncate">{item.label}</span>
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* Perfil inferior en sidebar: siempre visible */}
                <div className="shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="px-1 truncate">
                        <span className="block font-bold truncate text-slate-900 dark:text-white text-xs leading-tight">
                            {nombreUsuario}
                        </span>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${paleta.rolText}`}>
                            {rolEtiqueta}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setMenuAbierto(false);
                            onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 transition-all cursor-pointer shadow-2xs"
                        title="Cerrar sesión"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 px-3.5 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 sticky top-0 z-30">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <button
                            type="button"
                            className={`${iconBtnClass} lg:hidden`}
                            onClick={() => setMenuAbierto(true)}
                            aria-label="Abrir menú lateral"
                            aria-expanded={menuAbierto}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {headerTitulo}
                        </strong>
                        <span className={`hidden sm:inline-block shrink-0 px-2 py-0.5 rounded text-[11px] font-bold ${paleta.headerBadge}`}>
                            {headerBadge}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <ThemeToggle />
                        <button
                            type="button"
                            className={iconBtnClass}
                            onClick={() => navigate("/mi-cuenta")}
                            title="Mi cuenta"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                            onClick={onLogout}
                            title="Cerrar sesión"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default PanelLayout;

