import type { Movimiento } from "../context/InventarioContext";
import { apiUrl } from "../config/api";
import { normalizarRespuestaPaginada, type RespuestaPaginada } from "./apiPaginacion";

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
        valorUnitario: m.valorUnitario ?? 0,
        valorTotal: m.valorTotal ?? 0,
        stockAnterior: m.stockAnterior ?? 0,
        stockNuevo: m.stockNuevo ?? 0,
        saldoValorAnterior: m.saldoValorAnterior ?? 0,
        saldoValNuevo: m.saldoValNuevo ?? 0,
        saldoPromedio: m.saldoPromedio ?? 0,
        guia: m.guia,
        factura: m.factura,
        detalle: m.detalle,
        motivo: m.motivo,
        usuario: m.usuario,
    }));
}

function normalizarMovimientoRaw(m: any): Movimiento {
    return {
        id: String(m.id || ""),
        fecha: String(m.fecha || ""),
        productoId: Number(m.productoId || 0),
        producto: String(m.producto || ""),
        tipo: (m.tipo === "Entrada" ? "Entrada" : "Salida") as "Entrada" | "Salida",
        cantidad: Number(m.cantidad || 0),
        valorUnitario: Number(m.valorUnitario ?? 0),
        valorTotal: Number(m.valorTotal ?? 0),
        stockAnterior: Number(m.stockAnterior ?? 0),
        stockNuevo: Number(m.stockNuevo ?? 0),
        saldoValorAnterior: Number(m.saldoValorAnterior ?? 0),
        saldoValNuevo: Number(m.saldoValNuevo ?? 0),
        saldoPromedio: Number(m.saldoPromedio ?? 0),
        guia: String(m.guia || ""),
        factura: String(m.factura || ""),
        detalle: String(m.detalle || ""),
        motivo: String(m.motivo || ""),
        usuario: String(m.usuario || "SISTEMA"),
    };
}

/** GET /api/kardex/movimientos con paginación server-side. */
export async function listarMovimientosPaginado(
    token: string,
    pagina: number = 1,
    limite: number = 10
): Promise<RespuestaPaginada<Movimiento>> {
    const page0 = Math.max(0, pagina - 1);
    const resp = await fetch(apiUrl(`/api/kardex/movimientos?page=${page0}&size=${limite}`), {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await resp.json().catch(() => []);
    if (!resp.ok) throw new Error("No se pudo listar los movimientos del Kardex");
    return normalizarRespuestaPaginada(data, normalizarMovimientoRaw, pagina, limite);
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
