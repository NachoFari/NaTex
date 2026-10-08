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
COMPILER_EXE = os.path.join(BASE_DIR, 'compiler', 'tectonic.exe')
CLOUDFLARED_EXE = os.path.join(BASE_DIR, 'tools', 'cloudflared.exe')
CONFIG_FILE = os.path.join(BASE_DIR, 'config.json')

DEFAULT_CONFIG = {
    'gemini_api_key': '',
    'last_project': 'Mi_Primer_Documento',
    'theme': 'dark',
    'custom_color': '#FF6B35',
    'language': 'es',
    'auto_check_updates': True
}

tunnel_proc = None
tunnel_url = None
shared_project = 'Mi_Primer_Documento'

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

    # Cerrar cualquier cloudflared previo de forma silenciosa sin consola
    try:
        subprocess.run(['taskkill', '/F', '/IM', 'cloudflared.exe'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=NO_WINDOW_FLAG)
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

class NaTexHandler(http.server.SimpleHTTPRequestHandler):
    def is_external_guest(self):
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
            file_path = os.path.join(BASE_DIR, 'static', rel_path)
            mime, _ = mimetypes.guess_type(file_path)
            self.serve_file(file_path, mime or 'application/octet-stream')
            return

        if path == '/api/projects':
            if is_guest:
                # El invitado NUNCA ve la lista de los otros proyectos
                self.send_json({'projects': [shared_project], 'current': shared_project})
                return
            projects = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
            cfg = load_config()
            self.send_json({'projects': projects, 'current': cfg.get('last_project', 'Mi_Primer_Documento')})
            return

        if path == '/api/projects/details':
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
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso no autorizado al proyecto')
                return

            proj_dir = os.path.join(PROJECTS_DIR, proj)
            tex_file = os.path.join(proj_dir, 'main.tex')
            
            code = ''
            mtime = 0
            if os.path.exists(tex_file):
                mtime = os.path.getmtime(tex_file)
                with open(tex_file, 'r', encoding='utf-8', errors='ignore') as f:
                    code = f.read()
            
            files = []
            if os.path.exists(proj_dir):
                for f in os.listdir(proj_dir):
                    if f != 'main.tex' and not f.endswith('.pdf'):
                        files.append(f)

            has_pdf = os.path.exists(os.path.join(proj_dir, 'main.pdf'))
            if not is_guest:
                cfg = load_config()
                cfg['last_project'] = proj
                save_config(cfg)
            self.send_json({'success': True, 'name': proj, 'code': code, 'mtime': mtime, 'files': files, 'has_pdf': has_pdf})
            return

        if path == '/api/project/check_update':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [shared_project])[0]
            if is_guest and proj != shared_project:
                self.send_error(403, 'Acceso denegado')
                return

            since = float(qs.get('since', [0])[0])
            proj_dir = os.path.join(PROJECTS_DIR, proj)
            tex_file = os.path.join(proj_dir, 'main.tex')
            
            if os.path.exists(tex_file):
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

            pdf_path = os.path.join(PROJECTS_DIR, proj, 'main.pdf')
            if os.path.exists(pdf_path):
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

            filename = os.path.basename(qs.get('file', [''])[0])
            asset_path = os.path.join(PROJECTS_DIR, proj, filename)
            if os.path.exists(asset_path):
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
                        for f in sorted(os.listdir(p_dir)):
                            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif')):
                                f_path = os.path.join(p_dir, f)
                                try:
                                    stat = os.stat(f_path)
                                    images.append({
                                        'project': p,
                                        'filename': f,
                                        'size': stat.st_size,
                                        'mtime': stat.st_mtime,
                                        'url': f'/api/project/asset?name={urllib.parse.quote(p)}&file={urllib.parse.quote(f)}'
                                    })
                                except Exception:
                                    pass
            self.send_json({'success': True, 'images': images})
            return

        if path == '/api/system/check_update':
            CURRENT_VERSION = "0.1"
            is_git = os.path.exists(os.path.join(BASE_DIR, '.git'))
            try:
                ctx = ssl._create_unverified_context()
                req = urllib.request.Request(
                    'https://api.github.com/repos/NachoFari/NaTex/releases/latest',
                    headers={'User-Agent': 'NaTex-Studio'}
                )
                with urllib.request.urlopen(req, context=ctx, timeout=8) as resp:
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
                        'current_version': 'v0.1',
                        'latest_version': rel_data.get('tag_name', 'v0.1'),
                        'has_update': has_update,
                        'release_name': rel_data.get('name', ''),
                        'release_notes': rel_data.get('body', ''),
                        'download_url': 'https://github.com/NachoFari/NaTex/releases/latest/download/NaTex-Setup-v0.1.exe',
                        'releases_page': 'https://github.com/NachoFari/NaTex/releases',
                        'is_git_repo': is_git
                    })
                    return
            except Exception as e:
                self.send_json({
                    'success': False,
                    'error': f'No se pudo conectar con GitHub: {str(e)}',
                    'current_version': 'v0.1',
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
            synctex_path = os.path.join(PROJECTS_DIR, proj, 'main.synctex.gz')
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
            synctex_path = os.path.join(PROJECTS_DIR, proj, 'main.synctex.gz')
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
            global last_heartbeat_time
            with heartbeat_lock:
                last_heartbeat_time = time.time()
            self.send_json({'status': 'alive'})
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
            tex_file = os.path.join(PROJECTS_DIR, proj, 'main.tex')
            if not os.path.exists(tex_file):
                self.send_error(404, 'Archivo no encontrado')
                return
            self.send_response(200)
            self.send_header('Content-Type', 'text/x-tex; charset=utf-8')
            self.send_header('Content-Disposition', f'attachment; filename="{urllib.parse.quote(proj)}.tex"')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            with open(tex_file, 'rb') as f:
                content = f.read()
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        if path == '/api/config':
            if is_guest:
                self.send_error(403, 'Ajustes no accesibles para invitados')
                return
            cfg = load_config()
            self.send_json({
                'gemini_api_key': cfg.get('gemini_api_key', ''),
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
            goodbye_time = time.time()
            def shutdown_soon():
                time.sleep(4.0)
                with heartbeat_lock:
                    if last_heartbeat_time < goodbye_time:
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
            code = data.get('code', '')
            proj_dir = os.path.join(PROJECTS_DIR, proj)
            os.makedirs(proj_dir, exist_ok=True)
            tex_file = os.path.join(proj_dir, 'main.tex')
            with open(tex_file, 'w', encoding='utf-8') as f:
                f.write(code)
            mtime = os.path.getmtime(tex_file)
            self.send_json({'success': True, 'mtime': mtime})
            return

        if path == '/api/project/compile':
            data = self.read_json()
            proj = data.get('name', shared_project)
            if is_guest and proj != shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            code = data.get('code', '')
            proj_dir = os.path.join(PROJECTS_DIR, proj)
            os.makedirs(proj_dir, exist_ok=True)
            
            with open(os.path.join(proj_dir, 'main.tex'), 'w', encoding='utf-8') as f:
                f.write(code)

            if not os.path.exists(COMPILER_EXE):
                self.send_json({'success': False, 'log': 'Error: tectonic.exe no encontrado en compiler/'})
                return

            cmd = [COMPILER_EXE, '--synctex', 'main.tex']
            try:
                proc = subprocess.run(cmd, cwd=proj_dir, capture_output=True, text=True, timeout=90, creationflags=NO_WINDOW_FLAG)
                if proc.returncode == 0:
                    self.send_json({'success': True, 'pdf_url': f'/api/pdf?name={urllib.parse.quote(proj)}'})
                else:
                    err_log = (proc.stderr or '') + '\n' + (proc.stdout or '')
                    self.send_json({'success': False, 'log': err_log})
            except subprocess.TimeoutExpired:
                self.send_json({'success': False, 'log': 'La compilación excedió el tiempo límite (90 segundos).'})
            except Exception as e:
                self.send_json({'success': False, 'log': str(e)})
            return

        if path == '/api/project/create':
            if is_guest:
                self.send_json({'success': False, 'error': 'Invitados no tienen permiso para crear proyectos'})
                return
            data = self.read_json()
            name = data.get('name', '').strip().replace(' ', '_')
            if not name:
                self.send_json({'success': False, 'error': 'Nombre invalido'})
                return
            proj_dir = os.path.join(PROJECTS_DIR, name)
            os.makedirs(proj_dir, exist_ok=True)
            
            template_id = data.get('template')
            if template_id:
                tpl_dir = os.path.join(TEMPLATES_DIR, template_id)
                if not os.path.exists(tpl_dir):
                    tpl_dir = os.path.join(USER_TEMPLATES_DIR, template_id)
                if os.path.exists(tpl_dir):
                    import shutil
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

        if path == '/api/templates/apply':
            data = self.read_json()
            proj = data.get('project', 'Mi_Primer_Documento')
            template_id = data.get('template')
            tpl_dir = os.path.join(TEMPLATES_DIR, template_id)
            if not os.path.exists(tpl_dir):
                tpl_dir = os.path.join(USER_TEMPLATES_DIR, template_id)
            
            if os.path.exists(tpl_dir):
                import shutil
                proj_dir = os.path.join(PROJECTS_DIR, proj)
                for item in os.listdir(tpl_dir):
                    s = os.path.join(tpl_dir, item)
                    d = os.path.join(proj_dir, item)
                    if os.path.isfile(s):
                        shutil.copy2(s, d)
                
                tex_file = os.path.join(proj_dir, 'main.tex')
                code = ''
                if os.path.exists(tex_file):
                    with open(tex_file, 'r', encoding='utf-8', errors='ignore') as f:
                        code = f.read()
                self.send_json({'success': True, 'code': code})
            else:
                self.send_json({'success': False, 'error': 'Plantilla no encontrada'})
            return

        if path == '/api/templates/save':
            if is_guest:
                self.send_json({'success': False, 'error': 'Invitados no tienen permiso para guardar plantillas'})
                return
            data = self.read_json()
            proj = data.get('project', shared_project)
            name = data.get('name', '').strip().replace(' ', '_')
            if not name:
                self.send_json({'success': False, 'error': 'Nombre requerido'})
                return
            dest = os.path.join(USER_TEMPLATES_DIR, name)
            os.makedirs(dest, exist_ok=True)
            proj_dir = os.path.join(PROJECTS_DIR, proj)
            import shutil
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
            filename = data.get('filename', 'imagen.png')
            b64data = data.get('data', '')
            
            if ',' in b64data:
                b64data = b64data.split(',', 1)[1]
            
            proj_dir = os.path.join(PROJECTS_DIR, proj)
            os.makedirs(proj_dir, exist_ok=True)
            dest_file = os.path.join(proj_dir, filename)
            
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
            filename = os.path.basename(data.get('filename', ''))
            dest_file = os.path.join(PROJECTS_DIR, proj, filename)
            if os.path.exists(dest_file):
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
            old_name = os.path.basename(data.get('old_name', '').strip())
            new_name = os.path.basename(data.get('new_name', '').strip())

            if not old_name or not new_name:
                self.send_json({'success': False, 'error': 'Nombres inválidos'})
                return

            old_ext = os.path.splitext(old_name)[1].lower()
            new_ext = os.path.splitext(new_name)[1].lower()
            if not new_ext and old_ext:
                new_name = new_name + old_ext

            proj_dir = os.path.join(PROJECTS_DIR, proj)
            old_path = os.path.join(proj_dir, old_name)
            new_path = os.path.join(proj_dir, new_name)

            if not os.path.exists(old_path):
                self.send_json({'success': False, 'error': 'El archivo original no existe'})
                return

            if os.path.exists(new_path) and old_name != new_name:
                self.send_json({'success': False, 'error': 'Ya existe un archivo con ese nuevo nombre'})
                return

            try:
                os.rename(old_path, new_path)
                # Actualizar referencias en main.tex
                main_tex = os.path.join(proj_dir, 'main.tex')
                if os.path.exists(main_tex):
                    try:
                        with open(main_tex, 'r', encoding='utf-8') as f:
                            content = f.read()
                        if old_name in content:
                            content = content.replace(old_name, new_name)
                            with open(main_tex, 'w', encoding='utf-8') as f:
                                f.write(content)
                    except Exception as tex_err:
                        print(f"[NaTex] Error actualizando referencias en main.tex: {tex_err}")
                self.send_json({'success': True, 'old_name': old_name, 'new_name': new_name})
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
            return

        if path == '/api/gemini':
            data = self.read_json()
            prompt = data.get('prompt', '')
            cfg = load_config()
            api_key = cfg.get('gemini_api_key', '')

            if not api_key:
                self.send_json({'success': False, 'error': 'No hay API Key configurada. Puedes agregar tu clave gratuita en el botón Ajustes.'})
                return

            url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}'
            payload = {
                'contents': [
                    {
                        'parts': [
                            {'text': 'Eres el asistente inteligente de NaTex, un editor de LaTeX ágil y moderno. Responde siempre de manera concisa, clara, con ejemplos en LaTeX listos para copiar, y con tono amigable pero profesional.\n\nUsuario: ' + prompt}
                        ]
                    }
                ]
            }

            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            try:
                req = urllib.request.Request(
                    url, 
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
                    res_data = json.loads(resp.read().decode('utf-8'))
                    text = res_data['candidates'][0]['content']['parts'][0]['text']
                    self.send_json({'success': True, 'response': text})
            except urllib.error.HTTPError as e:
                err_msg = e.read().decode('utf-8', errors='ignore')
                self.send_json({'success': False, 'error': f'Error de Google Gemini (HTTP {e.code}): {err_msg}'})
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
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
            if provided_key and provided_key != cfg.get('gemini_api_key', ''):
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

            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            latex_code = None
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, context=ctx, timeout=120) as resp:
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

            proj_dir = os.path.join(PROJECTS_DIR, proj_name)
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
            if 'gemini_api_key' in data:
                cfg['gemini_api_key'] = data['gemini_api_key']
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

if __name__ == '__main__':
    os.chdir(BASE_DIR)
    try:
        if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

    # Iniciar watchdog de cierre automático de pestaña
    threading.Thread(target=watchdog_thread, daemon=True).start()

    print('==================================================')
    print('             [NaTex] Servidor Local               ')
    print('==================================================')
    print(f'Abriendo http://localhost:{PORT}')
    threading.Timer(0.8, lambda: webbrowser.open(f'http://localhost:{PORT}')).start()

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    try:
        with socketserver.ThreadingTCPServer(("", PORT), NaTexHandler) as httpd:
            httpd.serve_forever()
    except Exception as e:
        print(f"[NaTex] Error en servidor: {e}")
