import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listarProductos } from "../../../services/productosApi";
import type { ProductoInv } from "../../../context/InventarioContext";
import { listarEntradas, registrarEntradaBackend } from "../../../services/entradasApi";
import type { Entrada } from "../../../services/entradasApi";

function Entradas() {
    const { token, usuario } = useAuth();
    const [productos, setProductos] = useState<ProductoInv[]>([]);
    const [entradas, setEntradas] = useState<Entrada[]>([]);
    const [cargando, setCargando] = useState(true);

    const [productoId, setProductoId] = useState(0);
    const [cantidad, setCantidad] = useState(20);
    const [costo, setCosto] = useState(0);
    const [motivo, setMotivo] = useState("Ingreso de mercadería");
    const [ok, setOk] = useState("");

    const refrescar = async () => {
        if (!token) return;
        try {
            const [listaProductos, listaEntradas] = await Promise.all([listarProductos(token), listarEntradas(token)]);
            setProductos(listaProductos);
            setEntradas(listaEntradas);
        } catch {
            // se mantiene el estado actual si falla
        }
    };

    useEffect(() => {
        let activo = true;
        if (!token) {
            setCargando(false);
            return;
        }
        setCargando(true);
        Promise.all([listarProductos(token), listarEntradas(token)])
            .then(([listaProductos, listaEntradas]) => {
                if (!activo) return;
                setProductos(listaProductos);
                setEntradas(listaEntradas);
            })
            .catch(() => {
                if (activo) setProductos([]);
            })
            .finally(() => {
                if (activo) setCargando(false);
            });
        return () => {
            activo = false;
        };
    }, [token]);

    const activos = productos.filter((p) => p.activo);

    const prod = productos.find((p) => p.id === productoId);
    const stockActual = prod?.stock ?? 0;
    const nuevoStock = stockActual + Math.max(0, cantidad);

    const registrar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !prod || cantidad <= 0) return;
        try {
            await registrarEntradaBackend(token, [{ idProducto: prod.id, cantidad, costoUnitario: costo }]);
            setOk(`✓ Entrada registrada: ${prod.nombre} +${cantidad} unidades (costo S/ ${costo.toFixed(2)})`);
            setCantidad(20);
            setCosto(0);
            setMotivo("Ingreso de mercadería");
            await refrescar();
        } catch (err) {
            console.error("Error al registrar entrada", err);
            setOk(`✗ Error al registrar la entrada: ${err instanceof Error ? err.message : "No se pudo conectar con el servidor"}`);
        }
        setTimeout(() => setOk(""), 6000);
    };

    const inputClass =
        "w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Registrar Entrada de Mercadería</h1>
                <p className="text-sm text-slate-500 mt-1">Ingreso de suministros con cálculo automático de nuevo stock y asiento en Kardex.</p>
            </div>

            <form className="max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4" onSubmit={registrar}>
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Producto a Ingresar
                    </label>
                    <select
                        className={inputClass + " cursor-pointer"}
                        value={productoId}
                        onChange={(e) => setProductoId(Number(e.target.value))}
                        disabled={cargando}
                    >
                        {cargando && <option value={0}>Cargando productos...</option>}
                        {activos.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} (Stock actual: {p.stock})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Cantidad a Ingresar
                        </label>
                        <input
                            className={inputClass}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value === "" ? 0 : Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Costo Unitario (S/)
                        </label>
                        <input
                            className={inputClass}
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9.]*"
                            value={costo}
                            onChange={(e) => setCosto(Number(e.target.value))}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Motivo / Documento de Ingreso
                    </label>
                    <input
                        className={inputClass}
                        type="text"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Guía de remisión / Compra / Reabastecimiento"
                    />
                </div>

                {/* Cálculo automático: solo se muestra cuando hay un producto seleccionado */}
                {prod && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
                    <div>
                        <span className="block text-[11px] font-semibold text-slate-400">Stock Actual</span>
                        <strong className="block text-lg font-mono font-bold text-slate-700 dark:text-slate-300">{stockActual}</strong>
                    </div>
                    <div>
                        <span className="block text-[11px] font-semibold text-slate-400">Ingresando</span>
                        <strong className="block text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">+{Math.max(0, cantidad)}</strong>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-1 border border-emerald-200 dark:border-emerald-800/40">
                        <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Nuevo Stock</span>
                        <strong className="block text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">{nuevoStock}</strong>
                    </div>
                </div>
                )}

                <p className="text-xs text-slate-400">
                    Operador: <strong className="text-slate-600 dark:text-slate-300">{usuario?.nombre ?? "Almacén"}</strong> · Asiento inmediato en Kardex
                </p>

                {ok && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60">
                        {ok}
                    </div>
                )}

                <div className="flex gap-2.5 pt-2">
                    <button
                        type="button"
                        className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                        onClick={() => {
                            setCantidad(20);
                            setCosto(0);
                            setMotivo("Ingreso de mercadería");
                            setOk("");
                        }}
                    >
                        Limpiar formulario
                    </button>
                    <button
                        type="submit"
                        disabled={cargando || !prod}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                    >
                        Registrar entrada
                    </button>
                </div>
            </form>

            {/* Historial de entradas registradas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-black text-slate-900 dark:text-white">Historial de entradas</h2>
                <div className="mt-4 space-y-3">
                    {cargando ? (
                        <p className="text-sm text-slate-500">Cargando entradas...</p>
                    ) : entradas.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay entradas registradas todavía.</p>
                    ) : (
                        entradas.map((e) => (
                            <div key={e.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <strong className="text-xs text-slate-800 dark:text-slate-200">Entrada #{e.id}</strong>
                                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{e.fecha}</span>
                                </div>
                                <div className="mt-2 space-y-1">
                                    {e.items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                            <span>Producto ID {it.idProducto}</span>
                                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{it.cantidad} u.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default Entradas;
