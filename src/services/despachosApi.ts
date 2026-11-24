import type { Pedido } from "../data/pedidos";
import { apiUrl } from "../config/api";
import { normalizarRespuestaPaginada, type RespuestaPaginada } from "./apiPaginacion";

export interface DespachoLoteDTO {
    id: number;
    codigoLote: string;
    empresaTransporte: string;
    numeroGuiaRemision: string;
    conductor: string;
    placaVehiculo: string;
    observaciones: string;
    fechaDespacho: string;
    usuarioRegistro: string;
    estado: string;
    cantidadPedidos: number;
    totalValorizado: number;
    numerosPedidos: string[];
}

export interface CrearDespachoLoteDatos {
    numerosPedidos: string[];
    empresaTransporte: string;
    numeroGuiaRemision?: string;
    conductor?: string;
    placaVehiculo?: string;
    observaciones?: string;
}

export async function listarLotesDespacho(token: string): Promise<DespachoLoteDTO[]> {
    try {
        const res = await fetch(apiUrl("/api/despachos"), {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) return await res.json();
    } catch {
        // Fallback si el endpoint está en reinicio
    }
    return [];
}

/** GET /api/despachos con paginación server-side. */
export async function listarLotesDespachoPaginado(
    token: string,
    pagina: number = 1,
    limite: number = 10
): Promise<RespuestaPaginada<DespachoLoteDTO>> {
    const page0 = Math.max(0, pagina - 1);
    try {
        const res = await fetch(apiUrl(`/api/despachos?page=${page0}&size=${limite}`), {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            return normalizarRespuestaPaginada(data, (item: DespachoLoteDTO) => item, pagina, limite);
        }
    } catch {
        // Fallback
    }
    return normalizarRespuestaPaginada([], (item: DespachoLoteDTO) => item, pagina, limite);
}

export async function listarPedidosPendientesDespacho(token: string): Promise<Pedido[]> {
    try {
        const res = await fetch(apiUrl("/api/despachos/pendientes"), {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) return await res.json();
    } catch {
        // Fallback hacia pedidos admin si el endpoint de despachos aún no responde
    }

    try {
        const res = await fetch(apiUrl("/api/pedidos"), {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const todos: Pedido[] = await res.json();
            return todos.filter(
                (p) => !p.codigoLoteDespacho && p.estado !== "Cancelado" && p.estado !== "Entregado"
            );
        }
    } catch {
        // Fallback vacío
    }
    return [];
}

/** GET /api/despachos/pendientes con paginación server-side. */
export async function listarPedidosPendientesDespachoPaginado(
    token: string,
    pagina: number = 1,
    limite: number = 10
): Promise<RespuestaPaginada<Pedido>> {
    const page0 = Math.max(0, pagina - 1);
    try {
        const res = await fetch(apiUrl(`/api/despachos/pendientes?page=${page0}&size=${limite}`), {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            return normalizarRespuestaPaginada(data, (item: Pedido) => item, pagina, limite);
        }
    } catch {
        // Fallback
    }
    return normalizarRespuestaPaginada([], (item: Pedido) => item, pagina, limite);
}

export async function crearLoteDespacho(token: string, datos: CrearDespachoLoteDatos): Promise<DespachoLoteDTO> {
    const res = await fetch(apiUrl("/api/despachos"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || "No se pudo generar el lote de despacho");
    }
    return data;
}

export async function completarLoteDespacho(token: string, id: number): Promise<DespachoLoteDTO> {
    const res = await fetch(apiUrl(`/api/despachos/${id}/completar`), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || "No se pudo marcar el lote como completado");
    }
    return data;
}

