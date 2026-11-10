# TechStore — Plataforma E-Commerce & Control de Inventarios (Kardex)

> **Asignatura:** Desarrollo Full Stack — Sección 38344  
> **Docente:** Ventura Aguilar, Jeyson Junior  
> **Integrantes:**  
> - Asto Aiquipa, Gustavo Blas (U22300144)  
> - Diego Armando Caire Quino (U23231103)  
> **Periodo:** 2026-II — San Juan de Lurigancho, Lima  
> **Repositorio:** [https://github.com/GustavoAAnpc/tienda-web-frontend.git](https://github.com/GustavoAAnpc/tienda-web-frontend.git)

---

## 1. Descripcion General

   **TechStore** es una plataforma web integral de comercio electronico y control logistico orientada al sector minorista de tecnologia en el Peru. Resuelve la desconexion frecuente entre el canal de ventas digital y la administracion de almacen al unificar una tienda virtual con facturacion electronica (**SUNAT/RENIEC**) y un sistema interno de **Kardex permanente** sincronizado en tiempo real, brindando soporte tanto a clientes como a administradores y personal de almacen.

   ---

   ## 2. Caracteristicas Principales

   - **Tienda Virtual Reactiva:** Catalogo interactivo con filtrado dinamico por categorias, busqueda en tiempo real y vista detallada de productos.
   - **Gestion de Carrito y Despacho:** Calculo automatico de subtotal, costo de envio configurable y barra de progreso hacia envio gratuito.
   - **Pasarela de Pagos Multicanal:** Soporte para tarjetas de credito/debito (con validacion en formato de 16 digitos y CVV), billeteras digitales (**Yape/Plin** con codigo QR) y transferencia bancaria.
   - **Consulta en Tiempo Real (RENIEC / SUNAT):** Integracion de API REST externa que autocompleta nombres y apellidos mediante **DNI** y razon social, direccion fiscal y condicion tributaria mediante **RUC**.
   - **Facturacion Electronica y Desglose Tributario:** Emision de **Boleta de Venta** o **Factura**, calculando la Base Imponible (Operacion Gravada) y el **I.G.V. (18%)**.
   - **Kardex Fisico Permanente:** Trazabilidad automatica y bidireccional de inventario (**Entradas** por recepcion de mercaderia y **Salidas** automaticas al confirmarse compras).
   - **Control de Acceso Basado en Roles (RBAC):** Vistas y privilegios diferenciados para administradores (`admin`), personal de almacen (`almacen`) y compradores (`cliente`).
   - **Sistema de Diseno con Modo Claro / Oscuro:** Paleta con variables semanticas nativas en CSS y selector accesible con persistencia en almacenamiento local.

   ---

   ## 3. Tecnologias Utilizadas

   - **Frontend:** [React 19](https://react.dev/) — Arquitectura modular basada en componentes y hooks declarativos.
   - **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) — Tipado estricto en interfaces comerciales, inventarios y comprobantes tributarios.
   - **Herramienta de Compilacion:** [Vite 8](https://vite.dev/) — Servidor de desarrollo con Hot Module Replacement (HMR) y configuracion de proxy inverso anti-CORS.
   - **Enrutamiento:** [React Router v7](https://reactrouter.com/) — Gestion de navegacion SPA con rutas protegidas segun el rol de usuario.
   - **Gestion de Estado:** [React Context API](https://react.dev/reference/react/useContext) — Desacoplamiento de logica en proveedores (`AuthContext`, `CarritoContext`, `InventarioContext`, `ThemeContext`).
   - **Estilos:** **Vanilla CSS & Design Tokens** — Variables semanticas nativas para maximo rendimiento sin dependencias de frameworks externos.
   - **Consumo de Servicios:** **Fetch API** conectada a endpoints publicos para validacion de documentos peruanos.

   ---

   ## 4. Requisitos Previos

   Antes de ejecutar la aplicacion, verifica contar con las siguientes herramientas en tu entorno:

   - **Node.js**: Version `v18.0.0` o superior (Recomendado `v20.x`).
   - **npm**: Version `9.0.0` o superior (incluido con la instalacion de Node.js).
   - **Navegador Web Moderno**: Google Chrome, Mozilla Firefox, Microsoft Edge o Safari compatible con ECMAScript 2022+.

   ---

   ## 5. Instalacion y Configuracion

   Sigue estos pasos secuenciales para ejecutar el proyecto en tu entorno local:

   1. **Clonar el repositorio:**
      ```bash
      git clone https://github.com/GustavoAAnpc/tienda-web-frontend.git
      cd tienda-web-frontend
      ```

   2. **Instalar dependencias:**
      ```bash
      npm install
      ```

   3. **Configuracion de red y proxy:**
      El proyecto incluye un proxy configurado en `vite.config.ts` (`/api-peru`) para consultar los servicios de **RENIEC** y **SUNAT** evitando restricciones de CORS durante el desarrollo. No se requieren claves de entorno obligatorias para pruebas locales inmediatas.

   ---

   ## 6. Comandos de Uso y Despliegue

   ### Entorno de Desarrollo
   Inicia el servidor local de desarrollo:
   ```bash
   npm run dev
   ```
   Accede desde tu navegador a `http://localhost:5173/`.

   ---

   ## 7. Cuentas de Acceso y Credenciales de Prueba

   Para facilitar la evaluacion de los diferentes roles y permisos del sistema, la pantalla de inicio de sesion (`/login`) cuenta con botones de acceso directo con un solo clic. Tambien es posible ingresar manualmente con las siguientes credenciales:

   | Rol | Usuario | Contrasena | Modulos y Rutas Asignadas | Funcionalidades Principales |
   | :--- | :--- | :--- | :--- | :--- |
   | **Administrador** | `admin` | `admin123` | `/admin/*`<br>(Dashboard, Ventas, Usuarios, Catalogo, Reportes) | Visualizacion de metricas globales, graficos analiticos de ingresos por dia/mes, control de usuarios y auditoria de ventas. |
   | **Almacen** | `almacen` | `123` | `/almacen/*`<br>(Dashboard, Entradas, Kardex, Productos) | Control de stock fisico, registro de ingreso de mercaderia, alertas de stock minimo y seguimiento del Kardex permanente. |
   | **Cliente** | `cliente` | `123` | `/inicio`, `/productos`, `/carrito`<br>`/mi-cuenta`, `/mis-compras` | Exploracion de catalogo, compra interactiva con pasarela de pagos, seleccion de comprobante (DNI/RUC) e historial de pedidos. |

   ---

   ## 8. Verificacion del Consumo de API Externa

   Para comprobar el funcionamiento del consumo de servicios web en tiempo real:

   1. Ingresa a la tienda, anade uno o mas productos al carrito y presiona **Continuar al Pago**.
   2. **Consulta RENIEC (Persona Natural):** Selecciona *Boleta de Venta*, digita un DNI valido (ej. `72819402`) y presiona **Consultar RENIEC**. El sistema obtendra y autocompletara los nombres y apellidos oficiales.
   3. **Consulta SUNAT (Persona Juridica):** Selecciona *Factura Electronica*, digita un RUC valido (ej. `20100070970` o `20131312955`) y presiona **Consultar SUNAT**. El sistema autocompletara la razon social, direccion fiscal y estado ante la entidad tributaria.

   ---

   ## 9. Guia de Contribuciones

   Para colaborar en el desarrollo de la plataforma:

   1. Realiza un Fork del repositorio.
   2. Crea una rama para tu caracteristica o resolucion de incidente:
      ```bash
      git checkout -b feature/nombre-funcionalidad
      ```
   3. Aplica los cambios siguiendo las convenciones de codigo y realiza el commit:
      ```bash
      git commit -m "feat: descripcion concisa del cambio"
      ```
   4. Envia los cambios a tu repositorio remoto:
      ```bash
      git push origin feature/nombre-funcionalidad
      ```
   5. Registra un Pull Request detallando el contexto tecnico de la propuesta.

   ---
