import { apiUrl } from "../config/api";
import { normalizarRespuestaPaginada, type RespuestaPaginada } from "./apiPaginacion";

export interface ItemEntrada {
    idProducto: number;
    idProveedor: number;
    cantidad: number;
    costoUnitario: number;
}

export interface Entrada {
    id: number;
    fecha: string;
    items: ItemEntrada[];
}

/** POST /api/entradas — registrar una entrada de mercadería (3FN: entrada + líneas). */
export async function registrarEntradaBackend(token: string, items: ItemEntrada[]): Promise<Entrada> {
    const resp = await fetch(apiUrl("/api/entradas"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items }),
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) throw new Error(String((data as { error?: string }).error || "No se pudo registrar la entrada"));
    const entrada = data as unknown as Entrada;
    return entrada;
}

/** GET /api/entradas/mias — historial de entradas del usuario autenticado. */
export async function listarEntradas(token: string): Promise<Entrada[]> {
    const resp = await fetch(apiUrl("/api/entradas/mis-entradas"), { headers: { Authorization: `Bearer ${token}` } });
    const data = (await resp.json().catch(() => [])) as Entrada[] | Entrada;
    if (!resp.ok) throw new Error("No se pudo listar las entradas");
    const lista = Array.isArray(data) ? data : [];
    return lista;
}

/** GET /api/entradas/mis-entradas con paginación server-side. */
export async function listarEntradasPaginado(
    token: string,
    pagina: number = 1,
    limite: number = 10
): Promise<RespuestaPaginada<Entrada>> {
    const page0 = Math.max(0, pagina - 1);
    const resp = await fetch(apiUrl(`/api/entradas/mis-entradas?page=${page0}&size=${limite}`), {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await resp.json().catch(() => []);
    if (!resp.ok) throw new Error("No se pudo listar las entradas");
    return normalizarRespuestaPaginada(data, (item: Entrada) => item, pagina, limite);
}
