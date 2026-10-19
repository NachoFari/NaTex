// Controlador del Editor LaTeX, Búsqueda/Reemplazo, Autocompletado Inteligente y SyncTeX
let typingTimeout = null;
let acActiveItems = [];
let acSelectedIndex = 0;
let acTriggerInfo = null; // { type, replaceStart, replaceEnd, prefix }
let findMatches = [];
let findCurrentIdx = -1;
let findCaseSensitive = false;

const LATEX_ENVIRONMENTS = [
    { name: 'itemize', desc: 'Lista con viñetas (\\item)', body: '    \\item ' },
    { name: 'enumerate', desc: 'Lista numerada (\\item)', body: '    \\item ' },
    { name: 'equation', desc: 'Ecuación numerada en bloque', body: '    ' },
    { name: 'align', desc: 'Ecuaciones alineadas (&)', body: '    ' },
    { name: 'figure', desc: 'Figura flotante con caption', body: '    \\centering\n    \\includegraphics[width=0.75\\textwidth]{}\n    \\caption{}\n    \\label{fig:}' },
    { name: 'table', desc: 'Tabla flotante con caption', body: '    \\centering\n    \\caption{}\n    \\label{tab:}' },
    { name: 'tabular', desc: 'Cuadrícula de tabla {c|c}', extraArgs: '{c|c}', body: '    A & B \\\\\n    \\hline\n    1 & 2' },
    { name: 'pmatrix', desc: 'Matriz con paréntesis ( )', body: '    a & b \\\\\n    c & d' },
    { name: 'bmatrix', desc: 'Matriz con corchetes [ ]', body: '    a & b \\\\\n    c & d' },
    { name: 'vmatrix', desc: 'Determinante | |', body: '    a & b \\\\\n    c & d' },
    { name: 'cases', desc: 'Función definida por tramos', body: '    x, & \\text{si } x > 0 \\\\\n    0, & \\text{en otro caso}' },
    { name: 'abstract', desc: 'Resumen del documento', body: '    ' },
    { name: 'frame', desc: 'Diapositiva Beamer', extraArgs: '{Título}', body: '    ' },
    { name: 'columns', desc: 'Columnas en Beamer', body: '    \\begin{column}{0.48\\textwidth}\n        \n    \\end{column}\n    \\begin{column}{0.48\\textwidth}\n        \n    \\end{column}' },
    { name: 'center', desc: 'Bloque centrado', body: '    ' },
    { name: 'quote', desc: 'Cita textual en bloque', body: '    ' },
    { name: 'verbatim', desc: 'Texto/código sin formato', body: '' },
    { name: 'tikzpicture', desc: 'Lienzo de dibujo TikZ', body: '    ' }
];

const LATEX_COMMANDS = [
    { cmd: '\\section{}', label: '\\section{...}', desc: 'Sección principal', cursorBack: 1 },
    { cmd: '\\subsection{}', label: '\\subsection{...}', desc: 'Subsección', cursorBack: 1 },
    { cmd: '\\subsubsection{}', label: '\\subsubsection{...}', desc: 'Sub-subsección', cursorBack: 1 },
    { cmd: '\\textbf{}', label: '\\textbf{...}', desc: 'Texto en negrita', cursorBack: 1 },
    { cmd: '\\textit{}', label: '\\textit{...}', desc: 'Texto en cursiva', cursorBack: 1 },
    { cmd: '\\underline{}', label: '\\underline{...}', desc: 'Texto subrayado', cursorBack: 1 },
    { cmd: '\\frac{}{}', label: '\\frac{a}{b}', desc: 'Fracción matemática', cursorBack: 3 },
    { cmd: '\\sqrt{}', label: '\\sqrt{x}', desc: 'Raíz cuadrada', cursorBack: 1 },
    { cmd: '\\sum_{i=1}^{n}', label: '\\sum_{i=1}^{n}', desc: 'Sumatoria', cursorBack: 0 },
    { cmd: '\\int_{a}^{b}', label: '\\int_{a}^{b}', desc: 'Integral definida', cursorBack: 0 },
    { cmd: '\\lim_{x \\to \\infty}', label: '\\lim_{x \\to \\infty}', desc: 'Límite', cursorBack: 0 },
    { cmd: '\\includegraphics[width=0.8\\textwidth]{}', label: '\\includegraphics{...}', desc: 'Insertar imagen', cursorBack: 1 },
    { cmd: '\\cite{}', label: '\\cite{...}', desc: 'Cita bibliográfica (.bib)', cursorBack: 1 },
    { cmd: '\\ref{}', label: '\\ref{...}', desc: 'Referencia cruzada (\\label)', cursorBack: 1 },
    { cmd: '\\eqref{}', label: '\\eqref{...}', desc: 'Referencia a ecuación', cursorBack: 1 },
    { cmd: '\\label{}', label: '\\label{...}', desc: 'Etiqueta para referencia', cursorBack: 1 },
    { cmd: '\\caption{}', label: '\\caption{...}', desc: 'Título de figura o tabla', cursorBack: 1 },
    { cmd: '\\usepackage{}', label: '\\usepackage{...}', desc: 'Importar paquete LaTeX', cursorBack: 1 },
    { cmd: '\\item ', label: '\\item', desc: 'Elemento de lista', cursorBack: 0 },
    { cmd: '\\bibliography{}', label: '\\bibliography{...}', desc: 'Archivo BibTeX (.bib)', cursorBack: 1 }
];

