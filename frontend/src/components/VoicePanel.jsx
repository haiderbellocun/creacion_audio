export default function VoicePanel({
  voices,
  filtro,
  onFiltroChange,
  selectedVoice,
  onVoiceChange,
  modelos,
  selectedModel,
  onModelChange,
  settings,
  onSettingsChange,
  onPreview,
  previewLoading,
  previewUrl,
}) {
  const filtered = filtro
    ? voices.filter((v) => v.name.toLowerCase().includes(filtro.toLowerCase().trim()))
    : voices;

  return (
    <section className="card">
      <div className="card-head">
        <div className="card-icon">🗣️</div>
        <div>
          <span className="eyebrow">PASO 1</span>
          <h2>Elige y escucha la voz</h2>
        </div>
      </div>

      <label className="field-label" htmlFor="filtro">Buscar voz</label>
      <input
        id="filtro"
        className="input"
        type="text"
        placeholder="Escribe para filtrar (ej. Roger, Valentina)..."
        value={filtro}
        onChange={(e) => onFiltroChange(e.target.value)}
      />

      <label className="field-label" htmlFor="voz">Voz</label>
      <select
        id="voz"
        className="input"
        value={selectedVoice}
        onChange={(e) => onVoiceChange(e.target.value)}
      >
        {voices.length === 0 && <option value="">Cargando voces...</option>}
        {voices.length > 0 && filtered.length === 0 && <option value="">Sin resultados</option>}
        {filtered.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>

      <label className="field-label" htmlFor="modelo">Modelo</label>
      <select
        id="modelo"
        className="input"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
      >
        {modelos.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>

      <button
        id="btn-preview"
        className={`btn btn-ghost ${previewLoading ? "loading" : ""}`}
        disabled={previewLoading}
        onClick={onPreview}
      >
        🔊 Escuchar muestra
      </button>
      {previewUrl && (
        <div className="audio-wrap">
          <audio controls src={previewUrl} autoPlay />
        </div>
      )}

      <details className="advanced">
        <summary>Ajustes avanzados</summary>
        <div className="slider-row">
          <label>Estabilidad <b>{settings.stability.toFixed(2)}</b></label>
          <input
            type="range" min="0" max="1" step="0.05"
            value={settings.stability}
            onChange={(e) => onSettingsChange({ ...settings, stability: parseFloat(e.target.value) })}
          />
        </div>
        <div className="slider-row">
          <label>Similitud <b>{settings.similarity_boost.toFixed(2)}</b></label>
          <input
            type="range" min="0" max="1" step="0.05"
            value={settings.similarity_boost}
            onChange={(e) => onSettingsChange({ ...settings, similarity_boost: parseFloat(e.target.value) })}
          />
        </div>
        <div className="slider-row">
          <label>Estilo <b>{settings.style.toFixed(2)}</b></label>
          <input
            type="range" min="0" max="1" step="0.05"
            value={settings.style}
            onChange={(e) => onSettingsChange({ ...settings, style: parseFloat(e.target.value) })}
          />
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.use_speaker_boost}
            onChange={(e) => onSettingsChange({ ...settings, use_speaker_boost: e.target.checked })}
          />
          Speaker boost
        </label>
      </details>
    </section>
  );
}
