import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle";

// Estructura del área de Almacén: barra lateral fija + contenido.
// Las subpáginas (Dashboard, Productos, Entradas, Kardex) se muestran en <Outlet />.
function AlmacenLayout() {
    const navigate = useNavigate();
    const { usuario, logout } = useAuth();

    // Solo Almacén y Admin pueden entrar aquí
    if (!usuario || (usuario.rol !== "almacen" && usuario.rol !== "admin")) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl font-bold">
                    !
                </div>
                <h1 className="text-2xl font-black">Acceso denegado</h1>
                <p className="text-sm text-slate-500 max-w-xs">Ingresa con la cuenta de operador de almacén (almacen / 123).</p>
                <button
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
                    onClick={() => navigate("/login")}
                >
                    Ir al login
                </button>
            </div>
        );
    }

    const salir = () => {
        logout();
        navigate("/inicio");
    };

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
            isActive
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs border border-emerald-200/50 dark:border-emerald-800/40"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
        }`;

    const iconBtnClass =
        "w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-xs";

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            {/* Barra lateral fija y persistente (h-screen sticky top-0) */}
            <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 z-40">
                {/* Cabecera del sidebar */}
                <button
                    className="shrink-0 flex items-center gap-2.5 px-3 py-2 cursor-pointer group text-left"
                    onClick={() => navigate("/inicio")}
                >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                    </div>
                    <div>
                        <span className="block text-base font-black tracking-tight text-slate-900 dark:text-white">TechStore</span>
                        <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Almacén Hub</span>
                    </div>
                </button>

                {/* Zona con scroll independiente para menús */}
                <div className="flex-1 overflow-y-auto space-y-4 py-3 min-h-0">
                    <div>
                        <span className="block text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-3 mb-2">
                            INVENTARIO &amp; KARDEX
                        </span>

                        <nav className="space-y-1">
                            <NavLink to="/almacen" end className={linkClass}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                </svg>
                                Dashboard
                            </NavLink>
                            <NavLink to="/almacen/productos" className={linkClass}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                                    <line x1="3" y1="8" x2="12" y2="13" />
                                    <line x1="12" y1="13" x2="21" y2="8" />
                                    <line x1="12" y1="13" x2="12" y2="21" />
                                </svg>
                                Stock de Productos
                            </NavLink>
                            <NavLink to="/almacen/entradas" className={linkClass}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="16" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                Registrar entrada
                            </NavLink>
                            <NavLink to="/almacen/kardex" className={linkClass}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                                Kardex Físico
                            </NavLink>
                            <NavLink to="/almacen/despachos" className={linkClass}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="3" width="15" height="13" rx="2" />
                                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                    <circle cx="5.5" cy="18.5" r="2.5" />
                                    <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                                Despachos y Envíos
                            </NavLink>
                        </nav>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="block text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-3 mb-2">
                            ACCESOS
                        </span>

                        <nav className="space-y-1">
                            <NavLink to="/inicio" className={linkClass}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                Ver tienda pública
                            </NavLink>
                        </nav>
                    </div>
                </div>

                {/* Perfil inferior en sidebar: SIEMPRE VISIBLE (shrink-0), nunca se oculta */}
                <div className="shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="px-1 truncate">
                        <span className="block font-bold truncate text-slate-900 dark:text-white text-xs leading-tight">
                            {usuario.nombre}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                            {usuario.rol === "admin" ? "ADMINISTRADOR (ALMACÉN)" : "LOGÍSTICA & ALMACÉN"}
                        </span>
                    </div>
                    <button
                        onClick={salir}
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
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <header className="h-16 px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">Panel de Almacén</strong>
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            Kardex Valorado
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button className={iconBtnClass} onClick={() => navigate("/mi-cuenta")} title="Mi cuenta">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </button>
                        <button
                            className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                            onClick={salir}
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

                <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AlmacenLayout;
