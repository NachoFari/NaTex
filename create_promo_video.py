import os
import sys
import math
import subprocess
import numpy as np
import scipy.io.wavfile as wavfile
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

print("[NaTex Promo] ===============================================")
print("[NaTex Promo]   Generador de Video Promocional para NaTex    ")
print("[NaTex Promo] ===============================================")

WIDTH = 1080
HEIGHT = 1920
FPS = 30
DURATION = 32.0
TOTAL_FRAMES = int(FPS * DURATION)
AUDIO_FILE = "promo_music.wav"
OUTPUT_VIDEO = "NaTex_Story_Promo.mp4"

# -------------------------------------------------------------
# 1. PISTA DE AUDIO (SÍNTESIS LO-FI / SYNTHWAVE LIBRE DE COPY)
# -------------------------------------------------------------
if not os.path.exists(AUDIO_FILE):
    print("[NaTex Promo] Generando banda sonora...")
    sr = 44100
    n_samples = int(sr * DURATION)
    t_master = np.linspace(0, DURATION, n_samples, False)
    
    bpm = 108.0
    spb = 60.0 / bpm
    spm = spb * 4.0
    
    audio_l = np.zeros(n_samples, dtype=np.float32)
    audio_r = np.zeros(n_samples, dtype=np.float32)
    
    def midi_to_hz(m):
        return 440.0 * (2.0 ** ((m - 69) / 12.0))
        
    chords = [
        [50, 53, 57, 60], # Dm7
        [46, 50, 53, 57], # Bbmaj7
        [41, 45, 48, 52], # Fmaj7
        [48, 52, 55, 58], # C7
    ]
    bass_notes = [38, 34, 29, 36]
    
    measure = 0
    cur_time = 0.0
    while cur_time < DURATION:
        c_idx = measure % len(chords)
        chord = chords[c_idx]
        bass = bass_notes[c_idx]
        
        m_len = min(spm, DURATION - cur_time)
        s_idx = int(cur_time * sr)
        e_idx = s_idx + int(m_len * sr)
        chunk_len = e_idx - s_idx
        t_chunk = np.linspace(0, m_len, chunk_len, False)
        
        env_chord = np.exp(-t_chunk * 0.85) * (1.0 - np.exp(-t_chunk * 35.0))
        for note in chord:
            hz = midi_to_hz(note)
            tone_l = np.sin(2 * np.pi * (hz - 0.4) * t_chunk) + 0.35 * np.sin(4 * np.pi * hz * t_chunk)
            tone_r = np.sin(2 * np.pi * (hz + 0.4) * t_chunk) + 0.35 * np.sin(4 * np.pi * hz * t_chunk)
            audio_l[s_idx:e_idx] += (tone_l * env_chord * 0.065).astype(np.float32)
            audio_r[s_idx:e_idx] += (tone_r * env_chord * 0.065).astype(np.float32)
            
        hz_b = midi_to_hz(bass)
        env_bass = np.exp(-t_chunk * 1.1) * (1.0 - np.exp(-t_chunk * 30.0))
        bass_tone = np.sin(2 * np.pi * hz_b * t_chunk) + 0.25 * np.sin(4 * np.pi * hz_b * t_chunk)
        audio_l[s_idx:e_idx] += (bass_tone * env_bass * 0.19).astype(np.float32)
        audio_r[s_idx:e_idx] += (bass_tone * env_bass * 0.19).astype(np.float32)
        
        measure += 1
        cur_time += spm
        
    beat = 0
    cur_time = 0.0
    while cur_time < DURATION:
        s_idx = int(cur_time * sr)
        b_in_m = beat % 4
        if b_in_m in [0, 2]:
            k_dur = 0.32
            k_len = int(min(k_dur, DURATION - cur_time) * sr)
            if k_len > 0:
                t_k = np.linspace(0, k_dur, k_len, False)
                freq_k = 50.0 + 130.0 * np.exp(-t_k * 32.0)
                phase_k = 2 * np.pi * np.cumsum(freq_k) / sr
                kick = np.sin(phase_k) * np.exp(-t_k * 15.0) * 0.38
                audio_l[s_idx:s_idx+k_len] += kick.astype(np.float32)
                audio_r[s_idx:s_idx+k_len] += kick.astype(np.float32)
        elif b_in_m in [1, 3]:
            s_dur = 0.24
            s_len = int(min(s_dur, DURATION - cur_time) * sr)
            if s_len > 0:
                t_s = np.linspace(0, s_dur, s_len, False)
                noise = np.random.uniform(-1, 1, s_len) * np.exp(-t_s * 22.0) * 0.22
                body = np.sin(2 * np.pi * 180.0 * t_s) * np.exp(-t_s * 28.0) * 0.25
                snare = noise + body
                audio_l[s_idx:s_idx+s_len] += (snare * 0.85).astype(np.float32)
                audio_r[s_idx:s_idx+s_len] += (snare * 0.85).astype(np.float32)
                
        h_dur = 0.08
        h_len = int(min(h_dur, DURATION - cur_time) * sr)
        if h_len > 0:
            t_h = np.linspace(0, h_dur, h_len, False)
            hh = np.random.uniform(-1, 1, h_len) * np.exp(-t_h * 55.0) * 0.08
            audio_l[s_idx:s_idx+h_len] += (hh * 0.7).astype(np.float32)
            audio_r[s_idx:s_idx+h_len] += (hh * 0.9).astype(np.float32)
            
        beat += 1
        cur_time += spb

    for trans_t in [6.4, 12.8, 19.2, 25.6]:
        s_idx = int(trans_t * sr)
        t_len = int(0.7 * sr)
        if s_idx + t_len <= n_samples:
            t_tr = np.linspace(0, 0.7, t_len, False)
            whoosh = np.random.uniform(-1, 1, t_len) * np.exp(-t_tr * 7.0) * 0.12
            audio_l[s_idx:s_idx+t_len] += whoosh.astype(np.float32)
            audio_r[s_idx:s_idx+t_len] += whoosh.astype(np.float32)

    fade_in_len = int(0.8 * sr)
    fade_out_len = int(2.2 * sr)
    audio_l[:fade_in_len] *= np.linspace(0, 1, fade_in_len)
    audio_r[:fade_in_len] *= np.linspace(0, 1, fade_in_len)
    audio_l[-fade_out_len:] *= np.linspace(1, 0, fade_out_len)
    audio_r[-fade_out_len:] *= np.linspace(1, 0, fade_out_len)

    peak = max(np.max(np.abs(audio_l)), np.max(np.abs(audio_r)))
    if peak > 0:
        scale = 0.90 / peak
        audio_l *= scale
        audio_r *= scale

    stereo = np.column_stack([(audio_l * 32767).astype(np.int16), (audio_r * 32767).astype(np.int16)])
    wavfile.write(AUDIO_FILE, sr, stereo)

