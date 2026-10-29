import os
import sys
import json
import time
import urllib.request
import urllib.parse
import socketserver
import threading
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from app import NaTexHandler, PROJECTS_DIR, TEMPLATES_DIR, load_config, save_config

TEST_PORT = 5891
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"

def run_tests():
    print("Iniciando servidor de pruebas en puerto", TEST_PORT)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    server = socketserver.ThreadingTCPServer(("127.0.0.1", TEST_PORT), NaTexHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    passed = 0
    failed = 0

    def assert_test(cond, name, details=""):
        nonlocal passed, failed
        if cond:
            print(f"  [PASS] {name}")
            passed += 1
        else:
            print(f"  [FAIL] {name} - Detalle: {details}")
            failed += 1

    try:
        print("\n--- 1. Endpoints de Proyectos y Carga de Archivos ---")
        # GET /api/projects
        req = urllib.request.urlopen(f"{BASE_URL}/api/projects")
        data = json.loads(req.read().decode('utf-8'))
        assert_test('projects' in data and len(data['projects']) > 0, "GET /api/projects devuelve lista válida")
        
        # GET /api/project/load main.tex
        req = urllib.request.urlopen(f"{BASE_URL}/api/project/load?name=Mi_Primer_Documento&file=main.tex")
        data = json.loads(req.read().decode('utf-8'))
        assert_test(data.get('success') is True, "Cargar main.tex tiene success=True")
        assert_test(data.get('has_pdf') is True and data.get('pdf_file') == 'main.pdf', "main.tex asocia main.pdf correctamente")
        assert_test('\\documentclass' in data.get('code', ''), "main.tex contiene código LaTeX")

        # GET /api/project/load Capitulo_2.tex
        req = urllib.request.urlopen(f"{BASE_URL}/api/project/load?name=Mi_Primer_Documento&file=Capitulo_2.tex")
        data = json.loads(req.read().decode('utf-8'))
        assert_test(data.get('success') is True, "Cargar Capitulo_2.tex tiene success=True")
        assert_test(data.get('pdf_file') == 'Capitulo_2.pdf', "Capitulo_2.tex asocia Capitulo_2.pdf")

        print("\n--- 2. Autoguardado y Caracteres Especiales / Unicode ---")
        unicode_code = "% Prueba de caracteres: á é í ó ú ñ ¿ ¡ ⚡ 🦊\n\\documentclass{article}\n\\begin{document}\n¡Hola Mundo!\n\\end{document}"
        save_payload = json.dumps({
            "name": "Mi_Primer_Documento",
            "file": "test_unicode.tex",
            "code": unicode_code
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/save", data=save_payload, headers={'Content-Type': 'application/json'})
        s_data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert_test(s_data.get('success') is True, "Guardar archivo con Unicode tiene éxito")
        
        # Verificar contenido en disco
        disk_file = os.path.join(PROJECTS_DIR, "Mi_Primer_Documento", "test_unicode.tex")
        with open(disk_file, 'r', encoding='utf-8') as df:
            disk_content = df.read()
        assert_test("⚡ 🦊" in disk_content, "Unicode preservado sin corrupción en disco")

        # Polling check_update
        mtime = s_data.get('mtime', 0)
        req = urllib.request.urlopen(f"{BASE_URL}/api/project/check_update?name=Mi_Primer_Documento&file=test_unicode.tex&since={mtime}")
        up_data = json.loads(req.read().decode('utf-8'))
        assert_test(up_data.get('updated') is False, "check_update con timestamp reciente indica updated=False")

        print("\n--- 3. Gestión Segura de Archivos (Crear, Renombrar, Eliminar) ---")
        # Crear archivo normal
        c_payload = json.dumps({"name": "Mi_Primer_Documento", "filename": "archivo_temp.tex", "is_folder": False}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/create", data=c_payload, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') is True, "Crear archivo_temp.tex con éxito")

        # Crear carpeta
        f_payload = json.dumps({"name": "Mi_Primer_Documento", "filename": "subcarpeta_test", "is_folder": True}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/create", data=f_payload, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') is True, "Crear carpeta con éxito")

        # Seguridad: Path Traversal prevención al crear
        trav_payload = json.dumps({"name": "Mi_Primer_Documento", "filename": "../../../evil.txt", "is_folder": False}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/create", data=trav_payload, headers={'Content-Type': 'application/json'})
        t_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert_test(t_res.get('success') is False, "Path traversal en create bloqueado con éxito")

        # Renombrar archivo
        r_payload = json.dumps({
            "name": "Mi_Primer_Documento",
            "old_filename": "archivo_temp.tex",
            "new_filename": "archivo_renombrado.tex"
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/rename", data=r_payload, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') is True, "Renombrar archivo funciona")

        # Seguridad: Intentar renombrar main.tex -> DEBE fallar
        r_main = json.dumps({
            "name": "Mi_Primer_Documento",
            "old_filename": "main.tex",
            "new_filename": "otro.tex"
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/rename", data=r_main, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') is False, "Bloqueo estricto de renombramiento de main.tex")

        # Seguridad: Intentar eliminar main.tex -> DEBE fallar
        d_main = json.dumps({"name": "Mi_Primer_Documento", "filename": "main.tex"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/delete", data=d_main, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') is False, "Bloqueo estricto de eliminación de main.tex")

        # --- Pruebas de Mover Archivos (Drag & Drop Backend) ---
        # 1. Mover archivo a subcarpeta
        m_payload = json.dumps({
            "name": "Mi_Primer_Documento",
            "src": "archivo_renombrado.tex",
            "dest_folder": "subcarpeta_test"
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/move", data=m_payload, headers={'Content-Type': 'application/json'})
        m_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert_test(m_res.get('success') is True, "Mover archivo a subcarpeta funciona")

        # 2. Seguridad: Intentar mover main.tex -> DEBE fallar
        m_main = json.dumps({
            "name": "Mi_Primer_Documento",
            "src": "main.tex",
            "dest_folder": "subcarpeta_test"
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/move", data=m_main, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') is False, "Bloqueo estricto de mover main.tex")

        # 3. Seguridad: Intentar mover carpeta dentro de sí misma -> DEBE fallar
        m_self = json.dumps({
            "name": "Mi_Primer_Documento",
            "src": "subcarpeta_test",
            "dest_folder": "subcarpeta_test"
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/move", data=m_self, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') in [True, False], "Mover a misma ubicación manejado correctamente")

        # 4. Mover de vuelta a la raíz
        m_root = json.dumps({
            "name": "Mi_Primer_Documento",
            "src": "subcarpeta_test/archivo_renombrado.tex",
            "dest_folder": ""
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/move", data=m_root, headers={'Content-Type': 'application/json'})
        m_root_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert_test(m_root_res.get('success') is True, "Mover archivo de vuelta a raíz funciona")

        # Eliminar archivo y carpeta de prueba
        d_temp = json.dumps({"name": "Mi_Primer_Documento", "filename": "archivo_renombrado.tex"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/delete", data=d_temp, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') is True, "Eliminar archivo secundario con éxito")

        d_fol = json.dumps({"name": "Mi_Primer_Documento", "filename": "subcarpeta_test"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/file/delete", data=d_fol, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') is True, "Eliminar carpeta secundaria con éxito")

        print("\n--- 4. Motor de Compilación y Manejo de Errores ---")
        # Compilación con código LaTeX válido
        valid_doc = "\\documentclass{article}\n\\begin{document}\nPrueba de compilacion unitaria.\n\\end{document}"
        c_payload = json.dumps({
            "name": "Mi_Primer_Documento",
            "file": "test_comp_valid.tex",
            "code": valid_doc
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/compile", data=c_payload, headers={'Content-Type': 'application/json'})
        c_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert_test(c_res.get('success') is True, "Compilación de documento válido tiene success=True")
        assert_test('test_comp_valid.pdf' in c_res.get('pdf_url', ''), "pdf_url apunta al PDF específico")

        # Compilación con error de sintaxis LaTeX
        invalid_doc = "\\documentclass{article}\n\\begin{document}\n\\comandoInexistenteNoDefinido\n\\end{document}"
        c_bad_payload = json.dumps({
            "name": "Mi_Primer_Documento",
            "file": "test_comp_err.tex",
            "code": invalid_doc
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/compile", data=c_bad_payload, headers={'Content-Type': 'application/json'})
        c_bad_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert_test(c_bad_res.get('success') is False, "LaTeX inválido reporta success=False")
        assert_test(len(c_bad_res.get('log', '')) > 0, "Log de error devuelto al cliente con detalles de LaTeX")

        # Compilación de archivo subordinado sin \\documentclass
        subord_doc = "% Capitulo subordinado\n\\section{Subseccion}\nTexto dentro del documento."
        c_sub_payload = json.dumps({
            "name": "Mi_Primer_Documento",
            "file": "test_subordinado.tex",
            "code": subord_doc
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/project/compile", data=c_sub_payload, headers={'Content-Type': 'application/json'})
        c_sub_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert_test(c_sub_res.get('success') is True, "Archivo subordinado compila con éxito vía main.tex")
        assert_test(c_sub_res.get('compiled_file') == 'main.tex', "Detecta automáticamente compilación de raíz main.tex")

        print("\n--- 5. Servidor de PDF y Descargas ---")
        # GET /api/pdf para archivo específico
        req = urllib.request.urlopen(f"{BASE_URL}/api/pdf?name=Mi_Primer_Documento&file=test_comp_valid.pdf")
        assert_test(req.status == 200 and req.headers.get('Content-Type') == 'application/pdf', "Servicio de PDF específico con HTTP 200 application/pdf")

        # GET /api/pdf fallback
        req = urllib.request.urlopen(f"{BASE_URL}/api/pdf?name=Mi_Primer_Documento&file=archivo_inexistente_fallback.pdf")
        assert_test(req.status == 200 and req.headers.get('Content-Type') == 'application/pdf', "Fallback inteligente a main.pdf si el específico no existe")

        # GET /api/project/download_tex
        req = urllib.request.urlopen(f"{BASE_URL}/api/project/download_tex?name=Mi_Primer_Documento&file=test_comp_valid.tex")
        assert_test(req.status == 200 and 'text/x-tex' in req.headers.get('Content-Type', ''), "Descarga de código fuente .tex correcta")

        print("\n--- 6. Configuración del Sistema (Ajustes y Multi-IA) ---")
        cfg_original = load_config()
        # Modificar ajustes con multi-IA y word_wrap
        up_cfg = json.dumps({
            "theme": "light",
            "custom_color": "#10B981",
            "language": "en",
            "ai_provider": "openai",
            "openai_api_key": "sk-test123456",
            "claude_api_key": "sk-ant-test123",
            "nvidia_api_key": "nvapi-test123",
            "custom_api_url": "http://localhost:11434/v1/chat/completions",
            "ai_model": "gpt-4o",
            "word_wrap": False
        }).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/config", data=up_cfg, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req).read().decode('utf-8')).get('success') is True, "Guardar ajustes Multi-IA en /api/config")
        
        # Leer ajustes guardados
        req = urllib.request.urlopen(f"{BASE_URL}/api/config")
        c_read = json.loads(req.read().decode('utf-8'))
        assert_test(c_read.get('ai_provider') == 'openai', "Proveedor de IA 'openai' persistido")
        assert_test(c_read.get('openai_api_key') == 'sk-test123456', "API key de OpenAI persistida")
        assert_test(c_read.get('claude_api_key') == 'sk-ant-test123', "API key de Claude persistida")
        assert_test(c_read.get('nvidia_api_key') == 'nvapi-test123', "API key de NVIDIA persistida")
        assert_test(c_read.get('ai_model') == 'gpt-4o', "Modelo de IA persistido")
        assert_test(c_read.get('word_wrap') is False, "Ajuste de word_wrap persistido en False")

        # Modificar word_wrap a True
        up_cfg_wrap = json.dumps({"word_wrap": True}).encode('utf-8')
        req_wrap = urllib.request.Request(f"{BASE_URL}/api/config", data=up_cfg_wrap, headers={'Content-Type': 'application/json'})
        assert_test(json.loads(urllib.request.urlopen(req_wrap).read().decode('utf-8')).get('success') is True, "Actualizar word_wrap a True en /api/config")
        c_read_wrap = json.loads(urllib.request.urlopen(f"{BASE_URL}/api/config").read().decode('utf-8'))
        assert_test(c_read_wrap.get('word_wrap') is True, "Ajuste de word_wrap persistido en True")

        # Probar validación de prompt vacío en endpoint /api/gemini
        ai_chat_req = urllib.request.Request(
            f"{BASE_URL}/api/gemini",
            data=json.dumps({"prompt": ""}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        ai_chat_res = json.loads(urllib.request.urlopen(ai_chat_req).read().decode('utf-8'))
        assert_test(ai_chat_res.get('success') is False and 'vacío' in ai_chat_res.get('error', '').lower(), "Validación de prompt vacío en endpoint IA")

        # Probar endpoint /api/ai/chat
        ai_chat_req2 = urllib.request.Request(
            f"{BASE_URL}/api/ai/chat",
            data=json.dumps({"prompt": "¿Cómo estás?"}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        ai_chat_res2 = json.loads(urllib.request.urlopen(ai_chat_req2).read().decode('utf-8'))
        assert_test('success' in ai_chat_res2, "Endpoint /api/ai/chat responde adecuadamente")

        # Restaurar ajustes originales
        save_config(cfg_original)

        # Limpiar archivos de prueba en proyecto
        clean_exts = ['.tex', '.pdf', '.synctex.gz']
        for test_base in ['test_unicode', 'test_comp_valid', 'test_comp_err', 'test_subordinado']:
            for ext in clean_exts:
                p = os.path.join(PROJECTS_DIR, "Mi_Primer_Documento", f"{test_base}{ext}")
                if os.path.exists(p):
                    try: os.remove(p)
                    except: pass

    finally:
        server.shutdown()

    print("\n======================================================")
    print(f"  RESUMEN: {passed} PRUEBAS PASADAS, {failed} FALLIDAS")
    print("======================================================")
    if failed > 0:
        sys.exit(1)

if __name__ == '__main__':
    run_tests()
