import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { obtenerResumen } from "../../../services/kardexApi";
import type { KardexResumen } from "../../../services/kardexApi";
import { listarPedidosPendientesDespacho } from "../../../services/despachosApi";
import { IconoFlechaDerecha, IconoPaquete, IconoRayo } from "../../../components/Iconos/Iconos";

function fechaCorta(iso: string) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Dashboard() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [resumen, setResumen] = useState<KardexResumen | null>(null);
    const [pendientesDespacho, setPendientesDespacho] = useState<number>(0);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let activo = true;
        if (!token) {
            setCargando(false);
            return;
        }
        setCargando(true);
        Promise.all([
            obtenerResumen(token).catch(() => null),
            listarPedidosPendientesDespacho(token).catch(() => []),
        ])
            .then(([r, pendientes]) => {
                if (activo) {
                    setResumen(r);
                    setPendientesDespacho(Array.isArray(pendientes) ? pendientes.length : 0);
                }
            })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token]);

    const productos = resumen?.productosRegistrados ?? 0;
    const stockTotal = resumen?.stockTotal ?? 0;
    const stockBajo = resumen?.stockCriticoBajo ?? 0;
    const movimientos = resumen?.movimientos ?? 0;
    const ultimos = resumen?.ultimosMovimientos ?? [];
    const ultimasEntradas = resumen?.ultimasEntradas ?? [];

    const cargandoKpis = cargando;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dashboard de Almacén</h1>
                <p className="text-sm text-slate-500 mt-1">Control de inventario, rotación física y movimientos Kardex.</p>
            </div>

            {/* KPIs */}
            <section className="admin-cards grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                <div className="admin-card">
                    <span>Productos registrados</span>
                    <strong>{cargandoKpis ? "..." : productos}</strong>
                </div>
                <div className="admin-card">
                    <span>Stock total</span>
                    <strong>{cargandoKpis ? "..." : `${stockTotal} uds.`}</strong>
                </div>
                <div className="admin-card alerta">
                    <span>Stock crítico bajo</span>
                    <strong>{cargandoKpis ? "..." : stockBajo}</strong>
                </div>
                <div className="admin-card">
                    <span>Movimientos Kardex</span>
                    <strong>{cargandoKpis ? "..." : movimientos}</strong>
                </div>
            </section>

            {/* Alerta de Pedidos Nuevos Pendientes de Preparación */}
            {pendientesDespacho > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <IconoPaquete size={20} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                {pendientesDespacho} {pendientesDespacho === 1 ? "pedido nuevo pendiente" : "pedidos nuevos pendientes"} por atender
                            </h3>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                Tienes pedidos recién comprados listos para iniciar preparación y enviar al courier.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/almacen/despachos")}
                        className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer shrink-0"
                    >
                        <IconoRayo size={13} /> Empezar a atender <IconoFlechaDerecha size={13} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Últimos movimientos */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Últimos movimientos</h2>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {ultimos.map((m) => (
                            <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        m.tipo === "Entrada"
                                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                                            : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                                    }`}>
                                        {m.tipo}
                                    </span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{m.producto}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <strong className={`font-mono font-bold ${m.tipo === "Entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                        {m.tipo === "Entrada" ? `+${m.cantidad}` : `-${m.cantidad}`}
                                    </strong>
                                    <span className="text-slate-400">{fechaCorta(m.fecha)}</span>
                                </div>
                            </div>
                        ))}
                        {ultimos.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">Sin movimientos todavía.</p>}
                    </div>
                </section>

                {/* Últimas entradas */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Últimos ingresos de mercadería</h2>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {ultimasEntradas.map((m) => (
                            <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{m.producto}</span>
                                <div className="flex items-center gap-3">
                                    <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{m.cantidad} uds.</strong>
                                    <span className="text-slate-400">{fechaCorta(m.fecha)}</span>
                                </div>
                            </div>
                        ))}
                        {ultimasEntradas.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">Sin entradas registradas aún.</p>}
                    </div>
                </section>
            </div>

            {/* Accesos rápidos */}
            <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Accesos rápidos de almacén</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-5 rounded-2xl text-left shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => navigate("/almacen/productos")}
                    >
                        <strong className="block text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            Catálogo de Productos
                        </strong>
                        <span className="block text-xs text-slate-500 mt-1">Ver y editar stock de inventario</span>
                    </button>
                    <button
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-5 rounded-2xl text-left shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => navigate("/almacen/entradas")}
                    >
                        <strong className="block text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            Registrar Entrada
                        </strong>
                        <span className="block text-xs text-slate-500 mt-1">Ingresar mercadería de proveedores</span>
                    </button>
                    <button
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-5 rounded-2xl text-left shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => navigate("/almacen/kardex")}
                    >
                        <strong className="block text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            Kardex Físico
                        </strong>
                        <span className="block text-xs text-slate-500 mt-1">Trazabilidad de entradas y salidas</span>
                    </button>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;
