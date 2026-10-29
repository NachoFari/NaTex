// NaTex Studio - AI Assistant Module

const AI_PROVIDERS_META = {
    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        panelId: 'aiPanelGemini',
        badge: 'Gemini',
        icon: '🤖',
        defaultModel: 'gemini-1.5-flash'
    },
    openai: {
        id: 'openai',
        name: 'OpenAI (ChatGPT)',
        panelId: 'aiPanelOpenai',
        badge: 'OpenAI',
        icon: '🟢',
        defaultModel: 'gpt-4o-mini'
    },
    claude: {
        id: 'claude',
        name: 'Anthropic Claude',
        panelId: 'aiPanelClaude',
        badge: 'Claude',
        icon: '🟣',
        defaultModel: 'claude-3-5-sonnet'
    },
    nvidia: {
        id: 'nvidia',
        name: 'NVIDIA NIM',
        panelId: 'aiPanelNvidia',
        badge: 'NVIDIA NIM',
        icon: '⚡',
        defaultModel: 'meta/llama-3.1-70b-instruct'
    },
    custom: {
        id: 'custom',
        name: 'Local / Custom AI',
        panelId: 'aiPanelCustom',
        badge: 'Local / Custom',
        icon: '💻',
        defaultModel: 'llama3'
    }
};

function updateAiBadge(provider) {
    const badge = document.getElementById('aiActiveProviderBadge');
    if (!badge) return;
    const meta = AI_PROVIDERS_META[provider];
    badge.textContent = meta ? meta.badge : (provider || 'IA');
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

    const warningBanner = document.getElementById('aiVoiceWarningBanner');
    if (warningBanner) {
        if (provider === 'gemini') {
            warningBanner.style.background = 'rgba(16, 185, 129, 0.12)';
            warningBanner.style.borderLeft = '3px solid var(--success, #10B981)';
            warningBanner.innerHTML = `
                <strong style="color: var(--success, #10B981); display: block; margin-bottom: 4px;">✨ Compatible con todas las funciones</strong>
                <span style="color: var(--text-main);">Google Gemini está habilitado tanto para el <strong>Copiloto de LaTeX</strong> (chat, fórmulas, errores) como para el <strong>Dictáfono de Clases a PDF</strong>.</span>
            `;
        } else {
            warningBanner.style.background = 'rgba(255, 170, 0, 0.12)';
            warningBanner.style.borderLeft = '3px solid var(--fox-orange, #ffaa00)';
            warningBanner.innerHTML = `
                <strong style="color: var(--fox-orange, #ffaa00); display: block; margin-bottom: 4px;">🎙️ Dictáfono solo disponible con la API de Gemini</strong>
                <span style="color: var(--text-main);">La transcripción de audio a LaTeX y PDF requiere la API de Google Gemini (procesamiento directo de audio). Puedes obtener tu clave gratuita en <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--fox-orange); text-decoration:underline; font-weight:700;">Google AI Studio</a>.<br><span style="margin-top:4px; display:inline-block; color:var(--text-muted);">Para el <strong>Asistente Copiloto de LaTeX</strong> (chat, generación de fórmulas y corrección de errores), este proveedor funcionará al 100%.</span></span>
            `;
        }
    }
}

function getThemeMascotHtml() {
    if (typeof getThemeMeta === 'function' && typeof currentTheme !== 'undefined') {
        const meta = getThemeMeta(currentTheme);
        if (meta && meta.svg) {
            return `<span class="theme-mascot-icon" style="width:18px;height:18px;margin-right:6px;vertical-align:middle;">${meta.svg}</span>`;
        }
    }
    return `<span class="theme-mascot-icon" style="width:18px;height:18px;margin-right:6px;vertical-align:middle;">🦊</span>`;
}

