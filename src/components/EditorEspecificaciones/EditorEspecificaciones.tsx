import { useMemo } from "react";
import {
    generarEspecificacionesPorDefecto,
    obtenerCamposPlantilla,
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

    const cargarPlantilla = () => {
        const porDefecto = generarEspecificacionesPorDefecto(categoria);
        onChange(porDefecto);
    };

    const agregarFila = () => {
        // Busca la primera característica de la plantilla que aún no esté agregada
        const disponibles = camposPlantilla.filter(
            (cp) => !especificaciones.some((e) => e.caracteristica === cp.caracteristica)
        );
        const inicial = disponibles[0] ?? camposPlantilla[0];
        const nuevaCaract = inicial?.caracteristica ?? "Característica personalizada";
        const nuevoValor = inicial?.sugeridoPorDefecto ?? (inicial?.opciones ? inicial.opciones[0] : "");

        onChange([...especificaciones, { caracteristica: nuevaCaract, valor: nuevoValor }]);
    };

    const actualizarFila = (index: number, campo: keyof ItemEspecificacion, valor: string) => {
        const clon = especificaciones.map((item, i) => {
            if (i !== index) return item;

            if (campo === "caracteristica") {
                // Si cambia la característica a una de la plantilla, sugerir su valor por defecto
                const def = camposPlantilla.find((c) => c.caracteristica === valor);
                const nuevoValor = def?.sugeridoPorDefecto ?? (def?.opciones ? def.opciones[0] : "");
                return { caracteristica: valor, valor: nuevoValor || item.valor };
            }

            return { ...item, [campo]: valor };
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
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>⚙️</span> Ficha Técnica y Especificaciones (3FN)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                        Valores canónicos estandarizados para búsqueda y filtros en tienda.
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={cargarPlantilla}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-semibold border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer transition-colors"
                        title="Auto-completar características sugeridas para esta categoría"
                    >
                        ⚡ Cargar plantilla ({categoria})
                    </button>
                    <button
                        type="button"
                        onClick={agregarFila}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-semibold border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer transition-colors"
                    >
                        + Agregar
                    </button>
                </div>
            </div>

            {especificaciones.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-xs text-slate-500 mb-2">No hay especificaciones registradas.</p>
                    <button
                        type="button"
                        onClick={cargarPlantilla}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors shadow-xs"
                    >
                        Cargar plantilla recomendada para {categoria}
                    </button>
                </div>
            ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {especificaciones.map((item, index) => {
                        const defCampo = camposPlantilla.find((c) => c.caracteristica === item.caracteristica);
                        const esPersonalizada = !defCampo;

                        return (
                            <div
                                key={index}
                                className="grid grid-cols-1 sm:grid-cols-[1.2fr_1.5fr_auto] gap-2 items-center bg-slate-50/70 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60"
                            >
                                {/* Selector o input de la característica */}
                                <div>
                                    <select
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                                        value={esPersonalizada ? "__OTRA__" : item.caracteristica}
                                        onChange={(e) => {
                                            if (e.target.value === "__OTRA__") {
                                                actualizarFila(index, "caracteristica", "Nueva característica");
                                            } else {
                                                actualizarFila(index, "caracteristica", e.target.value);
                                            }
                                        }}
                                    >
                                        <optgroup label={`Plantilla: ${categoria}`}>
                                            {nombresPlantilla.map((nombre) => (
                                                <option key={nombre} value={nombre}>
                                                    {nombre}
                                                </option>
                                            ))}
                                        </optgroup>
                                        <option value="__OTRA__">✏️ Otra (Manual / Personalizada)</option>
                                    </select>

                                    {esPersonalizada && (
                                        <input
                                            type="text"
                                            className="w-full mt-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="Nombre de característica"
                                            value={item.caracteristica}
                                            onChange={(e) => actualizarFila(index, "caracteristica", e.target.value)}
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
                                            placeholder="ej. 8 GB, 120Hz..."
                                            value={item.valor}
                                            onChange={(e) => actualizarFila(index, "valor", e.target.value)}
                                        />
                                    )}
                                </div>

                                {/* Botón eliminar fila */}
                                <button
                                    type="button"
                                    onClick={() => eliminarFila(index)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer transition-colors"
                                    title="Eliminar fila"
                                    aria-label="Eliminar fila"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
