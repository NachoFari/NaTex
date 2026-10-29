# -*- coding: utf-8 -*-
"""LaTeX compilation engine using Tectonic, error parsing, and root document resolution."""

import os
import re
import subprocess
import urllib.parse
from core.constants import COMPILER_EXE, NO_WINDOW_FLAG
from services.project_service import resolve_safe_project_path, save_project_snapshot

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

    cmd = [COMPILER_EXE, '--synctex', compile_target]
    try:
        proc = subprocess.run(
            cmd,
            cwd=proj_dir,
            capture_output=True,
            text=True,
            timeout=90,
            creationflags=NO_WINDOW_FLAG
        )
        if proc.returncode == 0:
            save_project_snapshot(proj_dir, req_file, code, label='Compilación exitosa ✓')
            stem = os.path.splitext(compile_target)[0]
            pdf_filename = f"{stem}.pdf"
            return {
                'success': True,
                'pdf_url': f'/api/pdf?name={urllib.parse.quote(proj)}&file={urllib.parse.quote(pdf_filename)}',
                'compiled_file': compile_target,
                'pdf_file': pdf_filename
            }
        else:
            err_log = (proc.stderr or '') + '\n' + (proc.stdout or '')
            err_line = extract_compiler_error_line(err_log)
            return {'success': False, 'log': err_log, 'error_line': err_line}
    except subprocess.TimeoutExpired:
        return {'success': False, 'log': 'La compilación excedió el tiempo límite (90 segundos).'}
    except Exception as e:
        return {'success': False, 'log': str(e)}

def compile_simple_document(proj_dir, target_filename='main.tex', timeout=90):
    """Compila directamente un archivo .tex en un directorio dado (usado por dictáfono de voz)."""
    if not os.path.exists(COMPILER_EXE):
        return False
    cmd = [COMPILER_EXE, '--synctex', target_filename]
    try:
        proc = subprocess.run(
            cmd,
            cwd=proj_dir,
            capture_output=True,
            text=True,
            timeout=timeout,
            creationflags=NO_WINDOW_FLAG
        )
        return proc.returncode == 0
    except Exception:
        return False
