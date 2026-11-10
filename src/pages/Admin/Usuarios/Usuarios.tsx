import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    listarUsuarios,
    cambiarRolUsuario,
    cambiarEstadoUsuario,
    crearUsuario,
    eliminarUsuario,
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

    // Formulario de nuevo usuario
    const [nuevoForm, setNuevoForm] = useState<CrearUsuarioDatos>({
        username: "",
        password: "",
        rol: "ALMACEN",
        nombres: "",
        apellidos: "",
        correo: "",
        telefono: "",
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
            alert(err.message || "No se pudo actualizar el estado");
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

    const handleEliminar = async (u: UsuarioDTO) => {
        if (!token) return;
        if (!window.confirm(`¿Seguro que deseas eliminar al usuario "${u.username}"?`)) return;
        try {
            await eliminarUsuario(token, u.id);
            setLista((prev) => prev.filter((item) => item.id !== u.id));
            if (detalle?.id === u.id) setDetalle(null);
        } catch (err: any) {
            alert(err.message || "No se pudo eliminar el usuario");
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
            });
            alert(`Usuario ${creado.username} creado exitosamente con rol ${creado.rol}`);
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
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {lista.length} usuarios registrados en la base de datos PostgreSQL.
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
                            <th>Usuario / Acceso</th>
                            <th>Correo</th>
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
                                    Cargando usuarios desde PostgreSQL...
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
                                const activo = !u.bloqueado;
                                return (
                                    <tr key={u.id}>
                                        <td className="font-semibold">{u.nombreCompleto || u.username}</td>
                                        <td className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                            {u.username}
                                        </td>
                                        <td className="text-xs text-slate-500">{u.correo}</td>
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
                                                {activo ? "Activo" : "Bloqueado"}
                                            </span>
                                        </td>
                                        <td className="text-xs text-slate-500">{u.ultimoAcceso}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button className="btn-mini" onClick={() => setDetalle(u)}>
                                                    Ver
                                                </button>
                                                {u.username !== "admin" && (
                                                    <>
                                                        <button
                                                            className="btn-mini sec"
                                                            onClick={() => handleToggleEstado(u)}
                                                        >
                                                            {activo ? "Bloquear" : "Desbloquear"}
                                                        </button>
                                                        <button
                                                            className="btn-mini text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                            onClick={() => handleEliminar(u)}
                                                            title="Eliminar usuario"
                                                        >
                                                            ✕
                                                        </button>
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
                <div className="modal-fondo">
                    <div className="modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>{detalle.nombreCompleto}</h2>
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
                                <dt className="text-slate-500 font-medium">Correo Electrónico (3FN)</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">{detalle.correo}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Teléfono (3FN)</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-xs">{detalle.telefono}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                                <dt className="text-slate-500 font-medium">Rol en Sistema</dt>
                                <dd>
                                    <span className={`badge rol-${detalle.rol.toLowerCase()}`}>{detalle.rol}</span>
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                                <dt className="text-slate-500 font-medium">Estado</dt>
                                <dd>
                                    <span className={`badge ${!detalle.bloqueado ? "ok" : "off"}`}>
                                        {!detalle.bloqueado ? "Activo" : "Bloqueado"}
                                    </span>
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
                <div className="modal-fondo">
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo Usuario</h2>
                                <p className="text-xs text-slate-500">Crea un operador de almacén o administrador en PostgreSQL.</p>
                            </div>
                            <button className="modal-cerrar" onClick={() => setModalCrear(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCrearUsuario} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Nombre de Usuario *
                                    </label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="ej: almacen2, supervisor"
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
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Rol *
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                                        value={nuevoForm.rol}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, rol: e.target.value })}
                                    >
                                        <option value="ALMACEN">ALMACEN (Operador logístico y kardex)</option>
                                        <option value="ADMINISTRADOR">ADMINISTRADOR (Acceso total)</option>
                                        <option value="OPERADOR">OPERADOR (Gestión operativa)</option>
                                        <option value="CLIENTE">CLIENTE (Comprador)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Correo Electrónico (3FN)
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="ej: usuario@techstore.com"
                                        value={nuevoForm.correo}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, correo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Nombres (Datos Personales 3FN)
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Nombres"
                                        value={nuevoForm.nombres}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, nombres: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Apellidos
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Apellidos"
                                        value={nuevoForm.apellidos}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, apellidos: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
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
                                    {guardando ? "Guardando en PostgreSQL..." : "Crear Usuario"}
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
