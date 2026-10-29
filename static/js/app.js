// NaTex Studio - Main Orchestrator Module

// Fail-safe dynamic script loader to ensure modular components are active
(function ensureModularScriptsLoaded() {
    const modules = [
        '/static/js/updater.js',
        '/static/js/ai_assistant.js',
        '/static/js/voice_tunnel.js',
        '/static/js/dashboard.js',
        '/static/js/splash.js'
    ];
    modules.forEach(src => {
        if (!document.querySelector(`script[src="${src}"]`)) {
            const s = document.createElement('script');
            s.src = src;
            s.async = false;
            document.head.appendChild(s);
        }
    });
})();

// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    if (typeof initHeartbeat === 'function') initHeartbeat();
    initResizer();
    if (typeof initEditor === 'function') initEditor();
    if (typeof initDashboard === 'function') initDashboard();
    if (typeof initMathKeyboard === 'function') initMathKeyboard();
    if (typeof initSyncTeX === 'function') initSyncTeX();
    if (typeof initVoiceDictate === 'function') initVoiceDictate();
    if (typeof initUpdateChecker === 'function') initUpdateChecker();
    if (typeof initProjectSidebar === 'function') initProjectSidebar();
    if (typeof initTableBuilder === 'function') initTableBuilder();
    if (typeof initAiAssistant === 'function') initAiAssistant();
    if (typeof loadProjects === 'function') loadProjects();
    setupEventListeners();
    if (typeof setupCollaborationPolling === 'function') setupCollaborationPolling();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('p')) {
        setView('editor');
    } else {
        setView('home');
    }

    if (urlParams.get('theme')) {
        applyTheme(urlParams.get('theme'));
    }

    if (typeof initSplashIntro === 'function') {
        initSplashIntro();
    }
    if (urlParams.get('modal') === 'math' && typeof openMathModal === 'function') {
        setTimeout(() => openMathModal(), 300);
    } else if (urlParams.get('modal') === 'settings') {
        const initialTab = urlParams.get('tab') || 'config';
        openSettingsModal(initialTab);
        const prov = urlParams.get('provider');
        if (prov) {
            setTimeout(() => {
                const sel = document.getElementById('selectAiProvider');
                if (sel) {
                    sel.value = prov;
                    if (typeof updateAiProviderPanels === 'function') updateAiProviderPanels(prov);
                    if (typeof updateAiBadge === 'function') updateAiBadge(prov);
                }
            }, 150);
        }
    }
});

function switchSettingsTab(tabId = 'config') {
    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-settings-tab') === tabId);
    });
    document.querySelectorAll('.settings-tab-pane').forEach(pane => {
        const isMatch = pane.getAttribute('data-settings-pane') === tabId;
        pane.classList.toggle('active', isMatch);
        pane.classList.toggle('hidden', !isMatch);
    });
    const scrollBox = document.querySelector('.settings-tab-scroll');
    if (scrollBox) scrollBox.scrollTop = 0;
}

function openSettingsModal(tabId = 'config') {
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    loadConfigFromServer();
    switchSettingsTab(tabId);
    const ms = document.getElementById('modalSettings');
    if (ms) ms.classList.remove('hidden');
    if (urlTheme) {
        applyTheme(urlTheme);
    }
}

// Configuración, Temas e Idiomas
function applyTheme(theme, customColor) {
    if (typeof getThemeMeta === 'function') {
        if (theme === 'dark') theme = 'fox';
        if (theme === 'light') theme = 'rabbit';
    }

    currentTheme = theme;
    if (customColor) currentCustomColor = customColor;
    localStorage.setItem('natex_theme', theme);
    localStorage.setItem('natex_custom_color', currentCustomColor);

    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'custom' || customColor) {
        document.documentElement.style.setProperty('--fox-orange', currentCustomColor);
        document.documentElement.style.setProperty('--fox-orange-hover', currentCustomColor + 'cc');
        document.documentElement.style.setProperty('--fox-orange-glow', currentCustomColor + '4d');
    } else {
        document.documentElement.style.removeProperty('--fox-orange');
        document.documentElement.style.removeProperty('--fox-orange-hover');
        document.documentElement.style.removeProperty('--fox-orange-glow');
    }

    document.querySelectorAll('.theme-card-option').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-theme') === theme);
    });
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.getAttribute('data-color') === currentCustomColor);
    });

    const customWrapper = document.getElementById('customThemeColorWrapper') || document.getElementById('customAccentContainer');
    if (customWrapper) {
        customWrapper.style.display = (theme === 'custom') ? 'block' : 'none';
    }

    if (typeof updateThemeMascotIcons === 'function') {
        updateThemeMascotIcons(theme);
    }
    if (typeof renderThemeSelectorGrid === 'function') {
        renderThemeSelectorGrid(theme);
    }
    if (typeof updateThemeEffects === 'function') {
        updateThemeEffects(theme, currentCustomColor);
    }
}

