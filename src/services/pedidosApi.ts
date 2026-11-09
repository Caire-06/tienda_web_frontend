import type { ComprobanteInfo, ItemPedido, MetodoPago, Pedido, TipoComprobante } from "../data/pedidos";

// ===== Contratos que espera el backend (com.utp.tienda.vistas.dto) =====
export interface ItemPedidoEntrada {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    imagen: string;
}

export interface DatosNuevoPedido {
    items: ItemPedidoEntrada[];
    total: number;
    metodoPago?: MetodoPago;
    tipoEntrega?: string;
    correoContacto?: string;
    celularContacto?: string;
    direccionEnvio?: string;
    referenciaEnvio?: string;
    distritoEnvio?: string;
    comprobante?: {
        tipo: string;
        documento: string;
        nombreRazonSocial: string;
        direccion?: string | null;
        subtotal: number;
        igv: number;
        total: number;
    };
}

// ===== Formas que devuelve el backend =====
interface ItemPedidoBackend {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    imagen?: string | null;
}

interface ComprobanteBackend {
    tipo: string;
    documento: string;
    nombreRazonSocial: string;
    direccion?: string | null;
    subtotal: number;
    igv: number;
    total: number;
}

interface PedidoBackend {
    numero: string;
    fecha: string;
    estado?: string | null;
    tipoEntrega?: string | null;
    metodoPago?: string | null;
    total: number;
    items: ItemPedidoBackend[];
    comprobante?: ComprobanteBackend | null;
}

// Convierte un pedido del backend al formato que ya usan las páginas
function mapear(p: PedidoBackend): Pedido {
    const comprobante = p.comprobante
        ? ({
              tipo: p.comprobante.tipo as TipoComprobante,
              documento: p.comprobante.documento,
              nombreRazonSocial: p.comprobante.nombreRazonSocial,
              direccion: p.comprobante.direccion ?? undefined,
              subtotal: Number(p.comprobante.subtotal),
              igv: Number(p.comprobante.igv),
              total: Number(p.comprobante.total),
          } as ComprobanteInfo)
        : undefined;

    return {
        numero: p.numero,
        fecha: p.fecha,
        usuarioId: "",
        items: (p.items ?? []).map(
            (it): ItemPedido => ({
                id: it.id,
                nombre: it.nombre,
                precio: Number(it.precio),
                cantidad: it.cantidad,
                imagen: it.imagen ?? "",
            }) as ItemPedido
        ),
        total: Number(p.total),
        metodoPago: (p.metodoPago as MetodoPago) ?? undefined,
        comprobante,
        tipoEntrega: (p.tipoEntrega as Pedido["tipoEntrega"]) ?? undefined,
        estado: (p.estado as Pedido["estado"]) ?? "Pendiente",
    };
}

/** Registra un pedido en PostgreSQL (POST /api/pedidos). Requiere token de sesión. */
export async function crearPedidoBackend(token: string, datos: DatosNuevoPedido): Promise<Pedido> {
    const resp = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) {
        const mensaje = String((data as { error?: string }).error || "No se pudo registrar el pedido");
        throw new Error(mensaje);
    }
    return mapear(data as unknown as PedidoBackend);
}

/** Trae el historial de compras (GET /api/pedidos/mis-compras). Requiere token de sesión. */
export async function listarMisCompras(token: string): Promise<Pedido[]> {
    const resp = await fetch("/api/pedidos/mis-compras", {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error("No se pudo consultar el historial");
    const data = (await resp.json()) as PedidoBackend[];
    return (Array.isArray(data) ? data : []).map(mapear);
}
