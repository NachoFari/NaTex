// NaTex Studio Controller
let currentProject = 'Mi_Primer_Documento';
let isCompiling = false;
let autoSaveTimer = null;
let lastMtime = 0;
let isUserTyping = false;
let typingTimeout = null;

let currentLanguage = localStorage.getItem('natex_language') || 'es';
let currentTheme = localStorage.getItem('natex_theme') || 'dark';
let currentCustomColor = localStorage.getItem('natex_custom_color') || '#FF6B35';

// Elementos DOM
const codeEditor = document.getElementById('codeEditor');
const lineNumbers = document.getElementById('lineNumbers');
const editorStatus = document.getElementById('editorStatus');
const projectSelect = document.getElementById('projectSelect');
const btnCompile = document.getElementById('btnCompile');
const pdfViewer = document.getElementById('pdfViewer');
const emptyState = document.getElementById('emptyState');
const errorBox = document.getElementById('errorBox');
const errorLog = document.getElementById('errorLog');

// Modales & Vistas
const aiDrawer = document.getElementById('aiDrawer');
const modalTemplates = document.getElementById('modalTemplates');
const modalUpload = document.getElementById('modalUpload');
const modalSettings = document.getElementById('modalSettings');
const modalShare = document.getElementById('modalShare');
const modalMathKeyboard = document.getElementById('modalMathKeyboard');
const homeDashboard = document.getElementById('homeDashboard');
const navTabHome = document.getElementById('navTabHome');
const navTabEditor = document.getElementById('navTabEditor');
const btnMathKeyboard = document.getElementById('btnMathKeyboard');
const btnSyncToPdf = document.getElementById('btnSyncToPdf');

// Diccionario i18n Multilenguaje
const i18n = {
    es: {
        nav_home: "Inicio",
        nav_editor: "Editor",
        menu_home: "Inicio",
        menu_editor: "Editor",
        menu_file: "Archivo",
        menu_insert: "Insertar",
        menu_collab: "Colaborar",
        menu_settings: "Ajustes",
        item_new_project: "Nuevo Proyecto...",
        item_compile: "Compilar Documento",
        item_templates: "Cargar Plantilla...",
        item_save_template: "Guardar como Plantilla...",
        item_download_pdf: "Descargar PDF",
        item_math: "Teclado Matemático Científico...",
        item_voice: "Dictáfono de Clase (Celular / Móvil)...",
        item_gallery: "Galería de Imágenes / Recursos",
        item_sync_pdf: "Sincronizar con PDF (SyncTeX)",
        item_share: "Compartir con un amigo (Túnel)...",
        item_ai: "Asistente IA Gemini",
        item_theme_dark: "Modo Oscuro",
        item_theme_light: "Modo Claro",
        item_config: "Personalización y Clave IA...",
        btn_math_short: "Fórmulas",
        btn_voice_short: "Clase",
        voice_modal_title: "Dictáfono de Clases (Celular)",
        lbl_project: "Proyecto:",
        btn_new: "Nuevo",
        btn_compile: "Compilar",
        btn_math: "Teclado Matemático",
        btn_share: "Compartir",
        btn_templates: "Plantillas",
        btn_save_template: "Guardar Plantilla",
        btn_gallery: "Galería",
        btn_settings: "Ajustes",
        btn_ai: "IA",
        sidebar_gallery_title: "Galería de Imágenes",
        sidebar_drop_text: "Arrastra imágenes aquí o",
        btn_upload: "Subir",
        gallery_hint: "💡 Haz clic en 📋 para copiar el código LaTeX de la figura",
        gallery_empty: "No hay imágenes aún",
        btn_sync_pdf: "Ir a PDF",
        dashboard_subtitle: "Continúa redactando tu documento o crea uno nuevo en segundos.",
        btn_new_project: "Nuevo Proyecto",
        hero_continue_tag: "Continuar trabajando",
        stat_lines: "líneas",
        stat_files: "archivos",
        btn_hero_continue: "Continuar Editando",
        title_quick_actions: "Comenzar",
        quick_blank_title: "Proyecto en Blanco",
        quick_blank_desc: "Crea un documento LaTeX limpio desde cero sin plantillas previas.",
        quick_template_title: "Desde una Plantilla",
        quick_template_desc: "Comienza con formatos listos de Tesis, Informes, Posters o Papers.",
        quick_voice_title: "Dictáfono de Clases",
        quick_voice_desc: "Graba tu clase desde el celular y genera el apunte LaTeX estructurado.",
        quick_gallery_title: "Galería de Imágenes",
        quick_gallery_desc: "Gestiona figuras, gráficos y recursos de tus documentos.",
        title_recent_projects: "Tus Proyectos",
        math_title: "Constructor de Ecuaciones",
        math_subtitle: "Arma tu fórmula con vista previa visual en vivo",
        math_clear: "Limpiar",
        math_mode_label: "Formato:",
        math_formula_code_label: "Código LaTeX de la Ecuación:",
        math_keyboard_hint: "Haz clic en los símbolos arriba o escribe con el teclado",
        math_preview_title: "Vista Previa Visual en Vivo:",
        btn_copy_code: "Copiar Código",
        btn_insert_doc: "Insertar en Documento",
        btn_cancel: "Cancelar",
        math_tab_algebra: "Básico & Álgebra",
        math_tab_calculus: "Cálculo & Análisis",
        math_tab_quantum: "Física & Cuántica",
        math_tab_matrices: "Matrices & Vectores",
        math_tab_greek: "Griegas & Símbolos",
        btn_copy: "Copiar",
        btn_insert_cursor: "Insertar en Cursor",
        share_modal_title: "Compartir NaTex con un Amigo",
        share_loading: "Generando enlace seguro para tu amigo...",
        share_ready_label: "Enlace para tu amigo:",
        templates_title: "Seleccionar Plantilla",
        templates_desc: "Elige una plantilla para cargar en tu proyecto actual:",
        templates_builtin: "Plantillas Integradas",
        templates_custom: "Mis Plantillas Personalizadas",
        templates_empty: "Aún no has guardado plantillas propias.",
        resources_title: "Recursos e Imágenes",
        resources_drop: "Arrastra imágenes aquí (.png, .jpg) o",
        btn_browse: "Explorar Archivo",
        resources_files: "Archivos en este proyecto:",
        settings_title: "Ajustes y Personalización",
        theme_label: "🎨 Tema de la Aplicación:",
        theme_dark: "Oscuro",
        theme_light: "Claro",
        theme_custom: "Personalizado",
        accent_color_label: "Color de acento:",
        language_label: "🌐 Idioma / Language:",
        gemini_key_label: "Clave de API de Google Gemini (Gratis):",
        gemini_key_desc: "Cada persona puede colocar su propia clave gratuita de Google AI Studio.",
        btn_save_settings: "Guardar Ajustes",
        status_auto_saved: "Guardado automático ✓",
        status_saving: "Guardando...",
        status_compiling: "Compilando documento...",
        status_compiled_ok: "Compilación exitosa ✓",
        status_compile_err: "Error en compilación",
        status_math_inserted: "Fórmula insertada ✓",
        status_copied: "¡Copiado al portapapeles! ✓",
        dashboard_greeting: "¡Hola, bienvenido a NaTex! 🦊",
        preview_title: "📄 Vista Previa (PDF)",
        btn_download: "Descargar",
        btn_download_title: "Descargar archivo PDF",
        btn_refresh_pdf: "Recargar PDF",
        empty_welcome: "Bienvenido a NaTex",
        empty_compile_hint: "Presiona <strong>Compilar (Ctrl + S)</strong> para generar el PDF.",
        compilation_error_title: "⚠️ Error de Compilación",
        btn_ask_gemini_error: "💡 Preguntar a Gemini por qué falló",
        editor_placeholder: "Escribe tu código LaTeX aquí...",
        title_new_project: "Crear nuevo proyecto",
        title_quick_math: "Abrir Teclado Matemático (Alt + M)",
        title_quick_voice: "Grabar clase desde celular con enlace o QR",
        title_compile: "Compilar documento (Ctrl + S)",
        title_ai: "Abrir IA Gemini",
        math_search_placeholder: "🔍 Buscar símbolo o fórmula...",
        ai_title: "IA NaTex",
        ai_pill_table: "📊 Crear Tabla",
        ai_pill_formulas: "📐 Fórmulas",
        ai_pill_abstract: "✍️ Redactar Abstract",
        ai_welcome_msg: "¡Hola! Soy tu asistente en NaTex. Pregúntame sobre fórmulas, redacción o errores de compilación de LaTeX.",
        ai_placeholder: "Pregunta algo o pide código LaTeX...",
        btn_ai_send: "Enviar",
        share_explanation: "💡 <strong>Cómo funciona:</strong> Tu amigo solo hace clic en este link o escanea el QR desde cualquier navegador (PC o celular). Podrá ver el documento, escribir con guardado automático y compilar el PDF junto a ti en tiempo real mientras tengas NaTex abierto.",
        voice_desc: "Graba la clase desde tu teléfono móvil. NaTex transcribirá el audio con <strong>Google Gemini</strong> y creará un nuevo apunte LaTeX estructurado listo para compilar a PDF con:",
        voice_sections_title: "📋 Secciones generadas:",
        voice_sec_1: "1. Lo que dice textual la grabación",
        voice_sec_1_sub: "(con fórmulas $...$)",
        voice_sec_2: "2. Temas principales",
        voice_sec_2_sub: "(lista \\begin{itemize})",
        voice_sec_3: "3. Un resumen bien pulido",
        voice_sec_3_sub: "(teoremas y fórmulas en bloque)",
        voice_scan_instruction: "📱 Escanea con la cámara de tu celular",
        voice_direct_link_label: "Enlace directo al dictáfono:",
        btn_toggle_tunnel: "Activar Túnel Cloudflare (Fuera de Wi-Fi)",
        btn_open_dictaphone_here: "Abrir Dictáfono Aquí",
        gemini_key_placeholder: "Pega tu API Key de Gemini aquí (ej. AIzaSy...)",
        gallery_modal_title: "Galería de Imágenes",
        gallery_modal_subtitle: "Gestiona figuras, copia el código LaTeX para tu documento o renombra tus imágenes.",
        gallery_filter_label: "Proyecto:",
        gallery_filter_all: "Todos los proyectos",
        btn_upload_image: "Subir Imagen",
        voice_conn_loading: "Cargando conexión...",
        title_go_home: "Ir al Inicio",
        updates_title: "Actualizaciones de NaTex:",
        updates_current_ver: "Versión instalada:",
        btn_check_updates: "Comprobar Actualizaciones"
    },
    en: {
        nav_home: "Home",
        nav_editor: "Editor",
        menu_home: "Home",
        menu_editor: "Editor",
        menu_file: "File",
        menu_insert: "Insert",
        menu_collab: "Collab",
        menu_settings: "Settings",
        item_new_project: "New Project...",
        item_compile: "Compile Document",
        item_templates: "Load Template...",
        item_save_template: "Save as Template...",
        item_download_pdf: "Download PDF",
        item_math: "Scientific Math Keyboard...",
        item_voice: "Class Voice Dictaphone (Mobile)...",
        item_gallery: "Image Gallery / Assets",
        item_sync_pdf: "Sync with PDF (SyncTeX)",
        item_share: "Share with a friend (Tunnel)...",
        item_ai: "Gemini AI Assistant",
        item_theme_dark: "Dark Mode",
        item_theme_light: "Light Mode",
        item_config: "Customization & AI Key...",
        btn_math_short: "Formulas",
        btn_voice_short: "Class",
        voice_modal_title: "Class Voice Dictaphone (Mobile)",
        lbl_project: "Project:",
        btn_new: "New",
        btn_compile: "Compile",
        btn_math: "Math Keyboard",
        btn_share: "Share",
        btn_templates: "Templates",
        btn_save_template: "Save Template",
        btn_gallery: "Gallery",
        btn_settings: "Settings",
        btn_ai: "AI",
        sidebar_gallery_title: "Image Gallery",
        sidebar_drop_text: "Drop images here or",
        btn_upload: "Upload",
        gallery_hint: "💡 Click 📋 to copy the figure LaTeX code",
        gallery_empty: "No images yet",
        btn_sync_pdf: "Go to PDF",
        dashboard_subtitle: "Resume writing your document or create a new one in seconds.",
        btn_new_project: "New Project",
        hero_continue_tag: "Continue Working",
        stat_lines: "lines",
        stat_files: "files",
        btn_hero_continue: "Continue Editing",
        title_quick_actions: "Get Started",
        quick_blank_title: "Blank Project",
        quick_blank_desc: "Create a fresh LaTeX document from scratch without templates.",
        quick_template_title: "From a Template",
        quick_template_desc: "Start with pre-built Thesis, Reports, Posters, or Papers.",
        quick_voice_title: "Class Voice Dictaphone",
        quick_voice_desc: "Record your lecture from your phone and auto-generate structured LaTeX notes.",
        quick_gallery_title: "Image Gallery",
        quick_gallery_desc: "Manage figures, charts, and document assets.",
        title_recent_projects: "Your Projects",
        math_title: "Equation Builder",
        math_subtitle: "Build your formula with live visual preview",
        math_clear: "Clear",
        math_mode_label: "Format:",
        math_formula_code_label: "LaTeX Equation Code:",
        math_keyboard_hint: "Click symbols above or type with your keyboard",
        math_preview_title: "Live Visual Preview:",
        btn_copy_code: "Copy Code",
        btn_insert_doc: "Insert into Document",
        btn_cancel: "Cancel",
        math_tab_algebra: "Basics & Algebra",
        math_tab_calculus: "Calculus & Analysis",
        math_tab_quantum: "Physics & Quantum",
        math_tab_matrices: "Matrices & Vectors",
        math_tab_greek: "Greek & Symbols",
        btn_copy: "Copy",
        btn_insert_cursor: "Insert at Cursor",
        share_modal_title: "Share NaTex with a Friend",
        share_loading: "Generating secure link for your friend...",
        share_ready_label: "Link for your friend:",
        templates_title: "Select Template",
        templates_desc: "Choose a template to load into your current project:",
        templates_builtin: "Built-in Templates",
        templates_custom: "My Custom Templates",
        templates_empty: "You haven't saved any custom templates yet.",
        resources_title: "Assets & Images",
        resources_drop: "Drop images here (.png, .jpg) or",
        btn_browse: "Browse File",
        resources_files: "Files in this project:",
        settings_title: "Settings & Customization",
        theme_label: "🎨 App Theme:",
        theme_dark: "Dark",
        theme_light: "Light",
        theme_custom: "Custom",
        accent_color_label: "Accent Color:",
        language_label: "🌐 Language / Idioma:",
        gemini_key_label: "Google Gemini API Key (Free):",
        gemini_key_desc: "You can get your free key from Google AI Studio.",
        btn_save_settings: "Save Settings",
        status_auto_saved: "Auto-saved ✓",
        status_saving: "Saving...",
        status_compiling: "Compiling document...",
        status_compiled_ok: "Compilation successful ✓",
        status_compile_err: "Compilation error",
        status_math_inserted: "Formula inserted ✓",
        status_copied: "Copied to clipboard! ✓",
        dashboard_greeting: "Hello, welcome to NaTex! 🦊",
        preview_title: "📄 Live Preview (PDF)",
        btn_download: "Download",
        btn_download_title: "Download PDF file",
        btn_refresh_pdf: "Reload PDF",
        empty_welcome: "Welcome to NaTex",
        empty_compile_hint: "Press <strong>Compile (Ctrl + S)</strong> to generate the PDF.",
        compilation_error_title: "⚠️ Compilation Error",
        btn_ask_gemini_error: "💡 Ask Gemini why it failed",
        editor_placeholder: "Write your LaTeX code here...",
        title_new_project: "Create new project",
        title_quick_math: "Open Math Keyboard (Alt + M)",
        title_quick_voice: "Record class from mobile phone with link or QR",
        title_compile: "Compile document (Ctrl + S)",
        title_ai: "Open Gemini AI",
        math_search_placeholder: "🔍 Search symbol or formula...",
        ai_title: "NaTex AI",
        ai_pill_table: "📊 Create Table",
        ai_pill_formulas: "📐 Formulas",
        ai_pill_abstract: "✍️ Write Abstract",
        ai_welcome_msg: "Hello! I'm your NaTex assistant. Ask me about formulas, writing, or LaTeX compilation errors.",
        ai_placeholder: "Ask a question or request LaTeX code...",
        btn_ai_send: "Send",
        share_explanation: "💡 <strong>How it works:</strong> Your friend simply clicks this link or scans the QR from any browser (PC or mobile). They can view the document, write with auto-save, and compile the PDF together in real time while NaTex is open.",
        voice_desc: "Record lectures from your mobile phone. NaTex will transcribe audio with <strong>Google Gemini</strong> and generate structured LaTeX notes ready to compile to PDF with:",
        voice_sections_title: "📋 Generated sections:",
        voice_sec_1: "1. Verbatim transcript",
        voice_sec_1_sub: "(with $...$ formulas)",
        voice_sec_2: "2. Key topics",
        voice_sec_2_sub: "(\\begin{itemize} list)",
        voice_sec_3: "3. Polished executive summary",
        voice_sec_3_sub: "(block formulas and theorems)",
        voice_scan_instruction: "📱 Scan with your phone camera",
        voice_direct_link_label: "Direct dictaphone link:",
        btn_toggle_tunnel: "Enable Cloudflare Tunnel (Outside Wi-Fi)",
        btn_open_dictaphone_here: "Open Dictaphone Here",
        gemini_key_placeholder: "Paste your Gemini API Key here (e.g. AIzaSy...)",
        gallery_modal_title: "Image Gallery",
        gallery_modal_subtitle: "Manage figures, copy LaTeX code for your document, or rename your images.",
        gallery_filter_label: "Project:",
        gallery_filter_all: "All projects",
        btn_upload_image: "Upload Image",
        voice_conn_loading: "Loading connection...",
        title_go_home: "Go to Home",
        updates_title: "NaTex Updates:",
        updates_current_ver: "Installed version:",
        btn_check_updates: "Check for Updates"
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initResizer();
    initEditor();
    initDashboard();
    initMathKeyboard();
    initSyncTeX();
    initVoiceDictate();
    initUpdateChecker();
    loadProjects();
    setupEventListeners();
    setupCollaborationPolling();
});