function initEditor() {
    initFindReplaceBar();
    initVersionHistoryModal();

    codeEditor.addEventListener('input', (e) => {
        updateLineNumbers();
        triggerAutoSave();
        updateAutocompleteSuggestions(e);
        if (!document.getElementById('editorFindBar')?.classList.contains('hidden')) {
            runFindMatches(false);
        }
        clearTimeout(outlineDebounceTimer);
        outlineDebounceTimer = setTimeout(() => {
            parseDocumentOutline(codeEditor.value);
        }, 350);
    });

    codeEditor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeEditor.scrollTop;
    });

    codeEditor.addEventListener('click', () => {
        hideAutocompletePopup();
        updateCursorMetricsOnly();
    });
    codeEditor.addEventListener('keyup', () => updateCursorMetricsOnly());
    codeEditor.addEventListener('blur', () => {
        setTimeout(() => hideAutocompletePopup(), 180);
    });

    codeEditor.addEventListener('keydown', (e) => {
        isUserTyping = true;
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => { isUserTyping = false; }, 2000);

        // 1. Navegación del popup de autocompletado si está visible
        const acPopup = document.getElementById('editorAutocompletePopup');
        if (acPopup && !acPopup.classList.contains('hidden') && acActiveItems.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                acSelectedIndex = (acSelectedIndex + 1) % acActiveItems.length;
                renderAutocompletePopup();
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                acSelectedIndex = (acSelectedIndex - 1 + acActiveItems.length) % acActiveItems.length;
                renderAutocompletePopup();
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                applyAutocompleteItem(acActiveItems[acSelectedIndex]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                hideAutocompletePopup();
                return;
            }
        }

        // 2. Auto-cierre de \begin{entorno} al presionar Enter justo después de \begin{entorno}
        if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            const pos = codeEditor.selectionStart;
            if (pos === codeEditor.selectionEnd) {
                const before = codeEditor.value.substring(0, pos);
                const after = codeEditor.value.substring(pos);
                const lineStart = before.lastIndexOf('\n') + 1;
                const currentLine = before.substring(lineStart);
                const beginMatch = currentLine.match(/^(\s*)\\begin\{([a-zA-Z0-9\*]+)\}(\{[^\}]*\})?\s*$/);
                if (beginMatch) {
                    const indent = beginMatch[1] || '';
                    const envName = beginMatch[2];
                    const endTag = `\\end{${envName}}`;
                    const nextChunk = after.substring(0, 150);
                    if (!nextChunk.includes(endTag)) {
                        e.preventDefault();
                        const innerIndent = indent + '    ';
                        const extraItem = (envName === 'itemize' || envName === 'enumerate') ? '\\item ' : '';
                        const insertion = `\n${innerIndent}${extraItem}\n${indent}${endTag}`;
                        codeEditor.value = before + insertion + after;
                        const newCursor = pos + 1 + innerIndent.length + extraItem.length;
                        codeEditor.selectionStart = codeEditor.selectionEnd = newCursor;
                        updateLineNumbers();
                        triggerAutoSave();
                        hideAutocompletePopup();
                        return;
                    }
                }
            }
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
            updateLineNumbers();
            triggerAutoSave();
            return;
        }

        // Atajo Ctrl+/ (o Cmd+/) para comentar/descomentar líneas con %
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            const val = codeEditor.value;
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            const lineStart = val.lastIndexOf('\n', start - 1) + 1;
            let lineEnd = val.indexOf('\n', end);
            if (lineEnd === -1) lineEnd = val.length;

            const block = val.substring(lineStart, lineEnd);
            const lines = block.split('\n');
            const allCommented = lines.every(l => l.trim().startsWith('%'));
            const toggled = lines.map(l => {
                if (allCommented) {
                    return l.replace(/^(\s*)%\s?/, '$1');
                }
                return '% ' + l;
            }).join('\n');

            codeEditor.value = val.substring(0, lineStart) + toggled + val.substring(lineEnd);
            codeEditor.selectionStart = lineStart;
            codeEditor.selectionEnd = lineStart + toggled.length;
            updateLineNumbers();
            triggerAutoSave();
            return;
        }

        // Auto-cierre inteligente de llaves { } en LaTeX
        if (e.key === '{' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            if (start !== end) {
                e.preventDefault();
                const selected = codeEditor.value.substring(start, end);
                codeEditor.value = codeEditor.value.substring(0, start) + '{' + selected + '}' + codeEditor.value.substring(end);
                codeEditor.selectionStart = start + 1;
                codeEditor.selectionEnd = end + 1;
                triggerAutoSave();
            }
        }
    });

    // Atajos globales para compilar (Ctrl+S, F5) y Buscar/Reemplazar (Ctrl+F, Ctrl+H)
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

        // Ctrl+F -> Abrir barra de búsqueda del editor (si estamos en vista editor)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F' || e.code === 'KeyF')) {
            if (!document.body.classList.contains('view-home')) {
                e.preventDefault();
                e.stopPropagation();
                openFindReplaceBar(false);
                return false;
            }
        }

        // Ctrl+H -> Abrir barra de búsqueda y reemplazo del editor
        if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H' || e.code === 'KeyH')) {
            if (!document.body.classList.contains('view-home')) {
                e.preventDefault();
                e.stopPropagation();
                openFindReplaceBar(true);
                return false;
            }
        }
    }, true);
}