async function loadConfigFromServer() {
    try {
        const res = await fetch('/api/config');
        if (!res.ok) return;
        const data = await res.json();

        const prov = data.ai_provider || 'gemini';
        const sel = document.getElementById('selectAiProvider');
        if (sel) sel.value = prov;
        if (typeof updateAiProviderPanels === 'function') updateAiProviderPanels(prov);
        if (typeof updateAiBadge === 'function') updateAiBadge(prov);

        if (document.getElementById('inputApiKey') && data.gemini_api_key) {
            document.getElementById('inputApiKey').value = data.gemini_api_key;
        }
        if (document.getElementById('inputApiKeyOpenai') && data.openai_api_key) {
            document.getElementById('inputApiKeyOpenai').value = data.openai_api_key;
        }
        if (document.getElementById('inputApiKeyClaude') && data.claude_api_key) {
            document.getElementById('inputApiKeyClaude').value = data.claude_api_key;
        }
        if (document.getElementById('inputApiKeyNvidia') && data.nvidia_api_key) {
            document.getElementById('inputApiKeyNvidia').value = data.nvidia_api_key;
        }
        if (document.getElementById('inputCustomUrl') && data.custom_api_url) {
            document.getElementById('inputCustomUrl').value = data.custom_api_url;
        }
        if (document.getElementById('inputCustomApiKey') && data.custom_api_key) {
            document.getElementById('inputCustomApiKey').value = data.custom_api_key;
        }
        if (document.getElementById('inputAiModel') && data.ai_model) {
            document.getElementById('inputAiModel').value = data.ai_model;
        }

        if (data.theme && !localStorage.getItem('natex_theme')) {
            applyTheme(data.theme, data.custom_color);
        }
        if (data.language && !localStorage.getItem('natex_language')) {
            applyLanguage(data.language);
        }
        const chkAuto = document.getElementById('chkAutoCheckUpdates');
        if (chkAuto && data.auto_check_updates !== undefined && localStorage.getItem('natex_auto_update') === null) {
            chkAuto.checked = !!data.auto_check_updates;
            localStorage.setItem('natex_auto_update', data.auto_check_updates ? 'true' : 'false');
        }
        if (data.word_wrap !== undefined && localStorage.getItem('natex_word_wrap') === null) {
            if (typeof setWordWrap === 'function') {
                setWordWrap(!!data.word_wrap, true);
            }
        } else if (localStorage.getItem('natex_word_wrap') !== null) {
            if (typeof setWordWrap === 'function') {
                setWordWrap(localStorage.getItem('natex_word_wrap') !== 'false', false);
            }
        }
        if (data.theme_effects !== undefined && localStorage.getItem('natex_theme_effects') === null) {
            localStorage.setItem('natex_theme_effects', data.theme_effects ? 'true' : 'false');
        }
        if (data.theme_effects_frequency !== undefined && localStorage.getItem('natex_theme_effects_freq') === null) {
            localStorage.setItem('natex_theme_effects_freq', String(data.theme_effects_frequency));
        }
        const effectsActive = localStorage.getItem('natex_theme_effects') !== 'false';
        const chkEffects = document.getElementById('chkThemeEffects');
        if (chkEffects) {
            chkEffects.checked = effectsActive;
        }
        if (typeof setThemeEffectsEnabled === 'function') {
            setThemeEffectsEnabled(effectsActive);
        }
        const effectsFreq = parseInt(localStorage.getItem('natex_theme_effects_freq') || String(data.theme_effects_frequency || 100), 10);
        if (typeof setThemeEffectsFrequency === 'function' && !isNaN(effectsFreq)) {
            setThemeEffectsFrequency(effectsFreq);
        }
    } catch (e) {
        console.warn("No se pudo cargar la configuración:", e);
    }
}

function initSettings() {
    applyTheme(currentTheme, currentCustomColor);
    applyLanguage(currentLanguage);

    const chkAuto = document.getElementById('chkAutoCheckUpdates');
    const savedAuto = localStorage.getItem('natex_auto_update');
    if (chkAuto && savedAuto !== null) {
        chkAuto.checked = (savedAuto === 'true');
    }

    const chkThemeEffects = document.getElementById('chkThemeEffects');
    if (chkThemeEffects) {
        const effectsActive = localStorage.getItem('natex_theme_effects') !== 'false';
        chkThemeEffects.checked = effectsActive;
        chkThemeEffects.onchange = (e) => {
            const enabled = e.target.checked;
            localStorage.setItem('natex_theme_effects', enabled ? 'true' : 'false');
            if (typeof setThemeEffectsEnabled === 'function') {
                setThemeEffectsEnabled(enabled);
            }
            fetch('/api/config', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ theme_effects: enabled })
            }).catch(() => {});
        };
    }

    const rangeThemeEffectsFreq = document.getElementById('rangeThemeEffectsFreq');
    if (rangeThemeEffectsFreq) {
        const savedFreq = parseInt(localStorage.getItem('natex_theme_effects_freq') || '100', 10);
        if (!isNaN(savedFreq)) {
            rangeThemeEffectsFreq.value = String(savedFreq);
        }
        rangeThemeEffectsFreq.oninput = (e) => {
            const val = parseInt(e.target.value, 10) || 100;
            if (typeof setThemeEffectsFrequency === 'function') {
                setThemeEffectsFrequency(val);
            }
        };
        rangeThemeEffectsFreq.onchange = (e) => {
            const val = parseInt(e.target.value, 10) || 100;
            fetch('/api/config', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ theme_effects_frequency: val })
            }).catch(() => {});
        };
    }

    const selAi = document.getElementById('selectAiProvider');
    if (selAi) {
        selAi.onchange = () => {
            if (typeof updateAiProviderPanels === 'function') updateAiProviderPanels(selAi.value);
            if (typeof updateAiBadge === 'function') updateAiBadge(selAi.value);
        };
    }

    loadConfigFromServer();
}

function setView(view) {
    const dashboard = document.getElementById('homeDashboard');
    const workspace = document.querySelector('.workspace');
    const tabHome = document.getElementById('navTabHome');
    const tabEditor = document.getElementById('navTabEditor');

    if (view === 'home') {
        document.body.classList.add('view-home');
        if (dashboard) dashboard.classList.remove('hidden');
        if (workspace) workspace.style.display = 'none';
        if (tabHome) tabHome.classList.add('active');
        if (tabEditor) tabEditor.classList.remove('active');
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    } else {
        document.body.classList.remove('view-home');
        if (dashboard) dashboard.classList.add('hidden');
        if (workspace) workspace.style.display = 'flex';
        if (tabHome) tabHome.classList.remove('active');
        if (tabEditor) tabEditor.classList.add('active');
    }
}

