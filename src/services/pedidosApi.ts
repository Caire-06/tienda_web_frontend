import type { ComprobanteInfo, ItemPedido, MetodoPago, Pedido, TipoComprobante } from "../data/pedidos";
import { apiUrl } from "../config/api";

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
    costoEnvio?: number;
    correoContacto?: string;
    celularContacto?: string;
    direccionEnvio?: string;
    referenciaEnvio?: string;
    distritoEnvio?: string;
    codigoOperacionPago?: string;
    comprobantePagoUrl?: string;
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
    cliente?: string | null;
    estado?: string | null;
    tipoEntrega?: string | null;
    metodoPago?: string | null;
    costoEnvio?: number | null;
    total: number;
    items: ItemPedidoBackend[];
    comprobante?: ComprobanteBackend | null;
    codigoLoteDespacho?: string | null;
    empresaTransporte?: string | null;
    fechaProcesando?: string | null;
    fechaEnvio?: string | null;
    fechaEntrega?: string | null;
    estadoPago?: string | null;
    codigoOperacionPago?: string | null;
    comprobantePagoUrl?: string | null;
    fechaConfirmacionPago?: string | null;
    usuarioConfirmoPago?: string | null;
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
        cliente: p.cliente || p.comprobante?.nombreRazonSocial || "Cliente",
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
        costoEnvio: p.costoEnvio != null ? Number(p.costoEnvio) : 0,
        metodoPago: (p.metodoPago as MetodoPago) ?? undefined,
        comprobante,
        tipoEntrega: (p.tipoEntrega as Pedido["tipoEntrega"]) ?? undefined,
        estado: (p.estado as Pedido["estado"]) ?? "Pendiente",
        codigoLoteDespacho: p.codigoLoteDespacho ?? undefined,
        empresaTransporte: p.empresaTransporte ?? undefined,
        fechaProcesando: p.fechaProcesando ?? undefined,
        fechaEnvio: p.fechaEnvio ?? undefined,
        fechaEntrega: p.fechaEntrega ?? undefined,
        estadoPago: p.estadoPago ?? "Pagado",
        codigoOperacionPago: p.codigoOperacionPago ?? undefined,
        comprobantePagoUrl: p.comprobantePagoUrl ?? undefined,
        fechaConfirmacionPago: p.fechaConfirmacionPago ?? undefined,
        usuarioConfirmoPago: p.usuarioConfirmoPago ?? undefined,
    };
}

/** Registra un pedido en PostgreSQL (POST /api/pedidos). Requiere token de sesión. */
export async function crearPedidoBackend(token: string, datos: DatosNuevoPedido): Promise<Pedido> {
    const resp = await fetch(apiUrl("/api/pedidos"), {
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
    const resp = await fetch(apiUrl("/api/pedidos/mis-compras"), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error("No se pudo consultar el historial");
    const data = (await resp.json()) as PedidoBackend[];
    return (Array.isArray(data) ? data : []).map(mapear);
}

/** Trae todos los pedidos del sistema para el panel de administración (GET /api/pedidos). */
export async function listarPedidosAdmin(token: string): Promise<Pedido[]> {
    const resp = await fetch(apiUrl("/api/pedidos"), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error("No se pudieron cargar las ventas de la base de datos");
    const data = (await resp.json()) as PedidoBackend[];
    return (Array.isArray(data) ? data : []).map(mapear);
}

/** Actualiza el estado de un pedido por Almacén (PUT /api/pedidos/{numero}/estado). */
export async function actualizarEstadoPedido(token: string, numero: string, estado: string): Promise<Pedido> {
    const resp = await fetch(apiUrl(`/api/pedidos/${encodeURIComponent(numero)}/estado`), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "No se pudo actualizar el estado del pedido");
    return mapear(data as PedidoBackend);
}

export async function subirComprobantePago(token: string, archivo: File): Promise<{ url: string; publicId: string }> {
    const form = new FormData();
    form.append("archivo", archivo);
    const resp = await fetch(apiUrl("/api/pedidos/comprobante-pago"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) {
        throw new Error(String((data as { error?: string }).error || "No se pudo subir la captura del comprobante"));
    }
    return {
        url: String(data.url || ""),
        publicId: String(data.publicId || ""),
    };
}

export async function confirmarPagoTransferencia(token: string, numero: string, aprobado: boolean): Promise<Pedido> {
    const resp = await fetch(apiUrl(`/api/pedidos/${encodeURIComponent(numero)}/pago`), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ aprobado }),
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) {
        throw new Error(String((data as { error?: string }).error || "No se pudo verificar el pago"));
    }
    return mapear(data as unknown as PedidoBackend);
}

export const actualizarEstadoPedidoAdmin = actualizarEstadoPedido;
