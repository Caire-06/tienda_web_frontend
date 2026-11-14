import { PRODUCTOS } from "../data/productos";
import { apiUrl } from "../config/api";

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
    try {
        const res = await fetch(apiUrl(`/api/admin/reportes/${tipo}`), {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch {
        // Fallback dinámico si el servicio backend está en reinicio
    }

    if (tipo === "ventas") {
        try {
            const res = await fetch(apiUrl("/api/pedidos"), { headers: { Authorization: `Bearer ${token}` } });
            const pedidos = res.ok ? await res.json() : [];
            const totalPedidos = pedidos.length;
            const totalVentas = pedidos.reduce((acc: number, p: any) => acc + (Number(p.total) || 0), 0);
            const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
            const porDia: Record<string, number> = {};
            for (const p of pedidos) {
                const f = (p.fecha || "").slice(0, 10) || "Hoy";
                porDia[f] = (porDia[f] || 0) + (Number(p.total) || 0);
            }
            return {
                tipo: "ventas",
                totalPedidos,
                totalVentas,
                ticketPromedio,
                ventasPorDia: porDia,
                ventasPorCliente: {},
                filas: pedidos.map((p: any) => ({
                    numero: p.numero,
                    fecha: p.fecha,
                    cliente: p.cliente || p.comprobante?.nombreRazonSocial || "Cliente",
                    total: p.total,
                    estado: p.estado || "Completado",
                    metodoPago: p.metodoPago || "Tarjeta",
                    tipoEntrega: p.tipoEntrega || "Envío",
                    tipoComprobante: p.comprobante?.tipo || "BOLETA",
                    numeroComprobante: (p.comprobante?.tipo === "FACTURA" ? "F001-" : "B001-") + p.numero,
                })),
            };
        } catch {
            return {
                tipo: "ventas",
                totalPedidos: 0,
                totalVentas: 0,
                ticketPromedio: 0,
                ventasPorDia: {},
                ventasPorCliente: {},
                filas: [],
            };
        }
    }

    if (tipo === "inventario") {
        try {
            const res = await fetch(apiUrl("/api/productos"), { headers: { Authorization: `Bearer ${token}` } });
            const productos = res.ok ? await res.json() : PRODUCTOS;
            const prods = Array.isArray(productos) && productos.length > 0 ? productos : PRODUCTOS;
            let stockTotal = 0;
            let stockValorizado = 0;
            const filas = prods.map((p: any) => {
                const pr = Number(p.precio) || 0;
                const st = Number(p.stock) || 0;
                const val = pr * st;
                stockTotal += st;
                stockValorizado += val;
                return {
                    id: p.id,
                    nombre: p.nombre,
                    categoria: p.categoria || "General",
                    precio: pr,
                    stock: st,
                    vendidos: Number(p.vendidos) || 0,
                    activo: p.activo !== false,
                    valorizado: val,
                    rotacionCritica: st < 10,
                };
            });
            return {
                tipo: "inventario",
                totalProductos: prods.length,
                stockTotal,
                stockValorizado,
                filas,
            };
        } catch {
            return {
                tipo: "inventario",
                totalProductos: PRODUCTOS.length,
                stockTotal: PRODUCTOS.reduce((acc, p) => acc + p.stock, 0),
                stockValorizado: PRODUCTOS.reduce((acc, p) => acc + p.stock * p.precio, 0),
                filas: [],
            };
        }
    }

    // Reporte de usuarios
    try {
        const res = await fetch(apiUrl("/api/usuarios"), { headers: { Authorization: `Bearer ${token}` } });
        const usuarios = res.ok ? await res.json() : [];
        const us = Array.isArray(usuarios) ? usuarios : [];
        const activos = us.filter((u: any) => u.estado !== "Inactivo" && !u.bloqueado).length;
        return {
            tipo: "usuarios",
            total: us.length,
            activos,
            inactivos: us.length - activos,
            bloqueados: us.filter((u: any) => u.bloqueado).length,
            conIntentosFallidos: 0,
            filas: us.map((u: any) => ({
                id: u.id,
                username: u.username,
                rol: u.rol,
                estado: u.estado || (u.bloqueado ? "Inactivo" : "Activo"),
                bloqueado: !!u.bloqueado,
                intentosFallidos: 0,
                fechaCreacion: u.fechaRegistro || "Reciente",
                ultimoAcceso: u.ultimoAcceso || "—",
            })),
        };
    } catch {
        return {
            tipo: "usuarios",
            total: 0,
            activos: 0,
            inactivos: 0,
            bloqueados: 0,
            conIntentosFallidos: 0,
            filas: [],
        };
    }
}
