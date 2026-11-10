import { useNavigate } from "react-router-dom";
import PaginaInformativa from "../../components/PaginaInformativa/PaginaInformativa";

const CUENTAS_BANCARIAS = [
    { banco: "BCP Soles", cuenta: "193-48192039-0-12", cci: "00219300481920390123" },
    { banco: "BBVA Soles", cuenta: "0011-0182-0200481920", cci: "01118200020048192011" },
    { banco: "Interbank Soles", cuenta: "200-3001849102", cci: "00320000300184910245" },
];

function MetodosPago() {
    const navigate = useNavigate();

    return (
        <PaginaInformativa
            etiqueta="Pagos Seguros"
            titulo="Métodos de pago"
            subtitulo="Elige la forma de pago más cómoda al finalizar tu compra. Todas las operaciones se procesan en soles peruanos (S/) e incluyen comprobante electrónico."
            enlacesRelacionados={[
                { etiqueta: "Preguntas frecuentes", ruta: "/preguntas-frecuentes" },
                { etiqueta: "Envíos y entregas", ruta: "/envios-y-entregas" },
            ]}
        >
            {/* Tres medios principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <article className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-2xl" aria-hidden="true">💳</span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            Confirmación inmediata
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Tarjeta de Débito / Crédito
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Aceptamos tarjetas Visa y Mastercard. El pago se valida al instante para pasar directamente a preparación de despacho.
                        </p>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <li>• Datos solicitados: número de tarjeta, vencimiento (MM/AA) y CVV.</li>
                        <li>• No almacenamos tu código de seguridad CVV.</li>
                    </ul>
                </article>

                <article className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-2xl" aria-hidden="true">📱</span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                            Pago móvil QR
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Yape / Plin
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Escanea nuestro QR en caja o envía el monto exacto al número oficial registrado a nombre de <strong>TechStore Perú S.A.C.</strong>
                        </p>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <li>• Número afiliado: <strong className="font-mono text-slate-900 dark:text-white">+51 999 888 777</strong></li>
                        <li>• Nro. de Operación: <strong>6 a 8 dígitos</strong> numéricos.</li>
                        <li>• Yape: código de seguridad de <strong>3 dígitos</strong> (opcional en Plin).</li>
                    </ul>
                </article>

                <article className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-2xl" aria-hidden="true">🏦</span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                            Verificación manual
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Transferencia Bancaria
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Realiza el depósito o transferencia interbancaria y registra el código de operación. El pedido queda en <strong>Pendiente de pago</strong> hasta confirmar el abono.
                        </p>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <li>• El stock se reserva al registrar la operación.</li>
                        <li>• Validación por administración en horario de atención.</li>
                    </ul>
                </article>
            </div>

            {/* Cuentas bancarias */}
            <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Cuentas bancarias oficiales (TechStore Perú S.A.C.)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Verifica siempre que el titular corresponda antes de transferir e ingresa el número de operación exacto en tu carrito.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {CUENTAS_BANCARIAS.map((item) => (
                        <div
                            key={item.banco}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5"
                        >
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {item.banco}
                            </span>
                            <div className="text-xs text-slate-700 dark:text-slate-300">
                                <span className="block text-[11px] text-slate-400">Cuenta</span>
                                <span className="font-mono font-semibold">{item.cuenta}</span>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-300">
                                <span className="block text-[11px] text-slate-400">CCI</span>
                                <span className="font-mono font-semibold">{item.cci}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Comprobantes electrónicos */}
            <section className="rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        Emisión de Boleta y Factura Electrónica
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                        Emitimos boletas con DNI (8 dígitos) y facturas con RUC (11 dígitos) y dirección fiscal, con consulta rápida de contribuyente integrada en la pasarela de pago.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/productos")}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                >
                    Explorar catálogo
                </button>
            </section>
        </PaginaInformativa>
    );
}

export default MetodosPago;