// =========================================================================
// PUNTO 1: BUSCADOR Y REEMPLAZO FLOTANTE (Ctrl+F / Ctrl+H)
// =========================================================================
function initFindReplaceBar() {
    const btnToggle = document.getElementById('btnToggleFindBar');
    const btnToggleRep = document.getElementById('btnToggleReplaceRow');
    const findInput = document.getElementById('findInput');
    const replaceInput = document.getElementById('replaceInput');
    const btnCase = document.getElementById('btnFindCase');
    const btnPrev = document.getElementById('btnFindPrev');
    const btnNext = document.getElementById('btnFindNext');
    const btnClose = document.getElementById('btnCloseFindBar');
    const btnRepOne = document.getElementById('btnReplaceOne');
    const btnRepAll = document.getElementById('btnReplaceAll');

    if (btnToggle) {
        btnToggle.onclick = () => {
            const bar = document.getElementById('editorFindBar');
            if (bar && !bar.classList.contains('hidden')) {
                closeFindReplaceBar();
            } else {
                openFindReplaceBar(false);
            }
        };
    }

    if (btnToggleRep) {
        btnToggleRep.onclick = () => {
            const repRow = document.getElementById('replaceRow');
            if (!repRow) return;
            const isHidden = repRow.classList.toggle('hidden');
            btnToggleRep.textContent = isHidden ? '▸' : '▾';
            if (!isHidden && replaceInput) replaceInput.focus();
        };
    }

    if (btnCase) {
        btnCase.onclick = () => {
            findCaseSensitive = !findCaseSensitive;
            btnCase.classList.toggle('active', findCaseSensitive);
            runFindMatches(true);
        };
    }

    if (findInput) {
        findInput.addEventListener('input', () => runFindMatches(true));
        findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                navigateFindMatch(e.shiftKey ? -1 : 1);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeFindReplaceBar();
            }
        });
    }

    if (replaceInput) {
        replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                replaceCurrentMatch();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeFindReplaceBar();
            }
        });
    }

    if (btnPrev) btnPrev.onclick = () => navigateFindMatch(-1);
    if (btnNext) btnNext.onclick = () => navigateFindMatch(1);
    if (btnClose) btnClose.onclick = () => closeFindReplaceBar();
    if (btnRepOne) btnRepOne.onclick = () => replaceCurrentMatch();
    if (btnRepAll) btnRepAll.onclick = () => replaceAllMatches();
}

function openFindReplaceBar(showReplace = false) {
    const bar = document.getElementById('editorFindBar');
    const repRow = document.getElementById('replaceRow');
    const btnToggleRep = document.getElementById('btnToggleReplaceRow');
    const findInput = document.getElementById('findInput');
    if (!bar || !findInput) return;

    bar.classList.remove('hidden');
    if (repRow) {
        if (showReplace) {
            repRow.classList.remove('hidden');
            if (btnToggleRep) btnToggleRep.textContent = '▾';
        }
    }

    const selStart = codeEditor.selectionStart;
    const selEnd = codeEditor.selectionEnd;
    if (selStart !== selEnd) {
        const selectedText = codeEditor.value.substring(selStart, selEnd);
        if (selectedText && !selectedText.includes('\n') && selectedText.length < 120) {
            findInput.value = selectedText;
        }
    }

    findInput.focus();
    findInput.select();
    runFindMatches(false);
}

function closeFindReplaceBar() {
    const bar = document.getElementById('editorFindBar');
    if (bar) bar.classList.add('hidden');
    codeEditor.focus();
}