// Configuración, Temas e Idiomas
function applyLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('natex_language', lang);
    const dict = i18n[lang] || i18n.es;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (dict[key].includes('<') && dict[key].includes('>')) {
                el.innerHTML = dict[key];
            } else {
                el.innerText = dict[key];
            }
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dict[key]) {
            el.title = dict[key];
        }
    });
    const btnEs = document.getElementById('btnLangEs');
    const btnEn = document.getElementById('btnLangEn');
    if (btnEs && btnEn) {
        btnEs.classList.toggle('active', lang === 'es');
        btnEn.classList.toggle('active', lang === 'en');
    }
}

function applyTheme(theme, customColor) {
    currentTheme = theme;
    if (customColor) currentCustomColor = customColor;
    localStorage.setItem('natex_theme', theme);
    localStorage.setItem('natex_custom_color', currentCustomColor);

    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'custom' || customColor) {
        document.documentElement.style.setProperty('--fox-orange', currentCustomColor);
        document.documentElement.style.setProperty('--fox-orange-hover', currentCustomColor + 'cc');
    } else {
        document.documentElement.style.removeProperty('--fox-orange');
        document.documentElement.style.removeProperty('--fox-orange-hover');
    }

    document.querySelectorAll('.theme-card-option').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-theme') === theme);
    });
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.getAttribute('data-color') === currentCustomColor);
    });
}

function initSettings() {
    applyTheme(currentTheme, currentCustomColor);
    applyLanguage(currentLanguage);

    const savedKey = localStorage.getItem('natex_gemini_key');
    if (savedKey) {
        document.getElementById('inputApiKey').value = savedKey;
        fetch('/api/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                gemini_api_key: savedKey,
                theme: currentTheme,
                custom_color: currentCustomColor,
                language: currentLanguage
            })
        });
    } else {
        fetch('/api/config')
            .then(r => r.json())
            .then(data => {
                if (data.gemini_api_key) {
                    document.getElementById('inputApiKey').value = data.gemini_api_key;
                    localStorage.setItem('natex_gemini_key', data.gemini_api_key);
                }
                if (data.theme && !localStorage.getItem('natex_theme')) {
                    applyTheme(data.theme, data.custom_color);
                }
                if (data.language && !localStorage.getItem('natex_language')) {
                    applyLanguage(data.language);
                }
            });
    }
}

function initUpdateChecker() {
    const btnCheck = document.getElementById('btnCheckUpdates');
    const resultBox = document.getElementById('updateResultBox');
    if (!btnCheck || !resultBox) return;

    btnCheck.onclick = async () => {
        btnCheck.disabled = true;
        const isEn = currentLanguage === 'en';
        btnCheck.innerText = isEn ? '⏳ Checking...' : '⏳ Comprobando...';
        resultBox.classList.remove('hidden');
        resultBox.style.display = 'block';
        resultBox.innerHTML = `<span style="color:var(--text-muted);">${isEn ? 'Connecting to GitHub...' : 'Conectando con GitHub...'}</span>`;

        try {
            const res = await fetch('/api/system/check_update');
            const data = await res.json();
            btnCheck.disabled = false;
            btnCheck.innerText = isEn ? '🔍 Check for Updates' : '🔍 Comprobar Actualizaciones';

            if (!data.success) {
                resultBox.innerHTML = `<div style="color:#EF4444;">⚠️ ${data.error || (isEn ? 'Could not connect to GitHub.' : 'No se pudo conectar con GitHub.')}</div>`;
                return;
            }

            if (data.has_update) {
                let html = `
                    <div style="color:#10B981; font-weight:600; margin-bottom:6px;">
                        🎉 ${isEn ? 'New version available:' : '¡Nueva versión disponible:'} ${escapeHtml(data.latest_version)}
                    </div>
                `;
                if (data.release_name) {
                    html += `<div style="font-size:12px; margin-bottom:8px; color:var(--text-main);">${escapeHtml(data.release_name)}</div>`;
                }
                html += `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">`;
                if (data.is_git_repo) {
                    html += `<button id="btnApplyGitUpdate" class="btn-primary" style="font-size:12px; padding:6px 12px;">🚀 ${isEn ? 'Update Now (Git)' : 'Actualizar Ahora (Git)'}</button>`;
                }
                html += `
                    <a href="${data.releases_page || 'https://github.com/NachoFari/NaTex/releases'}" target="_blank" class="btn-secondary" style="font-size:12px; padding:6px 12px; text-decoration:none; display:inline-flex; align-items:center;">
                        📦 ${isEn ? 'Download Installer' : 'Descargar Instalador'}
                    </a>
                </div>`;
                resultBox.innerHTML = html;

                const btnGit = document.getElementById('btnApplyGitUpdate');
                if (btnGit) {
                    btnGit.onclick = async () => {
                        btnGit.disabled = true;
                        btnGit.innerText = isEn ? '⏳ Updating...' : '⏳ Actualizando...';
                        try {
                            const uRes = await fetch('/api/system/apply_update', { method: 'POST' });
                            const uData = await uRes.json();
                            if (uData.success) {
                                resultBox.innerHTML = `<div style="color:#10B981; font-weight:600;">✅ ${uData.message}</div>`;
                                setTimeout(() => window.location.reload(), 2500);
                            } else {
                                btnGit.disabled = false;
                                btnGit.innerText = isEn ? 'Retry' : 'Reintentar';
                                resultBox.innerHTML += `<div style="color:#EF4444; margin-top:6px; font-size:11.5px;">❌ ${uData.error}</div>`;
                            }
                        } catch (err) {
                            btnGit.disabled = false;
                            resultBox.innerHTML += `<div style="color:#EF4444; margin-top:6px; font-size:11.5px;">❌ Error: ${err.message}</div>`;
                        }
                    };
                }
            } else {
                resultBox.innerHTML = `
                    <div style="color:#10B981; display:flex; align-items:center; gap:6px;">
                        <span>✅</span>
                        <span>${isEn ? 'You have the latest version (v0.1).' : '¡Tienes la versión más reciente (v0.1)!'}</span>
                    </div>
                `;
            }
        } catch (e) {
            btnCheck.disabled = false;
            btnCheck.innerText = isEn ? '🔍 Check for Updates' : '🔍 Comprobar Actualizaciones';
            resultBox.innerHTML = `<div style="color:#EF4444;">⚠️ Error: ${e.message}</div>`;
        }
    };
}

function insertAtCursor(text, cursorOffset = 0) {
    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;
    const val = codeEditor.value;
    codeEditor.value = val.substring(0, start) + text + val.substring(end);
    const newPos = start + (cursorOffset !== 0 ? cursorOffset : text.length);
    codeEditor.selectionStart = codeEditor.selectionEnd = newPos;
    codeEditor.focus();
    updateLineNumbers();
    triggerAutoSave();

    const dict = i18n[currentLanguage] || i18n.es;
    editorStatus.innerText = dict.status_math_inserted;
    editorStatus.style.color = '#10B981';
    setTimeout(() => {
        editorStatus.innerText = dict.status_auto_saved;
    }, 2000);
}

// Editor, Números de Línea y Guardado Automático
function initEditor() {
    codeEditor.addEventListener('input', () => {
        updateLineNumbers();
        triggerAutoSave();
    });

    codeEditor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeEditor.scrollTop;
    });

    codeEditor.addEventListener('keydown', (e) => {
        isUserTyping = true;
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => { isUserTyping = false; }, 2000);

        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
            updateLineNumbers();
            triggerAutoSave();
        }

        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
            e.preventDefault();
            compileDocument();
        }
    });
}

function triggerAutoSave() {
    editorStatus.innerText = 'Guardando...';
    editorStatus.style.color = '#FF6B35';
    clearTimeout(autoSaveTimer);

    autoSaveTimer = setTimeout(async () => {
        try {
            const res = await fetch('/api/project/save', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: currentProject,
                    code: codeEditor.value
                })
            });
            const data = await res.json();
            if (data.success) {
                lastMtime = data.mtime;
                editorStatus.innerText = 'Guardado automático ✓';
                editorStatus.style.color = '#10B981';
            }
        } catch (err) {
            editorStatus.innerText = 'Error al auto-guardar';
            editorStatus.style.color = '#EF4444';
        }
    }, 1200);
}

// Sincronización en tiempo real para colaboradores
function setupCollaborationPolling() {
    setInterval(async () => {
        if (isUserTyping || isCompiling) return;
        try {
            const res = await fetch(`/api/project/check_update?name=${encodeURIComponent(currentProject)}&since=${lastMtime}`);
            const data = await res.json();
            if (data.updated) {
                lastMtime = data.mtime;
                const start = codeEditor.selectionStart;
                const end = codeEditor.selectionEnd;
                codeEditor.value = data.code;
                codeEditor.selectionStart = start;
                codeEditor.selectionEnd = end;
                updateLineNumbers();
                editorStatus.innerText = 'Sincronizado con colaborador ✓';
                editorStatus.style.color = '#10B981';
                setTimeout(() => {
                    editorStatus.innerText = 'Guardado automático ✓';
                }, 3000);
            }
        } catch (e) {}
    }, 2500);
}

function updateLineNumbers() {
    const lines = codeEditor.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= lines; i++) {
        numbers += i + '\n';
    }
    lineNumbers.innerText = numbers;
}

// Proyectos
async function loadProjects() {
    const urlParams = new URLSearchParams(window.location.search);
    const lockedProject = urlParams.get('p');

    if (lockedProject) {
        // MODO INVITADO: Solo tiene acceso a este proyecto específico
        currentProject = lockedProject;
        const container = document.querySelector('.project-selector-container');
        if (container) {
            container.innerHTML = `<span class="selector-label">Proyecto:</span> <strong style="color:#FF6B35; font-size:13px; background:#181824; padding:5px 12px; border-radius:6px; border:1px solid #333;">🔒 ${lockedProject.replace(/_/g, ' ')}</strong>`;
        }
        // Ocultar botones privados
        if (document.getElementById('btnShare')) document.getElementById('btnShare').style.display = 'none';
        if (document.getElementById('btnSettings')) document.getElementById('btnSettings').style.display = 'none';
        if (document.getElementById('btnSaveTemplate')) document.getElementById('btnSaveTemplate').style.display = 'none';

        loadProjectCode(lockedProject);
        return;
    }

    const res = await fetch('/api/projects');
    const data = await res.json();
    projectSelect.innerHTML = '';
    data.projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p.replace(/_/g, ' ');
        if (p === data.current) opt.selected = true;
        projectSelect.appendChild(opt);
    });
    currentProject = projectSelect.value || 'Mi_Primer_Documento';
    loadProjectCode(currentProject);
}

