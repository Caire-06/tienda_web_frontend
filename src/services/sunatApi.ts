export interface ResultadoDNI {
    dni: string;
    nombreCompleto: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
}

export interface ResultadoRUC {
    ruc: string;
    razonSocial: string;
    estado: string;
    condicion: string;
    direccion: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
}

// API de apiperu (dniruc.apisperu.com). Requiere token Bearer en TODAS las consultas.
// El token se configura en el .env del frontend como VITE_APIPERU_TOKEN.
const TOKEN =
    (import.meta.env.VITE_APIPERU_TOKEN as string | undefined)?.trim() ||
    (import.meta.env.VITE_APISPERU_TOKEN as string | undefined)?.trim() ||
    "";

const BASE = "https://dniruc.apisperu.com/api/v1";

function cabeceras(): Record<string, string> {
    // Solo Accept: el token viaja como query param (?token=) para no disparamos preflight CORS bloqueado por "authorization".
    return { Accept: "application/json" };
}

// El token viaja como parámetro de consulta (evita preflight CORS que rechaza el header Authorization).
function urlConToken(url: string): string {
    if (!TOKEN) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}token=${encodeURIComponent(TOKEN)}`;
}

type JsonApi = Record<string, unknown> & { success?: boolean; message?: string; error?: string; sinToken?: boolean };

async function consultarBackendFiscal(ruta: string): Promise<JsonApi | null> {
    try {
        const resp = await fetch(ruta, {
            signal: AbortSignal.timeout(7000),
            headers: { Accept: "application/json" },
        });
        const data = (await resp.json().catch(() => ({}))) as JsonApi;
        if (resp.ok) return data;
        if (resp.status === 503 && data.sinToken) {
            return null;
        }
        throw new Error(data.error || data.message || `Error al consultar (${resp.status})`);
    } catch (err: unknown) {
        const error = err as Error;
        if (error.message && !error.message.includes("Failed to fetch")) {
            throw error;
        }
        return null;
    }
}

async function pedirJson(url: string): Promise<JsonApi> {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: cabeceras(),
    });
    if (response.status === 401 || response.status === 403) {
        throw new Error(
            TOKEN
                ? "El token de apiperu fue rechazado. Revísalo en tu panel de apisperu.com."
                : "No hay token configurado para RENIEC/SUNAT (APIPERU_TOKEN o VITE_APIPERU_TOKEN). Ingresa el nombre o razón social manualmente."
        );
    }
    if (response.status === 429) {
        throw new Error("Se alcanzó el límite de consultas del token de apiperu (inténtalo más tarde).");
    }
    if (!response.ok) {
        throw new Error(`El servicio respondió con estado ${response.status}`);
    }
    return (await response.json()) as JsonApi;
}

export async function consultarDNI(dni: string): Promise<ResultadoDNI> {
    const limpio = dni.trim().replace(/\D/g, "");
    if (limpio.length !== 8) {
        throw new Error("El DNI debe contener exactamente 8 dígitos numéricos");
    }

    // 1º Adapter en Backend (consulta PostgreSQL local y/o APIPERU_TOKEN / APISNETPE_TOKEN)
    const desdeBackend = await consultarBackendFiscal(`/api/consultas/dni/${limpio}`);
    if (desdeBackend && ((desdeBackend.nombres as string) || (desdeBackend.nombreCompleto as string))) {
        return {
            dni: limpio,
            nombreCompleto:
                (desdeBackend.nombreCompleto as string) ||
                `${desdeBackend.nombres || ""} ${desdeBackend.apellidoPaterno || ""} ${desdeBackend.apellidoMaterno || ""}`.trim(),
            nombres: (desdeBackend.nombres as string) || "",
            apellidoPaterno: (desdeBackend.apellidoPaterno as string) || "",
            apellidoMaterno: (desdeBackend.apellidoMaterno as string) || "",
        };
    }

    if (!TOKEN) {
        throw new Error(
            "Falta configurar APIPERU_TOKEN (backend) o VITE_APIPERU_TOKEN (frontend .env). Ingresa tus Nombres y Apellidos manualmente abajo."
        );
    }

    // 2º Vía proxy de Vite o directo si VITE_APIPERU_TOKEN está configurado
    const urls = [`/api-peru/api/v1/dni/${limpio}`, `${BASE}/dni/${limpio}`];

    let ultimoError = "No se pudo conectar con el servicio de RENIEC";
    let errorFatal: Error | null = null;

    for (const url of urls) {
        try {
            const data = await pedirJson(urlConToken(url));
            if (data && (data as { success?: boolean }).success === false) {
                throw new Error(`El DNI ${limpio} no fue encontrado en los registros de RENIEC.`);
            }
            if (data && ((data.nombres as string) || (data.nombreCompleto as string))) {
                return {
                    dni: limpio,
                    nombreCompleto:
                        (data.nombreCompleto as string) ||
                        `${data.nombres || ""} ${data.apellidoPaterno || ""} ${data.apellidoMaterno || ""}`.trim(),
                    nombres: (data.nombres as string) || "",
                    apellidoPaterno: (data.apellidoPaterno as string) || "",
                    apellidoMaterno: (data.apellidoMaterno as string) || "",
                };
            }
            ultimoError = "Respuesta inválida del servicio";
        } catch (err: unknown) {
            const error = err as Error;
            if (error.name === "TimeoutError") {
                ultimoError = "La consulta tardó demasiado (timeout)";
                continue;
            }
            if (error.message && error.message.includes("no fue encontrado")) {
                throw error;
            }
            if (error.message && (error.message.includes("token") || error.message.includes("límite"))) {
                errorFatal = error;
                break;
            }
            ultimoError = error.message || ultimoError;
        }
    }

    if (errorFatal) throw errorFatal;

    throw new Error(
        `No se pudo obtener datos para el DNI ${limpio} (${ultimoError}). Verifica el número ingresado o digita tu nombre manualmente.`
    );
}

export async function consultarRUC(ruc: string): Promise<ResultadoRUC> {
    const limpio = ruc.trim().replace(/\D/g, "");
    if (limpio.length !== 11) {
        throw new Error("El RUC debe contener exactamente 11 dígitos numéricos");
    }

    if (!["10", "15", "17", "20"].includes(limpio.slice(0, 2))) {
        throw new Error("El RUC debe iniciar con 10, 15, 17 o 20");
    }

    // 1º Adapter en Backend (consulta comprobantes previos locales y/o APIPERU_TOKEN / APISNETPE_TOKEN)
    const desdeBackend = await consultarBackendFiscal(`/api/consultas/ruc/${limpio}`);
    if (desdeBackend && (desdeBackend.razonSocial as string)) {
        return {
            ruc: (desdeBackend.ruc as string) || limpio,
            razonSocial: desdeBackend.razonSocial as string,
            estado: (desdeBackend.estado as string) || "ACTIVO",
            condicion: (desdeBackend.condicion as string) || "HABIDO",
            direccion: (desdeBackend.direccion as string) || "LIMA - PERÚ",
        };
    }

    if (!TOKEN) {
        throw new Error(
            "Falta configurar APIPERU_TOKEN (backend) o VITE_APIPERU_TOKEN (frontend .env). Ingresa la Razón Social y Dirección Fiscal manualmente abajo."
        );
    }

    // 2º Vía proxy de Vite o directo si VITE_APIPERU_TOKEN está configurado
    const urls = [`/api-peru/api/v1/ruc/${limpio}`, `${BASE}/ruc/${limpio}`];

    let ultimoError = "No se pudo conectar con el servicio de SUNAT";
    let errorFatal: Error | null = null;

    for (const url of urls) {
        try {
            const data = await pedirJson(urlConToken(url));
            if (data && (data as { success?: boolean }).success === false) {
                throw new Error(`El RUC ${limpio} no fue encontrado en el padrón de SUNAT.`);
            }
            if (data && (data.razonSocial as string)) {
                return {
                    ruc: (data.ruc as string) || limpio,
                    razonSocial: data.razonSocial as string,
                    estado: (data.estado as string) || "ACTIVO",
                    condicion: (data.condicion as string) || "HABIDO",
                    direccion: (data.direccion as string) || "LIMA - PERÚ",
                    departamento: data.departamento as string,
                    provincia: data.provincia as string,
                    distrito: data.distrito as string,
                };
            }
            ultimoError = "Respuesta inválida del servicio";
        } catch (err: unknown) {
            const error = err as Error;
            if (error.name === "TimeoutError") {
                ultimoError = "La consulta tardó demasiado (timeout)";
                continue;
            }
            if (error.message && error.message.includes("no fue encontrado")) {
                throw error;
            }
            if (error.message && (error.message.includes("token") || error.message.includes("límite"))) {
                errorFatal = error;
                break;
            }
            ultimoError = error.message || ultimoError;
        }
    }

    if (errorFatal) throw errorFatal;

    throw new Error(
        `No se pudo obtener datos para el RUC ${limpio} (${ultimoError}). Verifica el número ingresado o digita tu razón social manualmente.`
    );
}
