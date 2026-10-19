// Estado Global y Utilidades Compartidas
// NaTex Studio Controller
let currentProject = 'Mi_Primer_Documento';
let isCompiling = false;
let autoSaveTimer = null;
let lastMtime = 0;
let isUserTyping = false;
let currentOpenFile = 'main.tex';
let projectFilesList = [];
let outlineDebounceTimer = null;
let tableGridState = {
    rows: 3,
    cols: 3,
    data: [
        ['Encabezado 1', 'Encabezado 2', 'Encabezado 3'],
        ['Dato 1', 'Dato 2', 'Dato 3'],
        ['Dato 4', 'Dato 5', 'Dato 6']
    ]
};

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

function updateEditorFileTitle() {
    const el = document.getElementById('editorCurrentFileTitle');
    if (!el) return;
    const ext = currentOpenFile.split('.').pop().toLowerCase();
    let icon = '📝';
    if (ext === 'bib') icon = '📚';
    else if (ext === 'txt') icon = '📃';
    else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) icon = '🖼️';
    el.innerText = `${icon} ${currentOpenFile}`;
}

function ensureBooktabsPackage() {
    const chkBooktabs = document.getElementById('tblChkBooktabs');
    if (chkBooktabs && chkBooktabs.checked && !codeEditor.value.includes('{booktabs}')) {
        if (codeEditor.value.includes('\\begin{document}')) {
            codeEditor.value = codeEditor.value.replace('\\begin{document}', '\\usepackage{booktabs}\n\\begin{document}');
        } else if (codeEditor.value.includes('\\documentclass')) {
            codeEditor.value = codeEditor.value.replace(/(\\documentclass[^\n]*\n)/, '$1\\usepackage{booktabs}\n');
        } else {
            codeEditor.value = '\\usepackage{booktabs}\n' + codeEditor.value;
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// Reemplazos elegantes de prompt() y confirm() (Sin ventanas nativas del navegador)
function showToast(message, type = 'info') {
    let toast = document.getElementById('appGlobalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'appGlobalToast';
        toast.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:500; box-shadow:0 6px 20px rgba(0,0,0,0.3); transition:all 0.25s ease; opacity:0; transform:translateY(10px); pointer-events:none; display:flex; align-items:center; gap:8px;';
        document.body.appendChild(toast);
    }
    const isError = type === 'error';
    const isSuccess = type === 'success';
    toast.style.background = isError ? 'var(--error, #ef4444)' : isSuccess ? 'var(--success, #10b981)' : 'var(--bg-surface, #1e293b)';
    toast.style.color = '#ffffff';
    toast.style.border = `1px solid ${isError ? 'rgba(239,68,68,0.4)' : isSuccess ? 'rgba(16,185,129,0.4)' : 'var(--border-color, rgba(255,255,255,0.15))'}`;
    toast.innerHTML = (isSuccess ? '✓ ' : isError ? '⚠️ ' : 'ℹ️ ') + escapeHtml(message);
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 3000);
}

function showAppPrompt(arg1, arg2, arg3) {
    let opts = {};
    if (typeof arg1 === 'string') {
        opts = {
            message: arg1,
            defaultValue: arg2 || '',
            title: arg3 || (typeof currentLanguage !== 'undefined' && currentLanguage === 'en' ? 'Input' : 'Entrada')
        };
    } else if (arg1 && typeof arg1 === 'object') {
        opts = arg1;
    }
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const {
        title = isEn ? 'New Item' : 'Nuevo Elemento',
        message = isEn ? 'Enter name:' : 'Introduce el nombre:',
        defaultValue = '',
        placeholder = '',
        confirmText = isEn ? 'OK' : 'Aceptar',
        cancelText = isEn ? 'Cancel' : 'Cancelar'
    } = opts;

    return new Promise((resolve) => {
        const modal = document.getElementById('modalAppPrompt');
        const titleEl = document.getElementById('appPromptTitle');
        const descEl = document.getElementById('appPromptDesc');
        const inputEl = document.getElementById('appPromptInput');
        const btnOk = document.getElementById('btnAppPromptOk');
        const btnCancel = document.getElementById('btnAppPromptCancel');

        if (!modal || !inputEl) {
            resolve(null);
            return;
        }

        if (titleEl) titleEl.innerHTML = title;
        if (descEl) descEl.innerText = message;
        inputEl.value = defaultValue;
        inputEl.placeholder = placeholder || '';
        if (btnOk) btnOk.innerText = confirmText;
        if (btnCancel) btnCancel.innerText = cancelText;

        modal.classList.remove('hidden');
        setTimeout(() => {
            inputEl.focus();
            inputEl.select();
        }, 50);

        function cleanup(val) {
            modal.classList.add('hidden');
            btnOk.onclick = null;
            btnCancel.onclick = null;
            inputEl.onkeydown = null;
            modal.onclick = null;
            resolve(val);
        }

        btnOk.onclick = () => cleanup(inputEl.value.trim());
        btnCancel.onclick = () => cleanup(null);

        inputEl.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                cleanup(inputEl.value.trim());
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cleanup(null);
            }
        };

        modal.onclick = (e) => {
            if (e.target === modal) cleanup(null);
        };
    });
}

