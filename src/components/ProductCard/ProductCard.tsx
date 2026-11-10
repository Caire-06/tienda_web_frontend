import { useNavigate } from "react-router-dom";
import type { Producto } from "../../data/productos";
import { useCarrito } from "../../context/CarritoContext";
import { ImagenProducto } from "../ImagenProducto/ImagenProducto";

interface Props {
  producto: Producto;
}

function ProductCard({ producto }: Props) {
  const navigate = useNavigate();
  const { agregar } = useCarrito();
  const agotado = producto.stock === 0;

  const agregarYVerCarrito = () => {
    agregar(producto.id);
    navigate("/carrito");
  };

  return (
    <article
      className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 hover:-translate-y-1 transition-all duration-300 ${
        agotado ? "opacity-75" : ""
      }`}
    >
      <div
        className="relative h-48 cursor-pointer bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden"
        onClick={() => navigate(`/productos/${producto.id}`)}
      >
        <ImagenProducto
          src={producto.imagen}
          alt={producto.nombre}
          loading="lazy"
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
        />
        {agotado && (
          <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Agotado
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-[11px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold">
          {producto.categoria}
        </span>
        <h3
          className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 leading-snug transition-colors"
          onClick={() => navigate(`/productos/${producto.id}`)}
        >
          {producto.nombre}
        </h3>

        <div className="mt-auto pt-2">
          <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            S/ {producto.precio.toLocaleString("es-PE")}
          </span>
          <span
            className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${
              agotado ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {agotado ? "Sin stock" : `${producto.stock} disponibles`}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 h-9 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed disabled:border disabled:border-slate-200 dark:disabled:border-slate-700 shadow-sm"
            disabled={agotado}
            onClick={agregarYVerCarrito}
            title={agotado ? "Sin stock" : "Agregar al carrito"}
          >
            Agregar
          </button>
          <button
            className="flex-1 h-9 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            onClick={() => navigate(`/productos/${producto.id}`)}
          >
            Ver detalle
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