function runFindMatches(selectFirst = false) {
    const findInput = document.getElementById('findInput');
    const countSpan = document.getElementById('findMatchCount');
    if (!findInput || !countSpan) return;

    const query = findInput.value;
    findMatches = [];
    if (!query) {
        findCurrentIdx = -1;
        countSpan.textContent = '0/0';
        return;
    }

    const text = codeEditor.value;
    const hay = findCaseSensitive ? text : text.toLowerCase();
    const needle = findCaseSensitive ? query : query.toLowerCase();

    let pos = 0;
    while (pos <= hay.length - needle.length) {
        const idx = hay.indexOf(needle, pos);
        if (idx === -1) break;
        findMatches.push({ start: idx, end: idx + needle.length });
        pos = idx + (needle.length || 1);
    }

    if (findMatches.length === 0) {
        findCurrentIdx = -1;
        countSpan.textContent = '0/0';
        return;
    }

    if (findCurrentIdx < 0 || findCurrentIdx >= findMatches.length) {
        const curPos = codeEditor.selectionStart;
        const nextIdx = findMatches.findIndex(m => m.start >= curPos);
        findCurrentIdx = nextIdx !== -1 ? nextIdx : 0;
    }

    countSpan.textContent = `${findCurrentIdx + 1}/${findMatches.length}`;
    if (selectFirst) {
        highlightFindMatch(findMatches[findCurrentIdx], false);
    }
}

function navigateFindMatch(delta) {
    if (findMatches.length === 0) {
        runFindMatches(true);
        return;
    }
    findCurrentIdx = (findCurrentIdx + delta + findMatches.length) % findMatches.length;
    const countSpan = document.getElementById('findMatchCount');
    if (countSpan) countSpan.textContent = `${findCurrentIdx + 1}/${findMatches.length}`;
    highlightFindMatch(findMatches[findCurrentIdx], true);
}

function highlightFindMatch(match, focusEditor = false) {
    if (!match) return;
    const lineNum = codeEditor.value.substring(0, match.start).split('\n').length;
    const lineHeight = 22.4;
    const targetScroll = Math.max(0, (lineNum - 5) * lineHeight);
    codeEditor.scrollTop = targetScroll;
    lineNumbers.scrollTop = targetScroll;
    if (focusEditor) codeEditor.focus();
    codeEditor.setSelectionRange(match.start, match.end);
}

function replaceCurrentMatch() {
    const findInput = document.getElementById('findInput');
    const replaceInput = document.getElementById('replaceInput');
    if (!findInput || !replaceInput || !findInput.value) return;

    if (findMatches.length === 0) {
        runFindMatches(true);
        if (findMatches.length === 0) return;
    }

    if (findCurrentIdx < 0 || findCurrentIdx >= findMatches.length) {
        findCurrentIdx = 0;
    }

    const match = findMatches[findCurrentIdx];
    const repText = replaceInput.value;
    codeEditor.value = codeEditor.value.substring(0, match.start) + repText + codeEditor.value.substring(match.end);
    updateLineNumbers();
    triggerAutoSave();

    const newCursor = match.start + repText.length;
    codeEditor.setSelectionRange(newCursor, newCursor);
    runFindMatches(true);
}

function replaceAllMatches() {
    const findInput = document.getElementById('findInput');
    const replaceInput = document.getElementById('replaceInput');
    if (!findInput || !replaceInput || !findInput.value) return;

    runFindMatches(false);
    const total = findMatches.length;
    if (total === 0) return;

    const repText = replaceInput.value;
    let updated = codeEditor.value;
    for (let i = findMatches.length - 1; i >= 0; i--) {
        const m = findMatches[i];
        updated = updated.substring(0, m.start) + repText + updated.substring(m.end);
    }
    codeEditor.value = updated;
    updateLineNumbers();
    triggerAutoSave();
    runFindMatches(false);

    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    showToast(
        isEn ? `Replaced ${total} occurrences ✓` : `Se reemplazaron ${total} coincidencias ✓`,
        'success'
    );
}

// =========================================================================
// PUNTO 2: AUTOCOMPLETADO INTELIGENTE (\begin{...}, \cite{...}, \ref{...}, \cmd)
// =========================================================================
function collectDocumentLabelsAndBibitems() {
    const code = codeEditor.value || '';
    const labels = [];
    const seenLabels = new Set();
    const labelRe = /\\label\{([^,\}\s]+)\}/g;
    let m;
    while ((m = labelRe.exec(code)) !== null) {
        const lbl = m[1].trim();
        if (lbl && !seenLabels.has(lbl)) {
            seenLabels.add(lbl);
            labels.push(lbl);
        }
    }

    const bibitems = [];
    const seenBib = new Set();
    const bibitemRe = /\\bibitem(?:\[[^\]]*\])?\{([^,\}\s]+)\}/g;
    while ((m = bibitemRe.exec(code)) !== null) {
        const bkey = m[1].trim();
        if (bkey && !seenBib.has(bkey)) {
            seenBib.add(bkey);
            bibitems.push({ key: bkey, type: 'bibitem', title: 'Definido en el documento', file: currentOpenFile || 'main.tex' });
        }
    }
    return { labels, bibitems };
}

