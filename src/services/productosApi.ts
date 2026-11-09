import type { ProductoInv } from "../context/InventarioContext";

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
        imagen: p.imagen || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop",
        descripcion: p.descripcion,
        activo: p.activo,
    };
}

/** GET /api/productos — listar productos para el módulo de Almacén. */
export async function listarProductos(token: string): Promise<ProductoInv[]> {
    const resp = await fetch("/api/productos", { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error("No se pudo listar productos");
    const data = (await resp.json()) as ProductoBackend[];
    return (Array.isArray(data) ? data : []).map(aProductoInv);
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
