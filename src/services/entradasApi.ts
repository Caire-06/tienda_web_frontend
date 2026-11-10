export interface ItemEntrada {
    idProducto: number;
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
    const resp = await fetch("/api/entradas", {
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
    const resp = await fetch("/api/entradas/mis-entradas", { headers: { Authorization: `Bearer ${token}` } });
    const data = (await resp.json().catch(() => [])) as Entrada[] | Entrada;
    if (!resp.ok) throw new Error("No se pudo listar las entradas");
    const lista = Array.isArray(data) ? data : [];
    return lista;
}
