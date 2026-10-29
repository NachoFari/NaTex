// =========================================================================
// NaTex Studio - Riot-Client-style Startup Splash Animation Controller
// =========================================================================

let splashTimers = [];

/**
 * Limpia los temporizadores pendientes de la animación de inicio
 */
function clearSplashTimers() {
    splashTimers.forEach(t => clearTimeout(t));
    splashTimers = [];
}

/**
 * Inicializa y ejecuta la pantalla de bienvenida animada estilo Riot Client
 * @param {boolean} [force=false] - Si es true, ignora sessionStorage y reproduce la animación
 */
function initSplashIntro(force = false) {
    const splashEl = document.getElementById('natexSplashIntro');
    if (!splashEl) return;

    const urlParams = new URLSearchParams(window.location.search);

    // Parámetro 'nosplash=1' apaga la animación completamente
    if (urlParams.get('nosplash') === '1') {
        splashEl.classList.add('hidden');
        splashEl.classList.remove('splash-closing');
        return;
    }

    // Si ya se mostró en esta sesión y no se fuerza explícitamente, ocultar de inmediato
    if (!force && sessionStorage.getItem('natex_splash_shown') === '1' && urlParams.get('splash') !== '1') {
        splashEl.classList.add('hidden');
        splashEl.classList.remove('splash-closing');
        return;
    }

    clearSplashTimers();

    // Marcar como mostrada en esta sesión de navegación
    sessionStorage.setItem('natex_splash_shown', '1');

    // Asegurar visibilidad
    splashEl.classList.remove('hidden', 'splash-closing');

    // Determinar idioma activo
    const isEn = (typeof currentLanguage !== 'undefined' && currentLanguage === 'en');

    // Determinar y aplicar tema activo sobre la mascota y píldora de tema
    const activeTheme = urlParams.get('theme') || 
                        localStorage.getItem('natex_theme') || 
                        (typeof currentTheme !== 'undefined' ? currentTheme : 'fox');

    if (typeof getThemeMeta === 'function') {
        const meta = getThemeMeta(activeTheme);
        if (meta) {
            const mascotEl = document.getElementById('splashMascotIcon');
            if (mascotEl && meta.svg) {
                mascotEl.innerHTML = meta.svg;
            }
        }
    }

    const brandSubEl = document.getElementById('splashBrandSub');
    if (brandSubEl) {
        brandSubEl.innerText = isEn ? 'Studio' : 'Estudio';
    }

    const progressFill = document.getElementById('splashProgressFill');

    // Re-disparar animaciones CSS si es una repetición
    if (force) {
        const mascotFrame = splashEl.querySelector('.splash-mascot-frame');
        if (mascotFrame) {
            mascotFrame.style.animation = 'none';
            void mascotFrame.offsetWidth;
            mascotFrame.style.animation = '';
        }
        const titleStack = splashEl.querySelector('.splash-title-stack');
        if (titleStack) {
            titleStack.style.animation = 'none';
            void titleStack.offsetWidth;
            titleStack.style.animation = '';
        }
        const loaderContainer = splashEl.querySelector('.splash-loader-container');
        if (loaderContainer) {
            loaderContainer.style.animation = 'none';
            void loaderContainer.offsetWidth;
            loaderContainer.style.animation = '';
        }
    }

    // Reiniciar barra de progreso a 0 antes de comenzar
    if (progressFill) {
        progressFill.style.transition = 'none';
        progressFill.style.width = '0%';
        void progressFill.offsetWidth;
        progressFill.style.transition = 'width 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
    }

    // Modo congelado para capturas y pruebas automatizadas ('splashHold=1')
    if (urlParams.get('splashHold') === '1') {
        if (progressFill) progressFill.style.width = '78%';
        return;
    }

    // Etapa 1 (0ms): 25%
    if (progressFill) progressFill.style.width = '25%';

    // Etapa 2 (550ms): 68%
    splashTimers.push(setTimeout(() => {
        if (progressFill) progressFill.style.width = '68%';
    }, 550));

    // Etapa 3 (1150ms): 100%
    splashTimers.push(setTimeout(() => {
        if (progressFill) progressFill.style.width = '100%';
    }, 1150));

    // Etapa 4 (1650ms): Transición de salida suave (.splash-closing)
    splashTimers.push(setTimeout(() => {
        splashEl.classList.add('splash-closing');
    }, 1650));

    // Etapa 5 (2100ms): Ocultar por completo (.hidden)
    splashTimers.push(setTimeout(() => {
        splashEl.classList.add('hidden');
        splashEl.classList.remove('splash-closing');
    }, 2100));
}

/**
 * Vuelve a reproducir la animación de inicio en cualquier momento
 */
function replaySplashIntro() {
    initSplashIntro(true);
}

// Exposición global
if (typeof window !== 'undefined') {
    window.initSplashIntro = initSplashIntro;
    window.replaySplashIntro = replaySplashIntro;
}
