# -*- coding: utf-8 -*-
"""LaTeX compilation engine using Tectonic, error parsing, and root document resolution."""

import os
import re
import subprocess
import urllib.parse
from core.constants import COMPILER_EXE, NO_WINDOW_FLAG
from services.project_service import resolve_safe_project_path, save_project_snapshot

def clean_compiler_log(log_text):
    """Limpia avisos inocuos del sistema como Fontconfig."""
    if not log_text:
        return ''
    lines = [l for l in log_text.splitlines() if 'Fontconfig error:' not in l]
    return '\n'.join(lines).strip()

def extract_compiler_error_line(log_text):
    """Extrae el número de línea del error prioritario, ignorando advertencias de formato."""
    if not log_text:
        return None
    # 1. Prioridad: línea explícita de error de Tectonic (ej: "error: main.tex:202:")
    m_err = re.search(r'(?:^|\n)\s*error:\s*[^:\n]+:(\d+):', log_text)
    if m_err:
        try:
            return int(m_err.group(1))
        except ValueError:
            pass
    # 2. Prioridad: marcador clásico de TeX (ej: "l.202")
    m_tex = re.search(r'\bl\.(\d+)\b', log_text)
    if m_tex:
        try:
            return int(m_tex.group(1))
        except ValueError:
            pass
    # 3. Fallback genérico: cualquier ":<num>:" que no esté en una línea de warning Overfull/Underfull
    for line in log_text.splitlines():
        if re.search(r'\bwarning:\s*[^:\n]+:\d+:\s*(Overfull|Underfull)', line, re.I):
            continue
        m_gen = re.search(r':(\d+):', line)
        if m_gen:
            try:
                return int(m_gen.group(1))
            except ValueError:
                pass
    return None

def detect_compile_target(proj_dir, req_file, code):
    """Determina si compilar el archivo actual o delegar a main.tex como documento raíz."""
    compile_target = req_file
    has_docclass = r'\documentclass' in code
    if not has_docclass and req_file != 'main.tex':
        main_tex_path = os.path.join(proj_dir, 'main.tex')
        if os.path.exists(main_tex_path):
            try:
                with open(main_tex_path, 'r', encoding='utf-8', errors='ignore') as mf:
                    if r'\documentclass' in mf.read():
                        compile_target = 'main.tex'
            except Exception:
                pass
    return compile_target

def compile_project_file(proj, req_file='main.tex', code=''):
    """Guarda y compila un documento LaTeX con Tectonic generando PDF y SyncTeX."""
    proj_dir, target_file_path = resolve_safe_project_path(proj, req_file)
    if not proj_dir:
        return {'success': False, 'log': 'Proyecto inválido'}
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
        return {'success': False, 'log': 'Error: Compilador Tectonic no encontrado en compiler/'}

    compile_target = detect_compile_target(proj_dir, req_file, code)
    stem = os.path.splitext(compile_target)[0]
    pdf_filename = f"{stem}.pdf"
    pdf_path = os.path.join(proj_dir, pdf_filename)
    pdf_mtime_before = os.path.getmtime(pdf_path) if os.path.exists(pdf_path) else None

    # Modo tolerante estilo Overleaf (-Z continue-on-errors)
    cmd = [COMPILER_EXE, '--synctex', '-Z', 'continue-on-errors', compile_target]
    try:
        proc = subprocess.run(
            cmd,
            cwd=proj_dir,
            capture_output=True,
            text=True,
            timeout=90,
            creationflags=NO_WINDOW_FLAG
        )
        raw_log = clean_compiler_log((proc.stderr or '') + '\n' + (proc.stdout or ''))
        pdf_exists = os.path.exists(pdf_path)
        pdf_is_fresh = pdf_exists and (pdf_mtime_before is None or os.path.getmtime(pdf_path) >= pdf_mtime_before)

        if proc.returncode == 0 or pdf_is_fresh:
            save_project_snapshot(proj_dir, req_file, code, label='Compilación exitosa ✓')
            has_warnings = bool(re.search(r'\b(warning|error):', raw_log, re.I))
            return {
                'success': True,
                'pdf_url': f'/api/pdf?name={urllib.parse.quote(proj)}&file={urllib.parse.quote(pdf_filename)}',
                'compiled_file': compile_target,
                'pdf_file': pdf_filename,
                'has_warnings': has_warnings,
                'warning_log': raw_log if has_warnings else ''
            }
        else:
            err_line = extract_compiler_error_line(raw_log)
            return {'success': False, 'log': raw_log, 'error_line': err_line}
    except subprocess.TimeoutExpired:
        return {'success': False, 'log': 'La compilación excedió el tiempo límite (90 segundos).'}
    except Exception as e:
        return {'success': False, 'log': str(e)}

def compile_simple_document(proj_dir, target_filename='main.tex', timeout=90):
    """Compila directamente un archivo .tex en un directorio dado (usado por dictáfono de voz)."""
    if not os.path.exists(COMPILER_EXE):
        return False
    cmd = [COMPILER_EXE, '--synctex', '-Z', 'continue-on-errors', target_filename]
    try:
        proc = subprocess.run(
            cmd,
            cwd=proj_dir,
            capture_output=True,
            text=True,
            timeout=timeout,
            creationflags=NO_WINDOW_FLAG
        )
        stem = os.path.splitext(target_filename)[0]
        pdf_path = os.path.join(proj_dir, f"{stem}.pdf")
        return proc.returncode == 0 or os.path.exists(pdf_path)
    except Exception:
        return False
