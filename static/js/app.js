// NaTex Studio - Orquestador Principal
// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initHeartbeat();
    initResizer();
    initEditor();
    initDashboard();
    initMathKeyboard();
    initSyncTeX();
    initVoiceDictate();
    initUpdateChecker();
    initProjectSidebar();
    initTableBuilder();
    loadProjects();
    setupEventListeners();
    setupCollaborationPolling();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('p')) {
        setView('editor');
    } else {
        setView('home');
    }
});

function initHeartbeat() {
    // Latido periódico para mantener vivo el proceso NaTex
    setInterval(() => {
        fetch('/api/system/heartbeat').catch(() => {});
    }, 2500);

    // Aviso inmediato de desconexión al cerrar la pestaña
    window.addEventListener('beforeunload', () => {
        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/system/goodbye');
            } else {
                fetch('/api/system/goodbye', { method: 'POST', keepalive: true }).catch(() => {});
            }
        } catch (_) {}
    });
}

// Configuración, Temas e Idiomas
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

function updateAiBadge(provider) {
    const badge = document.getElementById('aiActiveProviderBadge');
    if (!badge) return;
    const names = {
        'gemini': 'Gemini',
        'openai': 'OpenAI',
        'claude': 'Claude',
        'nvidia': 'NVIDIA NIM',
        'custom': 'Local / Custom'
    };
    badge.textContent = names[provider] || provider || 'IA';
}

