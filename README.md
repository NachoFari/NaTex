<div align="center">

# 🦊 NaTex Studio v1.0

**El entorno de escritorio LaTeX rápido, visual, libre y colaborativo.**

[![Descargar Ejecutable](https://img.shields.io/badge/📥_Descargar-NaTex_v1.0_(.exe)-2ea44f?style=for-the-badge&logo=windows)](https://github.com/NachoFari/NaTex/releases/latest)

[![Version](https://img.shields.io/badge/version-v1.0-orange.svg)](https://github.com/NachoFari/NaTex/releases)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Compiler](https://img.shields.io/badge/compiler-Tectonic-purple.svg)](https://tectonic-typesetting.github.io/)
[![Collab](https://img.shields.io/badge/collab-TryCloudflare-brightgreen.svg)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

*Sin instalaciones pesadas de TeX Live ni configuraciones frustrantes. Abre, escribe y compila en milisegundos.*

</div>

---

## 📥 Descarga e Instalación

### 👉 Opción 1: Ejecutable / Instalador de Windows (`NaTex.exe`)
1. Descarga la última versión desde **[Releases (v1.0)](https://github.com/NachoFari/NaTex/releases/latest)**.
2. Ejecuta **`NaTex.exe`** directamente (o el instalador `NaTex-Setup-v1.0.exe`).
3. ¡Listo! NaTex se abre como una aplicación nativa de escritorio con el motor de compilación **Tectonic** integrado.

### 👉 Opción 2: Desde Código Fuente
1. Clona el repositorio:
   ```bash
   git clone https://github.com/NachoFari/NaTex.git
   cd NaTex
   ```
2. Ejecuta **`Probar_NaTex_Desktop.bat`** o `python app.py`.

---

## ✨ Novedades de la Versión v1.0

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

### 1. Disponibles de forma 100% Local (Sin requerir claves de IA)
- ⚡ **Compilación Instantánea Local:** Motor **Tectonic** integrado con descarga automática de paquetes bajo demanda.
- 📐 **Constructor y Teclado Matemático Científico (`Alt + M`):** Panel visual con vista previa en vivo **KaTeX** (Álgebra, Cálculo, Física Cuántica Bra-Ket, Matrices y Griegas).
- 📊 **Creador Visual de Tablas (Mini-Excel):** Diseña tablas o pega celdas directamente desde Excel con `Ctrl + V` y obtén el código `\begin{table}` al instante.
- 🖼️ **Galería de Imágenes y Recursos:** Sube figuras, inserta bloques `\begin{figure}` con un clic y renombra archivos actualizando referencias automáticamente.
- 🔗 **Colaboración P2P en Tiempo Real:** Comparte un enlace seguro o código QR mediante túneles efímeros de Cloudflare para editar y compilar junto a tus compañeros.
- 📍 **Sincronización SyncTeX:** Salta de la línea actual del código a la página exacta del PDF.
- 📑 **10 Plantillas Académicas Integradas:** Papers IEEE (1 y 2 columnas), Tesis Universitaria, Informes de Laboratorio, Pósters A0/A3, Presentaciones Beamer 16:9, CV, Exámenes y Cheat Sheets.

### 2. Potenciadas por Inteligencia Artificial (Multi-Proveedor)
- 🤖 **Soporte Multi-IA:** Compatible con **Google Gemini**, **OpenAI**, **Anthropic Claude**, **NVIDIA NIM** y modelos locales vía **Ollama / LM Studio**.
- 🎙️ **Dictáfono Inteligente de Clases (Móvil / QR):** Escanea el QR desde tu celular en clases, graba el audio y genera automáticamente un apunte LaTeX estructurado con transcripción, temas clave y resumen con fórmulas.
- 💡 **Diagnóstico de Errores LaTeX con IA:** Explica en español o inglés por qué falló la compilación y sugiere la corrección exacta.

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