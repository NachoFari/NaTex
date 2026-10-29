// NaTex Studio - Dashboard & Project Management Module

let dashboardCachedProjects = [];
let templatesModalSource = 'editor';

async function loadProjects() {
    const urlParams = new URLSearchParams(window.location.search);
    const lockedProject = urlParams.get('p');

    try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        const projectSelect = document.getElementById('projectSelect');
        if (!projectSelect) return;

        projectSelect.innerHTML = '';
        const isGuest = window.isNaTexGuestMode || (lockedProject && lockedProject.length > 0);

        if (isGuest && lockedProject) {
            const opt = document.createElement('option');
            opt.value = lockedProject;
            opt.textContent = `🔒 ${lockedProject.replace(/_/g, ' ')}`;
            projectSelect.appendChild(opt);
            projectSelect.disabled = true;
            projectSelect.title = 'Proyecto compartido por el anfitrión (Modo Colaborativo)';
            currentProject = lockedProject;
            if (typeof loadProject === 'function') {
                await loadProject(currentProject);
            }
            return;
        }

        projectSelect.disabled = false;
        data.projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p.replace(/_/g, ' ');
            projectSelect.appendChild(opt);
        });

        if (data.projects.includes(currentProject)) {
            projectSelect.value = currentProject;
        } else if (data.projects.length > 0) {
            currentProject = data.projects[0];
            projectSelect.value = currentProject;
        }

        if (typeof loadProject === 'function') {
            await loadProject(currentProject);
        }
    } catch (e) {
        console.error('Error cargando proyectos:', e);
    }
}

async function loadDashboardData() {
    try {
        const res = await fetch('/api/projects/details');
        const data = await res.json();
        const projects = data.projects || [];
        dashboardCachedProjects = projects;
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

        renderDashboardProjects(dashboardCachedProjects);
    } catch (e) {
        console.error('Error loading dashboard:', e);
    }
}

function renderDashboardProjects(projectsList) {
    const grid = document.getElementById('dashboardProjectsGrid');
    const countBadge = document.getElementById('dashboardProjectsCountBadge');
    if (!grid) return;

    const sourceProjects = projectsList || dashboardCachedProjects || [];
    const query = (document.getElementById('dashboardSearchInput')?.value || '').trim().toLowerCase();
    const dateFilter = document.getElementById('dashboardFilterDate')?.value || 'all';
    const statusFilter = document.getElementById('dashboardFilterStatus')?.value || 'all';
    const sortBy = document.getElementById('dashboardSortBy')?.value || 'recent';
    const nowSec = Date.now() / 1000;

    let filtered = sourceProjects.filter(p => {
        if (query) {
            const cleanName = (p.name || '').replace(/_/g, ' ').toLowerCase();
            const rawName = (p.name || '').toLowerCase();
            const prev = (p.preview || '').toLowerCase();
            if (!cleanName.includes(query) && !rawName.includes(query) && !prev.includes(query)) {
                return false;
            }
        }
        if (dateFilter !== 'all') {
            const mtime = p.mtime || 0;
            const ageSec = nowSec - mtime;
            if (dateFilter === 'today' && ageSec > 86400) return false;
            if (dateFilter === 'week' && ageSec > 86400 * 7) return false;
            if (dateFilter === 'month' && ageSec > 86400 * 30) return false;
        }
        if (statusFilter === 'with_pdf' && !p.has_pdf) return false;
        if (statusFilter === 'no_pdf' && p.has_pdf) return false;
        return true;
    });

    filtered.sort((a, b) => {
        if (sortBy === 'oldest') return (a.mtime || 0) - (b.mtime || 0);
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
        if (sortBy === 'lines_desc') return (b.lines || 0) - (a.lines || 0);
        return (b.mtime || 0) - (a.mtime || 0);
    });

    if (countBadge) {
        countBadge.textContent = filtered.length === sourceProjects.length
            ? `${filtered.length}`
            : `${filtered.length} / ${sourceProjects.length}`;
    }

    grid.innerHTML = '';
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';

    if (filtered.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'projects-empty-filter';
        emptyDiv.innerHTML = isEn
            ? '🔍 No projects match your current search or filters.'
            : '🔍 Ningún proyecto coincide con tu búsqueda o filtros actuales.';
        grid.appendChild(emptyDiv);
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card' + (p.name === currentProject ? ' active-project' : '');
        card.style.cursor = 'pointer';
        const dateStr = p.mtime ? new Date(p.mtime * 1000).toLocaleDateString() : '';
        const linesStr = isEn ? 'lines' : 'líneas';
        const noTextStr = isEn ? 'No text' : 'Sin texto';
        const zipTitle = isEn ? 'Export project as .zip' : 'Exportar proyecto como .zip';
        const cleanProjectTitle = typeof escapeHtml === 'function' ? escapeHtml(p.name.replace(/_/g, ' ')) : p.name.replace(/_/g, ' ');
        const previewHtml = p.preview 
            ? (typeof escapeHtml === 'function' ? escapeHtml(p.preview) : p.preview) 
            : `<em>${noTextStr}</em>`;

        card.innerHTML = `
            <div class="project-card-header">
                <span class="project-card-name">${cleanProjectTitle}</span>
                <div style="display:flex; align-items:center; gap:6px;">
                    ${p.has_pdf ? '<span class="project-badge">PDF ✓</span>' : ''}
                    <button class="btn-card-zip" title="${zipTitle}" style="background:rgba(255,255,255,0.06); border:1px solid var(--border-color); color:var(--text-muted); border-radius:6px; padding:2px 7px; font-size:11px; cursor:pointer;">📦 .zip</button>
                </div>
            </div>
            <div class="project-card-preview">${previewHtml}</div>
            <div class="project-card-footer">
                <span>🕒 ${dateStr}</span>
                <span>📄 ${p.lines} ${linesStr}</span>
            </div>
        `;
        const btnZip = card.querySelector('.btn-card-zip');
        if (btnZip) {
            btnZip.onclick = (ev) => {
                ev.stopPropagation();
                exportProjectZip(p.name);
            };
        }
        card.onclick = async () => {
            if (typeof loadProject === 'function') {
                await loadProject(p.name);
            }
            if (typeof setView === 'function') {
                setView('editor');
            }
        };
        grid.appendChild(card);
    });
}

