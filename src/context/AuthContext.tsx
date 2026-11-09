import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Rol, Usuario } from "../data/usuarios";
export type { Rol, Usuario };

export interface DatosRegistro { nombre: string; apellido: string; correo: string; direccion?: string; password: string; }
interface Resultado { ok: boolean; error?: string; usuario?: Usuario; bloqueado?: boolean; segundosEspera?: number }
interface AuthContexto {
  usuario: Usuario | null;
  token: string | null;
  login: (acceso: string, password: string) => Promise<Resultado>;
  registro: (datos: DatosRegistro) => Promise<Resultado>;
  logout: () => void;
  actualizarNombre: (nombre: string) => void;
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
  if (valor === "OPERADOR" || valor === "ALMACEN") return "almacen";
  return "cliente";
}
async function respuestaJson(resp: Response): Promise<Record<string, any>> {
  return await resp.json().catch(() => ({}));
}
function errorRespuesta(data: Record<string, any>, alternativo: string): string {
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
    fetch("/api/perfil", { headers: { Authorization: `Bearer ${sesion.token}` } })
      .then((resp) => { if (!resp.ok) guardarSesion(null); })
      .catch(() => guardarSesion(null));
    // Validar la sesión al montar la aplicación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const login = async (acceso: string, password: string): Promise<Resultado> => {
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreUsuario: acceso.trim(), contrasena: password }),
      });
      const data = await respuestaJson(resp);
      if (!resp.ok || !data.exitoso || !data.token) return {
        ok: false, error: errorRespuesta(data, "No se pudo iniciar sesión"),
        bloqueado: resp.status === 423 || !!data.cuentaBloqueada,
        segundosEspera: Number(data.segundosEspera) || 0,
      };
      const perfilResp = await fetch("/api/perfil", { headers: { Authorization: `Bearer ${data.token}` } });
      const perfil = await respuestaJson(perfilResp);
      if (!perfilResp.ok) return { ok: false, error: "No fue posible validar la sesión en Mi Cuenta" };
      const cuenta: Usuario = {
        id: String(data.nombreUsuario || acceso.trim()), acceso: String(data.nombreUsuario || acceso.trim()),
        nombre: `${perfil.nombres || ""} ${perfil.apellidos || ""}`.trim() || String(data.nombreUsuario),
        rol: rolDeBackend(data.rol),
      };
      guardarSesion({ usuario: cuenta, token: String(data.token) });
      return { ok: true, usuario: cuenta };
    } catch { return { ok: false, error: "No hay conexión con Spring Boot. Comprueba que el backend esté encendido." }; }
  };
  const registro = async (datos: DatosRegistro): Promise<Resultado> => {
    try {
      const resp = await fetch("/api/auth/registro", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, nombre: datos.nombre.trim(), apellido: datos.apellido.trim(), correo: datos.correo.trim().toLowerCase(), direccion: datos.direccion?.trim() || "" }),
      });
      const data = await respuestaJson(resp);
      if (!resp.ok || !data.exitoso) return { ok: false, error: errorRespuesta(data, "No se pudo registrar la cuenta") };
      if (!data.token) return { ok: false, error: "La cuenta se creó, pero el servidor no devolvió una sesión. Inicia sesión manualmente." };
      const cuenta: Usuario = {
        id: String(data.nombreUsuario || datos.correo), acceso: datos.correo.trim().toLowerCase(),
        nombre: `${datos.nombre.trim()} ${datos.apellido.trim()}`, rol: "cliente",
      };
      guardarSesion({ usuario: cuenta, token: String(data.token) });
      return { ok: true, usuario: cuenta };
    } catch { return { ok: false, error: "No hay conexión con Spring Boot. No se creó una cuenta local." }; }
  };
  const logout = () => {
    if (token) void fetch("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    guardarSesion(null);
  };
  const actualizarNombre = (nombre: string) => {
    if (!sesion) return;
    guardarSesion({ ...sesion, usuario: { ...sesion.usuario, nombre } });
  };
  return <AuthContext.Provider value={{ usuario, token, login, registro, logout, actualizarNombre }}>{children}</AuthContext.Provider>;
}
export function useAuth(): AuthContexto {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
