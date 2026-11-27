import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import * as XLSX from 'xlsx';
import { apiUrl } from '../../../config/api';
import { listarMovimientos } from '../../../services/kardexApi';
import { formatoImporte } from '../../../utils/formatoImporte';
import type { Movimiento } from '../../../context/InventarioContext';

export type TipoAnalitico = 'valorizacion' | 'ventasPeriodo';
type Producto = {id:number; nombre:string; categoria:string; stock:number};
type Pedido = {numero:string; fecha:string; cliente:string; estado:string; estadoPago:string; total:number};
type Grupo = 'dia'|'semana'|'mes'|'anio';
const importe = (n:number) => `S/ ${formatoImporte(n)}`;
const hoy = () => new Date().toLocaleDateString('en-CA', {timeZone:'America/Lima'});
const campo = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm';
const panel = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3';
async function consulta<T>(token:string, ruta:string):Promise<T> {
    const res = await fetch(apiUrl(ruta), {headers:{Authorization:`Bearer ${token}`}});
    if (!res.ok) throw new Error(`No se pudo consultar ${ruta} (${res.status}).`);
    return res.json();
}
export function periodoDe(fecha:string, grupo:Grupo):string {
    const dia = fecha.slice(0,10);
    if (grupo === 'dia') return dia;
    if (grupo === 'mes') return dia.slice(0,7);
    if (grupo === 'anio') return dia.slice(0,4);
    const d = new Date(`${dia}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay()+6)%7));
    return d.toISOString().slice(0,10);
}
function Grafico({opciones}:{opciones:echarts.EChartsOption}) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const chart = echarts.init(ref.current);
        const dibujar = () => {
            const oscuro = document.documentElement.classList.contains('dark');
            chart.setOption({...opciones, textStyle:{color:oscuro?'#cbd5e1':'#475569'}}, true);
        };
        dibujar();
        const resize = new ResizeObserver(() => chart.resize());
        resize.observe(ref.current);
        const tema = new MutationObserver(dibujar);
        tema.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
        return () => {resize.disconnect(); tema.disconnect(); chart.dispose();};
    },[opciones]);
    return <div ref={ref} className="w-full" style={{height:340}} role="img" aria-label="Gráfico del reporte; los valores completos se muestran en la tabla inferior"/>;
}
function exportar(nombre:string, hojas:Record<string,(string|number|null)[][]>) {
    const libro = XLSX.utils.book_new();
    for (const [titulo,datos] of Object.entries(hojas)) {
        const hoja = XLSX.utils.aoa_to_sheet(datos);
        hoja['!cols'] = (datos[0] || []).map((_,i)=>({wch:datos.reduce((ancho,f)=>Math.min(55,Math.max(ancho,String(f[i]??'').length+2)),15)}));
        XLSX.utils.book_append_sheet(libro,hoja,titulo);
    }
    XLSX.writeFile(libro,`TechStore_${nombre}_${hoy()}.xlsx`);
}
export default function ReportesAnaliticos({tipo,token}:{tipo:TipoAnalitico;token:string|null|undefined}) {
    const [movs,setMovs] = useState<Movimiento[]>([]);
    const [productos,setProductos] = useState<Producto[]>([]);
    const [pedidos,setPedidos] = useState<Pedido[]>([]);
    const [corte,setCorte] = useState(hoy);
    const [desde,setDesde] = useState(()=>hoy().slice(0,7)+'-01');
    const [hasta,setHasta] = useState(hoy);
    const [grupo,setGrupo] = useState<Grupo>('dia');
    const [categoria,setCategoria] = useState('');
    const [producto,setProducto] = useState('');
    const [cargando,setCargando] = useState(true);
    const [error,setError] = useState('');
    const [revision,setRevision] = useState(0);
    useEffect(()=>{
        let vigente=true;
        setCargando(true);setError('');
        if (!token) {setError('Inicia sesión para consultar el reporte.');setCargando(false);return;}
        (async()=>{
            if(tipo==='valorizacion') {
                const [m,p]=await Promise.all([listarMovimientos(token),consulta<{filas:Producto[]}>(token,'/api/admin/reportes/inventario')]);
                if(!Array.isArray(p.filas)) throw new Error('El catálogo no devolvió un listado válido.');
                if(vigente){setMovs(m);setProductos(p.filas);}
            } else {
                const p=await consulta<Pedido[]>(token,'/api/pedidos');
                if(!Array.isArray(p)) throw new Error('El servicio no devolvió un listado de pedidos válido.');
                if(vigente)setPedidos(p);
            }
        })().catch(e=>{if(vigente)setError(e instanceof Error?e.message:'No se pudo cargar el reporte.');}).finally(()=>{if(vigente)setCargando(false);});
        return ()=>{vigente=false;};
    },[tipo,token,revision]);
    const categorias = [...new Set(productos.map(p=>p.categoria||'Sin categoría'))].sort();
    const inventario = useMemo(()=>{
        // El backend devuelve el Kardex en orden descendente, ya valorizado cronológicamente.
        const ultimos = new Map<number,Movimiento>();
        const inconsistentes = new Set<number>();
        for(const m of movs){
            if(m.fecha.slice(0,10)>corte)continue;
            const id=Number(m.productoId);
            if(!ultimos.has(id))ultimos.set(id,m);
            if(m.inconsistente)inconsistentes.add(id);
        }
        const catalogo=new Map(productos.map(p=>[Number(p.id),p]));
        for(const [id,m] of ultimos) if(!catalogo.has(id))catalogo.set(id,{id,nombre:m.producto,categoria:'Sin categoría',stock:0});
        return [...catalogo.entries()].filter(([id,p])=>(!categoria||(p.categoria||'Sin categoría')===categoria)&&(!producto||String(id)===producto)).map(([id,p])=>{
            const m=ultimos.get(id);
            const stock=Number(m?.stockNuevo??0);
            const valor=Number(m?.saldoValorNuevo??0);
            const alerta=inconsistentes.has(id)||stock<0||(corte===hoy()&&stock!==Number(p.stock));
            return {id,nombre:p.nombre,categoria:p.categoria||'Sin categoría',stock,costo:Number(m?.saldoPromedio??0),valor,alerta};
        }).sort((a,b)=>b.valor-a.valor||a.nombre.localeCompare(b.nombre));
    },[movs,productos,corte,categoria,producto]);
    const ventas = useMemo(()=>pedidos.filter(p=>p.estado?.toLowerCase()==='entregado'&&p.estadoPago?.toLowerCase()==='pagado'&&/^\d{4}-\d{2}-\d{2}/.test(p.fecha)&&p.fecha.slice(0,10)>=desde&&p.fecha.slice(0,10)<=hasta).sort((a,b)=>a.fecha.localeCompare(b.fecha)),[pedidos,desde,hasta]);
    const periodos=useMemo(()=>{
        const mapa=new Map<string,{periodo:string; cantidad:number; total:number}>();
        for(const p of ventas){const k=periodoDe(p.fecha,grupo);const f=mapa.get(k)??{periodo:k,cantidad:0,total:0};f.cantidad++;f.total+=Number(p.total);mapa.set(k,f);}
        return [...mapa.values()].sort((a,b)=>a.periodo.localeCompare(b.periodo));
    },[ventas,grupo]);
    const totalInv=inventario.reduce((a,p)=>a+p.valor,0);
    const totalStock=inventario.reduce((a,p)=>a+p.stock,0);
    const totalVentas=ventas.reduce((a,p)=>a+Number(p.total),0);
    const esInv=tipo==='valorizacion';
    const invalido=esInv?!corte||corte>hoy():!desde||!hasta||desde>hasta||hasta>hoy();
    const opciones=useMemo<echarts.EChartsOption>(()=>esInv?{
        tooltip:{trigger:'axis',valueFormatter:v=>importe(Number(v))},grid:{left:12,right:35,top:15,bottom:25,containLabel:true},
        xAxis:{type:'value',axisLabel:{formatter:v=>formatoImporte(Number(v))}},
        yAxis:{type:'category',inverse:true,data:inventario.slice(0,10).map(p=>p.nombre),axisLabel:{width:155,overflow:'truncate'}},
        series:[{type:'bar',data:inventario.slice(0,10).map(p=>p.valor),itemStyle:{color:'#2563eb'},barMaxWidth:32}]
    }:{tooltip:{trigger:'axis',valueFormatter:v=>importe(Number(v))},grid:{left:15,right:25,top:20,bottom:45,containLabel:true},
        xAxis:{type:'category',data:periodos.map(p=>p.periodo),axisLabel:{rotate:25}},yAxis:{type:'value',axisLabel:{formatter:v=>formatoImporte(Number(v))}},
        series:[{type:'line',data:periodos.map(p=>p.total),symbol:'circle',itemStyle:{color:'#2563eb'},areaStyle:{opacity:.08}}]
    },[esInv,inventario,periodos]);
    const descargar=()=>{
        if(esInv)exportar('Valorizacion',{'Resumen':[['Fecha de corte',corte],['Categoría',categoria||'Todas'],['Producto',productos.find(p=>String(p.id)===producto)?.nombre||'Todos'],['Unidades',totalStock],['Valor al costo (S/)',totalInv]],'Inventario':[['Producto','Categoría','Stock según Kardex','Costo promedio (S/)','Valor (S/)','Revisar'],...inventario.map(p=>[p.nombre,p.categoria,p.stock,p.costo,p.valor,p.alerta?'Sí':'No'])]});
        else exportar('Ventas_por_periodo',{'Resumen':[['Desde',desde],['Hasta',hasta],['Agrupación',grupo],['Criterio','Pedidos entregados y pagados; fecha de pedido'],['Total (S/)',totalVentas],['Pedidos',ventas.length],['Ticket promedio',ventas.length?totalVentas/ventas.length:0]],'Periodos':[['Periodo','Pedidos','Total (S/)'],...periodos.map(p=>[p.periodo,p.cantidad,p.total])],'Ventas':[['Pedido','Fecha','Cliente','Estado','Pago','Total (S/)'],...ventas.map(p=>[p.numero,p.fecha,p.cliente,p.estado,p.estadoPago,Number(p.total)])]});
    };
    return <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{esInv?'Valorización del inventario':'Ventas por período'}</h2><p className="text-xs text-slate-500">{esInv?'Saldo al costo promedio ponderado móvil según Kardex.':'Pedidos entregados y pagados, agrupados por fecha de registro del pedido. Importes totales registrados, no cobros ni ventas netas contables.'}</p></div><div className="flex gap-2"><button className={campo} onClick={()=>setRevision(x=>x+1)}>Actualizar</button><button disabled={cargando||!!error||invalido} onClick={descargar} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Descargar Excel (.xlsx)</button></div></div>
        <div className={`${panel} grid grid-cols-1 sm:grid-cols-3 gap-3 !space-y-0`}>
            {esInv?<><label className="text-xs font-semibold">Fecha de corte<input className={campo} type="date" max={hoy()} value={corte} onChange={e=>setCorte(e.target.value)}/></label><label className="text-xs font-semibold">Categoría<select className={campo} value={categoria} onChange={e=>{setCategoria(e.target.value);setProducto('');}}><option value="">Todas</option>{categorias.map(c=><option key={c}>{c}</option>)}</select></label><label className="text-xs font-semibold">Producto<select className={campo} value={producto} onChange={e=>setProducto(e.target.value)}><option value="">Todos los productos</option>{productos.filter(p=>!categoria||(p.categoria||'Sin categoría')===categoria).map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label></>:<><label className="text-xs font-semibold">Desde<input type="date" max={hasta||hoy()} className={campo} value={desde} onChange={e=>setDesde(e.target.value)}/></label><label className="text-xs font-semibold">Hasta<input type="date" min={desde} max={hoy()} className={campo} value={hasta} onChange={e=>setHasta(e.target.value)}/></label><label className="text-xs font-semibold">Agrupar por<select className={campo} value={grupo} onChange={e=>setGrupo(e.target.value as Grupo)}><option value="dia">Día</option><option value="semana">Semana (lunes)</option><option value="mes">Mes</option><option value="anio">Año</option></select></label></>}
        </div>
        {error?<p role="alert" className="text-red-600">{error}</p>:cargando?<p className="text-center py-8">Cargando reporte…</p>:invalido?<p role="alert" className="text-red-600">Selecciona fechas válidas, no posteriores a hoy.</p>:<>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{(esInv?[['Productos',inventario.length],['Unidades según Kardex',totalStock],['Valor del inventario',importe(totalInv)]]:[['Ventas registradas',importe(totalVentas)],['Pedidos entregados y pagados',ventas.length],['Ticket promedio',importe(ventas.length?totalVentas/ventas.length:0)]]).map(([n,v])=><div key={n} className="admin-card"><span>{n}</span><strong>{v}</strong></div>)}</div>
        {esInv&&inventario.some(p=>p.alerta)&&<p className="text-sm text-amber-600">Existen productos con inconsistencias históricas o diferencias respecto al stock actual. Revisa las filas señaladas antes de utilizar los totales.</p>}
        <div className={panel}><h3 className="font-bold text-sm">{esInv?'Productos con mayor valor (hasta 10)':'Evolución de ventas'}</h3>{(esInv?inventario.length:periodos.length)>0?<Grafico opciones={opciones}/>:<p className="text-sm text-slate-500">No hay movimientos para los filtros elegidos.</p>}</div>
        <div className="tabla-wrap"><table className="tabla"><thead><tr>{(esInv?['Producto','Categoría','Stock','Costo promedio','Valor al costo','Control']:['Período','Pedidos','Total']).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{esInv?inventario.map(p=><tr key={p.id}><td>{p.nombre}</td><td>{p.categoria}</td><td>{p.stock}</td><td>{importe(p.costo)}</td><td>{importe(p.valor)}</td><td>{p.alerta?'Revisar':'—'}</td></tr>):periodos.map(p=><tr key={p.periodo}><td>{p.periodo}</td><td>{p.cantidad}</td><td>{importe(p.total)}</td></tr>)}</tbody></table></div>
        </>}
    </section>;
}