function renderDashboardProjectsGrid() {
    renderDashboardProjects(dashboardCachedProjects);
}

function exportProjectZip(projName) {
    const target = projName || currentProject;
    if (!target) return;
    window.open(`/api/project/export_zip?name=${encodeURIComponent(target)}`, '_blank');
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    if (typeof showToast === 'function') {
        showToast(isEn ? `Exporting ${target}.zip... 📦` : `Exportando ${target}.zip... 📦`, 'info');
    }
}

async function importProjectZipFile(file) {
    if (!file) return;
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const defaultName = file.name.replace(/\.zip$/i, '').replace(/\s+/g, '_') || 'Proyecto_Importado';
    const projName = await showAppPrompt({
        title: isEn ? '📥 Import Project (.zip)' : '📥 Importar Proyecto (.zip)',
        message: isEn ? 'Name for the imported project:' : 'Nombre para el proyecto importado:',
        defaultValue: defaultName,
        placeholder: 'Proyecto_Overleaf',
        confirmText: isEn ? 'Import' : 'Importar',
        cancelText: isEn ? 'Cancel' : 'Cancelar'
    });
    if (!projName) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            if (typeof showToast === 'function') {
                showToast(isEn ? 'Importing .zip project...' : 'Importando proyecto .zip...', 'info');
            }
            const res = await fetch('/api/project/import_zip', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    filename: file.name,
                    project_name: projName.trim().replace(/\s+/g, '_'),
                    data: ev.target.result
                })
            });
            const data = await res.json();
            if (data.success) {
                const importedName = data.name || data.project || projName.trim().replace(/\s+/g, '_');
                const count = data.files_count ?? data.extracted_count ?? 0;
                if (typeof showToast === 'function') {
                    showToast(
                        isEn
                            ? `Project "${importedName}" imported (${count} files) ✓`
                            : `Proyecto "${importedName}" importado (${count} archivos) ✓`,
                        'success'
                    );
                }
                await loadProjects();
                if (typeof loadProject === 'function') {
                    await loadProject(importedName);
                }
                if (typeof setView === 'function') {
                    setView('editor');
                }
                if (typeof compileDocument === 'function') {
                    compileDocument();
                }
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.error || (isEn ? 'Could not import .zip' : 'No se pudo importar el .zip'), 'error');
                }
            }
        } catch (err) {
            if (typeof showToast === 'function') {
                showToast(String(err), 'error');
            }
        }
    };
    reader.readAsDataURL(file);
}

async function createNewProjectPrompt() {
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const name = await showAppPrompt({
        title: isEn ? '📄 New Project' : '📄 Nuevo Proyecto',
        message: isEn ? 'Name for the new project (e.g. Lab_Report):' : 'Nombre del nuevo proyecto (ej. Informe_Laboratorio):',
        defaultValue: 'Mi_Nuevo_Proyecto',
        placeholder: 'Informe_Laboratorio',
        confirmText: isEn ? 'Create' : 'Crear',
        cancelText: isEn ? 'Cancel' : 'Cancelar'
    });
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
        if (typeof loadProject === 'function') {
            await loadProject(cleanName);
        }
        if (typeof setView === 'function') {
            setView('editor');
        }
    }
}

