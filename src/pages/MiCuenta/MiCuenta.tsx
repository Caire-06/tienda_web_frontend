import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../context/AuthContext";
import { leerPedidos } from "../../data/pedidos";
import type { Pedido } from "../../data/pedidos";
import { listarMisCompras } from "../../services/pedidosApi";
import type { Usuario } from "../../data/usuarios";
import FormularioCambioPassword from "../../components/FormularioCambioPassword/FormularioCambioPassword";
import {
    esDocumentoPeruanoValido,
    esTelefonoValido,
    limpiarSoloDigitos,
    limpiarSoloLetras,
} from "../../utils/validaciones";

interface Perfil {
    nombre: string;
    correo: string;
    telefono: string;
    documento: string;
    direccion: string;
    ciudad: string;
    miembroDesde: string;
}

type PerfilBackend = {
    idUsuario: number; nombres: string; apellidos: string; documento: string;
    correo: string; telefono: string; direccion: string; ciudad: string; rol: string;
};
function desdeBackend(data: PerfilBackend): Perfil {
    return {
        nombre: `${data.nombres || ""} ${data.apellidos || ""}`.trim(),
        correo: data.correo || "", telefono: data.telefono || "", documento: data.documento || "",
        direccion: data.direccion || "", ciudad: data.ciudad || "", miembroDesde: "2026",
    };
}

interface MiCuentaDetalleProps {
    usuario: Usuario;
    logout: () => void;
    actualizarNombre: (nombre: string) => void;
    marcarPasswordActualizada: () => void;
    token: string;
}

