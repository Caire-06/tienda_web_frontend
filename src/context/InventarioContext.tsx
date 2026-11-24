import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { PRODUCTOS as BASE } from "../data/productos";

// Especificación técnica (valor con magnitud integrada, sin unidad separada).
export interface EspecificacionInv {
    caracteristica: string;
    valor: string;
}

// Producto del inventario (igual al de tienda + si está activo o no)
export interface ProductoInv {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
    stock: number;
    vendidos: number;
    imagen: string;
    descripcion: string;
    activo: boolean;
    marca?: string;
    fechaCreacion?: string;
    especificaciones?: EspecificacionInv[];
}

// Un movimiento del Kardex
export interface Movimiento {
    id: string;
    fecha: string; // ISO, para poder filtrar por rango
    productoId: number;
    producto: string;
    tipo: "Entrada" | "Salida";
    cantidad: number;
    stockAnterior: number;
    stockNuevo: number;
    motivo: string;
    usuario: string;
}

const CLAVE = "techstore-inventario-v2";
const UMBRAL_BAJO = 10;

function haceDias(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

// Historial de ejemplo con nuestros propios productos (solo frontend).
// La matemática cuadra: cada fila termina en el stock actual del producto.
function estadoInicial(): { productos: ProductoInv[]; movimientos: Movimiento[] } {
    const productos: ProductoInv[] = BASE.map((p) => ({ ...p, activo: true }));

    const stock = (id: number) => productos.find((p) => p.id === id)!.stock;
    const nombre = (id: number) => productos.find((p) => p.id === id)!.nombre;

    const movimientos: Movimiento[] = [
        { id: "seed-01", fecha: haceDias(1), productoId: 7, producto: nombre(7), tipo: "Entrada", cantidad: 6, stockAnterior: 0, stockNuevo: stock(7), motivo: "Primer ingreso", usuario: "Carlos" },
        { id: "seed-02", fecha: haceDias(1), productoId: 3, producto: nombre(3), tipo: "Salida", cantidad: 15, stockAnterior: 15, stockNuevo: stock(3), motivo: "Venta #VTA-005", usuario: "Sistema" },
        { id: "seed-03", fecha: haceDias(2), productoId: 3, producto: nombre(3), tipo: "Entrada", cantidad: 15, stockAnterior: 0, stockNuevo: 15, motivo: "Ingreso de mercadería", usuario: "Carlos" },
        { id: "seed-04", fecha: haceDias(2), productoId: 8, producto: nombre(8), tipo: "Salida", cantidad: 3, stockAnterior: 21, stockNuevo: stock(8), motivo: "Venta #VTA-004", usuario: "Sistema" },
        { id: "seed-05", fecha: haceDias(3), productoId: 4, producto: nombre(4), tipo: "Salida", cantidad: 2, stockAnterior: 10, stockNuevo: stock(4), motivo: "Venta #VTA-004", usuario: "Sistema" },
        { id: "seed-06", fecha: haceDias(4), productoId: 1, producto: nombre(1), tipo: "Salida", cantidad: 4, stockAnterior: 24, stockNuevo: stock(1), motivo: "Venta #VTA-003", usuario: "Sistema" },
        { id: "seed-07", fecha: haceDias(5), productoId: 2, producto: nombre(2), tipo: "Salida", cantidad: 8, stockAnterior: 20, stockNuevo: stock(2), motivo: "Venta #VTA-003", usuario: "Sistema" },
        { id: "seed-08", fecha: haceDias(6), productoId: 4, producto: nombre(4), tipo: "Entrada", cantidad: 10, stockAnterior: 0, stockNuevo: 10, motivo: "Ingreso de mercadería", usuario: "Carlos" },
        { id: "seed-09", fecha: haceDias(6), productoId: 5, producto: nombre(5), tipo: "Salida", cantidad: 5, stockAnterior: 20, stockNuevo: stock(5), motivo: "Venta #VTA-002", usuario: "Sistema" },
        { id: "seed-10", fecha: haceDias(7), productoId: 8, producto: nombre(8), tipo: "Salida", cantidad: 4, stockAnterior: 25, stockNuevo: 21, motivo: "Venta #VTA-002", usuario: "Sistema" },
        { id: "seed-11", fecha: haceDias(8), productoId: 1, producto: nombre(1), tipo: "Salida", cantidad: 6, stockAnterior: 30, stockNuevo: 24, motivo: "Venta #VTA-001", usuario: "Sistema" },
        { id: "seed-12", fecha: haceDias(9), productoId: 6, producto: nombre(6), tipo: "Salida", cantidad: 10, stockAnterior: 60, stockNuevo: stock(6), motivo: "Venta #VTA-001", usuario: "Sistema" },
        { id: "seed-13", fecha: haceDias(10), productoId: 2, producto: nombre(2), tipo: "Entrada", cantidad: 20, stockAnterior: 0, stockNuevo: 20, motivo: "Primer ingreso", usuario: "Carlos" },
        { id: "seed-14", fecha: haceDias(11), productoId: 1, producto: nombre(1), tipo: "Entrada", cantidad: 30, stockAnterior: 0, stockNuevo: 30, motivo: "Primer ingreso", usuario: "Carlos" },
        { id: "seed-15", fecha: haceDias(12), productoId: 5, producto: nombre(5), tipo: "Entrada", cantidad: 20, stockAnterior: 0, stockNuevo: 20, motivo: "Primer ingreso", usuario: "Carlos" },
        { id: "seed-16", fecha: haceDias(13), productoId: 8, producto: nombre(8), tipo: "Entrada", cantidad: 25, stockAnterior: 0, stockNuevo: 25, motivo: "Primer ingreso", usuario: "Carlos" },
        { id: "seed-17", fecha: haceDias(14), productoId: 6, producto: nombre(6), tipo: "Entrada", cantidad: 60, stockAnterior: 0, stockNuevo: 60, motivo: "Primer ingreso", usuario: "Carlos" },
    ];

    return { productos, movimientos };
}

function leer(): { productos: ProductoInv[]; movimientos: Movimiento[] } {
    try {
        const raw = localStorage.getItem(CLAVE);
        if (!raw) return estadoInicial();
        const datos = JSON.parse(raw);
        if (!Array.isArray(datos.productos) || !Array.isArray(datos.movimientos)) {
            return estadoInicial();
        }
        return datos;
    } catch {
        return estadoInicial();
    }
}

export interface DatosProducto {
    nombre: string;
    categoria: string;
    precio: number;
    stock: number;
    imagen: string;
    descripcion: string;
    marca?: string;
    especificaciones?: EspecificacionInv[];
}

interface InventarioContexto {
    productos: ProductoInv[];
    movimientos: Movimiento[];
    stockTotal: number;
    stockBajo: number;
    registrarEntrada: (productoId: number, cantidad: number, motivo: string, usuario: string) => void;
    registrarSalida: (productoId: number, cantidad: number, motivo: string, usuario: string) => void;
    guardarProducto: (id: number | null, datos: DatosProducto) => void;
    cambiarActivo: (id: number, activo: boolean) => void;
}

const InventarioContext = createContext<InventarioContexto | null>(null);

export function InventarioProvider({ children }: { children: ReactNode }) {
    const [productos, setProductos] = useState<ProductoInv[]>(() => leer().productos);
    const [movimientos, setMovimientos] = useState<Movimiento[]>(() => leer().movimientos);

    useEffect(() => {
        localStorage.setItem(CLAVE, JSON.stringify({ productos, movimientos }));
    }, [productos, movimientos]);

    // Entrada manual de mercadería: sube stock y genera el Kardex
    const registrarEntrada = (productoId: number, cantidad: number, motivo: string, usuario: string) => {
        if (cantidad <= 0) return;
        const prod = productos.find((p) => p.id === productoId);
        if (!prod) return;
        setProductos((prev) =>
            prev.map((p) => (p.id === productoId ? { ...p, stock: p.stock + cantidad } : p))
        );
        setMovimientos((prev) => [
            {
                id: `M${Date.now()}`,
                fecha: new Date().toISOString(),
                productoId,
                producto: prod.nombre,
                tipo: "Entrada",
                cantidad,
                stockAnterior: prod.stock,
                stockNuevo: prod.stock + cantidad,
                motivo: motivo.trim() || "Ingreso de mercadería",
                usuario,
            },
            ...prev,
        ]);
    };

    // Salida (la genera el sistema al confirmarse una venta, Almacén no la toca)
    const registrarSalida = (productoId: number, cantidad: number, motivo: string, usuario: string) => {
        if (cantidad <= 0) return;
        const prod = productos.find((p) => p.id === productoId);
        if (!prod) return;
        const real = Math.min(cantidad, prod.stock);
        setProductos((prev) =>
            prev.map((p) =>
                p.id === productoId
                    ? { ...p, stock: p.stock - real, vendidos: p.vendidos + real }
                    : p
            )
        );
        setMovimientos((prev) => [
            {
                id: `M${Date.now()}-${productoId}`,
                fecha: new Date().toISOString(),
                productoId,
                producto: prod.nombre,
                tipo: "Salida",
                cantidad: real,
                stockAnterior: prod.stock,
                stockNuevo: prod.stock - real,
                motivo,
                usuario,
            },
            ...prev,
        ]);
    };

    // Crear (id null) o editar un producto. Crear genera su entrada inicial en Kardex.
    const guardarProducto = (id: number | null, datos: DatosProducto) => {
        if (id === null) {
            const nuevo: ProductoInv = {
                ...datos,
                id: Date.now(),
                vendidos: 0,
                activo: true,
                fechaCreacion: new Date().toISOString(),
            };
            setProductos((prev) => [...prev, nuevo]);
            setMovimientos((prev) => [
                {
                    id: `M${Date.now()}`,
                    fecha: new Date().toISOString(),
                    productoId: nuevo.id,
                    producto: nuevo.nombre,
                    tipo: "Entrada",
                    cantidad: nuevo.stock,
                    stockAnterior: 0,
                    stockNuevo: nuevo.stock,
                    motivo: "Stock inicial",
                    usuario: "Almacén",
                },
                ...prev,
            ]);
        } else {
            setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...datos } : p)));
        }
    };

    const cambiarActivo = (id: number, activo: boolean) => {
        setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, activo } : p)));
    };

    const stockTotal = productos.reduce((acc, p) => acc + p.stock, 0);
    const stockBajo = productos.filter((p) => p.activo && p.stock < UMBRAL_BAJO).length;

    return (
        <InventarioContext.Provider
            value={{
                productos,
                movimientos,
                stockTotal,
                stockBajo,
                registrarEntrada,
                registrarSalida,
                guardarProducto,
                cambiarActivo,
            }}
        >
            {children}
        </InventarioContext.Provider>
    );
}

export function useInventario(): InventarioContexto {
    const ctx = useContext(InventarioContext);
    if (!ctx) throw new Error("useInventario debe usarse dentro de <InventarioProvider>");
    return ctx;
}