function updateAutocompleteSuggestions() {
    const pos = codeEditor.selectionStart;
    if (pos !== codeEditor.selectionEnd) {
        hideAutocompletePopup();
        return;
    }

    const before = codeEditor.value.substring(0, pos);
    const lineStart = before.lastIndexOf('\n') + 1;
    const lineBefore = before.substring(lineStart);

    // Caso A: \begin{prefijo
    const beginMatch = lineBefore.match(/\\begin\{([a-zA-Z0-9\*]*)$/);
    if (beginMatch) {
        const prefix = beginMatch[1].toLowerCase();
        const replaceStart = pos - beginMatch[0].length;
        let replaceEnd = pos;
        if (codeEditor.value.charAt(pos) === '}') replaceEnd = pos + 1;

        const matches = LATEX_ENVIRONMENTS.filter(env => env.name.toLowerCase().startsWith(prefix));
        if (matches.length > 0) {
            acTriggerInfo = { type: 'env', replaceStart, replaceEnd, indent: (lineBefore.match(/^(\s*)/) || ['', ''])[1] };
            acActiveItems = matches.map(env => ({
                title: `\\begin{${env.name}}...\\end{${env.name}}`,
                desc: env.desc,
                env
            }));
            acSelectedIndex = 0;
            renderAutocompletePopup('Entornos LaTeX (Enter o Tab para autocompletar)');
            return;
        }
    }

    // Caso B: \cite{prefijo (soporta múltiples citas separadas por coma \cite{k1,prefijo)
    const citeMatch = lineBefore.match(/\\(?:cite|parencite|footcite|textcite|citep|citet)\{([^\}]*)$/);
    if (citeMatch) {
        const fullArg = citeMatch[1];
        const lastComma = fullArg.lastIndexOf(',');
        const keyPrefix = (lastComma !== -1 ? fullArg.substring(lastComma + 1) : fullArg).trim().toLowerCase();
        const replaceStart = pos - (lastComma !== -1 ? (fullArg.length - lastComma - 1) : fullArg.length);
        let replaceEnd = pos;
        if (codeEditor.value.charAt(pos) === '}') replaceEnd = pos + 1;

        const { bibitems } = collectDocumentLabelsAndBibitems();
        const projectBibs = Array.isArray(window.projectBibEntries) ? window.projectBibEntries : [];
        const allBibs = [...projectBibs];
        const existingKeys = new Set(allBibs.map(b => b.key));
        bibitems.forEach(b => { if (!existingKeys.has(b.key)) allBibs.push(b); });

        const matches = allBibs.filter(b => b.key.toLowerCase().includes(keyPrefix));
        if (matches.length > 0) {
            acTriggerInfo = { type: 'cite', replaceStart, replaceEnd };
            acActiveItems = matches.slice(0, 12).map(b => ({
                title: b.key,
                desc: b.title ? `${b.title} (${b.type})` : `@${b.type} • ${b.file}`,
                insertText: `${b.key}}`
            }));
            acSelectedIndex = 0;
            renderAutocompletePopup('Citas Bibliográficas (.bib / \\bibitem)');
            return;
        }
    }

    // Caso C: \ref{prefijo o \eqref{prefijo
    const refMatch = lineBefore.match(/\\(?:ref|eqref|autoref|pageref)\{([^\}]*)$/);
    if (refMatch) {
        const prefix = refMatch[1].trim().toLowerCase();
        const replaceStart = pos - refMatch[1].length;
        let replaceEnd = pos;
        if (codeEditor.value.charAt(pos) === '}') replaceEnd = pos + 1;

        const { labels } = collectDocumentLabelsAndBibitems();
        const matches = labels.filter(l => l.toLowerCase().includes(prefix));
        if (matches.length > 0) {
            acTriggerInfo = { type: 'ref', replaceStart, replaceEnd };
            acActiveItems = matches.slice(0, 12).map(lbl => ({
                title: lbl,
                desc: 'Etiqueta \\label{' + lbl + '}',
                insertText: `${lbl}}`
            }));
            acSelectedIndex = 0;
            renderAutocompletePopup('Referencias Cruzadas (\\label)');
            return;
        }
    }

    // Caso D: Comandos LaTeX generales (\sec, \fra, \inc, etc., mínimo 2 letras tras \)
    const cmdMatch = lineBefore.match(/(\\[a-zA-Z]{2,})$/);
    if (cmdMatch) {
        const prefix = cmdMatch[1].toLowerCase();
        const replaceStart = pos - prefix.length;
        const matches = LATEX_COMMANDS.filter(c => c.cmd.toLowerCase().startsWith(prefix) && c.cmd.toLowerCase() !== prefix);
        if (matches.length > 0) {
            acTriggerInfo = { type: 'cmd', replaceStart, replaceEnd: pos };
            acActiveItems = matches.slice(0, 8).map(c => ({
                title: c.label,
                desc: c.desc,
                cmdObj: c
            }));
            acSelectedIndex = 0;
            renderAutocompletePopup('Comandos LaTeX (Tab / Enter)');
            return;
        }
    }

    hideAutocompletePopup();
}

function renderAutocompletePopup(headerTitle) {
    const popup = document.getElementById('editorAutocompletePopup');
    if (!popup || acActiveItems.length === 0) {
        hideAutocompletePopup();
        return;
    }
    const currentHeader = headerTitle || popup.getAttribute('data-header') || 'Autocompletado LaTeX';
    popup.setAttribute('data-header', currentHeader);

    let html = `<div class="ac-header"><span>✨ ${escapeHtml(currentHeader)}</span><span>⇅ Enter/Tab</span></div>`;
    acActiveItems.forEach((item, idx) => {
        const activeClass = idx === acSelectedIndex ? ' active' : '';
        html += `
            <div class="ac-item${activeClass}" data-idx="${idx}">
                <span class="ac-item-main">${escapeHtml(item.title)}</span>
                <span class="ac-item-desc">${escapeHtml(item.desc || '')}</span>
            </div>
        `;
    });
    popup.innerHTML = html;
    popup.classList.remove('hidden');

    popup.querySelectorAll('.ac-item').forEach(el => {
        el.onmousedown = (e) => {
            e.preventDefault();
            const idx = parseInt(el.getAttribute('data-idx'), 10);
            if (!isNaN(idx) && acActiveItems[idx]) {
                applyAutocompleteItem(acActiveItems[idx]);
            }
        };
    });

    const activeEl = popup.querySelector('.ac-item.active');
    if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
    }
}

