import type { Movimiento } from "../context/InventarioContext";
import { apiUrl } from "../config/api";

/** GET /api/kardex/movimientos -> movimientos de entrada/salida con saldos. */
export async function listarMovimientos(token: string): Promise<Movimiento[]> {
    const resp = await fetch(apiUrl("/api/kardex/movimientos"), { headers: { Authorization: `Bearer ${token}` } });
    const data = (await resp.json().catch(() => [])) as Movimiento[];
    if (!resp.ok) throw new Error("No se pudo listar los movimientos del Kardex");
    const lista = Array.isArray(data) ? data : [];
    return lista.map((m) => ({
        id: m.id,
        fecha: m.fecha,
        productoId: m.productoId,
        producto: m.producto,
        tipo: (m.tipo === "Entrada" ? "Entrada" : "Salida") as "Entrada" | "Salida",
        cantidad: m.cantidad,
        stockAnterior: m.stockAnterior ?? 0,
        stockNuevo: m.stockNuevo ?? 0,
        motivo: m.motivo,
        usuario: m.usuario,
    }));
}

export interface KardexResumen {
    movimientos: number;
    entradas: number;
    salidas: number;
    productosRegistrados: number;
    stockTotal: number;
    stockCriticoBajo: number;
    ultimosMovimientos: Movimiento[];
    ultimasEntradas: Movimiento[];
}

/** GET /api/kardex/resumen -> resumen del Kardex para el dashboard del almacén. */
export async function obtenerResumen(token: string): Promise<KardexResumen> {
    const resp = await fetch(apiUrl("/api/kardex/resumen"), { headers: { Authorization: `Bearer ${token}` } });
    const data = (await resp.json().catch(() => null)) as KardexResumen | null;
    if (!resp.ok) throw new Error("No se pudo obtener el resumen del Kardex");
    return data ?? {
        movimientos: 0,
        entradas: 0,
        salidas: 0,
        productosRegistrados: 0,
        stockTotal: 0,
        stockCriticoBajo: 0,
        ultimosMovimientos: [],
        ultimasEntradas: [],
    };
}
