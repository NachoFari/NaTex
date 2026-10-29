# -*- coding: utf-8 -*-
"""NaTex Studio - Main Desktop Application Entrypoint."""

import os
import sys
import time
import socketserver
import threading
import webbrowser
import urllib.request
import urllib.parse
import core.config
from core.constants import (
    BASE_DIR,
    STATIC_DIR,
    PROJECTS_DIR,
    TEMPLATES_DIR,
    DEFAULT_CONFIG,
    PORT,
)
from core.config import load_config, save_config, get_heartbeat_elapsed
from server.http_handler import NaTexHandler
from services.project_service import import_cli_path
from services.tunnel_service import cleanup_tunnel

__all__ = [
    'NaTexHandler',
    'PROJECTS_DIR',
    'TEMPLATES_DIR',
    'load_config',
    'save_config',
    'DEFAULT_CONFIG',
    'PORT',
    'start_server',
    'monitor_heartbeat',
    'main',
]

def monitor_heartbeat():
    """Apaga el proceso si no se recibe ningún latido del navegador tras 9 segundos."""
    time.sleep(15)
    while True:
        time.sleep(2)
        if get_heartbeat_elapsed() > 9.0:
            cleanup_tunnel()
            os._exit(0)

watchdog_thread = monitor_heartbeat

def start_server(port=PORT, handler_class=NaTexHandler):
    """Inicializa y arranca el servidor HTTP multihilo de NaTex en segundo plano."""
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(("", port), handler_class)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    return httpd, server_thread

def main():
    os.chdir(BASE_DIR)
    if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    cli_proj = import_cli_path(sys.argv[1]) if len(sys.argv) > 1 else None

    # Detección de instancia única
    if PORT != 5000:
        try:
            focus_url = f'http://127.0.0.1:5000/api/system/focus?project={urllib.parse.quote(cli_proj or "")}'
            with urllib.request.urlopen(focus_url, timeout=1.5) as resp:
                if resp.status == 200:
                    print('[NaTex] Instancia activa detectada en puerto 5000. Enfocando ventana existente...')
                    sys.exit(0)
        except Exception:
            pass

    print('==================================================')
    print('       [NaTex Desktop Studio] Modo Nativo         ')
    print('==================================================')
    print(f'Iniciando servidor local en puerto {PORT}...')

    try:
        httpd, _ = start_server(PORT, NaTexHandler)
    except Exception as e:
        print(f"[NaTex] Error al vincular puerto {PORT}: {e}")
        sys.exit(1)

    url = f'http://localhost:{PORT}'
    print(f'[NaTex] Servidor activo en {url}')

    try:
        import webview
        print('[NaTex] Abriendo ventana nativa de escritorio independiente...')
        core.config.native_window = webview.create_window(
            title='NaTex Studio',
            url=url,
            width=1420,
            height=900,
            min_size=(1050, 680),
            maximized=True,
            background_color='#0E1015'
        )
        gui_backend = 'edgechromium' if sys.platform == 'win32' else None
        webview.start(gui=gui_backend, debug=False)
    except Exception as e:
        print(f'[NaTex] Modo ventana nativa no disponible ({e}), usando navegador...')
        webbrowser.open(url)
        threading.Thread(target=monitor_heartbeat, daemon=True).start()
        while True:
            time.sleep(1)

    core.config.server_shutting_down = True
    cleanup_tunnel()
    os._exit(0)

if __name__ == '__main__':
    main()