function updateAiProviderPanels(provider) {
    const panels = {
        'gemini': document.getElementById('aiPanelGemini'),
        'openai': document.getElementById('aiPanelOpenai'),
        'claude': document.getElementById('aiPanelClaude'),
        'nvidia': document.getElementById('aiPanelNvidia'),
        'custom': document.getElementById('aiPanelCustom')
    };
    for (const [key, panel] of Object.entries(panels)) {
        if (panel) {
            if (key === provider) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        }
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
        updateAiProviderPanels(prov);
        updateAiBadge(prov);

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

    const selAi = document.getElementById('selectAiProvider');
    if (selAi) {
        selAi.onchange = () => {
            updateAiProviderPanels(selAi.value);
            updateAiBadge(selAi.value);
        };
    }

    loadConfigFromServer();
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
                        <span>${isEn ? 'You have the latest version (v0.2).' : '¡Tienes la versión más reciente (v0.2)!'}</span>
                    </div>
                `;
            }
        } catch (e) {
            btnCheck.disabled = false;
            btnCheck.innerText = isEn ? '🔍 Check for Updates' : '🔍 Comprobar Actualizaciones';
            resultBox.innerHTML = `<div style="color:#EF4444;">⚠️ Error: ${e.message}</div>`;
        }
    };

    // Verificación automática en segundo plano al arrancar si está activada
    setTimeout(async () => {
        try {
            const isAuto = localStorage.getItem('natex_auto_update') !== 'false';
            if (!isAuto) return;
            const res = await fetch('/api/system/check_update');
            const data = await res.json();
            if (data.success && data.has_update) {
                showUpdateBanner(data);
            }
        } catch (_) {}
    }, 2500);
}

function showUpdateBanner(data) {
    const banner = document.getElementById('updateBanner');
    const bannerText = document.getElementById('updateBannerText');
    const btnUpdate = document.getElementById('btnBannerUpdate');
    const btnClose = document.getElementById('btnCloseBanner');
    if (!banner) return;

    const isEn = currentLanguage === 'en';
    const ver = data.latest_version || 'v0.2';
    if (bannerText) {
        bannerText.innerHTML = isEn 
            ? `🚀 <strong>New version available (${escapeHtml(ver)})!</strong> Update NaTex to get the latest features.`
            : `🚀 <strong>¡Nueva versión disponible (${escapeHtml(ver)})!</strong> Actualiza NaTex para obtener las últimas novedades.`;
    }
    banner.classList.remove('hidden');

    if (btnUpdate) {
        btnUpdate.onclick = () => {
            banner.classList.add('hidden');
            const modal = document.getElementById('modalSettings');
            if (modal) modal.classList.remove('hidden');
            const btnCheck = document.getElementById('btnCheckUpdates');
            if (btnCheck) btnCheck.click();
        };
    }
    if (btnClose) {
        btnClose.onclick = () => {
            banner.classList.add('hidden');
        };
    }
}

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

async function loadProjectCode(projName, targetFile = 'main.tex') {
    editorStatus.innerText = 'Cargando...';
    currentOpenFile = targetFile;
    updateEditorFileTitle();
    const res = await fetch(`/api/project/load?name=${encodeURIComponent(projName)}&file=${encodeURIComponent(targetFile)}`);
    const data = await res.json();
    codeEditor.value = data.code || '';
    lastMtime = data.mtime || 0;
    updateLineNumbers();
    codeEditor.focus();
    editorStatus.innerText = 'Guardado automático ✓';
    editorStatus.style.color = '#10B981';

    projectFilesList = data.files || [];
    renderFileTree(projectFilesList);
    parseDocumentOutline(data.code || '');

    try {
        updateFilesList(data.files || []);
        updateGallerySidebar(data.files || []);
    } catch (e) {
        console.warn('Gallery update warning:', e);
    }

    if (data.has_pdf && data.pdf_file) {
        showPdf(`/api/pdf?name=${encodeURIComponent(projName)}&file=${encodeURIComponent(data.pdf_file)}&t=${Date.now()}`);
    } else if (data.has_pdf) {
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
                file: currentOpenFile,
                code: codeEditor.value
            })
        });
        const data = await res.json();

        if (data.success) {
            errorBox.classList.add('hidden');
            showPdf(`${data.pdf_url}&t=${Date.now()}`);
            parseDocumentOutline(codeEditor.value);
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

    const templateMeta = {
        'poster_congreso_a0': { icon: '📢', name: 'Póster Congreso A0 (3 Col)' },
        'poster_academico_a3': { icon: '🖼️', name: 'Póster Académico A3 (2 Col)' },
        'presentacion_slides': { icon: '📽️', name: 'Presentación Slides (PPT 16:9)' },
        'informe_laboratorio': { icon: '📑', name: 'Informe Técnico y Lab' },
        'paper_1col': { icon: '📄', name: 'Paper Científico (1 Columna)' },
        'paper_2col': { icon: '🔬', name: 'Paper Científico IEEE (2 Col)' },
        'tesis_universitaria': { icon: '🎓', name: 'Tesis y Memoria de Título' },
        'curriculum_vitae': { icon: '💼', name: 'Curriculum Vitae (CV)' },
        'guia_examen': { icon: '📝', name: 'Examen y Guía Ejercicios' },
        'cheat_sheet_formulas': { icon: '⚡', name: 'Cheat Sheet / Fórmulas (3 Col)' }
    };

    builtInDiv.innerHTML = '';
    data.built_in.forEach(t => {
        const meta = templateMeta[t.id] || { icon: '📄', name: t.name };
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `<div class="template-icon">${meta.icon}</div><div class="template-title">${meta.name}</div>`;
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
    const isEn = currentLanguage === 'en';
    const targetFile = currentOpenFile || 'main.tex';
    const confirmMsg = isEn 
        ? `Replace the content of '${targetFile}' with this template? Make sure you have saved any changes.`
        : `¿Deseas reemplazar el código de '${targetFile}' con esta plantilla? Asegúrate de haber guardado tus cambios.`;
    if (!confirm(confirmMsg)) return;

    const res = await fetch('/api/templates/apply', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            project: currentProject, 
            template: templateId,
            target_file: targetFile
        })
    });
    const data = await res.json();
    if (data.success) {
        codeEditor.value = data.code;
        currentOpenFile = data.file || targetFile;
        updateEditorFileTitle();
        updateLineNumbers();
        modalTemplates.classList.add('hidden');
        setView('editor');
        compileDocument();
    }
}

// Galería de Imágenes y Recursos del Proyecto
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
            if (data.provider) updateAiBadge(data.provider);
            appendChatMessage('ai', data.response);
        } else {
            appendChatMessage('ai', `⚠️ ${data.error || 'No se pudo conectar con el proveedor de IA. Revisa tu configuración en Ajustes.'}`);
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
    if (btnSettings) {
        btnSettings.onclick = () => {
            loadConfigFromServer();
            modalSettings.classList.remove('hidden');
        };
    }
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
        const provider = document.getElementById('selectAiProvider') ? document.getElementById('selectAiProvider').value : 'gemini';
        const geminiKey = document.getElementById('inputApiKey') ? document.getElementById('inputApiKey').value.trim() : '';
        const openaiKey = document.getElementById('inputApiKeyOpenai') ? document.getElementById('inputApiKeyOpenai').value.trim() : '';
        const claudeKey = document.getElementById('inputApiKeyClaude') ? document.getElementById('inputApiKeyClaude').value.trim() : '';
        const nvidiaKey = document.getElementById('inputApiKeyNvidia') ? document.getElementById('inputApiKeyNvidia').value.trim() : '';
        const customUrl = document.getElementById('inputCustomUrl') ? document.getElementById('inputCustomUrl').value.trim() : '';
        const customKey = document.getElementById('inputCustomApiKey') ? document.getElementById('inputCustomApiKey').value.trim() : '';
        const aiModel = document.getElementById('inputAiModel') ? document.getElementById('inputAiModel').value.trim() : '';
        const autoCheck = document.getElementById('chkAutoCheckUpdates') ? document.getElementById('chkAutoCheckUpdates').checked : true;

        localStorage.setItem('natex_ai_provider', provider);
        localStorage.setItem('natex_gemini_key', geminiKey);
        localStorage.setItem('natex_auto_update', autoCheck ? 'true' : 'false');

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
                auto_check_updates: autoCheck
            })
        });
        updateAiBadge(provider);
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
        const pdfFile = currentOpenFile && currentOpenFile.endsWith('.tex') ? currentOpenFile.slice(0, -4) + '.pdf' : 'main.pdf';
        window.open(`/api/pdf?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(pdfFile)}`, '_blank');
    };

    const btnOpenPdfTab = document.getElementById('btnOpenPdfNewTab');
    if (btnOpenPdfTab) {
        btnOpenPdfTab.onclick = openPdfInNewTab;
    }

    // Inicializar manejadores para todos los botones de cerrar (X)
    initModalCloseHandlers();
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
    if (itemDownPdf) itemDownPdf.onclick = () => {
        const pdfFile = currentOpenFile && currentOpenFile.endsWith('.tex') ? currentOpenFile.slice(0, -4) + '.pdf' : 'main.pdf';
        window.open(`/api/pdf?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(pdfFile)}`, '_blank');
    };

    const itemOpenPdfTab = document.getElementById('menuItemOpenPdfTab');
    if (itemOpenPdfTab) itemOpenPdfTab.onclick = openPdfInNewTab;

    const itemDownTex = document.getElementById('menuItemDownloadTex');
    if (itemDownTex) itemDownTex.onclick = () => {
        const texFile = currentOpenFile || 'main.tex';
        window.open(`/api/project/download_tex?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(texFile)}`, '_blank');
    };

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

    const btnRestart = document.getElementById('btnRestartTunnel');
    if (btnRestart) {
        btnRestart.onclick = async () => {
            btnRestart.disabled = true;
            const originalHtml = btnRestart.innerHTML;
            btnRestart.innerHTML = '⏳ ' + (currentLanguage === 'en' ? 'Restarting...' : 'Reiniciando...');
            const loading = document.getElementById('shareLoading');
            const ready = document.getElementById('shareReady');
            if (loading) {
                loading.classList.remove('hidden');
                loading.innerHTML = `<div style="font-size:28px; margin-bottom:8px;">⏳</div><p>${currentLanguage === 'en' ? 'Generating new secure link...' : 'Generando nuevo enlace seguro...'}</p>`;
            }
            if (ready) ready.classList.add('hidden');

            try {
                const res = await fetch(`/api/tunnel/restart?project=${encodeURIComponent(currentProject)}`);
                const data = await res.json();
                btnRestart.disabled = false;
                btnRestart.innerHTML = originalHtml;
                if (data.success && data.url) {
                    if (loading) loading.classList.add('hidden');
                    if (ready) ready.classList.remove('hidden');
                    const projectLink = `${data.url}/?p=${encodeURIComponent(currentProject)}`;
                    const inputUrl = document.getElementById('inputShareUrl');
                    if (inputUrl) inputUrl.value = projectLink;

                    const qrContainer = document.getElementById('shareQrCode');
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
                    if (loading) loading.innerHTML = `<p style="color:#EF4444;">⚠️ ${data.error || 'Error al reiniciar túnel'}</p>`;
                }
            } catch (err) {
                btnRestart.disabled = false;
                btnRestart.innerHTML = originalHtml;
                if (loading) loading.innerHTML = `<p style="color:#EF4444;">⚠️ Error: ${err.message}</p>`;
            }
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

