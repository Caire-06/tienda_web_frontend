import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { obtenerReporteParametrizado } from "../../../services/reportesApi";

type TipoReporte = "ventas" | "inventario" | "usuarios";

function Reportes() {
    const { token } = useAuth();
    const [tipoActivo, setTipoActivo] = useState<TipoReporte>("ventas");
    const [datos, setDatos] = useState<any>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarReporte = async (tipo: TipoReporte) => {
        if (!token) return;
        setCargando(true);
        setError(null);
        try {
            const data = await obtenerReporteParametrizado(token, tipo);
            setDatos(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar reporte");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarReporte(tipoActivo);
    }, [token, tipoActivo]);

    // Exportación a Excel (.csv UTF-8 compatible con Microsoft Excel)
    const exportarExcel = () => {
        if (!datos || !datos.filas || datos.filas.length === 0) {
            alert("No hay datos disponibles para exportar.");
            return;
        }

        let headers: string[] = [];
        let rows: (string | number)[][] = [];

        if (tipoActivo === "ventas") {
            headers = ["N° Venta", "Fecha", "Cliente", "Comprobante", "Serie/N°", "Método Pago", "Modalidad", "Estado", "Total (S/)"];
            rows = datos.filas.map((r: any) => [
                r.numero,
                r.fecha,
                `"${r.cliente}"`,
                r.tipoComprobante,
                r.numeroComprobante,
                r.metodoPago,
                r.tipoEntrega,
                r.estado,
                Number(r.total).toFixed(2),
            ]);
        } else if (tipoActivo === "inventario") {
            headers = ["ID", "Producto", "Categoría", "Precio (S/)", "Stock Físico", "Vendidos", "Stock Valorizado (S/)", "Stock Bajo", "Estado"];
            rows = datos.filas.map((r: any) => [
                r.id,
                `"${r.nombre}"`,
                r.categoria,
                Number(r.precio).toFixed(2),
                r.stock,
                r.vendidos,
                Number(r.valorizado).toFixed(2),
                r.rotacionCritica ? "SÍ (<10)" : "NO",
                r.activo ? "Activo" : "Inactivo",
            ]);
        } else if (tipoActivo === "usuarios") {
            headers = ["ID", "Usuario", "Rol", "Estado", "Bloqueado", "Intentos Fallidos", "Fecha Creación", "Último Acceso"];
            rows = datos.filas.map((r: any) => [
                r.id,
                `"${r.username}"`,
                r.rol,
                r.estado,
                r.bloqueado ? "SÍ" : "NO",
                r.intentosFallidos,
                r.fechaCreacion,
                r.ultimoAcceso,
            ]);
        }

        const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `TechStore_Reporte_${tipoActivo}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        Reportes del Sistema
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Consultas analíticas consolidadas de ventas, inventario y usuarios con exportación a Excel.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => cargarReporte(tipoActivo)}
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

            {/* Pestañas de Selección de Reporte */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
                <button
                    onClick={() => setTipoActivo("ventas")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        tipoActivo === "ventas"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                    1. Ventas y Facturación
                </button>
                <button
                    onClick={() => setTipoActivo("inventario")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        tipoActivo === "inventario"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                    2. Inventario y Rotación
                </button>
                <button
                    onClick={() => setTipoActivo("usuarios")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        tipoActivo === "usuarios"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                    3. Usuarios y Accesos
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {cargando ? (
                <div className="text-center py-12 text-sm text-slate-500">
                    Procesando reporte analítico...
                </div>
            ) : datos ? (
                <div className="space-y-6">
                    {/* RESUMEN ANALÍTICO */}
                    {tipoActivo === "ventas" && (
                        <>
                            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="admin-card">
                                    <span>Total Facturado</span>
                                    <strong>S/ {Number(datos.totalVentas || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong>
                                </div>
                                <div className="admin-card">
                                    <span>N° Transacciones</span>
                                    <strong>{datos.totalPedidos || 0} pedidos</strong>
                                </div>
                                <div className="admin-card">
                                    <span>Ticket Promedio</span>
                                    <strong>S/ {Number(datos.ticketPromedio || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong>
                                </div>
                            </section>

                            {/* Ventas Agrupadas por Fecha */}
                            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Ventas por Día (S/)
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                                    {Object.entries(datos.ventasPorDia || {}).map(([fecha, tot]: any) => (
                                        <div key={fecha} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
                                            <div className="text-[11px] font-mono text-slate-500">{fecha}</div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                                                S/ {Number(tot).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {tipoActivo === "inventario" && (
                        <>
                            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="admin-card">
                                    <span>Stock Valorizado Total</span>
                                    <strong>S/ {Number(datos.stockValorizado || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong>
                                </div>
                                <div className="admin-card">
                                    <span>Unidades Físicas en Almacén</span>
                                    <strong>{datos.stockTotal || 0} unidades</strong>
                                </div>
                                <div className="admin-card">
                                    <span>Catálogo de Productos</span>
                                    <strong>{datos.totalProductos || 0} ítems</strong>
                                </div>
                            </section>
                        </>
                    )}

                    {tipoActivo === "usuarios" && (
                        <>
                            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="admin-card">
                                    <span>Total Cuentas</span>
                                    <strong>{datos.total || 0}</strong>
                                </div>
                                <div className="admin-card">
                                    <span>Usuarios Activos</span>
                                    <strong className="text-emerald-600">{datos.activos || 0}</strong>
                                </div>
                                <div className="admin-card">
                                    <span>Inactivos</span>
                                    <strong className="text-slate-500">{datos.inactivos || 0}</strong>
                                </div>
                                <div className="admin-card alerta">
                                    <span>Cuentas Bloqueadas</span>
                                    <strong>{datos.bloqueados || 0}</strong>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Tabla de Filas Detalladas */}
                    <div className="tabla-wrap">
                        <table className="tabla">
                            <thead>
                                {tipoActivo === "ventas" && (
                                    <tr>
                                        <th>N° Venta</th>
                                        <th>Cliente</th>
                                        <th>Comprobante</th>
                                        <th>Fecha</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                    </tr>
                                )}
                                {tipoActivo === "inventario" && (
                                    <tr>
                                        <th>Producto</th>
                                        <th>Categoría</th>
                                        <th>Precio Unit.</th>
                                        <th>Stock Físico</th>
                                        <th>Stock Valorizado</th>
                                        <th>Rotación</th>
                                    </tr>
                                )}
                                {tipoActivo === "usuarios" && (
                                    <tr>
                                        <th>ID</th>
                                        <th>Usuario</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Intentos Fallidos</th>
                                        <th>Último Acceso</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {datos.filas?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-6 text-xs text-slate-500">
                                            No hay registros disponibles.
                                        </td>
                                    </tr>
                                ) : (
                                    datos.filas.map((f: any, idx: number) => {
                                        if (tipoActivo === "ventas") {
                                            return (
                                                <tr key={idx}>
                                                    <td className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                                        {f.numero}
                                                    </td>
                                                    <td className="font-semibold">{f.cliente}</td>
                                                    <td className="text-xs">
                                                        <span className="font-mono">{f.numeroComprobante}</span> ({f.tipoComprobante})
                                                    </td>
                                                    <td className="text-xs text-slate-500">{f.fecha?.slice(0, 10)}</td>
                                                    <td className="font-mono font-bold">
                                                        S/ {Number(f.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td>
                                                        <span className="badge ok">{f.estado}</span>
                                                    </td>
                                                </tr>
                                            );
                                        } else if (tipoActivo === "inventario") {
                                            return (
                                                <tr key={idx}>
                                                    <td className="font-semibold">{f.nombre}</td>
                                                    <td className="text-xs text-slate-500">{f.categoria}</td>
                                                    <td className="font-mono">S/ {Number(f.precio).toFixed(2)}</td>
                                                    <td className="font-mono font-bold">{f.stock}</td>
                                                    <td className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                                        S/ {Number(f.valorizado).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${f.rotacionCritica ? "off" : "ok"}`}>
                                                            {f.rotacionCritica ? "Stock bajo (<10)" : "Normal"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        } else {
                                            return (
                                                <tr key={idx}>
                                                    <td className="font-mono text-xs">{f.id}</td>
                                                    <td className="font-mono text-xs font-semibold">{f.username}</td>
                                                    <td>
                                                        <span className="badge font-medium">{f.rol}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${f.estado === "Inactivo" ? "off" : "ok"}`}>
                                                            {f.estado || "Activo"}
                                                        </span>
                                                    </td>
                                                    <td className="font-mono">{f.intentosFallidos}</td>
                                                    <td className="text-xs text-slate-500">{f.ultimoAcceso}</td>
                                                </tr>
                                            );
                                        }
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default Reportes;
