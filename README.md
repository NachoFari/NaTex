<div align="center">

# 🦊 NaTex Studio v1.0

**El entorno de escritorio LaTeX rápido, visual, libre y colaborativo.**

[![Descargar](https://img.shields.io/badge/📥_DESCARGAR-NATEX--SETUP--V1.3.0.EXE-2ea44f?style=for-the-badge)](https://github.com/NachoFari/NaTex/releases/latest/download/NaTex-Setup-v1.3.0.exe)

[![Version](https://img.shields.io/badge/version-v1.3-orange.svg)](https://github.com/NachoFari/NaTex/releases)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Compiler](https://img.shields.io/badge/compiler-Tectonic-purple.svg)](https://tectonic-typesetting.github.io/)
[![Collab](https://img.shields.io/badge/collab-TryCloudflare-brightgreen.svg)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

*Sin instalaciones pesadas de TeX Live ni configuraciones frustrantes. Abre, escribe y compila en milisegundos.*

</div>

---

## 📥 Descarga e Instalación

### 👉 Forma más cómoda: Instalador de Windows (.exe)
1. Descarga el instalador oficial: **[NaTex-Setup-v1.3.0.exe](https://github.com/NachoFari/NaTex/releases/latest/download/NaTex-Setup-v1.3.0.exe)**
2. Haz doble clic para instalar (no requiere permisos de administrador).
3. ¡Listo! Crea automáticamente un acceso directo en tu Escritorio y Menú Inicio.

### 👉 Opción 2: Desde Código Fuente
1. Clona el repositorio:
   ```bash
   git clone https://github.com/NachoFari/NaTex.git
   cd NaTex
   ```
2. Ejecuta **`Probar_NaTex_Desktop.bat`** o `python app.py`.

---

## 🚀 Novedades Principales de la Versión v1.3

### ✨ Efectos de Ambiente con Control de Frecuencia y Profundidad
- **Animaciones Ambientales Detrás del Texto:** Todas las partículas y sprites flotan en una capa de fondo (`z-index: 0`), pasando suavemente por detrás de las letras de tu código LaTeX, la barra lateral y los paneles, asegurando legibilidad 100% limpia sin distracciones.
- **Control Deslizante de Frecuencia:** Ajusta la densidad y ritmo de caída de las partículas en tiempo real (desde sutil 20% hasta intensa 200%) directamente desde *Ajustes ⚙️ ➔ Customización*.
- **21 Temas Visuales Completos:** Temas claros y oscuros artesanales con mascotas pixel art y físicas únicas (pétalos de Sakura, nieve ártica, brasas cálidas, burbujas marinas, lluvia binaria retro).

### 🤖 Copiloto Multi-Proveedor de Inteligencia Artificial
- **Soporte Universal de Proveedores:** Conecta tu proveedor favorito sin ataduras:
  - **Google Gemini** (Gemini 2.5 Flash, 2.5 Pro con cuota gratuita).
  - **OpenAI** (GPT-4o, GPT-4o-mini).
  - **Anthropic Claude** (Claude 3.5 Sonnet).
  - **NVIDIA NIM** (Llama 3.1 70B / 405B con aceleración neuronal).
  - **Modelos Locales / Auto-alojados** (Ollama, LM Studio, vLLM con endpoint compatible OpenAI).
- **Diagnóstico y Corrección de Errores LaTeX:** Si Tectonic reporta un error de sintaxis, la IA explica la causa en lenguaje natural y genera el bloque de código corregido listo para aplicar.

### 🎙️ Dictáfono de Clases (Móvil & Web) a LaTeX & PDF
Convierte tus clases universitarias, reuniones o conferencias en apuntes científicos estructurados y compilados a PDF automáticamente:
1. **Acceso Rápido Móvil:** Desde NaTex en tu PC, abre el menú de Colaboración o Dictáfono y escanea el código QR con la cámara de tu teléfono (o accede mediante el enlace seguro de Cloudflare).
2. **Grabación de Alta Fidelidad:** Habla o graba la exposición del profesor directamente desde la interfaz web móvil.
3. **Procesamiento Inteligente:** Al pulsar *Finalizar Grabación*, la IA procesa el audio y genera:
   - *Transcripción Textual Completa* de la sesión.
   - *Temas Principales y Conceptos Clave* en formato `\begin{itemize}`.
   - *Resumen Detallado y Fórmulas Matemáticas* en notación LaTeX formal (`$...$` y `\begin{equation}`).
4. **Compilación Inmediata:** Se crea automáticamente un nuevo proyecto en tu escritorio listo para compilar a PDF con Tectonic.

### ⚡ Visor PDF Ultra-Rápido y Barra de Herramientas Responsiva
- **Renderizado Fluido:** Motor PDF optimizado con navegación instantánea entre páginas y zoom sin pérdida de nitidez.
- **Sincronización SyncTeX Bidireccional:** Haz clic en el código fuente para saltar a la página correspondiente en el PDF, o haz clic en el PDF para posicionar el cursor en la línea exacta del `.tex`.
- **Barra de Herramientas Adaptable:** Diseño moderno y compacto que reorganiza botones y herramientas según el tamaño de tu pantalla, garantizando un área de escritura amplia y libre de distracciones.

---

## 📦 Historial: Novedades de la Versión v1.0

- 📦 **Compatibilidad Total con Overleaf (`.zip`):** Importa proyectos `.zip` completos (con protección *Zip Slip* y aplanado inteligente de carpeta raíz) o exporta cualquier proyecto en `.zip` con un clic desde el menú **Archivo** o desde las tarjetas de Inicio.
- 🔍 **Buscador y Reemplazo Flotante (`Ctrl + F` / `Ctrl + H`):** Barra integrada en el editor con coincidencia de mayúsculas/minúsculas (`Aa`), navegación rápida (`Enter` / `Shift + Enter`) y reemplazo individual o masivo.
- ✨ **Autocompletado Inteligente LaTeX y Citas `.bib`:**
  - Auto-cierre automático de entornos `\begin{...} ... \end{...}` al presionar `Enter` o `Tab`.
  - Sugerencias en vivo al escribir `\cite{...}` leyendo automáticamente todas las claves `@article{...}`, `@book{...}` de tus archivos `.bib` y `\bibitem{...}`.
  - Sugerencias en vivo de referencias cruzadas `\ref{...}` / `\eqref{...}` basadas en los `\label{...}` del documento.
- 🕒 **Historial Local de Versiones (Snapshots):** Guarda puntos de restauración automáticos en cada compilación exitosa (`Ctrl + S`) y permite previsualizar o restaurar versiones anteriores en 1 clic.
- 📊 **Barra de Métricas en Vivo:** Contador en tiempo real de `Línea X, Col Y`, **palabras reales** (excluyendo comandos LaTeX y comentarios `%`) y caracteres totales.
- 🎯 **Salto Directo a la Línea del Error:** Cuando Tectonic detecta un error de compilación, un botón **`🎯 Ir a Línea X`** te lleva directamente a la línea exacta del fallo.
- 🗂️ **Explorador de Proyectos con Buscador y Filtros:** Filtra tus proyectos en la pantalla de Inicio por nombre/contenido, fecha (*Hoy*, *Últimos 7 días*, *Últimos 30 días*), estado de PDF compilado y ordenamiento.
- 🖱️ **Árbol de Archivos con Drag & Drop:** Arrastra y mueve archivos entre carpetas del proyecto o suelta imágenes y recursos directamente desde el explorador de tu sistema.
- 🛡️ **Seguridad Reforzada en Colaboración Cloudflare:** Aislamiento estricto para invitados externos (sin exposición de claves API), aviso instantáneo en tiempo real si el anfitrión cierra la sesión y validación criptográfica de rutas (`os.path.commonpath`).
- 💬 **Interfaz 100% Nativa sin Alertas del Navegador:** Modales y notificaciones flotantes (`Toast`) propios en toda la aplicación.

---

## ⚡ Funcionalidades Principales

### 1. Disponibles de forma 100% Local (Sin requerir conexión ni claves de IA)
- ⚡ **Compilación Instantánea Local:** Motor **Tectonic** integrado con descarga y gestión autónoma de paquetes.
- 📐 **Constructor y Teclado Matemático Científico (`Alt + M`):** Panel visual con vista previa en vivo **KaTeX** (Álgebra, Cálculo, Bra-Ket Cuántico, Matrices y Alfabeto Griego).
- 📊 **Creador Visual de Tablas (Mini-Excel):** Diseña tablas interactivas o pega celdas directamente desde Excel / Google Sheets con `Ctrl + V` y genera el código `\begin{table}` al instante.
- 🖼️ **Galería de Imágenes y Recursos:** Administra figuras, inserta bloques `\begin{figure}` con un clic y renombra archivos sincronizando referencias en todo el documento.
- 🔗 **Colaboración P2P en Tiempo Real:** Comparte un enlace seguro o código QR mediante túneles efímeros de Cloudflare para editar y compilar junto a tu equipo de trabajo.
- 📍 **Sincronización SyncTeX:** Salto milimétrico entre editor y visor de documento.
- 📑 **10 Plantillas Académicas Integradas:** Papers IEEE (1 y 2 columnas), Tesis Universitaria, Informes de Laboratorio, Pósters A0/A3, Presentaciones Beamer 16:9, CV, Exámenes y Cheat Sheets de fórmulas.

### 2. Potenciadas por Inteligencia Artificial (Multi-Proveedor)
- 🤖 **Copiloto Académico Universal:** Compatible con Gemini, OpenAI, Claude, NVIDIA y modelos locales offline (Ollama).
- 🎙️ **Dictáfono Inteligente de Clases (Móvil / QR):** Transcripción, síntesis teórica y deducción de ecuaciones en LaTeX a partir de grabaciones de voz.
- 💡 **Asistente de Corrección y Optimización:** Detección de errores de compilación, reformulación de párrafos científicos y conversión de notas en sucio a tipografía formal.

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
| :--- | :--- |
| `Ctrl + S` / `F5` | **Compilar Documento** y guardar Snapshot en el historial |
| `Ctrl + F` | Abrir **Buscador** en el editor |
| `Ctrl + H` | Abrir **Buscar y Reemplazar** en el editor |
| `Ctrl + /` | **Comentar / Descomentar** líneas seleccionadas con `%` |
| `{` *(con texto seleccionado)* | Envolver selección automáticamente entre llaves `{...}` |
| `Alt + M` | Abrir el **Constructor de Ecuaciones Matemáticas** |
| `Tab` | Indentar 4 espacios o aceptar sugerencia de autocompletado |

---

<div align="center">
Desarrollado con ❤️ por <b>NachoFari</b> — <b>NaTex Studio</b> 🦊
</div>