function insertCodeIntoEditor(code) {
    if (typeof editorInsertAtCursor === 'function') {
        editorInsertAtCursor(code);
    } else if (typeof insertAtCursor === 'function') {
        insertAtCursor(code);
    } else {
        const editor = document.getElementById('codeEditor');
        if (editor) {
            const start = editor.selectionStart !== undefined ? editor.selectionStart : editor.value.length;
            const end = editor.selectionEnd !== undefined ? editor.selectionEnd : start;
            editor.value = editor.value.substring(0, start) + code + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + code.length;
            editor.focus();
            if (typeof updateLineNumbers === 'function') updateLineNumbers();
            if (typeof triggerAutoSave === 'function') triggerAutoSave();
        }
    }
}

function renderAiFormattedText(rawText) {
    if (!rawText) return '';
    const codeBlockRegex = /```([a-zA-Z0-9_\-]+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let html = '';
    let match;

    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const copyLabel = isEn ? 'Copy' : 'Copiar';
    const insertLabel = isEn ? 'Insert' : 'Insertar en Editor';

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
        const textBefore = rawText.substring(lastIndex, match.index);
        const escapedText = typeof escapeHtml === 'function' ? escapeHtml(textBefore) : textBefore;
        html += escapedText.replace(/\n/g, '<br>');

        const lang = match[1] || 'latex';
        const code = match[2];
        const encodedCode = encodeURIComponent(code);
        const escapedCode = typeof escapeHtml === 'function' ? escapeHtml(code) : code;

        html += `
            <div class="ai-code-block" style="background:rgba(0,0,0,0.35); border:1px solid var(--border-color); border-radius:8px; margin:8px 0; overflow:hidden;">
                <div style="background:rgba(255,255,255,0.05); padding:4px 10px; display:flex; justify-content:space-between; align-items:center; font-size:11px; border-bottom:1px solid var(--border-color); color:var(--text-muted);">
                    <span style="font-family:monospace; font-weight:600; text-transform:uppercase;">${lang}</span>
                    <div style="display:flex; gap:6px;">
                        <button type="button" class="btn-ai-code-copy" data-code="${encodedCode}" style="background:rgba(255,255,255,0.08); border:1px solid var(--border-color); color:var(--text-main); font-size:11px; padding:2px 7px; border-radius:4px; cursor:pointer;">📋 ${copyLabel}</button>
                        <button type="button" class="btn-ai-code-insert" data-code="${encodedCode}" style="background:var(--fox-orange); color:#fff; border:none; font-size:11px; padding:2px 8px; border-radius:4px; cursor:pointer;">📥 ${insertLabel}</button>
                    </div>
                </div>
                <pre style="margin:0; padding:10px 12px; font-family:'JetBrains Mono','Fira Code',monospace; font-size:12px; line-height:1.45; overflow-x:auto; white-space:pre-wrap; color:#e2e8f0;">${escapedCode}</pre>
            </div>
        `;
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < rawText.length) {
        const textRemaining = rawText.substring(lastIndex);
        const escapedRemaining = typeof escapeHtml === 'function' ? escapeHtml(textRemaining) : textRemaining;
        html += escapedRemaining.replace(/\n/g, '<br>');
    }

    return html;
}

function appendChatMessage(sender, text, isHtml = false) {
    const container = document.getElementById('aiMessages');
    if (!container) return null;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-msg`;

    let contentHtml = '';
    if (isHtml) {
        contentHtml = text;
    } else if (sender === 'ai') {
        contentHtml = renderAiFormattedText(text);
    } else {
        contentHtml = typeof escapeHtml === 'function' ? escapeHtml(text) : text;
    }

    msgDiv.innerHTML = `<div class="msg-bubble">${contentHtml}</div>`;

    // Attach copy and insert button listeners
    msgDiv.querySelectorAll('.btn-ai-code-copy').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const code = decodeURIComponent(btn.getAttribute('data-code') || '');
            if (typeof fallbackCopyText === 'function') {
                fallbackCopyText(code);
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(code);
            }
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            const orig = btn.innerText;
            btn.innerText = '✓ ' + (isEn ? 'Copied' : 'Copiado');
            setTimeout(() => { btn.innerText = orig; }, 2000);
            if (typeof showToast === 'function') {
                showToast(isEn ? 'Code copied! ✓' : '¡Código copiado! ✓', 'success');
            }
        };
    });

    msgDiv.querySelectorAll('.btn-ai-code-insert').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const code = decodeURIComponent(btn.getAttribute('data-code') || '');
            insertCodeIntoEditor(code);
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            const orig = btn.innerText;
            btn.innerText = '✓ ' + (isEn ? 'Inserted' : 'Insertado');
            setTimeout(() => { btn.innerText = orig; }, 2000);
            if (typeof showToast === 'function') {
                showToast(isEn ? 'Code inserted into editor! ✓' : '¡Código insertado en el editor! ✓', 'success');
            }
        };
    });

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    return msgDiv;
}

