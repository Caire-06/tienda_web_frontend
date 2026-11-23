import { apiUrl } from "../config/api";

export interface Proveedor {
    id: number;
    nombre: string;
    ruc?: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    activo: boolean;
}

/** GET /api/proveedores -> listar proveedores activos (catálogo para registrar entradas). */
export async function listarProveedores(token: string): Promise<Proveedor[]> {
    const resp = await fetch(apiUrl("/api/proveedores"), {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await resp.json().catch(() => [])) as Proveedor[] | Proveedor;
    if (!resp.ok) throw new Error("No se pudo listar los proveedores");
    const lista = Array.isArray(data) ? data : [];
    return lista;
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
