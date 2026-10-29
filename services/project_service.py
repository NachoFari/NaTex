# -*- coding: utf-8 -*-
"""Project management, file tree CRUD, snapshots, templates, and ZIP handling."""

import os
import io
import re
import time
import json
import shutil
import base64
import zipfile
import urllib.parse
from core.constants import PROJECTS_DIR, TEMPLATES_DIR, USER_TEMPLATES_DIR
from core.config import load_config, save_config

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

def get_project_snapshot(proj_dir, snap_id):
    """Obtiene el contenido completo de un snapshot dado su ID."""
    clean_id = re.sub(r'[^a-zA-Z0-9_\-\.]', '', snap_id)
    if not clean_id:
        return None
    snap_file = os.path.join(proj_dir, '.history', f"{clean_id}.json")
    if not os.path.isfile(snap_file):
        return None
    try:
        with open(snap_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return None

def scan_project_files(proj_dir):
    """Escanea la jerarquía del proyecto recursivamente y extrae entradas BibTeX."""
    files = []
    bib_entries = []
    if not os.path.exists(proj_dir):
        return files, bib_entries

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
    return files, bib_entries

def get_project_details_list(projs):
    """Devuelve metadatos y previsualización para una lista de proyectos."""
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
            except Exception:
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
    return details

def load_project_file(proj, req_file='main.tex'):
    """Carga el archivo solicitado dentro de un proyecto, inicializándolo si es main.tex inexistente."""
    proj_dir, target_path = resolve_safe_project_path(proj, req_file)
    if not proj_dir:
        return False, 'Proyecto inválido', None
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

    files, bib_entries = scan_project_files(proj_dir)

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
    data = {
        'success': True,
        'name': proj,
        'file': req_file,
        'code': code,
        'mtime': mtime,
        'files': files,
        'bib_entries': bib_entries,
        'has_pdf': has_pdf,
        'pdf_file': pdf_file_to_use
    }
    return True, None, data

def save_project_file(proj, req_file, code):
    """Guarda código en un archivo de proyecto de forma segura."""
    proj_dir, target_path = resolve_safe_project_path(proj, req_file)
    if not proj_dir:
        return False, 'Proyecto inválido', 0
    if not target_path:
        req_file = 'main.tex'
        _, target_path = resolve_safe_project_path(proj, req_file)

    os.makedirs(proj_dir, exist_ok=True)
    parent_d = os.path.dirname(target_path)
    if parent_d:
        os.makedirs(parent_d, exist_ok=True)
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(code)
    mtime = os.path.getmtime(target_path)
    return True, req_file, mtime

def create_project_file(proj, filename, is_folder=False):
    """Crea un archivo o carpeta dentro de un proyecto."""
    proj_dir, target_path = resolve_safe_project_path(proj, filename)
    if not proj_dir or not target_path:
        return False, 'Nombre de archivo inválido'
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
        return True, filename
    except Exception as e:
        return False, str(e)

def delete_project_file(proj, filename):
    """Elimina un archivo o subcarpeta dentro de un proyecto."""
    proj_dir, target_path = resolve_safe_project_path(proj, filename)
    if not proj_dir or not target_path or filename == 'main.tex':
        return False, 'No se puede eliminar el archivo principal'
    try:
        if os.path.isfile(target_path):
            os.remove(target_path)
        elif os.path.isdir(target_path):
            shutil.rmtree(target_path)
        return True, None
    except Exception as e:
        return False, str(e)

def rename_project_file(proj, old_name, new_name):
    """Renombra un archivo dentro de un proyecto."""
    if not old_name or not new_name or old_name == 'main.tex':
        return False, 'No se puede renombrar este archivo'
    old_dir = os.path.dirname(old_name)
    if old_dir and '/' not in new_name and '\\' not in new_name:
        new_name = f"{old_dir}/{new_name}"
    proj_dir, old_path = resolve_safe_project_path(proj, old_name)
    _, new_path = resolve_safe_project_path(proj, new_name)
    if not proj_dir or not old_path or not new_path:
        return False, 'Ruta de archivo inválida'
    try:
        os.rename(old_path, new_path)
        return True, new_name
    except Exception as e:
        return False, str(e)

def move_project_file(proj, src, dest_folder):
    """Mueve un archivo o carpeta dentro de la jerarquía de un proyecto."""
    if not src or src == 'main.tex' or '..' in src or '..' in dest_folder:
        return False, 'No se puede mover el archivo principal ni usar rutas relativas', None
    proj_dir, src_full = resolve_safe_project_path(proj, src)
    if not proj_dir or not src_full or not os.path.exists(src_full):
        return False, 'El elemento de origen no existe', None
    filename = os.path.basename(src)
    if dest_folder:
        _, dest_dir = resolve_safe_project_path(proj, dest_folder)
        if not dest_dir:
            return False, 'Ruta de destino inválida', None
        dest_full = os.path.join(dest_dir, filename)
    else:
        dest_dir = proj_dir
        dest_full = os.path.join(proj_dir, filename)

    proj_abs = os.path.abspath(proj_dir)
    dest_abs = os.path.abspath(dest_full)
    src_abs = os.path.abspath(src_full)
    if os.path.commonpath([proj_abs, dest_abs]) != proj_abs:
        return False, 'Ruta de destino inválida', None
    if src_abs == dest_abs:
        return True, 'Ya está en esa ubicación', src
    if os.path.isdir(src_abs) and dest_abs.startswith(src_abs + os.sep):
        return False, 'No se puede mover una carpeta dentro de sí misma', None
    if os.path.exists(dest_abs):
        return False, f"Ya existe '{filename}' en la carpeta de destino", None
    try:
        os.makedirs(dest_dir, exist_ok=True)
        shutil.move(src_full, dest_full)
        new_rel = f"{dest_folder}/{filename}" if dest_folder else filename
        return True, None, new_rel
    except Exception as e:
        return False, str(e), None

def create_project(name, template_id=None):
    """Crea un nuevo proyecto, opcionalmente a partir de una plantilla."""
    clean_name = (name or '').strip().replace(' ', '_')
    proj_dir, _ = resolve_safe_project_path(clean_name)
    if not clean_name or not proj_dir:
        return False, 'Nombre inválido'
    os.makedirs(proj_dir, exist_ok=True)

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
    cfg['last_project'] = clean_name
    save_config(cfg)
    return True, clean_name

def list_templates(is_guest=False):
    """Lista las plantillas disponibles del sistema y del usuario."""
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
    return built_in, user_t

def apply_template(proj, template_id, target_file='main.tex', mode='replace', new_filename=None):
    """Aplica una plantilla sobre un proyecto."""
    if not template_id or '..' in template_id or '/' in template_id or '\\' in template_id:
        return False, 'Plantilla inválida', None, None
    proj_dir, safe_target = resolve_safe_project_path(proj, target_file)
    if not proj_dir:
        return False, 'Proyecto inválido', None, None
    if not safe_target:
        target_file = 'main.tex'

    tpl_dir = os.path.join(TEMPLATES_DIR, template_id)
    if not os.path.exists(tpl_dir):
        tpl_dir = os.path.join(USER_TEMPLATES_DIR, template_id)

    if not os.path.exists(tpl_dir):
        return False, 'Plantilla no encontrada', None, None

    os.makedirs(proj_dir, exist_ok=True)
    tpl_main_tex = os.path.join(tpl_dir, 'main.tex')
    code = ''
    if os.path.exists(tpl_main_tex):
        with open(tpl_main_tex, 'r', encoding='utf-8', errors='ignore') as f:
            code = f.read()

    if mode == 'new_file':
        candidate_name = os.path.basename((new_filename or f"{template_id}.tex").strip().replace(' ', '_'))
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

    return True, None, code, target_file

def save_user_template(proj, name):
    """Guarda un proyecto existente como plantilla de usuario."""
    clean_name = os.path.basename((name or '').strip().replace(' ', '_'))
    if not clean_name or '..' in clean_name:
        return False, 'Nombre requerido'
    dest = os.path.join(USER_TEMPLATES_DIR, clean_name)
    os.makedirs(dest, exist_ok=True)
    proj_dir, _ = resolve_safe_project_path(proj)
    if proj_dir and os.path.isdir(proj_dir):
        for item in os.listdir(proj_dir):
            if item != 'main.pdf':
                s = os.path.join(proj_dir, item)
                d = os.path.join(dest, item)
                if os.path.isfile(s):
                    shutil.copy2(s, d)
    return True, None

def export_project_zip(proj):
    """Empaqueta el proyecto en un archivo ZIP en memoria."""
    proj_dir, _ = resolve_safe_project_path(proj)
    if not proj_dir or not os.path.isdir(proj_dir):
        return None
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
    return mem_zip.getvalue()

def import_project_zip(raw_filename, custom_proj_name, b64data):
    """Importa un archivo .zip codificado en Base64 extrayéndolo como un nuevo proyecto."""
    if not b64data:
        return False, 'No se recibió contenido del archivo .zip', None
    if ',' in b64data:
        b64data = b64data.split(',', 1)[1]

    base_name = custom_proj_name or os.path.splitext(os.path.basename(raw_filename or 'Proyecto_Importado.zip'))[0]
    clean_name = re.sub(r'[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]', '', base_name).strip().replace(' ', '_') or 'Proyecto_Importado'
    os.makedirs(PROJECTS_DIR, exist_ok=True)
    final_proj_name = clean_name
    counter = 1
    while os.path.exists(os.path.join(PROJECTS_DIR, final_proj_name)):
        final_proj_name = f"{clean_name}_{counter}"
        counter += 1

    proj_dir, _ = resolve_safe_project_path(final_proj_name)
    if not proj_dir:
        return False, 'Nombre de proyecto inválido', None

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
                return False, 'El archivo .zip está vacío', None

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
        return True, final_proj_name, extracted_count
    except zipfile.BadZipFile:
        return False, 'El archivo seleccionado no es un archivo .zip válido', None
    except Exception as e:
        return False, f'Error al importar .zip: {str(e)}', None

def get_gallery_images(target_projects):
    """Devuelve imágenes de los proyectos indicados."""
    images = []
    if os.path.exists(PROJECTS_DIR):
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
    return images

def upload_base64_asset(proj, filename, b64data):
    """Guarda un archivo de asset binario a partir de base64."""
    filename = (filename or 'imagen.png').strip()
    proj_dir, dest_file = resolve_safe_project_path(proj, filename)
    if not proj_dir:
        return False, 'Proyecto inválido', None
    if not dest_file:
        filename = 'archivo.png'
        _, dest_file = resolve_safe_project_path(proj, filename)

    if ',' in b64data:
        b64data = b64data.split(',', 1)[1]

    parent_d = os.path.dirname(dest_file)
    if parent_d:
        os.makedirs(parent_d, exist_ok=True)
    else:
        os.makedirs(proj_dir, exist_ok=True)

    with open(dest_file, 'wb') as f:
        f.write(base64.b64decode(b64data))
    return True, None, filename

def delete_asset(proj, req_asset):
    """Elimina un archivo asset asegurándose de no borrar main.tex."""
    _, dest_file = resolve_safe_project_path(proj, req_asset)
    if dest_file and os.path.isfile(dest_file) and os.path.basename(dest_file) != 'main.tex':
        os.remove(dest_file)
        return True, None
    return False, 'No existe'

def rename_asset(proj, old_rel, new_base):
    """Renombra un asset y actualiza referencias en main.tex."""
    old_rel = (old_rel or '').strip()
    new_base = os.path.basename((new_base or '').strip())
    if not old_rel or not new_base:
        return False, 'Nombres inválidos', None, None

    old_ext = os.path.splitext(old_rel)[1].lower()
    new_ext = os.path.splitext(new_base)[1].lower()
    if not new_ext and old_ext:
        new_base = new_base + old_ext

    old_dir = os.path.dirname(old_rel)
    new_rel = f"{old_dir}/{new_base}" if old_dir else new_base

    proj_dir, old_path = resolve_safe_project_path(proj, old_rel)
    _, new_path = resolve_safe_project_path(proj, new_rel)

    if not proj_dir or not old_path or not new_path or not os.path.exists(old_path):
        return False, 'El archivo original no existe', None, None

    if os.path.exists(new_path) and old_rel != new_rel:
        return False, 'Ya existe un archivo con ese nuevo nombre', None, None

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
        return True, None, old_rel, new_rel
    except Exception as e:
        return False, str(e), None, None

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