async function sendAIMessage(promptText) {
    const input = document.getElementById('aiInput');
    const msg = promptText || (input ? input.value.trim() : '');
    if (!msg) return;

    if (!promptText && input) input.value = '';

    appendChatMessage('user', msg);

    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const mascotSvg = (typeof getThemeMeta === 'function' && typeof currentTheme !== 'undefined' && getThemeMeta(currentTheme))
        ? getThemeMeta(currentTheme).svg
        : '🦊';
    const mascotHtml = `<span class="theme-mascot-icon" style="width:18px;height:18px;margin-right:6px;vertical-align:middle;">${mascotSvg}</span>`;
    const thinkingText = isEn ? 'NaTex is thinking...' : 'NaTex está pensando...';
    const typingMsg = appendChatMessage('ai', `${mascotHtml} ${thinkingText}`, true);

    try {
        const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({prompt: msg})
        });
        const data = await res.json();
        if (typingMsg) typingMsg.remove();

        if (data.success) {
            if (data.provider) updateAiBadge(data.provider);
            appendChatMessage('ai', data.response);
        } else {
            appendChatMessage('ai', `⚠️ ${data.error || (isEn ? 'Could not connect to AI provider. Check Settings.' : 'No se pudo conectar con el proveedor de IA. Revisa tu configuración en Ajustes.')}`);
        }
    } catch (err) {
        if (typingMsg) typingMsg.remove();
        appendChatMessage('ai', (isEn ? 'Network error: ' : 'Error de red: ') + err.message);
    }
}

function initAiAssistant() {
    const aiDrawer = document.getElementById('aiDrawer');
    const btnToggleAI = document.getElementById('btnToggleAI');
    const btnCloseAI = document.getElementById('btnCloseAI');
    const btnSendAI = document.getElementById('btnSendAI');
    const aiInput = document.getElementById('aiInput');
    const btnAskError = document.getElementById('btnAskGeminiError');

    if (btnToggleAI && aiDrawer) {
        btnToggleAI.onclick = () => aiDrawer.classList.toggle('hidden');
    }
    if (btnCloseAI && aiDrawer) {
        btnCloseAI.onclick = () => aiDrawer.classList.add('hidden');
    }
    if (btnSendAI) {
        btnSendAI.onclick = () => sendAIMessage();
    }
    if (aiInput) {
        aiInput.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
            }
        };
    }

    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.onclick = () => {
            const prompt = btn.getAttribute('data-prompt');
            sendAIMessage(prompt);
        };
    });

    if (btnAskError) {
        btnAskError.onclick = () => {
            if (aiDrawer) aiDrawer.classList.remove('hidden');
            const errorLog = document.getElementById('errorLog');
            const err = errorLog ? errorLog.innerText : '';
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            if (isEn) {
                sendAIMessage(`Here is the LaTeX compilation error I received:\n${err}\n\nPlease explain what it means and how I can fix it in my code.`);
            } else {
                sendAIMessage(`Este es el error de compilación de LaTeX que obtuve:\n${err}\n\nExplícame en español qué significa y cómo lo soluciono en mi código.`);
            }
        };
    }
}

window.AI_PROVIDERS_META = AI_PROVIDERS_META;
window.updateAiBadge = updateAiBadge;
window.updateAiProviderPanels = updateAiProviderPanels;
window.sendAIMessage = sendAIMessage;
window.appendChatMessage = appendChatMessage;
window.insertCodeIntoEditor = insertCodeIntoEditor;
window.initAiAssistant = initAiAssistant;
