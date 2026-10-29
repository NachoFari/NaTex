# -*- coding: utf-8 -*-
"""Configuration management and runtime session state for NaTex Studio."""

import os
import json
import time
import threading
from core.constants import CONFIG_FILE, DEFAULT_CONFIG

# Runtime session state
last_heartbeat_time = time.time()
heartbeat_lock = threading.Lock()
server_shutting_down = False
server_running = True
shared_project = 'Mi_Primer_Documento'
active_project = 'Mi_Primer_Documento'
tunnel_proc = None
tunnel_url = None
native_window = None
collaborators = []
voice_state = {}

def load_config():
    """Loads configuration from config.json, falling back to DEFAULT_CONFIG."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()

def save_config(cfg):
    """Saves configuration dict to config.json with indentation."""
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, indent=2)

def update_heartbeat():
    """Updates the last heartbeat timestamp and resets shutting down flag."""
    global last_heartbeat_time, server_shutting_down
    with heartbeat_lock:
        last_heartbeat_time = time.time()
        server_shutting_down = False

def get_heartbeat_elapsed():
    """Returns elapsed seconds since the last received heartbeat."""
    with heartbeat_lock:
        return time.time() - last_heartbeat_time

def set_shared_project(name):
    """Sets the active/shared project name."""
    global shared_project, active_project
    shared_project = name
    active_project = name

def get_shared_project():
    """Returns the current shared project name."""
    return shared_project