async function loadProject(projName) {
    if (!projName) return;
    currentProject = projName;
    const projectSelect = document.getElementById('projectSelect');
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

async function loadProjectCode(projName, targetFile = 'main.tex') {
    if (typeof editorStatus !== 'undefined' && editorStatus) {
        editorStatus.innerText = 'Cargando...';
    }
    currentOpenFile = targetFile;
    if (typeof updateEditorFileTitle === 'function') updateEditorFileTitle();

    try {
        const res = await fetch(`/api/project/load?name=${encodeURIComponent(projName)}&file=${encodeURIComponent(targetFile)}`);
        const data = await res.json();
        if (typeof codeEditor !== 'undefined' && codeEditor) {
            codeEditor.value = data.code || '';
            codeEditor.focus();
        }
        lastMtime = data.mtime || 0;
        if (typeof updateLineNumbers === 'function') updateLineNumbers();
        if (typeof editorStatus !== 'undefined' && editorStatus) {
            editorStatus.innerText = 'Guardado automático ✓';
            editorStatus.style.color = '#10B981';
        }

        projectFilesList = data.files || [];
        window.projectBibEntries = data.bib_entries || [];
        if (typeof renderFileTree === 'function') renderFileTree(projectFilesList);
        if (typeof parseDocumentOutline === 'function') parseDocumentOutline(data.code || '');

        try {
            if (typeof updateFilesList === 'function') updateFilesList(data.files || []);
            if (typeof updateGallerySidebar === 'function') updateGallerySidebar(data.files || []);
        } catch (e) {
            console.warn('Gallery update warning:', e);
        }

        if (data.has_pdf && data.pdf_file) {
            showPdf(`/api/pdf?name=${encodeURIComponent(projName)}&file=${encodeURIComponent(data.pdf_file)}&t=${Date.now()}`);
        } else if (data.has_pdf) {
            showPdf(`/api/pdf?name=${encodeURIComponent(projName)}&t=${Date.now()}`);
        } else {
            const emptyState = document.getElementById('emptyState');
            const pdfViewer = document.getElementById('pdfViewer');
            const customViewer = document.getElementById('pdfCustomViewer');
            if (emptyState) emptyState.classList.remove('hidden');
            if (customViewer) customViewer.classList.add('hidden');
            if (pdfViewer) {
                pdfViewer.classList.add('hidden');
                pdfViewer.src = 'about:blank';
            }
        }
    } catch (err) {
        console.error('Error loading project code:', err);
    }
}

// Compilación
async function compileDocument() {
    if (isCompiling) return;
    isCompiling = true;
    const btnCompile = document.getElementById('btnCompile');
    const btnPdfRecompile = document.getElementById('btnPdfRecompile');
    const editorStatus = document.getElementById('editorStatus');
    const errorBox = document.getElementById('errorBox');
    const errorLog = document.getElementById('errorLog');

    if (btnCompile) {
        btnCompile.innerHTML = '<span class="icon">⏳</span> Compilando...';
        btnCompile.style.opacity = '0.7';
    }
    if (btnPdfRecompile) {
        btnPdfRecompile.innerHTML = '<span class="pdf-recompile-icon">⏳</span> <span>Compilando...</span>';
        btnPdfRecompile.style.opacity = '0.75';
    }
    if (editorStatus) {
        editorStatus.innerText = 'Compilando con Tectonic...';
        editorStatus.style.color = '#FF6B35';
    }

    try {
        const res = await fetch('/api/project/compile', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: currentProject,
                file: currentOpenFile,
                code: typeof codeEditor !== 'undefined' ? codeEditor.value : ''
            })
        });
        const data = await res.json();

        const btnJumpError = document.getElementById('btnJumpErrorLine');
        if (data.success) {
            if (errorBox) errorBox.classList.add('hidden');
            if (btnJumpError) btnJumpError.classList.add('hidden');
            showPdf(`${data.pdf_url}&t=${Date.now()}`);
            if (typeof parseDocumentOutline === 'function' && typeof codeEditor !== 'undefined') {
                parseDocumentOutline(codeEditor.value);
            }
            if (editorStatus) {
                editorStatus.innerText = 'Compilado con éxito ✓';
                editorStatus.style.color = '#10B981';
                setTimeout(() => {
                    editorStatus.innerText = 'Guardado automático ✓';
                }, 3000);
            }
        } else {
            if (errorLog) errorLog.innerText = data.log || 'Error desconocido';
            if (errorBox) errorBox.classList.remove('hidden');
            if (btnJumpError) {
                if (data.error_line && Number.isInteger(data.error_line) && data.error_line > 0) {
                    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
                    btnJumpError.innerText = isEn ? `🎯 Go to Line ${data.error_line}` : `🎯 Ir a Línea ${data.error_line}`;
                    btnJumpError.classList.remove('hidden');
                    btnJumpError.onclick = () => {
                        if (typeof jumpToLine === 'function') {
                            jumpToLine(data.error_line);
                        }
                    };
                } else {
                    btnJumpError.classList.add('hidden');
                }
            }
            if (editorStatus) {
                editorStatus.innerText = 'Error en código LaTeX';
                editorStatus.style.color = '#EF4444';
            }
        }
    } catch (err) {
        if (errorLog) errorLog.innerText = String(err);
        if (errorBox) errorBox.classList.remove('hidden');
    } finally {
        isCompiling = false;
        const dict = (typeof i18n !== 'undefined' && i18n[currentLanguage]) ? i18n[currentLanguage] : (typeof i18n !== 'undefined' ? i18n.es : {});
        if (btnCompile) {
            btnCompile.innerHTML = `<span class="icon">⚡</span> <span class="btn-text">${dict?.btn_compile || 'Compilar'}</span>`;
            btnCompile.style.opacity = '1';
        }
        if (btnPdfRecompile) {
            btnPdfRecompile.innerHTML = `<span class="pdf-recompile-icon">🔄</span> <span data-i18n="btn_recompile">${dict?.btn_recompile || 'Recompilar'}</span>`;
            btnPdfRecompile.style.opacity = '1';
        }
    }
}

// Estado y Controlador del Visor PDF Personalizado Estilo Overleaf
window.pdfViewerState = {
    totalPages: 1,
    currentPage: 1,
    zoom: localStorage.getItem('natex_pdf_zoom') || '100',
    paperMode: localStorage.getItem('natex_pdf_paper_mode') || 'classic',
    lastUrl: '',
    projName: '',
    pdfFile: 'main.pdf'
};

function applyPdfPaperMode(mode, notify = false) {
    const validModes = ['classic', 'tinted', 'night'];
    const nextMode = validModes.includes(mode) ? mode : 'classic';
    window.pdfViewerState.paperMode = nextMode;
    localStorage.setItem('natex_pdf_paper_mode', nextMode);

    const customViewer = document.getElementById('pdfCustomViewer');
    if (customViewer) {
        customViewer.setAttribute('data-paper-mode', nextMode);
    }
    const btnInvert = document.getElementById('btnPdfInvertMode');
    if (btnInvert) {
        btnInvert.classList.toggle('active', nextMode !== 'classic');
    }

    if (notify && typeof showToast === 'function') {
        const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
        const labelsEs = {
            classic: '📄 Hoja PDF: Blanco Clásico (Fondo del Tema)',
            tinted: '🎨 Hoja PDF: Papel Tintado con el Tema',
            night: '🌙 Hoja PDF: Modo Noche (Invertido Overleaf)'
        };
        const labelsEn = {
            classic: '📄 PDF Sheet: Classic White (Theme Backdrop)',
            tinted: '🎨 PDF Sheet: Theme-Tinted Paper',
            night: '🌙 PDF Sheet: Night Mode (Overleaf Inverted)'
        };
        showToast(isEn ? labelsEn[nextMode] : labelsEs[nextMode], 'info');
    }
}

