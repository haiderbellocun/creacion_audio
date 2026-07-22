# 🎙️ Estudio de Voz — Texto → MP3 (ElevenLabs) · CUN

App web (backend **Flask** + frontend **Vite/React**) que replica tu notebook de ElevenLabs:
cargar voces, escuchar una muestra, pegar texto y generar/descargar el MP3.
Lista para desplegar en **Google Cloud Run**.

---

## ⚠️ Antes de nada: rota tu API key

La key que estaba en el notebook quedó expuesta. Entra a **ElevenLabs → Developer → API Keys**,
**revócala y genera una nueva**. Nunca la pongas en el código: aquí va como variable de entorno.

---

## Estructura

```
tts-cun/
├── backend/                # API Flask + ElevenLabs
│   ├── app.py
│   ├── requirements.txt
│   ├── .dockerignore
│   └── .env.example
├── frontend/                # Vite + React
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── styles.css
│   │   └── components/
│   │       ├── VoicePanel.jsx
│   │       ├── TextPanel.jsx
│   │       └── Toast.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Dockerfile               # build multi-stage (Node → Python) para Cloud Run
├── .dockerignore
└── .gcloudignore
```

El backend expone únicamente JSON/binarios (`/api/...`, `/healthz`). El frontend consume
esa API con `fetch`. En producción, Flask sirve el build de Vite (`frontend/dist`) como estático.

---

## 1) Correr en local (modo desarrollo)

Necesitas dos terminales: una para el backend y otra para el frontend con hot-reload.

**Backend (Flask, puerto 8080):**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate    # opcional
pip install -r requirements.txt

# tu key real (Linux/Mac)
export ELEVENLABS_API_KEY="sk_tu_nueva_key"
# en Windows PowerShell:  $env:ELEVENLABS_API_KEY="sk_tu_nueva_key"

python app.py
```

**Frontend (Vite, puerto 5173):**

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 — Vite hace proxy de `/api` y `/healthz` hacia `http://localhost:8080`
(ver `frontend/vite.config.js`), así que no hace falta configurar CORS.

---

## 2) Build de producción local

```bash
cd frontend
npm run build        # genera frontend/dist

cd ../backend
# copia el build para que Flask lo sirva:
cp -r ../frontend/dist ./static_dist
python app.py         # ahora sirve la API y la UI en el puerto 8080
```

(El Dockerfile hace este mismo copiado automáticamente al construir la imagen.)

---

## 3) Desplegar en Cloud Run (recomendado)

Requisitos: tener `gcloud` instalado y un proyecto GCP con facturación activa.
El `Dockerfile` en la raíz construye el frontend con Node y luego empaqueta el backend
Python sirviendo ese build — un solo contenedor, un solo servicio.

### Opción A — rápida (key como variable de entorno)

```bash
gcloud config set project TU_PROYECTO

gcloud run deploy estudio-voz \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ELEVENLABS_API_KEY="sk_tu_nueva_key" \
  --timeout 300 \
  --memory 512Mi
```

Al terminar te da una URL pública (`https://estudio-voz-xxxx.run.app`).

### Opción B — segura (key en Secret Manager, recomendado para producción)

```bash
# 1. Guarda la key como secreto
echo -n "sk_tu_nueva_key" | gcloud secrets create elevenlabs-key --data-file=-

# 2. Da permiso a la cuenta de servicio de Cloud Run
PROJ_NUM=$(gcloud projects describe TU_PROYECTO --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding elevenlabs-key \
  --member="serviceAccount:${PROJ_NUM}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 3. Despliega montando el secreto como variable de entorno
gcloud run deploy estudio-voz \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets ELEVENLABS_API_KEY=elevenlabs-key:latest \
  --timeout 300 \
  --memory 512Mi
```

> `--allow-unauthenticated` deja la app pública. Si es solo interna del equipo,
> quítalo y usa IAM / IAP para restringir el acceso.

---

## Notas

- El endpoint `/healthz` sirve para health checks; `/api/config` expone si la key está
  configurada y la lista de modelos disponibles.
- Modelos disponibles: `eleven_multilingual_v2` (mejor español), `eleven_flash_v2_5` (rápido), `eleven_v3` (expresivo).
- Los ajustes avanzados (estabilidad, similitud, estilo, speaker boost) usan los mismos
  valores por defecto de tu notebook (0.55 / 0.80 / 0.20 / on).
- El MP3 se genera en calidad `mp3_44100_128` y se descarga directo desde el navegador.

---

## Qué le falta al proyecto (pendientes recomendados)

1. **Autenticación / control de acceso** — hoy cualquiera con la URL puede generar audio
   (y gastar tu cuota de ElevenLabs) si despliegas con `--allow-unauthenticated`. Como
   mínimo agrega un login simple o restringe con IAM/IAP.
2. **Rate limiting** — no hay límite de peticiones por usuario/IP; alguien podría agotar
   tu cuota de ElevenLabs con un script. Considera Flask-Limiter o un límite a nivel de
   Cloud Armor / API Gateway.
3. **Tests automatizados** — no hay ni un test. Como mínimo, tests de los endpoints Flask
   (mockeando el cliente de ElevenLabs) y tests de componentes React con Vitest + Testing
   Library.
4. **Manejo de textos largos** — ElevenLabs tiene límites de caracteres por request; no hay
   feedback al usuario si el texto excede el límite ni chunking automático.
5. **Persistencia/historial** — los audios generados no se guardan; si se quiere un
   historial de locuciones (por campaña, por locutor), falta una capa de storage (Cloud
   Storage + una tabla/BD ligera).
6. **Variables de entorno del frontend** — si algún día el frontend no vive en el mismo
   dominio que el backend (ej. CDN separado), falta una `VITE_API_URL` configurable en vez
   de rutas relativas fijas.
7. **CI/CD** — no hay pipeline (GitHub Actions, Cloud Build) que corra lint/tests y
   despliegue automáticamente a Cloud Run en cada push.
8. **Accesibilidad** — los `<select>`/`<input>` no tienen anuncios ARIA para el toast ni
   `aria-live`; el toast debería anunciarse a lectores de pantalla.
9. **Manejo de errores de red offline** — si `/api/voices` falla al cargar, no hay reintento
   automático, solo el toast.
10. **Linter/formatter unificado** — el frontend trae `oxlint` por defecto de Vite; conviene
    sumar Prettier/ESLint con reglas compartidas y un `pre-commit` que corra black/ruff en
    el backend.
