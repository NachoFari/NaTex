// Barra Lateral Estilo Overleaf (Archivos + Esquema)
function initProjectSidebar() {
    const sidebar = document.getElementById('projectSidebar');
    const btnToggle = document.getElementById('btnToggleSidebar');
    const btnCollapse = document.getElementById('btnCollapseSidebar');
    const btnNewFile = document.getElementById('btnSidebarNewFile');
    const btnNewFolder = document.getElementById('btnSidebarNewFolder');
    const btnUpload = document.getElementById('btnSidebarUpload');
    const fileInput = document.getElementById('sidebarFileInput');
    const hResizer = document.getElementById('sidebarHResizer');

    const titleFileTree = document.getElementById('titleFileTree');
    const titleOutline = document.getElementById('titleOutline');
    const treeContainer = document.getElementById('fileTreeContainer');
    const outlineContainer = document.getElementById('outlineContainer');

    // Toggle ocultar / mostrar barra lateral
    if (btnToggle && sidebar) {
        btnToggle.onclick = () => {
            sidebar.classList.toggle('collapsed');
        };
    }
    if (btnCollapse && sidebar) {
        btnCollapse.onclick = () => {
            sidebar.classList.add('collapsed');
        };
    }

    // Colapsar secciones individualmente con flechita ⌵
    if (titleFileTree && treeContainer) {
        titleFileTree.onclick = () => {
            titleFileTree.classList.toggle('collapsed');
            treeContainer.style.display = titleFileTree.classList.contains('collapsed') ? 'none' : 'block';
        };
    }
    if (titleOutline && outlineContainer) {
        titleOutline.onclick = () => {
            titleOutline.classList.toggle('collapsed');
            outlineContainer.style.display = titleOutline.classList.contains('collapsed') ? 'none' : 'block';
        };
    }

    // Resizer horizontal entre árbol de archivos y esquema
    if (hResizer && sidebar) {
        let isDraggingH = false;
        let startY = 0;
        let startTreeH = 0;

        hResizer.onmousedown = (e) => {
            isDraggingH = true;
            startY = e.clientY;
            const treeSec = document.getElementById('sidebarSectionTree');
            startTreeH = treeSec ? treeSec.offsetHeight : 200;
            hResizer.classList.add('dragging');
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
        };

        window.addEventListener('mousemove', (e) => {
            if (!isDraggingH) return;
            const dy = e.clientY - startY;
            const treeSec = document.getElementById('sidebarSectionTree');
            const outlineSec = document.getElementById('sidebarSectionOutline');
            if (treeSec && outlineSec) {
                const newTreeH = Math.max(70, Math.min(sidebar.offsetHeight - 120, startTreeH + dy));
                treeSec.style.flex = 'none';
                treeSec.style.height = `${newTreeH}px`;
                outlineSec.style.flex = '1';
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDraggingH) {
                isDraggingH = false;
                hResizer.classList.remove('dragging');
                document.body.style.cursor = '';
            }
        });
    }

    // Botón Nuevo Archivo 📄+
    if (btnNewFile) {
        btnNewFile.onclick = async () => {
            const isEn = currentLanguage === 'en';
            const filename = prompt(isEn ? 'Name for new file (e.g. chapter1.tex, refs.bib):' : 'Nombre del nuevo archivo (ej. capitulo1.tex, referencias.bib):');
            if (!filename || !filename.trim()) return;
            let clean = filename.trim().replace(/\\/g, '/').replace(/\s+/g, '_');
            if (!clean.includes('.')) {
                clean += '.tex';
            }
            if (clean.includes('/')) {
                const parentDir = clean.substring(0, clean.lastIndexOf('/'));
                expandedFolders.add(parentDir);
                saveExpandedFolders();
            }

            try {
                if (codeEditor && currentOpenFile) {
                    await fetch('/api/project/save', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            name: currentProject,
                            file: currentOpenFile,
                            code: codeEditor.value
                        })
                    }).catch(() => {});
                }

                const res = await fetch('/api/project/file/create', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name: currentProject, filename: clean, is_folder: false })
                });
                const data = await res.json();
                if (data.success) {
                    await loadProjectCode(currentProject, clean);
                } else {
                    alert(data.error || 'Error al crear archivo');
                }
            } catch (err) {
                alert(String(err));
            }
        };
    }

    // Botón Nueva Carpeta 📁+
    if (btnNewFolder) {
        btnNewFolder.onclick = async () => {
            const isEn = currentLanguage === 'en';
            const foldername = prompt(isEn ? 'Name for new folder (e.g. images):' : 'Nombre de la nueva carpeta (ej. imagenes):');
            if (!foldername || !foldername.trim()) return;
            const clean = foldername.trim().replace(/\\/g, '/').replace(/\s+/g, '_');

            try {
                const res = await fetch('/api/project/file/create', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name: currentProject, filename: clean, is_folder: true })
                });
                const data = await res.json();
                if (data.success) {
                    expandedFolders.add(clean);
                    saveExpandedFolders();
                    await loadProjectCode(currentProject, currentOpenFile);
                } else {
                    alert(data.error || 'Error al crear carpeta');
                }
            } catch (err) {
                alert(String(err));
            }
        };
    }

    // Botón Subir Archivo ⬆️
    if (btnUpload && fileInput) {
        btnUpload.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                for (let file of e.target.files) {
                    await uploadFileToProject(file);
                }
                fileInput.value = '';
                await loadProjectCode(currentProject, currentOpenFile);
            }
        };
    }

    // Soporte Drag and Drop sobre la barra lateral
    if (sidebar) {
        sidebar.addEventListener('dragover', (e) => {
            e.preventDefault();
            sidebar.style.borderColor = 'var(--fox-orange)';
        });
        sidebar.addEventListener('dragleave', (e) => {
            sidebar.style.borderColor = '';
        });
        sidebar.addEventListener('drop', async (e) => {
            e.preventDefault();
            sidebar.style.borderColor = '';
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                for (let file of e.dataTransfer.files) {
                    await uploadFileToProject(file);
                }
                await loadProjectCode(currentProject, currentOpenFile);
            }
        });
    }
}

