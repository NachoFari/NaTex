# -*- coding: utf-8 -*-
"""Cloudflared P2P tunnel manager for live collaboration."""

import os
import re
import sys
import time
import atexit
import threading
import subprocess
import core.config
from core.constants import CLOUDFLARED_EXE, PORT, NO_WINDOW_FLAG

def cleanup_tunnel():
    """Detiene y finaliza cualquier proceso activo de cloudflared."""
    if core.config.tunnel_proc:
        try:
            core.config.tunnel_proc.terminate()
            time.sleep(0.2)
            core.config.tunnel_proc.kill()
        except Exception:
            pass
        core.config.tunnel_proc = None
        core.config.tunnel_url = None

atexit.register(cleanup_tunnel)

def _drain_stderr(proc):
    """Lee continuamente el stderr de cloudflared para que el búfer de Windows nunca se llene (evita Error 1033)."""
    try:
        for _ in proc.stderr:
            pass
    except Exception:
        pass

def start_tunnel_thread():
    """Inicia el túnel de Cloudflare y detecta la URL pública temporal asignada."""
    if core.config.tunnel_url and core.config.tunnel_proc and core.config.tunnel_proc.poll() is None:
        return core.config.tunnel_url

    cleanup_tunnel()

    if not os.path.exists(CLOUDFLARED_EXE):
        return None

    try:
        if sys.platform == 'win32':
            subprocess.run(
                ['taskkill', '/F', '/IM', 'cloudflared.exe'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=NO_WINDOW_FLAG
            )
        else:
            subprocess.run(['pkill', '-f', 'cloudflared'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

    cmd = [CLOUDFLARED_EXE, 'tunnel', '--protocol', 'http2', '--url', f'http://127.0.0.1:{PORT}']
    core.config.tunnel_proc = subprocess.Popen(
        cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        encoding='utf-8',
        errors='ignore',
        creationflags=NO_WINDOW_FLAG
    )

    found_url = None
    start_time = time.time()
    while time.time() - start_time < 25:
        line = core.config.tunnel_proc.stderr.readline()
        if not line:
            time.sleep(0.15)
            continue
        match = re.search(r'https://[a-zA-Z0-9\-]+\.trycloudflare\.com', line)
        if match:
            found_url = match.group(0)
            break

    if found_url:
        core.config.tunnel_url = found_url
        drainer = threading.Thread(target=_drain_stderr, args=(core.config.tunnel_proc,), daemon=True)
        drainer.start()
        time.sleep(1.5)
        return core.config.tunnel_url

    return None

def restart_tunnel():
    """Reinicia por completo la conexión del túnel."""
    cleanup_tunnel()
    return start_tunnel_thread()
