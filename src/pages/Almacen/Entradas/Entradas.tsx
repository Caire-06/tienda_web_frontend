import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listarProductos } from "../../../services/productosApi";
import type { ProductoInv } from "../../../context/InventarioContext";
import { listarEntradasPaginado, registrarEntradaBackend } from "../../../services/entradasApi";
import type { Entrada } from "../../../services/entradasApi";
import { listarProveedores } from "../../../services/proveedoresApi";
import type { Proveedor } from "../../../services/proveedoresApi";
import { Paginacion, REGISTROS_POR_PAGINA } from "../../../components/Paginacion/Paginacion";
import {
    limpiarDecimal,
    limpiarEnteroNoNegativo,
    parsearNumeroSeguro,
} from "../../../utils/validaciones";

function Entradas() {
    const { token, usuario } = useAuth();
    const [productos, setProductos] = useState<ProductoInv[]>([]);
    const [entradas, setEntradas] = useState<Entrada[]>([]);
    const [cargando, setCargando] = useState(true);

    const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
    const [productoId, setProductoId] = useState(0);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [proveedorId, setProveedorId] = useState(0);
    const [cantidadTexto, setCantidadTexto] = useState("");
    const [costoTexto, setCostoTexto] = useState("");
    const [motivo, setMotivo] = useState("");
    const [ok, setOk] = useState("");
    const [errorForm, setErrorForm] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    const refrescar = async (p: number = pagina) => {
        if (!token) return;
        try {
            const [listaProductos, resEntradas, listaProveedores] = await Promise.all([
                listarProductos(token),
                listarEntradasPaginado(token, p, REGISTROS_POR_PAGINA),
                listarProveedores(token),
            ]);
            setProductos(listaProductos);
            setEntradas(resEntradas.contenido);
            setTotalPaginas(resEntradas.totalPaginas);
            setTotalRegistros(resEntradas.totalElementos);
            setProveedores(listaProveedores);
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
        Promise.all([
            listarProductos(token),
            listarEntradasPaginado(token, pagina, REGISTROS_POR_PAGINA),
            listarProveedores(token),
        ])
            .then(([listaProductos, resEntradas, listaProveedores]) => {
                if (!activo) return;
                setProductos(listaProductos);
                setEntradas(resEntradas.contenido);
                setTotalPaginas(resEntradas.totalPaginas);
                setTotalRegistros(resEntradas.totalElementos);
                setProveedores(listaProveedores);
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
    }, [token, pagina]);

    const activos = useMemo(() => productos.filter((p) => p.activo), [productos]);

    // Categorías únicas disponibles en los productos activos
    const categoriasDisponibles = useMemo(() => {
        const setCat = new Set<string>();
        activos.forEach((p) => {
            if (p.categoria?.trim()) setCat.add(p.categoria.trim());
        });
        return ["Todas", ...Array.from(setCat).sort()];
    }, [activos]);

    // Productos activos filtrados por la categoría seleccionada
    const productosFiltrados = useMemo(() => {
        if (categoriaFiltro === "Todas") return activos;
        return activos.filter((p) => p.categoria === categoriaFiltro);
    }, [activos, categoriaFiltro]);

    // Agrupación por categoría para el <optgroup>
    const productosPorCategoria = useMemo(() => {
        const grupos: Record<string, ProductoInv[]> = {};
        productosFiltrados.forEach((p) => {
            const cat = p.categoria || "Otras categorías";
            if (!grupos[cat]) grupos[cat] = [];
            grupos[cat].push(p);
        });
        return grupos;
    }, [productosFiltrados]);

    // Producto seleccionado
    const prod = productos.find((p) => p.id === productoId);
    const stockActual = prod?.stock ?? 0;
    const cantidad = parsearNumeroSeguro(cantidadTexto);
    const costo = parsearNumeroSeguro(costoTexto);
    const nuevoStock = stockActual + Math.max(0, cantidad);

    // Al cambiar la categoría, si el producto actual no pertenece al filtro, restablecer selección
    const cambiarCategoriaFiltro = (nuevaCat: string) => {
        setCategoriaFiltro(nuevaCat);
        if (productoId > 0 && nuevaCat !== "Todas") {
            const prodActual = productos.find((p) => p.id === productoId);
            if (prodActual && prodActual.categoria !== nuevaCat) {
                setProductoId(0);
                setCostoTexto("");
            }
        }
    };

    // Al seleccionar un producto en el dropdown, precargar su costo sugerido
    const seleccionarProducto = (nuevoId: number) => {
        setProductoId(nuevoId);
        if (nuevoId <= 0) {
            setCostoTexto("");
            return;
        }
        const seleccionado = productos.find((p) => p.id === nuevoId);
        if (seleccionado) {
            setCostoTexto(seleccionado.precio.toFixed(2));
        }
    };

    const limpiarFormulario = () => {
        setProductoId(0);
        setProveedorId(0);
        setCantidadTexto("");
        setCostoTexto("");
        setMotivo("");
        setErrorForm("");
    };

    const registrar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorForm("");
        setOk("");
        if (!token) return;
        if (!prod) {
            setErrorForm("Selecciona un producto válido para registrar la entrada.");
            return;
        }
        if (proveedorId <= 0) {
            setErrorForm("Selecciona un proveedor válido para registrar la entrada.");
            return;
        }
        if (cantidad <= 0) {
            setErrorForm("La cantidad a ingresar debe ser mayor a 0.");
            return;
        }
        if (!costoTexto.trim() || costo < 0) {
            setErrorForm("Ingresa un costo unitario válido de compra.");
            return;
        }
        try {
            await registrarEntradaBackend(token, [
                { idProducto: prod.id, idProveedor: proveedorId, cantidad, costoUnitario: costo },
            ]);
            setOk(
                `✓ Entrada registrada: ${prod.nombre} +${cantidad} unidades (costo S/ ${costo.toFixed(2)}) del proveedor ${
                    proveedores.find((p) => p.id === proveedorId)?.nombre ?? proveedorId
                }`
            );
            limpiarFormulario();
            await refrescar();
        } catch (err) {
            console.error("Error al registrar entrada", err);
            setErrorForm(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
        }
        setTimeout(() => setOk(""), 6000);
    };

    const inputClass =
        "w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Registrar Entrada de Mercadería</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Ingreso de suministros con cálculo automático de nuevo stock y asiento en Kardex.
                </p>
            </div>

            <form
                className="max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4"
                onSubmit={registrar}
            >
                {/* Filtro previo de categoría para facilitar la selección */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Filtrar por Categoría
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {categoriasDisponibles.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => cambiarCategoriaFiltro(cat)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                    categoriaFiltro === cat
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selector de Producto agrupado por Categoría */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Producto a Ingresar ({productosFiltrados.length})
                        </label>
                        {prod && (
                            <span className="text-[11px] text-slate-500 font-medium">
                                PVP venta: <strong className="text-slate-700 dark:text-slate-300">S/ {prod.precio.toFixed(2)}</strong>
                            </span>
                        )}
                    </div>
                    <select
                        className={inputClass + " cursor-pointer"}
                        value={productoId}
                        onChange={(e) => seleccionarProducto(Number(e.target.value) || 0)}
                        disabled={cargando}
                        required
                    >
                        {cargando ? (
                            <option value={0}>Cargando productos...</option>
                        ) : (
                            <option value={0}>-- Selecciona un producto --</option>
                        )}
                        {!cargando && productosFiltrados.length === 0 && (
                            <option value={0}>Sin productos en esta categoría</option>
                        )}
                        {Object.entries(productosPorCategoria).map(([categoria, listaProds]) => (
                            <optgroup key={categoria} label={categoria}>
                                {listaProds.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} (Stock: {p.stock} | S/ {p.precio.toFixed(2)})
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {/* Proveedor */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Proveedor
                    </label>
                    <select
                        className={inputClass + " cursor-pointer"}
                        value={proveedorId}
                        onChange={(e) => setProveedorId(Number(e.target.value) || 0)}
                        disabled={cargando}
                        required
                    >
                        <option value={0}>-- Selecciona un proveedor --</option>
                        {proveedores.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} {p.ruc ? `(RUC: ${p.ruc})` : ""}
                            </option>
                        ))}
                    </select>
                    {!cargando && proveedores.length === 0 && (
                        <p className="text-[11px] text-amber-600">
                            Sin proveedores registrados. Registra uno en el menú Proveedores.
                        </p>
                    )}
                </div>

                {/* Cantidad y Costo de Adquisición */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Cantidad a Ingresar
                        </label>
                        <input
                            className={inputClass}
                            type="text"
                            inputMode="numeric"
                            placeholder="Ej. 20"
                            value={cantidadTexto}
                            onChange={(e) => setCantidadTexto(limpiarEnteroNoNegativo(e.target.value))}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                Costo Unitario Compra (S/)
                            </label>
                            {prod && (
                                <button
                                    type="button"
                                    onClick={() => setCostoTexto(prod.precio.toFixed(2))}
                                    className="text-[10px] text-emerald-600 hover:underline cursor-pointer"
                                    title="Restaurar precio de catálogo como sugerencia"
                                >
                                    Usar PVP
                                </button>
                            )}
                        </div>
                        <input
                            className={inputClass}
                            type="text"
                            inputMode="decimal"
                            value={costoTexto}
                            onChange={(e) => setCostoTexto(limpiarDecimal(e.target.value))}
                            placeholder="0.00"
                            required
                        />
                        <p className="text-[10px] text-slate-400">
                            Costo de adquisición pactado con el proveedor en esta entrada.
                        </p>
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
                        placeholder="Guía de remisión / Factura / Reabastecimiento"
                    />
                </div>

                {/* Cálculo automático de existencias */}
                {prod ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
                        <div>
                            <span className="block text-[11px] font-semibold text-slate-400">Stock Actual</span>
                            <strong className="block text-lg font-mono font-bold text-slate-700 dark:text-slate-300">
                                {stockActual}
                            </strong>
                        </div>
                        <div>
                            <span className="block text-[11px] font-semibold text-slate-400">Ingresando</span>
                            <strong className="block text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                +{Math.max(0, cantidad)}
                            </strong>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-1 border border-emerald-200 dark:border-emerald-800/40">
                            <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                Nuevo Stock
                            </span>
                            <strong className="block text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {nuevoStock}
                            </strong>
                        </div>
                    </div>
                ) : (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 text-center text-xs text-slate-400">
                        Selecciona un producto y un proveedor para visualizar el stock actual y la proyección.
                    </div>
                )}

                <p className="text-xs text-slate-400">
                    Operador: <strong className="text-slate-600 dark:text-slate-300">{usuario?.nombre ?? "Almacén"}</strong> · Asiento inmediato en Kardex
                </p>

                {errorForm && (
                    <div
                        role="alert"
                        className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold text-xs border border-red-200 dark:border-red-800/60"
                    >
                        {errorForm}
                    </div>
                )}

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
                            limpiarFormulario();
                            setOk("");
                        }}
                    >
                        Restablecer
                    </button>
                    <button
                        type="submit"
                        disabled={cargando || activos.length === 0}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                    >
                        Confirmar Entrada
                    </button>
                </div>
            </form>

            {/* Historial de Entradas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-black text-slate-900 dark:text-white">Últimas Entradas Registradas</h2>
                <div className="mt-4 space-y-3">
                    {cargando ? (
                        <p className="text-sm text-slate-500">Cargando entradas...</p>
                    ) : entradas.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay entradas registradas todavía.</p>
                    ) : (
                        entradas.map((e) => (
                            <div
                                key={e.id}
                                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 text-xs"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <strong className="text-xs text-slate-800 dark:text-slate-200">
                                        Entrada #{e.id}
                                    </strong>
                                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                        {e.fecha}
                                    </span>
                                </div>
                                <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                                    {e.items && e.items.map((it, idx) => {
                                        const prodItem = productos.find((p) => p.id === it.idProducto);
                                        const provItem = proveedores.find((p) => p.id === it.idProveedor);
                                        return (
                                            <div
                                                key={idx}
                                                className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300"
                                            >
                                                <span>
                                                    <strong className="text-slate-800 dark:text-slate-200">
                                                        {prodItem?.nombre ?? `Producto #${it.idProducto}`}
                                                    </strong>{" "}
                                                    · Proveedor: {provItem?.nombre ?? `#${it.idProveedor}`}
                                                </span>
                                                <div className="text-right">
                                                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                                                        +{it.cantidad} u.
                                                    </span>
                                                    <span className="font-mono text-slate-500 ml-2">
                                                        Costo: S/ {Number(it.costoUnitario || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6">
                    <Paginacion
                        paginaActual={pagina}
                        totalPaginas={totalPaginas}
                        totalRegistros={totalRegistros}
                        onCambiar={setPagina}
                    />
                </div>
            </div>
        </div>
    );
}

export default Entradas;