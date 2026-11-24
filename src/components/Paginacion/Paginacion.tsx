interface PaginacionProps {
    paginaActual: number;
    totalPaginas: number;
    totalRegistros: number;
    onCambiar: (pagina: number) => void;
}

// Cantidad de registros por página para listas largas (productos, pedidos, usuarios, etc.).
export const REGISTROS_POR_PAGINA = 12;

// Paginación reutilizable para listas largas.
// Si hay una sola página o menos, no se renderiza.
export function Paginacion({ paginaActual, totalPaginas, totalRegistros, onCambiar }: PaginacionProps) {
    if (totalPaginas <= 1) return null;

    const desde = (paginaActual - 1) * REGISTROS_POR_PAGINA + 1;
    const hasta = Math.min(paginaActual * REGISTROS_POR_PAGINA, totalRegistros);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-3">
            <span>
                Mostrando {desde}–{hasta} de {totalRegistros} registros
            </span>
            <div className="flex gap-1.5">
                <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
                    disabled={paginaActual === 1}
                    onClick={() => onCambiar(paginaActual - 1)}
                >
                    ‹
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                    <button
                        key={n}
                        type="button"
                        className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                            n === paginaActual
                                ? "bg-emerald-600 text-white"
                                : "border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        onClick={() => onCambiar(n)}
                    >
                        {n}
                    </button>
                ))}
                <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => onCambiar(paginaActual + 1)}
                >
                    ›
                </button>
            </div>
        </div>
    );
}

export default Paginacion;