async function saveAsTemplatePrompt() {
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const name = await showAppPrompt({
        title: isEn ? '⭐ Save as Template' : '⭐ Guardar como Plantilla',
        message: isEn ? 'Name for your custom template:' : 'Nombre para tu plantilla personalizada:',
        defaultValue: (typeof currentProject !== 'undefined' ? currentProject : 'Mi_Proyecto') + '_Plantilla',
        placeholder: 'Mi_Plantilla',
        confirmText: isEn ? 'Save' : 'Guardar',
        cancelText: isEn ? 'Cancel' : 'Cancelar'
    });
    if (!name) return;
    const res = await fetch('/api/templates/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({project: currentProject, name: name.trim().replace(/\s+/g, '_')})
    });
    const data = await res.json();
    if (data.success) {
        if (typeof editorStatus !== 'undefined' && editorStatus) {
            editorStatus.innerText = isEn ? 'Template saved ✓' : 'Plantilla guardada ✓';
            setTimeout(() => { editorStatus.innerText = 'Guardado automático ✓'; }, 2000);
        }
        if (typeof showToast === 'function') {
            showToast(isEn ? 'Template saved successfully! ✓' : '¡Plantilla guardada con éxito! ✓', 'success');
        }
    }
}

async function openTemplatesModal(source = 'editor') {
    templatesModalSource = source;
    const modalTemplates = document.getElementById('modalTemplates');
    if (!modalTemplates) return;

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

    if (builtInDiv) {
        builtInDiv.innerHTML = '';
        data.built_in.forEach(t => {
            const meta = templateMeta[t.id] || { icon: '📄', name: t.name };
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `<div class="template-icon">${meta.icon}</div><div class="template-title">${meta.name}</div>`;
            card.onclick = () => applyTemplate(t.id);
            builtInDiv.appendChild(card);
        });
    }

    if (userDiv) {
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
    }

    modalTemplates.classList.remove('hidden');
}

async function applyTemplate(templateId) {
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const modalTemplates = document.getElementById('modalTemplates');

    // Regla de Oro: Si venimos desde el Home Dashboard, SIEMPRE creamos un documento/proyecto nuevo
    if (templatesModalSource === 'home') {
        const defaultName = (templateId || 'Mi_Documento').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\s+/g, '_');
        const projName = await showAppPrompt({
            title: isEn ? '📄 New Document from Template' : '📄 Nuevo Documento desde Plantilla',
            message: isEn ? 'Enter a name for your new project:' : 'Introduce un nombre para tu nuevo proyecto:',
            defaultValue: defaultName,
            placeholder: 'Mi_Proyecto',
            confirmText: isEn ? 'Create' : 'Crear',
            cancelText: isEn ? 'Cancel' : 'Cancelar'
        });
        if (!projName) return;

        const cleanName = projName.trim().replace(/\s+/g, '_');
        try {
            const res = await fetch('/api/project/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name: cleanName, template: templateId })
            });
            const data = await res.json();
            if (data.success) {
                if (modalTemplates) modalTemplates.classList.add('hidden');
                await loadProjects();
                if (typeof loadProject === 'function') {
                    await loadProject(cleanName);
                }
                if (typeof setView === 'function') {
                    setView('editor');
                }
                if (typeof compileDocument === 'function') {
                    compileDocument();
                }
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.error || 'Error al crear proyecto', 'error');
                }
            }
        } catch (err) {
            if (typeof showToast === 'function') {
                showToast(String(err), 'error');
            }
        }
        return;
    }

    // Si venimos desde el Editor, damos las dos opciones: Reemplazar actual o Crear archivo nuevo
    const targetFile = (typeof currentOpenFile !== 'undefined' && currentOpenFile) ? currentOpenFile : 'main.tex';
    const choice = await showTemplateChoiceModal({
        templateId,
        templateName: templateId,
        currentFile: targetFile
    });
    if (!choice) return;

    try {
        const res = await fetch('/api/templates/apply', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                project: currentProject, 
                template: templateId,
                target_file: targetFile,
                mode: choice,
                new_filename: `${templateId}.tex`
            })
        });
        const data = await res.json();
        if (data.success) {
            if (typeof codeEditor !== 'undefined' && codeEditor) {
                codeEditor.value = data.code;
            }
            currentOpenFile = data.file || targetFile;
            if (typeof updateEditorFileTitle === 'function') updateEditorFileTitle();
            if (typeof updateLineNumbers === 'function') updateLineNumbers();
            if (modalTemplates) modalTemplates.classList.add('hidden');
            if (typeof setView === 'function') setView('editor');
            if (typeof compileDocument === 'function') compileDocument();
            if (typeof loadProjectCode === 'function') {
                await loadProjectCode(currentProject, currentOpenFile);
            }
        } else {
            if (typeof showToast === 'function') {
                showToast(data.error || 'Error al aplicar plantilla', 'error');
            }
        }
    } catch (err) {
        if (typeof showToast === 'function') {
            showToast(String(err), 'error');
        }
    }
}

