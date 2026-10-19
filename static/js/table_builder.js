// Creador de Tablas (Cuadrícula Visual + booktabs)
function initTableBuilder() {
    const modal = document.getElementById('modalTableBuilder');
    const btnMenu = document.getElementById('menuItemTableBuilder');
    const btnQuick = document.getElementById('btnQuickTable');
    const btnClose = document.getElementById('btnCloseTableModal');
    const btnCancel = document.getElementById('btnCancelTableModal');
    const btnInsert = document.getElementById('btnInsertTableDoc');
    const btnCopy = document.getElementById('btnCopyTableCode');

    const inputRows = document.getElementById('tblRowsInput');
    const inputCols = document.getElementById('tblColsInput');
    const btnAddRow = document.getElementById('btnTblAddRow');
    const btnRemRow = document.getElementById('btnTblRemoveRow');
    const btnAddCol = document.getElementById('btnTblAddCol');
    const btnRemCol = document.getElementById('btnTblRemoveCol');
    const btnClear = document.getElementById('btnTblClear');

    const chkHeader = document.getElementById('tblChkHeader');
    const chkBooktabs = document.getElementById('tblChkBooktabs');
    const chkBorders = document.getElementById('tblChkBorders');
    const selAlign = document.getElementById('tblAlignSelect');
    const inputCaption = document.getElementById('tblCaptionInput');
    const inputLabel = document.getElementById('tblLabelInput');

    function openTableBuilder() {
        if (!modal) return;
        modal.classList.remove('hidden');
        renderTableGrid();
        updateTablePreview();
    }

    if (btnMenu) btnMenu.onclick = openTableBuilder;
    if (btnQuick) btnQuick.onclick = openTableBuilder;
    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
    if (btnCancel) btnCancel.onclick = () => modal.classList.add('hidden');

    window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 't' || e.key === 'T')) {
            e.preventDefault();
            openTableBuilder();
        }
    });

    if (inputRows) inputRows.onchange = () => resizeTable(parseInt(inputRows.value) || 3, tableGridState.cols);
    if (inputCols) inputCols.onchange = () => resizeTable(tableGridState.rows, parseInt(inputCols.value) || 3);

    if (btnAddRow) btnAddRow.onclick = () => resizeTable(tableGridState.rows + 1, tableGridState.cols);
    if (btnRemRow) btnRemRow.onclick = () => { if (tableGridState.rows > 1) resizeTable(tableGridState.rows - 1, tableGridState.cols); };
    if (btnAddCol) btnAddCol.onclick = () => resizeTable(tableGridState.rows, tableGridState.cols + 1);
    if (btnRemCol) btnRemCol.onclick = () => { if (tableGridState.cols > 1) resizeTable(tableGridState.rows, tableGridState.cols - 1); };

    if (btnClear) btnClear.onclick = () => {
        for (let r = 0; r < tableGridState.rows; r++) {
            for (let c = 0; c < tableGridState.cols; c++) {
                tableGridState.data[r][c] = '';
            }
        }
        renderTableGrid();
        updateTablePreview();
    };

    [chkHeader, chkBooktabs, chkBorders, selAlign, inputCaption, inputLabel].forEach(el => {
        if (el) el.oninput = updateTablePreview;
    });

    if (btnInsert) {
        btnInsert.onclick = () => {
            const code = generateLatexTable();
            ensureBooktabsPackage();
            insertAtCursor('\n' + code + '\n');
            modal.classList.add('hidden');
            triggerAutoSave();
            parseDocumentOutline(codeEditor.value);
        };
    }

    if (btnCopy) {
        btnCopy.onclick = () => {
            const code = generateLatexTable();
            fallbackCopyText(code);
            editorStatus.innerText = '¡Código de tabla copiado! ✓';
            editorStatus.style.color = '#10B981';
            setTimeout(() => { editorStatus.innerText = 'Guardado automático ✓'; }, 2000);
        };
    }
}

function resizeTable(newRows, newCols, keepValues = true) {
    newRows = Math.max(1, Math.min(50, newRows));
    newCols = Math.max(1, Math.min(25, newCols));

    const newData = [];
    for (let r = 0; r < newRows; r++) {
        const row = [];
        for (let c = 0; c < newCols; c++) {
            if (keepValues && tableGridState.data[r] && tableGridState.data[r][c] !== undefined) {
                row.push(tableGridState.data[r][c]);
            } else if (r === 0) {
                row.push(`Columna ${c + 1}`);
            } else {
                row.push(`Dato ${r},${c + 1}`);
            }
        }
        newData.push(row);
    }

    tableGridState.rows = newRows;
    tableGridState.cols = newCols;
    tableGridState.data = newData;

    const inputRows = document.getElementById('tblRowsInput');
    const inputCols = document.getElementById('tblColsInput');
    if (inputRows) inputRows.value = newRows;
    if (inputCols) inputCols.value = newCols;

    renderTableGrid();
    updateTablePreview();
}

