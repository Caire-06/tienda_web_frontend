import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarProductos,
    crearProducto,
    actualizarProducto,
    darDeBajaLogicaProducto,
} from "../../../services/productosApi";
import type { ProductoInv } from "../../../context/InventarioContext";
import { ImagenProducto } from "../../../components/ImagenProducto/ImagenProducto";
import {
    limpiarDecimal,
    limpiarEnteroNoNegativo,
    parsearNumeroSeguro,
} from "../../../utils/validaciones";

const CATALOGO_CATEGORIAS = [
    { id: 1, nombre: "Computadoras", codigo: "CAT-01" },
    { id: 2, nombre: "Smartphones", codigo: "CAT-02" },
    { id: 3, nombre: "Audio", codigo: "CAT-03" },
    { id: 4, nombre: "Periféricos", codigo: "CAT-04" },
    { id: 5, nombre: "Accesorios", codigo: "CAT-05" },
    { id: 6, nombre: "Monitores", codigo: "CAT-06" },
    { id: 7, nombre: "Laptops", codigo: "CAT-07" },
    { id: 8, nombre: "Componentes", codigo: "CAT-08" },
];

const CATALOGO_MARCAS = [
    { id: 1, nombre: "Apple" },
    { id: 2, nombre: "Samsung" },
    { id: 3, nombre: "Sony" },
    { id: 4, nombre: "Logitech" },
    { id: 5, nombre: "Xiaomi" },
    { id: 6, nombre: "Lenovo" },
    { id: 7, nombre: "Redragon" },
    { id: 8, nombre: "JBL" },
];

const CATALOGO_UNIDADES = [
    { id: 1, codigo: "NIU", descripcion: "Unidad (Bienes)" },
    { id: 2, codigo: "BX", descripcion: "Caja" },
    { id: 3, codigo: "SET", descripcion: "Juego / Kit" },
];

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
}