print(f"[NaTex Promo] Pista de audio cargada: {AUDIO_FILE}")

# -------------------------------------------------------------
# 2. TIPOGRAFÍAS Y RECURSOS
# -------------------------------------------------------------
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_CODE = r"C:\Windows\Fonts\consolab.ttf"

font_title_hero = ImageFont.truetype(FONT_BOLD, 72)
font_title = ImageFont.truetype(FONT_BOLD, 52)
font_subtitle = ImageFont.truetype(FONT_REG, 32)
font_card_head = ImageFont.truetype(FONT_BOLD, 35)
font_body = ImageFont.truetype(FONT_REG, 28)
font_body_bold = ImageFont.truetype(FONT_BOLD, 28)
font_code = ImageFont.truetype(FONT_CODE, 26)
font_pill = ImageFont.truetype(FONT_BOLD, 23)
font_small = ImageFont.truetype(FONT_REG, 22)
font_small_bold = ImageFont.truetype(FONT_BOLD, 22)
font_author = ImageFont.truetype(FONT_BOLD, 54)
font_latex_bg = ImageFont.truetype(FONT_CODE, 36)

# Paleta
BG_COLOR = (13, 16, 24)
GRID_COLOR = (24, 29, 44)
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (165, 175, 195)
TEXT_DIM = (110, 120, 140)
ORANGE_PRI = (255, 107, 53)
ORANGE_SOFT = (255, 140, 95)
ORANGE_DARK = (45, 22, 16)
PURPLE_PRI = (139, 92, 246)
PURPLE_DARK = (28, 20, 46)
CYAN_PRI = (6, 182, 212)
CYAN_DARK = (14, 34, 44)
GREEN_PRI = (16, 185, 129)
GREEN_DARK = (16, 38, 30)

