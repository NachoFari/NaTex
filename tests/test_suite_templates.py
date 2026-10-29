import os
import subprocess
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
compiler = os.path.join(BASE_DIR, 'compiler', 'tectonic.exe')
templates_dir = os.path.join(BASE_DIR, 'templates')
test_dir = os.path.join(BASE_DIR, 'scratch_test_templates')

os.makedirs(test_dir, exist_ok=True)
templates = sorted(os.listdir(templates_dir))

print(f"Comenzando testeo intensivo de las {len(templates)} plantillas con Tectonic...")

results = []
for t in templates:
    tpl_path = os.path.join(templates_dir, t)
    if not os.path.isdir(tpl_path):
        continue
    dest_path = os.path.join(test_dir, t)
    if os.path.exists(dest_path):
        shutil.rmtree(dest_path)
    shutil.copytree(tpl_path, dest_path)
    
    cmd = [compiler, '--synctex', 'main.tex']
    proc = subprocess.run(cmd, cwd=dest_path, capture_output=True, text=True, timeout=90)
    pdf_path = os.path.join(dest_path, 'main.pdf')
    synctex_path = os.path.join(dest_path, 'main.synctex.gz')
    
    has_pdf = os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0
    has_synctex = os.path.exists(synctex_path) and os.path.getsize(synctex_path) > 0
    pdf_size = os.path.getsize(pdf_path) if has_pdf else 0
    
    ok = (proc.returncode == 0) and has_pdf
    results.append({
        'template': t,
        'ok': ok,
        'code': proc.returncode,
        'has_pdf': has_pdf,
        'has_synctex': has_synctex,
        'size': pdf_size,
        'err': (proc.stderr or proc.stdout)[:300] if not ok else ''
    })

shutil.rmtree(test_dir, ignore_errors=True)

print("\n======================================================")
print("  REPORTE DE COMPILACIÓN DE PLANTILLAS NATEX STUDIO   ")
print("======================================================")
all_passed = True
for r in results:
    badge = "PASS" if r['ok'] else "FAIL"
    if not r['ok']:
        all_passed = False
    name_col = r['template'].ljust(25)
    print(f"[{badge}] {name_col} -> PDF: {r['has_pdf']} ({r['size']} bytes), SyncTeX: {r['has_synctex']}")
    if not r['ok']:
        print(f"      LOG ERROR: {r['err']}")

if all_passed:
    print("\n>>> EXCELENTE: 10/10 PLANTILLAS COMPILARON CON ÉXITO SIN ERRORES!")
else:
    print("\n>>> ERROR: FALLARON ALGUNAS PLANTILLAS!")
    exit(1)
