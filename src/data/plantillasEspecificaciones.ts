/**
 * Catálogo de plantillas estandarizadas de especificaciones técnicas por categoría.
 * 
 * Cumple con la Tercera Forma Normal (3FN):
 * - Los valores son atómicos y consistentes ("8 GB", "5000 mAh", "Bluetooth 5.3").
 * - Se elimina la dispersión y la inconsistencia tipográfica de texto libre.
 * - Habilita filtros exactos en la tienda virtual mediante SELECT DISTINCT.
 */

export interface CampoPlantilla {
    caracteristica: string;
    tipo: "select" | "number" | "text";
    opciones?: string[];
    sufijo?: string; // ej. "mAh", "horas", "W"
    placeholder?: string;
    sugeridoPorDefecto?: string;
}

export interface PlantillaCategoria {
    categoria: string;
    campos: CampoPlantilla[];
}

export const PLANTILLAS_ESPECIFICACIONES: Record<string, CampoPlantilla[]> = {
    Smartphones: [
        {
            caracteristica: "Memoria RAM",
            tipo: "select",
            opciones: ["4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "24 GB"],
            sugeridoPorDefecto: "8 GB",
        },
        {
            caracteristica: "Almacenamiento Interno",
            tipo: "select",
            opciones: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"],
            sugeridoPorDefecto: "256 GB",
        },
        {
            caracteristica: "Capacidad de Batería",
            tipo: "number",
            sufijo: "mAh",
            placeholder: "ej. 5000",
            sugeridoPorDefecto: "5000 mAh",
        },
        {
            caracteristica: "Tipo y Tasa de Pantalla",
            tipo: "select",
            opciones: [
                "6.1\" Super Retina XDR",
                "6.4\" AMOLED 90Hz",
                "6.67\" AMOLED 120Hz",
                "6.7\" Dynamic AMOLED 2X 120Hz",
                "6.8\" QHD+ AMOLED 120Hz",
            ],
            sugeridoPorDefecto: "6.67\" AMOLED 120Hz",
        },
        {
            caracteristica: "Conectividad Móvil",
            tipo: "select",
            opciones: ["5G Dual SIM", "5G + eSIM", "4G LTE Dual SIM"],
            sugeridoPorDefecto: "5G Dual SIM",
        },
        {
            caracteristica: "Potencia de Carga Rápida",
            tipo: "select",
            opciones: ["25W", "33W", "45W", "67W", "120W"],
            sugeridoPorDefecto: "45W",
        },
    ],
    Audio: [
        {
            caracteristica: "Tipo de Diseño",
            tipo: "select",
            opciones: ["In-Ear (Intraural)", "On-Ear (Supraural)", "Over-Ear (Diadema)", "Parlante Portátil"],
            sugeridoPorDefecto: "Over-Ear (Diadema)",
        },
        {
            caracteristica: "Conectividad Principal",
            tipo: "select",
            opciones: [
                "Bluetooth 5.3",
                "Bluetooth 5.2",
                "Inalámbrico RF 2.4GHz + Bluetooth",
                "Cable Jack 3.5mm",
                "USB Type-C",
            ],
            sugeridoPorDefecto: "Bluetooth 5.3",
        },
        {
            caracteristica: "Cancelación Activa de Ruido",
            tipo: "select",
            opciones: ["Sí (ANC Activa)", "Cancelación Pasiva", "No"],
            sugeridoPorDefecto: "Sí (ANC Activa)",
        },
        {
            caracteristica: "Autonomía de Batería",
            tipo: "number",
            sufijo: "horas",
            placeholder: "ej. 30",
            sugeridoPorDefecto: "30 horas",
        },
        {
            caracteristica: "Micrófono Integrado",
            tipo: "select",
            opciones: [
                "Integrado con Reducción de Ruido (ENC)",
                "Micrófono Desmontable Gamer",
                "Integrado Estándar",
                "No Incluye",
            ],
            sugeridoPorDefecto: "Integrado con Reducción de Ruido (ENC)",
        },
        {
            caracteristica: "Resistencia al Agua",
            tipo: "select",
            opciones: ["IPX4 (Salpicaduras y Sudor)", "IP54 (Polvo y Salpicaduras)", "IPX7 (Sumergible)", "No Certificada"],
            sugeridoPorDefecto: "IPX4 (Salpicaduras y Sudor)",
        },
    ],
    Laptops: [
        {
            caracteristica: "Tipo de Laptop",
            tipo: "select",
            opciones: ["Laptop Ultrabook", "Laptop Gamer", "Laptop para Trabajo / Oficina", "Laptop 2 en 1 Convertible"],
            sugeridoPorDefecto: "Laptop Ultrabook",
        },
        {
            caracteristica: "Memoria RAM",
            tipo: "select",
            opciones: ["8 GB DDR4", "16 GB DDR4", "16 GB DDR5", "32 GB DDR5", "64 GB DDR5"],
            sugeridoPorDefecto: "16 GB DDR5",
        },
        {
            caracteristica: "Almacenamiento SSD",
            tipo: "select",
            opciones: ["512 GB SSD NVMe", "1 TB SSD NVMe M.2", "2 TB SSD NVMe", "256 GB SSD"],
            sugeridoPorDefecto: "512 GB SSD NVMe",
        },
        {
            caracteristica: "Procesador",
            tipo: "select",
            opciones: [
                "Intel Core i5 (13va Gen)",
                "Intel Core i7 (13va Gen)",
                "Intel Core i7 (14va Gen)",
                "AMD Ryzen 5 Serie 7000",
                "AMD Ryzen 7 Serie 7000/8000",
                "Apple Chip M2",
                "Apple Chip M3",
            ],
            sugeridoPorDefecto: "Intel Core i7 (13va Gen)",
        },
        {
            caracteristica: "Tarjeta Gráfica",
            tipo: "select",
            opciones: [
                "Gráficos Integrados Intel Iris Xe / AMD Radeon",
                "NVIDIA GeForce RTX 3050 4GB",
                "NVIDIA GeForce RTX 4050 6GB",
                "NVIDIA GeForce RTX 4060 8GB",
                "NVIDIA GeForce RTX 4070 8GB",
            ],
            sugeridoPorDefecto: "Gráficos Integrados Intel Iris Xe / AMD Radeon",
        },
        {
            caracteristica: "Pantalla y Tasa de Refresco",
            tipo: "select",
            opciones: [
                "14.0\" FHD IPS 60Hz",
                "15.6\" FHD IPS 144Hz",
                "15.6\" OLED 120Hz",
                "16.0\" QHD IPS 165Hz",
            ],
            sugeridoPorDefecto: "15.6\" FHD IPS 144Hz",
        },
        {
            caracteristica: "Sistema Operativo",
            tipo: "select",
            opciones: ["Windows 11 Home", "Windows 11 Pro", "macOS", "Sin Sistema Operativo (FreeDOS)"],
            sugeridoPorDefecto: "Windows 11 Home",
        },
        {
            caracteristica: "Autonomía de Batería",
            tipo: "number",
            sufijo: "horas",
            placeholder: "ej. 10",
            sugeridoPorDefecto: "10 horas",
        },
    ],
    Periféricos: [
        {
            caracteristica: "Tipo de Periférico",
            tipo: "select",
            opciones: ["Mouse Gamer", "Teclado Mecánico", "Teclado de Membrana", "Webcam FHD", "Micrófono USB Gamer"],
            sugeridoPorDefecto: "Mouse Gamer",
        },
        {
            caracteristica: "Conexión",
            tipo: "select",
            opciones: [
                "Alámbrico USB",
                "Inalámbrico Bluetooth + RF 2.4GHz",
                "Inalámbrico RF 2.4GHz Dongle",
                "USB Type-C Desmontable",
            ],
            sugeridoPorDefecto: "Alámbrico USB",
        },
        {
            caracteristica: "Sensor / Switches",
            tipo: "select",
            opciones: [
                "Sensor Óptico 25K DPI HERO",
                "Sensor Óptico 8000 DPI",
                "Switches Mecánicos Red (Lineal Silencioso)",
                "Switches Mecánicos Blue (Clicky)",
                "Switches Mecánicos Brown (Táctil)",
                "No Aplica",
            ],
            sugeridoPorDefecto: "Sensor Óptico 25K DPI HERO",
        },
        {
            caracteristica: "Iluminación",
            tipo: "select",
            opciones: ["RGB Programable", "Luz Blanca Fija", "Sin Iluminación"],
            sugeridoPorDefecto: "RGB Programable",
        },
    ],
    Accesorios: [
        {
            caracteristica: "Tipo de Accesorio",
            tipo: "select",
            opciones: [
                "Cargador de Pared GaN Rápido",
                "Cable USB-C a USB-C",
                "Cable USB-C a Lightning",
                "Hub USB-C Multi-puerto (HDMI/USB/LAN)",
                "Soporte Ergonómico para Laptop",
                "Power Bank Batería Externa",
            ],
            sugeridoPorDefecto: "Cargador de Pared GaN Rápido",
        },
        {
            caracteristica: "Potencia / Salida",
            tipo: "select",
            opciones: ["20W", "30W", "65W GaN", "100W GaN", "140W GaN", "No Aplica"],
            sugeridoPorDefecto: "65W GaN",
        },
        {
            caracteristica: "Longitud o Capacidad",
            tipo: "select",
            opciones: ["1.0 metro", "1.8 metros", "2.0 metros", "10000 mAh", "20000 mAh", "No Aplica"],
            sugeridoPorDefecto: "1.0 metro",
        },
        {
            caracteristica: "Material de Fabricación",
            tipo: "select",
            opciones: ["Nylon Trenzado Reforzado", "Aleación de Aluminio", "Plástico ABS Ignífugo", "Silicona Soft-Touch"],
            sugeridoPorDefecto: "Aleación de Aluminio",
        },
    ],
};

// Aliases para compatibilidad con nombres históricos de categoría
PLANTILLAS_ESPECIFICACIONES["Computadoras"] = PLANTILLAS_ESPECIFICACIONES["Laptops"];

/**
 * Obtiene la plantilla para una categoría dada o una lista por defecto si no existe.
 */
export function obtenerCamposPlantilla(categoria: string): CampoPlantilla[] {
    if (categoria === "Computadoras" || categoria === "Laptops") {
        return PLANTILLAS_ESPECIFICACIONES["Laptops"];
    }
    return PLANTILLAS_ESPECIFICACIONES[categoria] ?? PLANTILLAS_ESPECIFICACIONES["Accesorios"];
}

/**
 * Genera el arreglo inicial de especificaciones con valores canónicos para una categoría dada.
 */
export function generarEspecificacionesPorDefecto(categoria: string) {
    const campos = obtenerCamposPlantilla(categoria);
    return campos.map((c) => ({
        caracteristica: c.caracteristica,
        valor: c.sugeridoPorDefecto ?? (c.opciones ? c.opciones[0] : ""),
    }));
}
