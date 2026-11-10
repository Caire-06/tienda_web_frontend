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

export type TipoEntrega = "delivery_propio" | "agencia_destino" | "recojo" | "envio";
export type EstadoPedido = "Pendiente" | "Procesando" | "Enviado" | "Listo para recojo" | "Entregado" | "Cancelado";

export interface Pedido {
    numero: string;
    fecha: string;
    usuarioId: string;
    cliente?: string;
    items: ItemPedido[];
    total: number;
    costoEnvio?: number;
    metodoPago?: MetodoPago;
    comprobante?: ComprobanteInfo;
    tipoEntrega?: TipoEntrega;
    estado?: EstadoPedido;
    codigoLoteDespacho?: string;
    empresaTransporte?: string;
    fechaProcesando?: string;
    fechaEnvio?: string;
    fechaEntrega?: string;
}

export function etiquetaTipoEntrega(tipo?: string): string {
    if (!tipo) return "Delivery";
    if (tipo === "recojo") return "Recojo en Tienda";
    if (tipo === "agencia_destino") return "Agencia (Pago en destino)";
    if (tipo === "delivery_propio" || tipo === "envio") return "Delivery Propio (SJL)";
    return tipo;
}

export function formatearFechaHora(fechaStr?: string | null): string {
    if (!fechaStr) return "—";
    try {
        const d = new Date(fechaStr);
        if (isNaN(d.getTime())) return fechaStr;
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
        return fechaStr;
    }
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
