import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listarProductos, crearProducto, actualizarProducto, subirImagen } from "../../../services/productosApi";
import { CATEGORIAS } from "../../../data/productos";
import type { DatosProducto, ProductoInv } from "../../../context/InventarioContext";
import { ImagenProducto } from "../../../components/ImagenProducto/ImagenProducto";
import {
    limpiarDecimal,
    limpiarEnteroNoNegativo,
    parsearNumeroSeguro,
} from "../../../utils/validaciones";

type FiltroEstado = "todos" | "disponible" | "bajo" | "sin" | "inactivo";

function estadoDe(p: ProductoInv): string {
    if (!p.activo) return "Inactivo";
    if (p.stock === 0) return "Sin stock";
    if (p.stock < 10) return "Stock bajo";
    return "Disponible";
}

const VACIO: DatosProducto = {
    nombre: "",
    categoria: CATEGORIAS[0].nombre,
    precio: 0,
    stock: 0,
    imagen: "",
    descripcion: "",
};

function Productos() {
    const { token } = useAuth();
    const [productos, setProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("Todas");
    const [estado, setEstado] = useState<FiltroEstado>("todos");

    const [formId, setFormId] = useState<number | null | undefined>(undefined);
    const [form, setForm] = useState<DatosProducto>(VACIO);
    const [precioTexto, setPrecioTexto] = useState("");
    const [stockTexto, setStockTexto] = useState("0");
    const [guardando, setGuardando] = useState(false);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [preview, setPreview] = useState("");
    const [errorModal, setErrorModal] = useState<string | null>(null);

    const refrescar = async () => {
        if (!token) return;
        try {
            const lista = await listarProductos(token);
            setProductos(lista);
        } catch {
            setProductos([]);
        }
    };

    useEffect(() => {
        let activo = true;
        if (!token) {
            setProductos([]);
            setCargando(false);
            return;
        }
        setCargando(true);
        listarProductos(token)
            .then((lista) => { if (activo) setProductos(lista); })
            .catch(() => { if (activo) setProductos([]); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token]);

    const filtrados = productos.filter((p) => {
        if (categoria !== "Todas" && p.categoria !== categoria) return false;
        if (estado === "disponible" && !(p.activo && p.stock >= 10)) return false;
        if (estado === "bajo" && !(p.activo && p.stock > 0 && p.stock < 10)) return false;
        if (estado === "sin" && !(p.activo && p.stock === 0)) return false;
        if (estado === "inactivo" && p.activo) return false;
        const q = busqueda.trim().toLowerCase();
        if (q && !p.nombre.toLowerCase().includes(q)) return false;
        return true;
    });

    const abrirNuevo = () => {
        setFormId(null);
        setForm(VACIO);
        setPrecioTexto("");
        setStockTexto("0");
        setArchivo(null);
        setPreview("");
        setErrorModal(null);
    };

    const abrirEditar = (p: ProductoInv) => {
        setFormId(p.id);
        setForm({
            nombre: p.nombre,
            categoria: p.categoria,
            precio: p.precio,
            stock: p.stock,
            imagen: p.imagen,
            descripcion: p.descripcion,
        });
        setPrecioTexto(String(p.precio));
        setStockTexto(String(p.stock));
        setArchivo(null);
        setPreview("");
        setErrorModal(null);
    };

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setErrorModal(null);
        const nombreLimpio = form.nombre.trim();
        const precioNum = parsearNumeroSeguro(precioTexto);
        const stockNum = parsearNumeroSeguro(stockTexto);

        if (nombreLimpio.length < 2) {
            setErrorModal("Ingresa un nombre válido para el producto (mínimo 2 caracteres).");
            return;
        }
        if (precioNum <= 0) {
            setErrorModal("Ingresa un precio válido mayor a S/ 0.00.");
            return;
        }
        if (stockNum < 0) {
            setErrorModal("El stock no puede ser negativo.");
            return;
        }

        setGuardando(true);
        try {
            let imagenFinal: string | undefined = form.imagen.trim() || undefined;
            if (archivo) {
                setSubiendo(true);
                const subida = await subirImagen(token, archivo);
                imagenFinal = subida.url;
            }
            if (formId === null) {
                await crearProducto(token, {
                    nombre: nombreLimpio,
                    categoria: form.categoria,
                    precio: precioNum,
                    stock: Math.trunc(stockNum),
                    imagen: imagenFinal,
                    descripcion: form.descripcion.trim(),
                });
            } else if (formId !== undefined) {
                await actualizarProducto(token, formId, {
                    nombre: nombreLimpio,
                    categoria: form.categoria,
                    precio: precioNum,
                    stock: Math.trunc(stockNum),
                    imagen: imagenFinal,
                    descripcion: form.descripcion.trim(),
                    activo: editando?.activo ?? true,
                });
            }
            setFormId(undefined);
            await refrescar();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "No se pudo guardar el producto.";
            setErrorModal(msg);
            console.error("Error al guardar producto", err);
        } finally {
            setSubiendo(false);
            setGuardando(false);
        }
    };

    const cambiarActivo = async (id: number, activo: boolean) => {
        if (!token) return;
        try {
            await actualizarProducto(token, id, { activo });
            await refrescar();
        } catch (err) {
            console.error("Error al cambiar estado del producto", err);
        }
    };

    const editando = formId !== undefined ? productos.find((p) => p.id === formId) : undefined;
    const selectClass =
        "px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer";
    const inputClass =
        "w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Inventario de Productos</h1>
                <p className="text-sm text-slate-500 mt-1">Gestión operativa de catálogo, disponibilidad y stock físico.</p>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-wrap gap-2.5 items-center shadow-xs">
                <input
                    className="flex-1 min-w-[200px] px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <select className={selectClass} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    <option>Todas</option>
                    {CATEGORIAS.map((c) => (
                        <option key={c.nombre}>{c.nombre}</option>
                    ))}
                </select>
                <select className={selectClass} value={estado} onChange={(e) => setEstado(e.target.value as FiltroEstado)}>
                    <option value="todos">Todos los estados</option>
                    <option value="disponible">Disponible</option>
                    <option value="bajo">Stock bajo</option>
                    <option value="sin">Sin stock</option>
                    <option value="inactivo">Inactivos</option>
                </select>
                <button
                    className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
                    onClick={abrirNuevo}
                >
                    + Nuevo producto
                </button>
            </div>

            <div className="tabla-wrap">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map((p) => (
                            <tr key={p.id} className={p.activo ? "" : "opacity-60 bg-slate-50/50 dark:bg-slate-900/50"}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0">
                                            <ImagenProducto src={p.imagen} alt={p.nombre} compact className="h-full w-full object-contain" />
                                        </div>
                                        <span className="font-semibold text-xs">{p.nombre}</span>
                                    </div>
                                </td>
                                <td className="text-xs text-slate-500">{p.categoria}</td>
                                <td className="font-mono font-bold text-xs">S/ {p.precio.toLocaleString("es-PE")}</td>
                                <td className="font-mono font-bold text-xs">{p.stock}</td>
                                <td>
                                    <span className={`badge ${!p.activo ? "gris" : p.stock === 0 ? "off" : p.stock < 10 ? "pend" : "ok"}`}>
                                        {estadoDe(p)}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <button className="btn-mini" onClick={() => abrirEditar(p)} title="Editar producto" aria-label="Editar producto">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                        </button>
                                        <button
                                            className="btn-mini sec"
                                            onClick={() => cambiarActivo(p.id, !p.activo)}
                                            title={p.activo ? "Desactivar producto" : "Activar producto"}
                                            aria-label={p.activo ? "Desactivar producto" : "Activar producto"}
                                        >
                                            {p.activo ? (
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M12 20h.01"/></svg>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtrados.length === 0 && (
                    <div className="text-center py-10 text-sm text-slate-500">
                        {cargando ? "Cargando productos…" : "Sin productos para los filtros seleccionados."}
                    </div>
                )}
            </div>

            {/* Modal nuevo / editar */}
            {formId !== undefined && (
                <div className="modal-fondo">
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>{formId === null ? "Nuevo producto" : "Editar producto"}</h2>
                            <button className="modal-cerrar" onClick={() => setFormId(undefined)}>✕</button>
                        </div>

                        {editando && editando.vendidos > 0 && (
                            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                                Este producto tiene {editando.vendidos} ventas registradas; puedes editarlo o desactivarlo cuando quieras.
                            </div>
                        )}

                        <form onSubmit={guardar} className="space-y-3.5">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Nombre del producto</label>
                                <input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Categoría</label>
                                    <select className={selectClass + " w-full"} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                                        {CATEGORIAS.map((c) => (
                                            <option key={c.nombre}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Precio (S/)</label>
                                    <input
                                        className={inputClass}
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={precioTexto}
                                        onChange={(e) => setPrecioTexto(limpiarDecimal(e.target.value))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Stock {formId === null ? "inicial" : "actual"}</label>
                                    <input
                                        className={inputClass}
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={stockTexto}
                                        onChange={(e) => setStockTexto(limpiarEnteroNoNegativo(e.target.value))}
                                        required
                                        disabled={formId !== null}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Imagen (subir desde PC)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] ?? null;
                                            setArchivo(f);
                                            setPreview(f ? URL.createObjectURL(f) : "");
                                        }}
                                        className={inputClass}
                                        disabled={subiendo}
                                    />
                                    {preview && (
                                        <div className="mt-2">
                                            <img src={preview} alt="Vista previa" className="w-full h-28 object-contain rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Descripción</label>
                                <textarea className={inputClass} rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                            </div>
                            {errorModal && (
                                <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
                                    {errorModal}
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <button type="button" className="btn-mini sec" onClick={() => setFormId(undefined)}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={guardando} className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-60">
                                    {formId === null ? "Crear producto" : "Guardar cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Productos;
