import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarUsuarios,
    cambiarRolUsuario,
    cambiarEstadoUsuario,
    crearUsuario,
    darDeBajaLogicaUsuario,
} from "../../../services/usuariosApi";
import type { UsuarioDTO, CrearUsuarioDatos } from "../../../services/usuariosApi";

function Usuarios() {
    const { token } = useAuth();
    const [lista, setLista] = useState<UsuarioDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detalle, setDetalle] = useState<UsuarioDTO | null>(null);
    const [modalCrear, setModalCrear] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Formulario de nuevo usuario respetando 3FN
    const [nuevoForm, setNuevoForm] = useState<CrearUsuarioDatos & {
        dni?: string;
        sexo?: string;
        estadoCivil?: string;
        tipoCorreo?: string;
        tipoTelefono?: string;
        departamento?: string;
        distrito?: string;
    }>({
        username: "",
        password: "",
        rol: "ALMACEN",
        nombres: "",
        apellidos: "",
        correo: "",
        telefono: "",
        dni: "",
        sexo: "MASCULINO",
        estadoCivil: "SOLTERO",
        tipoCorreo: "Personal",
        tipoTelefono: "Móvil",
        departamento: "Lima",
        distrito: "Miraflores",
    });

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
        if (!window.confirm(`¿Confirmar baja lógica para el usuario "${u.username}"? Su estado pasará a "Inactivo" preservando la integridad referencial y auditoría.`)) return;
        try {
            const actualizado = await darDeBajaLogicaUsuario(token, u.id);
            setLista((prev) => prev.map((item) => (item.id === u.id ? actualizado : item)));
            if (detalle?.id === u.id) setDetalle(actualizado);
        } catch (err: any) {
            alert(err.message || "No se pudo dar de baja lógica al usuario");
        }
    };

    const handleCrearUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (!nuevoForm.username || !nuevoForm.password) {
            alert("Usuario y contraseña son obligatorios");
            return;
        }
        setGuardando(true);
        try {
            const creado = await crearUsuario(token, nuevoForm);
            setLista((prev) => [creado, ...prev]);
            setModalCrear(false);
            setNuevoForm({
                username: "",
                password: "",
                rol: "ALMACEN",
                nombres: "",
                apellidos: "",
                correo: "",
                telefono: "",
                dni: "",
                sexo: "MASCULINO",
                estadoCivil: "SOLTERO",
                tipoCorreo: "Personal",
                tipoTelefono: "Móvil",
                departamento: "Lima",
                distrito: "Miraflores",
            });
            alert(`Usuario ${creado.username} registrado exitosamente bajo estándar 3FN.`);
        } catch (err: any) {
            alert(err.message || "Error al crear usuario");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Gestión de Usuarios (3FN &amp; Auditoría)</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {lista.length} cuentas registradas. Identidad civil y contacto desacoplados según 3FN con trazabilidad completa.
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
                        onClick={() => setModalCrear(true)}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+</span> Nuevo Usuario (3FN)
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
                            <th>Identidad Civil (DatosPersonales)</th>
                            <th>Cuenta Técnica</th>
                            <th>Contacto (3FN)</th>
                            <th>Rol</th>
                            <th>Estado (Auditoría)</th>
                            <th>Último Acceso</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-sm text-slate-500">
                                    Consultando base de datos PostgreSQL...
                                </td>
                            </tr>
                        ) : lista.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-sm text-slate-500">
                                    No se encontraron usuarios en la base de datos.
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
                                                    <option value="OPERADOR">OPERADOR</option>
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${activo ? "ok" : "off"}`}>
                                                {activo ? "Activo" : "Inactivo / Baja"}
                                            </span>
                                            {u.bloqueado && (
                                                <span className="ml-1 badge off text-[10px]">Bloqueado</span>
                                            )}
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
                                                            title="Alternar bloqueo temporal"
                                                        >
                                                            {u.bloqueado ? "Desbloquear" : "Bloquear"}
                                                        </button>
                                                        {activo && (
                                                            <button
                                                                className="btn-mini text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                                onClick={() => handleBajaLogica(u)}
                                                                title="Baja lógica (Inactivar en 3FN)"
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

            {/* Modal Detalle Usuario 3FN */}
            {detalle && (
                <div className="modal-fondo">
                    <div className="modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>Ficha de Usuario 3FN</h2>
                            <button className="modal-cerrar" onClick={() => setDetalle(null)}>
                                ✕
                            </button>
                        </div>
                        <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Nombre de Usuario (Técnico)</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white font-mono text-xs">
                                    {detalle.username}
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Identidad Civil (DatosPersonales)</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">
                                    {detalle.nombre || detalle.username}
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Correo Electrónico (Tabla Hija 3FN)</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">{detalle.email}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Teléfono (Tabla Hija 3FN)</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">{detalle.telefono}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                                <dt className="text-slate-500 font-medium">Rol en Sistema</dt>
                                <dd>
                                    <span className={`badge rol-${detalle.rol.toLowerCase()}`}>{detalle.rol}</span>
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                                <dt className="text-slate-500 font-medium">Estado de Auditoría</dt>
                                <dd>
                                    <span className={`badge ${detalle.estado === "Inactivo" ? "off" : "ok"}`}>
                                        {detalle.estado || (!detalle.bloqueado ? "Activo" : "Inactivo")}
                                    </span>
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

            {/* Modal Crear Usuario con Campos 3FN */}
            {modalCrear && (
                <div className="modal-fondo">
                    <div className="modal-mediano max-w-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>+ Nuevo Usuario (3FN Normalizado)</h2>
                            <button className="modal-cerrar" onClick={() => setModalCrear(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCrearUsuario} className="space-y-4">
                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                1. Credenciales Técnicas (Tabla Usuarios)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Usuario *
                                    </label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="ej: operador1"
                                        value={nuevoForm.username}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Contraseña *
                                    </label>
                                    <input
                                        required
                                        type="password"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="••••••••"
                                        value={nuevoForm.password}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Rol Asignado *
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                        value={nuevoForm.rol}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, rol: e.target.value })}
                                    >
                                        <option value="ALMACEN">ALMACEN</option>
                                        <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                                        <option value="OPERADOR">OPERADOR</option>
                                        <option value="CLIENTE">CLIENTE</option>
                                    </select>
                                </div>
                            </div>

                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider pt-2 border-t border-slate-200 dark:border-slate-800">
                                2. Identidad Civil (Tabla DatosPersonales)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Nombres *
                                    </label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Nombres"
                                        value={nuevoForm.nombres}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, nombres: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Apellidos *
                                    </label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Apellidos"
                                        value={nuevoForm.apellidos}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, apellidos: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        DNI (8 dígitos)
                                    </label>
                                    <input
                                        maxLength={8}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                        placeholder="78901234"
                                        value={nuevoForm.dni}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, dni: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider pt-2 border-t border-slate-200 dark:border-slate-800">
                                3. Tablas Hijas de Contacto &amp; Geografía (3FN)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Correo Electrónico (Tabla CorreoElectronico)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="correo@ejemplo.com"
                                            value={nuevoForm.correo}
                                            onChange={(e) => setNuevoForm({ ...nuevoForm, correo: e.target.value })}
                                        />
                                        <select
                                            className="px-2 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                                            value={nuevoForm.tipoCorreo}
                                            onChange={(e) => setNuevoForm({ ...nuevoForm, tipoCorreo: e.target.value })}
                                        >
                                            <option value="Personal">Personal</option>
                                            <option value="Corporativo">Corporativo</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Teléfono (Tabla Telefono)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                            placeholder="987654321"
                                            value={nuevoForm.telefono}
                                            onChange={(e) => setNuevoForm({ ...nuevoForm, telefono: e.target.value })}
                                        />
                                        <select
                                            className="px-2 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                                            value={nuevoForm.tipoTelefono}
                                            onChange={(e) => setNuevoForm({ ...nuevoForm, tipoTelefono: e.target.value })}
                                        >
                                            <option value="Móvil">Móvil</option>
                                            <option value="Fijo">Fijo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalCrear(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {guardando ? "Persistiendo en 3FN..." : "Crear Usuario"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Usuarios;
