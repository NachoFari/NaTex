// Controlador del Editor LaTeX y SyncTeX
let typingTimeout = null;

function initEditor() {
    codeEditor.addEventListener('input', () => {
        updateLineNumbers();
        triggerAutoSave();
        clearTimeout(outlineDebounceTimer);
        outlineDebounceTimer = setTimeout(() => {
            parseDocumentOutline(codeEditor.value);
        }, 350);
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
    });

    // Atajo global para compilar en toda la app (Ctrl+S, Cmd+S, F5)
    // useCapture: true asegura que intercepte ANTES del navegador o de iframes
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS' || e.keyCode === 83)) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof compileDocument === 'function') {
                compileDocument();
            }
            return false;
        }

        if (e.key === 'F5' || e.code === 'F5' || e.keyCode === 116) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof compileDocument === 'function') {
                compileDocument();
            }
            return false;
        }
    }, true);
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
                    file: currentOpenFile,
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
            const res = await fetch(`/api/project/check_update?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(currentOpenFile)}&since=${lastMtime}`);
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
        const res = await fetch(`/api/synctex/forward?project=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(currentOpenFile)}&line=${currentLine}`);
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

