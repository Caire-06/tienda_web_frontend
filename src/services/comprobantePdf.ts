import type { jsPDF } from "jspdf";
import {
    etiquetaMetodoPago,
    etiquetaTipoEntrega,
    formatearFechaHora,
    obtenerSerieComprobante,
    type Pedido,
} from "../data/pedidos";

interface JsPdfConAutoTable extends jsPDF {
    lastAutoTable?: { finalY?: number };
}

const EMISOR = {
    razonSocial: "TECHSTORE PERÚ S.A.C.",
    ruc: "20601234567",
    direccion: "Av. Próceres de la Independencia 2450, San Juan de Lurigancho, Lima",
    contacto: "Tel: +51 999 888 777  |  contacto@techstore.com",
};

const UNIDADES = [
    "",
    "UN",
    "DOS",
    "TRES",
    "CUATRO",
    "CINCO",
    "SEIS",
    "SIETE",
    "OCHO",
    "NUEVE",
    "DIEZ",
    "ONCE",
    "DOCE",
    "TRECE",
    "CATORCE",
    "QUINCE",
    "DIECISEIS",
    "DIECISIETE",
    "DIECIOCHO",
    "DIECINUEVE",
    "VEINTE",
];

const DECENAS = [
    "",
    "",
    "VEINTI",
    "TREINTA",
    "CUARENTA",
    "CINCUENTA",
    "SESENTA",
    "SETENTA",
    "OCHENTA",
    "NOVENTA",
];

const CENTENAS = [
    "",
    "CIENTO",
    "DOSCIENTOS",
    "TRESCIENTOS",
    "CUATROCIENTOS",
    "QUINIENTOS",
    "SEISCIENTOS",
    "SETECIENTOS",
    "OCHOCIENTOS",
    "NOVECIENTOS",
];

function convertirMenorAMil(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    const c = Math.floor(n / 100);
    const resto = n % 100;
    const partes: string[] = [];
    if (c > 0) partes.push(CENTENAS[c]);

    if (resto > 0) {
        if (resto <= 20) {
            partes.push(UNIDADES[resto]);
        } else if (resto < 30) {
            partes.push(`VEINTI${UNIDADES[resto - 20]}`);
        } else {
            const d = Math.floor(resto / 10);
            const u = resto % 10;
            partes.push(u > 0 ? `${DECENAS[d]} Y ${UNIDADES[u]}` : DECENAS[d]);
        }
    }
    return partes.join(" ");
}

function numeroALetrasSoles(monto: number): string {
    const seguro = Math.max(0, Number.isFinite(monto) ? monto : 0);
    const entero = Math.floor(seguro);
    const centavos = Math.round((seguro - entero) * 100);
    const centavosStr = String(centavos === 100 ? 0 : centavos).padStart(2, "0");

    if (entero === 0) return `SON: CERO CON ${centavosStr}/100 SOLES`;

    const miles = Math.floor(entero / 1000);
    const resto = entero % 1000;
    const segmentos: string[] = [];

    if (miles === 1) {
        segmentos.push("MIL");
    } else if (miles > 1 && miles < 1000) {
        segmentos.push(`${convertirMenorAMil(miles)} MIL`);
    } else if (miles >= 1000) {
        segmentos.push(String(entero));
    }

    if (resto > 0 && miles < 1000) {
        segmentos.push(convertirMenorAMil(resto));
    }

    return `SON: ${segmentos.join(" ")} CON ${centavosStr}/100 SOLES`;
}