function MiCuentaDetalle({ usuario, logout, actualizarNombre, marcarPasswordActualizada, token }: MiCuentaDetalleProps) {
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState<Perfil>({ nombre: usuario.nombre, correo: usuario.acceso,
        telefono: "", documento: "", direccion: "", ciudad: "", miembroDesde: "2026" });
    const [nombres, setNombres] = useState("");
    const [apellidos, setApellidos] = useState("");
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [editando, setEditando] = useState(false);
    const [guardado, setGuardado] = useState(false);
    const [cambiandoClave, setCambiandoClave] = useState(false);
    const [claveActualizadaMsg, setClaveActualizadaMsg] = useState("");
    const [pedidosBackend, setPedidosBackend] = useState<Pedido[]>([]);
    useEffect(() => {
        let activo = true;
        fetch("/api/perfil", { headers: { Authorization: `Bearer ${token}` } })
            .then(async r => {
                const data = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(data.error || "No se pudo consultar el perfil");
                return data as PerfilBackend;
            })
            .then(data => {
                if (!activo) return;
                setPerfil(desdeBackend(data)); setNombres(data.nombres || ""); setApellidos(data.apellidos || "");
            })
            .catch(e => { if (activo) setError(e instanceof Error ? e.message : "Error al cargar el perfil"); })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [token]);

    useEffect(() => {
        if (!token) return;
        let activo = true;
        listarMisCompras(token)
            .then((lista) => { if (activo) setPedidosBackend(lista); })
            .catch(() => { if (activo) setPedidosBackend([]); });
        return () => { activo = false; };
    }, [token]);

    const pedidos = [...pedidosBackend, ...leerPedidos().filter((p) => p.usuarioId === usuario.id)];
    const totalGastado = pedidos.reduce((acc, p) => acc + p.total, 0);
    const unidades = pedidos.reduce((acc, p) => acc + p.items.reduce((a, it) => a + it.cantidad, 0), 0);
    const ultimoPedido = pedidos[0] ?? null;

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault(); setError(""); setGuardado(false);
        if (nombres.trim().length < 2 || apellidos.trim().length < 2) {
            setError("Nombres y apellidos deben tener al menos 2 caracteres.");
            return;
        }
        const telLimpio = perfil.telefono.trim();
        if (telLimpio && !esTelefonoValido(telLimpio)) {
            setError("El teléfono debe contener de 7 a 9 dígitos numéricos.");
            return;
        }
        const docCheck = esDocumentoPeruanoValido(perfil.documento);
        if (!docCheck.valido) {
            setError(docCheck.mensaje || "Documento inválido.");
            return;
        }
        setGuardando(true);
        try {
            const resp = await fetch("/api/perfil", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ nombres: nombres.trim(), apellidos: apellidos.trim(),
                    documento: perfil.documento.trim(), telefono: perfil.telefono.trim(),
                    direccion: perfil.direccion.trim() }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data.error || data.message || "No se pudo guardar el perfil");
            const nuevo = desdeBackend(data as PerfilBackend);
            setPerfil(nuevo); setNombres(data.nombres || ""); setApellidos(data.apellidos || "");
            actualizarNombre(nuevo.nombre);
            setEditando(false); setGuardado(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo guardar el perfil");
        } finally { setGuardando(false); }
    };

    const cambiar = (campo: keyof Perfil, valor: string) =>
        setPerfil((prev) => ({ ...prev, [campo]: valor }));

    const salir = () => {
        logout();
        navigate("/inicio");
    };

    const inicial = perfil.nombre.trim().charAt(0).toUpperCase() || "U";
    const inputClass =
        "w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500";

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
                {/* Saludo y Avatar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
                            {inicial}
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white">Hola, {perfil.nombre.split(" ")[0]}</h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Miembro desde {perfil.miembroDesde} · <span className="font-bold uppercase text-blue-600 dark:text-blue-400">{usuario.rol}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/50 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                        onClick={salir}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Cerrar sesión</span>
                    </button>
                </div>

                {/* Resumen de actividad */}
                <section className="admin-cards grid-cols-2 md:grid-cols-4">
                    <div className="admin-card cursor-pointer" onClick={() => navigate("/mis-compras")}>
                        <span>Pedidos realizados</span>
                        <strong>{pedidos.length}</strong>
                    </div>
                    <div className="admin-card cursor-pointer" onClick={() => navigate("/mis-compras")}>
                        <span>Total compras</span>
                        <strong>S/ {totalGastado.toLocaleString("es-PE")}</strong>
                    </div>
                    <div className="admin-card">
                        <span>Items adquiridos</span>
                        <strong>{unidades}</strong>
                    </div>
                    <div
                        className="admin-card cursor-pointer hover:border-blue-500"
                        onClick={() => navigate(usuario.rol === "admin" ? "/admin" : usuario.rol === "almacen" ? "/almacen" : "/productos")}
                    >
                        <span>{usuario.rol === "cliente" ? "Explorar tienda" : "Ir a mi panel"}</span>
                        <strong className="text-blue-600 dark:text-blue-400">→</strong>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Datos personales */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-base font-bold">Datos personales</h2>
                            {!editando && !cargando && !error && (
                                <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => setEditando(true)}>
                                    Editar
                                </button>
                            )}
                        </div>

                        {cargando ? <p className="text-sm text-slate-500">Cargando datos desde PostgreSQL...</p> : editando ? (
                            <form onSubmit={guardar} className="space-y-3.5">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Nombres</label>
                                    <input className={inputClass} value={nombres} onChange={(e) => setNombres(limpiarSoloLetras(e.target.value, 80))} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Apellidos</label>
                                    <input className={inputClass} value={apellidos} onChange={(e) => setApellidos(limpiarSoloLetras(e.target.value, 80))} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Teléfono</label>
                                    <input className={inputClass + " font-mono"} type="text" inputMode="numeric" maxLength={9} value={perfil.telefono} onChange={(e) => cambiar("telefono", limpiarSoloDigitos(e.target.value, 9))} placeholder="987654321" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Documento (DNI/RUC)</label>
                                    <input className={inputClass + " font-mono"} type="text" inputMode="numeric" maxLength={11} value={perfil.documento} onChange={(e) => cambiar("documento", limpiarSoloDigitos(e.target.value, 11))} placeholder="72345678" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Dirección</label>
                                    <input className={inputClass} value={perfil.direccion} onChange={(e) => cambiar("direccion", e.target.value)} placeholder="Av. Los Olivos 123" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Ciudad</label>
                                    <input className={inputClass} value={perfil.ciudad} readOnly title="La ciudad procede del distrito registrado en PostgreSQL" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" className="btn-mini" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
                                    <button type="button" className="btn-mini sec" onClick={() => { setEditando(false); setError(""); }}>Cancelar</button>
                                </div>
                            </form>
                        ) : (
                            <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                                <div className="py-2.5 flex justify-between"><dt className="text-slate-500">Nombre</dt><dd className="font-semibold">{perfil.nombre}</dd></div>
                                <div className="py-2.5 flex justify-between"><dt className="text-slate-500">Correo</dt><dd className="font-mono">{perfil.correo}</dd></div>
                                <div className="py-2.5 flex justify-between"><dt className="text-slate-500">Teléfono</dt><dd>{perfil.telefono || "—"}</dd></div>
                                <div className="py-2.5 flex justify-between"><dt className="text-slate-500">Documento</dt><dd>{perfil.documento || "—"}</dd></div>
                                <div className="py-2.5 flex justify-between"><dt className="text-slate-500">Dirección</dt><dd>{perfil.direccion || "—"}</dd></div>
                                <div className="py-2.5 flex justify-between"><dt className="text-slate-500">Ciudad</dt><dd>{perfil.ciudad || "—"}</dd></div>
                            </dl>
                        )}

                        {error && <p role="alert" className="text-xs text-red-600 font-semibold">{error}</p>}
                        {guardado && <p className="text-xs text-emerald-600 font-semibold">Cambios guardados correctamente.</p>}

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Seguridad y contraseña
                                    </h3>
                                    {usuario.requiereCambioPassword && (
                                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                            Pendiente cambiar la contraseña temporal asignada.
                                        </p>
                                    )}
                                </div>
                                {!cambiandoClave && (
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                        onClick={() => {
                                            setCambiandoClave(true);
                                            setClaveActualizadaMsg("");
                                        }}
                                    >
                                        Cambiar contraseña
                                    </button>
                                )}
                            </div>

                            {claveActualizadaMsg && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                    ✓ {claveActualizadaMsg}
                                </p>
                            )}

                            {cambiandoClave && (
                                <FormularioCambioPassword
                                    token={token}
                                    onExito={(msg) => {
                                        marcarPasswordActualizada();
                                        setCambiandoClave(false);
                                        setClaveActualizadaMsg(msg);
                                    }}
                                    onCancelar={() => setCambiandoClave(false)}
                                />
                            )}
                        </div>
                    </section>

                    {/* Último pedido */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-base font-bold">Último pedido</h2>
                            {ultimoPedido && (
                                <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => navigate("/mis-compras")}>
                                    Ver todos →
                                </button>
                            )}
                        </div>

                        {ultimoPedido ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <strong className="font-mono text-blue-600 dark:text-blue-400">{ultimoPedido.numero}</strong>
                                    <span className="text-slate-400">{ultimoPedido.fecha}</span>
                                </div>
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {ultimoPedido.items.slice(0, 3).map((it) => (
                                        <li key={it.id} className="py-2 flex justify-between">
                                            <span className="font-medium truncate max-w-[220px]">{it.nombre}</span>
                                            <span className="text-slate-500">x{it.cantidad}</span>
                                        </li>
                                    ))}
                                </ul>
                                {ultimoPedido.items.length > 3 && (
                                    <p className="text-[11px] text-slate-400">+{ultimoPedido.items.length - 3} productos más</p>
                                )}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase text-slate-500">Total</span>
                                    <strong className="font-mono text-lg font-black text-slate-900 dark:text-white">
                                        S/ {ultimoPedido.total.toLocaleString("es-PE")}
                                    </strong>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 py-6 text-center">
                                Aún no tienes pedidos. Tu última compra aparecerá aquí.
                            </p>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function MiCuenta() {
    const navigate = useNavigate();
    const { usuario, token, logout, actualizarNombre, marcarPasswordActualizada } = useAuth();

    if (!usuario || !token) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
                <Header />
                <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <h1 className="text-2xl font-black">Mi cuenta</h1>
                    <p className="text-sm text-slate-500">Inicia sesión para gestionar tu cuenta.</p>
                    <button
                        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
                        onClick={() => navigate("/login")}
                    >
                        Ir al login
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <MiCuentaDetalle
            key={usuario.id}
            usuario={usuario}
            logout={logout}
            actualizarNombre={actualizarNombre}
            marcarPasswordActualizada={marcarPasswordActualizada}
            token={token}
        />
    );
}

export default MiCuenta;