function cyclePdfPaperMode() {
    const order = ['classic', 'tinted', 'night'];
    const idx = order.indexOf(window.pdfViewerState.paperMode);
    const next = order[(idx + 1) % order.length];
    applyPdfPaperMode(next, true);
}

function applyPdfZoom(zoomVal) {
    const valStr = String(zoomVal || '100');
    window.pdfViewerState.zoom = valStr;
    localStorage.setItem('natex_pdf_zoom', valStr);

    const sel = document.getElementById('pdfZoomSelect');
    if (sel && sel.value !== valStr) {
        sel.value = valStr;
    }

    const customViewer = document.getElementById('pdfCustomViewer');
    const cards = document.querySelectorAll('#pdfPagesContainer .pdf-page-card');
    if (!customViewer || cards.length === 0) return;

    const availWidth = Math.max(260, (customViewer.clientWidth || 640) - 44);
    const baseFitWidth = Math.min(760, availWidth);

    let targetPx = baseFitWidth;
    if (valStr !== 'fit') {
        const pct = parseFloat(valStr) || 100;
        targetPx = Math.round(baseFitWidth * (pct / 100));
    }

    cards.forEach(card => {
        card.style.width = `${targetPx}px`;
        card.style.maxWidth = (valStr === 'fit' || parseFloat(valStr) <= 100) ? '100%' : 'none';
    });
}

function stepPdfZoom(direction) {
    const levels = ['75', '90', '100', '125', '150', '200'];
    let cur = window.pdfViewerState.zoom === 'fit' ? '100' : String(window.pdfViewerState.zoom);
    let idx = levels.indexOf(cur);
    if (idx === -1) idx = 2;
    const nextIdx = Math.max(0, Math.min(levels.length - 1, idx + direction));
    applyPdfZoom(levels[nextIdx]);
}

function scrollToPdfPage(pageNum, flash = false) {
    const total = window.pdfViewerState.totalPages || 1;
    const target = Math.max(1, Math.min(total, parseInt(pageNum, 10) || 1));
    window.pdfViewerState.currentPage = target;

    const pageInput = document.getElementById('pdfPageInput');
    if (pageInput) pageInput.value = String(target);

    const card = document.querySelector(`#pdfPagesContainer .pdf-page-card[data-page="${target}"]`);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (flash) {
            card.classList.remove('pdf-synctex-flash');
            void card.offsetWidth;
            card.classList.add('pdf-synctex-flash');
        }
    }
}

function downloadCompiledPdf() {
    const pdfFile = currentOpenFile && currentOpenFile.endsWith('.tex') ? currentOpenFile.slice(0, -4) + '.pdf' : 'main.pdf';
    window.open(`/api/pdf?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(pdfFile)}&download=1&t=${Date.now()}`, '_blank');
}

