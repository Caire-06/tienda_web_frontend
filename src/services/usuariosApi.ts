import { apiUrl } from "../config/api";

export interface UsuarioDTO {
    id: number;
    username: string;
    nombre: string;
    nombreCompleto?: string;
    email: string;
    correo?: string;
    telefono: string;
    rol: string;
    bloqueado: boolean;
    estado?: string;
    fechaRegistro: string;
    ultimoAcceso: string;
    requiereCambioPassword?: boolean;
}

type UsuarioBackendRaw = Record<string, unknown>;

function normalizarUsuarioDTO(raw: UsuarioBackendRaw): UsuarioDTO {
    const username = String(raw.username || "");
    const nombre = String(raw.nombreCompleto || raw.nombre || username);
    const email = String(raw.correo || raw.email || "");
    return {
        id: Number(raw.id),
        username,
        nombre,
        nombreCompleto: nombre,
        email,
        correo: email,
        telefono: String(raw.telefono || "—"),
        rol: String(raw.rol || "CLIENTE"),
        bloqueado: Boolean(raw.bloqueado),
        estado: raw.estado ? String(raw.estado) : undefined,
        fechaRegistro: String(raw.fechaRegistro || ""),
        ultimoAcceso: String(raw.ultimoAcceso || "—"),
        requiereCambioPassword: Boolean(raw.requiereCambioPassword),
    };
}

export interface CrearUsuarioDatos {
    username: string;
    password?: string;
    rol: string;
    nombres: string;
    apellidos: string;
    dni: string;
    correo?: string;
    tipoCorreo?: string;
    telefono?: string;
    tipoTelefono?: string;
}

export interface UsuarioCreadoAdmin {
    usuario: UsuarioDTO;
    passwordTemporal: string;
}

export async function listarUsuarios(token: string): Promise<UsuarioDTO[]> {
    const res = await fetch(apiUrl("/api/usuarios"), {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Error al listar usuarios");
    const data = (await res.json()) as UsuarioBackendRaw[];
    return Array.isArray(data) ? data.map(normalizarUsuarioDTO) : [];
}

export async function crearUsuario(token: string, datos: CrearUsuarioDatos): Promise<UsuarioCreadoAdmin> {
    const res = await fetch(apiUrl("/api/usuarios"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datos)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "Error al crear usuario");
    return {
        usuario: normalizarUsuarioDTO((data.usuario || {}) as UsuarioBackendRaw),
        passwordTemporal: String(data.passwordTemporal || ""),
    };
}

export async function cambiarPasswordPerfil(
    token: string,
    passwordActual: string,
    passwordNueva: string
): Promise<string> {
    const res = await fetch(apiUrl("/api/perfil/password"), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passwordActual, passwordNueva })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "No se pudo actualizar la contraseña");
    return String(data.mensaje || "Contraseña actualizada correctamente");
}

export async function cambiarRolUsuario(token: string, id: number, rol: string): Promise<UsuarioDTO> {
    const res = await fetch(apiUrl(`/api/usuarios/${id}/rol`), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rol })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cambiar rol");
    return normalizarUsuarioDTO(data as UsuarioBackendRaw);
}

export async function cambiarEstadoUsuario(token: string, id: number, bloqueado: boolean): Promise<UsuarioDTO> {
    const res = await fetch(apiUrl(`/api/usuarios/${id}/estado`), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bloqueado })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cambiar estado");
    return normalizarUsuarioDTO(data as UsuarioBackendRaw);
}

export async function darDeBajaLogicaUsuario(token: string, id: number): Promise<UsuarioDTO> {
    const res = await fetch(apiUrl(`/api/usuarios/${id}/baja-logica`), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al dar de baja lógica al usuario");
    return normalizarUsuarioDTO(data as UsuarioBackendRaw);
}

export async function eliminarUsuario(token: string, id: number): Promise<void> {
    await darDeBajaLogicaUsuario(token, id);
}
