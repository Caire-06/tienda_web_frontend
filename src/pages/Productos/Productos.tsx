import { useState, useMemo, useEffect } from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ProductCard from "../../components/ProductCard/ProductCard";
import { CATEGORIAS } from "../../data/productos";
import { useAuth } from "../../context/AuthContext";
import { listarProductosPaginado } from "../../services/productosApi";
import type { ProductoInv } from "../../context/InventarioContext";
import { Paginacion, REGISTROS_POR_PAGINA } from "../../components/Paginacion/Paginacion";
import { limpiarDecimal, parsearNumeroSeguro } from "../../utils/validaciones";
import {
    obtenerCamposPlantilla,
    obtenerCaracteristicasPersonalizadas,
} from "../../data/plantillasEspecificaciones";

type Orden = "relevancia" | "precio-asc" | "precio-desc" | "popular" | "stock";
type Novedades = "todos" | "recientes" | "hoy";

const FILTRO_TODOS = "Todos";

function esRegistradoHoy(fecha?: string): boolean {
    if (!fecha) return false;
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return false;
    const hoy = new Date();
    return (
        d.getFullYear() === hoy.getFullYear() &&
        d.getMonth() === hoy.getMonth() &&
        d.getDate() === hoy.getDate()
    );
}

function tiempoDe(fecha?: string): number {
    if (!fecha) return 0;
    const t = new Date(fecha).getTime();
    return Number.isNaN(t) ? 0 : t;
}