async function showPdf(url) {
    const emptyState = document.getElementById('emptyState');
    const pdfViewer = document.getElementById('pdfViewer');
    const customViewer = document.getElementById('pdfCustomViewer');
    const pagesContainer = document.getElementById('pdfPagesContainer');
    if (emptyState) emptyState.classList.add('hidden');

    window.pdfViewerState.lastUrl = url;
    let proj = currentProject || 'Mi_Primer_Documento';
    let file = (currentOpenFile && currentOpenFile.endsWith('.tex')) ? currentOpenFile.slice(0, -4) + '.pdf' : 'main.pdf';

    try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.searchParams.get('name')) proj = parsed.searchParams.get('name');
        if (parsed.searchParams.get('file')) file = parsed.searchParams.get('file');
    } catch (e) {}

    window.pdfViewerState.projName = proj;
    window.pdfViewerState.pdfFile = file;

    // 1. Renderizado de alta precisión tipográfica con MuPDF (/api/pdf/info + /api/pdf/page_image)
    try {
        const res = await fetch(`/api/pdf/info?name=${encodeURIComponent(proj)}&file=${encodeURIComponent(file)}&t=${Date.now()}`);
        const data = await res.json();
        if (data && data.success && data.page_count > 0 && customViewer && pagesContainer) {
            if (pdfViewer) {
                pdfViewer.classList.add('hidden');
                pdfViewer.src = 'about:blank';
            }
            customViewer.classList.remove('hidden');
            applyPdfPaperMode(window.pdfViewerState.paperMode, false);

            const total = data.page_count;
            window.pdfViewerState.totalPages = total;
            if (window.pdfViewerState.currentPage > total) {
                window.pdfViewerState.currentPage = 1;
            }

            const countSpan = document.getElementById('pdfPageCount');
            const pageInput = document.getElementById('pdfPageInput');
            if (countSpan) countSpan.textContent = String(total);
            if (pageInput) pageInput.value = String(window.pdfViewerState.currentPage || 1);

            const cacheBust = data.mtime || Date.now();
            pagesContainer.innerHTML = '';

            (data.pages || []).forEach(p => {
                const card = document.createElement('div');
                card.className = 'pdf-page-card';
                card.setAttribute('data-page', String(p.page));
                card.setAttribute('data-pt-width', String(p.width || 595));
                card.setAttribute('data-pt-height', String(p.height || 842));

                const img = document.createElement('img');
                img.className = 'pdf-page-img';
                img.alt = `PDF Page ${p.page}`;
                img.src = `/api/pdf/page_image?name=${encodeURIComponent(proj)}&file=${encodeURIComponent(file)}&page=${p.page}&dpi=175&t=${cacheBust}`;

                const badge = document.createElement('span');
                badge.className = 'pdf-page-badge';
                badge.textContent = `${p.page} / ${total}`;

                // Doble clic en la página para SyncTeX Inverso (saltar del PDF a la línea de código LaTeX)
                card.ondblclick = async (ev) => {
                    const rect = img.getBoundingClientRect();
                    if (!rect.width || !rect.height) return;
                    const ptW = parseFloat(card.getAttribute('data-pt-width')) || 595;
                    const ptH = parseFloat(card.getAttribute('data-pt-height')) || 842;
                    const xPt = ((ev.clientX - rect.left) / rect.width) * ptW;
                    const yPt = ((ev.clientY - rect.top) / rect.height) * ptH;
                    try {
                        const sRes = await fetch(`/api/synctex/inverse?project=${encodeURIComponent(proj)}&file=${encodeURIComponent(currentOpenFile || 'main.tex')}&page=${p.page}&x=${xPt.toFixed(1)}&y=${yPt.toFixed(1)}`);
                        const sData = await sRes.json();
                        if (sData && sData.success && sData.line && typeof jumpToLine === 'function') {
                            jumpToLine(sData.line);
                        }
                    } catch (err) {}
                };

                card.appendChild(img);
                card.appendChild(badge);
                pagesContainer.appendChild(card);
            });

            applyPdfZoom(window.pdfViewerState.zoom);
            return;
        }
    } catch (err) {
        console.warn('Fallback to PDF.js / iframe:', err);
    }

    // 2. Fallback secundario con PDF.js local (/static/vendor/pdfjs/pdf.min.js)
    if (window.pdfjsLib && customViewer && pagesContainer) {
        try {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/vendor/pdfjs/pdf.worker.min.js';
            const pdfDoc = await window.pdfjsLib.getDocument(url).promise;
            const total = pdfDoc.numPages || 1;

            if (pdfViewer) {
                pdfViewer.classList.add('hidden');
                pdfViewer.src = 'about:blank';
            }
            customViewer.classList.remove('hidden');
            applyPdfPaperMode(window.pdfViewerState.paperMode, false);

            window.pdfViewerState.totalPages = total;
            if (window.pdfViewerState.currentPage > total) {
                window.pdfViewerState.currentPage = 1;
            }

            const countSpan = document.getElementById('pdfPageCount');
            const pageInput = document.getElementById('pdfPageInput');
            if (countSpan) countSpan.textContent = String(total);
            if (pageInput) pageInput.value = String(window.pdfViewerState.currentPage || 1);

            pagesContainer.innerHTML = '';
            const renderScale = 2.15;

            for (let pageNum = 1; pageNum <= total; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const viewport1x = page.getViewport({ scale: 1.0 });
                const viewport = page.getViewport({ scale: renderScale });

                const card = document.createElement('div');
                card.className = 'pdf-page-card';
                card.setAttribute('data-page', String(pageNum));
                card.setAttribute('data-pt-width', String(viewport1x.width || 595));
                card.setAttribute('data-pt-height', String(viewport1x.height || 842));

                const canvas = document.createElement('canvas');
                canvas.className = 'pdf-page-img';
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);

                const badge = document.createElement('span');
                badge.className = 'pdf-page-badge';
                badge.textContent = `${pageNum} / ${total}`;

                card.appendChild(canvas);
                card.appendChild(badge);
                pagesContainer.appendChild(card);

                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;
            }

            applyPdfZoom(window.pdfViewerState.zoom);
            return;
        } catch (pdfJsErr) {
            console.warn('PDF.js fallback error:', pdfJsErr);
        }
    }

    if (customViewer) customViewer.classList.add('hidden');
    if (pdfViewer) {
        pdfViewer.classList.remove('hidden');
        pdfViewer.src = url;
    }
}

