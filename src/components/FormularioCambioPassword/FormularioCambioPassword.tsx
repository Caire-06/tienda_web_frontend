import { useState } from "react";
import { cambiarPasswordPerfil } from "../../services/usuariosApi";
import IndicadorSeguridadPassword from "../IndicadorSeguridadPassword/IndicadorSeguridadPassword";

interface FormularioCambioPasswordProps {
    token: string;
    onExito: (mensaje: string) => void;
    onCancelar?: () => void;
    labelCancelar?: string;
    labelActual?: string;
    submitLabel?: string;
}

function FormularioCambioPassword({
    token,
    onExito,
    onCancelar,
    labelCancelar = "Cancelar",
    labelActual = "Contraseña actual",
    submitLabel = "Actualizar contraseña",
}: FormularioCambioPasswordProps) {
    const [actual, setActual] = useState("");
    const [nueva, setNueva] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [mostrar, setMostrar] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const inputClass =
        "w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const nuevaLimpia = nueva.trim();
        if (!actual) {
            setError("Ingresa tu contraseña actual.");
            return;
        }
        if (nuevaLimpia.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (nuevaLimpia !== confirmar.trim()) {
            setError("Las nuevas contraseñas no coinciden.");
            return;
        }
        if (nuevaLimpia === actual) {
            setError("La nueva contraseña debe ser diferente a la actual.");
            return;
        }
        setGuardando(true);
        try {
            const msg = await cambiarPasswordPerfil(token, actual, nuevaLimpia);
            setActual("");
            setNueva("");
            setConfirmar("");
            onExito(msg);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar la contraseña.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {labelActual} *
                </label>
                <input
                    required
                    type={mostrar ? "text" : "password"}
                    className={inputClass}
                    placeholder="Ingresa tu contraseña actual"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nueva contraseña *
                    </label>
                    <input
                        required
                        minLength={6}
                        type={mostrar ? "text" : "password"}
                        className={inputClass}
                        placeholder="Mínimo 6 caracteres"
                        value={nueva}
                        onChange={(e) => setNueva(e.target.value)}
                    />
                    <IndicadorSeguridadPassword password={nueva} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirmar nueva *
                    </label>
                    <input
                        required
                        minLength={6}
                        type={mostrar ? "text" : "password"}
                        className={inputClass}
                        placeholder="Repite la contraseña"
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                    />
                </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={mostrar}
                    onChange={(e) => setMostrar(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700"
                />
                Mostrar contraseñas
            </label>

            {error && (
                <div
                    role="alert"
                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-700 dark:text-red-300"
                >
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
                {onCancelar && (
                    <button
                        type="button"
                        onClick={onCancelar}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                        {labelCancelar}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={guardando}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                    {guardando ? "Actualizando..." : submitLabel}
                </button>
            </div>
        </form>
    );
}

export default FormularioCambioPassword;