# Cargar Logo
raw_logo = Image.open(r"static\img\logo.jpg").convert("RGB")
size_hero = 240
logo_hero = raw_logo.resize((size_hero, size_hero), Image.Resampling.LANCZOS)
mask_hero = Image.new("L", (size_hero, size_hero), 0)
ImageDraw.Draw(mask_hero).ellipse((0, 0, size_hero, size_hero), fill=255)

size_xs = 52
logo_xs = raw_logo.resize((size_xs, size_xs), Image.Resampling.LANCZOS)
mask_xs = Image.new("L", (size_xs, size_xs), 0)
ImageDraw.Draw(mask_xs).ellipse((0, 0, size_xs, size_xs), fill=255)

# Fondo ambiental base
def make_base_background():
    bg = np.full((HEIGHT, WIDTH, 3), BG_COLOR, dtype=np.float32)
    yy, xx = np.ogrid[:HEIGHT, :WIDTH]
    
    d_orange = np.sqrt((xx - WIDTH * 0.75)**2 + (yy - HEIGHT * 0.28)**2)
    glow_o = np.clip(1.0 - d_orange / 580.0, 0.0, 1.0)**2.2
    for c in range(3):
        bg[:, :, c] += ORANGE_PRI[c] * glow_o * 0.16
        
    d_purple = np.sqrt((xx - WIDTH * 0.25)**2 + (yy - HEIGHT * 0.72)**2)
    glow_p = np.clip(1.0 - d_purple / 620.0, 0.0, 1.0)**2.2
    for c in range(3):
        bg[:, :, c] += PURPLE_PRI[c] * glow_p * 0.15
        
    d_cyan = np.sqrt((xx - WIDTH * 0.5)**2 + (yy - HEIGHT * 0.48)**2)
    glow_c = np.clip(1.0 - d_cyan / 450.0, 0.0, 1.0)**2.2
    for c in range(3):
        bg[:, :, c] += CYAN_PRI[c] * glow_c * 0.10
        
    bg = np.clip(bg, 0, 255).astype(np.uint8)
    img_bg = Image.fromarray(bg, "RGB")
    draw = ImageDraw.Draw(img_bg)
    
    grid_size = 90
    for x in range(grid_size, WIDTH, grid_size):
        draw.line([(x, 0), (x, HEIGHT)], fill=GRID_COLOR, width=1)
    for y in range(grid_size, HEIGHT, grid_size):
        draw.line([(0, y), (WIDTH, y)], fill=GRID_COLOR, width=1)
        
    formulas = [
        (80, 280, r"\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}"),
        (WIDTH - 540, 560, r"\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}"),
        (90, 880, r"\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}"),
        (WIDTH - 480, 1220, r"\mathcal{H}|\psi\rangle = E|\psi\rangle"),
        (100, 1540, r"\lim_{x \to 0} \frac{\sin x}{x} = 1"),
        (WIDTH - 500, 1780, r"e^{i\pi} + 1 = 0")
    ]
    for fx, fy, ftxt in formulas:
        draw.text((fx, fy), ftxt, font=font_latex_bg, fill=(24, 30, 44))
        
    return img_bg

BASE_BG = make_base_background()

# Funciones de dibujo
def draw_card(draw, x0, y0, x1, y1, bg_color, border_color, radius=24, border_width=2):
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=bg_color, outline=border_color, width=border_width)