async function loadProject(projName) {
    if (!projName) return;
    currentProject = projName;
    if (projectSelect) {
        let found = false;
        for (let i = 0; i < projectSelect.options.length; i++) {
            if (projectSelect.options[i].value === projName) {
                projectSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            const opt = document.createElement('option');
            opt.value = projName;
            opt.textContent = projName.replace(/_/g, ' ');
            opt.selected = true;
            projectSelect.appendChild(opt);
        }
    }
    await loadProjectCode(projName);
}

async function loadProjectCode(projName) {
    editorStatus.innerText = 'Cargando...';
    const res = await fetch(`/api/project/load?name=${encodeURIComponent(projName)}`);
    const data = await res.json();
    codeEditor.value = data.code || '';
    lastMtime = data.mtime || 0;
    updateLineNumbers();
    editorStatus.innerText = 'Guardado automático ✓';
    editorStatus.style.color = '#10B981';
    updateFilesList(data.files || []);
    updateGallerySidebar(data.files || []);

    if (data.has_pdf) {
        showPdf(`/api/pdf?name=${encodeURIComponent(projName)}&t=${Date.now()}`);
    } else {
        emptyState.classList.remove('hidden');
        pdfViewer.src = 'about:blank';
    }
}

// Compilación
async function compileDocument() {
    if (isCompiling) return;
    isCompiling = true;
    btnCompile.innerHTML = '<span class="icon">⏳</span> Compilando...';
    btnCompile.style.opacity = '0.7';
    editorStatus.innerText = 'Compilando con Tectonic...';
    editorStatus.style.color = '#FF6B35';

    try {
        const res = await fetch('/api/project/compile', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: currentProject,
                code: codeEditor.value
            })
        });
        const data = await res.json();

        if (data.success) {
            errorBox.classList.add('hidden');
            showPdf(`${data.pdf_url}&t=${Date.now()}`);
            editorStatus.innerText = 'Compilado con éxito ✓';
            editorStatus.style.color = '#10B981';
            setTimeout(() => {
                editorStatus.innerText = 'Guardado automático ✓';
            }, 3000);
        } else {
            errorLog.innerText = data.log || 'Error desconocido';
            errorBox.classList.remove('hidden');
            editorStatus.innerText = 'Error en código LaTeX';
            editorStatus.style.color = '#EF4444';
        }
    } catch (err) {
        errorLog.innerText = String(err);
        errorBox.classList.remove('hidden');
    } finally {
        isCompiling = false;
        const dict = i18n[currentLanguage] || i18n.es;
        btnCompile.innerHTML = `<span class="icon">⚡</span> <span class="btn-text">${dict.btn_compile || 'Compilar'}</span>`;
        btnCompile.style.opacity = '1';
    }
}

function showPdf(url) {
    emptyState.classList.add('hidden');
    pdfViewer.src = url;
}

// Resizer de Pantalla Dividida
function initResizer() {
    const resizer = document.getElementById('dragResizer');
    const editorPane = document.getElementById('editorPane');
    let isResizing = false;

    resizer.addEventListener('mousedown', () => {
        isResizing = true;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const totalWidth = document.querySelector('.workspace').offsetWidth;
        const newLeftWidth = (e.clientX / totalWidth) * 100;
        if (newLeftWidth > 20 && newLeftWidth < 80) {
            editorPane.style.width = `${newLeftWidth}%`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = 'default';
        }
    });
}

// Compartir con Amigo (Túnel)
async function openShareModal() {
    const modal = document.getElementById('modalShare');
    if (!modal) return;
    modal.classList.remove('hidden');

    const loading = document.getElementById('shareLoading');
    const ready = document.getElementById('shareReady');
    const inputUrl = document.getElementById('inputShareUrl');
    const qrContainer = document.getElementById('shareQrCode');

    if (loading) loading.classList.remove('hidden');
    if (ready) ready.classList.add('hidden');

    try {
        const res = await fetch(`/api/tunnel/start?project=${encodeURIComponent(currentProject)}`);
        const data = await res.json();
        if (data.success && data.url) {
            if (loading) loading.classList.add('hidden');
            if (ready) ready.classList.remove('hidden');
            const projectLink = `${data.url}/?p=${encodeURIComponent(currentProject)}`;
            if (inputUrl) inputUrl.value = projectLink;

            if (qrContainer && window.QRCode) {
                qrContainer.innerHTML = '';
                shareQrInstance = new QRCode(qrContainer, {
                    text: projectLink,
                    width: 160,
                    height: 160,
                    colorDark: '#121214',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            }
        } else {
            if (loading) loading.innerHTML = `<p style="color:#EF4444;">⚠️ ${data.error || 'Error al conectar túnel'}</p>`;
        }
    } catch (err) {
        if (loading) loading.innerHTML = `<p style="color:#EF4444;">⚠️ Error de conexión: ${err.message}</p>`;
    }
}

// Plantillas
async function openTemplatesModal() {
    const res = await fetch('/api/templates');
    const data = await res.json();
    const builtInDiv = document.getElementById('builtInTemplates');
    const userDiv = document.getElementById('userTemplates');

    const icons = {
        'poster_2col': '📢',
        'informe_tecnico': '📑',
        'paper_cientifico': '🔬'
    };

    builtInDiv.innerHTML = '';
    data.built_in.forEach(t => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `<div class="template-icon">${icons[t.id] || '📄'}</div><div class="template-title">${t.name}</div>`;
        card.onclick = () => applyTemplate(t.id);
        builtInDiv.appendChild(card);
    });

    userDiv.innerHTML = '';
    if (data.user.length === 0) {
        userDiv.innerHTML = '<p class="text-muted">Aún no has guardado plantillas propias.</p>';
    } else {
        data.user.forEach(t => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `<div class="template-icon">⭐</div><div class="template-title">${t.name}</div>`;
            card.onclick = () => applyTemplate(t.id);
            userDiv.appendChild(card);
        });
    }

    modalTemplates.classList.remove('hidden');
}

async function applyTemplate(templateId) {
    if (!confirm('¿Deseas reemplazar el código actual con esta plantilla? Asegúrate de haber guardado tus cambios.')) return;
    const res = await fetch('/api/templates/apply', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({project: currentProject, template: templateId})
    });
    const data = await res.json();
    if (data.success) {
        codeEditor.value = data.code;
        updateLineNumbers();
        modalTemplates.classList.add('hidden');
        compileDocument();
    }
}

// Galería de Imágenes y Recursos del Proyecto
function isImageFile(filename) {
    const ext = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp', 'gif'].includes(ext);
}

function getFigureSnippet(filename) {
    const labelClean = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    return `\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.7\\linewidth]{${filename}}\n  \\caption{Descripción de la figura}\n  \\label{fig:${labelClean}}\n\\end{figure}`;
}

function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
    } catch (err) {}
    document.body.removeChild(ta);
}

window.copyFigureCode = async function(filename, btnElement) {
    const snippet = getFigureSnippet(filename);
    try {
        await navigator.clipboard.writeText(snippet);
    } catch (e) {
        fallbackCopyText(snippet);
    }

    if (btnElement) {
        const origHtml = btnElement.innerHTML;
        btnElement.innerHTML = '✓';
        btnElement.style.color = '#10B981';
        setTimeout(() => {
            btnElement.innerHTML = origHtml;
            btnElement.style.color = '';
        }, 1800);
    }

    const card = btnElement ? btnElement.closest('.gallery-card') : null;
    if (card) {
        const hint = card.querySelector('.gallery-insert-hint');
        if (hint) {
            const origHint = hint.innerHTML;
            hint.innerHTML = '✓ ¡Código copiado!';
            hint.style.color = '#10B981';
            setTimeout(() => {
                hint.innerHTML = origHint;
                hint.style.color = '';
            }, 1800);
        }
    }

    editorStatus.innerText = `¡Código LaTeX de "${filename}" copiado! 📋`;
    editorStatus.style.color = '#10B981';
    setTimeout(() => {
        editorStatus.innerText = 'Guardado automático ✓';
    }, 2800);
};

window.copyFilename = async function(filename, nameElement) {
    try {
        await navigator.clipboard.writeText(filename);
    } catch (e) {
        fallbackCopyText(filename);
    }
    editorStatus.innerText = `Nombre "${filename}" copiado al portapapeles 📋`;
    editorStatus.style.color = '#10B981';
    if (nameElement) {
        const origColor = nameElement.style.color;
        nameElement.style.color = '#10B981';
        setTimeout(() => { nameElement.style.color = origColor; }, 1500);
    }
    setTimeout(() => {
        editorStatus.innerText = 'Guardado automático ✓';
    }, 2500);
};

function updateGallerySidebar(files) {
    const galleryList = document.getElementById('sidebarGalleryList');
    if (!galleryList) return;
    
    const imageFiles = (files || []).filter(isImageFile);
    galleryList.innerHTML = '';
    
    if (imageFiles.length === 0) {
        galleryList.innerHTML = `
            <div style="text-align:center; padding: 25px 12px; color: var(--text-muted); font-size: 11.5px; line-height: 1.5;">
                <div style="font-size: 26px; margin-bottom: 6px;">📷</div>
                <strong style="color:#aaa;">Sin imágenes</strong>
                <p style="margin-top: 4px; font-size: 11px;">Sube o arrastra una imagen para verla aquí y usarla en tu documento.</p>
            </div>
        `;
        return;
    }

    imageFiles.forEach(f => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.title = `Clic para copiar código LaTeX de "${f}"`;
        
        const assetUrl = `/api/project/asset?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(f)}&t=${Date.now()}`;
        
        card.innerHTML = `
            <div class="gallery-thumb-wrapper">
                <img src="${assetUrl}" alt="${escapeHtml(f)}" class="gallery-thumb" loading="lazy">
                <div class="gallery-insert-hint">📋 Copiar código LaTeX</div>
            </div>
            <div class="gallery-meta">
                <span class="gallery-name" title="Clic para copiar solo el nombre de archivo">${escapeHtml(f)}</span>
                <div class="gallery-actions">
                    <button class="gallery-btn-action gallery-btn-copy" title="Copiar código LaTeX (\begin{figure}...)" aria-label="Copiar código">📋</button>
                    <button class="gallery-btn-action gallery-btn-rename" title="Renombrar imagen" aria-label="Renombrar imagen">✏️</button>
                    <button class="gallery-btn-action gallery-btn-delete" title="Eliminar imagen" aria-label="Eliminar imagen">🗑️</button>
                </div>
            </div>
        `;

        // Al hacer clic en la miniatura: copiar código LaTeX al portapapeles
        const thumb = card.querySelector('.gallery-thumb-wrapper');
        const btnCopy = card.querySelector('.gallery-btn-copy');
        const btnRename = card.querySelector('.gallery-btn-rename');
        const btnDel = card.querySelector('.gallery-btn-delete');

        if (thumb) {
            thumb.addEventListener('click', () => {
                copyFigureCode(f, btnCopy);
            });
        }

        if (btnCopy) {
            btnCopy.addEventListener('click', (e) => {
                e.stopPropagation();
                copyFigureCode(f, btnCopy);
            });
        }

        if (btnRename) {
            btnRename.addEventListener('click', (e) => {
                e.stopPropagation();
                renameGalleryAsset(f, currentProject);
            });
        }

        if (btnDel) {
            btnDel.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteGalleryAsset(f, currentProject);
            });
        }

        // Clic en el nombre para copiar solo el nombre
        const nameSpan = card.querySelector('.gallery-name');
        if (nameSpan) {
            nameSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                copyFilename(f, nameSpan);
            });
        }


        galleryList.appendChild(card);
    });
}

