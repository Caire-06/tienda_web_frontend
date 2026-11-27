import { formatoImporte } from "../../../utils/formatoImporte";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarProductosPaginado,
    crearProducto,
    actualizarProducto,
    subirImagen,
} from "../../../services/productosApi";
import type { DatosProducto, ProductoInv } from "../../../context/InventarioContext";
import { ImagenProducto } from "../../../components/ImagenProducto/ImagenProducto";
import { Paginacion, REGISTROS_POR_PAGINA } from "../../../components/Paginacion/Paginacion";
import { EditorEspecificaciones } from "../../../components/EditorEspecificaciones/EditorEspecificaciones";
import { generarEspecificacionesPorDefecto } from "../../../data/plantillasEspecificaciones";
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

const CATEGORIAS_BASE = [
    "Laptops",
    "Smartphones",
    "Audio",
    "Periféricos",
    "Accesorios",
    "Monitores",
];

const MARCAS_BASE = [
    "Apple",
    "Samsung",
    "Sony",
    "Logitech",
    "Xiaomi",
    "Lenovo",
    "Redragon",
    "JBL",
    "HP",
    "ASUS",
    "Motorola",
    "HONOR",
    "Kingston",
    "UGREEN",
];

const STORAGE_CAT_KEY = "techstore_custom_categorias";
const STORAGE_MARCA_KEY = "techstore_custom_marcas";