function renderTableGrid() {
    const table = document.getElementById('excelGrid');
    if (!table) return;
    table.innerHTML = '';

    const rows = tableGridState.rows;
    const cols = tableGridState.cols;
    const hasHeader = document.getElementById('tblChkHeader')?.checked ?? true;

    // Fila de encabezado con letras de columna (A, B, C...)
    const colHeaderRow = document.createElement('tr');
    const cornerTh = document.createElement('th');
    cornerTh.className = 'grid-corner';
    colHeaderRow.appendChild(cornerTh);

    for (let c = 0; c < cols; c++) {
        const th = document.createElement('th');
        th.className = 'grid-col-header';
        th.innerText = String.fromCharCode(65 + (c % 26)) + (c >= 26 ? Math.floor(c / 26) : '');
        colHeaderRow.appendChild(th);
    }
    table.appendChild(colHeaderRow);

    // Filas con celdas editables
    for (let r = 0; r < rows; r++) {
        const tr = document.createElement('tr');

        // Número de fila (1, 2, 3...)
        const rowHeader = document.createElement('td');
        rowHeader.className = 'grid-row-header';
        rowHeader.innerText = r + 1;
        tr.appendChild(rowHeader);

        for (let c = 0; c < cols; c++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'excel-cell-input' + (r === 0 && hasHeader ? ' is-header-cell' : '');
            input.value = (tableGridState.data[r] && tableGridState.data[r][c]) || '';

            input.oninput = () => {
                tableGridState.data[r][c] = input.value;
                updateTablePreview();
            };

            input.onpaste = (e) => {
                handleCellPaste(e, r, c);
            };

            td.appendChild(input);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
}

function handleCellPaste(e, startR, startC) {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    const text = clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;

    e.preventDefault();
    const rows = text.trim().split(/\r\n|\n|\r/);
    const requiredRows = Math.max(tableGridState.rows, startR + rows.length);
    let requiredCols = tableGridState.cols;

    rows.forEach(r => {
        const cells = r.split('\t');
        requiredCols = Math.max(requiredCols, startC + cells.length);
    });

    resizeTable(requiredRows, requiredCols, true);

    rows.forEach((r, rIdx) => {
        const cells = r.split('\t');
        cells.forEach((val, cIdx) => {
            const tr = startR + rIdx;
            const tc = startC + cIdx;
            if (tr < tableGridState.rows && tc < tableGridState.cols) {
                tableGridState.data[tr][tc] = val.trim();
            }
        });
    });

    renderTableGrid();
    updateTablePreview();
}

function updateTablePreview() {
    const pre = document.getElementById('tblCodePreview');
    if (pre) {
        pre.innerText = generateLatexTable();
    }
}

function generateLatexTable() {
    const rows = tableGridState.rows;
    const cols = tableGridState.cols;
    const hasHeader = document.getElementById('tblChkHeader')?.checked ?? true;
    const useBooktabs = document.getElementById('tblChkBooktabs')?.checked ?? true;
    const hasBorders = document.getElementById('tblChkBorders')?.checked ?? false;
    const align = document.getElementById('tblAlignSelect')?.value || 'c';
    const caption = document.getElementById('tblCaptionInput')?.value?.trim() || 'Título de la Tabla';
    const label = document.getElementById('tblLabelInput')?.value?.trim() || 'tab:resultados';

    let colSpec = '';
    if (hasBorders) {
        colSpec = '|' + Array(cols).fill(align).join('|') + '|';
    } else {
        colSpec = Array(cols).fill(align).join('');
    }

    let out = '\\begin{table}[htbp]\n';
    out += '  \\centering\n';
    out += `  \\caption{${caption}}\n`;
    out += `  \\label{${label}}\n`;
    out += `  \\begin{tabular}{${colSpec}}\n`;

    if (useBooktabs) {
        out += '    \\toprule\n';
    } else if (hasBorders) {
        out += '    \\hline\n';
    }

    for (let r = 0; r < rows; r++) {
        let rowCells = [];
        for (let c = 0; c < cols; c++) {
            let val = (tableGridState.data[r] && tableGridState.data[r][c]) || '';
            val = val.replace(/([&%$#_{}])/g, '\\$1');
            if (r === 0 && hasHeader) {
                rowCells.push(`\\textbf{${val}}`);
            } else {
                rowCells.push(val);
            }
        }
        out += '    ' + rowCells.join(' & ') + ' \\\\\n';

        if (r === 0 && hasHeader) {
            if (useBooktabs) out += '    \\midrule\n';
            else if (hasBorders) out += '    \\hline\n';
        } else if (hasBorders && r < rows - 1) {
            out += '    \\hline\n';
        }
    }

    if (useBooktabs) {
        out += '    \\bottomrule\n';
    } else if (hasBorders) {
        out += '    \\hline\n';
    }

    out += '  \\end{tabular}\n';
    out += '\\end{table}';
    return out;
}

window.insertImageCode = function(filename) {
    // 1. Asegurar que \usepackage{graphicx} esté en el preámbulo
    ensureGraphicxPackage();

    // 2. Limpiar nombre para la etiqueta label
    const labelClean = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

    // 3. Generar el entorno figure completo
    const snippet = `\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.7\\linewidth]{${filename}}\n  \\caption{Descripción de la figura}\n  \\label{fig:${labelClean}}\n\\end{figure}\n`;
    
    // 4. Insertar en la posición actual del cursor o al final
    const start = codeEditor.selectionStart !== undefined ? codeEditor.selectionStart : codeEditor.value.length;
    const end = codeEditor.selectionEnd !== undefined ? codeEditor.selectionEnd : start;

    codeEditor.value = codeEditor.value.substring(0, start) + snippet + codeEditor.value.substring(end);
    codeEditor.selectionStart = codeEditor.selectionEnd = start + snippet.length;
    codeEditor.focus();

    updateLineNumbers();
    triggerAutoSave();

    // Feedback visual amigable
    editorStatus.innerText = `¡Figura "${filename}" insertada! ✓`;
    editorStatus.style.color = '#FF6B35';
    setTimeout(() => {
        editorStatus.innerText = 'Guardado automático ✓';
        editorStatus.style.color = '#10B981';
    }, 2500);

    const mUpload = document.getElementById('modalUpload');
    if (mUpload) mUpload.classList.add('hidden');
};

