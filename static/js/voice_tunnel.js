// NaTex Studio - Voice Dictation & P2P Tunnel Collaboration Module

let consecutiveHeartbeatFailures = 0;
let isHostDisconnectedAlertShown = false;
let isRetryingConnection = false;
let shareQrInstance = null;
let voiceQrInstance = null;

function showHostDisconnectedModal() {
    if (isHostDisconnectedAlertShown) return;
    isHostDisconnectedAlertShown = true;

    const modal = document.getElementById('modalHostDisconnected');
    const banner = document.getElementById('bannerHostDisconnected');
    if (banner) banner.classList.remove('hidden');
    if (!modal) return;

    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const titleEl = document.getElementById('hostDisconnectedTitle');
    const subtitleEl = document.getElementById('hostDisconnectedSubtitle');
    const descEl = document.getElementById('hostDisconnectedDesc');
    const lblCopy = document.getElementById('lblCopyOfflineCode');
    const lblDownload = document.getElementById('lblDownloadOfflineTex');
    const lblRetry = document.getElementById('lblRetryHostConnection');
    const statusMsg = document.getElementById('hostDisconnectedStatusMsg');
    const bannerText = document.getElementById('bannerHostDisconnectedText');

    if (titleEl) titleEl.innerText = isEn ? 'Session ended by host' : 'Sesión finalizada por el anfitrión';
    if (subtitleEl) subtitleEl.innerText = isEn ? 'The host closed NaTex or connection was lost.' : 'El host de NaTex cerró la aplicación o se perdió la conexión.';
    if (descEl) descEl.innerText = isEn 
        ? 'The host has closed NaTex Studio or the Cloudflare link has expired. Your current session was disconnected from the server. Don\'t worry: you can copy or download your current code so no work is lost.'
        : 'El anfitrión ha cerrado NaTex Studio o el enlace de Cloudflare ha expirado. Tu sesión actual ha quedado desconectada del servidor. No te preocupes: puedes copiar o descargar tu código actual para no perder tus cambios.';
    if (lblCopy) lblCopy.innerText = isEn ? 'Copy my code' : 'Copiar mi código';
    if (lblDownload) lblDownload.innerText = isEn ? 'Download .tex' : 'Descargar .tex';
    if (lblRetry) lblRetry.innerText = isEn ? 'Retry connection' : 'Reintentar conexión';
    if (statusMsg) {
        statusMsg.innerHTML = '<span class="offline-dot" style="width:8px; height:8px; border-radius:50%; background:var(--error, #ef4444); display:inline-block;"></span> ' + (isEn ? 'Disconnected' : 'Desconectado');
    }
    if (bannerText) {
        bannerText.innerHTML = isEn 
            ? '<strong>Disconnected from host:</strong> NaTex Studio was closed by the host. Local edits cannot be saved.'
            : '<strong>Desconectado del anfitrión:</strong> NaTex Studio fue cerrado por el host. Tus cambios locales no se guardarán en el servidor.';
    }

    if (typeof editorStatus !== 'undefined' && editorStatus) {
        editorStatus.innerText = isEn ? '⚠️ Disconnected from host' : '⚠️ Desconectado del anfitrión';
        editorStatus.style.color = '#ef4444';
    }

    modal.classList.remove('hidden');

    const copyCodeAction = async () => {
        const code = (typeof codeEditor !== 'undefined' && codeEditor) ? codeEditor.value : '';
        try {
            await navigator.clipboard.writeText(code);
            if (typeof showToast === 'function') {
                showToast(isEn ? 'Code copied to clipboard! ✓' : '¡Código copiado al portapapeles! ✓', 'success');
            }
        } catch (_) {
            if (typeof fallbackCopyText === 'function') {
                fallbackCopyText(code);
                if (typeof showToast === 'function') {
                    showToast(isEn ? 'Code copied to clipboard! ✓' : '¡Código copiado al portapapeles! ✓', 'success');
                }
            }
        }
    };

    const downloadTexAction = () => {
        const code = (typeof codeEditor !== 'undefined' && codeEditor) ? codeEditor.value : '';
        const filename = (typeof currentOpenFile !== 'undefined' && currentOpenFile) ? currentOpenFile.split('/').pop() : 'documento.tex';
        const blob = new Blob([code], { type: 'text/x-tex;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') {
            showToast(isEn ? `Saved ${filename} to your computer! ✓` : `¡${filename} descargado a tu equipo! ✓`, 'success');
        }
    };

    const btnCopy = document.getElementById('btnCopyOfflineCode');
    if (btnCopy) btnCopy.onclick = copyCodeAction;

    const btnDownload = document.getElementById('btnDownloadOfflineTex');
    if (btnDownload) btnDownload.onclick = downloadTexAction;

    const btnRetry = document.getElementById('btnRetryHostConnection');
    if (btnRetry) btnRetry.onclick = () => retryHostConnection();

    const btnDismiss = document.getElementById('btnDismissHostDisconnectedModal');
    if (btnDismiss) {
        btnDismiss.onclick = () => {
            modal.classList.add('hidden');
        };
    }

    const btnBannerCopy = document.getElementById('btnBannerCopyCode');
    if (btnBannerCopy) btnBannerCopy.onclick = copyCodeAction;

    const btnBannerShow = document.getElementById('btnBannerShowModal');
    if (btnBannerShow) {
        btnBannerShow.onclick = () => {
            modal.classList.remove('hidden');
        };
    }
}

function hideHostDisconnectedModal() {
    isHostDisconnectedAlertShown = false;
    const modal = document.getElementById('modalHostDisconnected');
    if (modal) modal.classList.add('hidden');
    const banner = document.getElementById('bannerHostDisconnected');
    if (banner) banner.classList.add('hidden');

    if (typeof editorStatus !== 'undefined' && editorStatus) {
        const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
        editorStatus.innerText = isEn ? 'Connected to host ✓' : 'Conectado al anfitrión ✓';
        editorStatus.style.color = '#10B981';
        setTimeout(() => {
            editorStatus.innerText = isEn ? 'Auto saved ✓' : 'Guardado automático ✓';
        }, 2500);
    }
}

async function retryHostConnection() {
    if (isRetryingConnection) return;
    isRetryingConnection = true;
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const statusMsg = document.getElementById('hostDisconnectedStatusMsg');
    const btnRetry = document.getElementById('btnRetryHostConnection');
    if (statusMsg) {
        statusMsg.innerHTML = '<span class="offline-dot" style="width:8px; height:8px; border-radius:50%; background:var(--fox-orange); display:inline-block;"></span> ' + (isEn ? 'Connecting...' : 'Comprobando conexión...');
    }
    if (btnRetry) {
        btnRetry.disabled = true;
        btnRetry.style.opacity = '0.6';
    }

    try {
        const res = await fetch('/api/system/heartbeat', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json().catch(() => null);
            if (data && data.status === 'alive') {
                consecutiveHeartbeatFailures = 0;
                hideHostDisconnectedModal();
                if (typeof showToast === 'function') {
                    showToast(isEn ? 'Reconnected to host successfully! ✓' : '¡Reconectado con el anfitrión con éxito! ✓', 'success');
                }
                if (typeof loadProjectCode === 'function' && typeof currentProject !== 'undefined') {
                    loadProjectCode(currentProject, typeof currentOpenFile !== 'undefined' ? currentOpenFile : 'main.tex');
                }
                return;
            }
        }
        if (typeof showToast === 'function') {
            showToast(isEn ? 'Host is still offline or unavailable' : 'El anfitrión sigue sin estar disponible', 'error');
        }
    } catch (_) {
        if (typeof showToast === 'function') {
            showToast(isEn ? 'Host is still offline or unavailable' : 'El anfitrión sigue sin estar disponible', 'error');
        }
    } finally {
        isRetryingConnection = false;
        if (btnRetry) {
            btnRetry.disabled = false;
            btnRetry.style.opacity = '1';
        }
        if (statusMsg && isHostDisconnectedAlertShown) {
            statusMsg.innerHTML = '<span class="offline-dot" style="width:8px; height:8px; border-radius:50%; background:var(--error, #ef4444); display:inline-block;"></span> ' + (isEn ? 'Disconnected' : 'Desconectado');
        }
    }
}

function handleHeartbeatFailure() {
    consecutiveHeartbeatFailures++;
    const isCloudflare = window.location.hostname.includes('trycloudflare.com');
    const isExternal = isCloudflare || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

    if (isExternal && consecutiveHeartbeatFailures >= 2) {
        showHostDisconnectedModal();
    }
}

function initHeartbeat() {
    const isCloudflare = window.location.hostname.includes('trycloudflare.com');
    const isExternal = isCloudflare || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

    setInterval(() => {
        fetch('/api/system/heartbeat', { cache: 'no-store' })
            .then(async (res) => {
                if (!res.ok) {
                    handleHeartbeatFailure();
                    return;
                }
                const data = await res.json().catch(() => null);
                if (isExternal && data && data.status === 'shutting_down') {
                    consecutiveHeartbeatFailures = 2;
                    showHostDisconnectedModal();
                    return;
                }
                if (consecutiveHeartbeatFailures > 0) {
                    consecutiveHeartbeatFailures = 0;
                }
                if (isHostDisconnectedAlertShown) {
                    hideHostDisconnectedModal();
                }
            })
            .catch(() => {
                handleHeartbeatFailure();
            });
    }, 2500);

    window.addEventListener('beforeunload', () => {
        try {
            if (!isExternal) {
                if (navigator.sendBeacon) {
                    navigator.sendBeacon('/api/system/goodbye');
                } else {
                    fetch('/api/system/goodbye', { method: 'POST', keepalive: true }).catch(() => {});
                }
            }
        } catch (_) {}
    });
}

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
                    if (typeof showToast === 'function') {
                        showToast('No se pudo iniciar el túnel: ' + (data.error || 'Verifica cloudflared en tools/'), 'error');
                    }
                    btnToggleVoiceTunnel.textContent = '🚀 Reintentar Túnel';
                }
            } catch (e) {
                if (typeof showToast === 'function') {
                    showToast('Error al activar túnel: ' + e, 'error');
                }
                btnToggleVoiceTunnel.textContent = '🚀 Reintentar Túnel';
            } finally {
                btnToggleVoiceTunnel.disabled = false;
            }
        };
    }

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
            const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
            btnRestart.innerHTML = '⏳ ' + (isEn ? 'Restarting...' : 'Reiniciando...');
            const loading = document.getElementById('shareLoading');
            const ready = document.getElementById('shareReady');
            if (loading) {
                loading.classList.remove('hidden');
                loading.innerHTML = `<div style="font-size:28px; margin-bottom:8px;">⏳</div><p>${isEn ? 'Generating new secure link...' : 'Generando nuevo enlace seguro...'}</p>`;
            }
            if (ready) ready.classList.add('hidden');

            try {
                const targetProject = typeof currentProject !== 'undefined' ? currentProject : '';
                const res = await fetch(`/api/tunnel/restart?project=${encodeURIComponent(targetProject)}`);
                const data = await res.json();
                btnRestart.disabled = false;
                btnRestart.innerHTML = originalHtml;
                if (data.success && data.url) {
                    if (loading) loading.classList.add('hidden');
                    if (ready) ready.classList.remove('hidden');
                    const projectLink = `${data.url}/?p=${encodeURIComponent(targetProject)}`;
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
        const targetProject = typeof currentProject !== 'undefined' ? currentProject : '';
        const res = await fetch(`/api/tunnel/start?project=${encodeURIComponent(targetProject)}`);
        const data = await res.json();
        if (data.success && data.url) {
            if (loading) loading.classList.add('hidden');
            if (ready) ready.classList.remove('hidden');
            const projectLink = `${data.url}/?p=${encodeURIComponent(targetProject)}`;
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

function initShareTunnel() {
    return openShareModal();
}

window.consecutiveHeartbeatFailures = consecutiveHeartbeatFailures;
window.isHostDisconnectedAlertShown = isHostDisconnectedAlertShown;
window.showHostDisconnectedModal = showHostDisconnectedModal;
window.hideHostDisconnectedModal = hideHostDisconnectedModal;
window.retryHostConnection = retryHostConnection;
window.handleHeartbeatFailure = handleHeartbeatFailure;
window.initHeartbeat = initHeartbeat;
window.initVoiceDictate = initVoiceDictate;
window.openVoiceDictateModal = openVoiceDictateModal;
window.openShareModal = openShareModal;
window.initShareTunnel = initShareTunnel;