async function uploadFileToProject(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Data = event.target.result;
            try {
                const res = await fetch('/api/project/upload_base64', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        project: currentProject,
                        filename: file.name,
                        data: base64Data
                    })
                });
                const data = await res.json();
                if (data.success) {
                    editorStatus.innerText = `¡${file.name} subido con éxito! ✓`;
                    editorStatus.style.color = '#10B981';
                }
            } catch (err) {
                console.error('Error al subir archivo:', err);
            }
            resolve();
        };
        reader.readAsDataURL(file);
    });
}

const expandedFolders = new Set(JSON.parse(localStorage.getItem('natex_expanded_folders') || '["Test"]'));
function saveExpandedFolders() {
    try {
        localStorage.setItem('natex_expanded_folders', JSON.stringify([...expandedFolders]));
    } catch(e) {}
}

function renderFileTree(files) {
    const container = document.getElementById('fileTreeList');
    if (!container) return;
    container.innerHTML = '';

    let fileList = Array.isArray(files) ? [...files] : [];
    fileList = fileList.map(f => typeof f === 'string' ? { name: f, path: f, is_dir: false } : f);

    // Filtrar archivos auxiliares del compilador
    const IGNORED = ['.synctex.gz', '.synctex', '.aux', '.log', '.out', '.toc', '.fls', '.fdb_latexmk', '.bbl', '.blg', '.xdv', '.pdf'];
    fileList = fileList.filter(f => !IGNORED.some(ext => (f.name || '').toLowerCase().endsWith(ext)));

    // main.tex siempre visible en la raíz
    if (!fileList.some(f => (f.path || f.name) === 'main.tex')) {
        fileList.unshift({ name: 'main.tex', path: 'main.tex', is_dir: false });
    }

    function sortNodes(nodes, isRoot = false) {
        return nodes.sort((a, b) => {
            if (isRoot && (a.path || a.name) === 'main.tex') return -1;
            if (isRoot && (b.path || b.name) === 'main.tex') return 1;
            if (a.is_dir && !b.is_dir) return -1;
            if (!a.is_dir && b.is_dir) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    function createNodeElement(node, isRoot = false) {
        const nodePath = node.path || node.name;
        const wrapper = document.createElement('div');
        wrapper.className = 'tree-node-wrapper';

        if (node.is_dir) {
            const isExpanded = expandedFolders.has(nodePath);
            const folderRow = document.createElement('div');
            folderRow.className = 'file-tree-item folder-item';
            folderRow.dataset.path = nodePath;

            folderRow.innerHTML = `
                <div class="file-label">
                    <span class="folder-chevron">${isExpanded ? '▾' : '▸'}</span>
                    <span class="file-icon">${isExpanded ? '📂' : '📁'}</span>
                    <span class="file-name" title="${escapeHtml(node.name)}">${escapeHtml(node.name)}</span>
                </div>
                <button class="file-more-btn" title="Opciones">⋮</button>
            `;

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'folder-children';
            childrenContainer.style.display = isExpanded ? 'block' : 'none';

            let children = node.children || [];
            children = children.filter(f => !IGNORED.some(ext => (f.name || '').toLowerCase().endsWith(ext)));
            sortNodes(children, false);

            if (children.length === 0) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'file-tree-empty-folder';
                emptyItem.innerText = currentLanguage === 'en' ? '(empty folder)' : '(carpeta vacía)';
                childrenContainer.appendChild(emptyItem);
            } else {
                children.forEach(child => {
                    childrenContainer.appendChild(createNodeElement(child, false));
                });
            }

            // Click en la fila de la carpeta para expandir/colapsar
            folderRow.onclick = (e) => {
                if (e.target.closest('.file-more-btn')) {
                    e.stopPropagation();
                    openFolderContextMenu(node, e);
                    return;
                }
                const nowExpanded = !expandedFolders.has(nodePath);
                if (nowExpanded) {
                    expandedFolders.add(nodePath);
                } else {
                    expandedFolders.delete(nodePath);
                }
                saveExpandedFolders();

                const chevron = folderRow.querySelector('.folder-chevron');
                const icon = folderRow.querySelector('.file-icon');
                if (chevron) chevron.innerText = nowExpanded ? '▾' : '▸';
                if (icon) icon.innerText = nowExpanded ? '📂' : '📁';
                childrenContainer.style.display = nowExpanded ? 'block' : 'none';
            };

            wrapper.appendChild(folderRow);
            wrapper.appendChild(childrenContainer);
            return wrapper;

        } else {
            // Es archivo
            const fileRow = document.createElement('div');
            const isActive = (nodePath === currentOpenFile || node.name === currentOpenFile);
            fileRow.className = 'file-tree-item' + (isActive ? ' active' : '');
            fileRow.dataset.path = nodePath;

            let icon = '📄';
            const ext = node.name.split('.').pop().toLowerCase();
            if (ext === 'tex') icon = '📄';
            else if (ext === 'bib') icon = '📚';
            else if (isImageFile(node.name)) icon = '🖼️';
            else if (['sty', 'cls'].includes(ext)) icon = '⚙️';

            fileRow.innerHTML = `
                <div class="file-label">
                    <span style="width: 10px; display: inline-block; flex-shrink: 0;"></span>
                    <span class="file-icon">${icon}</span>
                    <span class="file-name" title="${escapeHtml(nodePath)}">${escapeHtml(node.name)}</span>
                </div>
                ${nodePath !== 'main.tex' ? `<button class="file-more-btn" title="Opciones">⋮</button>` : ''}
            `;

            fileRow.onclick = async (e) => {
                if (e.target.closest('.file-more-btn')) {
                    e.stopPropagation();
                    openFileContextMenu(node, e);
                    return;
                }

                if (isImageFile(node.name)) {
                    showImagePreviewModal(nodePath);
                    return;
                }

                if (currentOpenFile !== nodePath) {
                    if (codeEditor && currentOpenFile) {
                        await fetch('/api/project/save', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                name: currentProject,
                                file: currentOpenFile,
                                code: codeEditor.value
                            })
                        }).catch(() => {});
                    }

                    await loadProjectCode(currentProject, nodePath);
                    if (codeEditor) codeEditor.focus();
                }
            };

            wrapper.appendChild(fileRow);
            return wrapper;
        }
    }

    sortNodes(fileList, true);
    fileList.forEach(node => {
        container.appendChild(createNodeElement(node, true));
    });
}

