import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import IndicadorSeguridadPassword from "../IndicadorSeguridadPassword/IndicadorSeguridadPassword";
import { restablecerPasswordApi, solicitarRecuperacionApi } from "../../services/authApi";
import { esCorreoValido } from "../../utils/validaciones";

interface PanelRecuperarPasswordProps {
    correoInicial?: string;
    onVolver: () => void;
    onExito: (mensaje: string) => void;
}

function PanelRecuperarPassword({ correoInicial = "", onVolver, onExito }: PanelRecuperarPasswordProps) {
    const [paso, setPaso] = useState<"solicitar" | "confirmar">("solicitar");
    const [correo, setCorreo] = useState(correoInicial.includes("@") ? correoInicial.trim() : "");
    const [codigo, setCodigo] = useState("");
    const [nuevaContrasena, setNuevaContrasena] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [verPass, setVerPass] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [cooldownReenvio, setCooldownReenvio] = useState(0);

    useEffect(() => {
        if (cooldownReenvio <= 0) return;
        const timer = window.setInterval(() => {
            setCooldownReenvio((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [cooldownReenvio]);

    async function enviarCodigo() {
        setError("");
        setInfo("");
        if (!esCorreoValido(correo)) {
            setError("Ingresa un correo electrónico válido.");
            return false;
        }
        setCargando(true);
        try {
            const { ok, data } = await solicitarRecuperacionApi(correo.trim().toLowerCase());
            if (!ok) {
                setError(data.error || "No se pudo procesar la solicitud.");
                return false;
            }
            setInfo(data.mensaje || "Si el correo está registrado, recibirás un código de 6 dígitos.");
            setCooldownReenvio(45);
            return true;
        } catch {
            setError("No hay conexión con el servidor.");
            return false;
        } finally {
            setCargando(false);
        }
    }

    async function manejarSolicitud(e: FormEvent) {
        e.preventDefault();
        const enviado = await enviarCodigo();
        if (enviado) setPaso("confirmar");
    }

    async function manejarRestablecimiento(e: FormEvent) {
        e.preventDefault();
        setError("");
        const otp = codigo.replace(/\D/g, "");
        if (otp.length !== 6) {
            setError("Ingresa el código de 6 dígitos enviado a tu correo.");
            return;
        }
        if (nuevaContrasena.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (nuevaContrasena !== confirmar) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setCargando(true);
        try {
            const { ok, data } = await restablecerPasswordApi(
                correo.trim().toLowerCase(),
                otp,
                nuevaContrasena
            );
            if (!ok) {
                setError(data.error || "No se pudo restablecer la contraseña.");
                return;
            }
            onExito(data.mensaje || "Tu contraseña ha sido restablecida. Ya puedes iniciar sesión.");
        } catch {
            setError("No hay conexión con el servidor.");
        } finally {
            setCargando(false);
        }
    }

    const inputClass =
        "w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

    if (paso === "solicitar") {
        return (
            <form onSubmit={manejarSolicitud} className="space-y-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recuperar contraseña</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ingresa el correo asociado a tu cuenta y te enviaremos un código de 6 dígitos.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Correo electrónico
                    </label>
                    <input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="tu-correo@ejemplo.com"
                        className={inputClass}
                        disabled={cargando}
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={cargando}
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
                >
                    {cargando ? "Enviando código..." : "Enviar código por correo"}
                </button>

                <button
                    type="button"
                    onClick={onVolver}
                    className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                    Volver a iniciar sesión
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={manejarRestablecimiento} className="space-y-4">
            <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ingresa el código y tu nueva clave</h2>
                {info && <p className="text-xs text-emerald-600 dark:text-emerald-400">{info}</p>}
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Código de 6 dígitos
                </label>
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className={`${inputClass} text-center font-mono text-lg font-bold tracking-[0.35em]`}
                    disabled={cargando}
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Nueva contraseña
                </label>
                <div className="relative">
                    <input
                        type={verPass ? "text" : "password"}
                        value={nuevaContrasena}
                        onChange={(e) => setNuevaContrasena(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className={`${inputClass} pr-16`}
                        disabled={cargando}
                    />
                    <button
                        type="button"
                        onClick={() => setVerPass((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 cursor-pointer"
                    >
                        {verPass ? "Ocultar" : "Ver"}
                    </button>
                </div>
                <IndicadorSeguridadPassword password={nuevaContrasena} />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Confirmar nueva contraseña
                </label>
                <input
                    type={verPass ? "text" : "password"}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className={inputClass}
                    disabled={cargando}
                />
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={cargando}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
                {cargando ? "Actualizando contraseña..." : "Restablecer contraseña"}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
                <button
                    type="button"
                    disabled={cooldownReenvio > 0 || cargando}
                    onClick={() => {
                        void enviarCodigo();
                    }}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                    {cooldownReenvio > 0 ? `Reenviar en ${cooldownReenvio}s` : "Reenviar código"}
                </button>
                <button
                    type="button"
                    onClick={onVolver}
                    className="font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                    Volver al login
                </button>
            </div>
        </form>
    );
}

export default PanelRecuperarPassword;