function updateFilesList(files) {
    const list = document.getElementById('projectFilesList');
    if (!list) return;
    list.innerHTML = '';
    if (!files || files.length === 0) {
        list.innerHTML = '<li class="text-muted">No hay imágenes en este proyecto.</li>';
        return;
    }
    files.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${escapeHtml(f)}</span><button class="btn-insert-code" onclick="copyFigureCode('${escapeHtml(f)}', this)">📋 Copiar</button>`;
        list.appendChild(li);
    });
}

function ensureGraphicxPackage() {
    if (!codeEditor.value.includes('{graphicx}')) {
        if (codeEditor.value.includes('\\begin{document}')) {
            codeEditor.value = codeEditor.value.replace('\\begin{document}', '\\usepackage{graphicx}\n\\begin{document}');
        } else if (codeEditor.value.includes('\\documentclass')) {
            codeEditor.value = codeEditor.value.replace(/(\\documentclass[^\n]*\n)/, '$1\\usepackage{graphicx}\n');
        } else {
            codeEditor.value = '\\usepackage{graphicx}\n' + codeEditor.value;
        }
    }
}

window.insertImageCode = function(filename) {
    // 1. Asegurar que \usepackage{graphicx} esté en el preámbulo
    ensureGraphicxPackage();

    // 2. Limpiar nombre para la etiqueta label
    const labelClean = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

    // 3. Generar el entorno figure completo
    const snippet = `\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.7\\linewidth]{${filename}}\n  \\caption{Descripción de la figura}\n  \\label{fig:${labelClean}}\n\\end{figure}\n`;
    
    // 4. Insertar en la posición actual del cursor o al final
    const start = codeEditor.selectionStart !== undefined ? codeEditor.selectionStart : codeEditor.value.length;
    const end = codeEditor.selectionEnd !== undefined ? codeEditor.selectionEnd : start;

    codeEditor.value = codeEditor.value.substring(0, start) + snippet + codeEditor.value.substring(end);
    codeEditor.selectionStart = codeEditor.selectionEnd = start + snippet.length;
    codeEditor.focus();

    updateLineNumbers();
    triggerAutoSave();

    // Feedback visual amigable
    editorStatus.innerText = `¡Figura "${filename}" insertada! ✓`;
    editorStatus.style.color = '#FF6B35';
    setTimeout(() => {
        editorStatus.innerText = 'Guardado automático ✓';
        editorStatus.style.color = '#10B981';
    }, 2500);

    const mUpload = document.getElementById('modalUpload');
    if (mUpload) mUpload.classList.add('hidden');
};

async function renameGalleryAsset(filename, project) {
    const proj = project || currentProject;
    const isEn = currentLanguage === 'en';
    const newName = prompt(isEn ? `New name for image "${filename}":` : `Nuevo nombre para la imagen "${filename}":`, filename);
    if (!newName || newName.trim() === '' || newName.trim() === filename) return;

    try {
        const res = await fetch('/api/project/asset/rename', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                project: proj,
                old_name: filename,
                new_name: newName.trim()
            })
        });
        const data = await res.json();
        if (data.success) {
            editorStatus.innerText = isEn ? `Renamed to "${data.new_name}" ✓` : `¡Renombrado a "${data.new_name}"! ✓`;
            editorStatus.style.color = '#10B981';
            if (proj === currentProject) {
                loadProjectCode(currentProject);
            }
            refreshGalleryModal();
        } else {
            alert((isEn ? 'Could not rename image: ' : 'No se pudo renombrar la imagen: ') + (data.error || ''));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteGalleryAsset(filename, project) {
    const proj = project || currentProject;
    const isEn = currentLanguage === 'en';
    if (!confirm(isEn ? `Delete image "${filename}" from project?` : `¿Eliminar la imagen "${filename}" del proyecto?`)) return;
    try {
        const res = await fetch('/api/project/asset/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                project: proj,
                filename: filename
            })
        });
        const data = await res.json();
        if (data.success) {
            editorStatus.innerText = `Imagen "${filename}" eliminada ✓`;
            editorStatus.style.color = '#10B981';
            if (proj === currentProject) {
                loadProjectCode(currentProject);
            }
            refreshGalleryModal();
        } else {
            alert((isEn ? 'Could not delete image: ' : 'No se pudo eliminar la imagen: ') + (data.error || ''));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

let allGalleryImages = [];

async function openGalleryModal() {
    const modal = document.getElementById('modalUpload');
    if (!modal) return;
    modal.classList.remove('hidden');
    await refreshGalleryModal();
}

async function refreshGalleryModal() {
    const grid = document.getElementById('galleryModalGrid');
    const filterSelect = document.getElementById('galleryProjectFilter');
    if (!grid) return;

    const isEn = currentLanguage === 'en';
    grid.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);"><span style="font-size:24px;">⏳</span><p>${isEn ? 'Loading gallery...' : 'Cargando galería...'}</p></div>`;

    try {
        const res = await fetch('/api/gallery/all');
        const data = await res.json();
        allGalleryImages = data.images || [];

        if (filterSelect) {
            const currentSelected = filterSelect.value || 'all';
            const projects = Array.from(new Set(allGalleryImages.map(img => img.project)));
            filterSelect.innerHTML = `<option value="all">${isEn ? 'All projects' : 'Todos los proyectos'}</option>`;
            projects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p.replace(/_/g, ' ');
                if (p === currentSelected) opt.selected = true;
                filterSelect.appendChild(opt);
            });
            filterSelect.onchange = () => renderGalleryGrid(filterSelect.value);
        }

        renderGalleryGrid(filterSelect ? filterSelect.value : 'all');
    } catch (e) {
        console.error('Error cargando galería:', e);
        grid.innerHTML = `<p style="color:#ef4444; padding:20px; text-align:center;">${isEn ? 'Error loading images.' : 'Error al cargar las imágenes.'}</p>`;
    }
}

function renderGalleryGrid(filterProject) {
    const grid = document.getElementById('galleryModalGrid');
    if (!grid) return;

    const isEn = currentLanguage === 'en';
    const filtered = (filterProject && filterProject !== 'all')
        ? allGalleryImages.filter(img => img.project === filterProject)
        : allGalleryImages;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; padding: 40px 10px; color: var(--text-muted);">
                <div style="font-size: 38px; margin-bottom: 8px;">🖼️</div>
                <strong style="color:var(--text-main); font-size:14px;">${isEn ? 'No images uploaded yet' : 'No hay imágenes subidas aún'}</strong>
                <p style="margin-top: 6px; font-size: 12.5px;">${isEn ? 'Drag and drop or upload an image above to use it in your documents.' : 'Arrastra o sube una imagen arriba para verla aquí y usarla en tus documentos.'}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    filtered.forEach(img => {
        const card = document.createElement('div');
        card.className = 'gallery-modal-card';

        const sizeKb = Math.round(img.size / 1024);
        const baseName = img.filename.replace(/\.[^/.]+$/, "");
        const latexSnippet = `\\begin{figure}[htbp]\n    \\centering\n    \\includegraphics[width=0.7\\textwidth]{${img.filename}}\n    \\caption{${img.filename.replace(/_/g, ' ')}}\n    \\label{fig:${baseName}}\n\\end{figure}`;

        card.innerHTML = `
            <div class="gallery-modal-thumb-box" title="${isEn ? 'Click to copy LaTeX code' : 'Clic para copiar código LaTeX'}">
                <img src="${img.url}&t=${Date.now()}" alt="${escapeHtml(img.filename)}" loading="lazy">
            </div>
            <div class="gallery-modal-meta">
                <span class="gallery-modal-filename" title="${escapeHtml(img.filename)}">${escapeHtml(img.filename)}</span>
                <span class="gallery-modal-project-tag">📁 ${escapeHtml(img.project.replace(/_/g, ' '))} · ${sizeKb} KB</span>
            </div>
            <div class="gallery-modal-btn-row">
                <button class="gallery-modal-btn-action btn-copy-latex" title="${isEn ? 'Copy LaTeX block' : 'Copiar bloque LaTeX completo'}">
                    📋 ${isEn ? 'LaTeX' : 'Copiar'}
                </button>
                <button class="gallery-modal-btn-action btn-rename-img" title="${isEn ? 'Rename file' : 'Renombrar archivo'}">
                    ✏️
                </button>
                <button class="gallery-modal-btn-action gallery-modal-btn-danger btn-del-img" title="${isEn ? 'Delete file' : 'Eliminar archivo'}">
                    🗑️
                </button>
            </div>
        `;

        const thumb = card.querySelector('.gallery-modal-thumb-box');
        const btnCopy = card.querySelector('.btn-copy-latex');
        const btnRename = card.querySelector('.btn-rename-img');
        const btnDel = card.querySelector('.btn-del-img');

        const doCopy = () => {
            navigator.clipboard.writeText(latexSnippet).then(() => {
                const originalText = btnCopy.innerHTML;
                btnCopy.innerHTML = isEn ? '✓ Copied' : '✓ Copiado';
                btnCopy.style.background = '#10B981';
                btnCopy.style.color = '#fff';
                setTimeout(() => {
                    btnCopy.innerHTML = originalText;
                    btnCopy.style.background = '';
                    btnCopy.style.color = '';
                }, 1800);
            }).catch(() => {
                prompt(isEn ? 'Copy LaTeX code:' : 'Copia el código LaTeX:', latexSnippet);
            });
        };

        if (thumb) thumb.onclick = doCopy;
        if (btnCopy) btnCopy.onclick = doCopy;
        if (btnRename) btnRename.onclick = () => renameGalleryAsset(img.filename, img.project);
        if (btnDel) btnDel.onclick = () => deleteGalleryAsset(img.filename, img.project);

        grid.appendChild(card);
    });
}

function handleFileUpload(file) {
    if (!file) return;
    editorStatus.innerText = `Subiendo "${file.name}"...`;
    editorStatus.style.color = '#FF6B35';

    const reader = new FileReader();
    reader.onload = async (e) => {
        const b64 = e.target.result;
        try {
            const res = await fetch('/api/project/upload_base64', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    project: currentProject,
                    filename: file.name,
                    data: b64
                })
            });
            const data = await res.json();
            if (data.success) {
                editorStatus.innerText = `¡${file.name} subido con éxito! ✓`;
                editorStatus.style.color = '#10B981';
                loadProjectCode(currentProject);
                refreshGalleryModal();
            } else {
                alert(`Error al subir: ${data.error || 'Desconocido'}`);
            }
        } catch (err) {
            alert(`Error de conexión al subir imagen: ${err.message}`);
        }
    };
    reader.readAsDataURL(file);
}

// Gemini AI Chat
async function sendAIMessage(promptText) {
    const input = document.getElementById('aiInput');
    const msg = promptText || input.value.trim();
    if (!msg) return;

    if (!promptText) input.value = '';

    appendChatMessage('user', msg);
    const typingMsg = appendChatMessage('ai', '🦊 NaTex está pensando...');

    try {
        const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({prompt: msg})
        });
        const data = await res.json();
        typingMsg.remove();

        if (data.success) {
            appendChatMessage('ai', data.response);
        } else {
            appendChatMessage('ai', `⚠️ ${data.error || 'No se pudo conectar con Gemini. Revisa tu clave en Ajustes.'}`);
        }
    } catch (err) {
        typingMsg.remove();
        appendChatMessage('ai', `Error de red: ${err.message}`);
    }
}

function appendChatMessage(sender, text) {
    const container = document.getElementById('aiMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-msg`;
    msgDiv.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    return msgDiv;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// Event Listeners
function setupEventListeners() {
    btnCompile.onclick = compileDocument;
    
    projectSelect.onchange = (e) => {
        currentProject = e.target.value;
        loadProjectCode(currentProject);
    };

    const btnNew = document.getElementById('btnNewProject');
    if (btnNew) btnNew.onclick = createNewProjectPrompt;

    // Menús Desplegables Tipo Word
    initDropdownMenus();

    // Barra Lateral de Galería
    const gallerySidebar = document.getElementById('gallerySidebar');
    const btnToggleGallery = document.getElementById('btnToggleGallery');
    const btnCollapseGallery = document.getElementById('btnCollapseGallery');
    const btnSidebarUpload = document.getElementById('btnSidebarUpload');
    const sidebarFileInput = document.getElementById('sidebarFileInput');
    const sidebarDropzone = document.getElementById('sidebarDropzone');

    if (btnToggleGallery && gallerySidebar) {
        btnToggleGallery.onclick = () => {
            gallerySidebar.classList.toggle('collapsed');
        };
    }

    if (btnCollapseGallery && gallerySidebar) {
        btnCollapseGallery.onclick = () => {
            gallerySidebar.classList.add('collapsed');
        };
    }

    if (btnSidebarUpload && sidebarFileInput) {
        btnSidebarUpload.onclick = () => sidebarFileInput.click();
        sidebarFileInput.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
                sidebarFileInput.value = '';
            }
        };
    }

    if (sidebarDropzone) {
        sidebarDropzone.ondragover = (e) => {
            e.preventDefault();
            sidebarDropzone.classList.add('dragover');
        };
        sidebarDropzone.ondragleave = () => sidebarDropzone.classList.remove('dragover');
        sidebarDropzone.ondrop = (e) => {
            e.preventDefault();
            sidebarDropzone.classList.remove('dragover');
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        };
    }

    // Modal de Subida secundario (si existe)
    const btnUpload = document.getElementById('btnUpload');
    if (btnUpload) btnUpload.onclick = () => modalUpload.classList.remove('hidden');
    const btnCloseUpload = document.getElementById('btnCloseUpload');
    if (btnCloseUpload) btnCloseUpload.onclick = () => modalUpload.classList.add('hidden');
    const btnBrowseFile = document.getElementById('btnBrowseFile');
    const fileInput = document.getElementById('fileInput');
    if (btnBrowseFile && fileInput) {
        btnBrowseFile.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
                fileInput.value = '';
            }
        };
    }

    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
        dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('dragover'); };
        dropzone.ondragleave = () => dropzone.classList.remove('dragover');
        dropzone.ondrop = (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        };
    }

    // Settings
    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) btnSettings.onclick = () => modalSettings.classList.remove('hidden');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    if (btnCloseSettings) btnCloseSettings.onclick = () => modalSettings.classList.add('hidden');

    document.querySelectorAll('.theme-card-option').forEach(opt => {
        opt.onclick = () => applyTheme(opt.getAttribute('data-theme'));
    });

    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.onclick = () => applyTheme('custom', dot.getAttribute('data-color'));
    });

    const colorPicker = document.getElementById('customColorPicker');
    if (colorPicker) {
        colorPicker.oninput = (e) => applyTheme('custom', e.target.value);
    }

    const btnLangEs = document.getElementById('btnLangEs');
    const btnLangEn = document.getElementById('btnLangEn');
    if (btnLangEs) btnLangEs.onclick = () => applyLanguage('es');
    if (btnLangEn) btnLangEn.onclick = () => applyLanguage('en');

    document.getElementById('btnSaveApiKey').onclick = async () => {
        const key = document.getElementById('inputApiKey').value.trim();
        localStorage.setItem('natex_gemini_key', key);
        await fetch('/api/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                gemini_api_key: key,
                theme: currentTheme,
                custom_color: currentCustomColor,
                language: currentLanguage
            })
        });
        alert(currentLanguage === 'en' ? 'Settings saved successfully!' : '¡Ajustes guardados correctamente!');
        modalSettings.classList.add('hidden');
    };

    // AI Drawer
    document.getElementById('btnToggleAI').onclick = () => aiDrawer.classList.toggle('hidden');
    document.getElementById('btnCloseAI').onclick = () => aiDrawer.classList.add('hidden');
    document.getElementById('btnSendAI').onclick = () => sendAIMessage();
    document.getElementById('aiInput').onkeydown = (e) => {
        if (e.key === 'Enter') sendAIMessage();
    };

    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.onclick = () => {
            const prompt = btn.getAttribute('data-prompt');
            sendAIMessage(prompt);
        };
    });

    document.getElementById('btnAskGeminiError').onclick = () => {
        aiDrawer.classList.remove('hidden');
        const err = errorLog.innerText;
        sendAIMessage(`Este es el error de compilación de LaTeX que obtuve:\n${err}\n\nExplícame en español qué significa y cómo lo soluciono en mi código.`);
    };

    document.getElementById('btnRefreshPdf').onclick = () => {
        if (pdfViewer.src && pdfViewer.src !== 'about:blank') {
            pdfViewer.src = pdfViewer.src.split('&t=')[0] + '&t=' + Date.now();
        }
    };

    document.getElementById('btnDownloadPdf').onclick = () => {
        window.open(`/api/pdf?name=${encodeURIComponent(currentProject)}`, '_blank');
    };

    // Inicializar manejadores para todos los botones de cerrar (X)
    initModalCloseHandlers();
}

