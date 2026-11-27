# TechStore — Reportes V7

Base: frontend V6. Compatible con backend V2 sin cambios SQL. Nuevas pestañas en Administración / Reportes: Valorización del inventario y Ventas por período.

## Instalación
Conservar `.env` local. Ejecutar `npm install` (actualiza package-lock.json con las nuevas dependencias), `npm run build` y `npm run dev`. No usar `npm ci` hasta actualizar el lockfile. No eliminar la base de datos.

## Criterios
- Valorización: último movimiento por producto hasta la fecha de corte inclusive, usando stockNuevo, saldoPromedio y saldoValorNuevo del Kardex. Categorías y productos del catálogo actual; los productos sin movimientos al corte muestran cero. Aviso de inconsistencias históricas o diferencia de stock al corte de hoy. El gráfico muestra los 10 mayores valores; tabla y Excel incluyen todos los productos filtrados. El histórico depende de cómo el backend reconstruye movimientos y cancelaciones.
- Ventas: pedidos actualmente Entregado y Pagado, por fecha original de registro; agrupación día, semana (lunes), mes o año. Solo períodos con operaciones. Total del pedido, no ingreso neto de IGV ni flujo de caja. Ticket promedio sobre esos pedidos. Exportación de resumen, períodos y detalle.
- Nuevos reportes: Apache ECharts y exportación XLSX con datos numéricos. No se emplean datos ficticios de respaldo. Reportes anteriores conservados, con su exportación CSV original.

## Verificación local
1. Abrir ambas pestañas con sesión administrativa; comprobar carga y tema oscuro/claro.
2. Seleccionar audífonos Sony y comparar stock/costo/valor con Kardex a la misma fecha. Si conserva los movimientos del ejemplo, deben ser 31, 1,251.61 y 38,800.
3. Seleccionar período con VTA-001 entregado/pagado; comprobar exclusión de pendientes/cancelados. Cambiar agrupaciones, comparar sumas y ticket.
4. Descargar XLSX y comprobar que las hojas contienen únicamente la selección.
5. Comprobar que los tres reportes anteriores y Kardex continúan disponibles.

Validación realizada: sintaxis TSX mediante transpileModule, comprobación de agrupación semanal y ZIP íntegro. No se pudo instalar dependencias desde npm (EAI_AGAIN); no se realizó compilación completa ni prueba de navegador/PostgreSQL.
