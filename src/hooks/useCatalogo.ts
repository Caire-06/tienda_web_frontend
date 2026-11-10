import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listarProductos } from "../services/productosApi";
import type { ProductoInv } from "../context/InventarioContext";

/**
 * Catálogo público de la tienda (backend).
 * Funciona con o sin sesión iniciada: el endpoint /api/productos es público.
 */
export function useCatalogo() {
    const { token } = useAuth();
    const [productos, setProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let activo = true;
        setCargando(true);
        listarProductos(token)
            .then((lista) => { if (activo) setProductos(lista); })
            .catch(() => { if (activo) setProductos([]); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token]);

    return { productos, cargando };
}
