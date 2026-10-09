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

