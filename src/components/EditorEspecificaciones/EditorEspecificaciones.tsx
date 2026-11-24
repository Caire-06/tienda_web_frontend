import { useMemo, useState, useEffect } from "react";
import {
    guardarCaracteristicaPersonalizada,
    obtenerCamposPlantilla,
    obtenerCaracteristicasPersonalizadas,
} from "../../data/plantillasEspecificaciones";

export interface ItemEspecificacion {
    caracteristica: string;
    valor: string;
}

interface Props {
    categoria: string;
    especificaciones: ItemEspecificacion[];
    onChange: (nuevas: ItemEspecificacion[]) => void;
}

export function EditorEspecificaciones({ categoria, especificaciones, onChange }: Props) {
    const camposPlantilla = useMemo(() => obtenerCamposPlantilla(categoria), [categoria]);
    const nombresPlantilla = useMemo(() => camposPlantilla.map((c) => c.caracteristica), [camposPlantilla]);

    // Características personalizadas persistidas para esta categoría
    const [personalizadas, setPersonalizadas] = useState<string[]>(() =>
        obtenerCaracteristicasPersonalizadas(categoria)
    );

    useEffect(() => {
        setPersonalizadas(obtenerCaracteristicasPersonalizadas(categoria));
    }, [categoria]);

    // Todas las características conocidas (plantilla base + personalizadas aprendidas)
    const todasLasConocidas = useMemo(() => {
        return [...nombresPlantilla, ...personalizadas.filter((p) => !nombresPlantilla.includes(p))];
    }, [nombresPlantilla, personalizadas]);

    // Calcula cuáles características estándar aún no están asignadas
    const disponiblesPlantilla = useMemo(() => {
        return camposPlantilla.filter(
            (cp) =>
                !especificaciones.some(
                    (e) => e.caracteristica.trim().toLowerCase() === cp.caracteristica.trim().toLowerCase()
                )
        );
    }, [camposPlantilla, especificaciones]);

    // Calcula cuáles características personalizadas aún no están asignadas
    const disponiblesPersonalizadas = useMemo(() => {
        return personalizadas.filter(
            (nombre) =>
                !especificaciones.some(
                    (e) => e.caracteristica.trim().toLowerCase() === nombre.trim().toLowerCase()
                )
        );
    }, [personalizadas, especificaciones]);

    const agregarFila = () => {
        // 1. Si quedan atributos de la plantilla estándar, tomar el primero
        if (disponiblesPlantilla.length > 0) {
            const inicial = disponiblesPlantilla[0];
            const nuevoValor = inicial.sugeridoPorDefecto ?? (inicial.opciones ? inicial.opciones[0] : "");
            onChange([...especificaciones, { caracteristica: inicial.caracteristica, valor: nuevoValor }]);
            return;
        }

        // 2. Si quedan personalizadas guardadas que no se hayan asignado
        if (disponiblesPersonalizadas.length > 0) {
            const primero = disponiblesPersonalizadas[0];
            onChange([...especificaciones, { caracteristica: primero, valor: "" }]);
            return;
        }

        // 3. Crear una nueva fila editable lista para personalizar
        onChange([...especificaciones, { caracteristica: "", valor: "" }]);
    };

    const registrarNuevaCaracteristica = (index: number, nuevoNombre: string) => {
        const nombreLimpio = nuevoNombre.trim();
        if (nombreLimpio) {
            const actualizadas = guardarCaracteristicaPersonalizada(categoria, nombreLimpio);
            setPersonalizadas(actualizadas);
        }
        actualizarFila(index, "caracteristica", nuevoNombre);
    };

    const actualizarFila = (index: number, campo: keyof ItemEspecificacion, nuevoValor: string) => {
        const clon = especificaciones.map((item, i) => {
            if (i !== index) return item;

            if (campo === "caracteristica") {
                const def = camposPlantilla.find((c) => c.caracteristica === nuevoValor);
                const valorSugerido = def?.sugeridoPorDefecto ?? (def?.opciones ? def.opciones[0] : "");
                return { caracteristica: nuevoValor, valor: valorSugerido || item.valor };
            }

            return { ...item, [campo]: nuevoValor };
        });

        onChange(clon);
    };

    const eliminarFila = (index: number) => {
        onChange(especificaciones.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Ficha Técnica y Especificaciones
                    </h3>
                    <p className="text-[11px] text-slate-500">
                        Atributos y características técnicas para filtrado y búsqueda en el catálogo.
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={agregarFila}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-semibold border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer transition-colors"
                    >
                        + Agregar característica
                    </button>
                </div>
            </div>

            {especificaciones.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-xs text-slate-500">
                        No hay características asignadas. Haz clic en "+ Agregar característica" para añadir una.
                    </p>
                </div>
            ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {especificaciones.map((item, index) => {
                        const defCampo = camposPlantilla.find((c) => c.caracteristica === item.caracteristica);
                        const esConocida = todasLasConocidas.includes(item.caracteristica);
                        const esOtra = !esConocida;

                        return (
                            <div
                                key={index}
                                className="grid grid-cols-1 sm:grid-cols-[1.3fr_1.5fr_auto] gap-2 items-center bg-slate-50/70 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60"
                            >
                                {/* Selector o input de la característica */}
                                <div>
                                    <select
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                                        value={esOtra ? "__OTRA__" : item.caracteristica}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "__OTRA__") {
                                                actualizarFila(index, "caracteristica", "");
                                            } else {
                                                actualizarFila(index, "caracteristica", val);
                                            }
                                        }}
                                    >
                                        <optgroup label={`Plantilla: ${categoria}`}>
                                            {nombresPlantilla.map((nombre) => {
                                                const yaAsignada = especificaciones.some(
                                                    (e, i) => i !== index && e.caracteristica === nombre
                                                );
                                                return (
                                                    <option key={nombre} value={nombre} disabled={yaAsignada}>
                                                        {nombre} {yaAsignada ? "(ya asignada)" : ""}
                                                    </option>
                                                );
                                            })}
                                        </optgroup>

                                        {personalizadas.length > 0 && (
                                            <optgroup label="Características guardadas">
                                                {personalizadas
                                                    .filter((p) => !nombresPlantilla.includes(p))
                                                    .map((nombre) => {
                                                        const yaAsignada = especificaciones.some(
                                                            (e, i) => i !== index && e.caracteristica === nombre
                                                        );
                                                        return (
                                                            <option key={nombre} value={nombre} disabled={yaAsignada}>
                                                                {nombre} {yaAsignada ? "(ya asignada)" : ""}
                                                            </option>
                                                        );
                                                    })}
                                            </optgroup>
                                        )}

                                        <option value="__OTRA__">+ Otra característica (Personalizada)...</option>
                                    </select>

                                    {esOtra && (
                                        <input
                                            type="text"
                                            autoFocus={!item.caracteristica}
                                            className="w-full mt-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                                            placeholder="ej. Color, Material, Garantía..."
                                            value={item.caracteristica}
                                            onChange={(e) => actualizarFila(index, "caracteristica", e.target.value)}
                                            onBlur={(e) => registrarNuevaCaracteristica(index, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    registrarNuevaCaracteristica(index, (e.target as HTMLInputElement).value);
                                                }
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Selector o input del valor */}
                                <div>
                                    {defCampo?.tipo === "select" && defCampo.opciones ? (
                                        <select
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500 font-medium"
                                            value={item.valor}
                                            onChange={(e) => actualizarFila(index, "valor", e.target.value)}
                                        >
                                            {!defCampo.opciones.includes(item.valor) && item.valor && (
                                                <option value={item.valor}>{item.valor} (actual)</option>
                                            )}
                                            {defCampo.opciones.map((opc) => (
                                                <option key={opc} value={opc}>
                                                    {opc}
                                                </option>
                                            ))}
                                        </select>
                                    ) : defCampo?.tipo === "number" && defCampo.sufijo ? (
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                                placeholder={defCampo.placeholder ?? "0"}
                                                value={item.valor.replace(new RegExp(`\\s*${defCampo.sufijo}$`, "i"), "")}
                                                onChange={(e) => {
                                                    const num = e.target.value.trim();
                                                    actualizarFila(index, "valor", num ? `${num} ${defCampo.sufijo}` : "");
                                                }}
                                            />
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {defCampo.sufijo}
                                            </span>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="ej. Azul Titanio, 120Hz, etc."
                                            value={item.valor}
                                            onChange={(e) => actualizarFila(index, "valor", e.target.value)}
                                        />
                                    )}
                                </div>

                                {/* Botón eliminar fila limpio (SVG sin emoji) */}
                                <button
                                    type="button"
                                    onClick={() => eliminarFila(index)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer transition-colors"
                                    title="Eliminar fila"
                                    aria-label="Eliminar fila"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
