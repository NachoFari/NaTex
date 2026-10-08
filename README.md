<div align="center">

# 🦊 NaTex Studio

**El entorno de edición LaTeX rápido, visual, libre y colaborativo.**

[![Version](https://img.shields.io/badge/version-v0.1-orange.svg)](https://github.com/NachoFari/NaTex/releases)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Compiler](https://img.shields.io/badge/compiler-Tectonic-purple.svg)](https://tectonic-typesetting.github.io/)
[![Collab](https://img.shields.io/badge/collab-TryCloudflare-brightgreen.svg)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

*Sin instalaciones pesadas de TeX Live ni configuraciones frustrantes. Abre, escribe y compila en milisegundos.*

</div>

---

## 🚀 ¿Qué es NaTex?

**NaTex Studio** es un editor de LaTeX moderno diseñado especialmente para estudiantes, profesores e investigadores que necesitan redactar documentos académicos, informes y fórmulas científicas con la máxima fluidez.

Combina un compilador local ultrarrápido y autónomo con herramientas del día a día: dictado por voz desde el celular, teclado matemático visual interactivo, galería de imágenes y colaboración en tiempo real mediante túnel seguro.

---

## ✨ Características Principales

- ⚡ **Compilación Instantánea Local:** Motor **Tectonic** integrado. Compila a PDF en milisegundos sin necesidad de instalar TeX Live ni tener conexión a internet permanente.
- 📐 **Constructor y Teclado Matemático (Alt + M):** Visualizador de fórmulas matemáticas con vista previa en vivo KaTeX. Álgebra, cálculo diferencial/integral, notación bra-ket de física cuántica, matrices y símbolos griegos con 1 clic.
- 🎙️ **Dictáfono de Clases para Móvil:** Escanea el código QR desde tu celular durante la clase, graba la explicación del profesor y **Google Gemini** estructurará automáticamente tus apuntes en LaTeX (con fórmulas $...$, teoremas y resumen ejecutivo).
- 🖼️ **Galería de Imágenes & Assets:** Arrastra fotos, diagramas o gráficos, cópialos en formato `\begin{figure}` con un solo clic y renombra archivos con actualización automática en el código `main.tex`.
- 🔗 **Colaboración en Tiempo Real:** Comparte un enlace o código QR seguro impulsado por túneles efímeros de Cloudflare. Tu compañero puede unirse desde cualquier navegador del mundo para editar y compilar contigo en vivo.
- 📍 **Sincronización Bidireccional (SyncTeX):** Clic en "Ir a PDF" para saltar exactamente a la página y línea correspondiente en el visor.
- 🤖 **Asistente IA Gemini:** Explicación inteligente de errores de compilación de LaTeX y generación de tablas y estructuras matemáticas complejas.
- 🎨 **Personalización Total:** Modo Oscuro, Modo Claro, paleta de colores de acento y soporte multi-idioma (Español e Inglés).

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
| :--- | :--- |
| `Ctrl + S` | **Compilar Documento** y actualizar el visor PDF |
| `Alt + M` | Abrir el **Constructor de Ecuaciones Matemáticas** |
| `Ctrl + Enter` | Compilar documento rápidamente |
| `Tab` | Indentar 4 espacios |

---

## 📥 Inicio Rápido

### Opción 1: Ejecución Directa (Recomendada)
1. Clona el repositorio o descarga el archivo ZIP:
   ```bash
   git clone https://github.com/NachoFari/NaTex.git
   cd NaTex
   ```
2. Ejecuta el lanzador:
   - Haz doble clic en **`iniciar_natex.bat`** o ejecuta en tu terminal:
   ```bash
   python app.py
   ```
3. Se abrirá automáticamente tu navegador en `http://localhost:5000`.

---

## 📂 Estructura del Proyecto

```text
NaTex/
├── app.py                  # Servidor backend local y gestor de compilación
├── iniciar_natex.bat       # Lanzador rápido de un clic para Windows
├── config.example.json     # Plantilla de configuración
├── compiler/
│   └── tectonic.exe        # Compilador autónomo de LaTeX
├── tools/
│   └── cloudflared.exe     # Motor de túneles seguros para colaboración
├── projects/
│   └── Mi_Primer_Documento/# Documento interactivo con tutorial de inicio
├── static/                 # Interfaz visual (HTML5, CSS3, JavaScript ES6)
└── user_templates/         # Plantillas guardadas por el usuario
```

---

## 🌿 Flujo de Ramas (Git)

- **`main` (Producción):** Rama estable y limpia correspondiente a las versiones publicadas de NaTex (Release v0.1).
- **`dev` (Desarrollo):** Rama activa de trabajo donde se implementan y testean nuevas características antes de integrarse a producción.

---

## 🛡️ Privacidad y Seguridad

- **Túneles de Colaboración:** Utiliza la tecnología anónima y efímera *TryCloudflare*. No requiere cuenta, correos ni almacenamiento de credenciales. Las conexiones se cierran al apagar la aplicación.
- **Claves API:** Tu clave de Google Gemini se almacena únicamente en tu máquina local (`config.json`, excluido de Git vía `.gitignore`).

---

<div align="center">
Desarrollado con ❤️ por el equipo de <b>NaTex</b> 🦊
</div>