import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listarProveedores, crearProveedor } from "../../../services/proveedoresApi";
import type { Proveedor } from "../../../services/proveedoresApi";
import { Paginacion, REGISTROS_POR_PAGINA } from "../../../components/Paginacion/Paginacion";

function Proveedores() {
    const { token } = useAuth();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [cargando, setCargando] = useState(true);

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

    const refrescar = async () => {
        if (!token) return;
        try {
            const lista = await listarProveedores(token);
            setProveedores(lista);
        } catch (err) {
            console.error("Error al listar proveedores", err);
            setProveedores([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        refrescar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const registrar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorForm("");
        setOk("");
        if (!token) return;
        if (!nombre.trim()) {
            setErrorForm("El nombre del proveedor es obligatorio.");
            return;
        }
        setGuardando(true);
        try {
            await crearProveedor(token, {
                nombre: nombre.trim(),
                ruc: ruc.trim() || undefined,
                contacto: contacto.trim() || undefined,
                telefono: telefono.trim() || undefined,
                email: email.trim() || undefined,
                direccion: direccion.trim() || undefined,
                activo,
            });
            setOk(`✓ Proveedor registrado: ${nombre.trim()}`);
            setNombre("");
            setRuc("");
            setContacto("");
            setTelefono("");
            setEmail("");
            setDireccion("");
            setActivo(true);
            await refrescar();
        } catch (err) {
            console.error("Error al registrar proveedor", err);
            setErrorForm(err instanceof Error ? err.message : "No se pudo registrar el proveedor.");
        } finally {
            setGuardando(false);
        }
        setTimeout(() => setOk(""), 6000);
    };

    const totalPaginas = Math.max(1, Math.ceil(proveedores.length / REGISTROS_POR_PAGINA));
    const visiblesProveedores = proveedores.slice((pagina - 1) * REGISTROS_POR_PAGINA, pagina * REGISTROS_POR_PAGINA);

    const inputClass =
        "w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Proveedores</h1>
                <p className="text-sm text-slate-500 mt-1">Catálogo de proveedores (3FN: una tabla de proveedores, sin atributos repetidos).</p>
            </div>

            <form className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4" onSubmit={registrar}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Nombre del Proveedor *
                        </label>
                        <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Distribuciones Lima SAC" required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            RUC
                        </label>
                        <input className={inputClass} value={ruc} onChange={(e) => setRuc(e.target.value)} placeholder="Ej. 20123456789" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Contacto
                        </label>
                        <input className={inputClass} value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Nombre del contacto" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Teléfono
                        </label>
                        <input className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="999888777" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Email
                        </label>
                        <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="proveedor@empresa.com" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Dirección
                        </label>
                        <input className={inputClass} value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Av. ..." />
                    </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="accent-emerald-600" />
                    Proveedor activo
                </label>

                {errorForm && (
                    <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold text-xs border border-red-200 dark:border-red-800/60">
                        {errorForm}
                    </div>
                )}
                {ok && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60">
                        {ok}
                    </div>
                )}

                <div className="flex gap-2.5 pt-2">
                    <button type="submit" disabled={guardando} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer">
                        Registrar proveedor
                    </button>
                </div>
            </form>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-black text-slate-900 dark:text-white">Catálogo de proveedores</h2>
                <div className="mt-4 space-y-3">
                    {cargando ? (
                        <p className="text-sm text-slate-500">Cargando proveedores...</p>
                    ) : proveedores.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay proveedores registrados todavía.</p>
                    ) : (
                        visiblesProveedores.map((p) => (
                            <div key={p.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <strong className="text-xs text-slate-800 dark:text-slate-200">{p.nombre}</strong>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.activo ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
                                        {p.activo ? "Activo" : "Inactivo"}
                                    </span>
                                </div>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                                    {p.ruc && <span>RUC: <strong className="font-mono">{p.ruc}</strong></span>}
                                    {p.contacto && <span>Contacto: <strong>{p.contacto}</strong></span>}
                                    {p.telefono && <span>Teléfono: <strong className="font-mono">{p.telefono}</strong></span>}
                                    {p.email && <span>Email: <strong>{p.email}</strong></span>}
                                    {p.direccion && <span>Dirección: <strong>{p.direccion}</strong></span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-4">
                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} totalRegistros={proveedores.length} onCambiar={setPagina} />
                </div>
            </div>
        </div>
    );
}

export default Proveedores;