// Resizer de Pantalla Dividida
function initResizer() {
    const resizer = document.getElementById('dragResizer');
    const editorPane = document.getElementById('editorPane');
    if (!resizer || !editorPane) return;
    let isResizing = false;

    resizer.addEventListener('mousedown', () => {
        isResizing = true;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const workspace = document.querySelector('.workspace');
        if (!workspace) return;
        const totalWidth = workspace.offsetWidth;
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

async function openPdfInNewTab() {
    const pdfFile = currentOpenFile && currentOpenFile.endsWith('.tex') ? currentOpenFile.slice(0, -4) + '.pdf' : 'main.pdf';
    const pdfUrl = `/api/pdf?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(pdfFile)}&t=${Date.now()}`;
    try {
        const res = await fetch(`/api/system/open_browser?path=${encodeURIComponent(pdfUrl)}`);
        const data = await res.json();
        if (!data || !data.success) {
            window.open(pdfUrl, '_blank');
        }
    } catch (e) {
        window.open(pdfUrl, '_blank');
    }
}

function initModalCloseHandlers() {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const modal = btn.closest('.modal');
            if (modal) modal.classList.add('hidden');
        };
    });

    const closeMappings = [
        { btnId: 'btnCloseMath', modalId: 'modalMathKeyboard' },
        { btnId: 'btnCloseMathSecondary', modalId: 'modalMathKeyboard' },
        { btnId: 'btnCloseShare', modalId: 'modalShare' },
        { btnId: 'btnCloseTemplates', modalId: 'modalTemplates' },
        { btnId: 'btnCloseUpload', modalId: 'modalUpload' },
        { btnId: 'btnCloseSettings', modalId: 'modalSettings' },
        { btnId: 'btnCloseTableModal', modalId: 'modalTableBuilder' },
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

    document.querySelectorAll('.modal').forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        };
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            const drawer = document.getElementById('aiDrawer');
            if (drawer) drawer.classList.add('hidden');
        }
    });
}

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
                target.style.left = '';
                target.style.right = '';
                target.classList.remove('hidden');
                btn.closest('.menu-dropdown').classList.add('open');
                const rect = target.getBoundingClientRect();
                if (rect.right > window.innerWidth - 12) {
                    target.style.left = 'auto';
                    target.style.right = '0';
                }
            }
        };
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-dropdown') || e.target.closest('.dropdown-item')) {
            document.querySelectorAll('.dropdown-content').forEach(d => d.classList.add('hidden'));
            document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('open'));
        }
    });

    const itemNew = document.getElementById('menuItemNewProject');
    if (itemNew && typeof createNewProjectPrompt === 'function') itemNew.onclick = createNewProjectPrompt;

    const itemCompile = document.getElementById('menuItemCompile');
    if (itemCompile) itemCompile.onclick = compileDocument;

    const itemTpl = document.getElementById('menuItemTemplates');
    if (itemTpl && typeof openTemplatesModal === 'function') itemTpl.onclick = () => openTemplatesModal('editor');

    const itemSaveTpl = document.getElementById('menuItemSaveTemplate');
    if (itemSaveTpl && typeof saveAsTemplatePrompt === 'function') itemSaveTpl.onclick = saveAsTemplatePrompt;

    const itemDownPdf = document.getElementById('menuItemDownloadPdf');
    if (itemDownPdf) itemDownPdf.onclick = downloadCompiledPdf;

    const itemOpenPdfTab = document.getElementById('menuItemOpenPdfTab');
    if (itemOpenPdfTab) itemOpenPdfTab.onclick = openPdfInNewTab;

    // Menú Ver (View)
    const viewOpenPdfTab = document.getElementById('menuViewOpenPdfTab');
    if (viewOpenPdfTab) viewOpenPdfTab.onclick = openPdfInNewTab;

    const viewDownloadPdf = document.getElementById('menuViewDownloadPdf');
    if (viewDownloadPdf) viewDownloadPdf.onclick = downloadCompiledPdf;

    const viewRefreshPdf = document.getElementById('menuViewRefreshPdf');
    if (viewRefreshPdf) {
        viewRefreshPdf.onclick = () => {
            const pdfFile = currentOpenFile && currentOpenFile.endsWith('.tex') ? currentOpenFile.slice(0, -4) + '.pdf' : 'main.pdf';
            showPdf(`/api/pdf?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(pdfFile)}&t=${Date.now()}`);
        };
    }

    const viewInvertPdf = document.getElementById('menuViewInvertPdf');
    if (viewInvertPdf) viewInvertPdf.onclick = cyclePdfPaperMode;

    const viewZoomIn = document.getElementById('menuViewZoomIn');
    if (viewZoomIn) viewZoomIn.onclick = () => stepPdfZoom(1);

    const viewZoomOut = document.getElementById('menuViewZoomOut');
    if (viewZoomOut) viewZoomOut.onclick = () => stepPdfZoom(-1);

    const viewZoomFit = document.getElementById('menuViewZoomFit');
    if (viewZoomFit) viewZoomFit.onclick = () => applyPdfZoom('fit');

    const viewToggleSidebar = document.getElementById('menuViewToggleSidebar');
    if (viewToggleSidebar) {
        viewToggleSidebar.onclick = () => {
            const ps = document.getElementById('projectSidebar');
            if (ps) ps.classList.toggle('collapsed');
        };
    }

    const viewToggleGallery = document.getElementById('menuViewToggleGallery');
    if (viewToggleGallery) {
        viewToggleGallery.onclick = () => {
            const gs = document.getElementById('gallerySidebar');
            if (gs) gs.classList.toggle('collapsed');
        };
    }

    const itemImportZip = document.getElementById('menuItemImportZip');
    if (itemImportZip) {
        itemImportZip.onclick = () => {
            const zipInput = document.getElementById('zipProjectInput');
            if (zipInput) zipInput.click();
        };
    }

    const itemExportZip = document.getElementById('menuItemExportZip');
    if (itemExportZip && typeof exportProjectZip === 'function') {
        itemExportZip.onclick = () => exportProjectZip(currentProject);
    }

    const itemDownTex = document.getElementById('menuItemDownloadTex');
    if (itemDownTex) itemDownTex.onclick = () => {
        const texFile = currentOpenFile || 'main.tex';
        window.open(`/api/project/download_tex?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(texFile)}`, '_blank');
    };

    const itemMath = document.getElementById('menuItemMathKeyboard');
    if (itemMath && typeof openMathModal === 'function') itemMath.onclick = () => openMathModal();

    const itemVoice = document.getElementById('menuItemVoiceDictate');
    if (itemVoice && typeof openVoiceDictateModal === 'function') itemVoice.onclick = () => openVoiceDictateModal();

    const itemVoiceCollab = document.getElementById('menuItemVoiceDictateCollab');
    if (itemVoiceCollab && typeof openVoiceDictateModal === 'function') itemVoiceCollab.onclick = () => openVoiceDictateModal();

    const itemGallery = document.getElementById('menuItemGallery');
    if (itemGallery) itemGallery.onclick = () => {
        const sb = document.getElementById('gallerySidebar');
        if (sb) sb.classList.remove('collapsed');
    };

    const itemSync = document.getElementById('menuItemSyncPdf');
    if (itemSync && typeof syncEditorToPdf === 'function') itemSync.onclick = syncEditorToPdf;

    const itemShare = document.getElementById('menuItemShare');
    if (itemShare && typeof openShareModal === 'function') itemShare.onclick = openShareModal;

    const itemAI = document.getElementById('menuItemAI');
    if (itemAI) itemAI.onclick = () => {
        const aiDrawer = document.getElementById('aiDrawer');
        if (aiDrawer) aiDrawer.classList.toggle('hidden');
    };

    const itemDark = document.getElementById('menuItemThemeDark');
    if (itemDark) itemDark.onclick = () => applyTheme('dark');

    const itemLight = document.getElementById('menuItemThemeLight');
    if (itemLight) itemLight.onclick = () => applyTheme('light');

    const itemSettingsConfig = document.getElementById('menuItemSettingsConfig');
    if (itemSettingsConfig) itemSettingsConfig.onclick = () => openSettingsModal('config');

    const itemConfig = document.getElementById('menuItemConfig');
    if (itemConfig) itemConfig.onclick = () => openSettingsModal('customization');

    const itemSettingsAi = document.getElementById('menuItemSettingsAi');
    if (itemSettingsAi) itemSettingsAi.onclick = () => openSettingsModal('ai');

    const itemReplaySplash = document.getElementById('menuItemReplaySplash');
    if (itemReplaySplash && typeof replaySplashIntro === 'function') {
        itemReplaySplash.onclick = () => replaySplashIntro();
    }

    const itemEs = document.getElementById('menuItemLangEs');
    if (itemEs) itemEs.onclick = () => applyLanguage('es');

    const itemEn = document.getElementById('menuItemLangEn');
    if (itemEn) itemEn.onclick = () => applyLanguage('en');

    const btnQuickMath = document.getElementById('btnQuickMath');
    if (btnQuickMath && typeof openMathModal === 'function') btnQuickMath.onclick = () => openMathModal();

    const btnQuickVoice = document.getElementById('btnQuickVoice');
    if (btnQuickVoice && typeof openVoiceDictateModal === 'function') btnQuickVoice.onclick = () => openVoiceDictateModal();
}

