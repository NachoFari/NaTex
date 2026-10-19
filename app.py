import http.server
import socketserver
import os
import json
import subprocess
import urllib.request
import urllib.parse
import ssl
import mimetypes
import base64
import webbrowser
import threading
import time
import re
import sys
import atexit
import gzip
import socket
import shutil
import io
import zipfile

if sys.stdout is None:
    try:
        sys.stdout = open(os.devnull, 'w', encoding='utf-8')
    except:
        pass
if sys.stderr is None:
    try:
        sys.stderr = open(os.devnull, 'w', encoding='utf-8')
    except:
        pass

NO_WINDOW_FLAG = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
EXE_EXT = '.exe' if sys.platform == 'win32' else ''

def find_available_port(start_port=5000, max_attempts=50):
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
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PROJECTS_DIR = os.path.join(BASE_DIR, 'projects')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
USER_TEMPLATES_DIR = os.path.join(BASE_DIR, 'user_templates')

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
CONFIG_FILE = os.path.join(BASE_DIR, 'config.json')

def resolve_safe_project_path(proj_name, rel_path=None):
    """Garantiza mediante os.path.commonpath que proj_name y rel_path nunca salgan de PROJECTS_DIR."""
    if not proj_name or '..' in proj_name or proj_name.startswith(('/', '\\')):
        return None, None
    projects_abs = os.path.abspath(PROJECTS_DIR)
    proj_abs = os.path.abspath(os.path.join(PROJECTS_DIR, proj_name))
    try:
        if os.path.commonpath([projects_abs, proj_abs]) != projects_abs or proj_abs == projects_abs:
            return None, None
    except ValueError:
        return None, None

    if rel_path is None:
        return proj_abs, None

    clean_rel = str(rel_path).strip().lstrip('/\\')
    if not clean_rel or '..' in clean_rel.split('/') or '..' in clean_rel.split('\\'):
        return proj_abs, None
    target_abs = os.path.abspath(os.path.join(proj_abs, clean_rel))
    try:
        if os.path.commonpath([proj_abs, target_abs]) != proj_abs:
            return proj_abs, None
    except ValueError:
        return proj_abs, None

    return proj_abs, target_abs

def urlopen_with_ssl_fallback(req, timeout=40):
    """Intenta abrir una conexión HTTPS con verificación de certificados estándar; hace fallback solo ante error de CA local."""
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

def extract_compiler_error_line(log_text):
    """Extrae el número de línea del primer error reportado por Tectonic / LaTeX."""
    if not log_text:
        return None
    m1 = re.search(r':[0-9]+:', log_text)
    if m1:
        try:
            return int(m1.group(0).strip(':'))
        except ValueError:
            pass
    m2 = re.search(r'\bl\.(\d+)\b', log_text)
    if m2:
        try:
            return int(m2.group(1))
        except ValueError:
            pass
    return None

def _history_safe_file_prefix(rel_file):
    norm = (rel_file or 'main.tex').replace('\\', '/').strip('/')
    return re.sub(r'[^a-zA-Z0-9_\-\.]', '__', norm)

def save_project_snapshot(proj_dir, rel_file, code, label='Auto'):
    """Guarda un snapshot en <proj_dir>/.history/ evitando duplicados idénticos consecutivos (máx 25 por archivo)."""
    if not proj_dir or not code:
        return None
    try:
        hist_dir = os.path.join(proj_dir, '.history')
        os.makedirs(hist_dir, exist_ok=True)
        prefix = _history_safe_file_prefix(rel_file)
        existing = sorted([
            f for f in os.listdir(hist_dir)
            if f.startswith(prefix + '__') and f.endswith('.json')
        ], reverse=True)

        if existing:
            latest_p = os.path.join(hist_dir, existing[0])
            try:
                with open(latest_p, 'r', encoding='utf-8') as lf:
                    latest_obj = json.load(lf)
                if latest_obj.get('code') == code:
                    return existing[0][:-5]
            except Exception:
                pass

        ts = int(time.time() * 1000)
        snap_id = f"{prefix}__{ts}"
        snap_path = os.path.join(hist_dir, f"{snap_id}.json")
        snap_obj = {
            'id': snap_id,
            'file': rel_file or 'main.tex',
            'timestamp': ts / 1000.0,
            'label': label or 'Snapshot',
            'lines': len(code.splitlines()),
            'chars': len(code),
            'code': code
        }
        with open(snap_path, 'w', encoding='utf-8') as sf:
            json.dump(snap_obj, sf, ensure_ascii=False)

        # Conservar las últimas 25 versiones de este archivo
        for old_f in existing[24:]:
            try:
                os.remove(os.path.join(hist_dir, old_f))
            except Exception:
                pass
        return snap_id
    except Exception:
        return None

def list_project_snapshots(proj_dir, rel_file):
    hist_dir = os.path.join(proj_dir, '.history')
    if not os.path.isdir(hist_dir):
        return []
    prefix = _history_safe_file_prefix(rel_file)
    files = sorted([
        f for f in os.listdir(hist_dir)
        if f.startswith(prefix + '__') and f.endswith('.json')
    ], reverse=True)
    result = []
    for fname in files:
        try:
            with open(os.path.join(hist_dir, fname), 'r', encoding='utf-8') as f:
                obj = json.load(f)
            code_txt = obj.get('code', '')
            result.append({
                'id': obj.get('id', fname[:-5]),
                'file': obj.get('file', rel_file),
                'timestamp': obj.get('timestamp', 0),
                'label': obj.get('label', 'Snapshot'),
                'lines': obj.get('lines', len(code_txt.splitlines())),
                'chars': obj.get('chars', len(code_txt)),
                'preview': code_txt[:220]
            })
        except Exception:
            pass
    return result


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
    'auto_check_updates': True
}

tunnel_proc = None
tunnel_url = None
shared_project = 'Mi_Primer_Documento'
server_shutting_down = False
native_window = None

last_heartbeat_time = time.time()
heartbeat_lock = threading.Lock()

def watchdog_thread():
    """Apaga el proceso si no se recibe ningún latido del navegador tras 9 segundos."""
    time.sleep(15)
    while True:
        time.sleep(2)
        with heartbeat_lock:
            elapsed = time.time() - last_heartbeat_time
        if elapsed > 9.0:
            cleanup_tunnel()
            os._exit(0)

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return DEFAULT_CONFIG.copy()

def save_config(cfg):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, indent=2)

def cleanup_tunnel():
    global tunnel_proc, tunnel_url
    if tunnel_proc:
        try:
            tunnel_proc.terminate()
            time.sleep(0.2)
            tunnel_proc.kill()
        except:
            pass
        tunnel_proc = None
        tunnel_url = None

atexit.register(cleanup_tunnel)

def _drain_stderr(proc):
    """Lee continuamente el stderr de cloudflared para que el búfer de Windows nunca se llene."""
    try:
        for _ in proc.stderr:
            pass
    except:
        pass

