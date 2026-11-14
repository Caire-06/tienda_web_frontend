import { useEffect, useState } from "react";
import type { FormEvent } from "react";

interface PanelVerificacionCodigoProps {
    titulo: string;
    subtitulo: string;
    correoDestino?: string;
    textoBoton: string;
    cooldownInicial?: number;
    errorExterno?: string;
    cargando?: boolean;
    onVerificar: (codigo: string) => Promise<void>;
    onReenviar: () => Promise<{ ok: boolean; error?: string; cooldownSegundos?: number }>;
    onCancelar?: () => void;
    textoCancelar?: string;
}

function PanelVerificacionCodigo({
    titulo,
    subtitulo,
    correoDestino,
    textoBoton,
    cooldownInicial = 45,
    errorExterno = "",
    cargando = false,
    onVerificar,
    onReenviar,
    onCancelar,
    textoCancelar = "Volver",
}: PanelVerificacionCodigoProps) {
    const [codigo, setCodigo] = useState("");
    const [errorLocal, setErrorLocal] = useState("");
    const [mensajeReenvio, setMensajeReenvio] = useState("");
    const [reenviando, setReenviando] = useState(false);
    const [segundosCooldown, setSegundosCooldown] = useState(cooldownInicial);

    useEffect(() => {
        if (segundosCooldown <= 0) return;
        const timer = window.setInterval(() => {
            setSegundosCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [segundosCooldown]);

    async function manejarSubmit(e: FormEvent) {
        e.preventDefault();
        setErrorLocal("");
        setMensajeReenvio("");
        const limpio = codigo.replace(/\D/g, "");
        if (limpio.length !== 6) {
            setErrorLocal("Ingresa los 6 dígitos del código enviado a tu correo.");
            return;
        }
        await onVerificar(limpio);
    }

    async function manejarReenvio() {
        if (segundosCooldown > 0 || reenviando) return;
        setErrorLocal("");
        setMensajeReenvio("");
        setReenviando(true);
        const res = await onReenviar();
        setReenviando(false);
        if (res.ok) {
            setCodigo("");
            setMensajeReenvio("Te enviamos un nuevo código de 6 dígitos. Revisa tu bandeja o spam.");
            setSegundosCooldown(res.cooldownSegundos ?? 45);
        } else {
            setErrorLocal(res.error || "No se pudo reenviar el código.");
        }
    }

    const errorMostrado = errorLocal || errorExterno;

    return (
        <form onSubmit={manejarSubmit} className="space-y-5">
            <div className="text-center space-y-1.5">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{titulo}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{subtitulo}</p>
                {correoDestino && (
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 break-all">
                        {correoDestino}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 text-center">
                    Código de verificación (6 dígitos)
                </label>
                <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center text-2xl sm:text-3xl font-mono font-bold tracking-[0.45em] pl-[0.45em] py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
            </div>

            {errorMostrado && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm text-center">
                    {errorMostrado}
                </div>
            )}

            {mensajeReenvio && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm text-center">
                    {mensajeReenvio}
                </div>
            )}

            <button
                type="submit"
                disabled={cargando || codigo.length !== 6}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-sm cursor-pointer"
            >
                {cargando ? "Verificando..." : textoBoton}
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm">
                <button
                    type="button"
                    disabled={segundosCooldown > 0 || reenviando}
                    onClick={manejarReenvio}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:text-slate-400 dark:disabled:text-slate-500 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                    {reenviando
                        ? "Reenviando..."
                        : segundosCooldown > 0
                        ? `Reenviar en ${segundosCooldown}s`
                        : "Reenviar código"}
                </button>

                {onCancelar && (
                    <button
                        type="button"
                        onClick={onCancelar}
                        className="font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                        {textoCancelar}
                    </button>
                )}
            </div>
        </form>
    );
}

export default PanelVerificacionCodigo;

