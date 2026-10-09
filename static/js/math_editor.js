// Teclado Matemático y Editor de Fórmulas
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
