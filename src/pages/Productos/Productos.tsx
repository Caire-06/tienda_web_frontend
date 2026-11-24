import { useState, useMemo, useEffect } from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ProductCard from "../../components/ProductCard/ProductCard";
import { CATEGORIAS } from "../../data/productos";
import { useAuth } from "../../context/AuthContext";
import { listarProductosPaginado } from "../../services/productosApi";
import type { ProductoInv } from "../../context/InventarioContext";
import { Paginacion, REGISTROS_POR_PAGINA } from "../../components/Paginacion/Paginacion";
import { limpiarDecimal, parsearNumeroSeguro } from "../../utils/validaciones";

type Orden = "relevancia" | "precio-asc" | "precio-desc" | "popular" | "stock";
type Novedades = "todos" | "recientes" | "hoy";

const FILTRO_TODOS = "Todos";

function esRegistradoHoy(fecha?: string): boolean {
    if (!fecha) return false;
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return false;
    const hoy = new Date();
    return (
        d.getFullYear() === hoy.getFullYear() &&
        d.getMonth() === hoy.getMonth() &&
        d.getDate() === hoy.getDate()
    );
}

function tiempoDe(fecha?: string): number {
    if (!fecha) return 0;
    const t = new Date(fecha).getTime();
    return Number.isNaN(t) ? 0 : t;
}

function Productos() {
    const { token } = useAuth();
    const [backendProductos, setBackendProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);

    const [categoria, setCategoria] = useState(FILTRO_TODOS);
    const [orden, setOrden] = useState<Orden>("relevancia");
    const [busqueda, setBusqueda] = useState("");
    const [novedades, setNovedades] = useState<Novedades>("todos");
    const [precioMinTexto, setPrecioMinTexto] = useState("");
    const [precioMaxTexto, setPrecioMaxTexto] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    useEffect(() => {
        let activo = true;
        setCargando(true);
        listarProductosPaginado(
            token,
            pagina,
            REGISTROS_POR_PAGINA,
            categoria !== FILTRO_TODOS ? categoria : undefined,
            busqueda
        )
            .then((res) => {
                if (activo) {
                    setBackendProductos(res.contenido);
                    setTotalPaginas(res.totalPaginas);
                    setTotalRegistros(res.totalElementos);
                }
            })
            .catch(() => { if (activo) setBackendProductos([]); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token, pagina, categoria, busqueda]);

    useEffect(() => {
        setPagina(1);
    }, [categoria, busqueda, novedades, precioMinTexto, precioMaxTexto]);

    const productos: ProductoInv[] = backendProductos;

    const nombresCategorias = [FILTRO_TODOS, ...CATEGORIAS.map((c) => c.nombre)];


    const precioMin = parsearNumeroSeguro(precioMinTexto);
    const precioMax = parsearNumeroSeguro(precioMaxTexto);
    const hayFiltros =
        busqueda.trim() !== "" ||
        categoria !== FILTRO_TODOS ||
        novedades !== "todos" ||
        precioMinTexto !== "" ||
        precioMaxTexto !== "" ||
        orden !== "relevancia";

    const filtrados = useMemo(() => {
        let lista = productos.filter((p) => p.activo && p.stock > 0);

        if (categoria !== FILTRO_TODOS) {
            lista = lista.filter((p) => p.categoria === categoria);
        }

        if (novedades === "hoy") {
            lista = lista.filter((p) => esRegistradoHoy(p.fechaCreacion));
        } else if (novedades === "recientes") {
            // Los 5 productos registrados más recientemente (auditoría fecha_creacion).
            lista = [...lista]
                .sort((a, b) => tiempoDe(b.fechaCreacion) - tiempoDe(a.fechaCreacion))
                .slice(0, 5);
        }

        if (precioMinTexto.trim() !== "") {
            lista = lista.filter((p) => p.precio >= precioMin);
        }
        if (precioMaxTexto.trim() !== "") {
            lista = lista.filter((p) => p.precio <= precioMax);
        }

        const texto = busqueda.trim().toLowerCase();
        if (texto) {
            lista = lista.filter(
                (p) =>
                    p.nombre.toLowerCase().includes(texto) ||
                    p.categoria.toLowerCase().includes(texto) ||
                    (p.marca || "").toLowerCase().includes(texto) ||
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
    }, [productos, categoria, orden, busqueda, novedades, precioMinTexto, precioMaxTexto, precioMin, precioMax]);

    const visibles = filtrados;

    useEffect(() => {
        setPagina(1);
    }, [categoria, busqueda, orden, novedades, precioMinTexto, precioMaxTexto]);

    const limpiarFiltros = () => {
        setBusqueda("");
        setCategoria(FILTRO_TODOS);
        setOrden("relevancia");
        setNovedades("todos");
        setPrecioMinTexto("");
        setPrecioMaxTexto("");
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

                {/* Toolbar: búsqueda + filtros */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap gap-3 items-end shadow-xs">
                    <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
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
                            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <label className="flex flex-col gap-1 w-full sm:w-auto">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Novedades</span>
                        <select
                            value={novedades}
                            onChange={(e) => setNovedades(e.target.value as Novedades)}
                            className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                            <option value="todos">Todos los productos</option>
                            <option value="recientes">Ultimos Añadidos</option>
                            <option value="hoy">Registrados hoy</option>
                        </select>
                    </label>

                    <div className="w-full sm:w-auto">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                            Rango de precios (S/)
                        </span>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Mínimo"
                                value={precioMinTexto}
                                onChange={(e) => setPrecioMinTexto(limpiarDecimal(e.target.value))}
                                className="w-20 sm:w-24 px-2.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-slate-400">–</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Máximo"
                                value={precioMaxTexto}
                                onChange={(e) => setPrecioMaxTexto(limpiarDecimal(e.target.value))}
                                className="w-20 sm:w-24 px-2.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <label className="flex flex-col gap-1 w-full sm:w-auto">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ordenar</span>
                        <select
                            value={orden}
                            onChange={(e) => setOrden(e.target.value as Orden)}
                            className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                            <option value="relevancia">Relevancia</option>
                            <option value="precio-asc">Precio: Menor a mayor</option>
                            <option value="precio-desc">Precio: Mayor a menor</option>
                            <option value="popular">Más vendidos</option>
                            <option value="stock">Mayor stock disponible</option>
                        </select>
                    </label>

                    {hayFiltros && (
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-500 cursor-pointer"
                        >
                            Limpiar filtros
                        </button>
                    )}
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
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                            {visibles.map((p) => (
                                <ProductCard key={p.id} producto={p} />
                            ))}
                        </div>

                        {/* Paginación */}
                        <div className="mt-8">
                            <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} totalRegistros={totalRegistros} onCambiar={setPagina} />
                        </div>
                    </>
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
