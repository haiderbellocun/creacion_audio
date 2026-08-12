import os
import re

from flask import Flask, request, jsonify, Response, send_from_directory
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings

# El build de producción del frontend (Vite) se copia aquí en el Dockerfile.
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "static_dist")

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")

# La API key NUNCA va en el código: se lee del entorno / Secret Manager.
API_KEY = os.environ.get("ELEVENLABS_API_KEY")

TEXTO_MUESTRA = "Hola, esta es una prueba de mi voz para el podcast CUN Aprende."

MODELOS = [
    {"id": "eleven_multilingual_v2", "label": "Multilingüe v2 · mejor calidad en español"},
    {"id": "eleven_flash_v2_5", "label": "Flash v2.5 · más rápido"},
    {"id": "eleven_v3", "label": "v3 · más expresivo"},
]


def get_client():
    """Devuelve un cliente de ElevenLabs o None si falta la key."""
    if not API_KEY:
        return None
    return ElevenLabs(api_key=API_KEY)


def slugify(nombre: str) -> str:
    nombre = (nombre or "").strip() or "mi_audio"
    nombre = re.sub(r"[^\w\-. ]", "", nombre).strip().replace(" ", "_")
    return nombre or "mi_audio"


def tts_bytes(client, voice_id, model_id, texto, settings=None):
    kwargs = dict(
        voice_id=voice_id,
        model_id=model_id,
        text=texto,
        output_format="mp3_44100_128",
    )
    if settings is not None:
        kwargs["voice_settings"] = settings
    audio = client.text_to_speech.convert(**kwargs)
    # convert() devuelve un generador de chunks de bytes
    return b"".join(audio)


@app.route("/healthz")
def healthz():
    return jsonify({"ok": True})


@app.route("/api/config")
def api_config():
    return jsonify({"api_ok": bool(API_KEY), "modelos": MODELOS})


@app.route("/api/voices")
def api_voices():
    client = get_client()
    if client is None:
        return jsonify({"error": "Falta la variable ELEVENLABS_API_KEY en el servidor."}), 500
    try:
        resp = client.voices.get_all()
        voces = [{"id": v.voice_id, "name": v.name} for v in resp.voices]
        voces.sort(key=lambda x: x["name"].lower())
        return jsonify({"voices": voces})
    except Exception as e:
        return jsonify({"error": f"No se pudieron cargar las voces: {e}"}), 502


@app.route("/api/preview", methods=["POST"])
def api_preview():
    client = get_client()
    if client is None:
        return jsonify({"error": "Falta la variable ELEVENLABS_API_KEY en el servidor."}), 500
    data = request.get_json(force=True, silent=True) or {}
    voice_id = data.get("voice_id")
    model_id = data.get("model_id", "eleven_multilingual_v2")
    if not voice_id:
        return jsonify({"error": "Selecciona una voz."}), 400
    try:
        audio = tts_bytes(client, voice_id, model_id, TEXTO_MUESTRA)
        return Response(audio, mimetype="audio/mpeg")
    except Exception as e:
        return jsonify({"error": f"Error al generar la muestra: {e}"}), 502


@app.route("/api/generate", methods=["POST"])
def api_generate():
    client = get_client()
    if client is None:
        return jsonify({"error": "Falta la variable ELEVENLABS_API_KEY en el servidor."}), 500
    data = request.get_json(force=True, silent=True) or {}
    voice_id = data.get("voice_id")
    model_id = data.get("model_id", "eleven_multilingual_v2")
    texto = (data.get("text") or "").strip()
    if not voice_id:
        return jsonify({"error": "Selecciona una voz."}), 400
    if not texto:
        return jsonify({"error": "Pega el texto que quieres convertir."}), 400

    try:
        settings = VoiceSettings(
            stability=float(data.get("stability", 0.55)),
            similarity_boost=float(data.get("similarity_boost", 0.80)),
            style=float(data.get("style", 0.20)),
            use_speaker_boost=bool(data.get("use_speaker_boost", True)),
        )
        audio = tts_bytes(client, voice_id, model_id, texto, settings)
        nombre = slugify(data.get("filename"))
        headers = {"Content-Disposition": f'attachment; filename="{nombre}.mp3"'}
        return Response(audio, mimetype="audio/mpeg", headers=headers)
    except Exception as e:
        return jsonify({"error": f"Error al generar el MP3: {e}"}), 502


@app.route("/api/generate_podcast", methods=["POST"])
def api_generate_podcast():
    client = get_client()
    if client is None:
        return jsonify({"error": "Falta la variable ELEVENLABS_API_KEY en el servidor."}), 500
    data = request.get_json(force=True, silent=True) or {}
    model_id = data.get("model_id", "eleven_multilingual_v2")
    segmentos = data.get("segments") or []

    lineas = [
        (s.get("voice_id"), (s.get("text") or "").strip())
        for s in segmentos
        if s.get("voice_id") and (s.get("text") or "").strip()
    ]
    if not lineas:
        return jsonify({"error": "Agrega al menos una línea con voz y texto."}), 400

    try:
        settings = VoiceSettings(
            stability=float(data.get("stability", 0.55)),
            similarity_boost=float(data.get("similarity_boost", 0.80)),
            style=float(data.get("style", 0.20)),
            use_speaker_boost=bool(data.get("use_speaker_boost", True)),
        )
        partes = [
            tts_bytes(client, voice_id, model_id, texto, settings)
            for voice_id, texto in lineas
        ]
        audio = b"".join(partes)
        nombre = slugify(data.get("filename"))
        headers = {"Content-Disposition": f'attachment; filename="{nombre}.mp3"'}
        return Response(audio, mimetype="audio/mpeg", headers=headers)
    except Exception as e:
        return jsonify({"error": f"Error al generar el podcast: {e}"}), 502


# Sirve el build de React en producción (Vite genera index.html + assets/).
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if not os.path.isdir(FRONTEND_DIST):
        return jsonify({
            "error": "No hay build del frontend. Corre 'npm run build' en frontend/ "
                     "o usa 'npm run dev' (puerto 5173) durante desarrollo."
        }), 404
    if path and os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
