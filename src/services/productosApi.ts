import type { EspecificacionInv, ProductoInv } from "../context/InventarioContext";
import { apiUrl } from "../config/api";
import { normalizarRespuestaPaginada, type RespuestaPaginada } from "./apiPaginacion";

// Contrato que devuelve el backend (ProductoDTO).
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
    marca?: string;
    fechaCreacion?: string;
    especificaciones?: EspecificacionInv[];
}

// Convierte el producto del backend al formato utilizado por el frontend.
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
        marca: p.marca || "Genérico",
        fechaCreacion: p.fechaCreacion,
        especificaciones: Array.isArray(p.especificaciones) ? p.especificaciones : [],
    };
}

/** Normaliza las filas de la ficha técnica antes de enviarlas al backend. */
function normalizarEspecificaciones(
    especificaciones?: EspecificacionInv[]
): EspecificacionInv[] {
    if (!Array.isArray(especificaciones)) return [];
    return especificaciones
        .filter((e) => e && e.caracteristica?.trim() && e.valor?.trim())
        .map((e) => ({
            caracteristica: e.caracteristica.trim(),
            valor: e.valor.trim(),
        }));
}

// Cabeceras para endpoints públicos: envía el token solo si existe una sesión.
function cabecerasOpcionales(token?: string | null): HeadersInit {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/** GET /api/productos — listar productos registrados en PostgreSQL. */
export async function listarProductos(token?: string | null): Promise<ProductoInv[]> {
    const resp = await fetch(apiUrl("/api/productos"), {
        headers: cabecerasOpcionales(token),
    });

    if (!resp.ok) {
        throw new Error("No se pudieron cargar los productos. Inténtalo nuevamente.");
    }

    const data = (await resp.json()) as ProductoBackend[];

    const convertidos = Array.isArray(data) ? data.map(aProductoInv) : [];
    // Deduplicación por ID: garantiza que cada producto se muestre una sola vez.
    const unicos = new Map<number, ProductoInv>();
    convertidos.forEach((p) => unicos.set(p.id, p));
    return Array.from(unicos.values());
}

/** GET /api/productos con paginación server-side y filtros canónicos. */
export async function listarProductosPaginado(
    token?: string | null,
    pagina: number = 1,
    limite: number = 10,
    categoria?: string,
    busqueda?: string
): Promise<RespuestaPaginada<ProductoInv>> {
    const page0 = Math.max(0, pagina - 1);
    const params = new URLSearchParams();
    params.set("page", String(page0));
    params.set("size", String(limite));
    if (categoria && categoria !== "Todas") params.set("categoria", categoria);
    if (busqueda && busqueda.trim()) params.set("busqueda", busqueda.trim());

    const resp = await fetch(apiUrl(`/api/productos?${params.toString()}`), {
        headers: cabecerasOpcionales(token),
    });

    if (!resp.ok) {
        throw new Error("No se pudieron cargar los productos. Inténtalo nuevamente.");
    }

    const data = await resp.json();
    return normalizarRespuestaPaginada(data, aProductoInv, pagina, limite);
}

/** GET /api/productos/{id} — obtener detalle de un producto. */
export async function obtenerProducto(
    token: string | null | undefined,
    id: number
): Promise<ProductoInv> {
    const resp = await fetch(apiUrl(`/api/productos/${id}`), {
        headers: cabecerasOpcionales(token),
    });

    if (!resp.ok) {
        throw new Error("No se pudo obtener el producto.");
    }

    const data = (await resp.json()) as ProductoBackend;

    return aProductoInv(data);
}

/** POST /api/productos — registrar producto. */
export async function crearProducto(
    token: string,
    datos: {
        nombre: string;
        categoria: string;
        precio: number;
        stock: number;
        imagen?: string;
        descripcion: string;
        marca?: string;
        especificaciones?: EspecificacionInv[];
    }
): Promise<ProductoInv> {
    const resp = await fetch(apiUrl("/api/productos"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            nombre: datos.nombre,
            categoria: datos.categoria,
            precio: datos.precio,
            stock: datos.stock,
            imagen: datos.imagen,
            descripcion: datos.descripcion,
            activo: true,
            marca: datos.marca || "Genérico",
            especificaciones: normalizarEspecificaciones(datos.especificaciones),
        }),
    });

    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;

    if (!resp.ok) {
        throw new Error(
            String(data.error || "No se pudo crear el producto.")
        );
    }

    return aProductoInv(data as unknown as ProductoBackend);
}

/** POST /api/productos/imagen — subir imagen a Cloudinary. */
export async function subirImagen(
    token: string,
    archivo: File
): Promise<{ url: string; publicId: string }> {
    const form = new FormData();
    form.append("archivo", archivo);

    const resp = await fetch(apiUrl("/api/productos/imagen"), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: form,
    });

    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;

    if (!resp.ok) {
        throw new Error(
            String(data.error || "No se pudo subir la imagen.")
        );
    }

    const subida = data as { url?: string; publicId?: string };

    return {
        url: subida.url || "",
        publicId: subida.publicId || "",
    };
}

/** PATCH /api/productos/{id}/baja-logica — dar de baja un producto. */
export async function darDeBajaLogicaProducto(
    token: string,
    id: number
): Promise<ProductoInv> {
    const resp = await fetch(apiUrl(`/api/productos/${id}/baja-logica`), {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;

    if (!resp.ok) {
        throw new Error(
            String(data.error || "No se pudo dar de baja lógica al producto.")
        );
    }

    return aProductoInv(data as unknown as ProductoBackend);
}

/** DELETE /api/productos/{id} — eliminar producto mediante baja lógica. */
export async function eliminarProducto(
    token: string,
    id: number
): Promise<void> {
    const resp = await fetch(apiUrl(`/api/productos/${id}`), {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!resp.ok) {
        throw new Error("No se pudo eliminar el producto.");
    }
}

/** PUT /api/productos/{id} — actualizar o activar/desactivar producto. */
export async function actualizarProducto(
    token: string,
    id: number,
    datos: {
        nombre?: string;
        categoria?: string;
        precio?: number;
        stock?: number;
        imagen?: string;
        descripcion?: string;
        activo?: boolean;
        marca?: string;
        especificaciones?: EspecificacionInv[];
    }
): Promise<ProductoInv> {
    const body: Record<string, unknown> = { ...datos };
    if (Array.isArray(datos.especificaciones)) {
        body.especificaciones = normalizarEspecificaciones(datos.especificaciones);
    }
    const resp = await fetch(apiUrl(`/api/productos/${id}`), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;

    if (!resp.ok) {
        throw new Error(
            String(data.error || "No se pudo actualizar el producto.")
        );
    }

    return aProductoInv(data as unknown as ProductoBackend);
}