function closeAllFileContextMenus() {
    const existing = document.getElementById('activeFileContextMenu');
    if (existing) existing.remove();
}

function openFolderContextMenu(folder, event) {
    closeAllFileContextMenus();

    const menu = document.createElement('div');
    menu.className = 'file-context-menu';
    menu.id = 'activeFileContextMenu';

    const folderPath = folder.path || folder.name;
    const isEn = currentLanguage === 'en';

    // 1. Nuevo archivo aquí
    const btnNewFile = document.createElement('button');
    btnNewFile.className = 'file-context-item';
    btnNewFile.innerHTML = '<span>📄</span> <span>' + (isEn ? 'New File Here' : 'Nuevo Archivo Aquí') + '</span>';
    btnNewFile.onclick = async (e) => {
        e.stopPropagation();
        closeAllFileContextMenus();
        const fname = prompt(isEn ? `New file name in ${folder.name}/:` : `Nombre del nuevo archivo en ${folder.name}/:`);
        if (!fname || !fname.trim()) return;
        let clean = fname.trim().replace(/\s+/g, '_');
        if (!clean.includes('.')) clean += '.tex';
        const fullRelPath = `${folderPath}/${clean}`;
        try {
            const res = await fetch('/api/project/file/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name: currentProject, filename: fullRelPath, is_folder: false })
            });
            const data = await res.json();
            if (data.success) {
                expandedFolders.add(folderPath);
                saveExpandedFolders();
                await loadProjectCode(currentProject, fullRelPath);
            } else {
                alert(data.error || 'Error al crear archivo');
            }
        } catch (err) { alert(String(err)); }
    };

    // 2. Nueva subcarpeta aquí
    const btnNewSubfolder = document.createElement('button');
    btnNewSubfolder.className = 'file-context-item';
    btnNewSubfolder.innerHTML = '<span>📁</span> <span>' + (isEn ? 'New Subfolder' : 'Nueva Subcarpeta') + '</span>';
    btnNewSubfolder.onclick = async (e) => {
        e.stopPropagation();
        closeAllFileContextMenus();
        const subname = prompt(isEn ? `New subfolder in ${folder.name}/:` : `Nombre de la subcarpeta en ${folder.name}/:`);
        if (!subname || !subname.trim()) return;
        const clean = subname.trim().replace(/\s+/g, '_');
        const fullRelPath = `${folderPath}/${clean}`;
        try {
            const res = await fetch('/api/project/file/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name: currentProject, filename: fullRelPath, is_folder: true })
            });
            const data = await res.json();
            if (data.success) {
                expandedFolders.add(folderPath);
                expandedFolders.add(fullRelPath);
                saveExpandedFolders();
                await loadProjectCode(currentProject, currentOpenFile);
            } else {
                alert(data.error || 'Error al crear subcarpeta');
            }
        } catch (err) { alert(String(err)); }
    };

    // 3. Renombrar carpeta
    const btnRename = document.createElement('button');
    btnRename.className = 'file-context-item';
    btnRename.innerHTML = '<span>✏️</span> <span>' + (isEn ? 'Rename Folder' : 'Renombrar Carpeta') + '</span>';
    btnRename.onclick = async (e) => {
        e.stopPropagation();
        closeAllFileContextMenus();
        const newName = prompt(isEn ? 'New folder name:' : 'Nuevo nombre para la carpeta:', folder.name);
        if (!newName || !newName.trim() || newName === folder.name) return;
        const cleanName = newName.trim().replace(/\s+/g, '_');
        try {
            const res = await fetch('/api/project/file/rename', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: currentProject,
                    old_filename: folderPath,
                    new_filename: cleanName
                })
            });
            const data = await res.json();
            if (data.success) {
                expandedFolders.delete(folderPath);
                expandedFolders.add(data.new_filename || cleanName);
                saveExpandedFolders();
                await loadProjectCode(currentProject, currentOpenFile);
            } else {
                alert(data.error || 'Error al renombrar carpeta');
            }
        } catch (err) { alert(String(err)); }
    };

    // 4. Eliminar carpeta
    const btnDelete = document.createElement('button');
    btnDelete.className = 'file-context-item text-danger';
    btnDelete.innerHTML = '<span>🗑️</span> <span>' + (isEn ? 'Delete Folder' : 'Eliminar Carpeta') + '</span>';
    btnDelete.onclick = async (e) => {
        e.stopPropagation();
        closeAllFileContextMenus();
        if (!confirm(isEn ? `Are you sure you want to delete folder "${folder.name}" and all its contents?` : `¿Estás seguro de que deseas eliminar la carpeta "${folder.name}" y todos sus contenidos?`)) return;
        try {
            const res = await fetch('/api/project/file/delete', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: currentProject,
                    filename: folderPath
                })
            });
            const data = await res.json();
            if (data.success) {
                expandedFolders.delete(folderPath);
                saveExpandedFolders();
                if (currentOpenFile && (currentOpenFile === folderPath || currentOpenFile.startsWith(folderPath + '/'))) {
                    currentOpenFile = 'main.tex';
                }
                await loadProjectCode(currentProject, currentOpenFile);
            } else {
                alert(data.error || 'Error al eliminar carpeta');
            }
        } catch (err) { alert(String(err)); }
    };

    menu.appendChild(btnNewFile);
    menu.appendChild(btnNewSubfolder);
    menu.appendChild(btnRename);
    menu.appendChild(btnDelete);
    document.body.appendChild(menu);

    const btnRect = event.target.getBoundingClientRect();
    menu.style.top = `${btnRect.bottom + 4}px`;
    menu.style.left = `${Math.max(10, btnRect.right - 140)}px`;

    const closeHandler = (e) => {
        if (!menu.contains(e.target)) {
            closeAllFileContextMenus();
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
}

function openFileContextMenu(file, event) {
    closeAllFileContextMenus();

    const menu = document.createElement('div');
    menu.className = 'file-context-menu';
    menu.id = 'activeFileContextMenu';

    const filePath = file.path || file.name;
    const isEn = currentLanguage === 'en';

    const btnRename = document.createElement('button');
    btnRename.className = 'file-context-item';
    btnRename.innerHTML = '<span>✏️</span> <span>' + (isEn ? 'Rename' : 'Renombrar') + '</span>';
    btnRename.onclick = async (e) => {
        e.stopPropagation();
        closeAllFileContextMenus();
        const newName = prompt(isEn ? 'New file name:' : 'Nuevo nombre para el archivo:', file.name);
        if (!newName || !newName.trim() || newName === file.name) return;
        const cleanName = newName.trim().replace(/\s+/g, '_');
        try {
            const res = await fetch('/api/project/file/rename', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: currentProject,
                    old_filename: filePath,
                    new_filename: cleanName
                })
            });
            const data = await res.json();
            if (data.success) {
                const updatedPath = data.new_filename || cleanName;
                if (currentOpenFile === filePath) currentOpenFile = updatedPath;
                await loadProjectCode(currentProject, currentOpenFile);
            } else {
                alert(data.error || 'Error al renombrar archivo');
            }
        } catch (err) {
            alert('Error de conexión al renombrar');
        }
    };

    const btnCopyPath = document.createElement('button');
    btnCopyPath.className = 'file-context-item';
    btnCopyPath.innerHTML = '<span>📋</span> <span>' + (isEn ? 'Copy Path' : 'Copiar Ruta') + '</span>';
    btnCopyPath.onclick = (e) => {
        e.stopPropagation();
        closeAllFileContextMenus();
        navigator.clipboard.writeText(filePath);
        if (typeof showToast === 'function') {
            showToast(isEn ? 'Path copied to clipboard!' : '¡Ruta copiada al portapapeles!');
        } else {
            alert(isEn ? `Path copied: ${filePath}` : `Ruta copiada: ${filePath}`);
        }
    };

    const btnDelete = document.createElement('button');
    btnDelete.className = 'file-context-item text-danger';
    btnDelete.innerHTML = '<span>🗑️</span> <span>' + (isEn ? 'Delete' : 'Eliminar') + '</span>';
    btnDelete.onclick = async (e) => {
        e.stopPropagation();
        closeAllFileContextMenus();
        const isEn = currentLanguage === 'en';
        if (!confirm(isEn ? `Are you sure you want to delete "${file.name}"?` : `¿Estás seguro de que deseas eliminar "${file.name}"?`)) return;
        try {
            const res = await fetch('/api/project/file/delete', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: currentProject,
                    filename: filePath
                })
            });
            const data = await res.json();
            if (data.success) {
                if (currentOpenFile === filePath) currentOpenFile = 'main.tex';
                await loadProjectCode(currentProject, currentOpenFile);
            } else {
                alert(data.error || 'Error al eliminar archivo');
            }
        } catch (err) {
            alert('Error de conexión al eliminar');
        }
    };

    menu.appendChild(btnRename);
    menu.appendChild(btnCopyPath);
    menu.appendChild(btnDelete);
    document.body.appendChild(menu);

    const btnRect = event.target.getBoundingClientRect();
    menu.style.top = `${btnRect.bottom + 4}px`;
    menu.style.left = `${Math.max(10, btnRect.right - 140)}px`;

    const closeHandler = (e) => {
        if (!menu.contains(e.target)) {
            closeAllFileContextMenus();
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
}

function showImagePreviewModal(filename) {
    const assetUrl = `/api/project/asset?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(filename)}&t=${Date.now()}`;
    const snippet = getFigureSnippet(filename);

    let modal = document.getElementById('modalImagePreview');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalImagePreview';
        modal.className = 'modal hidden';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 480px; text-align: center;">
            <div class="modal-header">
                <h3>🖼️ ${escapeHtml(filename)}</h3>
                <button class="modal-close" id="btnCloseImgPrev">&times;</button>
            </div>
            <div class="modal-body" style="padding: 16px;">
                <div style="background: #090a0d; border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 14px; display: flex; justify-content: center; align-items: center; min-height: 180px; max-height: 300px; overflow: hidden;">
                    <img src="${assetUrl}" alt="${escapeHtml(filename)}" style="max-width: 100%; max-height: 270px; object-fit: contain; border-radius: 4px;">
                </div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-primary" id="btnInsertFigureDoc">📥 Insertar en Documento</button>
                    <button class="btn-secondary" id="btnCopyFigureCode">📋 Copiar Código</button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');

    const btnClose = modal.querySelector('#btnCloseImgPrev');
    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');

    const btnInsert = modal.querySelector('#btnInsertFigureDoc');
    if (btnInsert) {
        btnInsert.onclick = () => {
            ensureGraphicxPackage();
            insertAtCursor('\n' + snippet + '\n');
            modal.classList.add('hidden');
            editorStatus.innerText = `Figura "${filename}" insertada en el código ✓`;
            editorStatus.style.color = '#10B981';
            setTimeout(() => { editorStatus.innerText = 'Guardado automático ✓'; }, 2500);
        };
    }

    const btnCopy = modal.querySelector('#btnCopyFigureCode');
    if (btnCopy) {
        btnCopy.onclick = () => {
            fallbackCopyText(snippet, btnCopy, '¡Copiado! ✓');
        };
    }
}

// Live Parser del Esquema del Documento (File outline)
function parseDocumentOutline(latexCode) {
    const list = document.getElementById('outlineTreeList');
    const badge = document.getElementById('outlineCountBadge');
    if (!list) return;

    if (!latexCode || !latexCode.trim()) {
        list.innerHTML = `<p class="text-muted outline-empty">${i18n[currentLanguage]?.outline_empty || 'No hay secciones aún (\\section{...})'}</p>`;
        if (badge) badge.innerText = '0';
        return;
    }

    const lines = latexCode.split('\n');
    const headingRegex = /\\(part|chapter|section|subsection|subsubsection)\*?\s*\{([^}]+)\}/;

    const headings = [];
    let chapCount = 0;
    let secCount = 0;
    let subsecCount = 0;
    let subsubsecCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith('%')) continue;

        const match = headingRegex.exec(line);
        if (match) {
            const type = match[1];
            const title = match[2].trim();
            const isStarred = match[0].includes('*');

            let num = '';
            if (!isStarred) {
                if (type === 'chapter') {
                    chapCount++;
                    secCount = 0;
                    subsecCount = 0;
                    num = `${chapCount}. `;
                } else if (type === 'section') {
                    secCount++;
                    subsecCount = 0;
                    num = chapCount > 0 ? `${chapCount}.${secCount}. ` : `${secCount}. `;
                } else if (type === 'subsection') {
                    subsecCount++;
                    subsubsecCount = 0;
                    num = chapCount > 0 ? `${chapCount}.${secCount}.${subsecCount}. ` : `${secCount}.${subsecCount}. `;
                } else if (type === 'subsubsection') {
                    subsubsecCount++;
                    num = chapCount > 0 ? `${chapCount}.${secCount}.${subsecCount}.${subsubsecCount}. ` : `${secCount}.${subsecCount}.${subsubsecCount}. `;
                }
            }

            headings.push({
                type,
                title,
                num,
                line: i + 1
            });
        }
    }

    if (badge) badge.innerText = headings.length;

    if (headings.length === 0) {
        list.innerHTML = `<p class="text-muted outline-empty">${i18n[currentLanguage]?.outline_empty || 'No hay secciones aún (\\section{...})'}</p>`;
        return;
    }

    list.innerHTML = '';
    headings.forEach(h => {
        const item = document.createElement('div');
        item.className = `outline-tree-item level-${h.type}`;
        item.title = `Línea ${h.line}: ${h.title} (clic para ir)`;

        let arrow = '';
        if (h.type === 'section' || h.type === 'chapter') arrow = '<span class="outline-arrow">⌵</span>';
        else arrow = '<span class="outline-arrow"></span>';

        item.innerHTML = `
            ${arrow}
            ${h.num ? `<span class="outline-num">${escapeHtml(h.num)}</span>` : ''}
            <span class="outline-text">${escapeHtml(h.title)}</span>
        `;

        item.onclick = () => jumpToLine(h.line);
        list.appendChild(item);
    });
}

function jumpToLine(lineNumber) {
    if (!codeEditor) return;
    const lines = codeEditor.value.split('\n');
    if (lineNumber > lines.length) return;

    let charPos = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
        charPos += lines[i].length + 1;
    }

    codeEditor.focus();
    codeEditor.setSelectionRange(charPos, charPos + lines[lineNumber - 1].length);

    const lineHeight = 21;
    const targetScroll = Math.max(0, (lineNumber - 6) * lineHeight);
    codeEditor.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (lineNumbers) lineNumbers.scrollTop = targetScroll;

    codeEditor.classList.remove('editor-flash-highlight');
    void codeEditor.offsetWidth;
    codeEditor.classList.add('editor-flash-highlight');
    setTimeout(() => codeEditor.classList.remove('editor-flash-highlight'), 1200);
}

// ==========================================================================
// CREADOR VISUAL DE TABLAS (MINI-EXCEL)
// ==========================================================================

