import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listarPedidosAdmin } from "../../../services/pedidosApi";
import { listarProductos } from "../../../services/productosApi";
import type { Pedido } from "../../../data/pedidos";
import type { ProductoInv } from "../../../context/InventarioContext";

type Periodo = "hoy" | "semana" | "mes" | "custom";

function inicioDelDia(d: Date) {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return +c;
}

function Reportes() {
    const { token } = useAuth();
    const [todasVentas, setTodasVentas] = useState<Pedido[]>([]);
    const [productos, setProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);

    const [periodo, setPeriodo] = useState<Periodo>("semana");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");

    const cargarDatos = async () => {
        if (!token) return;
        setCargando(true);
        try {
            const [vData, pData] = await Promise.all([
                listarPedidosAdmin(token).catch(() => []),
                listarProductos(token).catch(() => []),
            ]);
            setTodasVentas(vData);
            setProductos(pData);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [token]);

    const hoy = new Date();
    let ini: number;
    let fin = inicioDelDia(hoy) + 24 * 3600 * 1000;

    if (periodo === "hoy") {
        ini = inicioDelDia(hoy);
    } else if (periodo === "semana") {
        ini = inicioDelDia(hoy) - 6 * 24 * 3600 * 1000;
    } else if (periodo === "mes") {
        ini = +new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    } else {
        ini = desde ? +new Date(desde + "T00:00") : inicioDelDia(hoy) - 6 * 24 * 3600 * 1000;
        fin = hasta ? +new Date(hasta + "T00:00") + 24 * 3600 * 1000 : fin;
    }

    const ventas = todasVentas.filter((v) => {
        const t = +new Date(v.fecha);
        return isNaN(t) || (t >= ini && t < fin);
    });

    const totalVendido = ventas.reduce((acc, v) => acc + Number(v.total), 0);
    const unidades = ventas.reduce((acc, v) => acc + (v.items || []).reduce((a, it) => a + it.cantidad, 0), 0);

    // Ventas por día para el gráfico (máximo 31 barras)
    const dias: { etiqueta: string; total: number }[] = [];
    for (let t = ini; t < fin && dias.length < 31; t += 24 * 3600 * 1000) {
        const d = new Date(t);
        const total = ventas
            .filter((v) => {
                const vd = new Date(v.fecha);
                return !isNaN(vd.getTime()) && vd.getFullYear() === d.getFullYear() && vd.getMonth() === d.getMonth() && vd.getDate() === d.getDate();
            })
            .reduce((acc, v) => acc + Number(v.total), 0);
        dias.push({ etiqueta: `${d.getDate()}/${d.getMonth() + 1}`, total });
    }
    const maxDia = Math.max(1, ...dias.map((d) => d.total));

    // Ranking del periodo
    const porProducto: Record<string, number> = {};
    ventas.forEach((v) => (v.items || []).forEach((it) => {
        porProducto[it.nombre] = (porProducto[it.nombre] ?? 0) + it.cantidad;
    }));
    const ranking = Object.entries(porProducto).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxRank = ranking[0]?.[1] ?? 1;

    const stockBajo = productos.filter((p) => p.activo && p.stock < 10);

    // Exportación a Excel / CSV (Requisito mandatorio de interfaz Etapa 7)
    const exportarExcel = () => {
        const headers = ["N° Venta", "Fecha", "Cliente", "Tipo Comprobante", "Documento", "Estado", "Total (S/)", "IGV 18% (S/)", "Base Imponible (S/)"];
        const rows = ventas.map((v) => {
            const igv = v.comprobante?.igv ? Number(v.comprobante.igv).toFixed(2) : (Number(v.total) - Number(v.total) / 1.18).toFixed(2);
            const subtotal = v.comprobante?.subtotal ? Number(v.comprobante.subtotal).toFixed(2) : (Number(v.total) / 1.18).toFixed(2);
            return [
                v.numero,
                v.fecha,
                `"${(v.cliente || v.comprobante?.nombreRazonSocial || "Cliente").replace(/"/g, '""')}"`,
                v.comprobante?.tipo || "Ticket",
                v.comprobante?.documento || "—",
                v.estado || "Pendiente",
                Number(v.total).toFixed(2),
                igv,
                subtotal,
            ].join(",");
        });

        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_TechStore_${periodo}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const btnPeriodoClass = (activo: boolean) =>
        `px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            activo
                ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500"
        }`;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Módulo de Reportería</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Análisis de rendimiento, rotación y volumen de facturación en PostgreSQL.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={cargarDatos}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                    >
                        ↻ Actualizar
                    </button>
                    <button
                        onClick={exportarExcel}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                        <span>📥</span> Descargar Excel (.csv)
                    </button>
                </div>
            </div>

            {/* Selector de Periodos */}
            <div className="flex flex-wrap items-center gap-2">
                {(["hoy", "semana", "mes", "custom"] as Periodo[]).map((p) => (
                    <button key={p} className={btnPeriodoClass(periodo === p)} onClick={() => setPeriodo(p)}>
                        {p === "hoy" ? "Hoy" : p === "semana" ? "Últimos 7 días" : p === "mes" ? "Este mes" : "Personalizado"}
                    </button>
                ))}
                {periodo === "custom" && (
                    <div className="flex items-center gap-2 ml-2">
                        <input
                            type="date"
                            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            value={desde}
                            onChange={(e) => setDesde(e.target.value)}
                        />
                        <input
                            type="date"
                            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            value={hasta}
                            onChange={(e) => setHasta(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* KPIs */}
            <section className="admin-cards grid-cols-1 sm:grid-cols-3">
                <div className="admin-card">
                    <span>Total facturado</span>
                    <strong>S/ {totalVendido.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="admin-card">
                    <span>Número de ventas</span>
                    <strong>{ventas.length}</strong>
                </div>
                <div className="admin-card">
                    <span>Unidades vendidas</span>
                    <strong>{unidades} uds.</strong>
                </div>
            </section>

            {cargando && (
                <div className="text-center py-4 text-xs text-slate-400">
                    Procesando transacciones desde PostgreSQL...
                </div>
            )}

            {/* Gráfico de Ventas por Día */}
            <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Evolución de Ventas por día</h2>
                <div className="flex gap-3 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 overflow-x-auto shadow-sm">
                    {dias.map((d) => (
                        <div key={d.etiqueta} className="flex-1 min-w-[56px] flex flex-col items-center gap-2 group p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <span className="text-[11px] font-mono font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                                S/ {d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total.toFixed(0)}
                            </span>
                            <div className="w-full max-w-[50px] h-40 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-end overflow-hidden p-0.5">
                                <div
                                    className="w-full bg-gradient-to-t from-blue-700 to-blue-400 rounded-md transition-all duration-300 group-hover:brightness-110 min-h-[4px]"
                                    style={{ height: `${Math.round((d.total / maxDia) * 100)}%` }}
                                />
                            </div>
                            <span className="text-[11px] font-medium text-slate-400">{d.etiqueta}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Grid 2 Columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking */}
                <section className="space-y-3">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Más vendidos del periodo</h2>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                        {ranking.length === 0 ? (
                            <p className="text-sm text-slate-500 py-6 text-center">Sin ventas en este periodo.</p>
                        ) : (
                            ranking.map(([nombre, cant]) => (
                                <div key={nombre} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                                            {nombre}
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                                            {cant} unidades
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${Math.round((cant / maxRank) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Stock Crítico */}
                <section className="space-y-3">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Stock crítico bajo</h2>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                        {stockBajo.length === 0 ? (
                            <p className="text-sm text-slate-500 py-6 text-center">No hay productos en nivel crítico.</p>
                        ) : (
                            <div className="space-y-3">
                                {stockBajo.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                                            {p.nombre}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                                {p.stock} uds.
                                            </span>
                                            <span className={`badge ${p.stock === 0 ? "off" : "pend"}`}>
                                                {p.stock === 0 ? "Agotado" : "Bajo"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Reportes;
