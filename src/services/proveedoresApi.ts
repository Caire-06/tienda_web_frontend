import { apiUrl } from "../config/api";
import { normalizarRespuestaPaginada, type RespuestaPaginada } from "./apiPaginacion";

export interface Proveedor {
    id: number;
    idProveedor?: number;
    nombre: string;
    ruc?: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    activo: boolean;
}

function normalizarProveedor(raw: any): Proveedor {
    return {
        id: Number(raw.id ?? raw.idProveedor ?? 0),
        idProveedor: Number(raw.idProveedor ?? raw.id ?? 0),
        nombre: String(raw.nombre || ""),
        ruc: raw.ruc ? String(raw.ruc) : undefined,
        contacto: raw.contacto ? String(raw.contacto) : undefined,
        telefono: raw.telefono ? String(raw.telefono) : undefined,
        email: raw.email ? String(raw.email) : undefined,
        direccion: raw.direccion ? String(raw.direccion) : undefined,
        activo: Boolean(raw.activo !== false),
    };
}

/** GET /api/proveedores -> listar proveedores activos (catálogo para registrar entradas). */
export async function listarProveedores(token: string): Promise<Proveedor[]> {
    const resp = await fetch(apiUrl("/api/proveedores"), {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await resp.json().catch(() => [])) as any[];
    if (!resp.ok) throw new Error("No se pudo listar los proveedores");
    const lista = Array.isArray(data) ? data.map(normalizarProveedor) : [];
    return lista;
}

/** GET /api/proveedores con paginación server-side. */
export async function listarProveedoresPaginado(
    token: string,
    pagina: number = 1,
    limite: number = 10
): Promise<RespuestaPaginada<Proveedor>> {
    const page0 = Math.max(0, pagina - 1);
    const resp = await fetch(apiUrl(`/api/proveedores?page=${page0}&size=${limite}`), {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json().catch(() => []);
    if (!resp.ok) throw new Error("No se pudo listar los proveedores");
    return normalizarRespuestaPaginada(data, normalizarProveedor, pagina, limite);
}

/** POST /api/proveedores -> registrar un nuevo proveedor. */
export async function crearProveedor(
    token: string,
    datos: { nombre: string; ruc?: string; contacto?: string; telefono?: string; email?: string; direccion?: string; activo?: boolean }
): Promise<Proveedor> {
    const resp = await fetch(apiUrl("/api/proveedores"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) throw new Error(String((data as { error?: string }).error || "No se pudo registrar el proveedor"));
    return data as unknown as Proveedor;
}

/** PUT /api/proveedores/{id} -> actualizar proveedor existente. */
export async function actualizarProveedor(
    token: string,
    id: number,
    datos: { nombre: string; ruc?: string; contacto?: string; telefono?: string; email?: string; direccion?: string; activo?: boolean }
): Promise<Proveedor> {
    const resp = await fetch(apiUrl(`/api/proveedores/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) throw new Error(String((data as { error?: string }).error || "No se pudo actualizar el proveedor"));
    return data as unknown as Proveedor;
}
