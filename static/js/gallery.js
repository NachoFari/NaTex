// Galería de Imágenes (Barra Lateral + Modal)
function isImageFile(filename) {
    if (!filename) return false;
    const name = (typeof filename === 'object' && filename !== null) ? (filename.name || '') : String(filename);
    if (!name || typeof name !== 'string') return false;
    const ext = name.slice((name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp', 'gif'].includes(ext);
}

function getFigureSnippet(filename) {
    const labelClean = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    return `\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.7\\linewidth]{${filename}}\n  \\caption{Descripción de la figura}\n  \\label{fig:${labelClean}}\n\\end{figure}`;
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

function extractImageFiles(files) {
    let images = [];
    (files || []).forEach(f => {
        if (!f) return;
        const item = typeof f === 'object' ? f : { name: f, path: f };
        if (item.is_dir && item.children) {
            images = images.concat(extractImageFiles(item.children));
        } else if (isImageFile(item.path || item.name)) {
            images.push(item.path || item.name);
        }
    });
    return images;
}

function updateGallerySidebar(files) {
    const galleryList = document.getElementById('sidebarGalleryList');
    if (!galleryList) return;
    
    const imageFiles = extractImageFiles(files);
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
    const imageFiles = extractImageFiles(files);
    if (imageFiles.length === 0) {
        list.innerHTML = '<li class="text-muted">No hay imágenes en este proyecto.</li>';
        return;
    }
    imageFiles.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${escapeHtml(f)}</span><button class="btn-insert-code" onclick="copyFigureCode('${escapeHtml(f)}', this)">📋 Copiar</button>`;
        list.appendChild(li);
    });
}

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
