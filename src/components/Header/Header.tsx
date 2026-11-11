import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { totalItems } = useCarrito();
    const { usuario, logout } = useAuth();
    const [menuAbierto, setMenuAbierto] = useState(false);

    useEffect(() => {
        if (!menuAbierto) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuAbierto(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [menuAbierto]);

    const pathname = location.pathname;
    const isInicio = pathname === "/" || pathname === "/inicio";
    const isProductos =
        pathname === "/productos" ||
        pathname.startsWith("/productos/") ||
        pathname.startsWith("/producto/");
    const isContactanos = pathname === "/contactanos";
    const isAdmin = pathname.startsWith("/admin");
    const isAlmacen = pathname.startsWith("/almacen");
    const isMisCompras = pathname === "/mis-compras";
    const isMiCuenta = pathname === "/mi-cuenta";

    const irA = (ruta: string) => {
        setMenuAbierto(false);
        navigate(ruta);
    };

    const salir = () => {
        setMenuAbierto(false);
        logout();
        navigate("/inicio");
    };

    const navButtonClass = (active: boolean) =>
        `px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
            active
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }`;

    const mobileNavClass = (active: boolean) =>
        `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer text-left ${
            active
                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`;

    const actionButtonClass =
        "relative inline-flex items-center justify-center w-[38px] h-[38px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer shadow-xs shrink-0";

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
                {/* Izquierda: Menú hamburguesa móvil/tablet + Logo */}
                <div className="flex items-center gap-2 min-w-0">
                    <button
                        type="button"
                        className={`${actionButtonClass} md:hidden`}
                        onClick={() => setMenuAbierto((prev) => !prev)}
                        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={menuAbierto}
                    >
                        {menuAbierto ? (
                            <span className="text-base font-bold leading-none">✕</span>
                        ) : (
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        )}
                    </button>

                    <button
                        type="button"
                        className="flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer group min-w-0"
                        onClick={() => irA("/inicio")}
                    >
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                            <svg
                                width="18"
                                height="18"
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
                        <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-sans truncate">
                            TechStore
                        </span>
                    </button>
                </div>

                {/* Navegación Desktop (md+) */}
                <nav className="hidden md:flex items-center gap-1">
                    <button type="button" className={navButtonClass(isInicio)} onClick={() => irA("/inicio")}>
                        Inicio
                    </button>
                    <button type="button" className={navButtonClass(isProductos)} onClick={() => irA("/productos")}>
                        Productos
                    </button>
                    <button type="button" className={navButtonClass(isContactanos)} onClick={() => irA("/contactanos")}>
                        Contáctanos
                    </button>
                    {usuario?.rol === "admin" && (
                        <button type="button" className={navButtonClass(isAdmin)} onClick={() => irA("/admin")}>
                            Panel Admin
                        </button>
                    )}
                    {usuario?.rol === "almacen" && (
                        <button type="button" className={navButtonClass(isAlmacen)} onClick={() => irA("/almacen")}>
                            Almacén
                        </button>
                    )}
                </nav>

                {/* Acciones Derecha */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <ThemeToggle />

                    {/* Carrito */}
                    <button
                        type="button"
                        className={actionButtonClass}
                        onClick={() => irA("/carrito")}
                        title="Carrito"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        {totalItems > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md">
                                {totalItems}
                            </span>
                        )}
                    </button>

                    {/* Sesión: invitado */}
                    {!usuario ? (
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer shrink-0"
                            onClick={() => irA("/login")}
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>Ingresar</span>
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                className={`${actionButtonClass} hidden sm:inline-flex`}
                                onClick={() => irA("/mis-compras")}
                                title="Mis compras"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                className={actionButtonClass}
                                onClick={() => irA("/mi-cuenta")}
                                title={`Mi cuenta (${usuario.nombre})`}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                className="hidden sm:inline-flex p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/50 dark:border-red-900/40 transition-colors cursor-pointer shrink-0"
                                onClick={salir}
                                title="Cerrar sesión"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Menú Desplegable Móvil / Tablet (< md) */}
            {menuAbierto && (
                <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 space-y-1.5 shadow-lg">
                    <button type="button" className={mobileNavClass(isInicio)} onClick={() => irA("/inicio")}>
                        <span>Inicio</span>
                    </button>
                    <button type="button" className={mobileNavClass(isProductos)} onClick={() => irA("/productos")}>
                        <span>Productos</span>
                    </button>
                    <button type="button" className={mobileNavClass(isContactanos)} onClick={() => irA("/contactanos")}>
                        <span>Contáctanos</span>
                    </button>

                    {usuario?.rol === "admin" && (
                        <button type="button" className={mobileNavClass(isAdmin)} onClick={() => irA("/admin")}>
                            <span>Panel Admin</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                ADMIN
                            </span>
                        </button>
                    )}

                    {usuario?.rol === "almacen" && (
                        <button type="button" className={mobileNavClass(isAlmacen)} onClick={() => irA("/almacen")}>
                            <span>Almacén</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                KARDEX
                            </span>
                        </button>
                    )}

                    <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                        {usuario ? (
                            <>
                                <div className="px-3.5 py-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                                    Sesión: <strong className="text-slate-800 dark:text-slate-200">{usuario.nombre}</strong>
                                </div>
                                <button type="button" className={mobileNavClass(isMisCompras)} onClick={() => irA("/mis-compras")}>
                                    <span>Mis compras</span>
                                </button>
                                <button type="button" className={mobileNavClass(isMiCuenta)} onClick={() => irA("/mi-cuenta")}>
                                    <span>Mi cuenta</span>
                                </button>
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer text-left"
                                    onClick={salir}
                                >
                                    <span>Cerrar sesión</span>
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    type="button"
                                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center cursor-pointer transition-colors"
                                    onClick={() => irA("/login")}
                                >
                                    Iniciar sesión
                                </button>
                                <button
                                    type="button"
                                    className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-center cursor-pointer transition-colors"
                                    onClick={() => irA("/registro")}
                                >
                                    Registrarse
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
