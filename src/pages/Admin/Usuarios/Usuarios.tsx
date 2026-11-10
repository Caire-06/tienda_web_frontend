import { useState } from "react";
import { CUENTAS_BASE, obtenerEstado, cambiarEstado, cambiarRolRegistrado } from "../../../data/usuarios";
import type { Rol } from "../../../data/usuarios";

interface FilaUsuario {
    id: string;
    nombre: string;
    acceso: string;
    rol: Rol;
    fecha: string;
    fija: boolean; // cuenta demo del sistema
}

function leerRegistrados(): FilaUsuario[] {
    try {
        const datos = JSON.parse(localStorage.getItem("techstore-usuarios") ?? "[]");
        if (!Array.isArray(datos)) return [];
        return datos.map((u: { nombre: string; correo: string; fechaRegistro?: string; rol?: Rol }) => ({
            id: u.correo,
            nombre: u.nombre,
            acceso: u.correo,
            rol: u.rol ?? "cliente",
            fecha: u.fechaRegistro ?? "—",
            fija: false,
        }));
    } catch {
        return [];
    }
}

function Usuarios() {
    // Lista de usuarios (se recarga cada vez que cambia algo)
    const [lista, setLista] = useState<FilaUsuario[]>(() => [...CUENTAS_BASE, ...leerRegistrados()]);
    const [detalle, setDetalle] = useState<FilaUsuario | null>(null);

    const recargar = () => setLista([...CUENTAS_BASE, ...leerRegistrados()]);

    const toggleEstado = (u: FilaUsuario) => {
        const actual = obtenerEstado(u.id);
        cambiarEstado(u.id, actual === "activo" ? "inactivo" : "activo");
        recargar();
    };

    const cambiarRol = (u: FilaUsuario, rol: Rol) => {
        cambiarRolRegistrado(u.acceso, rol);
        recargar();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                <p className="text-sm text-slate-500 mt-1">{lista.length} usuarios registrados en el sistema.</p>
            </div>

            <div className="tabla-wrap">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Correo / Acceso</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map((u) => {
                            const estado = obtenerEstado(u.id);
                            return (
                                <tr key={u.id}>
                                    <td className="font-semibold">{u.nombre}</td>
                                    <td className="font-mono text-xs text-slate-600 dark:text-slate-400">{u.acceso}</td>
                                    <td>
                                        {u.fija || u.id === "admin" ? (
                                            <span className={`badge rol-${u.rol}`}>{u.rol}</span>
                                        ) : (
                                            <select
                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                value={u.rol}
                                                onChange={(e) => cambiarRol(u, e.target.value as Rol)}
                                            >
                                                <option value="cliente">cliente</option>
                                                <option value="almacen">almacen</option>
                                                <option value="admin">admin</option>
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${estado === "activo" ? "ok" : "off"}`}>
                                            {estado === "activo" ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                    <td className="text-xs text-slate-500">{u.fecha}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <button className="btn-mini" onClick={() => setDetalle(u)}>Ver</button>
                                            {u.id !== "admin" && (
                                                <button className="btn-mini sec" onClick={() => toggleEstado(u)}>
                                                    {estado === "activo" ? "Desactivar" : "Activar"}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {detalle && (
                <div className="modal-fondo">
                    <div className="modal-chico" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>{detalle.nombre}</h2>
                            <button className="modal-cerrar" onClick={() => setDetalle(null)}>✕</button>
                        </div>
                        <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Acceso / Correo</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white font-mono text-xs">{detalle.acceso}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                                <dt className="text-slate-500 font-medium">Rol</dt>
                                <dd><span className={`badge rol-${detalle.rol}`}>{detalle.rol}</span></dd>
                            </div>
                            <div className="py-2.5 flex justify-between items-center">
                                <dt className="text-slate-500 font-medium">Estado</dt>
                                <dd>
                                    <span className={`badge ${obtenerEstado(detalle.id) === "activo" ? "ok" : "off"}`}>
                                        {obtenerEstado(detalle.id)}
                                    </span>
                                </dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Registro</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">{detalle.fecha}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between">
                                <dt className="text-slate-500 font-medium">Tipo</dt>
                                <dd className="text-xs text-slate-600 dark:text-slate-400">
                                    {detalle.fija ? "Cuenta demo del sistema" : "Registrado en tienda"}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Usuarios;