// Manejador Universal y Robusto para Cerrar Modales y Ventanas Flotantes
function initModalCloseHandlers() {
    // 1. Selector universal por clase .modal-close (la X de cualquier modal)
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const modal = btn.closest('.modal');
            if (modal) modal.classList.add('hidden');
        };
    });

    // 2. Mapeo explícito por IDs para todos los modales
    const closeMappings = [
        { btnId: 'btnCloseMath', modalId: 'modalMathKeyboard' },
        { btnId: 'btnCloseMathSecondary', modalId: 'modalMathKeyboard' },
        { btnId: 'btnCloseShare', modalId: 'modalShare' },
        { btnId: 'btnCloseTemplates', modalId: 'modalTemplates' },
        { btnId: 'btnCloseUpload', modalId: 'modalUpload' },
        { btnId: 'btnCloseSettings', modalId: 'modalSettings' },
        { btnId: 'btnCloseAI', drawerId: 'aiDrawer' }
    ];

    closeMappings.forEach(({ btnId, modalId, drawerId }) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (modalId) {
                    const m = document.getElementById(modalId);
                    if (m) m.classList.add('hidden');
                }
                if (drawerId) {
                    const d = document.getElementById(drawerId);
                    if (d) d.classList.add('hidden');
                }
            };
        }
    });

    // 3. Clic en el fondo oscuro exterior para cerrar cualquier modal
    document.querySelectorAll('.modal').forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        };
    });

    // 4. Tecla Escape para cerrar cualquier modal abierto o drawer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            const drawer = document.getElementById('aiDrawer');
            if (drawer) drawer.classList.add('hidden');
        }
    });
}

// Menús Desplegables Tipo Word / Desktop
function initDropdownMenus() {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-dropdown');
            const target = document.getElementById(targetId);
            const wasOpen = target && !target.classList.contains('hidden');

            document.querySelectorAll('.dropdown-content').forEach(d => d.classList.add('hidden'));
            document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('open'));

            if (target && !wasOpen) {
                target.classList.remove('hidden');
                btn.closest('.menu-dropdown').classList.add('open');
            }
        };
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(d => d.classList.add('hidden'));
            document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('open'));
        }
    });

    // Acciones de los ítems de menú
    const itemNew = document.getElementById('menuItemNewProject');
    if (itemNew) itemNew.onclick = createNewProjectPrompt;

    const itemCompile = document.getElementById('menuItemCompile');
    if (itemCompile) itemCompile.onclick = compileDocument;

    const itemTpl = document.getElementById('menuItemTemplates');
    if (itemTpl) itemTpl.onclick = openTemplatesModal;

    const itemSaveTpl = document.getElementById('menuItemSaveTemplate');
    if (itemSaveTpl) itemSaveTpl.onclick = saveAsTemplatePrompt;

    const itemDownPdf = document.getElementById('menuItemDownloadPdf');
    if (itemDownPdf) itemDownPdf.onclick = () => window.open(`/api/pdf?name=${encodeURIComponent(currentProject)}`, '_blank');

    const itemMath = document.getElementById('menuItemMathKeyboard');
    if (itemMath) itemMath.onclick = () => openMathModal();

    const itemVoice = document.getElementById('menuItemVoiceDictate');
    if (itemVoice) itemVoice.onclick = () => openVoiceDictateModal();

    const itemVoiceCollab = document.getElementById('menuItemVoiceDictateCollab');
    if (itemVoiceCollab) itemVoiceCollab.onclick = () => openVoiceDictateModal();

    const itemGallery = document.getElementById('menuItemGallery');
    if (itemGallery) itemGallery.onclick = () => {
        const sb = document.getElementById('gallerySidebar');
        if (sb) sb.classList.remove('collapsed');
    };

    const itemSync = document.getElementById('menuItemSyncPdf');
    if (itemSync) itemSync.onclick = syncEditorToPdf;

    const itemShare = document.getElementById('menuItemShare');
    if (itemShare) itemShare.onclick = openShareModal;

    const itemAI = document.getElementById('menuItemAI');
    if (itemAI) itemAI.onclick = () => aiDrawer.classList.toggle('hidden');

    const itemDark = document.getElementById('menuItemThemeDark');
    if (itemDark) itemDark.onclick = () => applyTheme('dark');

    const itemLight = document.getElementById('menuItemThemeLight');
    if (itemLight) itemLight.onclick = () => applyTheme('light');

    const itemConfig = document.getElementById('menuItemConfig');
    if (itemConfig) itemConfig.onclick = () => modalSettings.classList.remove('hidden');

    const itemEs = document.getElementById('menuItemLangEs');
    if (itemEs) itemEs.onclick = () => applyLanguage('es');

    const itemEn = document.getElementById('menuItemLangEn');
    if (itemEn) itemEn.onclick = () => applyLanguage('en');

    const btnQuickMath = document.getElementById('btnQuickMath');
    if (btnQuickMath) btnQuickMath.onclick = () => openMathModal();

    const btnQuickVoice = document.getElementById('btnQuickVoice');
    if (btnQuickVoice) btnQuickVoice.onclick = () => openVoiceDictateModal();
}

function openMathModal() {
    if (!modalMathKeyboard) return;
    modalMathKeyboard.classList.remove('hidden');
    renderQuickRibbonKaTeX();
    if (typeof window.renderMathFormulaLive === 'function') {
        window.renderMathFormulaLive();
    }
    const input = document.getElementById('mathFormulaInput');
    if (input) input.focus();
}

function renderQuickRibbonKaTeX() {
    const quickRibbon = document.getElementById('mathQuickRibbon');
    if (!quickRibbon || !window.katex) return;
    const quickKaTeX = {
        "\\frac{a}{b}": "\\frac{a}{b}",
        "\\sqrt{x}": "\\sqrt{x}",
        "\\sqrt[n]{x}": "\\sqrt[n]{x}",
        "x^{n}": "x^n",
        "x_{i}": "x_i",
        "\\int_{a}^{b} f(x) \, dx": "\\int_a^b",
        "\\frac{\\partial f}{\\partial x}": "\\frac{\\partial}{\\partial x}",
        "\\sum_{i=1}^{n}": "\\sum",
        "\\lim_{x \\to a}": "\\lim",
        "\\left( x \\right)": "( \\cdot )",
        "\\left[ x \\right]": "[ \\cdot ]",
        "\\left\\{ x \\right\\}": "\\{ \\cdot \\}",
        "\\left| x \\right|": "| x |",
        "|\\psi\\rangle": "|\\psi\\rangle",
        "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}": "\\begin{pmatrix} \\cdot & \\cdot \\\\ \\cdot & \\cdot \\end{pmatrix}",
        "\\pm": "\\pm",
        "\\alpha": "\\alpha",
        "\\pi": "\\pi",
        "\\infty": "\\infty"
    };

    quickRibbon.querySelectorAll('.math-quick-btn').forEach(btn => {
        const code = btn.getAttribute('data-code');
        if (quickKaTeX[code]) {
            try {
                btn.innerHTML = window.katex.renderToString(quickKaTeX[code], { displayMode: false, throwOnError: false });
            } catch (e) {}
        }
    });
}

async function createNewProjectPrompt() {
    const isEn = currentLanguage === 'en';
    const name = prompt(isEn ? 'Name for the new project (e.g. Lab_Report):' : 'Nombre del nuevo proyecto (ej. Informe_Laboratorio):');
    if (!name) return;
    const cleanName = name.trim().replace(/\s+/g, '_');
    const res = await fetch('/api/project/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: cleanName})
    });
    const data = await res.json();
    if (data.success) {
        await loadProjects();
        loadProject(cleanName);
        setView('editor');
    }
}

async function saveAsTemplatePrompt() {
    const isEn = currentLanguage === 'en';
    const name = prompt(isEn ? 'Name for your custom template:' : 'Nombre para tu plantilla personalizada:');
    if (!name) return;
    const res = await fetch('/api/templates/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({project: currentProject, name: name.trim().replace(/\s+/g, '_')})
    });
    const data = await res.json();
    if (data.success) {
        alert(isEn ? 'Template saved successfully!' : '¡Plantilla guardada con éxito!');
    }
}

// Pantalla de Inicio (Dashboard)
function initDashboard() {
    const tabHome = document.getElementById('navTabHome');
    const tabEditor = document.getElementById('navTabEditor');
    const brandLogo = document.getElementById('brandLogo');
    const brandText = document.getElementById('brandText');

    if (tabHome) tabHome.onclick = () => setView('home');
    if (tabEditor) tabEditor.onclick = () => setView('editor');
    if (brandLogo) brandLogo.onclick = () => setView('home');
    if (brandText) brandText.onclick = () => setView('home');

    const btnHeroContinue = document.getElementById('btnHeroContinue');
    if (btnHeroContinue) {
        btnHeroContinue.onclick = async () => {
            const hName = document.getElementById('heroProjectName')?.innerText?.trim().replace(/\s+/g, '_') || currentProject;
            await loadProject(hName);
            setView('editor');
        };
    }

    const heroCard = document.getElementById('heroCard');
    if (heroCard) {
        heroCard.style.cursor = 'pointer';
        heroCard.onclick = async (e) => {
            if (e.target.closest('#btnHeroContinue')) return;
            const hName = document.getElementById('heroProjectName')?.innerText?.trim().replace(/\s+/g, '_') || currentProject;
            await loadProject(hName);
            setView('editor');
        };
    }

    const btnDashNew = document.getElementById('btnDashboardNewProject');
    if (btnDashNew) btnDashNew.onclick = createNewProjectPrompt;

    const qBlank = document.getElementById('quickBlankProject');
    if (qBlank) qBlank.onclick = createNewProjectPrompt;

    const qTpl = document.getElementById('quickFromTemplate');
    if (qTpl) qTpl.onclick = openTemplatesModal;

    const qVoice = document.getElementById('quickVoiceDictate');
    if (qVoice) qVoice.onclick = openVoiceDictateModal;

    const qGal = document.getElementById('quickOpenGallery');
    if (qGal) qGal.onclick = () => {
        openGalleryModal();
    };
}

function setView(view) {
    const dashboard = document.getElementById('homeDashboard');
    const workspace = document.querySelector('.workspace');
    const tabHome = document.getElementById('navTabHome');
    const tabEditor = document.getElementById('navTabEditor');

    if (view === 'home') {
        document.body.classList.add('view-home');
        dashboard.classList.remove('hidden');
        workspace.style.display = 'none';
        if (tabHome) tabHome.classList.add('active');
        if (tabEditor) tabEditor.classList.remove('active');
        loadDashboardData();
    } else {
        document.body.classList.remove('view-home');
        dashboard.classList.add('hidden');
        workspace.style.display = 'flex';
        if (tabHome) tabHome.classList.remove('active');
        if (tabEditor) tabEditor.classList.add('active');
    }
}

async function loadDashboardData() {
    try {
        const res = await fetch('/api/projects/details');
        const data = await res.json();
        const projects = data.projects || [];
        const current = data.current || currentProject;

        const currentData = projects.find(p => p.name === current) || projects[0];
        if (currentData) {
            const hName = document.getElementById('heroProjectName');
            const hPrev = document.getElementById('heroProjectPreview');
            const hMtime = document.getElementById('heroProjectMtime');
            const hLines = document.getElementById('heroProjectLines');
            const hFiles = document.getElementById('heroProjectFiles');
            if (hName) hName.innerText = currentData.name.replace(/_/g, ' ');
            if (hPrev) hPrev.innerText = currentData.preview || '\\begin{document}...';
            if (hMtime) hMtime.innerText = currentData.mtime ? new Date(currentData.mtime * 1000).toLocaleString() : '-';
            if (hLines) hLines.innerText = currentData.lines || 0;
            if (hFiles) hFiles.innerText = currentData.files || 0;
        }

        const grid = document.getElementById('dashboardProjectsGrid');
        if (grid) {
            grid.innerHTML = '';
            const isEn = currentLanguage === 'en';
            projects.forEach(p => {
                const card = document.createElement('div');
                card.className = 'project-card' + (p.name === currentProject ? ' active-project' : '');
                card.style.cursor = 'pointer';
                const dateStr = p.mtime ? new Date(p.mtime * 1000).toLocaleDateString() : '';
                const linesStr = isEn ? 'lines' : 'líneas';
                const noTextStr = isEn ? 'No text' : 'Sin texto';
                card.innerHTML = `
                    <div class="project-card-header">
                        <span class="project-card-name">${escapeHtml(p.name.replace(/_/g, ' '))}</span>
                        ${p.has_pdf ? '<span class="project-badge">PDF ✓</span>' : ''}
                    </div>
                    <div class="project-card-preview">${p.preview ? escapeHtml(p.preview) : `<em>${noTextStr}</em>`}</div>
                    <div class="project-card-footer">
                        <span>🕒 ${dateStr}</span>
                        <span>📄 ${p.lines} ${linesStr}</span>
                    </div>
                `;
                card.onclick = async () => {
                    await loadProject(p.name);
                    setView('editor');
                };
                grid.appendChild(card);
            });
        }
    } catch (e) {
        console.error('Error loading dashboard:', e);
    }
}

