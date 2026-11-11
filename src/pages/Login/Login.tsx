import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Rol } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle";
import PanelVerificacionCodigo from "../../components/PanelVerificacionCodigo/PanelVerificacionCodigo";
import PanelRecuperarPassword from "../../components/PanelRecuperarPassword/PanelRecuperarPassword";

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
    const [vista, setVista] = useState<"login" | "otp" | "recuperar">("login");
    const [desafioOtp, setDesafioOtp] = useState<{
        token: string;
        correoDestino: string;
        modo: "2fa" | "correo";
    } | null>(null);
    const [errorOtp, setErrorOtp] = useState("");
    const [avisoExito, setAvisoExito] = useState("");

    const navigate = useNavigate();
    const { usuario, login, verificar2fa, verificarCorreo, reenviarCodigo } = useAuth();

    // Si el usuario ya inició sesión, restringir el acceso al login y redirigir según su rol
    if (usuario) {
        return <Navigate to={RUTA_POR_ROL[usuario.rol] || "/inicio"} replace />;
    }

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

        setAvisoExito("");
        setCargando(true);
        const res = await login(acceso, password);
        setCargando(false);

        if (res.requiere2fa && res.desafioToken) {
            setErrorOtp("");
            setDesafioOtp({
                token: res.desafioToken,
                correoDestino: res.correoDestino || "",
                modo: "2fa",
            });
            setVista("otp");
            return;
        }

        if (res.requiereVerificacionCorreo && res.desafioToken) {
            setErrorOtp("");
            setDesafioOtp({
                token: res.desafioToken,
                correoDestino: res.correoDestino || "",
                modo: "correo",
            });
            setVista("otp");
            return;
        }

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

    async function confirmarOtp(codigo: string) {
        if (!desafioOtp) return;
        setErrorOtp("");
        setCargando(true);
        const res =
            desafioOtp.modo === "2fa"
                ? await verificar2fa(desafioOtp.token, codigo)
                : await verificarCorreo(desafioOtp.token, codigo);
        setCargando(false);

        if (!res.ok || !res.usuario) {
            setErrorOtp(res.error || "El código ingresado no es válido.");
            return;
        }
        navigate(RUTA_POR_ROL[res.usuario.rol]);
    }

    async function reenviarOtp() {
        if (!desafioOtp) return { ok: false, error: "Sesión de verificación no disponible." };
        const res = await reenviarCodigo(desafioOtp.token);
        if (res.ok && res.desafioToken) {
            setDesafioOtp({
                ...desafioOtp,
                token: res.desafioToken,
                correoDestino: res.correoDestino || desafioOtp.correoDestino,
            });
        }
        return res;
    }

    // Rellena el formulario solo en entorno de desarrollo local (Vite elimina este bloque en build)
    function usarDemo(usuario: string) {
        if (!import.meta.env.DEV) return;
        setAcceso(usuario);
        const demoPass =
            usuario === "admin"
                ? (import.meta.env.VITE_DEMO_ADMIN_PASS as string | undefined) || ""
                : (import.meta.env.VITE_DEMO_USER_PASS as string | undefined) || "";
        if (demoPass) setPassword(demoPass);
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
                        {vista === "otp" && desafioOtp ? (
                            <PanelVerificacionCodigo
                                titulo={
                                    desafioOtp.modo === "2fa"
                                        ? "Verificación en dos pasos (2FA)"
                                        : "Verifica tu correo electrónico"
                                }
                                subtitulo={
                                    desafioOtp.modo === "2fa"
                                        ? "Ingresa el código de seguridad enviado a:"
                                        : "Tu cuenta aún requiere activar su correo. Ingresa el código enviado a:"
                                }
                                correoDestino={desafioOtp.correoDestino}
                                textoBoton="Confirmar e ingresar"
                                errorExterno={errorOtp}
                                cargando={cargando}
                                onVerificar={confirmarOtp}
                                onReenviar={reenviarOtp}
                                onCancelar={() => {
                                    setVista("login");
                                    setDesafioOtp(null);
                                    setErrorOtp("");
                                }}
                                textoCancelar="Cambiar usuario"
                            />
                        ) : vista === "recuperar" ? (
                            <PanelRecuperarPassword
                                correoInicial={acceso}
                                onVolver={() => setVista("login")}
                                onExito={(msg) => {
                                    setVista("login");
                                    setPassword("");
                                    setError("");
                                    setAvisoExito(msg);
                                }}
                            />
                        ) : (
                        <>
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
                                    placeholder="Ingresa tu usuario o correo"
                                />
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Contraseña
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError("");
                                            setAvisoExito("");
                                            setVista("recuperar");
                                        }}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <input
                                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    type="password"
                                    value={password}
                                    disabled={bloqueado || cargando}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            {avisoExito && (
                                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-400">
                                    {avisoExito}
                                </div>
                            )}

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

                        {/* Cuentas Demo Rápidas (solo visibles en modo desarrollo local, nunca en producción Render) */}
                        {import.meta.env.DEV && (
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                    Cuentas de prueba local (clic para usar)
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => usarDemo("admin")}
                                        className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                                    >
                                        Admin
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => usarDemo("almacen")}
                                        className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                                    >
                                        Almacén
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => usarDemo("cliente")}
                                        className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                                    >
                                        Cliente
                                    </button>
                                </div>
                            </div>
                        )}

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
                        </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
