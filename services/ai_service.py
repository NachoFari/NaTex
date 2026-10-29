# -*- coding: utf-8 -*-
"""Multi-provider AI service (Gemini, OpenAI, Claude, NVIDIA NIM, Custom/Ollama) and voice processing."""

import os
import re
import json
import urllib.request
import urllib.error
import urllib.parse
import datetime
from core.constants import urlopen_with_ssl_fallback
from core.config import load_config, save_config
from services.project_service import resolve_safe_project_path
from services.compiler_service import compile_simple_document

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

        models_to_try = [custom_model] if custom_model else ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
        last_error = None
        for m in models_to_try:
            url = f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}'
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
                last_error = f"Error de Gemini ({m}, HTTP {e.code}): {err_msg}"
                if e.code in (404, 503, 429):
                    continue
                return False, last_error
            except Exception as e:
                last_error = f"Error al conectar con Gemini ({m}): {str(e)}"
                continue
        return False, last_error or "No se pudo conectar con los modelos de Gemini."

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

def process_voice_dictation(audio_base64, mime_type='audio/webm', title='', provided_key='', is_guest=False):
    """Procesa audio grabado enviándolo a Gemini 2.0 Flash para transcribir y crear un apunte LaTeX."""
    if not audio_base64:
        return False, 'No se recibió ningún audio grabado.', None

    cfg = load_config()
    api_key = provided_key or cfg.get('gemini_api_key', '')
    if provided_key and not is_guest and provided_key != cfg.get('gemini_api_key', ''):
        cfg['gemini_api_key'] = provided_key
        save_config(cfg)

    if not api_key:
        return False, 'Falta la clave gratuita de Google Gemini. Por favor ingrésala para continuar.', None

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

    clean_mime = (mime_type or 'audio/webm').split(';')[0].strip() or 'audio/webm'
    models_to_try = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
    latex_code = None
    last_err = None

    for m in models_to_try:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}'
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
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urlopen_with_ssl_fallback(req, timeout=150) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                raw_text = res_data['candidates'][0]['content']['parts'][0]['text']
                clean = re.sub(r'^```latex\s*', '', raw_text.strip(), flags=re.IGNORECASE)
                clean = re.sub(r'^```\s*', '', clean, flags=re.IGNORECASE)
                clean = re.sub(r'```$', '', clean).strip()
                latex_code = clean
                break
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            last_err = f'Error de Google Gemini ({m}, HTTP {e.code}): {err_msg}'
            if e.code in (404, 503, 429):
                continue
            return False, last_err, None
        except Exception as e:
            last_err = f'Error al procesar con IA ({m}): {str(e)}'
            continue

    if not latex_code:
        return False, last_err or 'Gemini no devolvió texto.', None

    proj_dir, _ = resolve_safe_project_path(proj_name)
    os.makedirs(proj_dir, exist_ok=True)
    tex_file = os.path.join(proj_dir, 'main.tex')
    with open(tex_file, 'w', encoding='utf-8') as f:
        f.write(latex_code)

    has_pdf = compile_simple_document(proj_dir, 'main.tex', timeout=90)

    cfg['last_project'] = proj_name
    save_config(cfg)

    result_data = {
        'success': True,
        'project': proj_name,
        'has_pdf': has_pdf,
        'pdf_url': f'/api/pdf?name={urllib.parse.quote(proj_name)}' if has_pdf else None,
        'code': latex_code
    }
    return True, None, result_data