function applyAutocompleteItem(item) {
    if (!item || !acTriggerInfo) return;
    const { type, replaceStart, replaceEnd, indent } = acTriggerInfo;
    const before = codeEditor.value.substring(0, replaceStart);
    const after = codeEditor.value.substring(replaceEnd);

    if (type === 'env' && item.env) {
        const env = item.env;
        const baseIndent = indent || '';
        const extra = env.extraArgs || '';
        const bodyLines = (env.body || '    ').split('\n').map(l => baseIndent + l).join('\n');
        const block = `\\begin{${env.name}}${extra}\n${bodyLines}\n${baseIndent}\\end{${env.name}}`;
        codeEditor.value = before + block + after;
        const firstLineEnd = replaceStart + `\\begin{${env.name}}${extra}\n`.length + (bodyLines.indexOf('\n') !== -1 ? bodyLines.indexOf('\n') : bodyLines.length);
        codeEditor.selectionStart = codeEditor.selectionEnd = firstLineEnd;
    } else if ((type === 'cite' || type === 'ref') && item.insertText) {
        codeEditor.value = before + item.insertText + after;
        const newPos = replaceStart + item.insertText.length;
        codeEditor.selectionStart = codeEditor.selectionEnd = newPos;
    } else if (type === 'cmd' && item.cmdObj) {
        const c = item.cmdObj;
        codeEditor.value = before + c.cmd + after;
        const newPos = replaceStart + c.cmd.length - (c.cursorBack || 0);
        codeEditor.selectionStart = codeEditor.selectionEnd = newPos;
    }

    hideAutocompletePopup();
    codeEditor.focus();
    updateLineNumbers();
    triggerAutoSave();
}

function hideAutocompletePopup() {
    const popup = document.getElementById('editorAutocompletePopup');
    if (popup) popup.classList.add('hidden');
    acActiveItems = [];
    acTriggerInfo = null;
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
            if (typeof handleHeartbeatFailure === 'function') handleHeartbeatFailure();
        }
    }, 1200);
}

// Sincronización en tiempo real para colaboradores
function setupCollaborationPolling() {
    setInterval(async () => {
        if (isUserTyping || isCompiling) return;
        try {
            const res = await fetch(`/api/project/check_update?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(currentOpenFile)}&since=${lastMtime}`);
            if (!res.ok) {
                if (typeof handleHeartbeatFailure === 'function') handleHeartbeatFailure();
                return;
            }
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
        } catch (e) {
            if (typeof handleHeartbeatFailure === 'function') handleHeartbeatFailure();
        }
    }, 2500);
}