function setupEventListeners() {
    const btnCompile = document.getElementById('btnCompile');
    const projectSelect = document.getElementById('projectSelect');

    if (btnCompile) btnCompile.onclick = compileDocument;
    
    if (projectSelect) {
        projectSelect.onchange = (e) => {
            currentProject = e.target.value;
            loadProjectCode(currentProject);
        };
    }

    const btnNew = document.getElementById('btnNewProject');
    if (btnNew && typeof createNewProjectPrompt === 'function') btnNew.onclick = createNewProjectPrompt;

    initDropdownMenus();

    // Barra Lateral de Galería
    const gallerySidebar = document.getElementById('gallerySidebar');
    const btnToggleGallery = document.getElementById('btnToggleGallery');
    const btnCollapseGallery = document.getElementById('btnCollapseGallery');
    const btnSidebarUpload = document.getElementById('btnGallerySidebarUpload') || document.getElementById('btnSidebarUpload');
    const sidebarFileInput = document.getElementById('gallerySidebarFileInput') || document.getElementById('sidebarFileInput');
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
            if (e.target.files && e.target.files[0] && typeof handleFileUpload === 'function') {
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
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0] && typeof handleFileUpload === 'function') {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        };
    }

    // Modal de Subida
    const btnUpload = document.getElementById('btnUpload');
    const modalUpload = document.getElementById('modalUpload');
    if (btnUpload && modalUpload) btnUpload.onclick = () => modalUpload.classList.remove('hidden');
    const btnCloseUpload = document.getElementById('btnCloseUpload');
    if (btnCloseUpload && modalUpload) btnCloseUpload.onclick = () => modalUpload.classList.add('hidden');
    const btnBrowseFile = document.getElementById('btnBrowseFile');
    const fileInput = document.getElementById('fileInput');
    if (btnBrowseFile && fileInput) {
        btnBrowseFile.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            if (e.target.files && e.target.files[0] && typeof handleFileUpload === 'function') {
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
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0] && typeof handleFileUpload === 'function') {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        };
    }

    // Settings
    const btnSettings = document.getElementById('btnSettings');
    const modalSettings = document.getElementById('modalSettings');
    if (btnSettings && modalSettings) {
        btnSettings.onclick = () => openSettingsModal('config');
    }
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    if (btnCloseSettings && modalSettings) btnCloseSettings.onclick = () => modalSettings.classList.add('hidden');

    document.querySelectorAll('.settings-nav-btn').forEach(navBtn => {
        navBtn.onclick = () => switchSettingsTab(navBtn.getAttribute('data-settings-tab'));
    });

    const btnSettingsReplaySplash = document.getElementById('btnSettingsReplaySplash');
    if (btnSettingsReplaySplash && typeof replaySplashIntro === 'function') {
        btnSettingsReplaySplash.onclick = () => {
            if (modalSettings) modalSettings.classList.add('hidden');
            replaySplashIntro();
        };
    }

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

    const btnWrapYes = document.getElementById('btnSettingWrapYes');
    const btnWrapNo = document.getElementById('btnSettingWrapNo');
    if (btnWrapYes) {
        btnWrapYes.onclick = () => {
            if (typeof setWordWrap === 'function') setWordWrap(true, true);
        };
    }
    if (btnWrapNo) {
        btnWrapNo.onclick = () => {
            if (typeof setWordWrap === 'function') setWordWrap(false, true);
        };
    }

    const btnSaveApiKey = document.getElementById('btnSaveApiKey');
    if (btnSaveApiKey) {
        btnSaveApiKey.onclick = async () => {
            const provider = document.getElementById('selectAiProvider') ? document.getElementById('selectAiProvider').value : 'gemini';
            const geminiKey = document.getElementById('inputApiKey') ? document.getElementById('inputApiKey').value.trim() : '';
            const openaiKey = document.getElementById('inputApiKeyOpenai') ? document.getElementById('inputApiKeyOpenai').value.trim() : '';
            const claudeKey = document.getElementById('inputApiKeyClaude') ? document.getElementById('inputApiKeyClaude').value.trim() : '';
            const nvidiaKey = document.getElementById('inputApiKeyNvidia') ? document.getElementById('inputApiKeyNvidia').value.trim() : '';
            const customUrl = document.getElementById('inputCustomUrl') ? document.getElementById('inputCustomUrl').value.trim() : '';
            const customKey = document.getElementById('inputCustomApiKey') ? document.getElementById('inputCustomApiKey').value.trim() : '';
            const aiModel = document.getElementById('inputAiModel') ? document.getElementById('inputAiModel').value.trim() : '';
            const autoCheck = document.getElementById('chkAutoCheckUpdates') ? document.getElementById('chkAutoCheckUpdates').checked : true;
            const wrapEnabled = (typeof isWordWrapEnabled !== 'undefined') ? isWordWrapEnabled : (localStorage.getItem('natex_word_wrap') !== 'false');
            const chkEffects = document.getElementById('chkThemeEffects');
            const effectsEnabled = chkEffects ? chkEffects.checked : (localStorage.getItem('natex_theme_effects') !== 'false');
            const rangeEffectsFreq = document.getElementById('rangeThemeEffectsFreq');
            const effectsFreq = rangeEffectsFreq ? (parseInt(rangeEffectsFreq.value, 10) || 100) : (parseInt(localStorage.getItem('natex_theme_effects_freq') || '100', 10));

            localStorage.setItem('natex_ai_provider', provider);
            localStorage.setItem('natex_gemini_key', geminiKey);
            localStorage.setItem('natex_auto_update', autoCheck ? 'true' : 'false');
            localStorage.setItem('natex_word_wrap', wrapEnabled ? 'true' : 'false');
            localStorage.setItem('natex_theme_effects', effectsEnabled ? 'true' : 'false');
            localStorage.setItem('natex_theme_effects_freq', String(effectsFreq));

            await fetch('/api/config', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ai_provider: provider,
                    gemini_api_key: geminiKey,
                    openai_api_key: openaiKey,
                    claude_api_key: claudeKey,
                    nvidia_api_key: nvidiaKey,
                    custom_api_url: customUrl,
                    custom_api_key: customKey,
                    ai_model: aiModel,
                    theme: currentTheme,
                    custom_color: currentCustomColor,
                    language: currentLanguage,
                    auto_check_updates: autoCheck,
                    word_wrap: wrapEnabled,
                    theme_effects: effectsEnabled,
                    theme_effects_frequency: effectsFreq
                })
            });
            if (typeof updateAiBadge === 'function') updateAiBadge(provider);
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            if (typeof showToast === 'function') {
                showToast(isEn ? 'Settings saved successfully! ✓' : '¡Ajustes guardados correctamente! ✓', 'success');
            }
            if (modalSettings) modalSettings.classList.add('hidden');
        };
    }

    const btnPdfRecompile = document.getElementById('btnPdfRecompile');
    if (btnPdfRecompile) {
        btnPdfRecompile.onclick = compileDocument;
    }

    const btnRefreshPdf = document.getElementById('btnRefreshPdf');
    if (btnRefreshPdf) {
        btnRefreshPdf.onclick = () => {
            const pdfFile = currentOpenFile && currentOpenFile.endsWith('.tex') ? currentOpenFile.slice(0, -4) + '.pdf' : 'main.pdf';
            showPdf(`/api/pdf?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(pdfFile)}&t=${Date.now()}`);
        };
    }

    const btnDownloadPdf = document.getElementById('btnDownloadPdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.onclick = downloadCompiledPdf;
    }

    const btnOpenPdfTab = document.getElementById('btnOpenPdfNewTab');
    if (btnOpenPdfTab) {
        btnOpenPdfTab.onclick = openPdfInNewTab;
    }

    const btnPdfInvertMode = document.getElementById('btnPdfInvertMode');
    if (btnPdfInvertMode) {
        btnPdfInvertMode.onclick = cyclePdfPaperMode;
    }

    const btnPdfPrevPage = document.getElementById('btnPdfPrevPage');
    if (btnPdfPrevPage) {
        btnPdfPrevPage.onclick = () => scrollToPdfPage((window.pdfViewerState.currentPage || 1) - 1);
    }

    const btnPdfNextPage = document.getElementById('btnPdfNextPage');
    if (btnPdfNextPage) {
        btnPdfNextPage.onclick = () => scrollToPdfPage((window.pdfViewerState.currentPage || 1) + 1);
    }

    const pdfPageInput = document.getElementById('pdfPageInput');
    if (pdfPageInput) {
        pdfPageInput.onchange = () => scrollToPdfPage(pdfPageInput.value);
        pdfPageInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                scrollToPdfPage(pdfPageInput.value);
            }
        };
    }

    const btnPdfZoomOut = document.getElementById('btnPdfZoomOut');
    if (btnPdfZoomOut) {
        btnPdfZoomOut.onclick = () => stepPdfZoom(-1);
    }

    const btnPdfZoomIn = document.getElementById('btnPdfZoomIn');
    if (btnPdfZoomIn) {
        btnPdfZoomIn.onclick = () => stepPdfZoom(1);
    }

    const pdfZoomSelect = document.getElementById('pdfZoomSelect');
    if (pdfZoomSelect) {
        pdfZoomSelect.value = window.pdfViewerState.zoom || '100';
        pdfZoomSelect.onchange = () => applyPdfZoom(pdfZoomSelect.value);
    }

    const customViewer = document.getElementById('pdfCustomViewer');
    if (customViewer) {
        applyPdfPaperMode(window.pdfViewerState.paperMode, false);
        customViewer.addEventListener('scroll', () => {
            const cards = customViewer.querySelectorAll('.pdf-page-card');
            if (!cards.length) return;
            const viewerRect = customViewer.getBoundingClientRect();
            const midY = viewerRect.top + viewerRect.height * 0.35;
            let bestPage = 1;
            let bestDist = Infinity;
            cards.forEach(c => {
                const r = c.getBoundingClientRect();
                const dist = Math.abs((r.top + r.bottom) * 0.5 - midY);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPage = parseInt(c.getAttribute('data-page'), 10) || 1;
                }
            });
            if (window.pdfViewerState.currentPage !== bestPage) {
                window.pdfViewerState.currentPage = bestPage;
                const inp = document.getElementById('pdfPageInput');
                if (inp && document.activeElement !== inp) {
                    inp.value = String(bestPage);
                }
            }
        });
        window.addEventListener('resize', () => {
            if (window.pdfViewerState.zoom === 'fit' || parseFloat(window.pdfViewerState.zoom) <= 100) {
                applyPdfZoom(window.pdfViewerState.zoom);
            }
        });
    }

    initModalCloseHandlers();
}

