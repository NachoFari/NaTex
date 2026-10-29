// NaTex Studio - Updater Module
function isStrictlyNewerVersion(latestTag, installedTag = 'v1.0') {
    const parseParts = (str) => String(str || '').replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const l = parseParts(latestTag);
    const c = parseParts(installedTag);
    const len = Math.max(l.length, c.length);
    for (let i = 0; i < len; i++) {
        const lv = l[i] || 0;
        const cv = c[i] || 0;
        if (lv > cv) return true;
        if (lv < cv) return false;
    }
    return false;
}

function isNewerVersion(latestTag, installedTag = 'v1.0') {
    return isStrictlyNewerVersion(latestTag, installedTag);
}

async function checkForUpdates(manual = false) {
    const btnCheck = document.getElementById('btnCheckUpdates');
    const resultBox = document.getElementById('updateResultBox');
    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';

    if (manual && btnCheck && resultBox) {
        btnCheck.disabled = true;
        btnCheck.innerText = isEn ? '⏳ Checking...' : '⏳ Comprobando...';
        resultBox.classList.remove('hidden');
        resultBox.style.display = 'block';
        resultBox.innerHTML = `<span style="color:var(--text-muted);">${isEn ? 'Connecting to GitHub...' : 'Conectando con GitHub...'}</span>`;
    }

    try {
        const res = await fetch('/api/system/check_update');
        const data = await res.json();

        if (manual && btnCheck) {
            btnCheck.disabled = false;
            btnCheck.innerText = isEn ? '🔍 Check for Updates' : '🔍 Comprobar Actualizaciones';
        }

        if (!data.success) {
            if (manual && resultBox) {
                resultBox.innerHTML = `<div style="color:#EF4444;">⚠️ ${data.error || (isEn ? 'Could not connect to GitHub.' : 'No se pudo conectar con GitHub.')}</div>`;
            }
            return data;
        }

        const reallyHasUpdate = Boolean(data.has_update && isNewerVersion(data.latest_version, 'v1.0'));

        if (reallyHasUpdate) {
            if (manual && resultBox) {
                let html = `
                    <div style="color:#10B981; font-weight:600; margin-bottom:6px;">
                        🎉 ${isEn ? 'New version available:' : '¡Nueva versión disponible:'} ${typeof escapeHtml === 'function' ? escapeHtml(data.latest_version) : data.latest_version}
                    </div>
                `;
                if (data.release_name) {
                    html += `<div style="font-size:12px; margin-bottom:8px; color:var(--text-main);">${typeof escapeHtml === 'function' ? escapeHtml(data.release_name) : data.release_name}</div>`;
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
                showUpdateBanner(data);
            }
        } else if (manual && resultBox) {
            resultBox.innerHTML = `
                <div style="color:#10B981; display:flex; align-items:center; gap:6px;">
                    <span>✅</span>
                    <span>${isEn ? 'You have the latest version (v1.0).' : '¡Tienes la versión más reciente (v1.0)!'}</span>
                </div>
            `;
        }
        return data;
    } catch (e) {
        if (manual && btnCheck) {
            btnCheck.disabled = false;
            btnCheck.innerText = isEn ? '🔍 Check for Updates' : '🔍 Comprobar Actualizaciones';
        }
        if (manual && resultBox) {
            resultBox.innerHTML = `<div style="color:#EF4444;">⚠️ Error: ${e.message}</div>`;
        }
        return { success: false, error: e.message };
    }
}

function initUpdateChecker() {
    const btnCheck = document.getElementById('btnCheckUpdates');
    if (btnCheck) {
        btnCheck.onclick = () => checkForUpdates(true);
    }

    // Verificación automática en segundo plano al arrancar si está activada
    setTimeout(async () => {
        try {
            const isAuto = localStorage.getItem('natex_auto_update') !== 'false';
            if (!isAuto) return;
            const res = await fetch('/api/system/check_update');
            const data = await res.json();
            if (data.success && data.has_update && isNewerVersion(data.latest_version, 'v1.0')) {
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

    const isEn = typeof currentLanguage !== 'undefined' && currentLanguage === 'en';
    const ver = data.latest_version || 'v1.0';
    const escapedVer = typeof escapeHtml === 'function' ? escapeHtml(ver) : ver;
    if (bannerText) {
        bannerText.innerHTML = isEn 
            ? `🚀 <strong>New version available (${escapedVer})!</strong> Update NaTex to get the latest features.`
            : `🚀 <strong>¡Nueva versión disponible (${escapedVer})!</strong> Actualiza NaTex para obtener las últimas novedades.`;
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

window.isStrictlyNewerVersion = isStrictlyNewerVersion;
window.isNewerVersion = isNewerVersion;
window.checkForUpdates = checkForUpdates;
window.initUpdateChecker = initUpdateChecker;
window.showUpdateBanner = showUpdateBanner;
