# -*- coding: utf-8 -*-
"""HTTP request handler for NaTex Studio REST API and static assets."""

import os
import json
import time
import mimetypes
import threading
import webbrowser
import urllib.parse
import http.server
import core.config
from core.constants import (
    BASE_DIR,
    STATIC_DIR,
    PROJECTS_DIR,
    PORT,
    get_local_ip,
)
from core.config import (
    load_config,
    save_config,
    update_heartbeat,
)
from services.compiler_service import compile_project_file
from services.synctex_service import synctex_forward, synctex_inverse
from services.project_service import (
    resolve_safe_project_path,
    save_project_snapshot,
    list_project_snapshots,
    get_project_snapshot,
    get_project_details_list,
    load_project_file,
    save_project_file,
    create_project_file,
    delete_project_file,
    rename_project_file,
    move_project_file,
    create_project,
    list_templates,
    apply_template,
    save_user_template,
    export_project_zip,
    import_project_zip,
    get_gallery_images,
    upload_base64_asset,
    delete_asset,
    rename_asset,
)
from services.ai_service import call_ai_service, process_voice_dictation
from services.tunnel_service import cleanup_tunnel, start_tunnel_thread, restart_tunnel
from services.updater_service import check_github_update, apply_git_update

class NaTexHandler(http.server.SimpleHTTPRequestHandler):
    """Manejador central HTTP que implementa la API REST y sirve assets estáticos."""

    def is_external_guest(self):
        """Determina si la petición proviene de un usuario invitado externo a través de Cloudflare."""
        if self.headers.get('Cf-Connecting-Ip') or self.headers.get('Cf-Ray') or self.headers.get('X-Forwarded-For'):
            return True
        host = self.headers.get('Host', '').split(':')[0].lower()
        return host not in ('localhost', '127.0.0.1')

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        is_guest = self.is_external_guest()

        if path == '/' or path == '/index.html':
            if is_guest:
                qs = urllib.parse.parse_qs(parsed.query)
                current_p = qs.get('p', [''])[0]
                if current_p != core.config.shared_project:
                    self.send_response(302)
                    self.send_header('Location', f'/?p={urllib.parse.quote(core.config.shared_project)}')
                    self.end_headers()
                    return
            self.serve_file(os.path.join(STATIC_DIR, 'index.html'), 'text/html; charset=utf-8')
            return

        if path == '/voice' or path == '/voice.html':
            self.serve_file(os.path.join(STATIC_DIR, 'voice.html'), 'text/html; charset=utf-8')
            return

        if path == '/api/voice/status':
            cfg = load_config()
            self.send_json({
                'has_gemini_key': bool(cfg.get('gemini_api_key')),
                'tunnel_url': core.config.tunnel_url,
                'local_ip': get_local_ip(),
                'port': PORT,
                'current_project': cfg.get('last_project', 'Mi_Primer_Documento')
            })
            return

        if path.startswith('/static/'):
            rel_path = path[len('/static/'):].replace('/', os.sep)
            static_root = os.path.abspath(STATIC_DIR)
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
                self.send_json({'projects': [core.config.shared_project], 'current': core.config.shared_project})
                return
            os.makedirs(PROJECTS_DIR, exist_ok=True)
            projects = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
            cfg = load_config()
            self.send_json({'projects': projects, 'current': cfg.get('last_project', 'Mi_Primer_Documento')})
            return

        if path == '/api/projects/details':
            os.makedirs(PROJECTS_DIR, exist_ok=True)
            if is_guest:
                projs = [core.config.shared_project]
            else:
                projs = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
            details = get_project_details_list(projs)
            cfg = load_config()
            self.send_json({'projects': details, 'current': cfg.get('last_project', 'Mi_Primer_Documento')})
            return

        if path == '/api/project/load':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [core.config.shared_project])[0]
            req_file = qs.get('file', ['main.tex'])[0]
            if is_guest and proj != core.config.shared_project:
                self.send_error(403, 'Acceso no autorizado al proyecto')
                return

            ok, err, data = load_project_file(proj, req_file)
            if not ok:
                self.send_error(400, err or 'Proyecto inválido')
                return

            if not is_guest:
                cfg = load_config()
                cfg['last_project'] = proj
                save_config(cfg)
            self.send_json(data)
            return

        if path == '/api/project/check_update':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
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
            proj = qs.get('name', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
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
                if qs.get('download', [''])[0] == '1':
                    filename = f"{proj}_{os.path.basename(pdf_path)}"
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/pdf')
                    self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
                    self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    with open(pdf_path, 'rb') as f:
                        content = f.read()
                    self.send_header('Content-Length', str(len(content)))
                    self.end_headers()
                    self.wfile.write(content)
                else:
                    self.serve_file(pdf_path, 'application/pdf')
            else:
                self.send_error(404, 'PDF aun no compilado')
            return

        if path == '/api/pdf/info':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
                self.send_error(403, 'Acceso denegado al PDF')
                return

            req_pdf = qs.get('file', ['main.pdf'])[0]
            if not req_pdf.lower().endswith('.pdf'):
                req_pdf = os.path.splitext(req_pdf)[0] + '.pdf'

            _, pdf_path = resolve_safe_project_path(proj, req_pdf)
            if not pdf_path or not os.path.exists(pdf_path):
                _, main_pdf = resolve_safe_project_path(proj, 'main.pdf')
                if main_pdf and os.path.exists(main_pdf):
                    pdf_path = main_pdf

            if not pdf_path or not os.path.exists(pdf_path):
                self.send_json({'success': False, 'error': 'PDF aun no compilado'})
                return

            try:
                import sys, glob
                try:
                    import pymupdf
                except ImportError:
                    local_app = os.environ.get('LOCALAPPDATA', '')
                    for sp in glob.glob(os.path.join(local_app, 'Programs', 'Python', 'Python3*', 'Lib', 'site-packages')):
                        if sp not in sys.path:
                            sys.path.append(sp)
                    import pymupdf
                doc = pymupdf.open(pdf_path)
                pages_meta = []
                for idx in range(len(doc)):
                    rect = doc[idx].rect
                    pages_meta.append({
                        'page': idx + 1,
                        'width': round(rect.width, 2),
                        'height': round(rect.height, 2)
                    })
                doc.close()
                self.send_json({
                    'success': True,
                    'page_count': len(pages_meta),
                    'pages': pages_meta,
                    'mtime': os.path.getmtime(pdf_path)
                })
            except Exception as e:
                self.send_json({'success': False, 'error': str(e)})
            return

        if path == '/api/pdf/page_image':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
                self.send_error(403, 'Acceso denegado al PDF')
                return

            req_pdf = qs.get('file', ['main.pdf'])[0]
            if not req_pdf.lower().endswith('.pdf'):
                req_pdf = os.path.splitext(req_pdf)[0] + '.pdf'

            _, pdf_path = resolve_safe_project_path(proj, req_pdf)
            if not pdf_path or not os.path.exists(pdf_path):
                _, main_pdf = resolve_safe_project_path(proj, 'main.pdf')
                if main_pdf and os.path.exists(main_pdf):
                    pdf_path = main_pdf

            if not pdf_path or not os.path.exists(pdf_path):
                self.send_error(404, 'PDF aun no compilado')
                return

            try:
                import sys, glob
                try:
                    import pymupdf
                except ImportError:
                    local_app = os.environ.get('LOCALAPPDATA', '')
                    for sp in glob.glob(os.path.join(local_app, 'Programs', 'Python', 'Python3*', 'Lib', 'site-packages')):
                        if sp not in sys.path:
                            sys.path.append(sp)
                    import pymupdf
                page_num = max(1, int(qs.get('page', ['1'])[0]))
                dpi = max(96, min(260, int(qs.get('dpi', ['170'])[0])))
                doc = pymupdf.open(pdf_path)
                idx = min(len(doc) - 1, page_num - 1)
                pix = doc[idx].get_pixmap(dpi=dpi, alpha=False)
                png_bytes = pix.tobytes('png')
                doc.close()
                self.send_response(200)
                self.send_header('Content-Type', 'image/png')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Content-Length', str(len(png_bytes)))
                self.end_headers()
                self.wfile.write(png_bytes)
            except Exception as e:
                self.send_error(500, f'Error al renderizar pagina PDF: {e}')
            return

        if path == '/api/project/asset':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
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
            target_projects = [core.config.shared_project] if is_guest else sorted(os.listdir(PROJECTS_DIR)) if os.path.exists(PROJECTS_DIR) else []
            images = get_gallery_images(target_projects)
            self.send_json({'success': True, 'images': images})
            return

        if path == '/api/system/check_update':
            res = check_github_update()
            self.send_json(res)
            return

        if path == '/api/templates':
            built_in, user_t = list_templates(is_guest=is_guest)
            self.send_json({'built_in': built_in, 'user': user_t})
            return

        if path == '/api/tunnel/start':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return

            qs = urllib.parse.parse_qs(parsed.query)
            req_proj = qs.get('project', [''])[0]
            if req_proj:
                core.config.set_shared_project(req_proj)

            if not core.config.tunnel_url:
                url = start_tunnel_thread()
            else:
                url = core.config.tunnel_url
            if url:
                self.send_json({'success': True, 'url': url})
            else:
                self.send_json({'success': False, 'error': 'No se pudo iniciar el túnel de conexión.'})
            return

        if path == '/api/tunnel/status':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return
            self.send_json({'active': core.config.tunnel_url is not None, 'url': core.config.tunnel_url})
            return

        if path == '/api/synctex/forward':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('project', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            line = int(qs.get('line', [1])[0])
            req_file = qs.get('file', ['main.tex'])[0]
            ok, err, page = synctex_forward(proj, req_file, line)
            if not ok:
                self.send_error(400, err or 'Proyecto inválido')
                return
            self.send_json({'success': True, 'page': page})
            return

        if path == '/api/synctex/inverse':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('project', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            page = int(qs.get('page', [1])[0])
            x = float(qs.get('x', [0])[0])
            y = float(qs.get('y', [0])[0])
            req_file = qs.get('file', ['main.tex'])[0]
            ok, err, line = synctex_inverse(proj, req_file, page, x, y)
            if ok:
                self.send_json({'success': True, 'line': line})
            else:
                self.send_json({'success': False, 'error': err})
            return

        if path == '/api/system/heartbeat':
            if not is_guest:
                update_heartbeat()
            self.send_json({
                'status': 'shutting_down' if (core.config.server_shutting_down and is_guest) else 'alive',
                'is_guest': is_guest,
                'project': core.config.shared_project
            })
            return

        if path == '/api/system/focus':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return
            qs = urllib.parse.parse_qs(parsed.query)
            open_proj = qs.get('project', [''])[0]
            if core.config.native_window is not None:
                try:
                    if open_proj:
                        core.config.native_window.load_url(f'http://localhost:{PORT}/?p={urllib.parse.quote(open_proj)}')
                    core.config.native_window.restore()
                    core.config.native_window.show()
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
            qs = urllib.parse.parse_qs(parsed.query)
            req_proj = qs.get('project', [''])[0]
            if req_proj:
                core.config.set_shared_project(req_proj)
            url = restart_tunnel()
            if url:
                self.send_json({'success': True, 'url': url})
            else:
                self.send_json({'success': False, 'error': 'No se pudo reiniciar el túnel de conexión.'})
            return

        if path == '/api/project/download_tex':
            qs = urllib.parse.parse_qs(parsed.query)
            proj = qs.get('name', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
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
            proj = qs.get('name', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            zip_bytes = export_project_zip(proj)
            if zip_bytes is None:
                self.send_error(404, 'Proyecto no encontrado')
                return
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
            proj = qs.get('name', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
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
            proj = qs.get('name', [core.config.shared_project])[0]
            if is_guest and proj != core.config.shared_project:
                self.send_error(403, 'Acceso no autorizado')
                return
            snap_id = qs.get('id', [''])[0]
            proj_dir, _ = resolve_safe_project_path(proj)
            if not proj_dir or not snap_id:
                self.send_json({'success': False, 'error': 'Snapshot inválido'})
                return
            obj = get_project_snapshot(proj_dir, snap_id)
            if obj is not None:
                self.send_json({'success': True, 'snapshot': obj})
            else:
                self.send_json({'success': False, 'error': 'Snapshot no encontrado'})
            return

        if path == '/api/config':
            cfg = load_config()
            if is_guest:
                self.send_json({
                    'ai_provider': cfg.get('ai_provider', 'gemini'),
                    'theme': cfg.get('theme', 'dark'),
                    'custom_color': cfg.get('custom_color', '#FF6B35'),
                    'language': cfg.get('language', 'es'),
                    'auto_check_updates': False,
                    'word_wrap': cfg.get('word_wrap', True),
                    'theme_effects': cfg.get('theme_effects', True),
                    'theme_effects_frequency': cfg.get('theme_effects_frequency', 100),
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
                'auto_check_updates': cfg.get('auto_check_updates', True),
                'word_wrap': cfg.get('word_wrap', True),
                'theme_effects': cfg.get('theme_effects', True),
                'theme_effects_frequency': cfg.get('theme_effects_frequency', 100),
                'is_guest': False
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
            if core.config.native_window is not None:
                self.send_json({'status': 'native_alive'})
                return
            goodbye_time = time.time()
            def shutdown_soon():
                time.sleep(3.0)
                with core.config.heartbeat_lock:
                    if core.config.last_heartbeat_time < goodbye_time:
                        core.config.server_shutting_down = True
                        cleanup_tunnel()
                        os._exit(0)
            threading.Thread(target=shutdown_soon, daemon=True).start()
            self.send_json({'status': 'bye'})
            return

        if path == '/api/project/save':
            data = self.read_json()
            proj = data.get('name', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            req_file = data.get('file', 'main.tex')
            code = data.get('code', '')
            ok, final_file, mtime = save_project_file(proj, req_file, code)
            if ok:
                self.send_json({'success': True, 'mtime': mtime, 'file': final_file})
            else:
                self.send_json({'success': False, 'error': final_file})
            return

        if path == '/api/project/file/create':
            data = self.read_json()
            proj = data.get('name', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado'})
                return
            filename = data.get('filename', '').strip()
            is_folder = data.get('is_folder', False)
            ok, res = create_project_file(proj, filename, is_folder)
            if ok:
                self.send_json({'success': True, 'filename': res})
            else:
                self.send_json({'success': False, 'error': res})
            return

        if path == '/api/project/file/delete':
            data = self.read_json()
            proj = data.get('name', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado'})
                return
            filename = data.get('filename', '').strip()
            ok, err = delete_project_file(proj, filename)
            if ok:
                self.send_json({'success': True})
            else:
                self.send_json({'success': False, 'error': err})
            return

        if path == '/api/project/file/rename':
            data = self.read_json()
            proj = data.get('name', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado'})
                return
            old_name = data.get('old_filename', '').strip()
            new_name = data.get('new_filename', '').strip()
            ok, res = rename_project_file(proj, old_name, new_name)
            if ok:
                self.send_json({'success': True, 'new_filename': res})
            else:
                self.send_json({'success': False, 'error': res})
            return

        if path == '/api/project/file/move':
            data = self.read_json()
            proj = data.get('name', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado'})
                return
            src = data.get('src', '').strip()
            dest_folder = data.get('dest_folder', '').strip()
            ok, err, new_path = move_project_file(proj, src, dest_folder)
            if ok:
                res_obj = {'success': True, 'new_path': new_path}
                if err:  # e.g. 'Ya está en esa ubicación'
                    res_obj['message'] = err
                self.send_json(res_obj)
            else:
                self.send_json({'success': False, 'error': err})
            return

        if path == '/api/project/compile':
            data = self.read_json()
            proj = data.get('name', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            code = data.get('code', '')
            req_file = data.get('file', 'main.tex')
            res = compile_project_file(proj, req_file, code)
            self.send_json(res)
            return

        if path == '/api/project/snapshot':
            data = self.read_json()
            proj = data.get('name', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
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
            name = data.get('name', '')
            template_id = data.get('template')
            ok, res = create_project(name, template_id)
            if ok:
                self.send_json({'success': True, 'name': res})
            else:
                self.send_json({'success': False, 'error': res})
            return

        if path == '/api/project/import_zip':
            if is_guest:
                self.send_json({'success': False, 'error': 'Invitados no tienen permiso para importar proyectos'})
                return
            data = self.read_json()
            raw_filename = data.get('filename', 'Proyecto_Importado.zip')
            custom_proj_name = data.get('project_name', '')
            b64data = data.get('data', '')
            ok, res, count = import_project_zip(raw_filename, custom_proj_name, b64data)
            if ok:
                self.send_json({'success': True, 'name': res, 'files_count': count})
            else:
                self.send_json({'success': False, 'error': res})
            return

        if path == '/api/templates/apply':
            data = self.read_json()
            proj = data.get('project', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            template_id = data.get('template', '')
            target_file = data.get('target_file', 'main.tex')
            mode = data.get('mode', 'replace')
            new_filename = data.get('new_filename')
            ok, err, code, applied_file = apply_template(proj, template_id, target_file, mode, new_filename)
            if ok:
                self.send_json({'success': True, 'code': code, 'file': applied_file})
            else:
                self.send_json({'success': False, 'error': err})
            return

        if path == '/api/templates/save':
            if is_guest:
                self.send_json({'success': False, 'error': 'Invitados no tienen permiso para guardar plantillas'})
                return
            data = self.read_json()
            proj = data.get('project', core.config.shared_project)
            name = data.get('name', '')
            ok, err = save_user_template(proj, name)
            if ok:
                self.send_json({'success': True})
            else:
                self.send_json({'success': False, 'error': err})
            return

        if path == '/api/project/upload_base64':
            data = self.read_json()
            proj = data.get('project', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            filename = data.get('filename', 'imagen.png')
            b64data = data.get('data', '')
            ok, err, final_name = upload_base64_asset(proj, filename, b64data)
            if ok:
                self.send_json({'success': True, 'filename': final_name})
            else:
                self.send_json({'success': False, 'error': err})
            return

        if path == '/api/project/asset/delete':
            data = self.read_json()
            proj = data.get('project', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            req_asset = data.get('filename', '').strip()
            ok, err = delete_asset(proj, req_asset)
            if ok:
                self.send_json({'success': True})
            else:
                self.send_json({'success': False, 'error': err})
            return

        if path == '/api/project/asset/rename':
            data = self.read_json()
            proj = data.get('project', core.config.shared_project)
            if is_guest and proj != core.config.shared_project:
                self.send_json({'success': False, 'error': 'Acceso no autorizado a este proyecto'})
                return
            old_rel = data.get('old_name', '')
            new_base = data.get('new_name', '')
            ok, err, old_n, new_n = rename_asset(proj, old_rel, new_base)
            if ok:
                self.send_json({'success': True, 'old_name': old_n, 'new_name': new_n})
            else:
                self.send_json({'success': False, 'error': err})
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
            ok, err, res_dict = process_voice_dictation(audio_base64, mime_type, title, provided_key, is_guest=is_guest)
            if ok:
                self.send_json(res_dict)
            else:
                self.send_json({'success': False, 'error': err})
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
            if 'word_wrap' in data:
                cfg['word_wrap'] = bool(data['word_wrap'])
            if 'theme_effects' in data:
                cfg['theme_effects'] = bool(data['theme_effects'])
            if 'theme_effects_frequency' in data:
                try:
                    cfg['theme_effects_frequency'] = max(20, min(200, int(data['theme_effects_frequency'])))
                except (ValueError, TypeError):
                    pass
            save_config(cfg)
            self.send_json({'success': True})
            return

        if path == '/api/system/apply_update':
            if is_guest:
                self.send_error(403, 'Acceso no autorizado')
                return
            ok, msg = apply_git_update()
            if ok:
                self.send_json({'success': True, 'message': msg})
            else:
                self.send_json({'success': False, 'error': msg})
            return

        self.send_error(404, 'Ruta POST no encontrada')

    def serve_file(self, filepath, content_type):
        """Envía un archivo local estático o PDF con cabeceras HTTP de respuesta."""
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
        """Codifica y envía un payload JSON con cabecera Content-Type application/json."""
        body = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        """Lee y parsea el cuerpo de una petición entrante como JSON."""
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length).decode('utf-8')
        return json.loads(body)