def draw_pill(draw, text, font, cx, cy, bg_color, border_color, text_color, px=22, py=10):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    w = tw + px * 2
    h = th + py * 2
    x0 = cx - w // 2
    y0 = cy - h // 2
    x1 = x0 + w
    y1 = y0 + h
    draw.rounded_rectangle([x0, y0, x1, y1], radius=h//2, fill=bg_color, outline=border_color, width=2)
    draw.text((cx - tw // 2, cy - th // 2 - 2), text, font=font, fill=text_color)

def draw_text_centered(draw, text, font, cy, color=TEXT_WHITE):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    cx = (WIDTH - tw) // 2
    draw.text((cx, cy), text, font=font, fill=color)

def wrap_text(text, font, max_width, draw):
    words = text.split(" ")
    lines = []
    cur = ""
    for w in words:
        test = cur + (" " if cur else "") + w
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines

# -------------------------------------------------------------
# 3. PIPELINE FFMPEG
# -------------------------------------------------------------
print(f"[NaTex Promo] Conectando encoder FFmpeg ({WIDTH}x{HEIGHT} @ {FPS}fps)...")
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
cmd = [
    ffmpeg_exe, '-y',
    '-f', 'rawvideo', '-vcodec', 'rawvideo',
    '-s', f'{WIDTH}x{HEIGHT}', '-pix_fmt', 'rgb24', '-r', str(FPS),
    '-i', '-',
    '-i', AUDIO_FILE,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-preset', 'fast', '-crf', '19',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    OUTPUT_VIDEO
]

proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

num_scenes = 5
scene_duration = DURATION / num_scenes

print(f"[NaTex Promo] Renderizando {TOTAL_FRAMES} fotogramas...")

for f in range(TOTAL_FRAMES):
    t = f / FPS
    scene_idx = min(int(t / scene_duration), num_scenes - 1)
    scene_t = t - (scene_idx * scene_duration)
    
    # Easing de entrada
    trans_in = min(1.0, scene_t / 0.55)
    slide_y = int((1.0 - (1.0 - (1.0 - trans_in)**3)) * 40.0)
    
    img = BASE_BG.copy()
    draw = ImageDraw.Draw(img)
    
    # Story Bars en la parte superior
    bar_y = 35
    bar_h = 6
    pad = 12
    margin = 50
    total_w = WIDTH - (margin * 2)
    single_w = (total_w - (num_scenes - 1) * pad) // num_scenes
    
    for b in range(num_scenes):
        bx0 = margin + b * (single_w + pad)
        bx1 = bx0 + single_w
        draw.rounded_rectangle([bx0, bar_y, bx1, bar_y + bar_h], radius=3, fill=(60, 70, 92))
        if b < scene_idx:
            draw.rounded_rectangle([bx0, bar_y, bx1, bar_y + bar_h], radius=3, fill=TEXT_WHITE)
        elif b == scene_idx:
            prog = min(1.0, scene_t / scene_duration)
            fill_w = int(single_w * prog)
            if fill_w > 0:
                draw.rounded_rectangle([bx0, bar_y, bx0 + fill_w, bar_y + bar_h], radius=3, fill=TEXT_WHITE)

    # Header Superior
    head_y = 65
    img.paste(logo_xs, (margin, head_y), mask=mask_xs)
    draw.text((margin + 64, head_y + 10), "NATEX STUDIO", font=font_pill, fill=ORANGE_PRI)
    draw_pill(draw, "100% GRATUITO", font_small_bold, WIDTH - margin - 90, head_y + 24, GREEN_DARK, GREEN_PRI, GREEN_PRI, px=14, py=6)

    # ---------------------------------------------------------
    # ESCENA 0: INTRODUCCION Y PROPUESTA
    # ---------------------------------------------------------
    if scene_idx == 0:
        base_y = 230 + slide_y
        pulse = 1.0 + 0.03 * math.sin(t * 3.5)
        lw = int(size_hero * pulse)
        lh = int(size_hero * pulse)
        l_x = (WIDTH - lw) // 2
        l_y = base_y
        
        draw.ellipse((l_x - 24, l_y - 24, l_x + lw + 24, l_y + lh + 24), outline=ORANGE_PRI, width=3)
        draw.ellipse((l_x - 12, l_y - 12, l_x + lw + 12, l_y + lh + 12), outline=ORANGE_SOFT, width=2)
        logo_dyn = logo_hero.resize((lw, lh), Image.Resampling.BILINEAR)
        mask_dyn = mask_hero.resize((lw, lh), Image.Resampling.BILINEAR)
        img.paste(logo_dyn, (l_x, l_y), mask=mask_dyn)
        
        draw_text_centered(draw, "NaTex Studio", font_title_hero, base_y + 280, TEXT_WHITE)
        draw_text_centered(draw, "El Entorno LaTeX que Estabas Esperando", font_subtitle, base_y + 375, TEXT_MUTED)
        
        card_y = base_y + 460
        draw_card(draw, 70, card_y, WIDTH - 70, card_y + 510, (19, 24, 36), (45, 55, 80), radius=28, border_width=2)
        draw_pill(draw, "[ v0.2 OFICIAL DISPONIBLE ]", font_pill, WIDTH // 2, card_y + 55, ORANGE_DARK, ORANGE_PRI, ORANGE_PRI, px=26, py=10)
        
        bullets = [
            ("Rendimiento Ultrarrápido", "Compilación veloz de documentos con un solo clic.", ORANGE_PRI),
            ("Interfaz Moderna y Visual", "Diseñado para ser intuitivo, sin configuraciones complejas.", PURPLE_PRI),
            ("100% Gratuito y Libre", "Descárgalo y úsalo de inmediato en Windows.", GREEN_PRI)
        ]
        
        by = card_y + 125
        for tit, desc, col in bullets:
            draw.rounded_rectangle([105, by + 6, 129, by + 30], radius=6, fill=col)
            draw.text((145, by), tit, font=font_card_head, fill=TEXT_WHITE)
            draw.text((145, by + 48), desc, font=font_body, fill=TEXT_MUTED)
            by += 115
            
        draw_text_centered(draw, "Creado para estudiantes, docentes e investigadores", font_small, card_y + 550, TEXT_DIM)

    # ---------------------------------------------------------
    # ESCENA 1: QUÉ ES NATEX & EDITOR VISUAL
    # ---------------------------------------------------------
    elif scene_idx == 1:
        base_y = 180 + slide_y
        draw_pill(draw, "POTENCIA VISUAL", font_pill, WIDTH // 2, base_y, ORANGE_DARK, ORANGE_PRI, ORANGE_PRI, px=24, py=9)
        draw_text_centered(draw, "Escribe, Formula y Compila", font_title, base_y + 45, TEXT_WHITE)
        draw_text_centered(draw, "al Instante", font_title, base_y + 115, ORANGE_PRI)
        
        card_y = base_y + 195
        draw_card(draw, 70, card_y, WIDTH - 70, card_y + 680, (17, 21, 32), (48, 58, 82), radius=24, border_width=2)
        
        draw.ellipse((105, card_y + 26, 123, card_y + 44), fill=(239, 68, 68))
        draw.ellipse((135, card_y + 26, 153, card_y + 44), fill=(245, 158, 11))
        draw.ellipse((165, card_y + 26, 183, card_y + 44), fill=(16, 185, 129))
        draw.text((205, card_y + 22), "Mi_Documento.tex", font=font_small_bold, fill=TEXT_MUTED)
        draw.line([(70, card_y + 65), (WIDTH - 70, card_y + 65)], fill=(35, 42, 60), width=1)
        
        code_lines = [
            (r"\documentclass{article}", PURPLE_PRI),
            (r"\usepackage{amsmath, graphicx}", ORANGE_PRI),
            (r"\begin{document}", GREEN_PRI),
            (r"\section{Modelo Teórico}", CYAN_PRI),
            (r"La solución de la integral es:", TEXT_MUTED),
            (r"\[ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} \]", ORANGE_SOFT),
            (r"\end{document}", GREEN_PRI)
        ]
        
        cy = card_y + 90
        for cline, ccol in code_lines:
            draw.text((105, cy), cline, font=font_code, fill=ccol)
            cy += 46
            
        banner_y = card_y + 575
        draw.rounded_rectangle([95, banner_y, WIDTH - 95, banner_y + 68], radius=14, fill=GREEN_DARK, outline=GREEN_PRI, width=2)
        draw.line([(125, banner_y + 36), (135, banner_y + 46)], fill=GREEN_PRI, width=3)
        draw.line([(135, banner_y + 46), (150, banner_y + 24)], fill=GREEN_PRI, width=3)
        draw.text((165, banner_y + 18), "Compilación a PDF exitosa en 0.4s", font=font_body_bold, fill=GREEN_PRI)
        
        t1_y = card_y + 710
        draw_card(draw, 70, t1_y, WIDTH - 70, t1_y + 135, (19, 24, 38), (50, 60, 88), radius=20, border_width=2)
        draw.rounded_rectangle([100, t1_y + 26, 132, t1_y + 58], radius=8, fill=ORANGE_PRI)
        draw.text((107, t1_y + 26), "∑", font=font_card_head, fill=TEXT_WHITE)
        draw.text((150, t1_y + 22), "Teclado Matemático Visual", font=font_card_head, fill=TEXT_WHITE)
        draw.text((150, t1_y + 70), "Inserta matrices, símbolos y fórmulas con un solo clic.", font=font_body, fill=TEXT_MUTED)
        
        t2_y = t1_y + 155
        draw_card(draw, 70, t2_y, WIDTH - 70, t2_y + 135, (19, 24, 38), (50, 60, 88), radius=20, border_width=2)
        draw.rounded_rectangle([100, t2_y + 26, 132, t2_y + 58], radius=8, fill=PURPLE_PRI)
        draw.text((108, t2_y + 24), "≡", font=font_card_head, fill=TEXT_WHITE)
        draw.text((150, t2_y + 22), "Plantillas Académicas Listas", font=font_card_head, fill=TEXT_WHITE)
        draw.text((150, t2_y + 70), "Informes, Tesis, Papers IEEE y Posters preconfigurados.", font=font_body, fill=TEXT_MUTED)

    # ---------------------------------------------------------
    # ESCENA 2: TRABAJO EN EQUIPO EN TIEMPO REAL
    # ---------------------------------------------------------
    elif scene_idx == 2:
        base_y = 180 + slide_y
        draw_pill(draw, "TRABAJO EN EQUIPO", font_pill, WIDTH // 2, base_y, CYAN_DARK, CYAN_PRI, CYAN_PRI, px=24, py=9)
        draw_text_centered(draw, "Colabora en Vivo", font_title, base_y + 45, TEXT_WHITE)
        draw_text_centered(draw, "con Quien Quieras", font_title, base_y + 115, CYAN_PRI)
        draw_text_centered(draw, "Sin registros, sin cuentas ni configuraciones de red.", font_subtitle, base_y + 190, TEXT_MUTED)
        
        card_y = base_y + 265
        draw_card(draw, 70, card_y, WIDTH - 70, card_y + 540, (18, 23, 36), (35, 75, 100), radius=26, border_width=2)
        
        draw.text((110, card_y + 35), "Enlace Directo de Sesión:", font=font_card_head, fill=TEXT_WHITE)
        
        draw.rounded_rectangle([105, card_y + 90, WIDTH - 105, card_y + 165], radius=14, fill=(12, 16, 26), outline=CYAN_PRI, width=2)
        draw.text((130, card_y + 112), "https://natex-studio.trycloudflare.com/?p=Doc", font=font_code, fill=CYAN_PRI)
        draw_pill(draw, "COPIAR", font_small_bold, WIDTH - 180, card_y + 128, CYAN_DARK, CYAN_PRI, CYAN_PRI, px=18, py=8)
        
        draw.text((110, card_y + 205), "Compañeros Conectados en Vivo:", font=font_card_head, fill=TEXT_WHITE)
        
        collabs = [
            ("NF", "Tú: Redactando metodología teórica...", GREEN_PRI, GREEN_DARK),
            ("MT", "Matías: Añadiendo gráficos y figuras...", (59, 130, 246), (15, 30, 60)),
            ("SF", "Sofía: Verificando ecuaciones matemáticas...", PURPLE_PRI, PURPLE_DARK)
        ]
        
        cy = card_y + 265
        for tag, cdesc, col_fg, col_bg in collabs:
            draw.rounded_rectangle([105, cy, WIDTH - 105, cy + 68], radius=12, fill=col_bg, outline=col_fg, width=1)
            draw.rounded_rectangle([120, cy + 12, 164, cy + 56], radius=8, fill=col_fg)
            draw.text((127, cy + 18), tag, font=font_small_bold, fill=TEXT_WHITE)
            draw.text((180, cy + 18), cdesc, font=font_body_bold, fill=col_fg)
            cy += 84
            
        card_mob_y = card_y + 575
        draw_card(draw, 70, card_mob_y, WIDTH - 70, card_mob_y + 240, (19, 24, 38), (60, 50, 90), radius=24, border_width=2)
        draw.text((110, card_mob_y + 35), "Acceso desde Cualquier Dispositivo", font=font_card_head, fill=ORANGE_PRI)
        
        mob_desc = "Tus compañeros pueden unirse desde PC, notebook, tablet o celular escaneando el código QR. Todos editan y compilan juntos."
        lines_m = wrap_text(mob_desc, font_body, WIDTH - 220, draw)
        my = card_mob_y + 90
        for l in lines_m:
            draw.text((110, my), l, font=font_body, fill=TEXT_MUTED)
            my += 42

    # ---------------------------------------------------------
    # ESCENA 3: INTELIGENCIA ARTIFICIAL MULTIPROVEEDOR
    # ---------------------------------------------------------
    elif scene_idx == 3:
        base_y = 160 + slide_y
        draw_pill(draw, "INTELIGENCIA ARTIFICIAL", font_pill, WIDTH // 2, base_y, PURPLE_DARK, PURPLE_PRI, PURPLE_PRI, px=24, py=9)
        draw_text_centered(draw, "Múltiples Proveedores de IA", font_title, base_y + 45, TEXT_WHITE)
        draw_text_centered(draw, "Gemini · OpenAI · Claude · NVIDIA", font_title, base_y + 115, PURPLE_PRI)
        draw_text_centered(draw, "Conecta tu propia clave de API y potencia tu productividad.", font_subtitle, base_y + 190, TEXT_MUTED)
        
        card1_y = base_y + 250
        draw_card(draw, 70, card1_y, WIDTH - 70, card1_y + 400, (19, 23, 37), (100, 60, 160), radius=26, border_width=2)
        draw.text((110, card1_y + 30), "Dictáfono para Clases en Vivo", font=font_card_head, fill=ORANGE_PRI)
        
        # Ecualizador de ondas de audio animadas dinámicamente
        eq_x = 110
        eq_y = card1_y + 85
        for idx in range(12):
            wave_osc = math.sin(t * 12.0 + idx * 0.7) * 0.5 + 0.5
            bh = int(18 + wave_osc * 55)
            bx = eq_x + idx * 22
            by0 = eq_y + 45 - bh // 2
            by1 = by0 + bh
            draw.rounded_rectangle([bx, by0, bx + 12, by1], radius=6, fill=ORANGE_PRI)
            
        draw.text((eq_x + 300, eq_y + 24), "Grabando audio desde tu celular...", font=font_body_bold, fill=ORANGE_SOFT)
        
        desc1 = "Graba la clase en vivo. Transcribe el audio y genera apuntes estructurados en LaTeX con fórmulas y teoremas (vía Google Gemini)."
        lines1 = wrap_text(desc1, font_body, WIDTH - 220, draw)
        dy = card1_y + 170
        for l in lines1:
            draw.text((110, dy), l, font=font_body, fill=TEXT_MUTED)
            dy += 40
            
        draw_pill(draw, "Apuntes y Fórmulas Automáticas", font_small_bold, WIDTH // 2, card1_y + 340, GREEN_DARK, GREEN_PRI, GREEN_PRI, px=22, py=9)

        card2_y = card1_y + 430
        draw_card(draw, 70, card2_y, WIDTH - 70, card2_y + 390, (18, 24, 38), (35, 80, 110), radius=26, border_width=2)
        draw.text((110, card2_y + 30), "Asistente LaTeX Inteligente", font=font_card_head, fill=CYAN_PRI)
        
        # Badges de proveedores compatibles
        ai_providers_list = ["Gemini", "OpenAI", "Claude", "NVIDIA NIM", "Local"]
        px_cur = 110
        for prov_item in ai_providers_list:
            bbox_p = draw.textbbox((0, 0), prov_item, font=font_small_bold)
            pw = bbox_p[2] - bbox_p[0] + 28
            draw.rounded_rectangle([px_cur, card2_y + 80, px_cur + pw, card2_y + 120], radius=10, fill=(25, 36, 56), outline=CYAN_PRI, width=1)
            draw.text((px_cur + 14, card2_y + 88), prov_item, font=font_small_bold, fill=TEXT_WHITE)
            px_cur += pw + 12

        desc2 = "Pregunta cómo armar tablas complejas, resolver errores de compilación o redactar resúmenes. Inserta el código LaTeX generado con un solo clic."
        lines2 = wrap_text(desc2, font_body, WIDTH - 220, draw)
        dy2 = card2_y + 145
        for l in lines2:
            draw.text((110, dy2), l, font=font_body, fill=TEXT_MUTED)
            dy2 += 40
            
        draw_pill(draw, "Compatible con tu Proveedor Favorito", font_small_bold, WIDTH // 2, card2_y + 335, CYAN_DARK, CYAN_PRI, CYAN_PRI, px=22, py=9)

    # ---------------------------------------------------------
    # ESCENA 4: CIERRE, AUTOR Y GITHUB
    # ---------------------------------------------------------
    elif scene_idx == 4:
        base_y = 210 + slide_y
        pulse = 1.0 + 0.03 * math.sin(t * 3.5)
        lw = int(size_hero * pulse)
        lh = int(size_hero * pulse)
        l_x = (WIDTH - lw) // 2
        l_y = base_y
        
        draw.ellipse((l_x - 20, l_y - 20, l_x + lw + 20, l_y + lh + 20), outline=ORANGE_PRI, width=3)
        logo_dyn = logo_hero.resize((lw, lh), Image.Resampling.BILINEAR)
        mask_dyn = mask_hero.resize((lw, lh), Image.Resampling.BILINEAR)
        img.paste(logo_dyn, (l_x, l_y), mask=mask_dyn)
        
        draw_text_centered(draw, "Empieza a Usar NaTex Hoy", font_title, base_y + 275, TEXT_WHITE)
        draw_text_centered(draw, "100% Gratuito y de Código Abierto", font_subtitle, base_y + 348, GREEN_PRI)
        
        card_dl = base_y + 420
        draw_card(draw, 70, card_dl, WIDTH - 70, card_dl + 240, (19, 24, 38), (60, 70, 95), radius=26, border_width=2)
        
        draw_pill(draw, "INSTALADOR PARA WINDOWS (.exe)", font_card_head, WIDTH // 2, card_dl + 75, ORANGE_PRI, ORANGE_PRI, TEXT_WHITE, px=32, py=16)
        draw_text_centered(draw, "También disponible en versión Portable (.zip)", font_body, card_dl + 165, TEXT_MUTED)
        
        # Tarjeta dedicada para el Autor y GitHub
        card_aut = card_dl + 280
        draw_card(draw, 70, card_aut, WIDTH - 70, card_aut + 370, (16, 20, 30), (50, 60, 85), radius=26, border_width=2)
        
        draw_text_centered(draw, "Desarrollado y Creado por:", font_body, card_aut + 40, TEXT_DIM)
        draw_text_centered(draw, "NaTex Studio Team", font_author, card_aut + 100, ORANGE_PRI)
        
        git_y = card_aut + 215
        draw_pill(draw, "github.com/NachoFari/NaTex", font_card_head, WIDTH // 2, git_y, (12, 16, 26), ORANGE_PRI, TEXT_WHITE, px=34, py=16)
        draw_text_centered(draw, "Descárgalo ahora y apóyalo en GitHub", font_body_bold, card_aut + 310, CYAN_PRI)

    raw_frame = img.tobytes()
    proc.stdin.write(raw_frame)
    
    if (f + 1) % 150 == 0 or (f + 1) == TOTAL_FRAMES:
        pct = int(((f + 1) / TOTAL_FRAMES) * 100)
        print(f"[NaTex Promo] Progreso: {f + 1}/{TOTAL_FRAMES} fotogramas ({pct}%)...")

proc.stdin.close()
proc.wait()

print("[NaTex Promo] ===============================================")
print("[NaTex Promo]  ¡VIDEO FINAL GENERADO EXITOSAMENTE!           ")
print(f"[NaTex Promo]  Archivo: {OUTPUT_VIDEO}")
print(f"[NaTex Promo]  Resolución: {WIDTH}x{HEIGHT} (9:16 Instagram)")
print(f"[NaTex Promo]  Duración: {DURATION}s @ {FPS}fps con Audio AAC")
print("[NaTex Promo] ===============================================")
