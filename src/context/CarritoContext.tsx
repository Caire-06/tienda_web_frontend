
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useInventario } from "./InventarioContext";
import type { ProductoInv } from "./InventarioContext";
import { useCatalogo } from "../hooks/useCatalogo";
import { useAuth } from "./AuthContext";

// Un item del carrito solo guarda id + cantidad.
// Los datos del producto se resuelven desde el catálogo o inventario local.
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

interface EstadoCarrito {
    clave: string;
    items: ItemCarrito[];
}

const CarritoContext = createContext<CarritoContexto | null>(null);

const PREFIJO_STORAGE = "techstore-carrito";

// Genera una clave diferente para cada usuario.
function obtenerClaveStorage(usuarioId: string | number | null): string {
    if (usuarioId === null) {
        return `${PREFIJO_STORAGE}:invitado`;
    }

    return `${PREFIJO_STORAGE}:usuario:${encodeURIComponent(String(usuarioId))}`;
}

// Lee el carrito correspondiente a una cuenta.
function leerCarrito(clave: string): ItemCarrito[] {
    try {
        const raw = localStorage.getItem(clave);

        if (!raw) return [];

        const datos = JSON.parse(raw);

        if (!Array.isArray(datos)) return [];

        return datos.filter(
            (item) =>
                typeof item?.id === "number" &&
                Number.isInteger(item.id) &&
                Number.isInteger(item.cantidad) &&
                item.cantidad > 0
        );
    } catch {
        return [];
    }
}

// Guarda únicamente en la clave correspondiente al usuario.
function guardarCarrito(clave: string, items: ItemCarrito[]): void {
    try {
        localStorage.setItem(clave, JSON.stringify(items));
    } catch (error) {
        console.error("No se pudo guardar el carrito:", error);
    }
}

export function CarritoProvider({ children }: { children: ReactNode }) {
    const { usuario } = useAuth();

    const claveStorage = obtenerClaveStorage(
        usuario ? usuario.id : null
    );

    // El estado también identifica a qué cuenta pertenece.
    const [estadoCarrito, setEstadoCarrito] = useState<EstadoCarrito>(
        () => ({
            clave: claveStorage,
            items: leerCarrito(claveStorage),
        })
    );

    const { productos: productosLocales } = useInventario();
    const { productos: productosBackend } = useCatalogo();

    // Cuando cambia la cuenta, carga su propio carrito.
    useEffect(() => {
        setEstadoCarrito({
            clave: claveStorage,
            items: leerCarrito(claveStorage),
        });
    }, [claveStorage]);

    // Solo muestra los productos si el estado pertenece a la cuenta actual.
    // Mientras se carga otro carrito, no muestra el anterior.
    const items =
        estadoCarrito.clave === claveStorage
            ? estadoCarrito.items
            : [];

    // Permite modificar el carrito actual sin mezclar cuentas.
    const actualizarItems = (
        actualizar: (prev: ItemCarrito[]) => ItemCarrito[]
    ) => {
        setEstadoCarrito((prev) => {
            const itemsActuales =
                prev.clave === claveStorage
                    ? prev.items
                    : leerCarrito(claveStorage);

            return {
                clave: claveStorage,
                items: actualizar(itemsActuales),
            };
        });
    };

    // El catálogo del backend es la fuente oficial.
    // El inventario local se utiliza como respaldo.
    const productos = useMemo(() => {
        const fuente =
            productosBackend.length > 0
                ? productosBackend
                : productosLocales;

        const mapa = new Map<number, ProductoInv>();

        fuente.forEach((producto) => {
            mapa.set(producto.id, producto);
        });

        return Array.from(mapa.values());
    }, [productosLocales, productosBackend]);

    // Guarda únicamente cuando el estado pertenece a la cuenta actual.
    useEffect(() => {
        if (estadoCarrito.clave !== claveStorage) return;

        guardarCarrito(claveStorage, estadoCarrito.items);
    }, [estadoCarrito, claveStorage]);

    // Agrega un producto respetando el stock disponible.
    const agregar = (id: number, cantidad = 1) => {
        const producto = productos.find((p) => p.id === id);

        if (!producto || !producto.activo || producto.stock <= 0) {
            return;
        }

        const cant =
            Number.isInteger(cantidad) && cantidad > 0
                ? cantidad
                : 1;

        actualizarItems((prev) => {
            const existe = prev.find((item) => item.id === id);

            if (existe) {
                const nueva = Math.min(
                    existe.cantidad + cant,
                    producto.stock
                );

                return prev.map((item) =>
                    item.id === id
                        ? { ...item, cantidad: nueva }
                        : item
                );
            }

            return [
                ...prev,
                {
                    id,
                    cantidad: Math.min(cant, producto.stock),
                },
            ];
        });
    };

    // Elimina un producto del carrito.
    const quitar = (id: number) => {
        actualizarItems((prev) =>
            prev.filter((item) => item.id !== id)
        );
    };

    // Cambia la cantidad sin superar el stock.
    const cambiarCantidad = (id: number, cantidad: number) => {
        const producto = productos.find((p) => p.id === id);

        if (!producto) return;

        const valor = Number.isInteger(cantidad)
            ? cantidad
            : Math.floor(cantidad);

        if (valor <= 0) {
            quitar(id);
            return;
        }

        const limitada = Math.min(valor, producto.stock);

        actualizarItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, cantidad: limitada }
                    : item
            )
        );
    };

    // Vacía únicamente el carrito de la cuenta actual.
    const vaciar = () => {
        actualizarItems(() => []);
    };

    const totalItems = items.reduce(
        (acc, item) => acc + item.cantidad,
        0
    );

    const subtotal = items.reduce((acc, item) => {
        const producto = productos.find((p) => p.id === item.id);

        return acc + (producto ? producto.precio * item.cantidad : 0);
    }, 0);

    return (
        <CarritoContext.Provider
            value={{
                items,
                catalogo: productos,
                agregar,
                quitar,
                cambiarCantidad,
                vaciar,
                totalItems,
                subtotal,
            }}
        >
            {children}
        </CarritoContext.Provider>
    );
}

// Hook para utilizar el carrito desde cualquier componente.
export function useCarrito(): CarritoContexto {
    const ctx = useContext(CarritoContext);

    if (!ctx) {
        throw new Error(
            "useCarrito debe usarse dentro de <CarritoProvider>"
        );
    }

    return ctx;
}
