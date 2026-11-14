import type { ReactNode } from "react";

/**
 * Set de iconos SVG de línea, con el mismo estilo que los iconos del Inicio
 * y de las barras laterales (stroke = currentColor, sin relleno).
 *
 * Se usan para reemplazar los emojis de las pantallas de Despachos y del
 * detalle de compras, de modo que el lenguaje visual sea consistente.
 */

interface IconoProps {
    size?: number;
    className?: string;
}

function Svg({ size = 20, className, children }: IconoProps & { children: ReactNode }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    );
}

/** Caja / paquete de almacén. */
export function IconoPaquete(props: IconoProps) {
    return (
        <Svg {...props}>
            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
            <line x1="3" y1="8" x2="12" y2="13" />
            <line x1="12" y1="13" x2="21" y2="8" />
            <line x1="12" y1="13" x2="12" y2="21" />
        </Svg>
    );
}

/** Camión de despacho / courier. */
export function IconoCamion(props: IconoProps) {
    return (
        <Svg {...props}>
            <rect x="1" y="3" width="15" height="13" rx="1" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </Svg>
    );
}

/** Moto / delivery propio. */
export function IconoMoto(props: IconoProps) {
    return (
        <Svg {...props}>
            <circle cx="5.5" cy="17.5" r="3.5" />
            <circle cx="18.5" cy="17.5" r="3.5" />
            <path d="M5.5 17.5h5l3-6.5h4" />
            <path d="M13 17.5h5.5" />
            <path d="M8 6h4l1.5 5" />
        </Svg>
    );
}

/** Tienda / recojo en mostrador. */
export function IconoTienda(props: IconoProps) {
    return (
        <Svg {...props}>
            <path d="M3 9l1.5-5h15L21 9" />
            <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
            <path d="M5 12v9h14v-9" />
            <path d="M9 21v-5h6v5" />
        </Svg>
    );
}

/** Check simple. */
export function IconoCheck(props: IconoProps) {
    return (
        <Svg {...props}>
            <polyline points="20 6 9 17 4 12" />
        </Svg>
    );
}

/** Check dentro de un círculo (acción completada). */
export function IconoCheckCirculo(props: IconoProps) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="9" />
            <polyline points="16 9 11 15 8 12" />
        </Svg>
    );
}

/** Cruz para cerrar / cancelar. */
export function IconoCerrar(props: IconoProps) {
    return (
        <Svg {...props}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </Svg>
    );
}

/** Reloj (pendiente / en espera). */
export function IconoReloj(props: IconoProps) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 16 14" />
        </Svg>
    );
}

/** Flechas circulares (actualizar / recargar). */
export function IconoActualizar(props: IconoProps) {
    return (
        <Svg {...props}>
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </Svg>
    );
}

/** Etiqueta / guía de remisión. */
export function IconoEtiqueta(props: IconoProps) {
    return (
        <Svg {...props}>
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
        </Svg>
    );
}

/** Persona / cliente. */
export function IconoUsuario(props: IconoProps) {
    return (
        <Svg {...props}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </Svg>
    );
}

/** Documento / comprobante. */
export function IconoDocumento(props: IconoProps) {
    return (
        <Svg {...props}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
        </Svg>
    );
}

/** Alerta / información importante. */
export function IconoAlerta(props: IconoProps) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
        </Svg>
    );
}

/** Tarjeta / método de pago. */
export function IconoTarjeta(props: IconoProps) {
    return (
        <Svg {...props}>
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </Svg>
    );
}

/** Carrito de compras. */
export function IconoCarrito(props: IconoProps) {
    return (
        <Svg {...props}>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </Svg>
    );
}

/** Pulso / señal en vivo. */
export function IconoActividad(props: IconoProps) {
    return (
        <Svg {...props}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </Svg>
    );
}

/** Pin de ubicación / destino. */
export function IconoUbicacion(props: IconoProps) {
    return (
        <Svg {...props}>
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </Svg>
    );
}

/** Calendario / fechas. */
export function IconoCalendario(props: IconoProps) {
    return (
        <Svg {...props}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </Svg>
    );
}

/** Rayo / iniciar una acción. */
export function IconoRayo(props: IconoProps) {
    return (
        <Svg {...props}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </Svg>
    );
}

/** Lista / portapapeles de picking. */
export function IconoLista(props: IconoProps) {
    return (
        <Svg {...props}>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <line x1="8" y1="11" x2="16" y2="11" />
            <line x1="8" y1="15" x2="14" y2="15" />
        </Svg>
    );
}

/** Flecha hacia la derecha (navegación). */
export function IconoFlechaDerecha(props: IconoProps) {
    return (
        <Svg {...props}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </Svg>
    );
}
