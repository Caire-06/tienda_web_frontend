import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Rol, Usuario } from "../data/usuarios";
import { apiUrl } from "../config/api";
import {
  loginApi,
  reenviarCodigoApi,
  registroApi,
  verificarCorreoApi,
  verificarTwoFactorApi,
  type LoginRespuestaBackend,
} from "../services/authApi";
export type { Rol, Usuario };

export interface DatosRegistro { nombre: string; apellido: string; correo: string; direccion?: string; password: string; }
export interface ResultadoReenvio { ok: boolean; error?: string; desafioToken?: string; correoDestino?: string; cooldownSegundos?: number; }
export interface Resultado {
  ok: boolean;
  error?: string;
  mensaje?: string;
  usuario?: Usuario;
  bloqueado?: boolean;
  segundosEspera?: number;
  requiereVerificacionCorreo?: boolean;
  requiere2fa?: boolean;
  desafioToken?: string;
  correoDestino?: string;
}
interface AuthContexto {
  usuario: Usuario | null;
  token: string | null;
  login: (acceso: string, password: string) => Promise<Resultado>;
  registro: (datos: DatosRegistro) => Promise<Resultado>;
  verificarCorreo: (desafioToken: string, codigo: string) => Promise<Resultado>;
  verificar2fa: (desafioToken: string, codigo: string) => Promise<Resultado>;
  reenviarCodigo: (desafioToken: string) => Promise<ResultadoReenvio>;
  logout: () => void;
  actualizarNombre: (nombre: string) => void;
  marcarPasswordActualizada: () => void;
}
const AuthContext = createContext<AuthContexto | null>(null);
const SESION = "techstore-auth-v2";
type SesionGuardada = { usuario: Usuario; token: string };
function leerGuardada(): SesionGuardada | null {
  try {
    const item = sessionStorage.getItem(SESION);
    if (!item) return null;
    const parsed = JSON.parse(item);
    return parsed?.token && parsed?.usuario?.id ? parsed as SesionGuardada : null;
  } catch { return null; }
}
function rolDeBackend(valor: string): Rol {
  if (valor === "ADMINISTRADOR") return "admin";
  if (valor === "ALMACEN") return "almacen";
  return "cliente";
}
async function respuestaJson(resp: Response): Promise<Record<string, unknown>> {
  return (await resp.json().catch(() => ({}))) as Record<string, unknown>;
}
function errorRespuesta(data: { mensaje?: unknown; error?: unknown }, alternativo: string): string {
  return String(data.mensaje || data.error || alternativo);
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionGuardada | null>(leerGuardada);
  const usuario = sesion?.usuario ?? null;
  const token = sesion?.token ?? null;
  function guardarSesion(nueva: SesionGuardada | null) {
    setSesion(nueva);
    if (nueva) sessionStorage.setItem(SESION, JSON.stringify(nueva));
    else sessionStorage.removeItem(SESION);
    // No permitir que el antiguo login local reabra sesiones sin servidor.
    localStorage.removeItem("techstore-sesion");
  }
  useEffect(() => {
    // Eliminar registros locales heredados que podían contener contraseñas en texto plano.
    localStorage.removeItem("techstore-usuarios");
    localStorage.removeItem("techstore-sesion");
    localStorage.removeItem("techstore-perfiles");
    if (!sesion) return;
    fetch(apiUrl("/api/perfil"), { headers: { Authorization: `Bearer ${sesion.token}` } })
      .then(async (resp) => {
        if (!resp.ok) {
          guardarSesion(null);
          return;
        }
        const perfil = await respuestaJson(resp);
        const requiere = Boolean(perfil.requiereCambioPassword);
        if (Boolean(sesion.usuario.requiereCambioPassword) !== requiere) {
          guardarSesion({ ...sesion, usuario: { ...sesion.usuario, requiereCambioPassword: requiere } });
        }
      })
      .catch(() => guardarSesion(null));
    // Validar la sesión al montar la aplicación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function finalizarSesionDesdeRespuesta(
    data: LoginRespuestaBackend,
    accesoAlternativo = ""
  ): Promise<Resultado> {
    const tokenNuevo = String(data.token || "");
    const perfilResp = await fetch(apiUrl("/api/perfil"), {
      headers: { Authorization: `Bearer ${tokenNuevo}` },
    });
    const perfil = await respuestaJson(perfilResp);
    if (!perfilResp.ok) {
      return { ok: false, error: "No fue posible validar la sesión en Mi Cuenta" };
    }
    const acceso = String(data.nombreUsuario || accesoAlternativo);
    const cuenta: Usuario = {
      id: acceso,
      acceso,
      nombre: `${perfil.nombres || ""} ${perfil.apellidos || ""}`.trim() || acceso,
      rol: rolDeBackend(String(data.rol || "CLIENTE")),
      requiereCambioPassword: Boolean(data.requiereCambioPassword || perfil.requiereCambioPassword),
    };
    guardarSesion({ usuario: cuenta, token: tokenNuevo });
    return { ok: true, usuario: cuenta };
  }

  async function mapearRespuestaAuth(
    ok: boolean,
    status: number,
    data: LoginRespuestaBackend,
    errorDefault: string,
    accesoAlternativo = ""
  ): Promise<Resultado> {
    if (data.requiereVerificacionCorreo && data.desafioToken) {
      return {
        ok: false,
        requiereVerificacionCorreo: true,
        desafioToken: String(data.desafioToken),
        correoDestino: String(data.correoDestino || ""),
        mensaje: String(data.mensaje || "Verifica tu correo electrónico."),
      };
    }
    if (data.requiere2fa && data.desafioToken) {
      return {
        ok: false,
        requiere2fa: true,
        desafioToken: String(data.desafioToken),
        correoDestino: String(data.correoDestino || ""),
        mensaje: String(data.mensaje || "Ingresa el código de verificación en dos pasos."),
      };
    }
    if (!ok || !data.exitoso || !data.token) {
      return {
        ok: false,
        error: errorRespuesta(data, errorDefault),
        bloqueado: status === 423 || !!data.cuentaBloqueada,
        segundosEspera: Number(data.segundosEspera) || 0,
      };
    }
    return finalizarSesionDesdeRespuesta(data, accesoAlternativo);
  }

  const login = async (acceso: string, password: string): Promise<Resultado> => {
    try {
      const { ok, status, data } = await loginApi(acceso.trim(), password);
      return await mapearRespuestaAuth(ok, status, data, "No se pudo iniciar sesión", acceso.trim());
    } catch {
      return { ok: false, error: "No hay conexión con Spring Boot. Comprueba que el backend esté encendido." };
    }
  };
  const registro = async (datos: DatosRegistro): Promise<Resultado> => {
    try {
      const { ok, status, data } = await registroApi({
        ...datos,
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo: datos.correo.trim().toLowerCase(),
        direccion: datos.direccion?.trim() || "",
      });
      return await mapearRespuestaAuth(ok, status, data, "No se pudo registrar la cuenta", datos.correo.trim().toLowerCase());
    } catch {
      return { ok: false, error: "No hay conexión con Spring Boot. No se creó una cuenta local." };
    }
  };
  const verificarCorreo = async (desafioToken: string, codigo: string): Promise<Resultado> => {
    try {
      const { ok, status, data } = await verificarCorreoApi(desafioToken, codigo);
      return await mapearRespuestaAuth(ok, status, data, "Código de verificación incorrecto o expirado");
    } catch {
      return { ok: false, error: "No hay conexión con el servidor para validar el código." };
    }
  };
  const verificar2fa = async (desafioToken: string, codigo: string): Promise<Resultado> => {
    try {
      const { ok, status, data } = await verificarTwoFactorApi(desafioToken, codigo);
      return await mapearRespuestaAuth(ok, status, data, "Código 2FA incorrecto o expirado");
    } catch {
      return { ok: false, error: "No hay conexión con el servidor para validar el código 2FA." };
    }
  };
  const reenviarCodigo = async (desafioToken: string): Promise<ResultadoReenvio> => {
    try {
      const { ok, data } = await reenviarCodigoApi(desafioToken);
      if (!ok) {
        return { ok: false, error: String(data.error || "No se pudo reenviar el código.") };
      }
      return {
        ok: true,
        desafioToken: data.desafioToken,
        correoDestino: data.correoDestino,
        cooldownSegundos: Number(data.cooldownSegundos) || 45,
      };
    } catch {
      return { ok: false, error: "No hay conexión con el servidor." };
    }
  };
  const logout = () => {
    if (token) void fetch(apiUrl("/api/auth/logout"), { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    guardarSesion(null);
  };
  const actualizarNombre = (nombre: string) => {
    if (!sesion) return;
    guardarSesion({ ...sesion, usuario: { ...sesion.usuario, nombre } });
  };
  const marcarPasswordActualizada = () => {
    if (!sesion) return;
    guardarSesion({ ...sesion, usuario: { ...sesion.usuario, requiereCambioPassword: false } });
  };
  return <AuthContext.Provider value={{ usuario, token, login, registro, verificarCorreo, verificar2fa, reenviarCodigo, logout, actualizarNombre, marcarPasswordActualizada }}>{children}</AuthContext.Provider>;
}
export function useAuth(): AuthContexto {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
