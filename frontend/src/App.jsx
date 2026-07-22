import { useEffect, useRef, useState } from "react";
import VoicePanel from "./components/VoicePanel.jsx";
import TextPanel from "./components/TextPanel.jsx";
import Toast from "./components/Toast.jsx";
import { getConfig, getVoices, fetchPreview, generateAudio } from "./api.js";

const DEFAULT_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.8,
  style: 0.2,
  use_speaker_boost: true,
};

export default function App() {
  const [apiOk, setApiOk] = useState(true);
  const [modelos, setModelos] = useState([]);
  const [voices, setVoices] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [text, setText] = useState("");
  const [filename, setFilename] = useState("mi_audio");

  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [resultUrl, setResultUrl] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "error" });
  const toastTimer = useRef(null);
  const previewObjectUrl = useRef(null);
  const resultObjectUrl = useRef(null);

  function showToast(message, type = "error") {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ message: "", type }), 5000);
  }

  useEffect(() => {
    getConfig()
      .then(({ api_ok, modelos: lista }) => {
        setApiOk(api_ok);
        setModelos(lista);
        if (lista.length) setSelectedModel(lista[0].id);
      })
      .catch((e) => showToast(e.message));

    getVoices()
      .then((lista) => {
        setVoices(lista);
        if (lista.length) setSelectedVoice(lista[0].id);
      })
      .catch((e) => showToast(e.message));
  }, []);

  async function handlePreview() {
    if (!selectedVoice) return showToast("Selecciona una voz primero.");
    setPreviewLoading(true);
    try {
      const blob = await fetchPreview(selectedVoice, selectedModel);
      if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = URL.createObjectURL(blob);
      setPreviewUrl(previewObjectUrl.current);
    } catch (e) {
      showToast(e.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedVoice) return showToast("Selecciona una voz.");
    if (!text.trim()) return showToast("Pega el texto que quieres convertir.");
    setGenerating(true);
    try {
      const blob = await generateAudio({
        voice_id: selectedVoice,
        model_id: selectedModel,
        text: text.trim(),
        filename: filename.trim() || "mi_audio",
        ...settings,
      });
      if (resultObjectUrl.current) URL.revokeObjectURL(resultObjectUrl.current);
      resultObjectUrl.current = URL.createObjectURL(blob);
      setResultUrl(resultObjectUrl.current);
      showToast("MP3 generado correctamente.", "ok");
    } catch (e) {
      showToast(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>

      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">🎙️</div>
          <div className="brand-text">
            <strong>Estudio de Voz</strong>
            <span>FÁBRICA DE CONTENIDOS · CUN</span>
          </div>
        </div>
        <div className="user">
          <div className="user-text">
            <strong>HAIDER BELLO</strong>
            <span>COORDINADOR</span>
          </div>
          <div className="user-avatar">HB</div>
        </div>
      </header>

      <main className="container">
        <section className="card hero">
          <span className="eyebrow">TEXTO → AUDIO · ELEVENLABS</span>
          <h1>Hola, <span className="accent">HAIDER</span></h1>
          <p className="lead">
            Convierte tus guiones en locuciones MP3 con voz profesional. Elige la voz, escúchala y descarga.
          </p>
          <div className="hero-summary">
            <div className="stat">
              <strong>{voices.length || "—"}</strong>
              <span>VOCES DISPONIBLES</span>
            </div>
            <div className="stat">
              <strong>MP3</strong>
              <span>44.1 kHz · 128 kbps</span>
            </div>
          </div>
        </section>

        {!apiOk && (
          <div className="banner banner-warn">
            <span>
              ⚠️ El servidor no tiene configurada la variable <code>ELEVENLABS_API_KEY</code>.
              Las voces no cargarán hasta configurarla.
            </span>
          </div>
        )}

        <div className="grid">
          <VoicePanel
            voices={voices}
            filtro={filtro}
            onFiltroChange={setFiltro}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            modelos={modelos}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            settings={settings}
            onSettingsChange={setSettings}
            onPreview={handlePreview}
            previewLoading={previewLoading}
            previewUrl={previewUrl}
          />
          <TextPanel
            text={text}
            onTextChange={setText}
            filename={filename}
            onFilenameChange={setFilename}
            onGenerate={handleGenerate}
            generating={generating}
            resultUrl={resultUrl}
          />
        </div>

        <Toast message={toast.message} type={toast.type} />
      </main>

      <footer className="footer">Fábrica de Contenidos e IA · CUN — Estudio de Voz</footer>
    </>
  );
}
