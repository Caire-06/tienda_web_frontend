/**
 * Utilidades reutilizables para sanitización de entradas y validación de formularios.
 * Evita bloqueos en "NaN" al escribir caracteres no numéricos en campos controlados.
 */

/** Deja únicamente dígitos numéricos (útil para DNI, RUC, teléfono, CVV y códigos Yape). */
export function limpiarSoloDigitos(valor: string, maxLongitud?: number): string {
    const soloDigitos = valor.replace(/\D/g, "");
    return typeof maxLongitud === "number" ? soloDigitos.slice(0, maxLongitud) : soloDigitos;
}

/**
 * Sanitiza un entero no negativo (stock, cantidad) manteniendo cadena vacía si se borra todo.
 * Evita ceros a la izquierda innecesarios ("05" -> "5"), conservando "0" individual.
 */
export function limpiarEnteroNoNegativo(valor: string, maxDigitos = 7): string {
    const digitos = valor.replace(/\D/g, "").slice(0, maxDigitos);
    if (digitos.length > 1) {
        return digitos.replace(/^0+(?=\d)/, "");
    }
    return digitos;
}

/**
 * Sanitiza un monto decimal positivo (precio, costo) permitiendo "." o "," mientras se escribe.
 * Nunca produce "NaN" aunque se ingresen letras o símbolos inválidos.
 */
export function limpiarDecimal(valor: string, maxDecimales = 2, maxEnteros = 8): string {
    const normalizado = valor.replace(",", ".").replace(/[^0-9.]/g, "");
    if (!normalizado) return "";

    const idxPunto = normalizado.indexOf(".");
    if (idxPunto === -1) {
        const enteros = normalizado.slice(0, maxEnteros);
        return enteros.length > 1 ? enteros.replace(/^0+(?=\d)/, "") : enteros;
    }

    let parteEntera = normalizado.slice(0, idxPunto).slice(0, maxEnteros);
    if (parteEntera.length > 1) {
        parteEntera = parteEntera.replace(/^0+(?=\d)/, "");
    }
    if (parteEntera === "") {
        parteEntera = "0";
    }
    const parteDecimal = normalizado.slice(idxPunto + 1).replace(/\./g, "").slice(0, maxDecimales);
    return `${parteEntera}.${parteDecimal}`;
}

/** Convierte texto decimal saneado a número finito (0 si está vacío o incompleto). */
export function parsearNumeroSeguro(valor: string): number {
    if (!valor || valor === ".") return 0;
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

/** Permite letras (incluyendo tildes y ñ), espacios, guion, punto y apóstrofe para nombres. */
export function limpiarSoloLetras(valor: string, maxLongitud = 100): string {
    return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'.-]/g, "").slice(0, maxLongitud);
}

/** Permite caracteres alfanuméricos y guiones (guías, placas, códigos de operación). */
export function limpiarCodigoAlfanumerico(
    valor: string,
    maxLongitud = 30,
    mayusculas = false
): string {
    const limpio = valor.replace(/[^a-zA-Z0-9-]/g, "").slice(0, maxLongitud);
    return mayusculas ? limpio.toUpperCase() : limpio;
}

export function esCorreoValido(correo: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim());
}

export function esTelefonoValido(telefono: string): boolean {
    return /^\d{7,9}$/.test(telefono.trim());
}

export function esDocumentoPeruanoValido(doc: string): { valido: boolean; mensaje?: string } {
    const limpio = doc.trim();
    if (!limpio) return { valido: true };
    if (/^\d{8}$/.test(limpio)) return { valido: true };
    if (/^\d{11}$/.test(limpio) && ["10", "15", "17", "20"].includes(limpio.slice(0, 2))) {
        return { valido: true };
    }
    return {
        valido: false,
        mensaje: "Ingresa un DNI válido de 8 dígitos o un RUC válido de 11 dígitos (inicia con 10, 15, 17 o 20).",
    };
}
