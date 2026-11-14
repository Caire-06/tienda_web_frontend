// Modelos y utilidades de almacenamiento para usuarios y sesiones
export type Rol = "admin" | "almacen" | "cliente";

export interface Usuario {
    id: string;
    nombre: string;
    acceso: string; // usuario o correo con el que ingresa
    rol: Rol;
    requiereCambioPassword?: boolean;
}

export interface CuentaDemo {
    acceso: string;
    password: string;
    usuario: Usuario;
}

export interface UsuarioRegistrado {
    nombre: string;
    correo: string;
    password: string;
    fechaRegistro?: string;
    rol?: Rol;
    direccion?: string;
}

export const CLAVE_USUARIOS = "techstore-usuarios";
export const CLAVE_SESION = "techstore-sesion";
export const CLAVE_ESTADOS = "techstore-usuarios-estado"; // { id: "activo" | "inactivo" }

// Cuentas demo desactivadas en código cliente para no exponer credenciales en producción.
export const CUENTAS_FIJAS: CuentaDemo[] = [];

// Listado referencial sin credenciales (las cuentas reales provienen del backend PostgreSQL).
export const CUENTAS_BASE: Array<{ id: string; nombre: string; acceso: string; rol: Rol; fecha: string; fija: boolean }> = [];

export function obtenerEstado(id: string): "activo" | "inactivo" {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_ESTADOS) ?? "{}");
        return datos[id] === "inactivo" ? "inactivo" : "activo";
    } catch {
        return "activo";
    }
}

export function cambiarEstado(id: string, estado: "activo" | "inactivo"): void {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_ESTADOS) ?? "{}");
        datos[id] = estado;
        localStorage.setItem(CLAVE_ESTADOS, JSON.stringify(datos));
    } catch {
        // No se pudo guardar
    }
}

export function cambiarRolRegistrado(correo: string, rol: Rol): void {
    try {
        const lista: UsuarioRegistrado[] = JSON.parse(localStorage.getItem(CLAVE_USUARIOS) ?? "[]");
        const user = lista.find((u) => u.correo === correo);
        if (user) {
            user.rol = rol;
            localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
        }
    } catch {
        // No se pudo guardar
    }
}

export function leerUsuarios(): UsuarioRegistrado[] {
    try {
        const raw = localStorage.getItem(CLAVE_USUARIOS);
        const datos = raw ? JSON.parse(raw) : [];
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

export function leerSesion(): Usuario | null {
    try {
        const id = localStorage.getItem(CLAVE_SESION);
        if (!id) return null;
        const fija = CUENTAS_FIJAS.find((c) => c.usuario.id === id);
        if (fija) return fija.usuario;
        const reg = leerUsuarios().find((u) => u.correo === id);
        if (reg) return { id: reg.correo, nombre: reg.nombre, acceso: reg.correo, rol: reg.rol ?? "cliente" };
        return null;
    } catch {
        return null;
    }
}
