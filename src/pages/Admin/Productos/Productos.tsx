import { formatoImporte } from "../../../utils/formatoImporte";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarProductosPaginado,
    crearProducto,
    actualizarProducto,
    darDeBajaLogicaProducto,
    subirImagen,
} from "../../../services/productosApi";
import type { ProductoInv, EspecificacionInv } from "../../../context/InventarioContext";
import { Paginacion, REGISTROS_POR_PAGINA } from "../../../components/Paginacion/Paginacion";
import { EditorEspecificaciones } from "../../../components/EditorEspecificaciones/EditorEspecificaciones";
import { generarEspecificacionesPorDefecto } from "../../../data/plantillasEspecificaciones";
import {
    limpiarDecimal,
    limpiarEnteroNoNegativo,
    parsearNumeroSeguro,
} from "../../../utils/validaciones";

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

interface FormProductoState {
    id?: number;
    nombre: string;
    categoria: string;
    marca: string;
    unidadMedida: string;
    precio: number;
    stock: number;
    imagen: string;
    descripcion: string;
    especificaciones: EspecificacionInv[];
}

function Productos() {
    const { token } = useAuth();
    const [productos, setProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("Todas");
    const [filtroEstado, setFiltroEstado] = useState("Todos");

    // Categorías y Marcas dinámicas (Base + Personalizadas persistidas)
    const [customCategorias, setCustomCategorias] = useState<string[]>(() => obtenerGuardadas(STORAGE_CAT_KEY));
    const [customMarcas, setCustomMarcas] = useState<string[]>(() => obtenerGuardadas(STORAGE_MARCA_KEY));

    // Inputs para cuando se elige "Otra (Personalizada)"
    const [esCategoriaNueva, setEsCategoriaNueva] = useState(false);
    const [nombreCategoriaNueva, setNombreCategoriaNueva] = useState("");
    const [esMarcaNueva, setEsMarcaNueva] = useState(false);
    const [nombreMarcaNueva, setNombreMarcaNueva] = useState("");

    // Manejo de imagen con Cloudinary
    const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
    const [previewImagen, setPreviewImagen] = useState<string>("");
    const [subiendoImagen, setSubiendoImagen] = useState(false);

    // Modal Crear / Editar
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [precioTexto, setPrecioTexto] = useState("");
    const [stockTexto, setStockTexto] = useState("0");
    const [costoInicialTexto, setCostoInicialTexto] = useState("");
    const [errorModal, setErrorModal] = useState<string | null>(null);

    // Pop up de Confirmación de Registro Exitoso
    const [popupExito, setPopupExito] = useState<{
        visible: boolean;
        titulo: string;
        mensaje: string;
        imagen?: string;
    } | null>(null);

    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    const listaCategoriasDisponibles = useMemo(() => {
        const todas = [...CATEGORIAS_BASE, ...customCategorias.filter((c) => !CATEGORIAS_BASE.includes(c))];
        return todas;
    }, [customCategorias]);

    const listaMarcasDisponibles = useMemo(() => {
        const todas = [...MARCAS_BASE, ...customMarcas.filter((m) => !MARCAS_BASE.includes(m))];
        return todas;
    }, [customMarcas]);

    const [form, setForm] = useState<FormProductoState>({
        nombre: "",
        categoria: CATEGORIAS_BASE[0],
        marca: MARCAS_BASE[0],
        unidadMedida: "NIU",
        precio: 0,
        stock: 0,
        imagen: "",
        descripcion: "",
        especificaciones: [],
    });

    const cargar = async (p: number = pagina) => {
        if (!token) return;
        setCargando(true);
        setError(null);
        try {
            const res = await listarProductosPaginado(token, p, REGISTROS_POR_PAGINA, filtroCategoria, busqueda);
            setProductos(res.contenido);
            setTotalPaginas(res.totalPaginas);
            setTotalRegistros(res.totalElementos);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al cargar productos");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar(pagina);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, pagina, filtroCategoria, busqueda]);

    const abrirCrear = () => {
        setModoEdicion(false);
        const catInicial = listaCategoriasDisponibles[0] || "Laptops";
        setForm({
            nombre: "",
            categoria: catInicial,
            marca: listaMarcasDisponibles[0] || "Apple",
            unidadMedida: "NIU",
            precio: 0,
            stock: 0,
            imagen: "",
            descripcion: "",
            especificaciones: generarEspecificacionesPorDefecto(catInicial),
        });
        setEsCategoriaNueva(false);
        setNombreCategoriaNueva("");
        setEsMarcaNueva(false);
        setNombreMarcaNueva("");
        setArchivoImagen(null);
        setPreviewImagen("");
        setPrecioTexto("");
        setStockTexto("0");
        setCostoInicialTexto("");
        setErrorModal(null);
        setModalAbierto(true);
    };

    const abrirEditar = (p: ProductoInv) => {
        setModoEdicion(true);
        const cat = p.categoria || "Laptops";
        const marc = p.marca || "Genérico";

        // Si la categoría o marca no están en la lista base, registrarlas
        if (!listaCategoriasDisponibles.includes(cat)) {
            const actualizadas = guardarPersonalizada(STORAGE_CAT_KEY, cat);
            setCustomCategorias(actualizadas);
        }
        if (!listaMarcasDisponibles.includes(marc)) {
            const actualizadas = guardarPersonalizada(STORAGE_MARCA_KEY, marc);
            setCustomMarcas(actualizadas);
        }

        setForm({
            id: p.id,
            nombre: p.nombre,
            categoria: cat,
            marca: marc,
            unidadMedida: "NIU",
            precio: p.precio,
            stock: p.stock,
            imagen: p.imagen || "",
            descripcion: p.descripcion || "",
            especificaciones: (p.especificaciones ?? []).map((e) => ({ ...e })),
        });
        setEsCategoriaNueva(false);
        setNombreCategoriaNueva("");
        setEsMarcaNueva(false);
        setNombreMarcaNueva("");
        setArchivoImagen(null);
        setPreviewImagen(p.imagen || "");
        setPrecioTexto(String(p.precio));
        setStockTexto(String(p.stock));
        setCostoInicialTexto(p.costoUnitarioInicial != null ? String(p.costoUnitarioInicial) : "");
        setErrorModal(null);
        setModalAbierto(true);
    };

    // Selección de archivo y previsualización inmediata
    const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setArchivoImagen(file);
            setPreviewImagen(URL.createObjectURL(file));
        }
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setErrorModal(null);

        const nombreLimpio = form.nombre.trim();
        const precioNum = parsearNumeroSeguro(precioTexto);
        const stockNum = parsearNumeroSeguro(stockTexto);
        const costoInicialNum = costoInicialTexto.trim()
            ? parsearNumeroSeguro(costoInicialTexto)
            : undefined;

        // Resolver categoría final (si eligió crear una nueva)
        let categoriaFinal = form.categoria;
        if (esCategoriaNueva) {
            const limpiaCat = nombreCategoriaNueva.trim();
            if (!limpiaCat) {
                setErrorModal("Ingresa el nombre de la nueva categoría.");
                return;
            }
            const formateada = limpiaCat.charAt(0).toUpperCase() + limpiaCat.slice(1);
            categoriaFinal = formateada;
            const actualizadas = guardarPersonalizada(STORAGE_CAT_KEY, formateada);
            setCustomCategorias(actualizadas);
        }

        // Resolver marca final (si eligió crear una nueva)
        let marcaFinal = form.marca;
        if (esMarcaNueva) {
            const limpiaMarca = nombreMarcaNueva.trim();
            if (!limpiaMarca) {
                setErrorModal("Ingresa el nombre de la nueva marca.");
                return;
            }
            const formateada = limpiaMarca.charAt(0).toUpperCase() + limpiaMarca.slice(1);
            marcaFinal = formateada;
            const actualizadas = guardarPersonalizada(STORAGE_MARCA_KEY, formateada);
            setCustomMarcas(actualizadas);
        }

        if (nombreLimpio.length < 2) {
            setErrorModal("El nombre del producto debe tener al menos 2 caracteres.");
            return;
        }
        if (precioNum <= 0) {
            setErrorModal("Ingresa un precio de venta válido mayor a S/ 0.00.");
            return;
        }
        if (stockNum < 0) {
            setErrorModal("El stock físico no puede ser negativo.");
            return;
        }
        if (!modoEdicion && stockNum > 0 && (costoInicialNum === undefined || !Number.isFinite(costoInicialNum) || costoInicialNum <= 0)) {
            setErrorModal("Ingresa un costo unitario inicial mayor a cero cuando exista stock.");
            return;
        }

        setGuardando(true);
        try {
            // 1. Si se seleccionó un archivo de imagen, subirlo a Cloudinary primero
            let urlImagenFinal = form.imagen.trim();
            if (archivoImagen) {
                setSubiendoImagen(true);
                try {
                    const resCloudinary = await subirImagen(token, archivoImagen);
                    if (resCloudinary.url) {
                        urlImagenFinal = resCloudinary.url;
                    }
                } catch (cloudErr) {
                    throw new Error(
                        cloudErr instanceof Error
                            ? `Error al subir imagen a Cloudinary: ${cloudErr.message}`
                            : "Error al subir imagen a Cloudinary."
                    );
                } finally {
                    setSubiendoImagen(false);
                }
            }

            // 2. Guardar o actualizar producto
            if (modoEdicion && form.id) {
                const actualizado = await actualizarProducto(token, form.id, {
                    nombre: nombreLimpio,
                    categoria: categoriaFinal,
                    precio: precioNum,
                    imagen: urlImagenFinal,
                    descripcion: form.descripcion.trim(),
                    marca: marcaFinal,
                    especificaciones: form.especificaciones,
                });
                setProductos((prev) => prev.map((item) => (item.id === form.id ? actualizado : item)));
                setModalAbierto(false);
                setPopupExito({
                    visible: true,
                    titulo: "¡Producto Actualizado!",
                    mensaje: `"${nombreLimpio}" se actualizó correctamente en el catálogo.`,
                    imagen: urlImagenFinal || undefined,
                });
            } else {
                const creado = await crearProducto(token, {
                    nombre: nombreLimpio,
                    categoria: categoriaFinal,
                    precio: precioNum,
                    stock: Math.trunc(stockNum),
                    imagen: urlImagenFinal,
                    descripcion: form.descripcion.trim(),
                    marca: marcaFinal,
                    especificaciones: form.especificaciones,
                    costoUnitarioInicial: costoInicialNum,
                });
                setProductos((prev) => [creado, ...prev]);
                setModalAbierto(false);
                setPopupExito({
                    visible: true,
                    titulo: "¡Producto Registrado con Éxito!",
                    mensaje: `"${nombreLimpio}" ha sido registrado en el catálogo de TechStore.`,
                    imagen: urlImagenFinal || undefined,
                });
            }
        } catch (err: unknown) {
            setErrorModal(err instanceof Error ? err.message : "Error al procesar el producto.");
        } finally {
            setGuardando(false);
        }
    };

    const handleBajaLogica = async (p: ProductoInv) => {
        if (!token) return;
        if (!window.confirm(`¿Confirmar baja para el producto "${p.nombre}"?`)) return;
        try {
            const actualizado = await darDeBajaLogicaProducto(token, p.id);
            setProductos((prev) => prev.map((item) => (item.id === p.id ? actualizado : item)));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "No se pudo dar de baja al producto");
        }
    };

    const estadoDe = (stock: number, activo: boolean) =>
        !activo ? "Inactivo" : stock === 0 ? "Sin stock" : stock < 10 ? "Stock bajo" : "Disponible";

    const visibles = productos.filter((p) => {
        if (filtroEstado !== "Todos" && estadoDe(p.stock, p.activo) !== filtroEstado) return false;
        return true;
    });

    useEffect(() => {
        setPagina(1);
    }, [busqueda, filtroCategoria, filtroEstado]);

    const selectClass =
        "px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        Catálogo de Productos
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Control general de catálogo: inventario físico, precios, marcas, Cloudinary y especificaciones 3FN.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => cargar()}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                    >
                        ↻ Actualizar
                    </button>
                    <button
                        onClick={abrirCrear}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> Nuevo Producto
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Barra de Filtros */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-wrap gap-3 items-center shadow-xs">
                <input
                    className="w-full sm:flex-1 sm:min-w-[200px] px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Buscar producto por nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <select
                    className={`${selectClass} w-full sm:w-auto`}
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                    <option value="Todas">Todas las Categorías</option>
                    {listaCategoriasDisponibles.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <select
                    className={`${selectClass} w-full sm:w-auto`}
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                >
                    <option value="Todos">Todos los Estados</option>
                    <option value="Disponible">Disponible</option>
                    <option value="Stock bajo">Stock bajo (&lt;10)</option>
                    <option value="Sin stock">Sin stock (0)</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>

            {/* Tabla de Productos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                            <th className="p-3.5">Producto</th>
                            <th className="p-3.5">Categoría</th>
                            <th className="p-3.5">Marca</th>
                            <th className="p-3.5">Precio</th>
                            <th className="p-3.5">Stock</th>
                            <th className="p-3.5">Estado</th>
                            <th className="p-3.5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cargando ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400">
                                    Cargando catálogo...
                                </td>
                            </tr>
                        ) : visibles.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400">
                                    No se encontraron productos.
                                </td>
                            </tr>
                        ) : (
                            visibles.map((p) => {
                                const estado = estadoDe(p.stock, p.activo);
                                return (
                                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                                                    {p.imagen ? (
                                                        <img src={p.imagen} alt={p.nombre} className="h-full w-full object-contain" />
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">Sin foto</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-semibold text-slate-900 dark:text-white block truncate">
                                                        {p.nombre}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">ID #{p.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">{p.categoria}</td>
                                        <td className="p-3.5 text-slate-500">{p.marca || "Genérico"}</td>
                                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                                            S/ {formatoImporte(p.precio)}
                                        </td>
                                        <td className="p-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                                            {p.stock}
                                        </td>
                                        <td className="p-3.5">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    estado === "Disponible"
                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                                                        : estado === "Stock bajo"
                                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                                                        : estado === "Sin stock"
                                                        ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400"
                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                }`}
                                            >
                                                {estado}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => abrirEditar(p)}
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                                                >
                                                    Editar
                                                </button>
                                                {p.activo && (
                                                    <button
                                                        onClick={() => handleBajaLogica(p)}
                                                        className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-red-200 dark:border-red-900/50 hover:bg-red-50 text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                                                        title="Dar de baja"
                                                    >
                                                        Baja
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} totalRegistros={totalRegistros} onCambiar={setPagina} />

            {/* Modal CRUD: Crear o Editar Producto (Protegido contra clics accidentales fuera) */}
            {modalAbierto && (
                <div className="modal-fondo">
                    <div className="modal-mediano max-w-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>{modoEdicion ? "Editar Producto" : "+ Nuevo Producto"}</h2>
                            <button className="modal-cerrar" onClick={() => setModalAbierto(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleGuardar} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Nombre del Producto *
                                </label>
                                <input
                                    required
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="ej: Laptop Asus ZenBook 14"
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Categoría con opción de añadir otra */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Categoría *
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
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
                                                    especificaciones: !modoEdicion ? generarEspecificacionesPorDefecto(val) : prev.especificaciones,
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
                                            className="mt-1.5 w-full px-2.5 py-1.5 text-xs rounded-lg border border-blue-400 bg-blue-50/40 dark:bg-blue-950/30 text-slate-900 dark:text-white focus:outline-none"
                                        />
                                    )}
                                </div>

                                {/* Marca con opción de añadir otra */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Marca *
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
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
                                            className="mt-1.5 w-full px-2.5 py-1.5 text-xs rounded-lg border border-blue-400 bg-blue-50/40 dark:bg-blue-950/30 text-slate-900 dark:text-white focus:outline-none"
                                        />
                                    )}
                                </div>

                                {/* Unidad de Medida (Exclusivamente NIU - Unidad) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Unidad de Medida
                                    </label>
                                    <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                                        <span>NIU - Unidad (Bienes)</span>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">1 u.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Precio Venta (S/) *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        value={precioTexto}
                                        onChange={(e) => setPrecioTexto(limpiarDecimal(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Stock Físico *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        readOnly={modoEdicion}
                                        value={stockTexto}
                                        onChange={(e) => setStockTexto(limpiarEnteroNoNegativo(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Costo unitario inicial (S/)
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        readOnly={modoEdicion}
                                        value={costoInicialTexto}
                                        onChange={(e) => setCostoInicialTexto(limpiarDecimal(e.target.value))}
                                    />
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        No es el precio de venta; valoriza el inventario inicial en el Kardex.
                                    </p>
                                </div>
                            </div>

                            {/* Carga de Imagen a Cloudinary con Vista Previa */}
                            <div className="space-y-1.5 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Imagen del Producto (Carga a Cloudinary)
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3 items-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleArchivoChange}
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                    {subiendoImagen && (
                                        <span className="text-xs text-blue-600 font-bold animate-pulse shrink-0">
                                            Subiendo imagen...
                                        </span>
                                    )}
                                </div>

                                {previewImagen && (
                                    <div className="mt-2 flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <img
                                            src={previewImagen}
                                            alt="Vista previa"
                                            className="w-16 h-16 object-contain rounded-md bg-slate-50 dark:bg-slate-900 border"
                                        />
                                        <div className="text-xs min-w-0 flex-1">
                                            <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">
                                                {archivoImagen ? archivoImagen.name : "Imagen del producto"}
                                            </span>
                                            <span className="text-[11px] text-emerald-600 font-medium">
                                                ✓ Lista para subida y almacenamiento en la nube
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setArchivoImagen(null);
                                                setPreviewImagen("");
                                                setForm({ ...form, imagen: "" });
                                            }}
                                            className="text-xs text-red-500 hover:underline cursor-pointer"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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

                            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalAbierto(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando || subiendoImagen}
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {guardando || subiendoImagen ? "Procesando en Cloudinary..." : modoEdicion ? "Guardar Cambios" : "Crear Producto"}
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
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
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