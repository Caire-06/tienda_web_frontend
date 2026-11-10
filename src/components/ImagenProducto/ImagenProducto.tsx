import { useState } from "react";

interface ImagenProductoProps {
    src?: string;
    alt: string;
    className?: string;
    compact?: boolean;
    loading?: "lazy" | "eager";
    onClick?: () => void;
}

/**
 * Renderiza la imagen del producto o un marcador visual limpio cuando no tiene
 * imagen registrada o falla su carga remota.
 */
export function ImagenProducto({
    src,
    alt,
    className = "",
    compact = false,
    loading = "lazy",
    onClick,
}: ImagenProductoProps) {
    const [srcConError, setSrcConError] = useState<string | null>(null);
    const srcNormalizado = src?.trim() ?? "";
    const mostrarPlaceholder = !srcNormalizado || srcConError === srcNormalizado;

    if (mostrarPlaceholder) {
        return (
            <div
                role="img"
                aria-label={`${alt} (sin imagen)`}
                onClick={onClick}
                className={`flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 select-none ${
                    compact ? "gap-0.5" : "gap-2 w-full h-full"
                } ${className}`}
            >
                <svg
                    className={compact ? "w-5 h-5" : "w-12 h-12"}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                </svg>
                {!compact && (
                    <span className="text-xs font-medium tracking-wide">Sin imagen</span>
                )}
            </div>
        );
    }

    return (
        <img
            src={srcNormalizado}
            alt={alt}
            loading={loading}
            onClick={onClick}
            onError={() => setSrcConError(srcNormalizado)}
            className={className}
        />
    );
}

