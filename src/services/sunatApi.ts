import { apiUrl } from "../config/api";

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

type JsonApi = Record<string, unknown> & {
    success?: boolean;
    message?: string;
    error?: string;
    sinToken?: boolean;
};

/**
 * Toda consulta RENIEC/SUNAT pasa exclusivamente por nuestro backend (/api/consultas/*).
 * De este modo APIPERU_TOKEN / APISNETPE_TOKEN nunca se exponen en el navegador.
 */
async function consultarBackendFiscal(ruta: string): Promise<JsonApi> {
    const resp = await fetch(apiUrl(ruta), {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
    });
    const data = (await resp.json().catch(() => ({}))) as JsonApi;
    if (resp.ok) return data;
    if (resp.status === 503 && data.sinToken) {
        throw new Error(
            "El servicio RENIEC/SUNAT no tiene token configurado en el servidor (APIPERU_TOKEN). Ingresa los datos manualmente."
        );
    }
    throw new Error(data.error || data.message || `No se pudo realizar la consulta (${resp.status}).`);
}

export async function consultarDNI(dni: string): Promise<ResultadoDNI> {
    const limpio = dni.trim().replace(/\D/g, "");
    if (limpio.length !== 8) {
        throw new Error("El DNI debe contener exactamente 8 dígitos numéricos");
    }

    const desdeBackend = await consultarBackendFiscal(`/api/consultas/dni/${limpio}`);
    if ((desdeBackend.nombres as string) || (desdeBackend.nombreCompleto as string)) {
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

    throw new Error(
        `No se encontraron datos para el DNI ${limpio}. Verifica el número o digita tu nombre manualmente.`
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

    const desdeBackend = await consultarBackendFiscal(`/api/consultas/ruc/${limpio}`);
    if (desdeBackend.razonSocial as string) {
        return {
            ruc: (desdeBackend.ruc as string) || limpio,
            razonSocial: desdeBackend.razonSocial as string,
            estado: (desdeBackend.estado as string) || "ACTIVO",
            condicion: (desdeBackend.condicion as string) || "HABIDO",
            direccion: (desdeBackend.direccion as string) || "LIMA - PERÚ",
        };
    }

    throw new Error(
        `No se encontraron datos para el RUC ${limpio}. Verifica el número o digita tu razón social manualmente.`
    );
}
