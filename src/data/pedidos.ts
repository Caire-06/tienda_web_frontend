export interface ItemPedido {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    imagen: string;
}

export type TipoComprobante = "Boleta" | "Factura";
export type MetodoPago = "tarjeta" | "yape" | "transferencia";

export interface ComprobanteInfo {
    tipo: TipoComprobante;
    documento: string; // DNI (8) o RUC (11)
    nombreRazonSocial: string;
    direccion?: string;
    subtotal: number; // Base imponible
    igv: number;      // 18%
    total: number;
}

export type TipoEntrega = "envio" | "recojo";
export type EstadoPedido = "Pendiente" | "Procesando" | "Enviado" | "Listo para recojo" | "Entregado" | "Cancelado";

export interface Pedido {
    numero: string;
    fecha: string;
    usuarioId: string;
    cliente?: string;
    items: ItemPedido[];
    total: number;
    metodoPago?: MetodoPago;
    comprobante?: ComprobanteInfo;
    tipoEntrega?: TipoEntrega;
    estado?: EstadoPedido;
}

export const CLAVE_PEDIDOS = "techstore-pedidos";

export function leerPedidos(): Pedido[] {
    try {
        const raw = localStorage.getItem(CLAVE_PEDIDOS);
        const datos = raw ? JSON.parse(raw) : [];
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

export function guardarPedido(pedido: Pedido): void {
    try {
        const actuales = leerPedidos();
        actuales.unshift(pedido);
        localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(actuales));
    } catch {
        // Fallback en caso de que localStorage esté lleno o bloqueado
    }
}

export function generarNumeroPedido(): string {
    return `TS-${Date.now().toString().slice(-6)}`;
}

export function actualizarEstadoPedido(numero: string, nuevoEstado: EstadoPedido): void {
    try {
        const actuales = leerPedidos();
        const actualizados = actuales.map(p => p.numero === numero ? { ...p, estado: nuevoEstado } : p);
        localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(actualizados));
    } catch {
        // Fallback
    }
}
