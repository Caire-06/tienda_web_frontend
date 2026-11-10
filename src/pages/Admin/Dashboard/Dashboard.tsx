import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { obtenerDashboardKpis, type DashboardKpis } from "../../../services/dashboardApi";
import { formatearFechaHora } from "../../../data/pedidos";

function Dashboard() {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [kpis, setKpis] = useState<DashboardKpis | null>(null);
    const [cargando, setCargando] = useState(true);

    const cargarDatos = async () => {
        if (!token) return;
        setCargando(true);
        try {
            const data = await obtenerDashboardKpis(token);
            setKpis(data);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [token]);

    const totalHoy = kpis?.ventasHoy ?? 0;
    const totalMes = kpis?.ventasMes ?? 0;
    const totalVentas = kpis?.totalPedidos ?? 0;
    const totalProductos = kpis?.totalProductos ?? 0;
    const totalUsuarios = kpis?.totalUsuarios ?? 0;
    const stockCriticoCount = kpis?.stockCriticoCount ?? 0;
    const pendientesDespacho = kpis?.pedidosPendientesDespacho ?? 0;

    const recientes = kpis?.ultimasVentas ?? [];
    const top = kpis?.topProductos ?? [];
    const maxTop = top[0]?.vendidos || 1;
    const criticos = kpis?.productosStockCritico ?? [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dashboard General</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Métricas y resumen operativo general en tiempo real.
                    </p>
                </div>
                <button
                    onClick={cargarDatos}
                    className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                >
                    ↻ Actualizar Métricas
                </button>
            </div>

            {/* Tarjetas KPI */}
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                <div className="admin-card">
                    <span>Ventas hoy</span>
                    <strong>S/ {Number(totalHoy).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="admin-card">
                    <span>Ventas mes</span>
                    <strong>S/ {Number(totalMes).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="admin-card">
                    <span>N° Ventas</span>
                    <strong>{totalVentas}</strong>
                </div>
                <div className="admin-card">
                    <span>Productos</span>
                    <strong>{totalProductos}</strong>
                </div>
                <div className="admin-card">
                    <span>Usuarios</span>
                    <strong>{totalUsuarios}</strong>
                </div>
                <div className="admin-card alerta">
                    <span>Stock bajo (&lt;10)</span>
                    <strong>{stockCriticoCount}</strong>
                </div>
            </section>

            {/* Aviso Logístico de Cola en Almacén */}
            {pendientesDespacho > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-bold shrink-0">
                            📦
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                {pendientesDespacho} {pendientesDespacho === 1 ? "pedido pendiente" : "pedidos pendientes"} de despacho en Almacén
                            </h3>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                Almacén aún no ha consolidado estos pedidos en un lote de envío al courier.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/admin/despachos")}
                        className="self-start sm:self-auto px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer shrink-0"
                    >
                        Supervisar Despachos →
                    </button>
                </div>
            )}

            {cargando && (
                <div className="text-center py-4 text-xs text-slate-400">
                    Actualizando métricas...
                </div>
            )}

            {/* Grid 2 Columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ventas Recientes */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Ventas recientes</h2>
                        <button
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            onClick={() => navigate("/admin/ventas")}
                        >
                            Ver todas →
                        </button>
                    </div>
                    <div className="tabla-wrap">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>N°</th>
                                    <th>Cliente</th>
                                    <th>Fecha</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recientes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-6 text-xs text-slate-500">
                                            No hay ventas registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    recientes.map((v) => (
                                        <tr key={v.numero}>
                                            <td className="font-mono text-xs">{v.numero}</td>
                                            <td className="font-medium">
                                                {v.cliente || v.comprobante?.nombreRazonSocial || "Cliente"}
                                            </td>
                                            <td className="text-xs text-slate-500 font-mono">{formatearFechaHora(v.fecha)}</td>
                                            <td className="font-mono font-bold">
                                                S/ {Number(v.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Más Vendidos */}
                <section className="space-y-3">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Más vendidos</h2>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                        {top.length === 0 ? (
                            <p className="text-xs text-slate-500">Sin datos de productos.</p>
                        ) : (
                            top.map((p) => (
                                <div key={p.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                                            {p.nombre}
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                                            {p.vendidos} uds. ({p.porcentaje}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, Math.round((p.vendidos / maxTop) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Alertas de Inventario */}
            <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Alertas de inventario</h2>
                {criticos.length === 0 ? (
                    <p className="text-sm text-slate-500">Todo el stock físico está en niveles seguros (&gt;= 10 unidades).</p>
                ) : (
                    <div className="tabla-wrap">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Stock Actual</th>
                                    <th>Precio</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {criticos.map((p) => (
                                    <tr key={p.id}>
                                        <td className="font-medium">{p.nombre}</td>
                                        <td className="text-xs text-slate-500">{p.categoria}</td>
                                        <td className="font-mono font-bold text-rose-600 dark:text-rose-400">{p.stock}</td>
                                        <td className="font-mono">S/ {Number(p.precio).toFixed(2)}</td>
                                        <td>
                                            <span className={`badge ${p.stock === 0 ? "off" : "pend"}`}>
                                                {p.stock === 0 ? "Agotado (0)" : `Stock bajo (${p.stock})`}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Dashboard;