/** Dibuja un patrón visual estilo QR determinístico para simular el código SUNAT. */
function dibujarQrSimulado(doc: jsPDF, x: number, y: number, size: number, semillaTexto: string) {
    const grid = 15;
    const mod = size / grid;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x - 1.5, y - 1.5, size + 3, size + 3, 1.5, 1.5, "FD");

    let hash = 2166136261;
    for (let i = 0; i < semillaTexto.length; i++) {
        hash ^= semillaTexto.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    const esFinder = (r: number, c: number) =>
        (r < 5 && c < 5) || (r < 5 && c >= grid - 5) || (r >= grid - 5 && c < 5);

    doc.setFillColor(15, 23, 42);
    for (let r = 0; r < grid; r++) {
        for (let c = 0; c < grid; c++) {
            if (esFinder(r, c)) continue;
            const bit = ((hash >>> ((r * grid + c) % 24)) ^ (r * 7 + c * 13)) & 1;
            if (bit === 1) {
                doc.rect(x + c * mod, y + r * mod, mod * 0.92, mod * 0.92, "F");
            }
        }
    }

    const dibujarEsquina = (ox: number, oy: number) => {
        doc.setFillColor(15, 23, 42);
        doc.rect(ox, oy, mod * 4.6, mod * 4.6, "F");
        doc.setFillColor(255, 255, 255);
        doc.rect(ox + mod * 0.85, oy + mod * 0.85, mod * 2.9, mod * 2.9, "F");
        doc.setFillColor(15, 23, 42);
        doc.rect(ox + mod * 1.6, oy + mod * 1.6, mod * 1.4, mod * 1.4, "F");
    };

    dibujarEsquina(x, y);
    dibujarEsquina(x + (grid - 4.6) * mod, y);
    dibujarEsquina(x, y + (grid - 4.6) * mod);
}

/**
 * Genera y descarga en el navegador una Boleta o Factura Electrónica simulada en PDF
 * utilizando los datos del pedido y del comprobante registrado.
 */