function Productos() {
    const { token } = useAuth();
    const [productos, setProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("Todas");
    const [filtroEstado, setFiltroEstado] = useState("Todos");

    // Modal Crear / Editar
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [precioTexto, setPrecioTexto] = useState("");
    const [stockTexto, setStockTexto] = useState("0");
    const [errorModal, setErrorModal] = useState<string | null>(null);

    const [form, setForm] = useState<FormProductoState>({
        nombre: "",
        categoria: CATALOGO_CATEGORIAS[0].nombre,
        marca: CATALOGO_MARCAS[0].nombre,
        unidadMedida: CATALOGO_UNIDADES[0].codigo,
        precio: 0,
        stock: 0,
        imagen: "",
        descripcion: "",
    });

    const cargar = async () => {
        if (!token) return;
        setCargando(true);
        setError(null);
        try {
            const data = await listarProductos(token);
            setProductos(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar productos");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [token]);

    const abrirCrear = () => {
        setModoEdicion(false);
        setForm({
            nombre: "",
            categoria: CATALOGO_CATEGORIAS[0].nombre,
            marca: CATALOGO_MARCAS[0].nombre,
            unidadMedida: CATALOGO_UNIDADES[0].codigo,
            precio: 0,
            stock: 0,
            imagen: "",
            descripcion: "",
        });
        setPrecioTexto("");
        setStockTexto("0");
        setErrorModal(null);
        setModalAbierto(true);
    };

    const abrirEditar = (p: ProductoInv) => {
        setModoEdicion(true);
        setForm({
            id: p.id,
            nombre: p.nombre,
            categoria: p.categoria || CATALOGO_CATEGORIAS[0].nombre,
            marca: CATALOGO_MARCAS[0].nombre,
            unidadMedida: CATALOGO_UNIDADES[0].codigo,
            precio: p.precio,
            stock: p.stock,
            imagen: p.imagen || "",
            descripcion: p.descripcion || "",
        });
        setPrecioTexto(String(p.precio));
        setStockTexto(String(p.stock));
        setErrorModal(null);
        setModalAbierto(true);
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setErrorModal(null);
        const nombreLimpio = form.nombre.trim();
        const precioNum = parsearNumeroSeguro(precioTexto);
        const stockNum = parsearNumeroSeguro(stockTexto);
        const imagenLimpia = form.imagen.trim();

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
        if (imagenLimpia && !/^https?:\/\/.+|^\/.+/i.test(imagenLimpia)) {
            setErrorModal("La URL de imagen debe iniciar con http://, https:// o /.");
            return;
        }

        setGuardando(true);
        try {
            if (modoEdicion && form.id) {
                const actualizado = await actualizarProducto(token, form.id, {
                    nombre: nombreLimpio,
                    categoria: form.categoria,
                    precio: precioNum,
                    stock: Math.trunc(stockNum),
                    imagen: imagenLimpia,
                    descripcion: form.descripcion.trim(),
                });
                setProductos((prev) => prev.map((item) => (item.id === form.id ? actualizado : item)));
                alert("Producto actualizado exitosamente.");
            } else {
                const creado = await crearProducto(token, {
                    nombre: nombreLimpio,
                    categoria: form.categoria,
                    precio: precioNum,
                    stock: Math.trunc(stockNum),
                    imagen: imagenLimpia,
                    descripcion: form.descripcion.trim(),
                });
                setProductos((prev) => [creado, ...prev]);
                alert("Producto registrado exitosamente.");
            }
            setModalAbierto(false);
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
        } catch (err: any) {
            alert(err.message || "No se pudo dar de baja al producto");
        }
    };

    const estadoDe = (stock: number, activo: boolean) =>
        !activo ? "Inactivo" : stock === 0 ? "Sin stock" : stock < 10 ? "Stock bajo" : "Disponible";

    const filtrados = productos.filter((p) => {
        if (filtroCategoria !== "Todas" && p.categoria !== filtroCategoria) return false;
        if (filtroEstado !== "Todos" && estadoDe(p.stock, p.activo) !== filtroEstado) return false;
        const q = busqueda.trim().toLowerCase();
        if (q && !p.nombre.toLowerCase().includes(q)) return false;
        return true;
    });

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
                        Control general de catálogo: inventario físico, precios, categorías y disponibilidad.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={cargar}
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
                <select className={`${selectClass} w-full sm:w-auto`} value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                    <option value="Todas">Todas las Categorías</option>
                    {CATALOGO_CATEGORIAS.map((c) => (
                        <option key={c.codigo} value={c.nombre}>{c.nombre}</option>
                    ))}
                </select>
                <select className={`${selectClass} w-full sm:w-auto`} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                    <option value="Todos">Todos los Estados</option>
                    <option value="Disponible">Disponible</option>
                    <option value="Stock bajo">Stock bajo (&lt;10)</option>
                    <option value="Sin stock">Sin stock (0)</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>

            {/* Tabla de Productos */}
            <div className="tabla-wrap">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Precio Unitario</th>
                            <th>Stock Físico</th>
                            <th>Vendidos</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-sm text-slate-500">
                                    Cargando catálogo...
                                </td>
                            </tr>
                        ) : filtrados.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-sm text-slate-500">
                                    No se encontraron productos coincidentes.
                                </td>
                            </tr>
                        ) : (
                            filtrados.map((p) => {
                                const est = estadoDe(p.stock, p.activo);
                                const badgeClass =
                                    est === "Disponible" ? "ok" : est === "Stock bajo" ? "pend" : "off";
                                return (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <ImagenProducto
                                                    src={p.imagen}
                                                    alt={p.nombre}
                                                    compact
                                                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                                />
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                                        {p.nombre}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 line-clamp-1">
                                                        {p.descripcion || "Sin descripción"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge font-medium">{p.categoria}</span>
                                        </td>
                                        <td className="font-mono font-bold text-slate-900 dark:text-white">
                                            S/ {Number(p.precio).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="font-mono">
                                            <span className={p.stock < 10 ? "text-rose-600 font-bold" : "font-medium"}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="font-mono text-slate-500">{p.vendidos}</td>
                                        <td>
                                            <span className={`badge ${badgeClass}`}>{est}</span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => abrirEditar(p)}
                                                    className="btn-mini"
                                                    title="Editar producto"
                                                >
                                                    Editar
                                                </button>
                                                {p.activo && (
                                                    <button
                                                        onClick={() => handleBajaLogica(p)}
                                                        className="btn-mini text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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

            {/* Modal CRUD: Crear o Editar Producto */}
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
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="ej: Laptop Asus ZenBook 14"
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Categoría *
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                        value={form.categoria}
                                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                                    >
                                        {CATALOGO_CATEGORIAS.map((c) => (
                                            <option key={c.codigo} value={c.nombre}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Marca *
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                        value={form.marca}
                                        onChange={(e) => setForm({ ...form, marca: e.target.value })}
                                    >
                                        {CATALOGO_MARCAS.map((m) => (
                                            <option key={m.id} value={m.nombre}>{m.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Unidad de Medida *
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                        value={form.unidadMedida}
                                        onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })}
                                    >
                                        {CATALOGO_UNIDADES.map((u) => (
                                            <option key={u.codigo} value={u.codigo}>{u.codigo} - {u.descripcion}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                        value={stockTexto}
                                        onChange={(e) => setStockTexto(limpiarEnteroNoNegativo(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    URL de Imagen
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                    placeholder="https://... (opcional)"
                                    value={form.imagen}
                                    onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Descripción Técnica
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="Especificaciones del producto..."
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                />
                            </div>

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
                                    disabled={guardando}
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {guardando ? "Guardando..." : modoEdicion ? "Guardar Cambios" : "Crear Producto"}
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
