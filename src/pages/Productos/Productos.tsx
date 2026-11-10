import { useState, useMemo, useEffect } from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ProductCard from "../../components/ProductCard/ProductCard";
import { CATEGORIAS } from "../../data/productos";
import { useAuth } from "../../context/AuthContext";
import { listarProductos } from "../../services/productosApi";
import type { ProductoInv } from "../../context/InventarioContext";

type Orden = "relevancia" | "precio-asc" | "precio-desc" | "popular" | "stock";

const FILTRO_TODOS = "Todos";

function Productos() {
    const { token } = useAuth();
    const [backendProductos, setBackendProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);

    const [categoria, setCategoria] = useState(FILTRO_TODOS);
    const [orden, setOrden] = useState<Orden>("relevancia");
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        let activo = true;
        if (!token) {
            setCargando(false);
            return;
        }
        setCargando(true);
        listarProductos(token)
            .then((lista) => { if (activo) setBackendProductos(lista); })
            .catch(() => { if (activo) setBackendProductos([]); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token]);

    const productos: ProductoInv[] = backendProductos;

    const nombresCategorias = [FILTRO_TODOS, ...CATEGORIAS.map((c) => c.nombre)];

    const filtrados = useMemo(() => {
        let lista = productos.filter((p) => p.activo);

        if (categoria !== FILTRO_TODOS) {
            lista = lista.filter((p) => p.categoria === categoria);
        }

        const texto = busqueda.trim().toLowerCase();
        if (texto) {
            lista = lista.filter(
                (p) =>
                    p.nombre.toLowerCase().includes(texto) ||
                    p.categoria.toLowerCase().includes(texto) ||
                    p.descripcion.toLowerCase().includes(texto)
            );
        }

        switch (orden) {
            case "precio-asc":
                return lista.sort((a, b) => a.precio - b.precio);
            case "precio-desc":
                return lista.sort((a, b) => b.precio - a.precio);
            case "popular":
                return lista.sort((a, b) => b.vendidos - a.vendidos);
            case "stock":
                return lista.sort((a, b) => b.stock - a.stock);
            default:
                return lista;
        }
    }, [productos, categoria, orden, busqueda]);

    const limpiarFiltros = () => {
        setBusqueda("");
        setCategoria(FILTRO_TODOS);
        setOrden("relevancia");
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Catálogo de Productos</h1>
                    <p className="text-sm text-slate-500">
                        {filtrados.length} producto{filtrados.length !== 1 ? "s" : ""} disponible{filtrados.length !== 1 ? "s" : ""} con entrega inmediata.
                    </p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <svg
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar laptops, monitores, audio..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                        />
                    </div>

                    <select
                        value={orden}
                        onChange={(e) => setOrden(e.target.value as Orden)}
                        className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs"
                    >
                        <option value="relevancia">Todos</option>
                        <option value="precio-asc">Precio: Menor a mayor</option>
                        <option value="precio-desc">Precio: Mayor a menor</option>
                        <option value="popular">Más vendidos</option>
                        <option value="stock">Mayor stock disponible</option>
                    </select>
                </div>

                {/* Categorías Pills */}
                <div className="flex flex-wrap gap-2">
                    {nombresCategorias.map((nombre) => (
                        <button
                            key={nombre}
                            onClick={() => setCategoria(nombre)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                                categoria === nombre
                                    ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-500"
                            }`}
                        >
                            {nombre}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {cargando ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-sm text-slate-500 shadow-sm my-8">
                        Cargando productos...
                    </div>
                ) : filtrados.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                        {filtrados.map((p) => (
                            <ProductCard key={p.id} producto={p} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm my-8">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                            🔍
                        </div>
                        <h3 className="text-lg font-bold">Sin resultados</h3>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            No encontramos productos que coincidan con "{busqueda}". Intenta con otros términos.
                        </p>
                        <button
                            className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            onClick={limpiarFiltros}
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default Productos;
