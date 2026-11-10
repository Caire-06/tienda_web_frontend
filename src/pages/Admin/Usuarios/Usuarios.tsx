import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarUsuarios,
    cambiarRolUsuario,
    cambiarEstadoUsuario,
    crearUsuario,
    darDeBajaLogicaUsuario,
} from "../../../services/usuariosApi";
import type { UsuarioDTO, CrearUsuarioDatos, UsuarioCreadoAdmin } from "../../../services/usuariosApi";
import {
    esCorreoValido,
    esTelefonoValido,
    limpiarSoloDigitos,
    limpiarSoloLetras,
} from "../../../utils/validaciones";

const FORM_INICIAL: CrearUsuarioDatos = {
    username: "",
    rol: "ALMACEN",
    nombres: "",
    apellidos: "",
    dni: "",
    correo: "",
    tipoCorreo: "Corporativo",
    telefono: "",
    tipoTelefono: "Móvil",
};

function normalizarSegmentoNombre(valor: string, respaldo: string): string {
    const token = valor.trim().split(/\s+/)[0] || "";
    const sinTildes = token
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z]/g, "");
    if (!sinTildes) return respaldo;
    return sinTildes.charAt(0).toUpperCase() + sinTildes.slice(1).toLowerCase();
}

function generarPasswordTemporalPreview(nombres: string, apellidos: string, dni: string): string {
    if (!nombres.trim() || !apellidos.trim() || !/^\d{8}$/.test(dni.trim())) return "";
    const parteNombre = normalizarSegmentoNombre(nombres, "Usuario");
    const parteApellido = normalizarSegmentoNombre(apellidos, "Tech");
    const ultimos3Dni = dni.trim().slice(-3);
    return `${parteNombre.charAt(0).toUpperCase()}${parteApellido.toLowerCase()}${ultimos3Dni}`;
}

async function copiarTexto(texto: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
            return true;
        }
    } catch {
        // Fallback manual con textarea oculto
    }
    try {
        const el = document.createElement("textarea");
        el.value = texto;
        el.setAttribute("readonly", "");
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(el);
        return ok;
    } catch {
        return false;
    }
}