function initDashboard() {
    const tabHome = document.getElementById('navTabHome');
    const tabEditor = document.getElementById('navTabEditor');
    const brandLogo = document.getElementById('brandLogo');
    const brandText = document.getElementById('brandText');

    if (tabHome) tabHome.onclick = () => { if (typeof setView === 'function') setView('home'); };
    if (tabEditor) tabEditor.onclick = () => { if (typeof setView === 'function') setView('editor'); };
    if (brandLogo) brandLogo.onclick = () => { if (typeof setView === 'function') setView('home'); };
    if (brandText) brandText.onclick = () => { if (typeof setView === 'function') setView('home'); };

    const btnHeroContinue = document.getElementById('btnHeroContinue');
    if (btnHeroContinue) {
        btnHeroContinue.onclick = async () => {
            const hName = document.getElementById('heroProjectName')?.innerText?.trim().replace(/\s+/g, '_') || currentProject;
            if (typeof loadProject === 'function') await loadProject(hName);
            if (typeof setView === 'function') setView('editor');
        };
    }

    const heroCard = document.getElementById('heroCard');
    if (heroCard) {
        heroCard.style.cursor = 'pointer';
        heroCard.onclick = async (e) => {
            if (e.target.closest('#btnHeroContinue')) return;
            const hName = document.getElementById('heroProjectName')?.innerText?.trim().replace(/\s+/g, '_') || currentProject;
            if (typeof loadProject === 'function') await loadProject(hName);
            if (typeof setView === 'function') setView('editor');
        };
    }

    const btnDashNew = document.getElementById('btnDashboardNewProject');
    if (btnDashNew) btnDashNew.onclick = createNewProjectPrompt;

    const btnDashImportZip = document.getElementById('btnDashboardImportZip');
    const zipInput = document.getElementById('zipProjectInput');
    if (btnDashImportZip && zipInput) {
        btnDashImportZip.onclick = () => zipInput.click();
    }
    if (zipInput) {
        zipInput.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                zipInput.value = '';
                await importProjectZipFile(file);
            }
        };
    }

    const qBlank = document.getElementById('quickBlankProject');
    if (qBlank) qBlank.onclick = createNewProjectPrompt;

    const qTpl = document.getElementById('quickFromTemplate');
    if (qTpl) qTpl.onclick = () => openTemplatesModal('home');

    const qVoice = document.getElementById('quickVoiceDictate');
    if (qVoice) qVoice.onclick = () => {
        if (typeof openVoiceDictateModal === 'function') openVoiceDictateModal();
    };

    const qGal = document.getElementById('quickOpenGallery');
    if (qGal) qGal.onclick = () => {
        if (typeof openGalleryModal === 'function') openGalleryModal();
    };

    // Controles de búsqueda y filtrado de "Tus Proyectos"
    const searchInput = document.getElementById('dashboardSearchInput');
    const btnClearSearch = document.getElementById('btnClearDashboardSearch');
    const filterDate = document.getElementById('dashboardFilterDate');
    const filterStatus = document.getElementById('dashboardFilterStatus');
    const sortBy = document.getElementById('dashboardSortBy');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (btnClearSearch) {
                btnClearSearch.classList.toggle('hidden', !searchInput.value);
            }
            renderDashboardProjectsGrid();
        });
    }
    if (btnClearSearch && searchInput) {
        btnClearSearch.onclick = () => {
            searchInput.value = '';
            btnClearSearch.classList.add('hidden');
            renderDashboardProjectsGrid();
            searchInput.focus();
        };
    }
    if (filterDate) filterDate.onchange = () => renderDashboardProjectsGrid();
    if (filterStatus) filterStatus.onchange = () => renderDashboardProjectsGrid();
    if (sortBy) sortBy.onchange = () => renderDashboardProjectsGrid();
}

window.dashboardCachedProjects = dashboardCachedProjects;
window.loadProjects = loadProjects;
window.loadDashboardData = loadDashboardData;
window.renderDashboardProjects = renderDashboardProjects;
window.renderDashboardProjectsGrid = renderDashboardProjectsGrid;
window.createNewProjectPrompt = createNewProjectPrompt;
window.exportProjectZip = exportProjectZip;
window.importProjectZipFile = importProjectZipFile;
window.openTemplatesModal = openTemplatesModal;
window.applyTemplate = applyTemplate;
window.saveAsTemplatePrompt = saveAsTemplatePrompt;
window.initDashboard = initDashboard;