/** Formatea y normaliza los títulos de características canónicas */
function formatearTituloCaracteristica(texto: string): string {
    if (!texto) return "";
    const canonical: Record<string, string> = {
        "memoria ram": "Memoria RAM",
        "almacenamiento interno": "Almacenamiento Interno",
        "almacenamiento": "Almacenamiento",
        "capacidad de bateria": "Capacidad de Batería",
        "capacidad de batería": "Capacidad de Batería",
        "bateria": "Batería",
        "tipo y tasa de pantalla": "Tipo y Tasa de Pantalla",
        "pantalla": "Pantalla",
        "conectividad movil": "Conectividad Móvil",
        "conectividad móvil": "Conectividad Móvil",
        "potencia de carga rapida": "Potencia de Carga Rápida",
        "potencia de carga rápida": "Potencia de Carga Rápida",
        "camara": "Cámara",
        "cámara": "Cámara",
        "camara principal": "Cámara Principal",
        "camara frontal": "Cámara Frontal",
        "tipo de diseno": "Tipo de Diseño",
        "tipo de diseño": "Tipo de Diseño",
        "autonomia de bateria": "Autonomía de Batería",
        "autonomía de batería": "Autonomía de Batería",
        "cancelacion activa de ruido": "Cancelación Activa de Ruido",
        "cancelación activa de ruido": "Cancelación Activa de Ruido",
    };
    const key = texto.trim().toLowerCase();
    if (canonical[key]) return canonical[key];
    return texto
        .trim()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function Productos() {
    const { token } = useAuth();
    const [backendProductos, setBackendProductos] = useState<ProductoInv[]>([]);
    const [cargando, setCargando] = useState(true);

    const [categoria, setCategoria] = useState(FILTRO_TODOS);
    const [orden, setOrden] = useState<Orden>("relevancia");
    const [busqueda, setBusqueda] = useState("");
    const [novedades, setNovedades] = useState<Novedades>("todos");
    const [precioMinTexto, setPrecioMinTexto] = useState("");
    const [precioMaxTexto, setPrecioMaxTexto] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    // Filtros dinámicos de especificaciones por característica: { "memoria ram": ["8 GB"], ... }
    const [filtrosSpecs, setFiltrosSpecs] = useState<Record<string, string[]>>({});
    // Control de drawer móvil para pantallas pequeñas
    const [filtrosMovilAbierto, setFiltrosMovilAbierto] = useState(false);

    // Estado para minimizar/colapsar cada sección y cada especificación independientemente
    const [colapsadas, setColapsadas] = useState<Record<string, boolean>>({
        novedades: true,
    });

    const toggleColapso = (id: string) => {
        setColapsadas((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    useEffect(() => {
        let activo = true;
        setCargando(true);
        listarProductosPaginado(
            token,
            pagina,
            REGISTROS_POR_PAGINA,
            categoria !== FILTRO_TODOS ? categoria : undefined,
            busqueda
        )
            .then((res) => {
                if (activo) {
                    setBackendProductos(res.contenido);
                    setTotalPaginas(res.totalPaginas);
                    setTotalRegistros(res.totalElementos);
                }
            })
            .catch(() => { if (activo) setBackendProductos([]); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token, pagina, categoria, busqueda]);

    const productos: ProductoInv[] = backendProductos;
    const nombresCategorias = [FILTRO_TODOS, ...CATEGORIAS.map((c) => c.nombre)];

    // Limpia filtros de especificaciones al cambiar de categoría
    const seleccionarCategoria = (nuevaCat: string) => {
        setCategoria(nuevaCat);
        setFiltrosSpecs({});
        setPagina(1);
    };

    // Toggle de valor en filtro de especificación
    const toggleSpecFiltro = (caracteristicaKey: string, valor: string) => {
        const keyLower = caracteristicaKey.toLowerCase();
        setFiltrosSpecs((prev) => {
            const actuales = prev[keyLower] || [];
            const existe = actuales.some((v) => v.toLowerCase() === valor.toLowerCase());
            const actualizados = existe
                ? actuales.filter((v) => v.toLowerCase() !== valor.toLowerCase())
                : [...actuales, valor];

            const copia = { ...prev };
            if (actualizados.length === 0) {
                delete copia[keyLower];
            } else {
                copia[keyLower] = actualizados;
            }
            return copia;
        });
        setPagina(1);
    };

    // Calcula características y opciones dinámicas disponibles para la categoría activa
    const especificacionesDisponibles = useMemo(() => {
        if (categoria === FILTRO_TODOS) return [];

        const camposPlantilla = obtenerCamposPlantilla(categoria);
        const personalizadas = obtenerCaracteristicasPersonalizadas(categoria);
        const productosCat = productos.filter((p) => p.categoria === categoria);

        // Agrupar nombres únicos de características deduplicando sin importar mayúsculas
        const nombresMap = new Map<string, string>(); // lowerKey -> displayName
        const registrarNombre = (nom: string) => {
            const limpio = nom.trim();
            if (!limpio) return;
            const lower = limpio.toLowerCase();
            if (!nombresMap.has(lower)) {
                nombresMap.set(lower, formatearTituloCaracteristica(limpio));
            }
        };

        camposPlantilla.forEach((c) => registrarNombre(c.caracteristica));
        personalizadas.forEach((p) => registrarNombre(p));
        productosCat.forEach((p) => {
            p.especificaciones?.forEach((e) => {
                if (e.caracteristica?.trim()) registrarNombre(e.caracteristica.trim());
            });
        });

        const resultado: {
            claveLower: string;
            caracteristica: string;
            opciones: { valor: string; conteo: number }[];
        }[] = [];

        nombresMap.forEach((nombreDisplay, claveLower) => {
            const valoresMap = new Map<string, { display: string; conteo: number }>();

            // 1. Opciones estándar de la plantilla
            const defCampo = camposPlantilla.find(
                (c) => c.caracteristica.toLowerCase() === claveLower
            );
            if (defCampo?.opciones) {
                defCampo.opciones.forEach((op) => {
                    const opLower = op.trim().toLowerCase();
                    valoresMap.set(opLower, { display: op.trim(), conteo: 0 });
                });
            } else if (defCampo?.sugeridoPorDefecto) {
                const op = defCampo.sugeridoPorDefecto.trim();
                valoresMap.set(op.toLowerCase(), { display: op, conteo: 0 });
            }

            // 2. Conteo real de productos con esta característica y valor
            productosCat.forEach((p) => {
                const esp = p.especificaciones?.find(
                    (e) => e.caracteristica?.trim().toLowerCase() === claveLower
                );
                if (esp && esp.valor?.trim()) {
                    const valTrim = esp.valor.trim();
                    const valLower = valTrim.toLowerCase();
                    const actual = valoresMap.get(valLower);
                    if (actual) {
                        actual.conteo += 1;
                    } else {
                        valoresMap.set(valLower, { display: valTrim, conteo: 1 });
                    }
                }
            });

            // Convertir y ordenar opciones (las que tienen productos primero, luego alfabético)
            const opciones = Array.from(valoresMap.values())
                .filter((item) => item.conteo > 0 || (defCampo?.opciones && defCampo.opciones.some((o) => o.toLowerCase() === item.display.toLowerCase())))
                .map((item) => ({ valor: item.display, conteo: item.conteo }))
                .sort((a, b) => b.conteo - a.conteo || a.valor.localeCompare(b.valor));

            if (opciones.length > 0) {
                resultado.push({
                    claveLower,
                    caracteristica: nombreDisplay,
                    opciones,
                });
            }
        });

        return resultado;
    }, [categoria, productos]);

    const precioMin = parsearNumeroSeguro(precioMinTexto);
    const precioMax = parsearNumeroSeguro(precioMaxTexto);

    const totalFiltrosSpecs = useMemo(() => {
        return Object.values(filtrosSpecs).reduce((acc, arr) => acc + arr.length, 0);
    }, [filtrosSpecs]);

    const hayFiltros =
        busqueda.trim() !== "" ||
        categoria !== FILTRO_TODOS ||
        novedades !== "todos" ||
        precioMinTexto !== "" ||
        precioMaxTexto !== "" ||
        orden !== "relevancia" ||
        totalFiltrosSpecs > 0;

    const totalFiltrosActivos =
        (categoria !== FILTRO_TODOS ? 1 : 0) +
        (busqueda.trim() !== "" ? 1 : 0) +
        (novedades !== "todos" ? 1 : 0) +
        (precioMinTexto !== "" || precioMaxTexto !== "" ? 1 : 0) +
        totalFiltrosSpecs;

    const filtrados = useMemo(() => {
        let lista = productos.filter((p) => p.activo && p.stock > 0);

        if (categoria !== FILTRO_TODOS) {
            lista = lista.filter((p) => p.categoria === categoria);
        }

        if (novedades === "hoy") {
            lista = lista.filter((p) => esRegistradoHoy(p.fechaCreacion));
        } else if (novedades === "recientes") {
            lista = [...lista]
                .sort((a, b) => tiempoDe(b.fechaCreacion) - tiempoDe(a.fechaCreacion))
                .slice(0, 5);
        }

        if (precioMinTexto.trim() !== "") {
            lista = lista.filter((p) => p.precio >= precioMin);
        }
        if (precioMaxTexto.trim() !== "") {
            lista = lista.filter((p) => p.precio <= precioMax);
        }

        const texto = busqueda.trim().toLowerCase();
        if (texto) {
            lista = lista.filter(
                (p) =>
                    p.nombre.toLowerCase().includes(texto) ||
                    p.categoria.toLowerCase().includes(texto) ||
                    (p.marca || "").toLowerCase().includes(texto) ||
                    p.descripcion.toLowerCase().includes(texto)
            );
        }

        // Filtro canónico por especificaciones técnicas
        if (totalFiltrosSpecs > 0) {
            lista = lista.filter((p) => {
                return Object.entries(filtrosSpecs).every(([caractKey, valores]) => {
                    if (!valores || valores.length === 0) return true;
                    return p.especificaciones?.some(
                        (e) =>
                            e.caracteristica?.trim().toLowerCase() === caractKey.toLowerCase() &&
                            valores.some((v) => e.valor?.trim().toLowerCase() === v.trim().toLowerCase())
                    );
                });
            });
        }

        switch (orden) {
            case "precio-asc":
                return lista.sort((a, b) => a.precio - b.precio);
            case "precio-desc":
                return lista.sort((a, b) => b.precio - a.precio);
            case "popular":
                return lista.sort((a, b) => b.vendidos - a.vendidos);
            case "stock":
                return lista.sort((a, b) => b.stock - a.stock);
            default:
                return lista;
        }
    }, [
        productos,
        categoria,
        orden,
        busqueda,
        novedades,
        precioMinTexto,
        precioMaxTexto,
        precioMin,
        precioMax,
        filtrosSpecs,
        totalFiltrosSpecs,
    ]);

    const visibles = filtrados;

    const limpiarFiltros = () => {
        setBusqueda("");
        setCategoria(FILTRO_TODOS);
        setOrden("relevancia");
        setNovedades("todos");
        setPrecioMinTexto("");
        setPrecioMaxTexto("");
        setFiltrosSpecs({});
        setPagina(1);
    };

    // Alternar todas las especificaciones entre expandidas o colapsadas
    const colapsarTodasLasSpecs = (colapsar: boolean) => {
        setColapsadas((prev) => {
            const copia = { ...prev };
            especificacionesDisponibles.forEach((g) => {
                copia[`spec_${g.claveLower}`] = colapsar;
            });
            return copia;
        });
    };

    // Componente interno para renderizar los bloques de filtros en la barra izquierda
    const ContenidoFiltros = (
        <div className="space-y-4">
            {/* Header de Filtros: botón Limpiar fijo a un costado para evitar saltos bruscos */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Filtros
                    </span>
                    {totalFiltrosActivos > 0 && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {totalFiltrosActivos}
                        </span>
                    )}
                </div>

                {/* El botón se reserva en el DOM con opacidad para no desplazar elementos */}
                <button
                    type="button"
                    onClick={limpiarFiltros}
                    disabled={!hayFiltros}
                    className={`text-xs font-semibold transition-opacity duration-150 ${
                        hayFiltros
                            ? "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                            : "opacity-0 pointer-events-none select-none"
                    }`}
                >
                    Limpiar todo
                </button>
            </div>

            {/* Bloque 1: Categorías (Minimizable) */}
            <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
                <button
                    type="button"
                    onClick={() => toggleColapso("categorias")}
                    className="w-full flex items-center justify-between text-left cursor-pointer select-none group"
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Categorías
                        </span>
                        {categoria !== FILTRO_TODOS && (
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                    </div>
                    <svg
                        className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                            !colapsadas["categorias"] ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {!colapsadas["categorias"] && (
                    <div className="space-y-1 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        {nombresCategorias.map((nombre) => {
                            const seleccionada = categoria === nombre;
                            return (
                                <button
                                    key={nombre}
                                    type="button"
                                    onClick={() => seleccionarCategoria(nombre)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                        seleccionada
                                            ? "bg-blue-600 text-white font-bold shadow-xs"
                                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                                    }`}
                                >
                                    <span>{nombre}</span>
                                    {seleccionada && (
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bloque 2: Especificaciones Técnicas (Cada característica es individualmente minimizable) */}
            {categoria !== FILTRO_TODOS && especificacionesDisponibles.length > 0 && (
                <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                Especificaciones
                            </h3>
                            <p className="text-[10px] text-slate-500">
                                {categoria} ({especificacionesDisponibles.length})
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                            <button
                                type="button"
                                onClick={() => colapsarTodasLasSpecs(false)}
                                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                                Abrir
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button
                                type="button"
                                onClick={() => colapsarTodasLasSpecs(true)}
                                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {especificacionesDisponibles.map((grupo, index) => {
                            const specId = `spec_${grupo.claveLower}`;
                            const valoresSeleccionados = filtrosSpecs[grupo.claveLower] || [];
                            const tieneSeleccion = valoresSeleccionados.length > 0;
                            // Las primeras 2 características abiertas por defecto si no han sido colapsadas manualmente, o si tienen selección
                            const abierta = tieneSeleccion || !(colapsadas[specId] ?? (index >= 2));

                            return (
                                <div
                                    key={grupo.claveLower}
                                    className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-900/40"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleColapso(specId)}
                                        className="w-full flex items-center justify-between text-left cursor-pointer select-none group"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 pr-1">
                                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {grupo.caracteristica}
                                            </span>
                                            {tieneSeleccion && (
                                                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                                    {valoresSeleccionados.length}
                                                </span>
                                            )}
                                        </div>
                                        <svg
                                            className={`w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                                                abierta ? "rotate-180" : ""
                                            }`}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>

                                    {abierta && (
                                        <div className="space-y-1 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 max-h-44 overflow-y-auto pr-1">
                                            {grupo.opciones.map((op) => {
                                                const checked = valoresSeleccionados.some(
                                                    (v) => v.toLowerCase() === op.valor.toLowerCase()
                                                );
                                                return (
                                                    <label
                                                        key={op.valor}
                                                        className="flex items-center justify-between px-2 py-1 rounded-lg text-xs hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer select-none"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleSpecFiltro(grupo.claveLower, op.valor)}
                                                                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            />
                                                            <span className={`truncate text-xs ${checked ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"}`}>
                                                                {op.valor}
                                                            </span>
                                                        </div>
                                                        {op.conteo > 0 && (
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold">
                                                                {op.conteo}
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bloque 3: Rango de Precios (Minimizable) */}
            <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
                <button
                    type="button"
                    onClick={() => toggleColapso("precio")}
                    className="w-full flex items-center justify-between text-left cursor-pointer select-none group"
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Rango de Precios (S/)
                        </span>
                        {(precioMinTexto !== "" || precioMaxTexto !== "") && (
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                    </div>
                    <svg
                        className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                            !colapsadas["precio"] ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {!colapsadas["precio"] && (
                    <div className="grid grid-cols-2 gap-2 items-center mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <div>
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Mínimo"
                                value={precioMinTexto}
                                onChange={(e) => {
                                    setPrecioMinTexto(limpiarDecimal(e.target.value));
                                    setPagina(1);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Máximo"
                                value={precioMaxTexto}
                                onChange={(e) => {
                                    setPrecioMaxTexto(limpiarDecimal(e.target.value));
                                    setPagina(1);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Bloque 4: Novedades / Auditoría (Minimizable) */}
            <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
                <button
                    type="button"
                    onClick={() => toggleColapso("novedades")}
                    className="w-full flex items-center justify-between text-left cursor-pointer select-none group"
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Novedades
                        </span>
                        {novedades !== "todos" && (
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                    </div>
                    <svg
                        className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                            !colapsadas["novedades"] ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {!colapsadas["novedades"] && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <select
                            value={novedades}
                            onChange={(e) => {
                                setNovedades(e.target.value as Novedades);
                                setPagina(1);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                            <option value="todos">Todos los productos</option>
                            <option value="recientes">Últimos añadidos</option>
                            <option value="hoy">Registrados hoy</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header de la vista */}
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Catálogo de Productos
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        {filtrados.length} producto{filtrados.length !== 1 ? "s" : ""} disponible{filtrados.length !== 1 ? "s" : ""} con entrega inmediata.
                    </p>
                </div>

                {/* Barra superior de Búsqueda y Ordenamiento */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap gap-3 items-center justify-between shadow-xs">
                    {/* Input de Búsqueda */}
                    <div className="relative flex-1 min-w-[220px]">
                        <svg
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar laptops, smartphones, audio, periféricos..."
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value);
                                setPagina(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Selector de Ordenamiento */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 hidden sm:inline">
                            Ordenar
                        </span>
                        <select
                            value={orden}
                            onChange={(e) => {
                                setOrden(e.target.value as Orden);
                                setPagina(1);
                            }}
                            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                            <option value="relevancia">Relevancia</option>
                            <option value="precio-asc">Precio: Menor a mayor</option>
                            <option value="precio-desc">Precio: Mayor a menor</option>
                            <option value="popular">Más vendidos</option>
                            <option value="stock">Mayor stock disponible</option>
                        </select>

                        {/* Botón para abrir filtros en móviles */}
                        <button
                            type="button"
                            onClick={() => setFiltrosMovilAbierto(true)}
                            className="lg:hidden px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            Filtros
                            {totalFiltrosActivos > 0 && (
                                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                                    {totalFiltrosActivos}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Etiquetas / Badges de Filtros Activos para fácil remoción */}
                {hayFiltros && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-400 text-[11px] font-semibold">Filtros activos:</span>

                        {categoria !== FILTRO_TODOS && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                {categoria}
                                <button
                                    type="button"
                                    onClick={() => seleccionarCategoria(FILTRO_TODOS)}
                                    className="hover:text-blue-900 dark:hover:text-white cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}

                        {busqueda.trim() !== "" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs">
                                "{busqueda}"
                                <button
                                    type="button"
                                    onClick={() => setBusqueda("")}
                                    className="hover:text-red-500 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}

                        {(precioMinTexto !== "" || precioMaxTexto !== "") && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs">
                                S/ {precioMinTexto || "0"} – S/ {precioMaxTexto || "∞"}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPrecioMinTexto("");
                                        setPrecioMaxTexto("");
                                    }}
                                    className="hover:text-red-500 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}

                        {novedades !== "todos" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs">
                                {novedades === "recientes" ? "Últimos añadidos" : "Registrados hoy"}
                                <button
                                    type="button"
                                    onClick={() => setNovedades("todos")}
                                    className="hover:text-red-500 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}

                        {Object.entries(filtrosSpecs).map(([caractKey, vals]) => {
                            const grupo = especificacionesDisponibles.find((g) => g.claveLower === caractKey);
                            const nombreVisual = grupo?.caracteristica || formatearTituloCaracteristica(caractKey);

                            return vals.map((v) => (
                                <span
                                    key={`${caractKey}-${v}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
                                >
                                    {nombreVisual}: {v}
                                    <button
                                        type="button"
                                        onClick={() => toggleSpecFiltro(caractKey, v)}
                                        className="hover:text-indigo-900 dark:hover:text-white cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ));
                        })}

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 ml-2 hover:underline cursor-pointer"
                        >
                            Limpiar todo
                        </button>
                    </div>
                )}

                {/* Estructura Principal en 2 Columnas: Barra Izquierda de Filtros + Grid de Productos */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Barra Izquierda (Sidebar) fija en Desktop */}
                    <aside className="hidden lg:block w-72 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
                        {ContenidoFiltros}
                    </aside>

                    {/* Modal / Drawer de Filtros para vista Móvil */}
                    {filtrosMovilAbierto && (
                        <div className="fixed inset-0 z-50 lg:hidden flex">
                            <div
                                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                                onClick={() => setFiltrosMovilAbierto(false)}
                            />
                            <div className="relative ml-auto w-full max-w-xs bg-white dark:bg-slate-900 h-full p-5 overflow-y-auto shadow-2xl z-10 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                                        <span className="font-bold text-sm">Filtros</span>
                                        <button
                                            type="button"
                                            onClick={() => setFiltrosMovilAbierto(false)}
                                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {ContenidoFiltros}
                                </div>
                                <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setFiltrosMovilAbierto(false)}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                                    >
                                        Ver {filtrados.length} producto{filtrados.length !== 1 ? "s" : ""}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contenido Derecho: Grid de Productos */}
                    <section className="flex-1 min-w-0">
                        {cargando ? (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-sm text-slate-500 shadow-sm">
                                Cargando catálogo de productos...
                            </div>
                        ) : filtrados.length > 0 ? (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {visibles.map((p) => (
                                        <ProductCard key={p.id} producto={p} />
                                    ))}
                                </div>

                                {/* Paginación */}
                                <div className="pt-2">
                                    <Paginacion
                                        paginaActual={pagina}
                                        totalPaginas={totalPaginas}
                                        totalRegistros={totalRegistros}
                                        onCambiar={setPagina}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                    🔍
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                    Sin resultados encontrados
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    No encontramos productos con los filtros o especificaciones seleccionadas. Intenta ajustar el rango de precios o limpiar los filtros.
                                </p>
                                <button
                                    type="button"
                                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors shadow-xs"
                                    onClick={limpiarFiltros}
                                >
                                    Limpiar todos los filtros
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Productos;