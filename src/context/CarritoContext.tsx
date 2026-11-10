import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useInventario } from "./InventarioContext";
import type { ProductoInv } from "./InventarioContext";
import { useCatalogo } from "../hooks/useCatalogo";

// Un item del carrito solo guarda id + cantidad.
// Los datos (precio, stock, imagen) se resuelven contra el catálogo del backend
// y, como respaldo, contra el inventario local de demostración.
export interface ItemCarrito {
    id: number;
    cantidad: number;
}

interface CarritoContexto {
    items: ItemCarrito[];
    catalogo: ProductoInv[];
    agregar: (id: number, cantidad?: number) => void;
    quitar: (id: number) => void;
    cambiarCantidad: (id: number, cantidad: number) => void;
    vaciar: () => void;
    totalItems: number;
    subtotal: number;
}

const CarritoContext = createContext<CarritoContexto | null>(null);
const CLAVE_STORAGE = "techstore-carrito";

// Lee el carrito guardado (solo valida la forma, el stock se verifica al usar)
function leerInicial(): ItemCarrito[] {
    try {
        const raw = localStorage.getItem(CLAVE_STORAGE);
        if (!raw) return [];
        const datos = JSON.parse(raw);
        if (!Array.isArray(datos)) return [];
        return datos.filter(
            (i) =>
                typeof i?.id === "number" &&
                typeof i?.cantidad === "number" &&
                i.cantidad > 0
        );
    } catch {
        return [];
    }
}

export function CarritoProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ItemCarrito[]>(leerInicial);
    const { productos: productosLocales } = useInventario();
    const { productos: productosBackend } = useCatalogo();

    // El catálogo público (backend) tiene prioridad; el inventario local cubre los productos demo.
    // Así cualquier producto visible en la tienda puede agregarse al carrito, con o sin sesión.
    const productos = useMemo(() => {
        const mapa = new Map<number, ProductoInv>();
        productosLocales.forEach((p) => mapa.set(p.id, p));
        productosBackend.forEach((p) => mapa.set(p.id, p));
        return Array.from(mapa.values());
    }, [productosLocales, productosBackend]);

    // Guarda cada cambio en el navegador
    useEffect(() => {
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(items));
    }, [items]);

    // Agrega un producto respetando su stock actual del inventario
    const agregar = (id: number, cantidad = 1) => {
        const prod = productos.find((p) => p.id === id);
        if (!prod || !prod.activo || prod.stock === 0) return;
        setItems((prev) => {
            const existe = prev.find((i) => i.id === id);
            if (existe) {
                const nueva = Math.min(existe.cantidad + cantidad, prod.stock);
                return prev.map((i) => (i.id === id ? { ...i, cantidad: nueva } : i));
            }
            return [...prev, { id, cantidad: Math.min(cantidad, prod.stock) }];
        });
    };

    const quitar = (id: number) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    // Cambia la cantidad (0 o menos = quitar), sin pasar el stock
    const cambiarCantidad = (id: number, cantidad: number) => {
        const prod = productos.find((p) => p.id === id);
        if (!prod) return;
        if (cantidad <= 0) {
            quitar(id);
            return;
        }
        const limitada = Math.min(cantidad, prod.stock);
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: limitada } : i)));
    };

    const vaciar = () => setItems([]);

    const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

    const subtotal = items.reduce((acc, i) => {
        const prod = productos.find((p) => p.id === i.id);
        return acc + (prod ? prod.precio * i.cantidad : 0);
    }, 0);

    return (
        <CarritoContext.Provider
            value={{ items, catalogo: productos, agregar, quitar, cambiarCantidad, vaciar, totalItems, subtotal }}
        >
            {children}
        </CarritoContext.Provider>
    );
}

// Hook para usar el carrito en cualquier página o componente
export function useCarrito(): CarritoContexto {
    const ctx = useContext(CarritoContext);
    if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
    return ctx;
}
