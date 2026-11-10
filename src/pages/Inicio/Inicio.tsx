import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ProductCard from "../../components/ProductCard/ProductCard";
import { CATEGORIAS } from "../../data/productos";
import { useAuth } from "../../context/AuthContext";
import { listarProductos } from "../../services/productosApi";
import type { ProductoInv } from "../../context/InventarioContext";

const ICONOS_CATEGORIA: Record<string, ReactNode> = {
    smartphone: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
    ),
    audio: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
    ),
    perifericos: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <line x1="6" y1="10" x2="6" y2="10" />
            <line x1="10" y1="10" x2="10" y2="10" />
            <line x1="14" y1="10" x2="14" y2="10" />
            <line x1="18" y1="10" x2="18" y2="10" />
            <line x1="7" y1="14" x2="17" y2="14" />
        </svg>
    ),
    computadoras: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ),
    accesorios: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2v6M15 2v6M7 8h10v4a5 5 0 0 1-10 0V8z" />
            <line x1="12" y1="17" x2="12" y2="22" />
        </svg>
    ),
};

const ICONOS_BENEFICIO = {
    envios: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="1" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    ),
    pago: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    ),
    stock: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
            <line x1="3" y1="8" x2="12" y2="13" />
            <line x1="12" y1="13" x2="21" y2="8" />
            <line x1="12" y1="13" x2="12" y2="21" />
        </svg>
    ),
    compra: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    ),
};

function Inicio() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [backendProductos, setBackendProductos] = useState<ProductoInv[]>([]);

    useEffect(() => {
        let activo = true;
        listarProductos(token)
            .then((lista) => { if (activo) setBackendProductos(lista); })
            .catch(() => { if (activo) setBackendProductos([]); });
        return () => { activo = false; };
    }, [token]);

    const productos: ProductoInv[] = backendProductos;

    const destacados = productos.filter((p) => p.activo && p.stock > 0).slice(0, 4);
    const masVendidos = [...productos].filter((p) => p.activo).sort((a, b) => b.vendidos - a.vendidos).slice(0, 4);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-16">
                {/* 1. Banner Principal Hero */}
                <section className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-xl min-h-[380px] sm:min-h-[460px] flex items-center">
                    <div className="absolute inset-0">
                        <img
                            src="/src/assets/hero.png"
                            alt="Productos tecnológicos"
                            className="w-full h-full object-cover object-center opacity-40 sm:opacity-50"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
                    </div>

                    <div className="relative z-10 p-8 sm:p-14 max-w-2xl space-y-4 text-white">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            Tecnología para todos los días
                        </span>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                            Tecnología que <span className="text-blue-400">transforma</span> tu mundo
                        </h1>
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                            Smartphones, audífonos, monitores, periféricos y accesorios con garantía y despacho directo en San Juan de Lurigancho.
                        </p>
                        <div className="pt-2 flex flex-wrap gap-3">
                            <button
                                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                                onClick={() => navigate("/productos")}
                            >
                                Ver productos
                            </button>
                            <button
                                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer"
                                onClick={() => navigate("/productos")}
                            >
                                Explorar categorías
                            </button>
                        </div>
                    </div>
                </section>

                {/* 2. Beneficios */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            {ICONOS_BENEFICIO.envios}
                        </div>
                        <div>
                            <strong className="block text-xs font-bold text-slate-900 dark:text-white">Envíos Rápidos</strong>
                            <span className="text-[11px] text-slate-500">Recibe tus productos</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            {ICONOS_BENEFICIO.pago}
                        </div>
                        <div>
                            <strong className="block text-xs font-bold text-slate-900 dark:text-white">Pago Seguro</strong>
                            <span className="text-[11px] text-slate-500">Comprobante SUNAT</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            {ICONOS_BENEFICIO.stock}
                        </div>
                        <div>
                            <strong className="block text-xs font-bold text-slate-900 dark:text-white">Stock Garantizado</strong>
                            <span className="text-[11px] text-slate-500">Control con Kardex</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            {ICONOS_BENEFICIO.compra}
                        </div>
                        <div>
                            <strong className="block text-xs font-bold text-slate-900 dark:text-white">Compra Fácil</strong>
                            <span className="text-[11px] text-slate-500">Agrega y finaliza</span>
                        </div>
                    </div>
                </section>

                {/* 3. Categorías */}
                <section className="space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Explorar por categoría
                        </h2>
                        <p className="text-sm text-slate-500">
                            Encuentra rápidamente el dispositivo que buscas
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {CATEGORIAS.map((cat) => (
                            <button
                                key={cat.nombre}
                                onClick={() => navigate("/productos")}
                                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                            >
                                <span className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {ICONOS_CATEGORIA[cat.icon]}
                                </span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {cat.nombre}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 4. Productos Destacados */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Productos destacados
                            </h2>
                            <p className="text-sm text-slate-500">Selección recomendada con stock inmediato</p>
                        </div>
                        <button
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            onClick={() => navigate("/productos")}
                        >
                            Ver todos →
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {destacados.map((p) => (
                            <ProductCard key={p.id} producto={p} />
                        ))}
                    </div>
                </section>

                {/* 5. Banner de Ofertas */}
                <section className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/20">
                            Ofertas Especiales
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Tecnología de punta al mejor precio de Lima Este
                        </h2>
                        <p className="text-xs sm:text-sm text-blue-100">
                            Descubre descuentos en laptops, monitores gamer, audífonos inalámbricos y teclados mecánicos.
                        </p>
                    </div>
                    <button
                        className="px-6 py-3 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                        onClick={() => navigate("/productos")}
                    >
                        Ver ofertas →
                    </button>
                </section>

                {/* 6. Más Vendidos */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Los más vendidos
                            </h2>
                            <p className="text-sm text-slate-500">Los productos preferidos por nuestros clientes</p>
                        </div>
                        <button
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            onClick={() => navigate("/productos")}
                        >
                            Ver todos →
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {masVendidos.map((p) => (
                            <ProductCard key={p.id} producto={p} />
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default Inicio;
