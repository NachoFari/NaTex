# -*- coding: utf-8 -*-
"""Verification test for 32x32 Pixel-Art Theme Atmosphere Effects Engine."""

import os
import sys
import json

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

from core.constants import DEFAULT_CONFIG

def test_constants():
    assert 'theme_effects' in DEFAULT_CONFIG, "theme_effects missing from DEFAULT_CONFIG"
    assert DEFAULT_CONFIG['theme_effects'] is True, "theme_effects not True by default"
    print("PASS: core.constants.DEFAULT_CONFIG['theme_effects'] is True")

def test_config_file():
    for filename in ['config.example.json', 'config.json']:
        cfg_path = os.path.join(base_dir, filename)
        if os.path.exists(cfg_path):
            with open(cfg_path, 'r', encoding='utf-8') as f:
                cfg = json.load(f)
            assert 'theme_effects' in cfg, f"theme_effects missing from {filename}"
            assert cfg['theme_effects'] is True, f"theme_effects not True in {filename}"
            print(f"PASS: {filename} has theme_effects = true")

def test_i18n():
    i18n_path = os.path.join(base_dir, 'static', 'js', 'i18n.js')
    with open(i18n_path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert 'settings_theme_effects_title' in content, "Missing settings_theme_effects_title in i18n.js"
    assert 'settings_theme_effects_desc' in content, "Missing settings_theme_effects_desc in i18n.js"
    print("PASS: i18n.js has Spanish and English keys")

def test_index_html():
    html_path = os.path.join(base_dir, 'static', 'index.html')
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert 'id="natexThemeEffectsCanvas"' in content, "Canvas id='natexThemeEffectsCanvas' not found in index.html"
    assert 'id="chkThemeEffects"' in content, "Checkbox id='chkThemeEffects' not found in index.html"
    assert '/static/js/theme_effects.js' in content, "Script tag for theme_effects.js not found in index.html"
    print("PASS: index.html contains canvas element, settings toggle, and script tag")

def test_themes_css():
    css_path = os.path.join(base_dir, 'static', 'css', 'themes.css')
    with open(css_path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert '#natexThemeEffectsCanvas' in content, "#natexThemeEffectsCanvas not found in themes.css"
    assert 'pointer-events: none' in content, "pointer-events: none not found in themes.css"
    assert 'z-index: 0' in content, "z-index: 0 not found in themes.css"
    print("PASS: themes.css styles #natexThemeEffectsCanvas with pointer-events: none and z-index: 0 (behind text)")

def test_app_js():
    app_path = os.path.join(base_dir, 'static', 'js', 'app.js')
    with open(app_path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert 'updateThemeEffects' in content, "updateThemeEffects not wired in app.js"
    assert 'setThemeEffectsEnabled' in content, "setThemeEffectsEnabled not wired in app.js"
    assert 'chkThemeEffects' in content, "chkThemeEffects not handled in app.js"
    assert 'theme_effects: effectsEnabled' in content, "theme_effects not persisted in save handler in app.js"
    print("PASS: app.js integrates theme effects, config loading, saving, and toggle handler")

def test_theme_effects_js():
    js_path = os.path.join(base_dir, 'static', 'js', 'theme_effects.js')
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()

    themes_required = [
        'fox', 'rabbit', 'sakura', 'unicorn', 'coffee', 'mushroom', 'owl', 'frog',
        'penguin', 'panda', 'bee', 'wolf', 'lion', 'octopus', 'whale', 'cosmos',
        'bat', 'dino', 'maple', 'panther', 'custom'
    ]
    for t in themes_required:
        assert f'{t}:' in content or f"'{t}'" in content or f'"{t}"' in content, f"Theme {t} not found in theme_effects.js"
    
    assert 'window.setThemeEffectsEnabled = setThemeEffectsEnabled' in content, "window.setThemeEffectsEnabled not exported"
    assert 'window.updateThemeEffects = updateThemeEffects' in content, "window.updateThemeEffects not exported"
    assert 'window.isThemeEffectsEnabled = isThemeEffectsEnabled' in content, "window.isThemeEffectsEnabled not exported"
    assert 'patternToCanvas' in content, "patternToCanvas builder missing"
    assert 'createCustomSprites' in content, "createCustomSprites builder missing"
    print(f"PASS: theme_effects.js has all {len(themes_required)} themes and required public exports")

def test_api_config_roundtrip():
    import urllib.request
    import threading
    import socket
    import http.server
    from server.http_handler import NaTexHandler
    from core.constants import find_available_port

    test_port = find_available_port(5900)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', test_port), NaTexHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()

    try:
        # GET config
        req = urllib.request.Request(f"http://127.0.0.1:{test_port}/api/config")
        with urllib.request.urlopen(req, timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode('utf-8'))
            assert 'theme_effects' in data
            assert data['theme_effects'] is True

        # POST config - set to False
        post_data = json.dumps({'theme_effects': False}).encode('utf-8')
        req = urllib.request.Request(
            f"http://127.0.0.1:{test_port}/api/config",
            data=post_data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode('utf-8'))
            assert data.get('success') is True

        # Verify persisted False
        req = urllib.request.Request(f"http://127.0.0.1:{test_port}/api/config")
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert data['theme_effects'] is False

        # POST config - restore to True
        post_data = json.dumps({'theme_effects': True}).encode('utf-8')
        req = urllib.request.Request(
            f"http://127.0.0.1:{test_port}/api/config",
            data=post_data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            assert res.status == 200

        # Verify restored to True
        req = urllib.request.Request(f"http://127.0.0.1:{test_port}/api/config")
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert data['theme_effects'] is True

        print("PASS: /api/config GET & POST roundtrip successfully persists theme_effects")
    finally:
        server.shutdown()
        server.server_close()

if __name__ == '__main__':
    print("=== RUNNING THEME EFFECTS VERIFICATION SUITE ===")
    test_constants()
    test_config_file()
    test_i18n()
    test_index_html()
    test_themes_css()
    test_app_js()
    test_theme_effects_js()
    test_api_config_roundtrip()
    print("=== ALL TESTS PASSED! ===")