// Base de Datos del Teclado Matemático Científico
const mathDatabase = {
    algebra: [
        {
            title: "Fracciones y Raíces",
            items: [
                { display: "a/b", code: "\\frac{a}{b}", label: "Fracción", cursorOffset: 6 },
                { display: "dfrac", code: "\\dfrac{a}{b}", label: "Fracción display", cursorOffset: 7 },
                { display: "1/x", code: "\\frac{1}{x}", label: "Inverso", cursorOffset: 6 },
                { display: "√x", code: "\\sqrt{x}", label: "Raíz cuadrada", cursorOffset: 6 },
                { display: "ⁿ√x", code: "\\sqrt[n]{x}", label: "Raíz enésima", cursorOffset: 8 },
                { display: "x⁻¹", code: "x^{-1}", label: "Potencia negativa", cursorOffset: 3 }
            ]
        },
        {
            title: "Potencias, Subíndices y Delimitadores",
            items: [
                { display: "xⁿ", code: "x^{n}", label: "Potencia", cursorOffset: 3 },
                { display: "xᵢ", code: "x_{i}", label: "Subíndice", cursorOffset: 3 },
                { display: "xᵢⁿ", code: "x_{i}^{n}", label: "Potencia y sub", cursorOffset: 3 },
                { display: "x²", code: "x^{2}", label: "Cuadrado", cursorOffset: 3 },
                { display: "x³", code: "x^{3}", label: "Cubo", cursorOffset: 3 },
                { display: "(x)", code: "\\left( x \\right)", label: "Paréntesis esc.", cursorOffset: 7 },
                { display: "[x]", code: "\\left[ x \\right]", label: "Corchetes esc.", cursorOffset: 7 },
                { display: "{x}", code: "\\left\\{ x \\right\\}", label: "Llaves esc.", cursorOffset: 8 },
                { display: "|x|", code: "\\left| x \\right|", label: "Valor absoluto", cursorOffset: 7 },
                { display: "‖x‖", code: "\\left\\| \\vec{x} \\right\\|", label: "Norma / Módulo", cursorOffset: 8 },
                { display: "⟨x⟩", code: "\\langle x \\rangle", label: "Promedio / Dirac", cursorOffset: 8 }
            ]
        },
        {
            title: "Operadores y Relaciones",
            items: [
                { display: "±", code: "\\pm", label: "Más menos" },
                { display: "∓", code: "\\mp", label: "Menos más" },
                { display: "×", code: "\\times", label: "Multiplicación" },
                { display: "÷", code: "\\div", label: "División" },
                { display: "·", code: "\\cdot", label: "Punto" },
                { display: "≈", code: "\\approx", label: "Aproximadamente" },
                { display: "≠", code: "\\neq", label: "Diferente" },
                { display: "≤", code: "\\le", label: "Menor o igual" },
                { display: "≥", code: "\\ge", label: "Mayor o igual" },
                { display: "≪", code: "\\ll", label: "Mucho menor" },
                { display: "≫", code: "\\gg", label: "Mucho mayor" },
                { display: "≡", code: "\\equiv", label: "Congruente / Idéntico" },
                { display: "∝", code: "\\propto", label: "Proporcional" },
                { display: "∞", code: "\\infty", label: "Infinito" },
                { display: "text", code: "\\text{ texto }", label: "Texto en fórmula", cursorOffset: 6 }
            ]
        },
        {
            title: "Polinomios, Ecuaciones y Factorización",
            items: [
                { display: "Ec. Cuadrática", code: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", label: "Fórmula cuadrática" },
                { display: "(a+b)²", code: "(a+b)^2 = a^2 + 2ab + b^2", label: "Binomio al cuadrado" },
                { display: "(a-b)²", code: "(a-b)^2 = a^2 - 2ab + b^2", label: "Binomio resta cuadrado" },
                { display: "a²-b²", code: "a^2 - b^2 = (a-b)(a+b)", label: "Diferencia de cuadrados" },
                { display: "(a+b)³", code: "(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3", label: "Binomio al cubo" },
                { display: "Binomio (n k)", code: "\\binom{n}{k} = \\frac{n!}{k!(n-k)!}", label: "Coeficiente binomial" },
                { display: "n!", code: "n!", label: "Factorial" },
                { display: "P(n,k)", code: "P(n,k) = \\frac{n!}{(n-k)!}", label: "Permutaciones" },
                { display: "C(n,k)", code: "C(n,k) = \\binom{n}{k}", label: "Combinaciones" }
            ]
        },
        {
            title: "Logaritmos y Exponenciales",
            items: [
                { display: "ln(x)", code: "\\ln(x)", label: "Logaritmo natural" },
                { display: "log(x)", code: "\\log(x)", label: "Logaritmo decimal" },
                { display: "log_b(x)", code: "\\log_{b}(x)", label: "Logaritmo en base b", cursorOffset: 5 },
                { display: "eˣ", code: "e^{x}", label: "Exponencial", cursorOffset: 3 },
                { display: "exp(x)", code: "\\exp(x)", label: "Función exp", cursorOffset: 5 },
                { display: "10ˣ", code: "10^{x}", label: "Potencia de 10", cursorOffset: 4 },
                { display: "aˣ", code: "a^{x}", label: "Exponencial base a", cursorOffset: 3 },
                { display: "ln(ab)", code: "\\ln(ab) = \\ln(a) + \\ln(b)", label: "Propiedad producto log" },
                { display: "Cambio base", code: "\\log_b(a) = \\frac{\\ln(a)}{\\ln(b)}", label: "Cambio de base" }
            ]
        },
        {
            title: "Trigonometría e Hiperbólicas",
            items: [
                { display: "sin(x)", code: "\\sin(x)", label: "Seno" },
                { display: "cos(x)", code: "\\cos(x)", label: "Coseno" },
                { display: "tan(x)", code: "\\tan(x)", label: "Tangente" },
                { display: "cot(x)", code: "\\cot(x)", label: "Cotangente" },
                { display: "sec(x)", code: "\\sec(x)", label: "Secante" },
                { display: "csc(x)", code: "\\csc(x)", label: "Cosecante" },
                { display: "arcsin", code: "\\arcsin(x)", label: "Arcoseno" },
                { display: "arccos", code: "\\arccos(x)", label: "Arcocoseno" },
                { display: "arctan", code: "\\arctan(x)", label: "Arcotangente" },
                { display: "sinh(x)", code: "\\sinh(x)", label: "Seno hiperbólico" },
                { display: "cosh(x)", code: "\\cosh(x)", label: "Coseno hiperbólico" },
                { display: "tanh(x)", code: "\\tanh(x)", label: "Tangente hiperbólica" },
                { display: "sin²+cos²=1", code: "\\sin^2(x) + \\cos^2(x) = 1", label: "Identidad fundamental" },
                { display: "sin(2x)", code: "\\sin(2x) = 2\\sin(x)\\cos(x)", label: "Seno ángulo doble" }
            ]
        },
        {
            title: "Sistemas de Ecuaciones, Casos y Progresiones",
            items: [
                { display: "Sistema 2x2", code: "\\begin{cases}\n  a_1 x + b_1 y = c_1 \\\\\n  a_2 x + b_2 y = c_2\n\\end{cases}", label: "Sistema 2x2" },
                { display: "Sistema 3x3", code: "\\begin{cases}\n  x + y + z = d_1 \\\\\n  2x - y + z = d_2 \\\\\n  -x + 2y + 2z = d_3\n\\end{cases}", label: "Sistema 3x3" },
                { display: "Función trozos", code: "f(x) = \\begin{cases}\n  x^2 & \\text{si } x \\ge 0 \\\\\n  -x & \\text{si } x < 0\n\\end{cases}", label: "Función a trozos (cases)" },
                { display: "Prog. Aritm.", code: "a_n = a_1 + (n-1)d", label: "Progresión aritmética" },
                { display: "Prog. Geom.", code: "a_n = a_1 \\cdot r^{n-1}", label: "Progresión geométrica" },
                { display: "Suma Aritm.", code: "S_n = \\frac{n(a_1 + a_n)}{2}", label: "Suma progresión aritmética" }
            ]
        }
    ],
    calculus: [
        {
            title: "Derivadas Ordinarias, Parciales y Temporales",
            items: [
                { display: "df/dx", code: "\\frac{df}{dx}", label: "Derivada ordinaria", cursorOffset: 6 },
                { display: "d²f/dx²", code: "\\frac{d^2 f}{dx^2}", label: "Segunda derivada", cursorOffset: 8 },
                { display: "dⁿf/dxⁿ", code: "\\frac{d^n f}{dx^n}", label: "Derivada enésima", cursorOffset: 8 },
                { display: "∂f/∂x", code: "\\frac{\\partial f}{\\partial x}", label: "Derivada parcial", cursorOffset: 15 },
                { display: "∂²f/∂x²", code: "\\frac{\\partial^2 f}{\\partial x^2}", label: "Segunda parcial", cursorOffset: 17 },
                { display: "∂²f/∂x∂y", code: "\\frac{\\partial^2 f}{\\partial x \\partial y}", label: "Parcial cruzada", cursorOffset: 17 },
                { display: "∂/∂t", code: "\\frac{\\partial}{\\partial t}", label: "Parcial temporal", cursorOffset: 15 },
                { display: "∂²/∂t²", code: "\\frac{\\partial^2}{\\partial t^2}", label: "Segunda temporal", cursorOffset: 17 },
                { display: "ẋ, ẍ", code: "\\dot{x}, \\ddot{x}", label: "Notación Newton (tiempo)" },
                { display: "y', y''", code: "y', y'', y'''", label: "Notación Lagrange" },
                { display: "Regla Cadena", code: "\\frac{df}{dt} = \\frac{\\partial f}{\\partial x}\\frac{dx}{dt} + \\frac{\\partial f}{\\partial y}\\frac{dy}{dt}", label: "Regla de la cadena" },
                { display: "Diferencial df", code: "df = \\frac{\\partial f}{\\partial x}dx + \\frac{\\partial f}{\\partial y}dy", label: "Diferencial total" },
                { display: "∂_μ", code: "\\partial_\\mu", label: "Operador 4-parcial" }
            ]
        },
        {
            title: "Integrales Simples, Múltiples y de Contorno",
            items: [
                { display: "∫ f dx", code: "\\int f(x) \\, dx", label: "Integral indefinida", cursorOffset: 5 },
                { display: "∫ₐᵇ", code: "\\int_{a}^{b} f(x) \\, dx", label: "Integral definida", cursorOffset: 6 },
                { display: "∫₋∞^∞", code: "\\int_{-\\infty}^{\\infty} f(x) \\, dx", label: "Integral impropia completa", cursorOffset: 24 },
                { display: "∫₀^∞", code: "\\int_{0}^{\\infty} f(x) \\, dx", label: "Integral impropia [0, ∞)", cursorOffset: 18 },
                { display: "∬", code: "\\iint_{D} f(x,y) \\, dx \\, dy", label: "Integral doble", cursorOffset: 7 },
                { display: "∭", code: "\\iiint_{V} f(x,y,z) \\, dV", label: "Integral triple", cursorOffset: 8 },
                { display: "∮", code: "\\oint_{C} \\vec{F} \\cdot d\\vec{r}", label: "Integral de línea cerrada", cursorOffset: 7 },
                { display: "∯", code: "\\oiint_{S} \\vec{E} \\cdot d\\vec{A}", label: "Integral de superficie cerrada", cursorOffset: 8 },
                { display: "Por Partes", code: "\\int u \\, dv = uv - \\int v \\, du", label: "Integración por partes" },
                { display: "Teor. Fund.", code: "\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)", label: "Teorema fundamental del cálculo" },
                { display: "Longitud Arco", code: "L = \\int_{a}^{b} \\sqrt{1 + [f'(x)]^2} \\, dx", label: "Longitud de curva" }
            ]
        },
        {
            title: "Límites, Continuidad y Reglas",
            items: [
                { display: "lim x→a", code: "\\lim_{x \\to a} f(x)", label: "Límite puntual", cursorOffset: 9 },
                { display: "lim x→∞", code: "\\lim_{x \\to \\infty} f(x)", label: "Límite al infinito", cursorOffset: 20 },
                { display: "lim x→-∞", code: "\\lim_{x \\to -\\infty} f(x)", label: "Límite a menos infinito", cursorOffset: 21 },
                { display: "lim x→0⁺", code: "\\lim_{x \\to 0^+} f(x)", label: "Límite lateral derecho", cursorOffset: 17 },
                { display: "lim x→0⁻", code: "\\lim_{x \\to 0^-} f(x)", label: "Límite lateral izquierdo", cursorOffset: 17 },
                { display: "Def. Derivada", code: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}", label: "Definición derivada" },
                { display: "L'Hôpital", code: "\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}", label: "Regla de L'Hôpital" }
            ]
        },
        {
            title: "Series, Sumatorias y Productos",
            items: [
                { display: "∑ᵢ₌₁ⁿ", code: "\\sum_{i=1}^{n} a_i", label: "Sumatoria finita", cursorOffset: 6 },
                { display: "∑ₙ₌₀^∞", code: "\\sum_{n=0}^{\\infty} a_n", label: "Serie infinita", cursorOffset: 6 },
                { display: "∏ᵢ₌₁ⁿ", code: "\\prod_{i=1}^{n} x_i", label: "Productoria", cursorOffset: 6 },
                { display: "Serie Taylor", code: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n", label: "Serie de Taylor" },
                { display: "Maclaurin", code: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(0)}{n!} x^n", label: "Serie de Maclaurin" },
                { display: "Serie Geom.", code: "\\sum_{k=0}^{\\infty} r^k = \\frac{1}{1-r}", label: "Serie geométrica" },
                { display: "Serie Exp.", code: "e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}", label: "Serie exponencial" },
                { display: "Fourier", code: "f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\left( a_n \\cos\\frac{n\\pi x}{L} + b_n \\sin\\frac{n\\pi x}{L} \\right)", label: "Serie de Fourier" }
            ]
        },
        {
            title: "Cálculo Vectorial y Teoremas Integrales",
            items: [
                { display: "∇f", code: "\\nabla f", label: "Gradiente" },
                { display: "∇·F", code: "\\nabla \\cdot \\vec{F}", label: "Divergencia" },
                { display: "∇×F", code: "\\nabla \\times \\vec{F}", label: "Rotacional" },
                { display: "∇²f", code: "\\nabla^2 f", label: "Laplaciano" },
                { display: "Teor. Green", code: "\\oint_{\\partial D} (P\\,dx + Q\\,dy) = \\iint_{D} \\left( \\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y} \\right) dA", label: "Teorema de Green" },
                { display: "Teor. Stokes", code: "\\oint_{C} \\vec{F} \\cdot d\\vec{r} = \\iint_{S} (\\nabla \\times \\vec{F}) \\cdot d\\vec{A}", label: "Teorema de Stokes" },
                { display: "Teor. Gauss", code: "\\iiint_{V} (\\nabla \\cdot \\vec{F}) \\, dV = \\oiint_{\\partial V} \\vec{F} \\cdot d\\vec{A}", label: "Teorema de la Divergencia (Gauss)" }
            ]
        },
        {
            title: "Ecuaciones Diferenciales y Transformadas",
            items: [
                { display: "EDO 1er orden", code: "y' + P(x)y = Q(x)", label: "EDO lineal 1er orden" },
                { display: "EDO 2do orden", code: "a y'' + b y' + c y = f(x)", label: "EDO lineal 2do orden" },
                { display: "Oscilador", code: "m\\ddot{x} + c\\dot{x} + kx = F(t)", label: "Oscilador armónico" },
                { display: "Ec. Onda", code: "\\frac{\\partial^2 u}{\\partial t^2} = v^2 \\nabla^2 u", label: "Ecuación de onda" },
                { display: "Ec. Calor", code: "\\frac{\\partial u}{\\partial t} = \\alpha \\nabla^2 u", label: "Ecuación del calor" },
                { display: "Laplace Ec.", code: "\\nabla^2 \\phi = 0", label: "Ecuación de Laplace" },
                { display: "Poisson Ec.", code: "\\nabla^2 \\phi = -\\frac{\\rho}{\\varepsilon_0}", label: "Ecuación de Poisson" },
                { display: "Transf. Laplace", code: "\\mathcal{L}\\{f(t)\\} = \\int_{0}^{\\infty} e^{-st} f(t) \\, dt", label: "Transformada de Laplace" },
                { display: "Transf. Fourier", code: "\\mathcal{F}\\{f(t)\\} = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} \\, dt", label: "Transformada de Fourier" }
            ]
        }
    ],
    cuantica: [
        {
            title: "Notación Dirac (Bra - Ket)",
            items: [
                { display: "|ψ⟩", code: "|\\psi\\rangle", label: "Ket estado" },
                { display: "⟨ϕ|", code: "\\langle\\phi|", label: "Bra estado" },
                { display: "⟨ϕ|ψ⟩", code: "\\langle\\phi | \\psi\\rangle", label: "Bra-Ket (producto interno)" },
                { display: "⟨x|ψ⟩", code: "\\langle x | \\psi\\rangle", label: "Función de onda espacial" },
                { display: "|ψ⟩⟨ψ|", code: "|\\psi\\rangle\\langle\\psi|", label: "Operador proyector" },
                { display: "⟨Â⟩", code: "\\langle \\hat{A} \\rangle = \\langle\\psi| \\hat{A} |\\psi\\rangle", label: "Valor esperado" },
                { display: "|↑⟩", code: "|\\uparrow\\rangle", label: "Espín Up" },
                { display: "|↓⟩", code: "|\\downarrow\\rangle", label: "Espín Down" }
            ]
        },
        {
            title: "Ecuaciones y Operadores Cuánticos",
            items: [
                { display: "Schrödinger", code: "i\\hbar \\frac{\\partial}{\\partial t}|\\psi(t)\\rangle = \\hat{H}|\\psi(t)\\rangle", label: "Ec. Schrödinger temporal" },
                { display: "H|ψ⟩=E|ψ⟩", code: "\\hat{H}|\\psi\\rangle = E|\\psi\\rangle", label: "Ec. Schrödinger independiente" },
                { display: "p̂=-iℏ∇", code: "\\hat{p} = -i\\hbar \\nabla", label: "Operador momento" },
                { display: "[Â, B̂]", code: "[\\hat{A}, \\hat{B}] = \\hat{A}\\hat{B} - \\hat{B}\\hat{A}", label: "Conmutador" },
                { display: "{Â, B̂}", code: "\\{\\hat{A}, \\hat{B}\\} = \\hat{A}\\hat{B} + \\hat{B}\\hat{A}", label: "Anticonmutador" },
                { display: "ΔxΔp≥ℏ/2", code: "\\Delta x \\, \\Delta p \\ge \\frac{\\hbar}{2}", label: "Principio de Incertidumbre" },
                { display: "â†, â", code: "\\hat{a}^\\dagger, \\hat{a}", label: "Creación y Aniquilación" },
                { display: "N̂=â†â", code: "\\hat{N} = \\hat{a}^\\dagger \\hat{a}", label: "Operador Número" },
                { display: "Matriz ρ", code: "\\rho = \\sum_{i} p_i |\\psi_i\\rangle\\langle\\psi_i|", label: "Matriz densidad" }
            ]
        },
        {
            title: "Matrices de Pauli, Dirac & Relatividad",
            items: [
                { display: "σ_x", code: "\\sigma_x = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}", label: "Matriz Pauli X" },
                { display: "σ_y", code: "\\sigma_y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}", label: "Matriz Pauli Y" },
                { display: "σ_z", code: "\\sigma_z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}", label: "Matriz Pauli Z" },
                { display: "S = ℏ/2 σ", code: "\\vec{S} = \\frac{\\hbar}{2}\\vec{\\sigma}", label: "Operador de espín" },
                { display: "γ^μ", code: "\\gamma^\\mu", label: "Matrices de Dirac" },
                { display: "Ec. Dirac", code: "(i\\gamma^\\mu \\partial_\\mu - m)\\psi = 0", label: "Ecuación de Dirac" },
                { display: "□", code: "\\Box = \\frac{1}{c^2}\\frac{\\partial^2}{\\partial t^2} - \\nabla^2", label: "Operador D'Alembertiano" },
                { display: "g_μν", code: "g_{\\mu\\nu}", label: "Tensor métrico" },
                { display: "ℏ", code: "\\hbar", label: "Constante h-barra" }
            ]
        }
    ],
    matrices: [
        {
            title: "Matrices con Paréntesis y Corchetes",
            items: [
                { display: "Matriz 2x2", code: "\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}", label: "Matriz 2x2 (pmatrix)" },
                { display: "Matriz 3x3", code: "\\begin{pmatrix}\n  a_{11} & a_{12} & a_{13} \\\\\n  a_{21} & a_{22} & a_{23} \\\\\n  a_{31} & a_{32} & a_{33}\n\\end{pmatrix}", label: "Matriz 3x3 (pmatrix)" },
                { display: "Corchetes 2x2", code: "\\begin{bmatrix}\n  a & b \\\\\n  c & d\n\\end{bmatrix}", label: "Matriz 2x2 (bmatrix)" },
                { display: "Corchetes 3x3", code: "\\begin{bmatrix}\n  a & b & c \\\\\n  d & e & f \\\\\n  g & h & i\n\\end{bmatrix}", label: "Matriz 3x3 (bmatrix)" }
            ]
        },
        {
            title: "Determinantes y Vectores",
            items: [
                { display: "Det 2x2", code: "\\begin{vmatrix}\n  a & b \\\\\n  c & d\n\\end{vmatrix}", label: "Determinante 2x2" },
                { display: "Det 3x3", code: "\\begin{vmatrix}\n  a & b & c \\\\\n  d & e & f \\\\\n  g & h & i\n\\end{vmatrix}", label: "Determinante 3x3" },
                { display: "Vec Columna", code: "\\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}", label: "Vector columna 3D" },
                { display: "Vec Fila", code: "\\begin{pmatrix} x & y & z \\end{pmatrix}", label: "Vector fila 3D" },
                { display: "v⃗", code: "\\vec{v}", label: "Vector con flecha" },
                { display: "v̂", code: "\\hat{v}", label: "Vector unitario" },
                { display: "Aᵀ", code: "A^T", label: "Transpuesta" },
                { display: "A⁻¹", code: "A^{-1}", label: "Inversa" },
                { display: "A†", code: "A^\\dagger", label: "Hermítico adjunto" }
            ]
        }
    ],
    griegas: [
        {
            title: "Letras Griegas (Minúsculas)",
            items: [
                { display: "α", code: "\\alpha", label: "alpha" },
                { display: "β", code: "\\beta", label: "beta" },
                { display: "γ", code: "\\gamma", label: "gamma" },
                { display: "δ", code: "\\delta", label: "delta" },
                { display: "ε", code: "\\varepsilon", label: "epsilon" },
                { display: "ζ", code: "\\zeta", label: "zeta" },
                { display: "η", code: "\\eta", label: "eta" },
                { display: "θ", code: "\\theta", label: "theta" },
                { display: "λ", code: "\\lambda", label: "lambda" },
                { display: "μ", code: "\\mu", label: "mu" },
                { display: "ν", code: "\\nu", label: "nu" },
                { display: "ξ", code: "\\xi", label: "xi" },
                { display: "π", code: "\\pi", label: "pi" },
                { display: "ρ", code: "\\rho", label: "rho" },
                { display: "σ", code: "\\sigma", label: "sigma" },
                { display: "τ", code: "\\tau", label: "tau" },
                { display: "φ", code: "\\varphi", label: "phi" },
                { display: "χ", code: "\\chi", label: "chi" },
                { display: "ψ", code: "\\psi", label: "psi" },
                { display: "ω", code: "\\omega", label: "omega" }
            ]
        },
        {
            title: "Letras Griegas (Mayúsculas)",
            items: [
                { display: "Γ", code: "\\Gamma", label: "Gamma" },
                { display: "Δ", code: "\\Delta", label: "Delta" },
                { display: "Θ", code: "\\Theta", label: "Theta" },
                { display: "Λ", code: "\\Lambda", label: "Lambda" },
                { display: "Ξ", code: "\\Xi", label: "Xi" },
                { display: "Π", code: "\\Pi", label: "Pi" },
                { display: "Σ", code: "\\Sigma", label: "Sigma" },
                { display: "Φ", code: "\\Phi", label: "Phi" },
                { display: "Ψ", code: "\\Psi", label: "Psi" },
                { display: "Ω", code: "\\Omega", label: "Omega" }
            ]
        },
        {
            title: "Lógica y Conjuntos",
            items: [
                { display: "∀", code: "\\forall", label: "Para todo" },
                { display: "∃", code: "\\exists", label: "Existe" },
                { display: "∈", code: "\\in", label: "Pertenece" },
                { display: "∉", code: "\\notin", label: "No pertenece" },
                { display: "⊂", code: "\\subset", label: "Subconjunto" },
                { display: "⊆", code: "\\subseteq", label: "Subconjunto o igual" },
                { display: "∪", code: "\\cup", label: "Unión" },
                { display: "∩", code: "\\cap", label: "Intersección" },
                { display: "∅", code: "\\emptyset", label: "Conjunto vacío" },
                { display: "ℝ", code: "\\mathbb{R}", label: "Reales" },
                { display: "ℂ", code: "\\mathbb{C}", label: "Complejos" },
                { display: "ℕ", code: "\\mathbb{N}", label: "Naturales" },
                { display: "ℤ", code: "\\mathbb{Z}", label: "Enteros" },
                { display: "⇒", code: "\\implies", label: "Implica" },
                { display: "⇔", code: "\\iff", label: "Si y solo si" }
            ]
        }
    ]
};

// Aliases para soportar tanto identificadores en español como en inglés
mathDatabase.calculo = mathDatabase.calculus;
mathDatabase['cálculo'] = mathDatabase.calculus;
mathDatabase.algebra = mathDatabase.algebra;
mathDatabase['álgebra'] = mathDatabase.algebra;
mathDatabase.cuantica = mathDatabase.cuantica;
mathDatabase['cuántica'] = mathDatabase.cuantica;
mathDatabase.matrices = mathDatabase.matrices;
mathDatabase.griegas = mathDatabase.griegas;

// Controlador del Constructor y Editor de Ecuaciones
function initMathKeyboard() {
    const modal = document.getElementById('modalMathKeyboard');
    const btnClose = document.getElementById('btnCloseMath');
    const btnCloseSecondary = document.getElementById('btnCloseMathSecondary');
    const tabsContainer = document.getElementById('mathCategoryTabs');
    const bodyContainer = document.getElementById('mathBody');
    const searchInput = document.getElementById('mathSearchInput');
    const formulaInput = document.getElementById('mathFormulaInput');
    const formulaPreview = document.getElementById('mathFormulaPreview');
    const renderStatus = document.getElementById('mathRenderStatus');
    const btnClear = document.getElementById('btnMathClear');
    const btnUndo = document.getElementById('btnMathUndo');
    const btnRedo = document.getElementById('btnMathRedo');
    const modeSwitch = document.getElementById('mathModeSwitch');
    const btnCopy = document.getElementById('btnCopyMathCode');
    const btnInsert = document.getElementById('btnInsertMathCode');
    const quickRibbon = document.getElementById('mathQuickRibbon');

    let currentCategory = 'algebra';
    let currentMode = 'inline'; // 'inline' | 'display' | 'equation'
    let historyStack = [];
    let historyIndex = -1;

    function recordHistory() {
        if (!formulaInput) return;
        if (historyIndex < historyStack.length - 1) {
            historyStack = historyStack.slice(0, historyIndex + 1);
        }
        historyStack.push(formulaInput.value);
        historyIndex++;
        if (historyStack.length > 50) {
            historyStack.shift();
            historyIndex--;
        }
    }

    function renderFormulaLive() {
        if (!formulaPreview || !formulaInput) return;
        const code = formulaInput.value.trim();

        if (!code) {
            formulaPreview.innerHTML = '<span class="math-preview-empty-hint">✨ Haz clic en los símbolos o escribe para ver la vista previa en vivo...</span>';
            if (renderStatus) {
                renderStatus.innerText = 'KaTeX ✓';
                renderStatus.style.color = 'var(--success)';
            }
            return;
        }

        if (window.katex) {
            try {
                window.katex.render(code, formulaPreview, {
                    displayMode: currentMode !== 'inline',
                    throwOnError: false,
                    errorColor: '#EF4444'
                });
                if (renderStatus) {
                    renderStatus.innerText = 'KaTeX ✓';
                    renderStatus.style.color = 'var(--success)';
                }
            } catch (e) {
                if (renderStatus) {
                    renderStatus.innerText = 'Escribiendo...';
                    renderStatus.style.color = 'var(--fox-orange)';
                }
            }
        } else {
            // Fallback si KaTeX no está cargado
            formulaPreview.innerHTML = `<code>${escapeHtml(code)}</code>`;
        }
    }

    function insertIntoFormula(codeSnippet, cursorOffset) {
        if (!formulaInput) return;
        recordHistory();

        const start = formulaInput.selectionStart;
        const end = formulaInput.selectionEnd;
        const val = formulaInput.value;
        const before = val.substring(0, start);
        const after = val.substring(end);

        // Añadir espacio de separación si es necesario
        const needsSpaceBefore = before.length > 0 && 
            !before.endsWith(' ') && 
            !before.endsWith('{') && 
            !before.endsWith('(') && 
            !before.endsWith('[') && 
            !before.endsWith('^') && 
            !before.endsWith('_') && 
            !codeSnippet.startsWith('^') && 
            !codeSnippet.startsWith('_');

        const insertion = (needsSpaceBefore ? ' ' : '') + codeSnippet;
        formulaInput.value = before + insertion + after;

        const offset = cursorOffset !== undefined ? (needsSpaceBefore ? 1 : 0) + cursorOffset : insertion.length;
        const newPos = start + offset;

        formulaInput.focus();
        formulaInput.setSelectionRange(newPos, newPos);

        renderFormulaLive();
    }

    function renderCategory(cat, query = '') {
        currentCategory = cat;
        bodyContainer.innerHTML = '';
        const q = query.trim().toLowerCase();
        
        let targetKey = cat;
        if (cat === 'calculo' || cat === 'calculus' || cat === 'cálculo') targetKey = 'calculus';
        if (cat === 'algebra' || cat === 'álgebra' || cat === 'basico') targetKey = 'algebra';
        if (cat === 'cuantica' || cat === 'cuántica' || cat === 'fisica') targetKey = 'cuantica';
        if (cat === 'matrices' || cat === 'matriz') targetKey = 'matrices';
        if (cat === 'griegas' || cat === 'simbolos' || cat === 'logica') targetKey = 'griegas';

        // Si hay término de búsqueda, buscar en toda la base matemática; si no, en la categoría actual
        let sections = [];
        if (q) {
            const visited = new Set();
            Object.keys(mathDatabase).forEach(c => {
                const arr = mathDatabase[c];
                if (Array.isArray(arr) && !visited.has(arr)) {
                    visited.add(arr);
                    sections = sections.concat(arr);
                }
            });
        } else {
            sections = mathDatabase[targetKey] || mathDatabase[cat] || [];
        }

        sections.forEach(sec => {
            const filteredItems = sec.items.filter(item => {
                if (!q) return true;
                return item.label.toLowerCase().includes(q) ||
                       item.code.toLowerCase().includes(q) ||
                       item.display.toLowerCase().includes(q);
            });

            if (filteredItems.length > 0) {
                const secDiv = document.createElement('div');
                secDiv.className = 'math-section';
                secDiv.innerHTML = `<div class="math-section-title">${sec.title}</div>`;

                const grid = document.createElement('div');
                grid.className = 'math-grid';

                filteredItems.forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'math-btn';
                    btn.type = 'button';
                    btn.title = item.code + ' (' + item.label + ')';
                    btn.innerHTML = `
                        <span>${escapeHtml(item.display)}</span>
                        <span class="math-btn-label">${escapeHtml(item.label)}</span>
                    `;

                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        insertIntoFormula(item.code, item.cursorOffset);
                    };

                    grid.appendChild(btn);
                });

                secDiv.appendChild(grid);
                bodyContainer.appendChild(secDiv);
            }
        });

        if (bodyContainer.children.length === 0) {
            bodyContainer.innerHTML = '<p class="text-muted" style="text-align:center; padding:20px; font-size:13px;">No se encontraron símbolos para esa búsqueda.</p>';
        }
    }

    // Inicializar Ribbon Rápido con render KaTeX
    if (quickRibbon) {
        renderQuickRibbonKaTeX();
        quickRibbon.querySelectorAll('.math-quick-btn').forEach(btn => {
            const code = btn.getAttribute('data-code');
            btn.onclick = (e) => {
                e.preventDefault();
                if (code) insertIntoFormula(code);
            };
        });
    }

    // Pestañas de categoría
    if (tabsContainer) {
        tabsContainer.querySelectorAll('.math-cat-btn').forEach(btn => {
            btn.onclick = () => {
                tabsContainer.querySelectorAll('.math-cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (searchInput) searchInput.value = '';
                renderCategory(btn.getAttribute('data-cat'));
            };
        });
    }

    // Búsqueda en tiempo real
    if (searchInput) {
        searchInput.oninput = (e) => {
            renderCategory(currentCategory, e.target.value);
        };
    }

    // Eventos de edición manual en el textarea de fórmula
    if (formulaInput) {
        formulaInput.oninput = () => {
            renderFormulaLive();
        };

        formulaInput.onkeydown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (btnInsert) btnInsert.click();
            } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                if (btnUndo) btnUndo.click();
            } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                if (btnRedo) btnRedo.click();
            }
        };
    }

    // Botones Limpiar, Deshacer, Rehacer
    if (btnClear) {
        btnClear.onclick = () => {
            if (!formulaInput.value) return;
            recordHistory();
            formulaInput.value = '';
            renderFormulaLive();
            formulaInput.focus();
        };
    }

    if (btnUndo) {
        btnUndo.onclick = () => {
            if (historyIndex > 0) {
                historyIndex--;
                formulaInput.value = historyStack[historyIndex];
                renderFormulaLive();
            }
        };
    }

    if (btnRedo) {
        btnRedo.onclick = () => {
            if (historyIndex < historyStack.length - 1) {
                historyIndex++;
                formulaInput.value = historyStack[historyIndex];
                renderFormulaLive();
            }
        };
    }

    // Selector de modo de formato
    if (modeSwitch) {
        modeSwitch.querySelectorAll('.math-mode-btn').forEach(btn => {
            btn.onclick = () => {
                modeSwitch.querySelectorAll('.math-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.getAttribute('data-mode') || 'inline';
                renderFormulaLive();
            };
        });
    }

    // Cerrar modal
    if (btnClose && modal) btnClose.onclick = () => modal.classList.add('hidden');
    if (btnCloseSecondary && modal) btnCloseSecondary.onclick = () => modal.classList.add('hidden');

    // Botón Copiar
    if (btnCopy) {
        btnCopy.onclick = async () => {
            const code = formulaInput.value.trim();
            if (!code) return;
            let formatted = code;
            if (currentMode === 'inline') {
                formatted = `$${code}$`;
            } else if (currentMode === 'display') {
                formatted = `\\[\n  ${code}\n\\]`;
            } else if (currentMode === 'equation') {
                formatted = `\\begin{equation}\n  ${code}\n\\end{equation}`;
            }

            await fallbackCopyText(formatted);
            const orig = btnCopy.innerHTML;
            btnCopy.innerHTML = '✓ ¡Copiado!';
            btnCopy.style.color = '#10B981';
            setTimeout(() => { 
                btnCopy.innerHTML = orig; 
                btnCopy.style.color = '';
            }, 1500);
        };
    }

    // Botón Insertar en Documento
    if (btnInsert) {
        btnInsert.onclick = () => {
            const code = formulaInput.value.trim();
            if (!code) {
                alert('Escribe o selecciona alguna fórmula primero.');
                return;
            }
            let formatted = code;
            if (currentMode === 'inline') {
                formatted = `$${code}$`;
            } else if (currentMode === 'display') {
                formatted = `\n\\[\n    ${code}\n\\]\n`;
            } else if (currentMode === 'equation') {
                formatted = `\n\\begin{equation}\n    ${code}\n\\end{equation}\n`;
            }

            // Inserción en el documento principal (codeEditor)
            insertAtCursor(formatted, formatted.length);
            
            modal.classList.add('hidden');

            const dict = i18n[currentLanguage] || i18n.es;
            if (editorStatus) {
                editorStatus.innerText = dict.status_math_inserted || '✓ Ecuación insertada';
                editorStatus.style.color = '#10B981';
                setTimeout(() => {
                    editorStatus.innerText = dict.status_auto_saved || 'Guardado automático ✓';
                    editorStatus.style.color = '';
                }, 2500);
            }
        };
    }

    // Atajo Alt + M y Escape
    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'm' || e.key === 'M')) {
            e.preventDefault();
            modal.classList.toggle('hidden');
            if (!modal.classList.contains('hidden')) {
                renderFormulaLive();
                if (formulaInput) formulaInput.focus();
            }
        } else if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    });

    // Cargar categoría inicial y estado inicial
    renderCategory('algebra');
    if (formulaInput && !formulaInput.value) {
        formulaInput.value = '\\int_{a}^{b} f(x) \\, dx';
        recordHistory();
    }
    renderFormulaLive();
    window.renderMathFormulaLive = renderFormulaLive;
}

