import { useNavigate, useLocation } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { totalItems } = useCarrito();
    const { usuario, logout } = useAuth();

    const pathname = location.pathname;
    const isInicio = pathname === "/" || pathname === "/inicio";
    const isProductos = pathname === "/productos" || pathname.startsWith("/producto/");
    const isContactanos = pathname === "/contactanos";
    const isAdmin = pathname.startsWith("/admin");
    const isAlmacen = pathname.startsWith("/almacen");

    const salir = () => {
        logout();
        navigate("/inicio");
    };

    const navButtonClass = (active: boolean) =>
        `px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
            active
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }`;

    const actionButtonClass =
        "relative inline-flex items-center justify-center w-[38px] h-[38px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer shadow-xs";

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <button
                    className="flex items-center gap-2.5 text-left cursor-pointer group"
                    onClick={() => navigate("/inicio")}
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
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
                    <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-sans">
                        TechStore
                    </span>
                </button>

                {/* Navegación */}
                <nav className="hidden md:flex items-center gap-1">
                    <button className={navButtonClass(isInicio)} onClick={() => navigate("/inicio")}>
                        Inicio
                    </button>
                    <button className={navButtonClass(isProductos)} onClick={() => navigate("/productos")}>
                        Productos
                    </button>
                    <button className={navButtonClass(isContactanos)} onClick={() => navigate("/contactanos")}>
                        Contáctanos
                    </button>
                    {usuario?.rol === "admin" && (
                        <button className={navButtonClass(isAdmin)} onClick={() => navigate("/admin")}>
                            Panel Admin
                        </button>
                    )}
                    {usuario?.rol === "almacen" && (
                        <button className={navButtonClass(isAlmacen)} onClick={() => navigate("/almacen")}>
                            Almacén
                        </button>
                    )}
                </nav>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />

                    {/* Carrito */}
                    <button
                        className={actionButtonClass}
                        onClick={() => navigate("/carrito")}
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
                            className="inline-flex items-center gap-1.5 px-3.5 h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
                            onClick={() => navigate("/login")}
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
                            Ingresar
                        </button>
                    ) : (
                        <>
                            <button
                                className={actionButtonClass}
                                onClick={() => navigate("/mis-compras")}
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
                                className={actionButtonClass}
                                onClick={() => navigate("/mi-cuenta")}
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
                                className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/50 dark:border-red-900/40 transition-colors cursor-pointer"
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
        </header>
    );
}

export default Header;
