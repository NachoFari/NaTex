# -*- coding: utf-8 -*-
"""Version check and GitHub update manager."""

import os
import re
import json
import subprocess
import urllib.request
from core.constants import BASE_DIR, APP_VERSION, GITHUB_REPO, NO_WINDOW_FLAG, urlopen_with_ssl_fallback

def check_github_update():
    """Consulta la API de GitHub Releases para comprobar si existe una versión más reciente."""
    is_git = os.path.exists(os.path.join(BASE_DIR, '.git'))
    try:
        req = urllib.request.Request(
            f'https://api.github.com/repos/{GITHUB_REPO}/releases/latest',
            headers={'User-Agent': 'NaTex-Studio'}
        )
        with urlopen_with_ssl_fallback(req, timeout=8) as resp:
            rel_data = json.loads(resp.read().decode('utf-8'))
            tag = rel_data.get('tag_name', '').lstrip('v').lstrip('.')
            has_update = False
            try:
                v_latest = [int(x) for x in re.findall(r'\d+', tag)]
                v_current = [int(x) for x in re.findall(r'\d+', APP_VERSION)]
                if v_latest > v_current:
                    has_update = True
            except Exception:
                if tag and tag != APP_VERSION:
                    has_update = True

            return {
                'success': True,
                'current_version': f'v{APP_VERSION}',
                'latest_version': rel_data.get('tag_name', f'v{APP_VERSION}'),
                'has_update': has_update,
                'release_name': rel_data.get('name', ''),
                'release_notes': rel_data.get('body', ''),
                'download_url': f'https://github.com/{GITHUB_REPO}/releases/latest/download/NaTex.exe',
                'releases_page': f'https://github.com/{GITHUB_REPO}/releases',
                'is_git_repo': is_git
            }
    except Exception as e:
        return {
            'success': False,
            'error': f'No se pudo conectar con GitHub: {str(e)}',
            'current_version': f'v{APP_VERSION}',
            'is_git_repo': is_git
        }

def apply_git_update():
    """Aplica la última actualización mediante git pull si el directorio es un repositorio Git."""
    if not os.path.exists(os.path.join(BASE_DIR, '.git')):
        return False, 'Esta instalación no utiliza Git. Puedes descargar la nueva versión desde el botón de descarga.'
    try:
        res = subprocess.run(
            ['git', 'pull', 'origin', 'main'],
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            timeout=30,
            creationflags=NO_WINDOW_FLAG
        )
        if res.returncode == 0:
            return True, 'NaTex se actualizó correctamente desde GitHub. Recargando la aplicación...'
        else:
            return False, res.stderr or res.stdout or 'Error al ejecutar git pull'
    except Exception as e:
        return False, str(e)