function updateLineNumbers() {
    const lines = codeEditor.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= lines; i++) {
        numbers += i + '\n';
    }
    lineNumbers.innerText = numbers;
    updateEditorMetrics();
}

// =========================================================================
// PUNTO 3: CONTADOR EN VIVO DE PALABRAS, CARACTERES Y LÍNEA/COLUMNA
// =========================================================================
function updateCursorMetricsOnly() {
    const cursorSpan = document.getElementById('metricCursorPos');
    if (!cursorSpan || !codeEditor) return;
    const pos = codeEditor.selectionStart || 0;
    const before = codeEditor.value.substring(0, pos);
    const lines = before.split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    cursorSpan.textContent = isEn ? `📍 Ln ${ln}, Col ${col}` : `📍 Lín ${ln}, Col ${col}`;
}

function updateEditorMetrics() {
    updateCursorMetricsOnly();
    const wordSpan = document.getElementById('metricWordCount');
    const charSpan = document.getElementById('metricCharCount');
    if (!wordSpan || !charSpan || !codeEditor) return;

    const raw = codeEditor.value || '';
    const chars = raw.length;

    // Filtrar comentarios %, entornos de preámbulo y comandos LaTeX para contar palabras reales
    let bodyText = raw;
    const beginDocIdx = bodyText.indexOf('\\begin{document}');
    if (beginDocIdx !== -1) {
        bodyText = bodyText.substring(beginDocIdx + 16);
    }
    const endDocIdx = bodyText.lastIndexOf('\\end{document}');
    if (endDocIdx !== -1) {
        bodyText = bodyText.substring(0, endDocIdx);
    }

    const cleanText = bodyText
        .replace(/%.*$/gm, ' ')
        .replace(/\\(?:begin|end|label|ref|eqref|cite|parencite|usepackage|documentclass|includegraphics|bibliographystyle|bibliography)\{[^\}]*\}/g, ' ')
        .replace(/\\[a-zA-Z@]+(\*?)/g, ' ')
        .replace(/[\{\}\[\]\$\^&_~]/g, ' ');

    const wordsArr = cleanText.trim().split(/\s+/).filter(w => w.length > 0 && /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/.test(w));
    const words = wordsArr.length;

    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    wordSpan.textContent = isEn ? `📝 ${words} words` : `📝 ${words} palabras`;
    charSpan.textContent = isEn ? `🔤 ${chars} chars` : `🔤 ${chars} caracteres`;
}

// =========================================================================
// PUNTO 4: HISTORIAL LOCAL DE VERSIONES / SNAPSHOTS
// =========================================================================
let selectedSnapshotObj = null;

function initVersionHistoryModal() {
    const btnOpen = document.getElementById('btnOpenVersionHistory');
    const btnClose = document.getElementById('btnCloseVersionHistory');
    const btnCreate = document.getElementById('btnCreateManualSnapshot');
    const btnRestore = document.getElementById('btnRestoreSnapshot');

    if (btnOpen) {
        btnOpen.onclick = () => openVersionHistoryModal();
    }
    if (btnClose) {
        btnClose.onclick = () => {
            const modal = document.getElementById('modalVersionHistory');
            if (modal) modal.classList.add('hidden');
        };
    }
    if (btnCreate) {
        btnCreate.onclick = async () => {
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            try {
                const res = await fetch('/api/project/snapshot', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        name: currentProject,
                        file: currentOpenFile || 'main.tex',
                        code: codeEditor.value,
                        label: isEn ? 'Manual snapshot 📸' : 'Copia manual 📸'
                    })
                });
                const data = await res.json();
                if (data.success) {
                    showToast(isEn ? 'Snapshot saved ✓' : 'Punto de restauración guardado ✓', 'success');
                    await loadVersionHistoryList();
                }
            } catch (e) {
                showToast(String(e), 'error');
            }
        };
    }
    if (btnRestore) {
        btnRestore.onclick = async () => {
            if (!selectedSnapshotObj || typeof selectedSnapshotObj.code !== 'string') return;
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            const confirmed = await showAppConfirm({
                title: isEn ? '⏪ Restore Version' : '⏪ Restaurar Versión',
                message: isEn
                    ? `Restore "${currentOpenFile || 'main.tex'}" to the version from ${new Date(selectedSnapshotObj.timestamp * 1000).toLocaleString()}?`
                    : `¿Deseas restaurar "${currentOpenFile || 'main.tex'}" a la versión del ${new Date(selectedSnapshotObj.timestamp * 1000).toLocaleString()}?`,
                confirmText: isEn ? 'Restore' : 'Restaurar',
                cancelText: isEn ? 'Cancel' : 'Cancelar',
                danger: false
            });
            if (!confirmed) return;

            codeEditor.value = selectedSnapshotObj.code;
            updateLineNumbers();
            triggerAutoSave();
            parseDocumentOutline(codeEditor.value);
            const modal = document.getElementById('modalVersionHistory');
            if (modal) modal.classList.add('hidden');
            showToast(isEn ? 'Version restored ✓' : 'Versión restaurada correctamente ✓', 'success');
        };
    }
}