// Controlador SyncTeX
function initSyncTeX() {
    const btnSync = document.getElementById('btnSyncToPdf');
    if (btnSync) {
        btnSync.onclick = () => syncEditorToPdf();
    }
}

async function syncEditorToPdf() {
    const cursor = codeEditor.selectionStart;
    const textBefore = codeEditor.value.substring(0, cursor);
    const currentLine = textBefore.split('\n').length;

    try {
        const res = await fetch(`/api/synctex/forward?project=${encodeURIComponent(currentProject)}&line=${currentLine}`);
        const data = await res.json();
        if (data.success && data.page) {
            const pageNum = data.page;
            const currentSrc = pdfViewer.src.split('#')[0];
            pdfViewer.src = `${currentSrc}#page=${pageNum}`;

            const dict = i18n[currentLanguage] || i18n.es;
            editorStatus.innerText = `📍 Línea ${currentLine} -> Pág. ${pageNum} ✓`;
            editorStatus.style.color = '#10B981';
            setTimeout(() => {
                editorStatus.innerText = dict.status_auto_saved;
            }, 2500);
        } else {
            alert('Compila primero el documento (Ctrl+S) para generar los datos de sincronización SyncTeX.');
        }
    } catch (e) {
        console.error('Error SyncTeX:', e);
    }
}

