/**
 * Conexión centralizada al Backend API (Render y Local).
 *
 * - PRODUCCIÓN (Render Static Site):
 *   Configura la variable de entorno VITE_API_URL en Render
 *   (ej. https://techstore-backend.onrender.com), o déjala vacía ""
 *   si utilizas la regla Rewrite /api/* -> <url-backend>/api/:splat.
 *
 * - LOCAL (para seguir trabajando en tu PC):
 *   Deja VITE_API_URL vacío "" para usar el proxy de Vite (/api -> http://localhost:8080),
 *   o descomenta en tienda_web_frontend/.env:
 *   # VITE_API_URL=http://localhost:8080
 */
// const API_BASE_LOCAL = "http://localhost:8080"; // Referencia local comentada

const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "";

export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, "");

/** Construye la URL final hacia el backend respetando el entorno actual. */
export function apiUrl(ruta: string): string {
    const path = ruta.startsWith("/") ? ruta : `/${ruta}`;
    return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