async function openVersionHistoryModal() {
    const modal = document.getElementById('modalVersionHistory');
    const fileSpan = document.getElementById('historyModalFileName');
    if (!modal) return;
    if (fileSpan) fileSpan.textContent = currentOpenFile || 'main.tex';
    modal.classList.remove('hidden');
    await loadVersionHistoryList();
}

async function loadVersionHistoryList() {
    const listDiv = document.getElementById('historySnapshotsList');
    const previewArea = document.getElementById('historyPreviewCode');
    const previewHeader = document.getElementById('historyPreviewHeader');
    const btnRestore = document.getElementById('btnRestoreSnapshot');
    if (!listDiv) return;

    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    listDiv.innerHTML = `<div style="padding:14px; font-size:12px; color:var(--text-muted);">${isEn ? 'Loading versions...' : 'Cargando historial...'}</div>`;
    selectedSnapshotObj = null;
    if (previewArea) previewArea.value = '';
    if (btnRestore) btnRestore.classList.add('hidden');

    try {
        const res = await fetch(`/api/project/history?name=${encodeURIComponent(currentProject)}&file=${encodeURIComponent(currentOpenFile || 'main.tex')}`);
        const data = await res.json();
        const snaps = data.snapshots || [];

        if (snaps.length === 0) {
            listDiv.innerHTML = `
                <div style="padding:18px 12px; text-align:center; font-size:12px; color:var(--text-muted);">
                    ${isEn
                        ? 'No snapshots yet for this file. Compile (Ctrl+S) or click "Save snapshot now" above.'
                        : 'Aún no hay copias guardadas de este archivo. Compila el documento (Ctrl+S) o pulsa "📸 Guardar copia ahora".'}
                </div>
            `;
            return;
        }

        listDiv.innerHTML = '';
        snaps.forEach((s, idx) => {
            const card = document.createElement('div');
            card.className = 'history-snap-item' + (idx === 0 ? ' active' : '');
            const dateStr = s.timestamp ? new Date(s.timestamp * 1000).toLocaleString() : '';
            card.innerHTML = `
                <div style="font-size:12px; font-weight:600; color:var(--text-main); margin-bottom:2px;">${escapeHtml(s.label || 'Snapshot')}</div>
                <div style="font-size:11px; color:var(--fox-orange); font-family:monospace;">🕒 ${escapeHtml(dateStr)}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">📄 ${s.lines || 0} ${isEn ? 'lines' : 'líneas'} • ${s.chars || 0} chars</div>
            `;
            card.onclick = () => {
                listDiv.querySelectorAll('.history-snap-item').forEach(el => el.classList.remove('active'));
                card.classList.add('active');
                selectSnapshotItem(s.id, dateStr);
            };
            listDiv.appendChild(card);
        });

        // Previsualizar automáticamente la versión más reciente
        const firstDate = snaps[0].timestamp ? new Date(snaps[0].timestamp * 1000).toLocaleString() : '';
        await selectSnapshotItem(snaps[0].id, firstDate);
    } catch (e) {
        listDiv.innerHTML = `<div style="padding:12px; color:#ef4444; font-size:12px;">Error: ${escapeHtml(String(e))}</div>`;
    }
}

async function selectSnapshotItem(snapId, dateStr) {
    const previewArea = document.getElementById('historyPreviewCode');
    const previewHeader = document.getElementById('historyPreviewHeader');
    const btnRestore = document.getElementById('btnRestoreSnapshot');
    try {
        const res = await fetch(`/api/project/history_content?name=${encodeURIComponent(currentProject)}&id=${encodeURIComponent(snapId)}`);
        const data = await res.json();
        if (data.success && data.snapshot) {
            selectedSnapshotObj = data.snapshot;
            if (previewArea) previewArea.value = data.snapshot.code || '';
            if (previewHeader) previewHeader.textContent = `📌 ${data.snapshot.label || 'Snapshot'} — ${dateStr}`;
            if (btnRestore) btnRestore.classList.remove('hidden');
        }
    } catch (e) {
        console.warn('Error loading snapshot content:', e);
    }
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
            showToast(currentLanguage === 'en' ? 'Compile the document first (Ctrl+S) to generate SyncTeX data.' : 'Compila primero el documento (Ctrl+S) para generar los datos de sincronización SyncTeX.', 'info');
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


