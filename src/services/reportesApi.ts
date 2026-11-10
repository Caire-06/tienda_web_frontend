export interface ReporteUsuarios {
    tipo: "usuarios";
    total: number;
    activos: number;
    inactivos: number;
    bloqueados: number;
    conIntentosFallidos: number;
    filas: Array<{
        id: number;
        username: string;
        rol: string;
        estado: string;
        bloqueado: boolean;
        intentosFallidos: number;
        fechaCreacion: string;
        ultimoAcceso: string;
    }>;
}

export interface ReporteVentas {
    tipo: "ventas";
    totalPedidos: number;
    totalVentas: number;
    ticketPromedio: number;
    ventasPorDia: Record<string, number>;
    ventasPorCliente: Record<string, number>;
    filas: Array<{
        numero: string;
        fecha: string;
        cliente: string;
        total: number;
        estado: string;
        metodoPago: string;
        tipoEntrega: string;
        tipoComprobante: string;
        numeroComprobante: string;
    }>;
}

export interface ReporteInventario {
    tipo: "inventario";
    totalProductos: number;
    stockTotal: number;
    stockValorizado: number;
    filas: Array<{
        id: number;
        nombre: string;
        categoria: string;
        precio: number;
        stock: number;
        vendidos: number;
        activo: boolean;
        valorizado: number;
        rotacionCritica: boolean;
    }>;
}

export async function obtenerReporteParametrizado(token: string, tipo: "usuarios" | "ventas" | "inventario"): Promise<any> {
    const res = await fetch(`/api/admin/reportes/${tipo}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        throw new Error(`Error al obtener reporte de ${tipo}`);
    }
    return res.json();
}
