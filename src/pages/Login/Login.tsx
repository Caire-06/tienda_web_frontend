import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Rol } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle";

// A dónde va cada rol después de ingresar
const RUTA_POR_ROL: Record<Rol, string> = {
    admin: "/admin",
    almacen: "/almacen",
    cliente: "/inicio",
};

function Login() {
    const [acceso, setAcceso] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [segundosRestantes, setSegundosRestantes] = useState(0);
    const [bloqueadoHasta, setBloqueadoHasta] = useState<number | null>(null);
    const bloqueado = segundosRestantes > 0;

    useEffect(() => {
        if (bloqueadoHasta === null) return;
        const actualizar = () => {
            const restantes = Math.max(0, Math.ceil((bloqueadoHasta - Date.now()) / 1000));
            setSegundosRestantes(restantes);
            if (restantes === 0) {
                setBloqueadoHasta(null);
                setError("");
            }
        };
        actualizar();
        const intervalo = window.setInterval(actualizar, 250);
        return () => window.clearInterval(intervalo);
    }, [bloqueadoHasta]);
    const [cargando, setCargando] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    async function iniciarSesion(e: SubmitEvent) {
        e.preventDefault();
        setError("");

        if (bloqueado) return;

        if (acceso.trim() === "") {
            setError("Ingresa tu usuario o correo");
            return;
        }
        if (password === "") {
            setError("Ingresa tu contraseña");
            return;
        }

        setCargando(true);
        const res = await login(acceso, password);
        setCargando(false);

        if (!res.ok || !res.usuario) {
            if (res.bloqueado && (res.segundosEspera ?? 0) > 0) {
                const segundos = Math.ceil(res.segundosEspera!);
                setSegundosRestantes(segundos);
                setBloqueadoHasta(Date.now() + segundos * 1000);
            }
            setError(res.error ?? "No se pudo iniciar sesión");
            return;
        }

        // Redirige según el rol del usuario que acaba de ingresar
        navigate(RUTA_POR_ROL[res.usuario.rol]);
    }

    // Rellena el formulario con una cuenta demo
    function usarDemo(usuario: string) {
        setAcceso(usuario);
        setPassword("123");
        setError("");
    }

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative transition-colors">
            {/* Theme Toggle flotante */}
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            {/* Lado izquierdo - Imagen Hero (Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
                    alt="Imagen de la tienda"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-12 text-white">
                    <span className="text-blue-400 font-bold tracking-wider text-xs uppercase mb-2">
                        Plataforma Full Stack
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-white">
                        TechStore San Juan de Lurigancho
                    </h2>
                    <p className="text-slate-300 text-sm max-w-md leading-relaxed">
                        Tu tienda minorista de tecnología: laptops, pantallas, periféricos y control logístico en tiempo real con trazabilidad Kardex.
                    </p>
                </div>
            </div>

            {/* Lado derecho - Formulario Login */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-6">
                    {/* Logo & Header */}
                    <div className="text-center sm:text-left space-y-2">
                        <button
                            className="inline-flex items-center gap-2.5 cursor-pointer group"
                            onClick={() => navigate("/inicio")}
                        >
                            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-5 h-5"
                                >
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                TechStore
                            </span>
                        </button>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-2">
                            Iniciar sesión
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Bienvenido de vuelta. Ingresa a tu cuenta para continuar.
                        </p>
                    </div>

                    {/* Tarjeta de Formulario */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                        <form className="space-y-4" onSubmit={iniciarSesion}>
                            {/* Usuario o correo */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Usuario o correo
                                </label>
                                <input
                                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    type="text"
                                    value={acceso}
                                    disabled={bloqueado || cargando}
                                    onChange={(e) => setAcceso(e.target.value)}
                                    placeholder="admin, almacen o tu correo"
                                />
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Contraseña
                                </label>
                                <input
                                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    type="password"
                                    value={password}
                                    disabled={bloqueado || cargando}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>{bloqueado
                                        ? `Demasiados intentos. Vuelve a intentarlo en ${segundosRestantes} segundo(s).`
                                        : error}</span>
                                </div>
                            )}

                            {/* Botón Submit */}
                            <button
                                type="submit"
                                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-sm hover:shadow transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={bloqueado || cargando}
                            >
                                {cargando ? "Verificando credenciales..." : "Iniciar sesión"}
                            </button>
                        </form>

                        {/* Cuentas Demo Rápidas */}
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                Cuentas de prueba (clic para usar)
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => usarDemo("admin")}
                                    className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                                >
                                    Admin / 123
                                </button>
                                <button
                                    type="button"
                                    onClick={() => usarDemo("almacen")}
                                    className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                                >
                                    Almacén / 123
                                </button>
                                <button
                                    type="button"
                                    onClick={() => usarDemo("cliente")}
                                    className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                                >
                                    Cliente / 123
                                </button>
                            </div>
                        </div>

                        {/* Link a Registro */}
                        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            ¿No tienes cuenta?{" "}
                            <button
                                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 cursor-pointer"
                                onClick={() => navigate("/register")}
                            >
                                Registrarse
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