function showAppConfirm(arg1, arg2) {
    let opts = {};
    if (typeof arg1 === 'string') {
        opts = {
            message: arg1,
            title: arg2 || (typeof currentLanguage !== 'undefined' && currentLanguage === 'en' ? 'Confirmation' : 'Confirmación')
        };
    } else if (arg1 && typeof arg1 === 'object') {
        opts = arg1;
    }
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const {
        title = isEn ? 'Confirmation' : 'Confirmación',
        message = isEn ? 'Are you sure you want to proceed?' : '¿Estás seguro de que deseas continuar?',
        confirmText = isEn ? 'Confirm' : 'Aceptar',
        cancelText = isEn ? 'Cancel' : 'Cancelar',
        isDanger = true
    } = opts;

    return new Promise((resolve) => {
        const modal = document.getElementById('modalAppConfirm');
        const titleEl = document.getElementById('appConfirmTitle');
        const descEl = document.getElementById('appConfirmDesc');
        const btnOk = document.getElementById('btnAppConfirmOk');
        const btnCancel = document.getElementById('btnAppConfirmCancel');

        if (!modal) {
            resolve(false);
            return;
        }

        if (titleEl) titleEl.innerHTML = title;
        if (descEl) descEl.innerText = message;
        if (btnOk) {
            btnOk.innerText = confirmText;
            btnOk.style.background = isDanger ? 'var(--error, #ef4444)' : 'var(--fox-orange)';
            btnOk.style.borderColor = isDanger ? 'var(--error, #ef4444)' : 'var(--fox-orange)';
        }
        if (btnCancel) btnCancel.innerText = cancelText;

        modal.classList.remove('hidden');

        function cleanup(val) {
            modal.classList.add('hidden');
            btnOk.onclick = null;
            btnCancel.onclick = null;
            modal.onclick = null;
            window.removeEventListener('keydown', handleKey);
            resolve(val);
        }

        function handleKey(e) {
            if (e.key === 'Escape') cleanup(false);
            else if (e.key === 'Enter') cleanup(true);
        }

        btnOk.onclick = () => cleanup(true);
        btnCancel.onclick = () => cleanup(false);
        modal.onclick = (e) => {
            if (e.target === modal) cleanup(false);
        };
        window.addEventListener('keydown', handleKey);
    });
}

function showTemplateChoiceModal({ templateId, templateName, currentFile }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modalTemplateApplyChoice');
        const targetLabel = document.getElementById('templateTargetFileLabel');
        const newLabel = document.getElementById('templateNewFileLabel');
        const btnReplace = document.getElementById('btnTemplateApplyReplace');
        const btnNew = document.getElementById('btnTemplateApplyNew');
        const btnCancel = document.getElementById('btnTemplateChoiceCancel');

        if (!modal) {
            resolve(null);
            return;
        }

        const cleanTplName = (templateId || 'plantilla').replace(/\s+/g, '_');
        if (targetLabel) targetLabel.innerText = currentFile || 'main.tex';
        if (newLabel) newLabel.innerText = `${cleanTplName}.tex`;

        modal.classList.remove('hidden');

        function cleanup(choice) {
            modal.classList.add('hidden');
            btnReplace.onclick = null;
            btnNew.onclick = null;
            btnCancel.onclick = null;
            modal.onclick = null;
            window.removeEventListener('keydown', handleKey);
            resolve(choice);
        }

        function handleKey(e) {
            if (e.key === 'Escape') cleanup(null);
        }

        btnReplace.onclick = () => cleanup('replace');
        btnNew.onclick = () => cleanup('new_file');
        btnCancel.onclick = () => cleanup(null);
        modal.onclick = (e) => {
            if (e.target === modal) cleanup(null);
        };
        window.addEventListener('keydown', handleKey);
    });
}