function Usuarios() {
    const { token } = useAuth();
    const [lista, setLista] = useState<UsuarioDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detalle, setDetalle] = useState<UsuarioDTO | null>(null);
    const [modalCrear, setModalCrear] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState("");
    const [credencialesCreadas, setCredencialesCreadas] = useState<UsuarioCreadoAdmin | null>(null);
    const [campoCopiado, setCampoCopiado] = useState<"usuario" | "password" | null>(null);

    const [nuevoForm, setNuevoForm] = useState<CrearUsuarioDatos>(FORM_INICIAL);

    const passwordGenerada = generarPasswordTemporalPreview(
        nuevoForm.nombres,
        nuevoForm.apellidos,
        nuevoForm.dni
    );

    const cargar = async () => {
        if (!token) return;
        setCargando(true);
        setError(null);
        try {
            const data = await listarUsuarios(token);
            setLista(data);
        } catch (err: any) {
            setError(err.message || "Error al conectar con la base de datos");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [token]);

    const handleToggleEstado = async (u: UsuarioDTO) => {
        if (!token) return;
        try {
            const nuevoBloqueo = !u.bloqueado;
            const actualizado = await cambiarEstadoUsuario(token, u.id, nuevoBloqueo);
            setLista((prev) => prev.map((item) => (item.id === u.id ? actualizado : item)));
            if (detalle?.id === u.id) setDetalle(actualizado);
        } catch (err: any) {
            alert(err.message || "No se pudo actualizar el estado de bloqueo");
        }
    };

    const handleCambiarRol = async (u: UsuarioDTO, nuevoRol: string) => {
        if (!token) return;
        try {
            const actualizado = await cambiarRolUsuario(token, u.id, nuevoRol);
            setLista((prev) => prev.map((item) => (item.id === u.id ? actualizado : item)));
            if (detalle?.id === u.id) setDetalle(actualizado);
        } catch (err: any) {
            alert(err.message || "No se pudo actualizar el rol");
        }
    };

    const handleBajaLogica = async (u: UsuarioDTO) => {
        if (!token) return;
        if (!window.confirm(`¿Confirmar baja para el usuario "${u.username}"? El usuario pasará al estado "Inactivo".`)) return;
        try {
            const actualizado = await darDeBajaLogicaUsuario(token, u.id);
            setLista((prev) => prev.map((item) => (item.id === u.id ? actualizado : item)));
            if (detalle?.id === u.id) setDetalle(actualizado);
        } catch (err: any) {
            alert(err.message || "No se pudo dar de baja al usuario");
        }
    };

    const abrirModalCrear = () => {
        setNuevoForm(FORM_INICIAL);
        setErrorForm("");
        setCredencialesCreadas(null);
        setCampoCopiado(null);
        setModalCrear(true);
    };

    const cerrarModalCrear = () => {
        setModalCrear(false);
        setErrorForm("");
        setCredencialesCreadas(null);
        setCampoCopiado(null);
    };

    const handleCrearUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setErrorForm("");

        if (nuevoForm.username.trim().length < 3 || /\s/.test(nuevoForm.username.trim())) {
            setErrorForm("El nombre de usuario debe tener al menos 3 caracteres y sin espacios.");
            return;
        }
        if (nuevoForm.nombres.trim().length < 2 || nuevoForm.apellidos.trim().length < 2) {
            setErrorForm("Nombres y apellidos son obligatorios (mínimo 2 caracteres).");
            return;
        }
        if (!/^\d{8}$/.test(nuevoForm.dni.trim())) {
            setErrorForm("El DNI debe contener exactamente 8 dígitos numéricos.");
            return;
        }
        const correoLimpio = nuevoForm.correo?.trim() || "";
        if (correoLimpio && !esCorreoValido(correoLimpio)) {
            setErrorForm("Ingresa un correo electrónico válido.");
            return;
        }
        const telLimpio = nuevoForm.telefono?.trim() || "";
        if (telLimpio && !esTelefonoValido(telLimpio)) {
            setErrorForm("El teléfono debe contener de 7 a 9 dígitos numéricos.");
            return;
        }

        setGuardando(true);
        try {
            const creado = await crearUsuario(token, {
                ...nuevoForm,
                username: nuevoForm.username.trim(),
                nombres: nuevoForm.nombres.trim(),
                apellidos: nuevoForm.apellidos.trim(),
                dni: nuevoForm.dni.trim(),
                correo: nuevoForm.correo?.trim() || undefined,
                telefono: nuevoForm.telefono?.trim() || undefined,
            });
            setLista((prev) => [creado.usuario, ...prev]);
            setCredencialesCreadas(creado);
            setCampoCopiado(null);
            setNuevoForm(FORM_INICIAL);
        } catch (err: unknown) {
            setErrorForm(err instanceof Error ? err.message : "Error al crear usuario");
        } finally {
            setGuardando(false);
        }
    };

    const handleCopiarDato = async (campo: "usuario" | "password", valor: string) => {
        const ok = await copiarTexto(valor);
        if (ok) {
            setCampoCopiado(campo);
            window.setTimeout(() => {
                setCampoCopiado((actual) => (actual === campo ? null : actual));
            }, 2200);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {lista.length} cuentas registradas en el sistema.
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
                        onClick={abrirModalCrear}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> Nuevo Usuario
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="tabla-wrap">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Usuario</th>
                            <th>Contacto</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Último Acceso</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-sm text-slate-500">
                                    Cargando usuarios...
                                </td>
                            </tr>
                        ) : lista.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-sm text-slate-500">
                                    No se encontraron usuarios registrados.
                                </td>
                            </tr>
                        ) : (
                            lista.map((u) => {
                                const activo = u.estado ? u.estado.toLowerCase() === "activo" : !u.bloqueado;
                                return (
                                    <tr key={u.id}>
                                        <td className="font-semibold">{u.nombre || u.username}</td>
                                        <td className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                            {u.username}
                                        </td>
                                        <td className="text-xs text-slate-500">
                                            <div>{u.email || "—"}</div>
                                            <div className="text-[11px] text-slate-400">{u.telefono}</div>
                                        </td>
                                        <td>
                                            {u.username === "admin" ? (
                                                <span className="badge rol-admin">{u.rol}</span>
                                            ) : (
                                                <select
                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                    value={u.rol}
                                                    onChange={(e) => handleCambiarRol(u, e.target.value)}
                                                >
                                                    <option value="CLIENTE">CLIENTE</option>
                                                    <option value="ALMACEN">ALMACEN</option>
                                                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap items-center gap-1">
                                                <span className={`badge ${activo ? "ok" : "off"}`}>
                                                    {activo ? "Activo" : "Inactivo"}
                                                </span>
                                                {u.bloqueado && (
                                                    <span className="badge off text-[10px]">Bloqueado</span>
                                                )}
                                                {u.requiereCambioPassword && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                        Clave temporal
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-xs text-slate-500">{u.ultimoAcceso}</td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <button className="btn-mini" onClick={() => setDetalle(u)}>
                                                    Ver
                                                </button>
                                                {u.username !== "admin" && (
                                                    <>
                                                        <button
                                                            className="btn-mini sec"
                                                            onClick={() => handleToggleEstado(u)}
                                                            title="Alternar bloqueo"
                                                        >
                                                            {u.bloqueado ? "Desbloquear" : "Bloquear"}
                                                        </button>
                                                        {activo && (
                                                            <button
                                                                className="btn-mini text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                                onClick={() => handleBajaLogica(u)}
                                                                title="Dar de baja"
                                                            >
                                                                Baja
                                                            </button>
                                                        )}
                                                    </>
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

            {/* Modal Detalle Usuario */}
            {detalle && (
                <div className="modal-fondo" onClick={() => setDetalle(null)}>
                    <div className="modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>Detalle de Usuario</h2>
                            <button className="modal-cerrar" onClick={() => setDetalle(null)}>
                                ✕
                            </button>
                        </div>
                        <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Nombre de Usuario</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white font-mono text-xs">
                                    {detalle.username}
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Nombre Completo</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">
                                    {detalle.nombre || detalle.username}
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Correo Electrónico</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">{detalle.email}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Teléfono</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">{detalle.telefono}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                                <dt className="text-slate-500 font-medium">Rol en el Sistema</dt>
                                <dd>
                                    <span className={`badge rol-${detalle.rol.toLowerCase()}`}>{detalle.rol}</span>
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                                <dt className="text-slate-500 font-medium">Estado</dt>
                                <dd className="flex items-center gap-1.5">
                                    <span className={`badge ${detalle.estado === "Inactivo" ? "off" : "ok"}`}>
                                        {detalle.estado || (!detalle.bloqueado ? "Activo" : "Inactivo")}
                                    </span>
                                    {detalle.requiereCambioPassword && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                            Clave temporal
                                        </span>
                                    )}
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Fecha de Registro</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">
                                    {detalle.fechaRegistro}
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Último Acceso</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">
                                    {detalle.ultimoAcceso}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}

            {/* Modal Crear Usuario */}
            {modalCrear && (
                <div className="modal-fondo" onClick={cerrarModalCrear}>
                    <div className="modal-mediano" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>{credencialesCreadas ? "Credenciales generadas" : "+ Nuevo Usuario (Personal)"}</h2>
                            <button className="modal-cerrar" onClick={cerrarModalCrear}>
                                ✕
                            </button>
                        </div>

                        {credencialesCreadas ? (
                            <div className="space-y-4">
                                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-semibold">
                                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[11px] font-black shrink-0">
                                        ✓
                                    </span>
                                    Usuario registrado correctamente. Entrega estas credenciales al usuario.
                                </div>

                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3 text-xs">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Nombre completo</span>
                                        <strong className="text-slate-900 dark:text-white">
                                            {credencialesCreadas.usuario.nombre || credencialesCreadas.usuario.username}
                                        </strong>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Rol asignado</span>
                                        <span className="px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                            {credencialesCreadas.usuario.rol}
                                        </span>
                                    </div>
                                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Usuario</span>
                                        <div className="flex items-center gap-2">
                                            <code className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white select-all">
                                                {credencialesCreadas.usuario.username}
                                            </code>
                                            <button
                                                type="button"
                                                onClick={() => handleCopiarDato("usuario", credencialesCreadas.usuario.username)}
                                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                                                    campoCopiado === "usuario"
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white"
                                                }`}
                                            >
                                                {campoCopiado === "usuario" ? "✓ Copiado" : "Copiar usuario"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Contraseña temporal</span>
                                        <div className="flex items-center gap-2">
                                            <code className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 font-mono font-bold text-amber-900 dark:text-amber-200 select-all">
                                                {credencialesCreadas.passwordTemporal}
                                            </code>
                                            <button
                                                type="button"
                                                onClick={() => handleCopiarDato("password", credencialesCreadas.passwordTemporal)}
                                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                                                    campoCopiado === "password"
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                                }`}
                                            >
                                                {campoCopiado === "password" ? "✓ Copiada" : "Copiar contraseña"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Al iniciar sesión por primera vez con esta cuenta, el sistema mostrará un aviso solicitando actualizar su contraseña temporal.
                                </p>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCredencialesCreadas(null);
                                            setCampoCopiado(null);
                                            setErrorForm("");
                                        }}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                                    >
                                        Crear otro
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cerrarModalCrear}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white cursor-pointer"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        ) : (
                        <form onSubmit={handleCrearUsuario} className="space-y-4">
                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                1. Datos Personales
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Nombres *
                                    </label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Nombres"
                                        value={nuevoForm.nombres}
                                        onChange={(e) =>
                                            setNuevoForm({ ...nuevoForm, nombres: limpiarSoloLetras(e.target.value, 80) })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Apellidos *
                                    </label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Apellidos"
                                        value={nuevoForm.apellidos}
                                        onChange={(e) =>
                                            setNuevoForm({ ...nuevoForm, apellidos: limpiarSoloLetras(e.target.value, 80) })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        DNI (8 dígitos) *
                                    </label>
                                    <input
                                        required
                                        maxLength={8}
                                        pattern="\d{8}"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono placeholder-slate-400"
                                        placeholder="78901234"
                                        value={nuevoForm.dni}
                                        onChange={(e) =>
                                            setNuevoForm({
                                                ...nuevoForm,
                                                dni: e.target.value.replace(/\D/g, "").slice(0, 8),
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider pt-2 border-t border-slate-200 dark:border-slate-800">
                                2. Información de Contacto
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Correo Electrónico
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                                            placeholder="correo@ejemplo.com"
                                            value={nuevoForm.correo}
                                            onChange={(e) => setNuevoForm({ ...nuevoForm, correo: e.target.value })}
                                        />
                                        <select
                                            className="px-2 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                            value={nuevoForm.tipoCorreo}
                                            onChange={(e) => setNuevoForm({ ...nuevoForm, tipoCorreo: e.target.value })}
                                        >
                                            <option value="Corporativo">Corporativo</option>
                                            <option value="Personal">Personal</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Teléfono
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={9}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono placeholder-slate-400"
                                            placeholder="987654321"
                                            value={nuevoForm.telefono}
                                            onChange={(e) =>
                                                setNuevoForm({
                                                    ...nuevoForm,
                                                    telefono: limpiarSoloDigitos(e.target.value, 9),
                                                })
                                            }
                                        />
                                        <select
                                            className="px-2 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                            value={nuevoForm.tipoTelefono}
                                            onChange={(e) => setNuevoForm({ ...nuevoForm, tipoTelefono: e.target.value })}
                                        >
                                            <option value="Móvil">Móvil</option>
                                            <option value="Fijo">Fijo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider pt-2 border-t border-slate-200 dark:border-slate-800">
                                3. Credenciales de Acceso
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Usuario *
                                    </label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="ej: almacen2"
                                        value={nuevoForm.username}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Rol *
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                        value={nuevoForm.rol}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, rol: e.target.value })}
                                    >
                                        <option value="ALMACEN">ALMACEN</option>
                                        <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Contraseña temporal autogenerada
                                </label>
                                <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 font-mono text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                                    <span className={passwordGenerada ? "font-bold" : "text-slate-400 italic font-sans"}>
                                        {passwordGenerada || "Se autogenerará al ingresar Nombre, Apellido y DNI (8 dígitos)"}
                                    </span>
                                    <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                                        Automática
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                    Formato: 1.ª letra del nombre + apellido + últimos 3 dígitos del DNI (ej. Ccastro696). El usuario deberá cambiarla al iniciar sesión.
                                </p>
                            </div>

                            {errorForm && (
                                <div
                                    role="alert"
                                    className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-700 dark:text-red-300"
                                >
                                    {errorForm}
                                </div>
                            )}

                            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={cerrarModalCrear}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {guardando ? "Guardando..." : "Crear Usuario"}
                                </button>
                            </div>
                        </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Usuarios;
