import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PanelLayout, { type PanelNavSeccion } from "../../components/PanelLayout/PanelLayout";

// Estructura del área de Administrador: barra lateral responsiva + contenido (<Outlet />).
function AdminLayout() {
    const navigate = useNavigate();
    const { usuario, logout } = useAuth();

    // Si está logueado pero no tiene rol admin, redirigir directamente al inicio
    if (usuario && usuario.rol !== "admin") {
        return <Navigate to="/inicio" replace />;
    }

    // Si no ha iniciado sesión, mostrar aviso para ir al login
    if (!usuario) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-3xl font-bold">
                    !
                </div>
                <h1 className="text-2xl font-black">Acceso denegado</h1>
                <p className="text-sm text-slate-500 max-w-xs">Ingresa con la cuenta de administrador para acceder al panel.</p>
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

    const secciones: PanelNavSeccion[] = [
        {
            titulo: "ADMINISTRACIÓN",
            items: [
                {
                    to: "/admin",
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
                    to: "/admin/ventas",
                    label: "Ventas",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                    ),
                },
                {
                    to: "/admin/despachos",
                    label: "Despachos / Courier",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" rx="2" />
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                    ),
                },
                {
                    to: "/admin/productos",
                    label: "Productos",
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
                    to: "/admin/usuarios",
                    label: "Usuarios",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    ),
                },
                {
                    to: "/admin/reportes",
                    label: "Reportes",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    ),
                },
            ],
        },
        {
            titulo: "ACCESOS",
            items: [
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
                {
                    to: "/almacen",
                    label: "Módulo Almacén",
                    icono: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                            <line x1="3" y1="8" x2="12" y2="13" />
                            <line x1="12" y1="13" x2="21" y2="8" />
                            <line x1="12" y1="13" x2="12" y2="21" />
                        </svg>
                    ),
                },
            ],
        },
    ];

    return (
        <PanelLayout
            accent="blue"
            brandSubtitulo="Admin Hub"
            headerTitulo="Panel de Administración"
            headerBadge="TechStore Pro"
            secciones={secciones}
            nombreUsuario={usuario.nombre}
            rolEtiqueta="ADMINISTRADOR"
            onLogout={salir}
        />
    );
}

export default AdminLayout;
