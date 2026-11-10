import type { ProductoInv } from "../context/InventarioContext";
import { PRODUCTOS as CATALOGO_RESPALDO } from "../data/productos";

// Contrato que devuelve el backend (ProductoDTO) y que usamos en el frontend.
interface ProductoBackend {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
    stock: number;
    vendidos: number;
    imagen: string;
    descripcion: string;
    activo: boolean;
}

function aProductoInv(p: ProductoBackend): ProductoInv {
    return {
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        precio: Number(p.precio),
        stock: p.stock,
        vendidos: p.vendidos,
        imagen: p.imagen || "",
        descripcion: p.descripcion,
        activo: p.activo,
    };
}

function respaldoCatalogo(): ProductoInv[] {
    return CATALOGO_RESPALDO.map((p) => ({ ...p, activo: true }));
}

/** GET /api/productos — listar catálogo público de productos (con respaldo local si el servidor aún está reiniciando). */
export async function listarProductos(token?: string | null): Promise<ProductoInv[]> {
    try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const resp = await fetch("/api/productos", { headers });
        if (resp.ok) {
            const data = (await resp.json()) as ProductoBackend[];
            if (Array.isArray(data) && data.length > 0) {
                return data.map(aProductoInv);
            }
        }
    } catch {
        // Fallback automático al catálogo base si el backend no responde temporalmente
    }
    return respaldoCatalogo();
}

/** GET /api/productos/{id} — detalle público del producto. */
export async function obtenerProducto(token: string | null | undefined, id: number): Promise<ProductoInv> {
    try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const resp = await fetch(`/api/productos/${id}`, { headers });
        if (resp.ok) {
            const data = (await resp.json()) as ProductoBackend;
            return aProductoInv(data);
        }
    } catch {
        // Fallback automático al catálogo base
    }
    const local = CATALOGO_RESPALDO.find((p) => p.id === id);
    if (local) return { ...local, activo: true };
    throw new Error("No se pudo obtener el producto");
}

/** POST /api/productos — registrar producto (con imagen ya subida a Cloudinary). */
export async function crearProducto(
    token: string,
    datos: { nombre: string; categoria: string; precio: number; stock: number; imagen?: string; descripcion: string }
): Promise<ProductoInv> {
    const resp = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            nombre: datos.nombre,
            categoria: datos.categoria,
            precio: datos.precio,
            stock: datos.stock,
            imagen: datos.imagen,
            descripcion: datos.descripcion,
            activo: true,
        }),
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) throw new Error(String((data as { error?: string }).error || "No se pudo crear el producto"));
    const creado = data as unknown as ProductoBackend;
    return aProductoInv(creado);
}

/** POST /api/productos/imagen -> subir archivo a Cloudinary (multipart) y devolver { url, publicId }. */
export async function subirImagen(token: string, archivo: File): Promise<{ url: string; publicId: string }> {
    const form = new FormData();
    form.append("archivo", archivo);
    const resp = await fetch("/api/productos/imagen", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) throw new Error(String((data as { error?: string }).error || "No se pudo subir la imagen"));
    const subida = data as { url?: string; publicId?: string };
    return { url: subida.url || "", publicId: subida.publicId || "" };
}

/** PATCH /api/productos/{id}/baja-logica — baja lógica del producto según normas 3FN. */
export async function darDeBajaLogicaProducto(token: string, id: number): Promise<ProductoInv> {
    const resp = await fetch(`/api/productos/${id}/baja-logica`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) throw new Error(String((data as { error?: string }).error || "No se pudo dar de baja lógica al producto"));
    const actualizado = data as unknown as ProductoBackend;
    return aProductoInv(actualizado);
}

/** DELETE /api/productos/{id} -> eliminar producto (baja lógica). */
export async function eliminarProducto(token: string, id: number): Promise<void> {
    const resp = await fetch(`/api/productos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error("No se pudo eliminar el producto");
}

/** PUT /api/productos/{id} — editar o activar/desactivar producto. */
export async function actualizarProducto(token: string, id: number, datos: {
    nombre?: string;
    categoria?: string;
    precio?: number;
    stock?: number;
    imagen?: string;
    descripcion?: string;
    activo?: boolean;
}): Promise<ProductoInv> {
    const resp = await fetch(`/api/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) throw new Error(String((data as { error?: string }).error || "No se pudo actualizar el producto"));
    const actualizado = data as unknown as ProductoBackend;
    return aProductoInv(actualizado);
}
