import { apiUrl } from "../config/api";

export interface LoginRespuestaBackend {
    exitoso?: boolean;
    mensaje?: string;
    intentosRestantes?: number;
    cuentaBloqueada?: boolean;
    token?: string;
    rol?: string;
    nombreUsuario?: string;
    segundosEspera?: number;
    requiereCambioPassword?: boolean;
    requiereVerificacionCorreo?: boolean;
    requiere2fa?: boolean;
    desafioToken?: string;
    correoDestino?: string;
    error?: string;
}

export interface ReenviarCodigoRespuesta {
    mensaje?: string;
    desafioToken?: string;
    correoDestino?: string;
    cooldownSegundos?: number;
    error?: string;
}

export interface MensajeApiRespuesta {
    mensaje?: string;
    error?: string;
}

async function postAuthJson<T>(ruta: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
    const res = await fetch(apiUrl(ruta), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, status: res.status, data };
}

export function loginApi(nombreUsuario: string, contrasena: string) {
    return postAuthJson<LoginRespuestaBackend>("/api/auth/login", { nombreUsuario, contrasena });
}

export function registroApi(datos: Record<string, unknown>) {
    return postAuthJson<LoginRespuestaBackend>("/api/auth/registro", datos);
}

export function verificarCorreoApi(desafioToken: string, codigo: string) {
    return postAuthJson<LoginRespuestaBackend>("/api/auth/verificar-correo", { desafioToken, codigo });
}

export function verificarTwoFactorApi(desafioToken: string, codigo: string) {
    return postAuthJson<LoginRespuestaBackend>("/api/auth/verificar-2fa", { desafioToken, codigo });
}

export function reenviarCodigoApi(desafioToken: string) {
    return postAuthJson<ReenviarCodigoRespuesta>("/api/auth/reenviar-codigo", { desafioToken });
}

export function solicitarRecuperacionApi(correo: string) {
    return postAuthJson<MensajeApiRespuesta>("/api/auth/recuperar-password", { correo });
}

export function restablecerPasswordApi(correo: string, codigo: string, nuevaContrasena: string) {
    return postAuthJson<MensajeApiRespuesta>("/api/auth/restablecer-password", {
        correo,
        codigo,
        nuevaContrasena,
    });
}

