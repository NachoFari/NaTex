# -*- coding: utf-8 -*-
"""Constants and path configuration for NaTex Studio."""

import os
import sys
import shutil
import socket
import ssl
import subprocess
import urllib.request
import urllib.error

NO_WINDOW_FLAG = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
EXE_EXT = '.exe' if sys.platform == 'win32' else ''

APP_VERSION = "1.3.0"
GITHUB_REPO = "NachoFari/NaTex"

def find_available_port(start_port=5000, max_attempts=50):
    """Finds an available TCP port starting from start_port."""
    for p in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("", p))
                return p
            except OSError:
                continue
    return start_port

PORT = find_available_port(5000)

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

STATIC_DIR = os.path.join(BASE_DIR, 'static')
PROJECTS_DIR = os.path.join(BASE_DIR, 'projects')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
USER_TEMPLATES_DIR = os.path.join(BASE_DIR, 'user_templates')
COMPILER_DIR = os.path.join(BASE_DIR, 'compiler')
TOOLS_DIR = os.path.join(BASE_DIR, 'tools')
CONFIG_FILE = os.path.join(BASE_DIR, 'config.json')

def _resolve_binary(subdir, name):
    local_bin = os.path.join(BASE_DIR, subdir, f'{name}{EXE_EXT}')
    if os.path.exists(local_bin):
        return local_bin
    sys_bin = shutil.which(name)
    if sys_bin:
        return sys_bin
    return local_bin

COMPILER_EXE = _resolve_binary('compiler', 'tectonic')
CLOUDFLARED_EXE = _resolve_binary('tools', 'cloudflared')

DEFAULT_CONFIG = {
    'ai_provider': 'gemini',
    'gemini_api_key': '',
    'openai_api_key': '',
    'claude_api_key': '',
    'nvidia_api_key': '',
    'ai_model': '',
    'custom_api_url': 'http://localhost:11434/v1/chat/completions',
    'custom_api_key': '',
    'last_project': 'Mi_Primer_Documento',
    'theme': 'dark',
    'custom_color': '#FF6B35',
    'language': 'es',
    'auto_check_updates': True,
    'word_wrap': True,
    'theme_effects': True,
    'theme_effects_frequency': 100
}

def urlopen_with_ssl_fallback(req, timeout=40):
    """Tries standard verified SSL connection, falling back to unverified on local CA failure."""
    try:
        ctx_verified = ssl.create_default_context()
        return urllib.request.urlopen(req, context=ctx_verified, timeout=timeout)
    except urllib.error.URLError as e:
        if isinstance(getattr(e, 'reason', None), ssl.SSLCertVerificationError) or 'CERTIFICATE_VERIFY_FAILED' in str(e):
            ctx_fallback = ssl.create_default_context()
            ctx_fallback.check_hostname = False
            ctx_fallback.verify_mode = ssl.CERT_NONE
            return urllib.request.urlopen(req, context=ctx_fallback, timeout=timeout)
        raise

def get_local_ip():
    """Detects local LAN IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'
