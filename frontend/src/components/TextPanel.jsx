export default function TextPanel({
  text,
  onTextChange,
  filename,
  onFilenameChange,
  onGenerate,
  generating,
  resultUrl,
}) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="card-icon">📝</div>
        <div>
          <span className="eyebrow">PASO 2</span>
          <h2>Pega tu texto y genera</h2>
        </div>
      </div>

      <label className="field-label" htmlFor="texto">Texto a convertir</label>
      <textarea
        id="texto"
        className="input textarea"
        placeholder="Pega aquí el guion que quieres convertir en MP3..."
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
      />

      <label className="field-label" htmlFor="nombre">Nombre del archivo</label>
      <div className="filename-row">
        <input
          id="nombre"
          className="input"
          type="text"
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
        />
        <span className="ext">.mp3</span>
      </div>

      <button
        id="btn-generar"
        className={`btn btn-primary ${generating ? "loading" : ""}`}
        disabled={generating}
        onClick={onGenerate}
      >
        ⚡ Generar MP3
      </button>

      {resultUrl && (
        <div className="audio-wrap">
          <audio controls src={resultUrl} />
          <a className="btn btn-ghost" href={resultUrl} download={`${filename || "mi_audio"}.mp3`}>
            ⬇️ Descargar MP3
          </a>
        </div>
      )}
    </section>
  );
}
