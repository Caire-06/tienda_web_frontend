// Precios en SOLES (S/) verificados en Falabella Perú – sep 2026.
// Imágenes locales en public/productos (sirven en dev y en build).
// Cuando tengas backend, reemplaza PRODUCTOS por un fetch a tu API.

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number; // en soles peruanos
  stock: number;
  vendidos: number;
  imagen: string;
  descripcion: string;
}

export const CATEGORIAS = [
  { nombre: "Smartphones", icon: "smartphone" },
  { nombre: "Audio", icon: "audio" },
  { nombre: "Periféricos", icon: "perifericos" },
  { nombre: "Laptops", icon: "laptops" },
  { nombre: "Accesorios", icon: "accesorios" },
];

export const PRODUCTOS: Producto[] = [
  {
    id: 1,
    nombre: "Mouse Logitech G502 HERO",
    categoria: "Periféricos",
    precio: 229,
    stock: 20,
    vendidos: 38,
    imagen: "/productos/mouse-g502.webp",
    descripcion: "Mouse gamer alámbrico 25K DPI, 11 botones programables.",
  },
  {
    id: 2,
    nombre: "Audífonos Sony WH-1000XM4",
    categoria: "Audio",
    precio: 1049,
    stock: 12,
    vendidos: 45,
    imagen: "/productos/sony-xm4.webp",
    descripcion: "Audífonos bluetooth con noise cancelling, 30h de batería.",
  },
  {
    id: 3,
    nombre: "Teclado Redragon Fizz Pro K616 RGB",
    categoria: "Periféricos",
    precio: 215,
    stock: 0,
    vendidos: 25,
    imagen: "/productos/teclado-redragon.webp",
    descripcion: "Teclado mecánico inalámbrico, RGB, 87 teclas.",
  },
  {
    id: 4,
    nombre: "Laptop Lenovo IdeaPad Slim 3 Ryzen 7 / 16GB / 512GB",
    categoria: "Computadoras",
    precio: 2599,
    stock: 8,
    vendidos: 12,
    imagen: "/productos/lenovo-slim3.webp",
    descripcion: '15.6" FHD, Ryzen 7 serie 5000, 16GB RAM, 512GB SSD.',
  },
  {
    id: 5,
    nombre: "Samsung Galaxy A55 5G 8GB / 128GB",
    categoria: "Smartphones",
    precio: 1481,
    stock: 15,
    vendidos: 30,
    imagen: "/productos/galaxy-a55.webp",
    descripcion: "Pantalla 6.6\" Super AMOLED 120Hz, cámara 50MP, batería 5000mAh.",
  },
  {
    id: 6,
    nombre: "Kit Cargador Xiaomi 65W USB-C",
    categoria: "Accesorios",
    precio: 59,
    stock: 50,
    vendidos: 19,
    imagen: "/productos/cargador-65w.webp",
    descripcion: "Carga rápida 65W con cable USB-C incluido.",
  },
  {
    id: 7,
    nombre: 'Monitor Xiaomi G27Qi 27" 2K 200Hz',
    categoria: "Computadoras",
    precio: 729,
    stock: 6,
    vendidos: 15,
    imagen: "/productos/monitor-xiaomi.webp",
    descripcion: '27" QHD IPS, 200Hz, 1ms, HDR400, FreeSync Gaming.',
  },
  {
    id: 8,
    nombre: "Parlante JBL Flip 7 Bluetooth",
    categoria: "Audio",
    precio: 329,
    stock: 18,
    vendidos: 28,
    imagen: "/productos/jbl-flip7.webp",
    descripcion: "Bluetooth 5.4, resistente al agua IP67, 14h de reproducción.",
  },
];
