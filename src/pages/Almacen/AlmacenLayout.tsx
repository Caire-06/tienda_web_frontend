import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PanelLayout, { type PanelNavSeccion } from "../../components/PanelLayout/PanelLayout";

// Estructura del área de Almacén: barra lateral responsiva + contenido (<Outlet />).
function AlmacenLayout() {
    const navigate = useNavigate();
    const { usuario, logout } = useAuth();

    // Si está logueado pero sin permisos de almacén o admin, redirigir directamente al inicio
    if (usuario && usuario.rol !== "almacen" && usuario.rol !== "admin") {
        return <Navigate to="/inicio" replace />;
    }

    // Si no ha iniciado sesión, mostrar aviso para ir al login
    if (!usuario) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl font-bold">
                    !
                </div>
                <h1 className="text-2xl font-black">Acceso denegado</h1>
                <p className="text-sm text-slate-500 max-w-xs">Ingresa con la cuenta de operador de almacén o administrador.</p>
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

    const accesos = [
        {
            to: "/inicio",
            label: "Ver tienda pública",
            icono: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
            ),
        },
        ...(usuario.rol === "admin"
            ? [
                  {
                      to: "/admin",
                      label: "Panel de Admin",
                      icono: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                      ),
                  },
              ]
            : []),
    ];

    const secciones: PanelNavSeccion[] = [
        {
            titulo: "INVENTARIO & KARDEX",
            items: [
                {
                    to: "/almacen",
                    end: true,
                    label: "Dashboard",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                    ),
                },
                {
                    to: "/almacen/productos",
                    label: "Stock de Productos",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                            <line x1="3" y1="8" x2="12" y2="13" />
                            <line x1="12" y1="13" x2="21" y2="8" />
                            <line x1="12" y1="13" x2="12" y2="21" />
                        </svg>
                    ),
                },
                {
                    to: "/almacen/entradas",
                    label: "Registrar entrada",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                    ),
                },
                {
                    to: "/almacen/kardex",
                    label: "Kardex Físico",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                    ),
                },
                {
                    to: "/almacen/despachos",
                    label: "Despachos y Envíos",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" rx="2" />
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                    ),
                },
            ],
        },
        {
            titulo: "ACCESOS",
            items: accesos,
        },
    ];

    return (
        <PanelLayout
            accent="emerald"
            brandSubtitulo="Almacén Hub"
            headerTitulo="Panel de Almacén"
            headerBadge="Kardex Valorado"
            secciones={secciones}
            nombreUsuario={usuario.nombre}
            rolEtiqueta={usuario.rol === "admin" ? "ADMINISTRADOR (ALMACÉN)" : "LOGÍSTICA & ALMACÉN"}
            onLogout={salir}
        />
    );
}

export default AlmacenLayout;
