import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listarProductos } from "../../../services/productosApi";
import type { ProductoInv } from "../../../context/InventarioContext";
import { CATEGORIAS } from "../../../data/productos";

function Productos() {
    const { token } = useAuth();
    const [productos, setProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("Todas");
    const [estado, setEstado] = useState("Todos");

    const cargar = async () => {
        if (!token) return;
        setCargando(true);
        setError(null);
        try {
            const data = await listarProductos(token);
            setProductos(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar productos desde PostgreSQL");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [token]);

    const estadoDe = (stock: number, activo: boolean) =>
        !activo ? "Inactivo" : stock === 0 ? "Sin stock" : stock < 10 ? "Stock bajo" : "Disponible";

    const filtrados = productos.filter((p) => {
        if (categoria !== "Todas" && p.categoria !== categoria) return false;
        if (estado !== "Todos" && estadoDe(p.stock, p.activo) !== estado) return false;
        const q = busqueda.trim().toLowerCase();
        if (q && !p.nombre.toLowerCase().includes(q)) return false;
        return true;
    });

    const selectClass =
        "px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Catálogo de Productos</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {filtrados.length} productos en la base de datos PostgreSQL.
                    </p>
                </div>
                <button
                    onClick={cargar}
                    className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                >
                    ↻ Actualizar
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Barra de Filtros */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-wrap gap-3 items-center shadow-xs">
                <input
                    className="flex-1 min-w-[200px] px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Buscar producto por nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <select className={selectClass} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    <option>Todas</option>
                    {CATEGORIAS.map((c) => (
                        <option key={c.nombre}>{c.nombre}</option>
                    ))}
                </select>
                <select className={selectClass} value={estado} onChange={(e) => setEstado(e.target.value)}>
                    <option>Todos</option>
                    <option>Disponible</option>
                    <option>Stock bajo</option>
                    <option>Sin stock</option>
                    <option>Inactivo</option>
                </select>
            </div>

            {/* Grid de Productos */}
            {cargando ? (
                <div className="text-center py-12 text-sm text-slate-500">
                    Cargando catálogo desde PostgreSQL...
                </div>
            ) : filtrados.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-500">
                    No se encontraron productos coincidentes.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtrados.map((p) => {
                        const est = estadoDe(p.stock, p.activo);
                        return (
                            <article
                                key={p.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
                            >
                                <div className="h-40 bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden flex items-center justify-center p-3">
                                    <img src={p.imagen} alt={p.nombre} className="h-full w-full object-contain" />
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                                        {p.categoria}
                                    </span>
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                                        {p.nombre}
                                    </h3>
                                    <p className="text-xs text-slate-500 line-clamp-2">{p.descripcion}</p>
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Precio</span>
                                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                            S/ {Number(p.precio).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            Stock: {p.stock}
                                        </span>
                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                est === "Disponible"
                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                    : est === "Stock bajo"
                                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                                                    : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                                            }`}
                                        >
                                            {est}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Productos;
