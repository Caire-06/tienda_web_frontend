/**
 * Interfaz genérica para respuestas paginadas del backend (PaginaDTO).
 */
export interface RespuestaPaginada<T> {
    contenido: T[];
    totalElementos: number;
    totalPaginas: number;
    paginaActual: number;
    tamanioPagina: number;
}

/**
 * Normaliza cualquier respuesta del backend (sea un arreglo directo o un objeto PaginaDTO / Spring Page)
 * a un contrato estándar RespuestaPaginada<T>.
 */
export function normalizarRespuestaPaginada<T, R = unknown>(
    raw: unknown,
    mapeadorItem: (item: R) => T,
    paginaSolicitada: number = 1,
    limiteSolicitado: number = 10
): RespuestaPaginada<T> {
    if (Array.isArray(raw)) {
        const mapeados = raw.map((item) => mapeadorItem(item as R));
        return {
            contenido: mapeados,
            totalElementos: mapeados.length,
            totalPaginas: Math.max(1, Math.ceil(mapeados.length / limiteSolicitado)),
            paginaActual: paginaSolicitada,
            tamanioPagina: limiteSolicitado,
        };
    }

    if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        const listaCruda = (Array.isArray(obj.contenido)
            ? obj.contenido
            : Array.isArray(obj.content)
            ? obj.content
            : []) as R[];

        const mapeados = listaCruda.map((item) => mapeadorItem(item));
        const total = typeof obj.totalElementos === "number"
            ? obj.totalElementos
            : typeof obj.totalElements === "number"
            ? obj.totalElements
            : mapeados.length;

        const paginas = typeof obj.totalPaginas === "number"
            ? obj.totalPaginas
            : typeof obj.totalPages === "number"
            ? obj.totalPages
            : Math.max(1, Math.ceil(total / limiteSolicitado));

        const pagina = typeof obj.paginaActual === "number"
            ? obj.paginaActual + 1
            : typeof obj.number === "number"
            ? (obj.number as number) + 1
            : paginaSolicitada;

        const tamanio = typeof obj.tamanioPagina === "number"
            ? obj.tamanioPagina
            : typeof obj.size === "number"
            ? (obj.size as number)
            : limiteSolicitado;

        return {
            contenido: mapeados,
            totalElementos: total,
            totalPaginas: Math.max(1, paginas),
            paginaActual: pagina,
            tamanioPagina: tamanio,
        };
    }

    return {
        contenido: [],
        totalElementos: 0,
        totalPaginas: 1,
        paginaActual: paginaSolicitada,
        tamanioPagina: limiteSolicitado,
    };
}
