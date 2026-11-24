import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarProveedoresPaginado,
    crearProveedor,
    actualizarProveedor,
} from "../../../services/proveedoresApi";
import type { Proveedor } from "../../../services/proveedoresApi";
import { Paginacion, REGISTROS_POR_PAGINA } from "../../../components/Paginacion/Paginacion";
import { consultarRUC, type ResultadoRUC } from "../../../services/sunatApi";
import { limpiarSoloDigitos } from "../../../utils/validaciones";

function Proveedores() {
    const { token } = useAuth();
    const formRef = useRef<HTMLFormElement>(null);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [cargando, setCargando] = useState(true);

    // Estado para edición: si tiene ID, actualiza; si es null, crea uno nuevo
    const [idEditando, setIdEditando] = useState<number | null>(null);

    const [nombre, setNombre] = useState("");
    const [ruc, setRuc] = useState("");
    const [contacto, setContacto] = useState("");
    const [telefono, setTelefono] = useState("");
    const [email, setEmail] = useState("");
    const [direccion, setDireccion] = useState("");
    const [activo, setActivo] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState("");
    const [ok, setOk] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    // Estado para la consulta en tiempo real a SUNAT
    const [consultandoRuc, setConsultandoRuc] = useState(false);
    const [infoSunat, setInfoSunat] = useState<ResultadoRUC | null>(null);

    const refrescar = async (p: number = pagina) => {
        if (!token) return;
        try {
            const res = await listarProveedoresPaginado(token, p, REGISTROS_POR_PAGINA);
            setProveedores(res.contenido);
            setTotalPaginas(res.totalPaginas);
            setTotalRegistros(res.totalElementos);
        } catch (err) {
            console.error("Error al listar proveedores", err);
            setProveedores([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        refrescar(pagina);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, pagina]);

    // Consulta automática a SUNAT por RUC
    const ejecutarConsultaRuc = async (valorRuc: string) => {
        const rucLimpio = valorRuc.trim().replace(/\D/g, "");
        if (rucLimpio.length !== 11) {
            setErrorForm("El RUC debe contener exactamente 11 dígitos numéricos.");
            return;
        }

        setErrorForm("");
        setConsultandoRuc(true);
        try {
            const res = await consultarRUC(rucLimpio);
            setInfoSunat(res);
            if (res.razonSocial) {
                setNombre(res.razonSocial);
            }
            if (res.direccion) {
                setDireccion(res.direccion);
            }
            setOk(`✓ RUC verificado ante SUNAT: ${res.razonSocial} (${res.estado} - ${res.condicion})`);
            setTimeout(() => setOk(""), 7000);
        } catch (err) {
            setInfoSunat(null);
            setErrorForm(err instanceof Error ? err.message : "No se pudo consultar el RUC en SUNAT.");
        } finally {
            setConsultandoRuc(false);
        }
    };

    // Permite exactamente hasta 11 dígitos sin truncar prematuramente
    const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = limpiarSoloDigitos(e.target.value, 11);
        setRuc(val);
        // Si completa los 11 dígitos, autodisparar la consulta fiscal
        if (val.length === 11) {
            ejecutarConsultaRuc(val);
        } else {
            setInfoSunat(null);
        }
    };

    // Iniciar edición de un proveedor existente
    const iniciarEdicion = (p: Proveedor) => {
        setIdEditando(p.id);
        setNombre(p.nombre);
        setRuc(p.ruc || "");
        setContacto(p.contacto || "");
        setTelefono(p.telefono || "");
        setEmail(p.email || "");
        setDireccion(p.direccion || "");
        setActivo(p.activo);
        setErrorForm("");
        setOk("");
        setInfoSunat(null);
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    // Cancelar modo edición y limpiar formulario
    const cancelarEdicion = () => {
        setIdEditando(null);
        setNombre("");
        setRuc("");
        setContacto("");
        setTelefono("");
        setEmail("");
        setDireccion("");
        setActivo(true);
        setErrorForm("");
        setOk("");
        setInfoSunat(null);
    };

    const guardarProveedor = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorForm("");
        setOk("");
        if (!token) return;
        if (!nombre.trim()) {
            setErrorForm("El nombre o razón social del proveedor es obligatorio.");
            return;
        }
        if (ruc.trim() && ruc.trim().length !== 11) {
            setErrorForm("Si ingresas RUC, debe contener exactamente 11 dígitos numéricos.");
            return;
        }

        setGuardando(true);
        try {
            const payload = {
                nombre: nombre.trim(),
                ruc: ruc.trim() || undefined,
                contacto: contacto.trim() || undefined,
                telefono: telefono.trim() || undefined,
                email: email.trim() || undefined,
                direccion: direccion.trim() || undefined,
                activo,
            };

            if (idEditando !== null) {
                await actualizarProveedor(token, idEditando, payload);
                setOk(`✓ Proveedor actualizado con éxito: ${nombre.trim()}`);
            } else {
                await crearProveedor(token, payload);
                setOk(`✓ Proveedor registrado con éxito: ${nombre.trim()}`);
            }

            cancelarEdicion();
            await refrescar();
        } catch (err) {
            console.error("Error al guardar proveedor", err);
            setErrorForm(err instanceof Error ? err.message : "No se pudo guardar el proveedor.");
        } finally {
            setGuardando(false);
        }
        setTimeout(() => setOk(""), 6000);
    };

    const visiblesProveedores = proveedores;

    const inputClass =
        "w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Proveedores</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Directorio, edición y catálogo de proveedores con validación y consulta automática ante SUNAT.
                </p>
            </div>

            <form
                ref={formRef}
                className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4"
                onSubmit={guardarProveedor}
            >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                        {idEditando !== null ? `Editar Proveedor #${idEditando}` : "Registrar Nuevo Proveedor"}
                    </h2>
                    {idEditando !== null && (
                        <button
                            type="button"
                            onClick={cancelarEdicion}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                        >
                            Cancelar edición
                        </button>
                    )}
                </div>

                {/* RUC con consulta SUNAT y Nombre/Razón Social */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                RUC (11 dígitos)
                            </label>
                            {consultandoRuc && (
                                <span className="text-[10px] text-blue-600 animate-pulse font-bold">
                                    Consultando SUNAT...
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                className={inputClass + " pr-24 font-mono"}
                                value={ruc}
                                onChange={handleRucChange}
                                placeholder="Ej. 20123456789"
                                maxLength={11}
                            />
                            <button
                                type="button"
                                onClick={() => ejecutarConsultaRuc(ruc)}
                                disabled={consultandoRuc || ruc.length !== 11}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white cursor-pointer transition-colors"
                            >
                                {consultandoRuc ? "..." : "Consultar"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Razón Social / Nombre *
                        </label>
                        <input
                            className={inputClass}
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej. Distribuciones Lima SAC"
                            required
                        />
                    </div>
                </div>

                {/* Badge informativo de SUNAT */}
                {infoSunat && (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                            <span className="font-bold text-blue-800 dark:text-blue-300">
                                {infoSunat.razonSocial}
                            </span>
                            <span className="block text-[11px] text-slate-500">
                                RUC: {infoSunat.ruc} · {infoSunat.direccion}
                            </span>
                        </div>
                        <div className="flex gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                {infoSunat.estado}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                {infoSunat.condicion}
                            </span>
                        </div>
                    </div>
                )}

                {/* Contacto y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Persona de Contacto
                        </label>
                        <input
                            className={inputClass}
                            value={contacto}
                            onChange={(e) => setContacto(e.target.value)}
                            placeholder="Nombre del ejecutivo comercial"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Teléfono Corporativo
                        </label>
                        <input
                            className={inputClass}
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            placeholder="999888777 / (01) 456-7890"
                        />
                    </div>
                </div>

                {/* Email y Dirección */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Correo Electrónico
                        </label>
                        <input
                            className={inputClass}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ventas@proveedor.com.pe"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Dirección Fiscal / Almacén
                        </label>
                        <input
                            className={inputClass}
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            placeholder="Av. ..."
                        />
                    </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={activo}
                        onChange={(e) => setActivo(e.target.checked)}
                        className="accent-emerald-600"
                    />
                    Proveedor activo para órdenes de compra y almacén
                </label>

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
                    {idEditando !== null && (
                        <button
                            type="button"
                            onClick={cancelarEdicion}
                            className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={guardando}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                    >
                        {guardando
                            ? "Guardando..."
                            : idEditando !== null
                            ? "Guardar Cambios"
                            : "Registrar Proveedor"}
                    </button>
                </div>
            </form>

            {/* Listado de proveedores registrados */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Catálogo de Proveedores ({totalRegistros})
                </h2>
                <div className="mt-4 space-y-3">
                    {cargando ? (
                        <p className="text-sm text-slate-500">Cargando proveedores...</p>
                    ) : proveedores.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay proveedores registrados todavía.</p>
                    ) : (
                        visiblesProveedores.map((p) => (
                            <div
                                key={p.id}
                                className={`p-4 rounded-xl border transition-colors ${
                                    idEditando === p.id
                                        ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                                        : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <strong className="text-sm text-slate-800 dark:text-slate-200 block truncate">
                                                {p.nombre}
                                            </strong>
                                            {idEditando === p.id && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                                    Editando
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 block mt-0.5">
                                            {p.ruc ? `RUC: ${p.ruc}` : "Sin RUC registrado"}
                                            {p.contacto ? ` · Contacto: ${p.contacto}` : ""}
                                            {p.telefono ? ` · Tel: ${p.telefono}` : ""}
                                            {p.email ? ` · ${p.email}` : ""}
                                        </span>
                                        {p.direccion && (
                                            <span className="block text-[11px] text-slate-400 mt-0.5">
                                                Dirección: {p.direccion}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => iniciarEdicion(p)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <span
                                            className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                p.activo
                                                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                                                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                            }`}
                                        >
                                            {p.activo ? "Activo" : "Inactivo"}
                                        </span>
                                    </div>
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

export default Proveedores;