function obtenerGuardadas(key: string): string[] {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function guardarPersonalizada(key: string, valor: string): string[] {
    const limpio = valor.trim();
    if (!limpio) return obtenerGuardadas(key);
    const formateado = limpio.charAt(0).toUpperCase() + limpio.slice(1);
    try {
        const actuales = obtenerGuardadas(key);
        if (!actuales.some((a) => a.toLowerCase() === formateado.toLowerCase())) {
            const nuevas = [...actuales, formateado];
            localStorage.setItem(key, JSON.stringify(nuevas));
            return nuevas;
        }
        return actuales;
    } catch {
        return [];
    }
}

const VACIO: DatosProducto = {
    nombre: "",
    categoria: CATEGORIAS_BASE[0],
    precio: 0,
    stock: 0,
    imagen: "",
    descripcion: "",
    marca: "Genérico",
    especificaciones: [],
};

function Productos() {
    const { token } = useAuth();
    const [productos, setProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("Todas");
    const [estado, setEstado] = useState<FiltroEstado>("todos");

    // Categorías y Marcas dinámicas
    const [customCategorias, setCustomCategorias] = useState<string[]>(() => obtenerGuardadas(STORAGE_CAT_KEY));
    const [customMarcas, setCustomMarcas] = useState<string[]>(() => obtenerGuardadas(STORAGE_MARCA_KEY));

    const [esCategoriaNueva, setEsCategoriaNueva] = useState(false);
    const [nombreCategoriaNueva, setNombreCategoriaNueva] = useState("");
    const [esMarcaNueva, setEsMarcaNueva] = useState(false);
    const [nombreMarcaNueva, setNombreMarcaNueva] = useState("");

    const [formId, setFormId] = useState<number | null | undefined>(undefined);
    const [form, setForm] = useState<DatosProducto>(VACIO);
    const [precioTexto, setPrecioTexto] = useState("");
    const [stockTexto, setStockTexto] = useState("0");
    const [costoInicialTexto, setCostoInicialTexto] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [preview, setPreview] = useState("");
    const [errorModal, setErrorModal] = useState<string | null>(null);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    // Pop up de Confirmación de Registro Exitoso
    const [popupExito, setPopupExito] = useState<{
        visible: boolean;
        titulo: string;
        mensaje: string;
        imagen?: string;
    } | null>(null);

    const listaCategoriasDisponibles = useMemo(() => {
        return [...CATEGORIAS_BASE, ...customCategorias.filter((c) => !CATEGORIAS_BASE.includes(c))];
    }, [customCategorias]);

    const listaMarcasDisponibles = useMemo(() => {
        return [...MARCAS_BASE, ...customMarcas.filter((m) => !MARCAS_BASE.includes(m))];
    }, [customMarcas]);

    const refrescar = async (p: number = pagina) => {
        if (!token) return;
        try {
            const res = await listarProductosPaginado(token, p, REGISTROS_POR_PAGINA, categoria, busqueda);
            setProductos(res.contenido);
            setTotalPaginas(res.totalPaginas);
            setTotalRegistros(res.totalElementos);
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
        listarProductosPaginado(token, pagina, REGISTROS_POR_PAGINA, categoria, busqueda)
            .then((res) => {
                if (activo) {
                    setProductos(res.contenido);
                    setTotalPaginas(res.totalPaginas);
                    setTotalRegistros(res.totalElementos);
                }
            })
            .catch(() => { if (activo) setProductos([]); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token, pagina, categoria, busqueda]);

    const visibles = productos.filter((p) => {
        if (estado === "disponible" && !(p.activo && p.stock >= 10)) return false;
        if (estado === "bajo" && !(p.activo && p.stock > 0 && p.stock < 10)) return false;
        if (estado === "sin" && !(p.activo && p.stock === 0)) return false;
        if (estado === "inactivo" && p.activo) return false;
        return true;
    });

    useEffect(() => {
        setPagina(1);
    }, [busqueda, categoria, estado]);

    const abrirNuevo = () => {
        setFormId(null);
        setForm({
            ...VACIO,
            categoria: CATEGORIAS_BASE[0],
            marca: MARCAS_BASE[0],
            especificaciones: generarEspecificacionesPorDefecto(CATEGORIAS_BASE[0]),
        });
        setEsCategoriaNueva(false);
        setNombreCategoriaNueva("");
        setEsMarcaNueva(false);
        setNombreMarcaNueva("");
        setPrecioTexto("");
        setStockTexto("0");
        setCostoInicialTexto("");
        setArchivo(null);
        setPreview("");
        setErrorModal(null);
    };

    const abrirEditar = (p: ProductoInv) => {
        setFormId(p.id);
        const catExiste = listaCategoriasDisponibles.includes(p.categoria);
        const marcaExiste = listaMarcasDisponibles.includes(p.marca || "");

        setEsCategoriaNueva(!catExiste);
        setNombreCategoriaNueva(!catExiste ? p.categoria : "");
        setEsMarcaNueva(!marcaExiste && !!p.marca);
        setNombreMarcaNueva(!marcaExiste && p.marca ? p.marca : "");

        setForm({
            nombre: p.nombre,
            categoria: p.categoria,
            precio: p.precio,
            stock: p.stock,
            imagen: p.imagen,
            descripcion: p.descripcion,
            marca: p.marca || "Genérico",
            especificaciones: (p.especificaciones ?? []).map((e) => ({ ...e })),
        });
        setPrecioTexto(String(p.precio));
        setStockTexto(String(p.stock));
        setCostoInicialTexto(p.costoUnitarioInicial != null ? String(p.costoUnitarioInicial) : "");
        setArchivo(null);
        setPreview(p.imagen || "");
        setErrorModal(null);
    };

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setErrorModal(null);

        const nombreLimpio = form.nombre.trim();
        const categoriaFinal = (esCategoriaNueva ? nombreCategoriaNueva : form.categoria).trim();
        const marcaFinal = (esMarcaNueva ? nombreMarcaNueva : form.marca || "Genérico").trim();
        const precioNum = parsearNumeroSeguro(precioTexto);
        const stockNum = parsearNumeroSeguro(stockTexto);
        const costoInicialNum = costoInicialTexto.trim()
            ? parsearNumeroSeguro(costoInicialTexto)
            : undefined;

        if (nombreLimpio.length < 2) {
            setErrorModal("Ingresa un nombre válido para el producto (mínimo 2 caracteres).");
            return;
        }
        if (!categoriaFinal) {
            setErrorModal("Por favor especifica una categoría válida.");
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
        if (formId === null && stockNum > 0 && (costoInicialNum === undefined || !Number.isFinite(costoInicialNum) || costoInicialNum <= 0)) {
            setErrorModal("Ingresa un costo unitario inicial mayor a cero cuando exista stock.");
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

            if (esCategoriaNueva && categoriaFinal) {
                const actualizadas = guardarPersonalizada(STORAGE_CAT_KEY, categoriaFinal);
                setCustomCategorias(actualizadas);
            }
            if (esMarcaNueva && marcaFinal) {
                const actualizadas = guardarPersonalizada(STORAGE_MARCA_KEY, marcaFinal);
                setCustomMarcas(actualizadas);
            }

            const payload = {
                nombre: nombreLimpio,
                categoria: categoriaFinal,
                precio: precioNum,
                stock: formId === null ? Math.trunc(stockNum) : undefined,
                imagen: imagenFinal,
                descripcion: form.descripcion.trim(),
                marca: marcaFinal,
                especificaciones: form.especificaciones ?? [],
                costoUnitarioInicial: formId === null ? costoInicialNum : undefined,
            };

            if (formId === null) {
                await crearProducto(token, { ...payload, stock: Math.trunc(stockNum) });
                setPopupExito({
                    visible: true,
                    titulo: "¡Producto Registrado con Éxito!",
                    mensaje: `El producto "${nombreLimpio}" fue agregado correctamente con su ficha técnica e imagen.`,
                    imagen: imagenFinal,
                });
            } else if (formId !== undefined) {
                await actualizarProducto(token, formId, {
                    ...payload,
                    activo: editando?.activo ?? true,
                });
                setPopupExito({
                    visible: true,
                    titulo: "¡Producto Actualizado!",
                    mensaje: `Los cambios en "${nombreLimpio}" se guardaron correctamente.`,
                    imagen: imagenFinal,
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
                    className="w-full sm:flex-1 sm:min-w-[200px] px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <select className={`${selectClass} w-full sm:w-auto`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    <option>Todas</option>
                    {listaCategoriasDisponibles.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <select className={`${selectClass} w-full sm:w-auto`} value={estado} onChange={(e) => setEstado(e.target.value as FiltroEstado)}>
                    <option value="todos">Todos los estados</option>
                    <option value="disponible">Disponible</option>
                    <option value="bajo">Stock bajo</option>
                    <option value="sin">Sin stock</option>
                    <option value="inactivo">Inactivos</option>
                </select>
                <button
                    className="w-full sm:w-auto sm:ml-auto px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
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
                            <th>Marca</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.map((p) => (
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
                                <td className="text-xs text-slate-500">{p.marca || "Genérico"}</td>
                                <td className="font-mono font-bold text-xs">S/ {formatoImporte(p.precio)}</td>
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
                {visibles.length === 0 && (
                    <div className="text-center py-10 text-sm text-slate-500">
                        {cargando ? "Cargando productos…" : "Sin productos para los filtros seleccionados."}
                    </div>
                )}
            </div>

            {/* Paginación */}
            <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} totalRegistros={totalRegistros} onCambiar={setPagina} />

            {/* Modal nuevo / editar (Protegido contra clics fuera) */}
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
                                <label className="text-xs font-semibold text-slate-500">Nombre del producto *</label>
                                <input
                                    className={inputClass}
                                    placeholder="ej: Laptop Asus ZenBook 14"
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Categoría dinámica */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Categoría *</label>
                                    <select
                                        className={selectClass + " w-full"}
                                        value={esCategoriaNueva ? "__OTRA__" : form.categoria}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "__OTRA__") {
                                                setEsCategoriaNueva(true);
                                            } else {
                                                setEsCategoriaNueva(false);
                                                setForm((prev) => ({
                                                    ...prev,
                                                    categoria: val,
                                                    especificaciones: formId === null ? generarEspecificacionesPorDefecto(val) : prev.especificaciones,
                                                }));
                                            }
                                        }}
                                    >
                                        {listaCategoriasDisponibles.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                        <option value="__OTRA__">+ Otra categoría...</option>
                                    </select>
                                    {esCategoriaNueva && (
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Nombre nueva categoría..."
                                            value={nombreCategoriaNueva}
                                            onChange={(e) => setNombreCategoriaNueva(e.target.value)}
                                            className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-white focus:outline-none"
                                        />
                                    )}
                                </div>

                                {/* Marca dinámica */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Marca *</label>
                                    <select
                                        className={selectClass + " w-full"}
                                        value={esMarcaNueva ? "__OTRA__" : form.marca}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "__OTRA__") {
                                                setEsMarcaNueva(true);
                                            } else {
                                                setEsMarcaNueva(false);
                                                setForm({ ...form, marca: val });
                                            }
                                        }}
                                    >
                                        {listaMarcasDisponibles.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                        <option value="__OTRA__">+ Otra marca...</option>
                                    </select>
                                    {esMarcaNueva && (
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Nombre nueva marca..."
                                            value={nombreMarcaNueva}
                                            onChange={(e) => setNombreMarcaNueva(e.target.value)}
                                            className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-white focus:outline-none"
                                        />
                                    )}
                                </div>

                                {/* Unidad de Medida (Exclusivamente NIU) */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Unidad de Medida</label>
                                    <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                                        <span>NIU - Unidad</span>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">1 u.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Precio Venta (S/) *</label>
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
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Stock {formId === null ? "inicial" : "actual"} *</label>
                                    <input
                                        className={inputClass}
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        readOnly={formId !== null}
                                        value={stockTexto}
                                        onChange={(e) => setStockTexto(limpiarEnteroNoNegativo(e.target.value))}
                                        required
                                        disabled={formId !== null}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Costo unitario inicial (S/)</label>
                                    <input
                                        className={inputClass}
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        readOnly={formId !== null}
                                        value={costoInicialTexto}
                                        onChange={(e) => setCostoInicialTexto(limpiarDecimal(e.target.value))}
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        No es el precio de venta; valoriza el inventario inicial en el Kardex.
                                    </p>
                                </div>
                            </div>

                            {/* Carga de Imagen a Cloudinary */}
                            <div className="space-y-1.5 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Imagen del Producto (Carga a Cloudinary)
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3 items-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] ?? null;
                                            setArchivo(f);
                                            setPreview(f ? URL.createObjectURL(f) : "");
                                        }}
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                                        disabled={subiendo}
                                    />
                                    {subiendo && (
                                        <span className="text-xs text-emerald-600 font-bold animate-pulse shrink-0">
                                            Subiendo a Cloudinary...
                                        </span>
                                    )}
                                </div>

                                {preview && (
                                    <div className="mt-2 flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <img
                                            src={preview}
                                            alt="Vista previa"
                                            className="w-16 h-16 object-contain rounded-md bg-slate-50 dark:bg-slate-900 border"
                                        />
                                        <div className="text-xs min-w-0 flex-1">
                                            <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">
                                                {archivo ? archivo.name : "Imagen del producto"}
                                            </span>
                                            <span className="text-[11px] text-emerald-600 font-medium">
                                                ✓ Lista para subida y almacenamiento
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setArchivo(null);
                                                setPreview("");
                                                setForm({ ...form, imagen: "" });
                                            }}
                                            className="text-xs text-red-500 hover:underline cursor-pointer"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Descripción</label>
                                <textarea
                                    className={inputClass}
                                    rows={2}
                                    placeholder="Descripción general del producto..."
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                />
                            </div>

                            {/* Ficha técnica estandarizada */}
                            <EditorEspecificaciones
                                categoria={esCategoriaNueva ? nombreCategoriaNueva : form.categoria}
                                especificaciones={form.especificaciones ?? []}
                                onChange={(nuevas) => setForm({ ...form, especificaciones: nuevas })}
                            />

                            {errorModal && (
                                <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
                                    {errorModal}
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <button type="button" className="btn-mini sec" onClick={() => setFormId(undefined)}>
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando || subiendo}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-60"
                                >
                                    {guardando || subiendo ? "Guardando en Cloudinary..." : formId === null ? "Crear producto" : "Guardar cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pop up Modal de Confirmación de Éxito al Registrar / Actualizar */}
            {popupExito && popupExito.visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
                            ✓
                        </div>

                        {popupExito.imagen && (
                            <div className="w-20 h-20 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border">
                                <img src={popupExito.imagen} alt="Producto" className="w-full h-full object-contain" />
                            </div>
                        )}

                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                {popupExito.titulo}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {popupExito.mensaje}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setPopupExito(null)}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Productos;
