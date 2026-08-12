export default function PodcastPanel({
  voices,
  voiceSlots,
  onAddVoiceSlot,
  onRemoveVoiceSlot,
  onUpdateVoiceSlot,
  script,
  onScriptChange,
  modelos,
  selectedModel,
  onModelChange,
  filename,
  onFilenameChange,
  onGenerate,
  generating,
  resultUrl,
}) {
  const ejemplo = voiceSlots.map((_, i) => `Voz ${i + 1}: texto de esta voz...`).join("\n");

  return (
    <section className="card">
      <div className="card-head">
        <div className="card-icon">🎧</div>
        <div>
          <span className="eyebrow">MODO PODCAST</span>
          <h2>Elige las voces y escribe el guion</h2>
        </div>
      </div>

      <label className="field-label">Voces del podcast</label>
      <div className="voice-slots">
        {voiceSlots.map((voiceId, i) => (
          <div className="voice-slot-row" key={i}>
            <span className="voice-slot-tag">Voz {i + 1}</span>
            <select
              className="input"
              value={voiceId}
              onChange={(e) => onUpdateVoiceSlot(i, e.target.value)}
            >
              {voices.length === 0 && <option value="">Cargando voces...</option>}
              {voices.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn-icon btn-icon-danger"
              title="Quitar voz"
              disabled={voiceSlots.length <= 1}
              onClick={() => onRemoveVoiceSlot(i)}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost" onClick={onAddVoiceSlot}>
        + Agregar voz
      </button>

      <label className="field-label" htmlFor="guion-podcast">Guion (una línea por intervención)</label>
      <p className="script-hint">
        Escribe cada intervención empezando con la etiqueta de la voz, así:
        <br />
        <code>{ejemplo}</code>
      </p>
      <textarea
        id="guion-podcast"
        className="input textarea"
        placeholder={`Voz 1: Hola, bienvenidos al podcast.\nVoz 2: Hoy vamos a hablar de...`}
        value={script}
        onChange={(e) => onScriptChange(e.target.value)}
      />

      <label className="field-label" htmlFor="modelo-podcast">Modelo</label>
      <select
        id="modelo-podcast"
        className="input"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
      >
        {modelos.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>

      <label className="field-label" htmlFor="nombre-podcast">Nombre del archivo</label>
      <div className="filename-row">
        <input
          id="nombre-podcast"
          className="input"
          type="text"
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
        />
        <span className="ext">.mp3</span>
      </div>

      <button
        id="btn-generar-podcast"
        className={`btn btn-primary ${generating ? "loading" : ""}`}
        disabled={generating}
        onClick={onGenerate}
      >
        ⚡ Generar podcast
      </button>

      {resultUrl && (
        <div className="audio-wrap">
          <audio controls src={resultUrl} />
          <a className="btn btn-ghost" href={resultUrl} download={`${filename || "mi_podcast"}.mp3`}>
            ⬇️ Descargar MP3
          </a>
        </div>
      )}
    </section>
  );
}
