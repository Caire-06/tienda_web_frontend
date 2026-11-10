export interface UsuarioDTO {
    id: number;
    username: string;
    nombre: string;
    email: string;
    telefono: string;
    rol: string;
    bloqueado: boolean;
    estado?: string;
    fechaRegistro: string;
    ultimoAcceso: string;
    requiereCambioPassword?: boolean;
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
    const res = await fetch("/api/usuarios", {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Error al listar usuarios");
    return res.json();
}

export async function crearUsuario(token: string, datos: CrearUsuarioDatos): Promise<UsuarioCreadoAdmin> {
    const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datos)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "Error al crear usuario");
    return data as UsuarioCreadoAdmin;
}

export async function cambiarPasswordPerfil(
    token: string,
    passwordActual: string,
    passwordNueva: string
): Promise<string> {
    const res = await fetch("/api/perfil/password", {
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
    const res = await fetch(`/api/usuarios/${id}/rol`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rol })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cambiar rol");
    return data;
}

export async function cambiarEstadoUsuario(token: string, id: number, bloqueado: boolean): Promise<UsuarioDTO> {
    const res = await fetch(`/api/usuarios/${id}/estado`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bloqueado })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cambiar estado");
    return data;
}

export async function darDeBajaLogicaUsuario(token: string, id: number): Promise<UsuarioDTO> {
    const res = await fetch(`/api/usuarios/${id}/baja-logica`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al dar de baja lógica al usuario");
    return data;
}

export async function eliminarUsuario(token: string, id: number): Promise<void> {
    await darDeBajaLogicaUsuario(token, id);
}
