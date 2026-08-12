const JSON_HEADERS = { "Content-Type": "application/json" };

async function parseError(res, fallback) {
  try {
    const data = await res.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export async function getConfig() {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error(await parseError(res, "No se pudo cargar la configuración."));
  return res.json();
}

export async function getVoices() {
  const res = await fetch("/api/voices");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error al cargar voces");
  return data.voices;
}

export async function fetchPreview(voiceId, modelId) {
  const res = await fetch("/api/preview", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ voice_id: voiceId, model_id: modelId }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error en la muestra"));
  return res.blob();
}

export async function generateAudio(payload) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al generar"));
  return res.blob();
}

export async function generatePodcast(payload) {
  const res = await fetch("/api/generate_podcast", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al generar el podcast"));
  return res.blob();
}