// ==========================================
// Dictáfono Inteligente de Clases & Túnel P2P
// ==========================================
let voiceQrInstance = null;
let shareQrInstance = null;

function initVoiceDictate() {
    const btnCloseVoice = document.getElementById('btnCloseVoiceModal');
    if (btnCloseVoice) {
        btnCloseVoice.onclick = () => {
            const modal = document.getElementById('modalVoiceDictate');
            if (modal) modal.classList.add('hidden');
        };
    }

    const btnCopyVoice = document.getElementById('btnCopyVoiceUrl');
    if (btnCopyVoice) {
        btnCopyVoice.onclick = () => {
            const inputUrl = document.getElementById('inputVoiceUrl');
            if (!inputUrl) return;
            navigator.clipboard.writeText(inputUrl.value).then(() => {
                const oldText = btnCopyVoice.textContent;
                btnCopyVoice.textContent = '¡Copiado! ✓';
                setTimeout(() => btnCopyVoice.textContent = oldText, 2000);
            }).catch(() => {
                inputUrl.select();
                document.execCommand('copy');
                btnCopyVoice.textContent = '¡Copiado! ✓';
                setTimeout(() => btnCopyVoice.textContent = '📋 Copiar', 2000);
            });
        };
    }

    const btnOpenVoiceTab = document.getElementById('btnOpenVoiceTab');
    if (btnOpenVoiceTab) {
        btnOpenVoiceTab.onclick = () => {
            window.open('/voice', '_blank');
        };
    }

    const btnToggleVoiceTunnel = document.getElementById('btnToggleVoiceTunnel');
    if (btnToggleVoiceTunnel) {
        btnToggleVoiceTunnel.onclick = async () => {
            btnToggleVoiceTunnel.disabled = true;
            btnToggleVoiceTunnel.textContent = '⏳ Iniciando túnel seguro...';
            try {
                const res = await fetch('/api/tunnel/start');
                const data = await res.json();
                if (data.success && data.url) {
                    btnToggleVoiceTunnel.textContent = '✓ Túnel Activo';
                    await openVoiceDictateModal();
                } else {
                    alert('No se pudo iniciar el túnel: ' + (data.error || 'Verifica cloudflared en tools/'));
                    btnToggleVoiceTunnel.textContent = '🚀 Reintentar Túnel';
                }
            } catch (e) {
                alert('Error al activar túnel: ' + e);
                btnToggleVoiceTunnel.textContent = '🚀 Reintentar Túnel';
            } finally {
                btnToggleVoiceTunnel.disabled = false;
            }
        };
    }

    // Modal Compartir (Túnel)
    const btnCloseShare = document.getElementById('btnCloseShareModal');
    if (btnCloseShare) {
        btnCloseShare.onclick = () => {
            const modal = document.getElementById('modalShare');
            if (modal) modal.classList.add('hidden');
        };
    }

    const btnCopyShare = document.getElementById('btnCopyShareUrl');
    if (btnCopyShare) {
        btnCopyShare.onclick = () => {
            const inputUrl = document.getElementById('inputShareUrl');
            if (!inputUrl) return;
            navigator.clipboard.writeText(inputUrl.value).then(() => {
                btnCopyShare.textContent = '¡Copiado! ✓';
                setTimeout(() => btnCopyShare.textContent = '📋 Copiar', 2000);
            }).catch(() => {
                inputUrl.select();
                document.execCommand('copy');
                btnCopyShare.textContent = '¡Copiado! ✓';
                setTimeout(() => btnCopyShare.textContent = '📋 Copiar', 2000);
            });
        };
    }
}

async function openVoiceDictateModal() {
    const modal = document.getElementById('modalVoiceDictate');
    if (!modal) return;
    modal.classList.remove('hidden');

    const badge = document.getElementById('voiceConnBadge');
    const inputUrl = document.getElementById('inputVoiceUrl');
    const qrContainer = document.getElementById('voiceQrCode');

    if (badge) badge.textContent = 'Verificando red...';

    try {
        const res = await fetch('/api/voice/status');
        const data = await res.json();

        let targetUrl = '';
        if (data.tunnel_url) {
            targetUrl = `${data.tunnel_url}/voice`;
            if (badge) {
                badge.textContent = '🌐 Túnel Cloudflare Activo (Acceso Global)';
                badge.style.background = 'rgba(16, 185, 129, 0.15)';
                badge.style.color = '#10B981';
            }
        } else if (data.local_ip && data.local_ip !== '127.0.0.1') {
            targetUrl = `http://${data.local_ip}:${data.port || 5000}/voice`;
            if (badge) {
                badge.textContent = `📶 Wi-Fi Local (IP: ${data.local_ip})`;
                badge.style.background = 'rgba(255, 107, 53, 0.15)';
                badge.style.color = '#FF6B35';
            }
        } else {
            targetUrl = `${window.location.origin}/voice`;
            if (badge) {
                badge.textContent = '💻 Conexión Local';
                badge.style.background = 'rgba(255, 107, 53, 0.15)';
                badge.style.color = '#FF6B35';
            }
        }

        if (inputUrl) inputUrl.value = targetUrl;

        // Renderizar Código QR offline
        if (qrContainer && window.QRCode) {
            qrContainer.innerHTML = '';
            voiceQrInstance = new QRCode(qrContainer, {
                text: targetUrl,
                width: 165,
                height: 165,
                colorDark: '#121214',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    } catch (e) {
        console.error('Error cargando estado del dictáfono:', e);
        if (badge) badge.textContent = 'Error al verificar conexión';
    }
}