window.setView = setView;
window.initResizer = initResizer;
window.compileDocument = compileDocument;
window.loadProject = loadProject;
window.loadProjectCode = loadProjectCode;
window.initSettings = initSettings;
window.applyTheme = applyTheme;
window.loadConfigFromServer = loadConfigFromServer;
window.showPdf = showPdf;
window.openPdfInNewTab = openPdfInNewTab;
window.downloadCompiledPdf = downloadCompiledPdf;
window.applyPdfPaperMode = applyPdfPaperMode;
window.cyclePdfPaperMode = cyclePdfPaperMode;
window.applyPdfZoom = applyPdfZoom;
window.stepPdfZoom = stepPdfZoom;
window.scrollToPdfPage = scrollToPdfPage;
window.initModalCloseHandlers = initModalCloseHandlers;
window.initDropdownMenus = initDropdownMenus;
window.setupEventListeners = setupEventListeners;

if (typeof window.setThemeEffectsEnabled === 'undefined') {
    window.setThemeEffectsEnabled = (val) => {
        if (typeof setThemeEffectsEnabled === 'function') setThemeEffectsEnabled(val);
    };
}
if (typeof window.updateThemeEffects === 'undefined') {
    window.updateThemeEffects = (t, c) => {
        if (typeof updateThemeEffects === 'function') updateThemeEffects(t, c);
    };
}
