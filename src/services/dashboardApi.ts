import type { Pedido } from "../data/pedidos";

export interface ProductoStockCritico {
    id: number;
    nombre: string;
    categoria: string;
    stock: number;
    precio: number;
}

export interface ProductoTop {
    id: number;
    nombre: string;
    categoria: string;
    vendidos: number;
    precio: number;
    porcentaje: number;
}

export interface DashboardKpis {
    ventasHoy: number;
    ventasMes: number;
    totalHistorico: number;
    totalPedidos: number;
    totalProductos: number;
    totalUsuarios: number;
    totalUsuariosActivos: number;
    totalUsuariosInactivos: number;
    stockCriticoCount: number;
    productosStockCritico: ProductoStockCritico[];
    topProductos: ProductoTop[];
    ultimasVentas: Pedido[];
}

export async function obtenerDashboardKpis(token: string): Promise<DashboardKpis> {
    const res = await fetch("/api/admin/dashboard/kpis", {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        throw new Error("Error al obtener KPIs consolidados desde el backend");
    }
    return res.json();
}
