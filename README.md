<div align="center">

# 🦊 NaTex Studio

**El entorno de edición LaTeX rápido, visual, libre y colaborativo.**

[![Descargar Instalador](https://img.shields.io/badge/📥_Descargar-NaTex--Setup--v0.2.exe-2ea44f?style=for-the-badge&logo=windows)](https://github.com/NachoFari/NaTex/releases/latest/download/NaTex-Setup-v0.2.exe)

[![Version](https://img.shields.io/badge/version-v0.2-orange.svg)](https://github.com/NachoFari/NaTex/releases)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Compiler](https://img.shields.io/badge/compiler-Tectonic-purple.svg)](https://tectonic-typesetting.github.io/)
[![Collab](https://img.shields.io/badge/collab-TryCloudflare-brightgreen.svg)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

*Sin instalaciones pesadas de TeX Live ni configuraciones frustrantes. Abre, escribe y compila en milisegundos.*

</div>

---

## 📥 Descarga e Instalación

### 👉 Forma más cómoda: Instalador de Windows (.exe)
1. Descarga el instalador oficial: **[NaTex-Setup-v0.2.exe](https://github.com/NachoFari/NaTex/releases/latest/download/NaTex-Setup-v0.2.exe)**
2. Haz doble clic para instalar (no requiere permisos de administrador).
3. ¡Listo! Crea automáticamente un acceso directo en tu Escritorio y Menú Inicio.

### Opción Alternativa: Código Fuente Portable
1. Clona el repositorio:
   ```bash
   git clone https://github.com/NachoFari/NaTex.git
   cd NaTex
   ```
2. Ejecuta **`iniciar_natex.bat`** o `NaTex.exe`.

---

## 🚀 ¿Qué es NaTex?

**NaTex Studio** es un editor de LaTeX moderno diseñado especialmente para estudiantes, profesores e investigadores que necesitan redactar documentos académicos, informes y fórmulas científicas con la máxima fluidez.

---

## ⚡ Funcionalidades de NaTex

### 1. Disponibles de forma 100% Local (Sin API de Gemini)
- ⚡ **Compilación Instantánea Local:** Motor **Tectonic** integrado. Compila a PDF en milisegundos sin necesidad de instalar TeX Live ni tener conexión a internet.
- 📐 **Constructor y Teclado Matemático (Alt + M):** Panel visual con vista previa en vivo KaTeX. Álgebra, cálculo diferencial/integral, notación bra-ket de física cuántica, matrices y símbolos griegos con 1 clic.
- 🖼️ **Galería de Imágenes & Assets:** Arrastra imágenes, cópialas en formato `\begin{figure}` con un solo clic y renombra archivos con actualización automática en `main.tex`.
- 🔗 **Colaboración en Tiempo Real:** Comparte un enlace o código QR seguro impulsado por túneles efímeros de Cloudflare para editar y compilar en vivo con tus compañeros.
- 📍 **Sincronización Bidireccional (SyncTeX):** Clic en "Ir a PDF" para saltar exactamente a la página correspondiente en el visor.
- 📑 **Plantillas Listas:** Informes Técnicos, Papers Científicos y Posters de congreso en 2 columnas.
- 🎨 **Personalización Total:** Modo Oscuro, Modo Claro, selector de colores y soporte bilingüe (Español e Inglés).

### 2. Potenciadas por Inteligencia Artificial (Con API de Gemini)
- 🎙️ **Dictáfono de Clases para Móvil:** Escanea el código QR desde tu celular durante la clase, graba la explicación del profesor y genera un apunte LaTeX completo estructurado con fórmulas matemáticas, teoremas y resumen ejecutivo.
- 💡 **Diagnóstico de Errores de Compilación:** Botón inteligente que analiza por qué falló el documento y te entrega la corrección exacta en código LaTeX.
- 🤖 **Asistente de Redacción y Tablas:** Generación de tablas complejas y estructuras matemáticas avanzadas mediante lenguaje natural.

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
| :--- | :--- |
| `Ctrl + S` | **Compilar Documento** y actualizar el visor PDF |
| `Alt + M` | Abrir el **Constructor de Ecuaciones Matemáticas** |
| `Ctrl + Enter` | Compilar documento rápidamente |
| `Tab` | Indentar 4 espacios |

---

## 🌿 Flujo de Ramas (Git)

- **`main` (Producción):** Rama estable y limpia correspondiente a las versiones publicadas de NaTex (Release v0.2).
- **`dev` (Desarrollo):** Rama activa de trabajo donde se implementan y testean nuevas características antes de integrarse a producción.

---

<div align="center">
Desarrollado con ❤️ por el equipo de <b>NaTex</b> 🦊
</div>