export async function descargarComprobantePdf(pedido: Pedido): Promise<void> {
    const [{ jsPDF: JsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);

    const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPdfConAutoTable;
    const { serie, tipo } = obtenerSerieComprobante(pedido);
    const esFactura = tipo === "FACTURA";

    const total = Number(pedido.comprobante?.total ?? pedido.total ?? 0);
    const opGravada = Number(
        pedido.comprobante?.subtotal ?? Math.round((total / 1.18) * 100) / 100
    );
    const igv = Number(
        pedido.comprobante?.igv ?? Math.round((total - opGravada) * 100) / 100
    );

    const receptor =
        pedido.comprobante?.nombreRazonSocial || pedido.cliente || "Cliente General";
    const documento = pedido.comprobante?.documento || "00000000";
    const direccionReceptor =
        pedido.comprobante?.direccion ||
        (pedido.tipoEntrega === "recojo"
            ? "Recojo en tienda (SJL)"
            : "San Juan de Lurigancho, Lima");

    // Franja superior corporativa
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 6, "F");

    // Datos del emisor (izquierda)
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TechStore", 14, 20);

    doc.setFontSize(9.5);
    doc.setTextColor(37, 99, 235);
    doc.text(EMISOR.razonSocial, 14, 26);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(EMISOR.direccion, 14, 31.5);
    doc.text(EMISOR.contacto, 14, 36.5);

    // Recuadro oficial SUNAT (derecha)
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.6);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(130, 12, 66, 28, 2.5, 2.5, "FD");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(`R.U.C. ${EMISOR.ruc}`, 163, 18.5, { align: "center" });

    doc.setFillColor(37, 99, 235);
    doc.rect(130, 21, 66, 8.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text(
        esFactura ? "FACTURA ELECTRONICA" : "BOLETA DE VENTA ELECTRONICA",
        163,
        26.5,
        { align: "center" }
    );

    doc.setTextColor(15, 23, 42);
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text(serie, 163, 36.2, { align: "center" });

    // Datos del receptor y operación
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 45, 182, 31, 2, 2, "FD");

    doc.setFontSize(8.5);
    const escribirDato = (etiqueta: string, valor: string, x: number, y: number, anchoMax: number) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(etiqueta, x, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        const recorte = doc.splitTextToSize(valor, anchoMax);
        doc.text(recorte[0] || "—", x + 28, y);
    };

    escribirDato("Cliente:", receptor, 18, 51.5, 76);
    escribirDato(esFactura ? "RUC:" : "DNI:", documento, 18, 57.5, 76);
    escribirDato("Dirección:", direccionReceptor, 18, 63.5, 76);
    escribirDato("Entrega:", etiquetaTipoEntrega(pedido.tipoEntrega), 18, 69.5, 76);

    escribirDato("Emisión:", formatearFechaHora(pedido.fecha), 118, 51.5, 48);
    escribirDato("N° Pedido:", pedido.numero, 118, 57.5, 48);
    escribirDato("Moneda:", "SOLES (PEN)", 118, 63.5, 48);
    escribirDato("Pago:", etiquetaMetodoPago(pedido.metodoPago), 118, 69.5, 48);

    // Tabla de detalle de productos
    const filas = pedido.items.map((item, idx) => {
        const precioUnit = Number(item.precio);
        const importe = precioUnit * item.cantidad;
        return [
            String(idx + 1),
            item.nombre,
            String(item.cantidad),
            `S/ ${precioUnit.toFixed(2)}`,
            `S/ ${importe.toFixed(2)}`,
        ];
    });

    if (pedido.costoEnvio && Number(pedido.costoEnvio) > 0) {
        const envioNum = Number(pedido.costoEnvio);
        filas.push([
            String(filas.length + 1),
            `Servicio de envío - ${etiquetaTipoEntrega(pedido.tipoEntrega)}`,
            "1",
            `S/ ${envioNum.toFixed(2)}`,
            `S/ ${envioNum.toFixed(2)}`,
        ]);
    }

    autoTable(doc, {
        startY: 81,
        margin: { left: 14, right: 14 },
        head: [["#", "Descripción", "Cant.", "P. Unit.", "Importe"]],
        body: filas,
        theme: "grid",
        styles: {
            font: "helvetica",
            fontSize: 8.5,
            cellPadding: 3,
            textColor: [30, 41, 59],
            lineColor: [226, 232, 240],
            lineWidth: 0.25,
        },
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "left",
        },
        columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: "auto" },
            2: { cellWidth: 16, halign: "center" },
            3: { cellWidth: 28, halign: "right" },
            4: { cellWidth: 30, halign: "right", fontStyle: "bold" },
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
    });

    const yTabla = doc.lastAutoTable?.finalY ?? 140;
    let yBloqueTotales = yTabla + 8;
    if (yBloqueTotales > 225) {
        doc.addPage();
        yBloqueTotales = 20;
    }

    // Importe en letras y operación (izquierda)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const letrasLineas = doc.splitTextToSize(numeroALetrasSoles(total), 108);
    doc.text(letrasLineas, 14, yBloqueTotales + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    let yExtra = yBloqueTotales + 5 + letrasLineas.length * 4.5 + 2;
    if (pedido.estadoPago) {
        doc.text(`Estado de pago: ${pedido.estadoPago}`, 14, yExtra);
        yExtra += 4.5;
    }
    if (pedido.codigoOperacionPago) {
        doc.text(`Referencia / Nro. Operación: ${pedido.codigoOperacionPago}`, 14, yExtra);
    }

    // Totales tributarios (derecha)
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(130, yBloqueTotales, 66, 26, 2, 2, "FD");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Op. Gravada:", 134, yBloqueTotales + 6.5);
    doc.text(`S/ ${opGravada.toFixed(2)}`, 192, yBloqueTotales + 6.5, { align: "right" });

    doc.text("I.G.V. (18%):", 134, yBloqueTotales + 12.5);
    doc.text(`S/ ${igv.toFixed(2)}`, 192, yBloqueTotales + 12.5, { align: "right" });

    doc.setDrawColor(203, 213, 225);
    doc.line(134, yBloqueTotales + 15.5, 192, yBloqueTotales + 15.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text("IMPORTE TOTAL:", 134, yBloqueTotales + 21.8);
    doc.text(`S/ ${total.toFixed(2)}`, 192, yBloqueTotales + 21.8, { align: "right" });

    // Pie con QR simulado y nota académica
    const yPie = Math.max(yBloqueTotales + 36, 245);
    dibujarQrSimulado(doc, 15.5, yPie, 24, `${EMISOR.ruc}|${serie}|${total.toFixed(2)}|${documento}`);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Representación impresa de Comprobante Electrónico", 46, yPie + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
        "Comprobante simulado generado en el sistema TechStore para fines académicos y demostración.",
        46,
        yPie + 10.5
    );
    doc.text("Documento sin validez tributaria ante SUNAT.", 46, yPie + 15);
    doc.setFont("courier", "normal");
    doc.text(`Hash Ref.: ${serie} | ${documento} | S/ ${total.toFixed(2)}`, 46, yPie + 20.5);

    doc.save(`${serie}.pdf`);
}
