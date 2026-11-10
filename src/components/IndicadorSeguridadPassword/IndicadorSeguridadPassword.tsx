interface IndicadorSeguridadPasswordProps {
    password: string;
}

const ETIQUETAS_FUERZA = ["", "Débil", "Media", "Buena", "Fuerte"] as const;
const COLORES_FUERZA = [
    "bg-slate-200 dark:bg-slate-700",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
] as const;

function calcularFuerzaPassword(password: string): number {
    return [
        password.length >= 8,
        /\d/.test(password),
        /[A-Z]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
}

function IndicadorSeguridadPassword({ password }: IndicadorSeguridadPasswordProps) {
    if (!password) return null;

    const fuerza = calcularFuerzaPassword(password);
    const etiqueta = ETIQUETAS_FUERZA[fuerza];
    const color = COLORES_FUERZA[fuerza];

    return (
        <div className="pt-1.5 flex items-center justify-between gap-3">
            <div className="flex-1 grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                    <div
                        key={n}
                        className={`h-1.5 rounded-full transition-colors ${
                            n <= fuerza ? color : "bg-slate-200 dark:bg-slate-700"
                        }`}
                    />
                ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {etiqueta}
            </span>
        </div>
    );
}

export default IndicadorSeguridadPassword;
