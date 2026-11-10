import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import FormularioCambioPassword from "../FormularioCambioPassword/FormularioCambioPassword";

function AvisoCambioPassword() {
    const { usuario, token, marcarPasswordActualizada } = useAuth();
    const [usuarioPospuestoId, setUsuarioPospuestoId] = useState<string | null>(null);
    const [toastExito, setToastExito] = useState("");

    const pospuesto = Boolean(usuario?.id && usuarioPospuestoId === usuario.id);

    useEffect(() => {
        if (!toastExito) return;
        const timer = window.setTimeout(() => setToastExito(""), 4500);
        return () => window.clearTimeout(timer);
    }, [toastExito]);

    const requiere = Boolean(usuario?.requiereCambioPassword && token);

    const handleExito = (mensaje: string) => {
        marcarPasswordActualizada();
        setUsuarioPospuestoId(null);
        setToastExito(mensaje);
    };

    const posponer = () => setUsuarioPospuestoId(usuario?.id ?? null);
    const reabrir = () => setUsuarioPospuestoId(null);

    return (
        <>
            {requiere && pospuesto && (
                <div className="sticky top-0 z-40 bg-amber-50 dark:bg-amber-950/90 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-center gap-3 shadow-xs">
                    <span className="font-medium">
                        Tu cuenta fue creada por un administrador con una contraseña temporal. Por seguridad, actualízala.
                    </span>
                    <button
                        type="button"
                        onClick={reabrir}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition-colors"
                    >
                        Actualizar contraseña
                    </button>
                </div>
            )}

            {requiere && !pospuesto && token && (
                <div className="modal-fondo">
                    <div className="modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <span className="inline-block px-2 py-0.5 mb-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    Seguridad · Primer ingreso
                                </span>
                                <h2>Actualiza tu contraseña temporal</h2>
                            </div>
                            <button
                                type="button"
                                className="modal-cerrar"
                                onClick={posponer}
                                title="Recordar más tarde"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                            Tu cuenta (<strong className="font-mono">{usuario?.acceso}</strong>) fue registrada por el administrador con una contraseña autogenerada. Cambia tu contraseña ahora por una personal.
                        </p>

                        <FormularioCambioPassword
                            token={token}
                            onExito={handleExito}
                            onCancelar={posponer}
                            labelCancelar="Recordar más tarde"
                            labelActual="Contraseña temporal actual"
                            submitLabel="Guardar nueva contraseña"
                        />
                    </div>
                </div>
            )}

            {toastExito && (
                <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg border border-emerald-500">
                    ✓ {toastExito}
                </div>
            )}
        </>
    );
}

export default AvisoCambioPassword;
