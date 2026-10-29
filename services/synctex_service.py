# -*- coding: utf-8 -*-
"""SyncTeX parsing and bidirectional editor <-> PDF coordinate lookup."""

import os
import re
import gzip
from services.project_service import resolve_safe_project_path

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

def synctex_forward(proj, req_file, line):
    """Resuelve la página del PDF correspondiente a una línea del editor."""
    stem = os.path.splitext(os.path.basename(req_file))[0]
    proj_dir, _ = resolve_safe_project_path(proj)
    if not proj_dir:
        return False, 'Proyecto inválido', None
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
    return True, None, target_page

def synctex_inverse(proj, req_file, page, x, y):
    """Resuelve la línea del editor correspondiente a un clic en las coordenadas del PDF."""
    stem = os.path.splitext(os.path.basename(req_file))[0]
    proj_dir, _ = resolve_safe_project_path(proj)
    if not proj_dir:
        return False, 'Proyecto inválido', None
    synctex_path = os.path.join(proj_dir, f'{stem}.synctex.gz')
    if not os.path.exists(synctex_path):
        synctex_path = os.path.join(proj_dir, 'main.synctex.gz')
    _, nodes = parse_synctex_file(synctex_path)
    x_sp = x * 65536
    y_sp = y * 65536
    page_nodes = [n for n in nodes if n[0] == page]
    if page_nodes:
        closest = min(page_nodes, key=lambda n: (n[2] - x_sp)**2 + (n[3] - y_sp)**2)
        return True, None, closest[1]
    return False, 'Coordenadas no encontradas', None