def start_tunnel_thread():
    global tunnel_proc, tunnel_url
    if tunnel_url and tunnel_proc and tunnel_proc.poll() is None:
        return tunnel_url

    cleanup_tunnel()

    if not os.path.exists(CLOUDFLARED_EXE):
        return None

    # Cerrar cualquier cloudflared previo de forma silenciosa y multiplataforma
    try:
        if sys.platform == 'win32':
            subprocess.run(['taskkill', '/F', '/IM', 'cloudflared.exe'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=NO_WINDOW_FLAG)
        else:
            subprocess.run(['pkill', '-f', 'cloudflared'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except:
        pass

    cmd = [CLOUDFLARED_EXE, 'tunnel', '--protocol', 'http2', '--url', f'http://127.0.0.1:{PORT}']
    tunnel_proc = subprocess.Popen(
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
        line = tunnel_proc.stderr.readline()
        if not line:
            time.sleep(0.15)
            continue
        match = re.search(r'https://[a-zA-Z0-9\-]+\.trycloudflare\.com', line)
        if match:
            found_url = match.group(0)
            break

    if found_url:
        tunnel_url = found_url
        # Iniciar hilo de drenaje para evitar que cloudflared se congele por búfer lleno (Error 1033)
        drainer = threading.Thread(target=_drain_stderr, args=(tunnel_proc,), daemon=True)
        drainer.start()
        # Pequeña pausa para permitir que los nodos edge de Cloudflare registren la ruta
        time.sleep(1.5)
        return tunnel_url

    return None

def parse_synctex_file(synctex_path):
    """Parsea el archivo synctex.gz para sincronización bidireccional Editor <-> PDF."""
    if not os.path.exists(synctex_path):
        return {}, []
    try:
        with gzip.open(synctex_path, 'rt', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        line_to_page = {}
        nodes = []
        current_page = None
        for line in content.splitlines():
            if line.startswith('{') and len(line) > 1 and line[1:].isdigit():
                current_page = int(line[1:])
            elif line.startswith('}') and current_page is not None:
                current_page = None
            elif current_page is not None:
                m = re.match(r'^[a-zA-Z\[\(](\d+),(\d+):(\d+),(\d+)', line)
                if m:
                    tag, l, x, y = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))
                    if tag == 1 and l > 0:
                        if l not in line_to_page:
                            line_to_page[l] = current_page
                        nodes.append((current_page, l, x, y))
        return line_to_page, nodes
    except Exception as e:
        print(f"[NaTex] Nota al leer synctex: {e}")
        return {}, []

def get_local_ip():
    """Detecta la dirección IP local en la red Wi-Fi/LAN."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

def call_ai_service(prompt, system_prompt=None, cfg=None):
    """Enruta y ejecuta solicitudes de IA hacia Gemini, OpenAI, Claude, NVIDIA NIM o APIs locales/personalizadas."""
    if cfg is None:
        cfg = load_config()

    provider = cfg.get('ai_provider', 'gemini').lower()
    custom_model = (cfg.get('ai_model') or '').strip()

    if not system_prompt:
        system_prompt = (
            "Eres el asistente inteligente de NaTex Studio, un editor y compilador de LaTeX moderno y veloz. "
            "Responde de manera concisa, clara, directa y profesional. Cuando sea pertinente, incluye fragmentos de código "
            "LaTeX listos para copiar y compilar."
        )

    if provider == 'gemini':
        api_key = (cfg.get('gemini_api_key') or '').strip()
        if not api_key:
            return False, "Falta la API Key de Google Gemini. Puedes ingresarla en Ajustes (⚙️)."

        model = custom_model or 'gemini-2.0-flash'
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
        payload = {
            'contents': [{
                'parts': [{'text': f"{system_prompt}\n\nUsuario: {prompt}"}]
            }]
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
            with urlopen_with_ssl_fallback(req, timeout=40) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                text = res_data['candidates'][0]['content']['parts'][0]['text']
                return True, text
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            return False, f"Error de Gemini (HTTP {e.code}): {err_msg}"
        except Exception as e:
            return False, f"Error al conectar con Gemini: {str(e)}"

    elif provider == 'openai':
        api_key = (cfg.get('openai_api_key') or '').strip()
        if not api_key:
            return False, "Falta la API Key de OpenAI. Puedes ingresarla en Ajustes (⚙️)."

        model = custom_model or 'gpt-4o-mini'
        url = 'https://api.openai.com/v1/chat/completions'
        payload = {
            'model': model,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.7
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}
            )
            with urlopen_with_ssl_fallback(req, timeout=40) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                text = res_data['choices'][0]['message']['content']
                return True, text
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            return False, f"Error de OpenAI (HTTP {e.code}): {err_msg}"
        except Exception as e:
            return False, f"Error al conectar con OpenAI: {str(e)}"

    elif provider == 'claude':
        api_key = (cfg.get('claude_api_key') or '').strip()
        if not api_key:
            return False, "Falta la API Key de Anthropic Claude. Puedes ingresarla en Ajustes (⚙️)."

        model = custom_model or 'claude-3-5-sonnet-20241022'
        url = 'https://api.anthropic.com/v1/messages'
        payload = {
            'model': model,
            'max_tokens': 4096,
            'system': system_prompt,
            'messages': [
                {'role': 'user', 'content': prompt}
            ]
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'x-api-key': api_key,
                    'anthropic-version': '2023-06-01'
                }
            )
            with urlopen_with_ssl_fallback(req, timeout=40) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                text = res_data['content'][0]['text']
                return True, text
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            return False, f"Error de Claude (HTTP {e.code}): {err_msg}"
        except Exception as e:
            return False, f"Error al conectar con Claude: {str(e)}"

    elif provider == 'nvidia':
        api_key = (cfg.get('nvidia_api_key') or '').strip()
        if not api_key:
            return False, "Falta la API Key de NVIDIA NIM. Puedes ingresarla en Ajustes (⚙️)."

        model = custom_model or 'meta/llama-3.1-70b-instruct'
        url = 'https://integrate.api.nvidia.com/v1/chat/completions'
        payload = {
            'model': model,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.6,
            'max_tokens': 4096
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}
            )
            with urlopen_with_ssl_fallback(req, timeout=40) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                text = res_data['choices'][0]['message']['content']
                return True, text
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            return False, f"Error de NVIDIA (HTTP {e.code}): {err_msg}"
        except Exception as e:
            return False, f"Error al conectar con NVIDIA: {str(e)}"

    elif provider == 'custom':
        url = (cfg.get('custom_api_url') or '').strip() or 'http://localhost:11434/v1/chat/completions'
        api_key = (cfg.get('custom_api_key') or '').strip()
        model = custom_model or 'llama3.2'

        payload = {
            'model': model,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt}
            ]
        }
        headers = {'Content-Type': 'application/json'}
        if api_key:
            headers['Authorization'] = f'Bearer {api_key}'
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urlopen_with_ssl_fallback(req, timeout=40) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                text = res_data['choices'][0]['message']['content']
                return True, text
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            return False, f"Error de API Personalizada (HTTP {e.code}): {err_msg}"
        except Exception as e:
            return False, f"Error al conectar con API Personalizada: {str(e)}"

    return False, f"Proveedor de IA desconocido: '{provider}'."

class NaTexHandler(http.server.SimpleHTTPRequestHandler):
    def is_external_guest(self):
        if self.headers.get('Cf-Connecting-Ip') or self.headers.get('Cf-Ray') or self.headers.get('X-Forwarded-For'):
            return True
        host = self.headers.get('Host', '').split(':')[0].lower()
        return host not in ('localhost', '127.0.0.1')

    def do_GET(self):
        global tunnel_url, shared_project
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        is_guest = self.is_external_guest()

        if path == '/' or path == '/index.html':
            if is_guest:
                qs = urllib.parse.parse_qs(parsed.query)
                current_p = qs.get('p', [''])[0]
                # Si el invitado borra ?p= o intenta entrar sin él, forzar redirección al proyecto compartido
                if current_p != shared_project:
                    self.send_response(302)
                    self.send_header('Location', f'/?p={urllib.parse.quote(shared_project)}')
                    self.end_headers()
                    return
            self.serve_file(os.path.join(BASE_DIR, 'static', 'index.html'), 'text/html; charset=utf-8')
            return

        if path == '/voice' or path == '/voice.html':
            self.serve_file(os.path.join(BASE_DIR, 'static', 'voice.html'), 'text/html; charset=utf-8')
            return

        if path == '/api/voice/status':
            cfg = load_config()
            self.send_json({
                'has_gemini_key': bool(cfg.get('gemini_api_key')),
                'tunnel_url': tunnel_url,
                'local_ip': get_local_ip(),
                'port': PORT,
                'current_project': cfg.get('last_project', 'Mi_Primer_Documento')
            })
            return

        if path.startswith('/static/'):
            rel_path = path[len('/static/'):].replace('/', os.sep)
            static_root = os.path.abspath(os.path.join(BASE_DIR, 'static'))
            file_path = os.path.abspath(os.path.join(static_root, rel_path))
            try:
                if os.path.commonpath([static_root, file_path]) != static_root:
                    self.send_error(403, 'Acceso denegado')
                    return
            except ValueError:
                self.send_error(403, 'Acceso denegado')
                return
            mime, _ = mimetypes.guess_type(file_path)
            self.serve_file(file_path, mime or 'application/octet-stream')
            return

        if path == '/api/projects':
            if is_guest:
                # El invitado NUNCA ve la lista de los otros proyectos
                self.send_json({'projects': [shared_project], 'current': shared_project})
                return
            os.makedirs(PROJECTS_DIR, exist_ok=True)
            projects = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
            cfg = load_config()
            self.send_json({'projects': projects, 'current': cfg.get('last_project', 'Mi_Primer_Documento')})
            return

        if path == '/api/projects/details':
            os.makedirs(PROJECTS_DIR, exist_ok=True)
            if is_guest:
                projs = [shared_project]
            else:
                projs = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
            details = []
            for p in projs:
                pdir = os.path.join(PROJECTS_DIR, p)
                tex_file = os.path.join(pdir, 'main.tex')
                pdf_file = os.path.join(pdir, 'main.pdf')
                mtime = os.path.getmtime(tex_file) if os.path.exists(tex_file) else 0
                lines_cnt = 0
                preview_text = ''
                if os.path.exists(tex_file):
                    try:
                        with open(tex_file, 'r', encoding='utf-8', errors='ignore') as f:
                            raw = f.read()
                            lines_cnt = len(raw.splitlines())
                            for ln in raw.splitlines():
                                ln_strip = ln.strip()
                                if ln_strip and not ln_strip.startswith('\\documentclass') and not ln_strip.startswith('\\usepackage'):
                                    preview_text = ln_strip
                                    if len(preview_text) > 80:
                                        preview_text = preview_text[:80] + '...'
                                    break
                    except:
                        pass
                files_cnt = len([f for f in os.listdir(pdir) if f != 'main.tex' and not f.endswith('.pdf') and not f.endswith('.synctex.gz')]) if os.path.exists(pdir) else 0
                details.append({
                    'name': p,
                    'mtime': mtime,
                    'lines': lines_cnt,
                    'files': files_cnt,
                    'has_pdf': os.path.exists(pdf_file),
                    'preview': preview_text
                })
            details.sort(key=lambda x: x['mtime'], reverse=True)
            cfg = load_config()
            self.send_json({'projects': details, 'current': cfg.get('last_project', 'Mi_Primer_Documento')})
            return

        if path == '/api/project/load':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [shared_project])[0]
            req_file = qs.get('file', ['main.tex'])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso no autorizado al proyecto')
                return

            proj_dir, target_path = resolve_safe_project_path(proj, req_file)
            if not proj_dir:
                self.send_error(400, 'Proyecto inválido')
                return
            if not target_path:
                req_file = 'main.tex'
                _, target_path = resolve_safe_project_path(proj, req_file)

            code = ''
            mtime = 0
            if os.path.exists(target_path) and os.path.isfile(target_path):
                mtime = os.path.getmtime(target_path)
                with open(target_path, 'r', encoding='utf-8', errors='ignore') as f:
                    code = f.read()
            elif req_file == 'main.tex':
                os.makedirs(proj_dir, exist_ok=True)
                with open(target_path, 'w', encoding='utf-8') as f:
                    code = '\\documentclass{article}\n\\begin{document}\n¡Hola Mundo en LaTeX!\n\\end{document}'
                    f.write(code)
                mtime = os.path.getmtime(target_path)

            files = []
            bib_entries = []
            if os.path.exists(proj_dir):
                ignored_suffixes = ('.pdf', '.synctex.gz', '.synctex', '.aux', '.log', '.out', '.toc', '.fls', '.fdb_latexmk', '.bbl', '.blg', '.xdv')
                seen_bib_keys = set()
                bib_entry_re = re.compile(r'@(\w+)\s*\{\s*([^,\s\}]+)\s*,', re.IGNORECASE)
                bib_title_re = re.compile(r'title\s*=\s*[\{"]([^\}"]+)[\}"]', re.IGNORECASE)

                def scan_dir(cur_dir, rel_prefix=""):
                    items = []
                    try:
                        entries = sorted(os.listdir(cur_dir))
                    except Exception:
                        return items
                    for entry in entries:
                        if entry.startswith('.') or any(entry.lower().endswith(ext) for ext in ignored_suffixes):
                            continue
                        full_p = os.path.join(cur_dir, entry)
                        rel_p = f"{rel_prefix}/{entry}" if rel_prefix else entry
                        is_d = os.path.isdir(full_p)
                        item = {
                            'name': entry,
                            'path': rel_p,
                            'is_dir': is_d,
                            'size': 0 if is_d else os.path.getsize(full_p)
                        }
                        if is_d:
                            item['children'] = scan_dir(full_p, rel_p)
                        elif entry.lower().endswith('.bib'):
                            try:
                                with open(full_p, 'r', encoding='utf-8', errors='ignore') as bf:
                                    bcontent = bf.read()
                                for m in bib_entry_re.finditer(bcontent):
                                    btype = m.group(1).lower()
                                    if btype in ('comment', 'preamble', 'string'):
                                        continue
                                    bkey = m.group(2).strip()
                                    if bkey and bkey not in seen_bib_keys:
                                        seen_bib_keys.add(bkey)
                                        snippet = bcontent[m.end():m.end() + 600]
                                        tm = bib_title_re.search(snippet)
                                        btitle = tm.group(1).strip() if tm else ''
                                        bib_entries.append({'key': bkey, 'type': btype, 'title': btitle, 'file': rel_p})
                            except Exception:
                                pass
                        items.append(item)
                    return items
                files = scan_dir(proj_dir)

            stem = os.path.splitext(req_file)[0]
            specific_pdf = f"{stem}.pdf"
            pdf_file_to_use = None
            if req_file == 'main.tex':
                if os.path.exists(os.path.join(proj_dir, 'main.pdf')):
                    pdf_file_to_use = 'main.pdf'
            else:
                if os.path.exists(os.path.join(proj_dir, specific_pdf)):
                    pdf_file_to_use = specific_pdf
                elif not (r'\documentclass' in code) and os.path.exists(os.path.join(proj_dir, 'main.pdf')):
                    pdf_file_to_use = 'main.pdf'

            has_pdf = pdf_file_to_use is not None
            if not is_guest:
                cfg = load_config()
                cfg['last_project'] = proj
                save_config(cfg)
            self.send_json({
                'success': True,
                'name': proj,
                'file': req_file,
                'code': code,
                'mtime': mtime,
                'files': files,
                'bib_entries': bib_entries,
                'has_pdf': has_pdf,
                'pdf_file': pdf_file_to_use
            })
            return

        if path == '/api/project/check_update':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso denegado')
                return

            since = float(qs.get('since', [0])[0])
            req_file = qs.get('file', ['main.tex'])[0]
            proj_dir, tex_file = resolve_safe_project_path(proj, req_file)
            if not tex_file:
                _, tex_file = resolve_safe_project_path(proj, 'main.tex')

            if tex_file and os.path.exists(tex_file):
                current_mtime = os.path.getmtime(tex_file)
                if current_mtime > since + 0.05:
                    with open(tex_file, 'r', encoding='utf-8', errors='ignore') as f:
                        code = f.read()
                    self.send_json({'updated': True, 'mtime': current_mtime, 'code': code})
                    return
            self.send_json({'updated': False})
            return

        if path == '/api/pdf':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso denegado al PDF')
                return

            req_pdf = qs.get('file', ['main.pdf'])[0]
            if not req_pdf.lower().endswith('.pdf'):
                req_pdf = os.path.splitext(req_pdf)[0] + '.pdf'

            proj_dir, pdf_path = resolve_safe_project_path(proj, req_pdf)
            if not pdf_path:
                _, pdf_path = resolve_safe_project_path(proj, 'main.pdf')

            if pdf_path and not os.path.exists(pdf_path):
                _, main_pdf = resolve_safe_project_path(proj, 'main.pdf')
                if main_pdf and os.path.exists(main_pdf):
                    pdf_path = main_pdf

            if pdf_path and os.path.exists(pdf_path):
                self.serve_file(pdf_path, 'application/pdf')
            else:
                self.send_error(404, 'PDF aun no compilado')
            return

        if path == '/api/project/asset':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso denegado a recursos')
                return

            req_asset = qs.get('file', [''])[0]
            _, asset_path = resolve_safe_project_path(proj, req_asset)
            if asset_path and os.path.isfile(asset_path):
                mime, _ = mimetypes.guess_type(asset_path)
                self.serve_file(asset_path, mime or 'application/octet-stream')
            else:
                self.send_error(404, 'Recurso no encontrado')
            return

        if path == '/api/gallery/all':
            images = []
            if os.path.exists(PROJECTS_DIR):
                target_projects = [shared_project] if is_guest else sorted(os.listdir(PROJECTS_DIR))
                for p in target_projects:
                    p_dir = os.path.join(PROJECTS_DIR, p)
                    if os.path.isdir(p_dir):
                        for root_d, _, files_in_d in os.walk(p_dir):
                            for f in sorted(files_in_d):
                                if f.lower().endswith(('.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif')):
                                    f_path = os.path.join(root_d, f)
                                    rel_f = os.path.relpath(f_path, p_dir).replace('\\', '/')
                                    try:
                                        stat = os.stat(f_path)
                                        images.append({
                                            'project': p,
                                            'filename': rel_f,
                                            'size': stat.st_size,
                                            'mtime': stat.st_mtime,
                                            'url': f'/api/project/asset?name={urllib.parse.quote(p)}&file={urllib.parse.quote(rel_f)}'
                                        })
                                    except Exception:
                                        pass
            self.send_json({'success': True, 'images': images})
            return

        if path == '/api/system/check_update':
            CURRENT_VERSION = "1.0"
            is_git = os.path.exists(os.path.join(BASE_DIR, '.git'))
            try:
                req = urllib.request.Request(
                    'https://api.github.com/repos/NachoFari/NaTex/releases/latest',
                    headers={'User-Agent': 'NaTex-Studio'}
                )
                with urlopen_with_ssl_fallback(req, timeout=8) as resp:
                    rel_data = json.loads(resp.read().decode('utf-8'))
                    tag = rel_data.get('tag_name', '').lstrip('v').lstrip('.')
                    has_update = False
                    try:
                        v_latest = [int(x) for x in re.findall(r'\d+', tag)]
                        v_current = [int(x) for x in re.findall(r'\d+', CURRENT_VERSION)]
                        if v_latest > v_current:
                            has_update = True
                    except:
                        if tag and tag != CURRENT_VERSION:
                            has_update = True

                    self.send_json({
                        'success': True,
                        'current_version': 'v1.0',
                        'latest_version': rel_data.get('tag_name', 'v1.0'),
                        'has_update': has_update,
                        'release_name': rel_data.get('name', ''),
                        'release_notes': rel_data.get('body', ''),
                        'download_url': 'https://github.com/NachoFari/NaTex/releases/latest/download/NaTex.exe',
                        'releases_page': 'https://github.com/NachoFari/NaTex/releases',
                        'is_git_repo': is_git
                    })
                    return
            except Exception as e:
                self.send_json({
                    'success': False,
                    'error': f'No se pudo conectar con GitHub: {str(e)}',
                    'current_version': 'v1.0',
                    'is_git_repo': is_git
                })
                return

        if path == '/api/templates':
            built_in = []
            if os.path.exists(TEMPLATES_DIR):
                for t in os.listdir(TEMPLATES_DIR):
                    p = os.path.join(TEMPLATES_DIR, t)
                    if os.path.isdir(p):
                        built_in.append({'id': t, 'name': t.replace('_', ' ').title(), 'type': 'built_in'})
            user_t = []
            if not is_guest and os.path.exists(USER_TEMPLATES_DIR):
                for t in os.listdir(USER_TEMPLATES_DIR):
                    p = os.path.join(USER_TEMPLATES_DIR, t)
                    if os.path.isdir(p):
                        user_t.append({'id': t, 'name': t.replace('_', ' ').title(), 'type': 'user'})
            self.send_json({'built_in': built_in, 'user': user_t})
            return

        if path == '/api/tunnel/start':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return

            qs = urllib.parse.parse_qs(parsed.query)
            req_proj = qs.get('project', [''])[0]
            if req_proj:
                shared_project = req_proj

            if not tunnel_url:
                url = start_tunnel_thread()
            else:
                url = tunnel_url
            if url:
                self.send_json({'success': True, 'url': url})
            else:
                self.send_json({'success': False, 'error': 'No se pudo iniciar el túnel de conexión.'})
            return

        if path == '/api/tunnel/status':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return
            self.send_json({'active': tunnel_url is not None, 'url': tunnel_url})
            return

        if path == '/api/synctex/forward':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('project', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            line = int(qs.get('line', [1])[0])
            req_file = qs.get('file', ['main.tex'])[0]
            stem = os.path.splitext(os.path.basename(req_file))[0]
            proj_dir, _ = resolve_safe_project_path(proj)
            if not proj_dir:
                self.send_error(400, 'Proyecto inválido')
                return
            synctex_path = os.path.join(proj_dir, f'{stem}.synctex.gz')
            if not os.path.exists(synctex_path):
                synctex_path = os.path.join(proj_dir, 'main.synctex.gz')
            line_to_page, _ = parse_synctex_file(synctex_path)
            target_page = 1
            if line in line_to_page:
                target_page = line_to_page[line]
            elif line_to_page:
                preceding = [l for l in line_to_page.keys() if l <= line]
                if preceding:
                    target_page = line_to_page[max(preceding)]
                else:
                    target_page = line_to_page[min(line_to_page.keys())]
            self.send_json({'success': True, 'page': target_page})
            return

        if path == '/api/synctex/inverse':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('project', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            page = int(qs.get('page', [1])[0])
            x = float(qs.get('x', [0])[0])
            y = float(qs.get('y', [0])[0])
            req_file = qs.get('file', ['main.tex'])[0]
            stem = os.path.splitext(os.path.basename(req_file))[0]
            proj_dir, _ = resolve_safe_project_path(proj)
            if not proj_dir:
                self.send_error(400, 'Proyecto inválido')
                return
            synctex_path = os.path.join(proj_dir, f'{stem}.synctex.gz')
            if not os.path.exists(synctex_path):
                synctex_path = os.path.join(proj_dir, 'main.synctex.gz')
            _, nodes = parse_synctex_file(synctex_path)
            x_sp = x * 65536
            y_sp = y * 65536
            page_nodes = [n for n in nodes if n[0] == page]
            if page_nodes:
                closest = min(page_nodes, key=lambda n: (n[2] - x_sp)**2 + (n[3] - y_sp)**2)
                self.send_json({'success': True, 'line': closest[1]})
            else:
                self.send_json({'success': False, 'error': 'Coordenadas no encontradas'})
            return

        if path == '/api/system/heartbeat':
            global last_heartbeat_time, server_shutting_down
            if not is_guest:
                with heartbeat_lock:
                    last_heartbeat_time = time.time()
                    server_shutting_down = False
            self.send_json({
                'status': 'shutting_down' if (server_shutting_down and is_guest) else 'alive',
                'is_guest': is_guest,
                'project': shared_project
            })
            return

        if path == '/api/system/focus':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return
            qs = urllib.parse.parse_qs(parsed.query)
            open_proj = qs.get('project', [''])[0]
            if native_window is not None:
                try:
                    if open_proj:
                        native_window.load_url(f'http://localhost:{PORT}/?p={urllib.parse.quote(open_proj)}')
                    native_window.restore()
                    native_window.show()
                except Exception:
                    pass
            else:
                target_u = f'http://localhost:{PORT}/?p={urllib.parse.quote(open_proj)}' if open_proj else f'http://localhost:{PORT}'
                threading.Thread(target=lambda: webbrowser.open(target_u), daemon=True).start()
            self.send_json({'success': True})
            return

        if path == '/api/system/open_browser':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return
            qs = urllib.parse.parse_qs(parsed.query)
            target = qs.get('path', [''])[0]
            if target.startswith('/'):
                full_url = f'http://localhost:{PORT}{target}'
            elif target.startswith(('http://localhost', 'http://127.0.0.1', 'https://github.com/NachoFari/')):
                full_url = target
            else:
                self.send_error(403, 'URL externa no permitida')
                return
            threading.Thread(target=lambda: webbrowser.open(full_url), daemon=True).start()
            self.send_json({'success': True})
            return

        if path == '/api/tunnel/restart':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return
            cleanup_tunnel()
            tunnel_url = None
            qs = urllib.parse.parse_qs(parsed.query)
            req_proj = qs.get('project', [''])[0]
            if req_proj:
                shared_project = req_proj
            url = start_tunnel_thread()
            if url:
                self.send_json({'success': True, 'url': url})
            else:
                self.send_json({'success': False, 'error': 'No se pudo reiniciar el túnel de conexión.'})
            return

        if path == '/api/project/download_tex':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            req_file = qs.get('file', ['main.tex'])[0]
            _, tex_file = resolve_safe_project_path(proj, req_file)
            if not tex_file:
                req_file = 'main.tex'
                _, tex_file = resolve_safe_project_path(proj, req_file)
            if not tex_file or not os.path.isfile(tex_file):
                self.send_error(404, 'Archivo no encontrado')
                return
            self.send_response(200)
            self.send_header('Content-Type', 'text/x-tex; charset=utf-8')
            download_name = os.path.basename(req_file) if req_file != 'main.tex' else f"{proj}.tex"
            self.send_header('Content-Disposition', f'attachment; filename="{urllib.parse.quote(download_name)}"')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            with open(tex_file, 'rb') as f:
                content = f.read()
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        if path == '/api/project/export_zip':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            proj_dir, _ = resolve_safe_project_path(proj)
            if not proj_dir or not os.path.isdir(proj_dir):
                self.send_error(404, 'Proyecto no encontrado')
                return

            ignored_exts = ('.synctex.gz', '.synctex', '.aux', '.log', '.out', '.toc', '.fls', '.fdb_latexmk', '.bbl', '.blg', '.xdv')
            mem_zip = io.BytesIO()
            with zipfile.ZipFile(mem_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root_d, dirs_in_d, files_in_d in os.walk(proj_dir):
                    dirs_in_d[:] = [d for d in dirs_in_d if not d.startswith('.')]
                    for f in files_in_d:
                        if f.startswith('.') or any(f.lower().endswith(ext) for ext in ignored_exts):
                            continue
                        full_p = os.path.join(root_d, f)
                        rel_p = os.path.relpath(full_p, proj_dir).replace('\\', '/')
                        zf.write(full_p, arcname=rel_p)

            zip_bytes = mem_zip.getvalue()
            self.send_response(200)
            self.send_header('Content-Type', 'application/zip')
            self.send_header('Content-Disposition', f'attachment; filename="{urllib.parse.quote(proj)}.zip"')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Content-Length', str(len(zip_bytes)))
            self.end_headers()
            self.wfile.write(zip_bytes)
            return

        if path == '/api/project/history':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            req_file = qs.get('file', ['main.tex'])[0]
            proj_dir, _ = resolve_safe_project_path(proj)
            if not proj_dir or not os.path.isdir(proj_dir):
                self.send_json({'success': False, 'snapshots': []})
                return
            snaps = list_project_snapshots(proj_dir, req_file)
            self.send_json({'success': True, 'snapshots': snaps})
            return

        if path == '/api/project/history_content':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            snap_id = re.sub(r'[^a-zA-Z0-9_\-\.]', '', qs.get('id', [''])[0])
            proj_dir, _ = resolve_safe_project_path(proj)
            if not proj_dir or not snap_id:
                self.send_json({'success': False, 'error': 'Snapshot inválido'})
                return
            snap_file = os.path.join(proj_dir, '.history', f"{snap_id}.json")
            if not os.path.isfile(snap_file):
                self.send_json({'success': False, 'error': 'Snapshot no encontrado'})
                return
            try:
                with open(snap_file, 'r', encoding='utf-8') as f:
                    obj = json.load(f)
                self.send_json({'success': True, 'snapshot': obj})
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
            return

        if path == '/api/config':
            cfg = load_config()
            if is_guest:
                # Invitados reciben únicamente preferencias visuales públicas, NUNCA API keys
                self.send_json({
                    'ai_provider': cfg.get('ai_provider', 'gemini'),
                    'theme': cfg.get('theme', 'dark'),
                    'custom_color': cfg.get('custom_color', '#FF6B35'),
                    'language': cfg.get('language', 'es'),
                    'auto_check_updates': False,
                    'is_guest': True
                })
                return
            self.send_json({
                'ai_provider': cfg.get('ai_provider', 'gemini'),
                'gemini_api_key': cfg.get('gemini_api_key', ''),
                'openai_api_key': cfg.get('openai_api_key', ''),
                'claude_api_key': cfg.get('claude_api_key', ''),
                'nvidia_api_key': cfg.get('nvidia_api_key', ''),
                'ai_model': cfg.get('ai_model', ''),
                'custom_api_url': cfg.get('custom_api_url', 'http://localhost:11434/v1/chat/completions'),
                'custom_api_key': cfg.get('custom_api_key', ''),
                'theme': cfg.get('theme', 'dark'),
                'custom_color': cfg.get('custom_color', '#FF6B35'),
                'language': cfg.get('language', 'es'),
                'auto_check_updates': cfg.get('auto_check_updates', True)
            })
            return

        self.send_error(404, 'Ruta no encontrada')

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        is_guest = self.is_external_guest()

        if path == '/api/system/goodbye':
            if is_guest:
                self.send_json({'status': 'guest_bye'})
                return
            if native_window is not None:
                self.send_json({'status': 'native_alive'})
                return
            goodbye_time = time.time()
            def shutdown_soon():
                global server_shutting_down
                time.sleep(3.0)
                with heartbeat_lock:
                    if last_heartbeat_time < goodbye_time:
                        server_shutting_down = True
                        cleanup_tunnel()
                        os._exit(0)
            threading.Thread(target=shutdown_soon, daemon=True).start()
            self.send_json({'status': 'bye'})
            return

        if path == '/api/project/save':
            data = self.read_json()
            proj = data.get('name', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            req_file = data.get('file', 'main.tex')
            proj_dir, target_path = resolve_safe_project_path(proj, req_file)
            if not proj_dir:
                self.send_json({'success': False, 'error': 'Proyecto inválido'})
                return
            if not target_path:
                req_file = 'main.tex'
                _, target_path = resolve_safe_project_path(proj, req_file)
            code = data.get('code', '')
            os.makedirs(proj_dir, exist_ok=True)
            parent_d = os.path.dirname(target_path)
            if parent_d:
                os.makedirs(parent_d, exist_ok=True)
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(code)
            mtime = os.path.getmtime(target_path)
            self.send_json({'success': True, 'mtime': mtime, 'file': req_file})
            return

        if path == '/api/project/file/create':
            data = self.read_json()
            proj = data.get('name', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado'})
                return
            filename = data.get('filename', '').strip()
            is_folder = data.get('is_folder', False)
            proj_dir, target_path = resolve_safe_project_path(proj, filename)
            if not proj_dir or not target_path:
                self.send_json({'success': False, 'error': 'Nombre de archivo inválido'})
                return
            try:
                if is_folder:
                    os.makedirs(target_path, exist_ok=True)
                else:
                    parent_d = os.path.dirname(target_path)
                    if parent_d:
                        os.makedirs(parent_d, exist_ok=True)
                    if not os.path.exists(target_path):
                        with open(target_path, 'w', encoding='utf-8') as f:
                            if filename.endswith('.tex'):
                                f.write(f"% {filename}\n")
                            else:
                                f.write("")
                self.send_json({'success': True, 'filename': filename})
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
            return

        if path == '/api/project/file/delete':
            data = self.read_json()
            proj = data.get('name', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado'})
                return
            filename = data.get('filename', '').strip()
            proj_dir, target_path = resolve_safe_project_path(proj, filename)
            if not proj_dir or not target_path or filename == 'main.tex':
                self.send_json({'success': False, 'error': 'No se puede eliminar el archivo principal'})
                return
            try:
                if os.path.isfile(target_path):
                    os.remove(target_path)
                elif os.path.isdir(target_path):
                    shutil.rmtree(target_path)
                self.send_json({'success': True})
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
            return

        if path == '/api/project/file/rename':
            data = self.read_json()
            proj = data.get('name', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado'})
                return
            old_name = data.get('old_filename', '').strip()
            new_name = data.get('new_filename', '').strip()
            if not old_name or not new_name or old_name == 'main.tex':
                self.send_json({'success': False, 'error': 'No se puede renombrar este archivo'})
                return
            old_dir = os.path.dirname(old_name)
            if old_dir and '/' not in new_name and '\\' not in new_name:
                new_name = f"{old_dir}/{new_name}"
            proj_dir, old_path = resolve_safe_project_path(proj, old_name)
            _, new_path = resolve_safe_project_path(proj, new_name)
            if not proj_dir or not old_path or not new_path:
                self.send_json({'success': False, 'error': 'Ruta de archivo inválida'})
                return
            try:
                os.rename(old_path, new_path)
                self.send_json({'success': True, 'new_filename': new_name})
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
            return

        if path == '/api/project/file/move':
            data = self.read_json()
            proj = data.get('name', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado'})
                return
            src = data.get('src', '').strip()
            dest_folder = data.get('dest_folder', '').strip()
            if not src or src == 'main.tex' or '..' in src or '..' in dest_folder:
                self.send_json({'success': False, 'error': 'No se puede mover el archivo principal ni usar rutas relativas'})
                return
            proj_dir, src_full = resolve_safe_project_path(proj, src)
            if not proj_dir or not src_full or not os.path.exists(src_full):
                self.send_json({'success': False, 'error': 'El elemento de origen no existe'})
                return
            filename = os.path.basename(src)
            if dest_folder:
                _, dest_dir = resolve_safe_project_path(proj, dest_folder)
                if not dest_dir:
                    self.send_json({'success': False, 'error': 'Ruta de destino inválida'})
                    return
                dest_full = os.path.join(dest_dir, filename)
            else:
                dest_dir = proj_dir
                dest_full = os.path.join(proj_dir, filename)

            proj_abs = os.path.abspath(proj_dir)
            dest_abs = os.path.abspath(dest_full)
            src_abs = os.path.abspath(src_full)
            if not os.path.commonpath([proj_abs, dest_abs]) == proj_abs:
                self.send_json({'success': False, 'error': 'Ruta de destino inválida'})
                return
            if src_abs == dest_abs:
                self.send_json({'success': True, 'new_path': src, 'message': 'Ya está en esa ubicación'})
                return
            if os.path.isdir(src_abs) and dest_abs.startswith(src_abs + os.sep):
                self.send_json({'success': False, 'error': 'No se puede mover una carpeta dentro de sí misma'})
                return
            if os.path.exists(dest_abs):
                self.send_json({'success': False, 'error': f"Ya existe '{filename}' en la carpeta de destino"})
                return
            try:
                os.makedirs(dest_dir, exist_ok=True)
                shutil.move(src_full, dest_full)
                new_rel = f"{dest_folder}/{filename}" if dest_folder else filename
                self.send_json({'success': True, 'new_path': new_rel})
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
            return

        if path == '/api/project/compile':
            data = self.read_json()
            proj = data.get('name', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            code = data.get('code', '')
            req_file = data.get('file', 'main.tex')
            proj_dir, target_file_path = resolve_safe_project_path(proj, req_file)
            if not proj_dir:
                self.send_json({'success': False, 'log': 'Proyecto inválido'})
                return
            if not target_file_path:
                req_file = 'main.tex'
                _, target_file_path = resolve_safe_project_path(proj, req_file)

            os.makedirs(proj_dir, exist_ok=True)
            parent_d = os.path.dirname(target_file_path)
            if parent_d:
                os.makedirs(parent_d, exist_ok=True)
            with open(target_file_path, 'w', encoding='utf-8') as f:
                f.write(code)

            if not os.path.exists(COMPILER_EXE):
                self.send_json({'success': False, 'log': 'Error: Compilador Tectonic no encontrado en compiler/'})
                return

            compile_target = req_file
            has_docclass = r'\documentclass' in code
            if not has_docclass and req_file != 'main.tex':
                main_tex_path = os.path.join(proj_dir, 'main.tex')
                if os.path.exists(main_tex_path):
                    try:
                        with open(main_tex_path, 'r', encoding='utf-8', errors='ignore') as mf:
                            if r'\documentclass' in mf.read():
                                compile_target = 'main.tex'
                    except:
                        pass

            cmd = [COMPILER_EXE, '--synctex', compile_target]
            try:
                proc = subprocess.run(cmd, cwd=proj_dir, capture_output=True, text=True, timeout=90, creationflags=NO_WINDOW_FLAG)
                if proc.returncode == 0:
                    save_project_snapshot(proj_dir, req_file, code, label='Compilación exitosa ✓')
                    stem = os.path.splitext(compile_target)[0]
                    pdf_filename = f"{stem}.pdf"
                    self.send_json({
                        'success': True,
                        'pdf_url': f'/api/pdf?name={urllib.parse.quote(proj)}&file={urllib.parse.quote(pdf_filename)}',
                        'compiled_file': compile_target,
                        'pdf_file': pdf_filename
                    })
                else:
                    err_log = (proc.stderr or '') + '\n' + (proc.stdout or '')
                    err_line = extract_compiler_error_line(err_log)
                    self.send_json({'success': False, 'log': err_log, 'error_line': err_line})
            except subprocess.TimeoutExpired:
                self.send_json({'success': False, 'log': 'La compilación excedió el tiempo límite (90 segundos).'})
            except Exception as e:
                self.send_json({'success': False, 'log': str(e)})
            return

        if path == '/api/project/snapshot':
            data = self.read_json()
            proj = data.get('name', shared_project)
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            req_file = data.get('file', 'main.tex') or 'main.tex'
            code = data.get('code', '')
            label = data.get('label', 'Punto de restauración manual')
            proj_dir, _ = resolve_safe_project_path(proj, req_file)
            if not proj_dir:
                self.send_json({'success': False, 'error': 'Proyecto inválido'})
                return
            snap_id = save_project_snapshot(proj_dir, req_file, code, label=label)
            self.send_json({'success': bool(snap_id), 'id': snap_id})
            return

        if path == '/api/project/create':
            if is_guest:
                self.send_json({'success': False, 'error': 'Invitados no tienen permiso para crear proyectos'})
                return
            data = self.read_json()
            name = data.get('name', '').strip().replace(' ', '_')
            proj_dir, _ = resolve_safe_project_path(name)
            if not name or not proj_dir:
                self.send_json({'success': False, 'error': 'Nombre inválido'})
                return
            os.makedirs(proj_dir, exist_ok=True)
            
            template_id = data.get('template')
            if template_id:
                tpl_dir = os.path.join(TEMPLATES_DIR, template_id)
                if not os.path.exists(tpl_dir):
                    tpl_dir = os.path.join(USER_TEMPLATES_DIR, template_id)
                if os.path.exists(tpl_dir):
                    for item in os.listdir(tpl_dir):
                        s = os.path.join(tpl_dir, item)
                        d = os.path.join(proj_dir, item)
                        if os.path.isfile(s):
                            shutil.copy2(s, d)
            else:
                with open(os.path.join(proj_dir, 'main.tex'), 'w', encoding='utf-8') as f:
                    f.write('\\documentclass{article}\n\\begin{document}\nHola Mundo desde NaTex!\n\\end{document}')

            cfg = load_config()
            cfg['last_project'] = name
            save_config(cfg)
            self.send_json({'success': True, 'name': name})
            return

        if path == '/api/project/import_zip':
            if is_guest:
                self.send_json({'success': False, 'error': 'Invitados no tienen permiso para importar proyectos'})
                return
            data = self.read_json()
            raw_filename = data.get('filename', 'Proyecto_Importado.zip').strip()
            custom_proj_name = data.get('project_name', '').strip()
            b64data = data.get('data', '')
            if not b64data:
                self.send_json({'success': False, 'error': 'No se recibió contenido del archivo .zip'})
                return
            if ',' in b64data:
                b64data = b64data.split(',', 1)[1]

            base_name = custom_proj_name or os.path.splitext(os.path.basename(raw_filename))[0]
            clean_name = re.sub(r'[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]', '', base_name).strip().replace(' ', '_') or 'Proyecto_Importado'
            os.makedirs(PROJECTS_DIR, exist_ok=True)
            final_proj_name = clean_name
            counter = 1
            while os.path.exists(os.path.join(PROJECTS_DIR, final_proj_name)):
                final_proj_name = f"{clean_name}_{counter}"
                counter += 1

            proj_dir, _ = resolve_safe_project_path(final_proj_name)
            if not proj_dir:
                self.send_json({'success': False, 'error': 'Nombre de proyecto inválido'})
                return

            try:
                zip_bytes = base64.b64decode(b64data)
                with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as zf:
                    valid_members = [
                        m for m in zf.infolist()
                        if not m.is_dir()
                        and not m.filename.startswith('__MACOSX/')
                        and not os.path.basename(m.filename).startswith('.')
                        and '..' not in m.filename.replace('\\', '/').split('/')
                    ]
                    if not valid_members:
                        self.send_json({'success': False, 'error': 'El archivo .zip está vacío'})
                        return

                    # Detectar si todos los archivos están dentro de una única carpeta raíz para aplanarla
                    first_parts = set()
                    all_have_slash = True
                    for m in valid_members:
                        norm = m.filename.replace('\\', '/').strip('/')
                        if '/' in norm:
                            first_parts.add(norm.split('/', 1)[0])
                        else:
                            all_have_slash = False
                    strip_prefix = (list(first_parts)[0] + '/') if (all_have_slash and len(first_parts) == 1) else ''

                    os.makedirs(proj_dir, exist_ok=True)
                    extracted_count = 0
                    for m in valid_members:
                        norm_name = m.filename.replace('\\', '/').strip('/')
                        if strip_prefix and norm_name.startswith(strip_prefix):
                            norm_name = norm_name[len(strip_prefix):]
                        if not norm_name:
                            continue
                        _, dest_path = resolve_safe_project_path(final_proj_name, norm_name)
                        if not dest_path:
                            continue
                        parent_d = os.path.dirname(dest_path)
                        if parent_d:
                            os.makedirs(parent_d, exist_ok=True)
                        with zf.open(m) as src_f, open(dest_path, 'wb') as dst_f:
                            shutil.copyfileobj(src_f, dst_f)
                        extracted_count += 1

                # Garantizar que exista main.tex en la raíz del proyecto
                main_tex_path = os.path.join(proj_dir, 'main.tex')
                if not os.path.exists(main_tex_path):
                    root_tex_files = [f for f in os.listdir(proj_dir) if f.lower().endswith('.tex') and os.path.isfile(os.path.join(proj_dir, f))]
                    chosen_tex = None
                    for tf in root_tex_files:
                        try:
                            with open(os.path.join(proj_dir, tf), 'r', encoding='utf-8', errors='ignore') as f:
                                if r'\documentclass' in f.read():
                                    chosen_tex = tf
                                    break
                        except Exception:
                            pass
                    if not chosen_tex and root_tex_files:
                        chosen_tex = root_tex_files[0]
                    if chosen_tex:
                        shutil.copy2(os.path.join(proj_dir, chosen_tex), main_tex_path)
                    else:
                        with open(main_tex_path, 'w', encoding='utf-8') as f:
                            f.write('\\documentclass{article}\n\\begin{document}\nProyecto importado en NaTex.\n\\end{document}')

                cfg = load_config()
                cfg['last_project'] = final_proj_name
                save_config(cfg)
                self.send_json({'success': True, 'name': final_proj_name, 'files_count': extracted_count})
            except zipfile.BadZipFile:
                self.send_json({'success': False, 'error': 'El archivo seleccionado no es un archivo .zip válido'})
            except Exception as e:
                self.send_json({'success': False, 'error': f'Error al importar .zip: {str(e)}'})
            return

        if path == '/api/templates/apply':
            data = self.read_json()
            proj = data.get('project', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            template_id = data.get('template', '')
            if not template_id or '..' in template_id or '/' in template_id or '\\' in template_id:
                self.send_json({'success': False, 'error': 'Plantilla inválida'})
                return
            target_file = data.get('target_file', 'main.tex')
            mode = data.get('mode', 'replace')

            proj_dir, safe_target = resolve_safe_project_path(proj, target_file)
            if not proj_dir:
                self.send_json({'success': False, 'error': 'Proyecto inválido'})
                return
            if not safe_target:
                target_file = 'main.tex'

            tpl_dir = os.path.join(TEMPLATES_DIR, template_id)
            if not os.path.exists(tpl_dir):
                tpl_dir = os.path.join(USER_TEMPLATES_DIR, template_id)
            
            if os.path.exists(tpl_dir):
                os.makedirs(proj_dir, exist_ok=True)
                
                tpl_main_tex = os.path.join(tpl_dir, 'main.tex')
                code = ''
                if os.path.exists(tpl_main_tex):
                    with open(tpl_main_tex, 'r', encoding='utf-8', errors='ignore') as f:
                        code = f.read()

                if mode == 'new_file':
                    candidate_name = os.path.basename((data.get('new_filename') or f"{template_id}.tex").strip().replace(' ', '_'))
                    if not candidate_name.lower().endswith('.tex'):
                        candidate_name += '.tex'
                    base_stem, ext = os.path.splitext(candidate_name)
                    final_name = candidate_name
                    counter = 1
                    while os.path.exists(os.path.join(proj_dir, final_name)):
                        final_name = f"{base_stem}_{counter}{ext}"
                        counter += 1
                    target_file = final_name

                    for item in os.listdir(tpl_dir):
                        if item == 'main.tex':
                            continue
                        s = os.path.join(tpl_dir, item)
                        d = os.path.join(proj_dir, item)
                        if os.path.isfile(s) and not os.path.exists(d):
                            shutil.copy2(s, d)

                    target_path = os.path.join(proj_dir, target_file)
                    with open(target_path, 'w', encoding='utf-8') as f:
                        f.write(code)

                elif target_file == 'main.tex':
                    for item in os.listdir(tpl_dir):
                        s = os.path.join(tpl_dir, item)
                        d = os.path.join(proj_dir, item)
                        if os.path.isfile(s):
                            shutil.copy2(s, d)
                else:
                    for item in os.listdir(tpl_dir):
                        if item == 'main.tex':
                            continue
                        s = os.path.join(tpl_dir, item)
                        d = os.path.join(proj_dir, item)
                        if os.path.isfile(s) and not os.path.exists(d):
                            shutil.copy2(s, d)
                    
                    _, target_path = resolve_safe_project_path(proj, target_file)
                    with open(target_path, 'w', encoding='utf-8') as f:
                        f.write(code)

                self.send_json({'success': True, 'code': code, 'file': target_file})
            else:
                self.send_json({'success': False, 'error': 'Plantilla no encontrada'})
            return

        if path == '/api/templates/save':
            if is_guest:
                self.send_json({'success': False, 'error': 'Invitados no tienen permiso para guardar plantillas'})
                return
            data = self.read_json()
            proj = data.get('project', shared_project)
            name = os.path.basename(data.get('name', '').strip().replace(' ', '_'))
            if not name or '..' in name:
                self.send_json({'success': False, 'error': 'Nombre requerido'})
                return
            dest = os.path.join(USER_TEMPLATES_DIR, name)
            os.makedirs(dest, exist_ok=True)
            proj_dir, _ = resolve_safe_project_path(proj)
            if proj_dir and os.path.isdir(proj_dir):
                for item in os.listdir(proj_dir):
                    if item != 'main.pdf':
                        s = os.path.join(proj_dir, item)
                        d = os.path.join(dest, item)
                        if os.path.isfile(s):
                            shutil.copy2(s, d)
            self.send_json({'success': True})
            return

        if path == '/api/project/upload_base64':
            data = self.read_json()
            proj = data.get('project', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            filename = data.get('filename', 'imagen.png').strip()
            proj_dir, dest_file = resolve_safe_project_path(proj, filename)
            if not proj_dir:
                self.send_json({'success': False, 'error': 'Proyecto inválido'})
                return
            if not dest_file:
                filename = 'archivo.png'
                _, dest_file = resolve_safe_project_path(proj, filename)

            b64data = data.get('data', '')
            if ',' in b64data:
                b64data = b64data.split(',', 1)[1]
            
            parent_d = os.path.dirname(dest_file)
            if parent_d:
                os.makedirs(parent_d, exist_ok=True)
            else:
                os.makedirs(proj_dir, exist_ok=True)
            
            with open(dest_file, 'wb') as f:
                f.write(base64.b64decode(b64data))
            
            self.send_json({'success': True, 'filename': filename})
            return

        if path == '/api/project/asset/delete':
            data = self.read_json()
            proj = data.get('project', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            req_asset = data.get('filename', '').strip()
            _, dest_file = resolve_safe_project_path(proj, req_asset)
            if dest_file and os.path.isfile(dest_file) and os.path.basename(dest_file) != 'main.tex':
                os.remove(dest_file)
                self.send_json({'success': True})
            else:
                self.send_json({'success': False, 'error': 'No existe'})
            return

        if path == '/api/project/asset/rename':
            data = self.read_json()
            proj = data.get('project', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            old_rel = data.get('old_name', '').strip()
            new_base = os.path.basename(data.get('new_name', '').strip())

            if not old_rel or not new_base:
                self.send_json({'success': False, 'error': 'Nombres inválidos'})
                return

            old_ext = os.path.splitext(old_rel)[1].lower()
            new_ext = os.path.splitext(new_base)[1].lower()
            if not new_ext and old_ext:
                new_base = new_base + old_ext

            old_dir = os.path.dirname(old_rel)
            new_rel = f"{old_dir}/{new_base}" if old_dir else new_base

            proj_dir, old_path = resolve_safe_project_path(proj, old_rel)
            _, new_path = resolve_safe_project_path(proj, new_rel)

            if not proj_dir or not old_path or not new_path or not os.path.exists(old_path):
                self.send_json({'success': False, 'error': 'El archivo original no existe'})
                return

            if os.path.exists(new_path) and old_rel != new_rel:
                self.send_json({'success': False, 'error': 'Ya existe un archivo con ese nuevo nombre'})
                return

            try:
                os.rename(old_path, new_path)
                main_tex = os.path.join(proj_dir, 'main.tex')
                if os.path.exists(main_tex):
                    try:
                        with open(main_tex, 'r', encoding='utf-8') as f:
                            content = f.read()
                        if old_rel in content:
                            content = content.replace(old_rel, new_rel)
                            with open(main_tex, 'w', encoding='utf-8') as f:
                                f.write(content)
                    except Exception as tex_err:
                        print(f"[NaTex] Error actualizando referencias en main.tex: {tex_err}")
                self.send_json({'success': True, 'old_name': old_rel, 'new_name': new_rel})
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
            return

        if path == '/api/gemini' or path == '/api/ai/chat':
            data = self.read_json()
            prompt = data.get('prompt', '')
            if not prompt:
                self.send_json({'success': False, 'error': 'El mensaje está vacío.'})
                return
            cfg = load_config()
            system_prompt = data.get('system_prompt', None)
            ok, response_text = call_ai_service(prompt, system_prompt=system_prompt, cfg=cfg)
            if ok:
                self.send_json({'success': True, 'response': response_text, 'provider': cfg.get('ai_provider', 'gemini')})
            else:
                self.send_json({'success': False, 'error': response_text})
            return

        if path == '/api/voice/process':
            data = self.read_json()
            audio_base64 = data.get('audio_base64', '')
            mime_type = data.get('mime_type', 'audio/webm')
            title = data.get('title', '').strip()
            provided_key = data.get('gemini_api_key', '').strip()

            if not audio_base64:
                self.send_json({'success': False, 'error': 'No se recibió ningún audio grabado.'})
                return

            cfg = load_config()
            api_key = provided_key or cfg.get('gemini_api_key', '')
            if provided_key and not is_guest and provided_key != cfg.get('gemini_api_key', ''):
                cfg['gemini_api_key'] = provided_key
                save_config(cfg)

            if not api_key:
                self.send_json({'success': False, 'error': 'Falta la clave gratuita de Google Gemini. Por favor ingrésala para continuar.'})
                return

            # Sanitizar título o generar nombre del proyecto
            import datetime
            now_str = datetime.datetime.now().strftime("%Y-%m-%d_%H%M")
            if title:
                clean_title = re.sub(r'[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]', '', title).strip().replace(' ', '_')
                proj_name = f"Clase_{clean_title}" if not clean_title.startswith("Clase_") else clean_title
            else:
                proj_name = f"Clase_{now_str}"

            prompt_text = (
                "Eres un profesor universitario y asistente académico de élite, experto en transcripción y redacción de apuntes científicos en LaTeX.\n"
                "Escucha con atención este audio de una clase y elabora un documento LaTeX formal, completo, pulcro y listo para compilar.\n\n"
                "EL DOCUMENTO DEBE CONTENER ESTRICTAMENTE LAS SIGUIENTES 3 SECCIONES EN ESTE ORDEN:\n\n"
                "\\section{Transcripción Textual de la Clase}\n"
                "Transcribe de manera fiel y completa todo lo dicho en la grabación de la clase. "
                "Organiza el contenido en párrafos fluidos y bien puntuados. Cualquier fórmula, variable, constante, cálculo o teorema mencionado "
                "debe transcribirse a notación matemática LaTeX ($...$ o \\[ ... \\]).\n\n"
                "\\section{Temas Principales}\n"
                "Una lista ordenada con viñetas (utilizando el entorno \\begin{itemize} ... \\end{itemize}) con los temas centrales, "
                "conceptos clave, propiedades y definiciones abordadas en la clase.\n\n"
                "\\section{Resumen Detallado y Fórmulas}\n"
                "Escribe un resumen pedagógico, exhaustivo, riguroso y de alto nivel ('bien pulido') de los temas tratados. "
                "Desarrolla las explicaciones de forma clara, incluyendo teoremas, propiedades, ejemplos paso a paso y "
                "todas las fórmulas matemáticas destacadas en bloque (usando \\begin{equation} o \\begin{align*}).\n\n"
                "REGLAS TÉCNICAS OBLIGATORIAS:\n"
                "- Devuelve un documento LaTeX COMPLETO que comience con \\documentclass[11pt, a4paper]{article} e incluya los paquetes:\n"
                "  \\usepackage[utf8]{inputenc}, \\usepackage[spanish]{babel}, \\usepackage{amsmath, amssymb, amsthm}, \\usepackage{geometry}, \\usepackage{hyperref}, \\usepackage{xcolor}.\n"
                "- Asigna un \\title descriptivo según el tema de la clase, \\author{Apuntes de Clase - NaTex} y \\date{\\today}.\n"
                "- Incluye \\begin{document}, \\maketitle y concluye con \\end{document}.\n"
                "- NO uses bloques de comillas invertidas ni markdown (NO ```latex ni ```). Devuelve ÚNICAMENTE el código LaTeX puro."
            )

            clean_mime = mime_type.split(';')[0].strip() or 'audio/webm'

            url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}'
            payload = {
                'contents': [
                    {
                        'parts': [
                            {
                                'inlineData': {
                                    'mimeType': clean_mime,
                                    'data': audio_base64
                                }
                            },
                            {
                                'text': prompt_text
                            }
                        ]
                    }
                ]
            }

            latex_code = None
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urlopen_with_ssl_fallback(req, timeout=120) as resp:
                    res_data = json.loads(resp.read().decode('utf-8'))
                    raw_text = res_data['candidates'][0]['content']['parts'][0]['text']
                    clean = re.sub(r'^```latex\s*', '', raw_text.strip(), flags=re.IGNORECASE)
                    clean = re.sub(r'^```\s*', '', clean, flags=re.IGNORECASE)
                    clean = re.sub(r'```$', '', clean).strip()
                    latex_code = clean
            except urllib.error.HTTPError as e:
                err_msg = e.read().decode('utf-8', errors='ignore')
                self.send_json({'success': False, 'error': f'Error de Google Gemini (HTTP {e.code}): {err_msg}'})
                return
            except Exception as e:
                self.send_json({'success': False, 'error': f'Error al procesar con IA: {str(e)}'})
                return

            if not latex_code:
                self.send_json({'success': False, 'error': 'Gemini no devolvió texto.'})
                return

            proj_dir, _ = resolve_safe_project_path(proj_name)
            os.makedirs(proj_dir, exist_ok=True)
            tex_file = os.path.join(proj_dir, 'main.tex')
            with open(tex_file, 'w', encoding='utf-8') as f:
                f.write(latex_code)

            has_pdf = False
            if os.path.exists(COMPILER_EXE):
                cmd = [COMPILER_EXE, '--synctex', 'main.tex']
                try:
                    subprocess.run(cmd, cwd=proj_dir, capture_output=True, text=True, timeout=90, creationflags=NO_WINDOW_FLAG)
                    has_pdf = os.path.exists(os.path.join(proj_dir, 'main.pdf'))
                except Exception as comp_err:
                    print(f"[NaTex] Error compilando clase {proj_name}: {comp_err}")

            cfg['last_project'] = proj_name
            save_config(cfg)

            self.send_json({
                'success': True,
                'project': proj_name,
                'has_pdf': has_pdf,
                'pdf_url': f'/api/pdf?name={urllib.parse.quote(proj_name)}' if has_pdf else None,
                'code': latex_code
            })
            return

        if path == '/api/config':
            if is_guest:
                self.send_error(403, 'Ajustes no accesibles para invitados')
                return
            data = self.read_json()
            cfg = load_config()
            ai_keys = ['ai_provider', 'gemini_api_key', 'openai_api_key', 'claude_api_key', 'nvidia_api_key', 'ai_model', 'custom_api_url', 'custom_api_key']
            for k in ai_keys:
                if k in data:
                    cfg[k] = data[k]
            if 'theme' in data:
                cfg['theme'] = data['theme']
            if 'custom_color' in data:
                cfg['custom_color'] = data['custom_color']
            if 'language' in data:
                cfg['language'] = data['language']
            if 'auto_check_updates' in data:
                cfg['auto_check_updates'] = bool(data['auto_check_updates'])
            save_config(cfg)
            self.send_json({'success': True})
            return

        if path == '/api/system/apply_update':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return
            if not os.path.exists(os.path.join(BASE_DIR, '.git')):
                self.send_json({'success': False, 'error': 'Esta instalación no utiliza Git. Puedes descargar la nueva versión desde el botón de descarga.'})
                return
            try:
                res = subprocess.run(['git', 'pull', 'origin', 'main'], cwd=BASE_DIR, capture_output=True, text=True, timeout=30, creationflags=NO_WINDOW_FLAG)
                if res.returncode == 0:
                    self.send_json({'success': True, 'message': 'NaTex se actualizó correctamente desde GitHub. Recargando la aplicación...'})
                else:
                    self.send_json({'success': False, 'error': res.stderr or res.stdout or 'Error al ejecutar git pull'})
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
            return

        self.send_error(404, 'Ruta POST no encontrada')

    def serve_file(self, filepath, content_type):
        if not os.path.exists(filepath):
            self.send_error(404, 'Archivo no encontrado')
            return
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        with open(filepath, 'rb') as f:
            content = f.read()
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_json(self, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length).decode('utf-8')
        return json.loads(body)

def import_cli_path(arg_path):
    """Permite abrir un archivo .tex o carpeta de proyecto pasado como argumento al ejecutable."""
    if not arg_path or not os.path.exists(arg_path):
        return None
    os.makedirs(PROJECTS_DIR, exist_ok=True)
    abs_p = os.path.abspath(arg_path)
    if os.path.isfile(abs_p) and abs_p.lower().endswith('.tex'):
        stem = re.sub(r'[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]', '', os.path.splitext(os.path.basename(abs_p))[0]).strip().replace(' ', '_') or 'Documento_Externo'
        proj_dir = os.path.join(PROJECTS_DIR, stem)
        os.makedirs(proj_dir, exist_ok=True)
        shutil.copy2(abs_p, os.path.join(proj_dir, 'main.tex'))
        cfg = load_config()
        cfg['last_project'] = stem
        save_config(cfg)
        return stem
    elif os.path.isdir(abs_p):
        stem = re.sub(r'[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]', '', os.path.basename(abs_p)).strip().replace(' ', '_') or 'Proyecto_Externo'
        proj_dir = os.path.join(PROJECTS_DIR, stem)
        if os.path.abspath(proj_dir) != abs_p:
            shutil.copytree(abs_p, proj_dir, dirs_exist_ok=True)
        cfg = load_config()
        cfg['last_project'] = stem
        save_config(cfg)
        return stem
    return None

if __name__ == '__main__':
    os.chdir(BASE_DIR)
    try:
        if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

    cli_proj = None
    if len(sys.argv) > 1:
        cli_proj = import_cli_path(sys.argv[1])

    # Detección de instancia única: si el puerto 5000 ya tiene una instancia de NaTex activa, enfocarla y salir
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

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    try:
        httpd = socketserver.ThreadingTCPServer(("", PORT), NaTexHandler)
    except Exception as e:
        print(f"[NaTex] Error al vincular puerto {PORT}: {e}")
        sys.exit(1)

    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    url = f'http://localhost:{PORT}'
    print(f'[NaTex] Servidor activo en {url}')

    # Iniciar en ventana nativa independiente de escritorio
    opened_native = False
    try:
        import webview
        print('[NaTex] Abriendo ventana nativa de escritorio independiente...')
        native_window = webview.create_window(
            title='NaTex Studio',
            url=url,
            width=1420,
            height=900,
            min_size=(1050, 680),
            background_color='#0E1015'
        )
        gui_backend = 'edgechromium' if sys.platform == 'win32' else None
        webview.start(gui=gui_backend, debug=False)
        opened_native = True
    except Exception as e:
        print(f'[NaTex] Modo ventana nativa no disponible ({e}), usando navegador...')
        webbrowser.open(url)
        # Iniciar watchdog de cierre automático de pestaña sólo si está en navegador
        threading.Thread(target=watchdog_thread, daemon=True).start()
        while True:
            time.sleep(1)

    server_shutting_down = True
    cleanup_tunnel()
    os._exit(0)

