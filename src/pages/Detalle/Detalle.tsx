import { formatoImporte } from "../../utils/formatoImporte";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ProductCard from "../../components/ProductCard/ProductCard";
import { ImagenProducto } from "../../components/ImagenProducto/ImagenProducto";
import { useAuth } from "../../context/AuthContext";
import { obtenerProducto, listarProductos } from "../../services/productosApi";
import type { ProductoInv } from "../../context/InventarioContext";
import { useCarrito } from "../../context/CarritoContext";

function Detalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { agregar } = useCarrito();
    const [cantidad, setCantidad] = useState(1);
    const [producto, setProducto] = useState<ProductoInv | null>(null);
    const [backendProductos, setBackendProductos] = useState<ProductoInv[]>([]);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        setCantidad(1);
        let activo = true;
        const cargar = async () => {
            setBackendProductos([]);
            setProducto(null);
            try {
                const [p, todos] = await Promise.all([obtenerProducto(token, Number(id)), listarProductos(token)]);
                if (activo) {
                    setProducto(p);
                    setBackendProductos(todos);
                }
            } catch {
                if (activo) setProducto(null);
            }
        };
        cargar();
        return () => { activo = false; };
    }, [id, token]);

    if (!producto) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
                <Header />
                <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <h1 className="text-2xl font-black">Producto no encontrado</h1>
                    <button
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all cursor-pointer"
                        onClick={() => navigate("/productos")}
                    >
                        Volver al catálogo
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    const agotado = producto.stock <= 0;
    const relacionados = backendProductos.filter(
        (p) => p.activo && p.stock > 0 && p.categoria === producto.categoria && p.id !== producto.id
    ).slice(0, 4);

    const subir = () => setCantidad((c) => Math.min(c + 1, producto.stock));
    const bajar = () => setCantidad((c) => Math.max(c - 1, 1));

    const agregarYVerCarrito = () => {
        agregar(producto.id, cantidad);
        navigate("/carrito");
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-12">
                <button
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                    onClick={() => navigate("/productos")}
                >
                    ← Volver al catálogo
                </button>

                {/* Grid Detalle Producto */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
                    {/* Imagen */}
                    <div className="relative h-72 sm:h-96 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-center p-6 overflow-hidden">
                        <ImagenProducto
                            src={producto.imagen}
                            alt={producto.nombre}
                            loading="eager"
                            className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                        />
                        {agotado && (
                            <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                Agotado
                            </span>
                        )}
                    </div>

                    {/* Información */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            {producto.categoria}
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {producto.nombre}
                        </h1>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {producto.descripcion}
                        </p>

                        <div className="pt-2">
                            <span className="block font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                                S/ {formatoImporte(producto.precio)}
                            </span>
                            <span className={`block text-xs font-semibold mt-1 ${agotado ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                                {agotado ? "Sin stock disponible" : `${producto.stock} unidades disponibles en tienda`}
                            </span>
                        </div>

                        {!agotado && (
                            <div className="pt-4 flex flex-wrap items-center gap-4">
                                <div className="inline-flex items-center border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden">
                                    <button
                                        className="w-10 h-10 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                                        onClick={bajar}
                                        disabled={cantidad <= 1}
                                    >
                                        −
                                    </button>
                                    <span className="w-12 text-center font-mono font-bold text-sm">
                                        {cantidad}
                                    </span>
                                    <button
                                        className="w-10 h-10 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                                        onClick={subir}
                                        disabled={cantidad >= producto.stock}
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    className="w-full sm:flex-1 sm:min-w-[200px] h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                                    onClick={agregarYVerCarrito}
                                >
                                    Agregar al carrito
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Ficha técnica (tabla 1:N en 3FN) */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                Ficha Técnica
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Características registradas para este dispositivo.
                            </p>
                        </div>
                        {producto.marca && (
                            <span className="badge bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1">
                                Marca: <strong>{producto.marca}</strong>
                            </span>
                        )}
                    </div>

                    {(producto.especificaciones?.length ?? 0) > 0 ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 text-left">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 w-1/2">
                                            Característica
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                                            Valor
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {producto.especificaciones!.map((e, i) => (
                                        <tr key={`${e.caracteristica}-${i}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">
                                                {e.caracteristica}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                {e.valor}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
                            Este producto aún no tiene especificaciones técnicas registradas.
                        </div>
                    )}
                </section>

                {/* Relacionados */}
                {relacionados.length > 0 && (
                    <section className="space-y-6">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Productos relacionados de {producto.categoria}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {relacionados.map((p) => (
                                <ProductCard key={p.id} producto={p} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default Detalle;
