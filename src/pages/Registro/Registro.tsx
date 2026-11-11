import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle";
import IndicadorSeguridadPassword from "../../components/IndicadorSeguridadPassword/IndicadorSeguridadPassword";
import PanelVerificacionCodigo from "../../components/PanelVerificacionCodigo/PanelVerificacionCodigo";
import { esCorreoValido, limpiarSoloLetras } from "../../utils/validaciones";

function Registro() {
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [correo, setCorreo] = useState("");
    const [direccion, setDireccion] = useState("");
    const [password, setPassword] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [verPass, setVerPass] = useState(false);
    const [terminos, setTerminos] = useState(false);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [creada, setCreada] = useState(false);
    const [desafio, setDesafio] = useState<{ token: string; correoDestino: string } | null>(null);
    const [verificandoOtp, setVerificandoOtp] = useState(false);
    const [errorOtp, setErrorOtp] = useState("");

    const navigate = useNavigate();
    const { usuario, registro, verificarCorreo, reenviarCodigo } = useAuth();

    // Si ya inició sesión, redirigir directamente sin permitir volver a registrarse
    if (usuario && !creada) {
        const ruta = usuario.rol === "admin" ? "/admin" : usuario.rol === "almacen" ? "/almacen" : "/inicio";
        return <Navigate to={ruta} replace />;
    }

    async function registrarse(e: FormEvent) {
        e.preventDefault();
        setError("");

        if (nombre.trim().length < 2) {
            setError("Ingresa tu nombre");
            return;
        }
        if (apellido.trim().length < 2) {
            setError("Ingresa tu apellido");
            return;
        }
        if (!esCorreoValido(correo)) {
            setError("Ingresa un correo electrónico válido");
            return;
        }
        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        if (password !== confirmar) {
            setError("Las contraseñas no coinciden");
            return;
        }
        if (!terminos) {
            setError("Acepta los términos y condiciones");
            return;
        }

        setCargando(true);
        try {
            const res = await registro({
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                correo: correo.trim(),
                direccion: direccion.trim(),
                password,
            });

            if (res.requiereVerificacionCorreo && res.desafioToken) {
                setErrorOtp("");
                setDesafio({
                    token: res.desafioToken,
                    correoDestino: res.correoDestino || correo.trim().toLowerCase(),
                });
                return;
            }

            if (!res.ok) {
                setError(res.error || "Error al registrar la cuenta.");
                return;
            }

            setCreada(true);
        } catch {
            setError("Ocurrió un error inesperado al registrarte.");
        } finally {
            setCargando(false);
        }
    }

    async function confirmarCodigoRegistro(codigo: string) {
        if (!desafio) return;
        setErrorOtp("");
        setVerificandoOtp(true);
        const res = await verificarCorreo(desafio.token, codigo);
        setVerificandoOtp(false);
        if (!res.ok) {
            setErrorOtp(res.error || "El código ingresado no es válido.");
            return;
        }
        setDesafio(null);
        setCreada(true);
    }

    async function reenviarCodigoRegistro() {
        if (!desafio) return { ok: false, error: "Sesión de verificación no disponible." };
        const res = await reenviarCodigo(desafio.token);
        if (res.ok && res.desafioToken) {
            setDesafio({
                token: res.desafioToken,
                correoDestino: res.correoDestino || desafio.correoDestino,
            });
        }
        return res;
    }

    const inputClass =
        "w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative transition-colors">
            {/* Theme Toggle flotante */}
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            {/* Lado izquierdo - Beneficios (Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&auto=format&fit=crop"
                    alt="Tecnología TechStore"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-12 text-white">
                    <span className="text-blue-400 font-bold tracking-wider text-xs uppercase mb-2">
                        Comunidad TechStore
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-white">
                        Únete a TechStore
                    </h2>
                    <p className="text-slate-300 text-sm max-w-md leading-relaxed mb-6">
                        Crea tu cuenta y compra laptops, periféricos, audio y pantallas con trazabilidad completa.
                    </p>

                    <ul className="space-y-3 text-sm text-slate-200">
                        <li className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">✓</span>
                            Envío gratis desde S/ 499
                        </li>
                        <li className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">✓</span>
                            Pago 100% seguro con comprobante SUNAT
                        </li>
                        <li className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">✓</span>
                            Garantía de fábrica en todos los productos
                        </li>
                    </ul>
                </div>
            </div>

            {/* Lado derecho - Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-lg space-y-6">
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
                            Crear cuenta
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Empieza a comprar en minutos. Completa tus datos.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                        {creada ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl font-bold">
                                    ✓
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    ¡Cuenta creada, {nombre.split(" ")[0]}!
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                    Ya puedes entrar a la tienda y armar tu carrito de compras.
                                </p>
                                <button
                                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
                                    onClick={() => navigate("/inicio")}
                                >
                                    Entrar a la tienda
                                </button>
                            </div>
                        ) : desafio ? (
                            <PanelVerificacionCodigo
                                titulo="Verifica tu correo electrónico"
                                subtitulo="Ingresa el código de 6 dígitos que enviamos a:"
                                correoDestino={desafio.correoDestino}
                                textoBoton="Verificar y activar cuenta"
                                errorExterno={errorOtp}
                                cargando={verificandoOtp}
                                onVerificar={confirmarCodigoRegistro}
                                onReenviar={reenviarCodigoRegistro}
                                onCancelar={() => {
                                    setDesafio(null);
                                    setErrorOtp("");
                                }}
                                textoCancelar="Volver al formulario"
                            />
                        ) : (
                            <form className="space-y-4" onSubmit={registrarse}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Nombre
                                        </label>
                                        <input
                                            className={inputClass}
                                            type="text"
                                            value={nombre}
                                            onChange={(e) => setNombre(limpiarSoloLetras(e.target.value, 80))}
                                            placeholder="Juan"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Apellido
                                        </label>
                                        <input
                                            className={inputClass}
                                            type="text"
                                            value={apellido}
                                            onChange={(e) => setApellido(limpiarSoloLetras(e.target.value, 80))}
                                            placeholder="Pérez"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Correo electrónico
                                    </label>
                                    <input
                                        className={inputClass}
                                        type="email"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Dirección
                                    </label>
                                    <input
                                        className={inputClass}
                                        type="text"
                                        value={direccion}
                                        onChange={(e) => setDireccion(e.target.value)}
                                        placeholder="Av. Los Olivos 456, San Juan de Lurigancho"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <input
                                            className={`${inputClass} pr-16`}
                                            type={verPass ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 cursor-pointer"
                                            onClick={() => setVerPass((v) => !v)}
                                        >
                                            {verPass ? "Ocultar" : "Ver"}
                                        </button>
                                    </div>

                                    <IndicadorSeguridadPassword password={password} />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Confirmar contraseña
                                    </label>
                                    <input
                                        className={inputClass}
                                        type={verPass ? "text" : "password"}
                                        value={confirmar}
                                        onChange={(e) => setConfirmar(e.target.value)}
                                        placeholder="Repite tu contraseña"
                                    />
                                </div>

                                <label className="flex items-center gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={terminos}
                                        onChange={(e) => setTerminos(e.target.checked)}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>
                                        Acepto los{" "}
                                        <Link
                                            to="/terminos-y-condiciones"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                        >
                                            términos y condiciones
                                        </Link>{" "}
                                        y la{" "}
                                        <Link
                                            to="/politica-de-privacidad"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                        >
                                            política de privacidad
                                        </Link>{" "}
                                        de TechStore
                                    </span>
                                </label>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={cargando}
                                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {cargando ? "Creando cuenta..." : "Crear cuenta"}
                                </button>
                            </form>
                        )}

                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                            ¿Ya tienes cuenta?{" "}
                            <button
                                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 cursor-pointer"
                                onClick={() => navigate("/login")}
                            >
                                Iniciar sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Registro;
