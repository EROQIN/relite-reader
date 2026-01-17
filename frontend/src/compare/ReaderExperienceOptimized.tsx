export default function ReaderExperienceOptimized() {
  return (
    <section className="reader-experience">
      <header className="reader-experience__hero">
        <div>
          <span className="overline">Reader Lab</span>
          <h1>Design your reading atmosphere.</h1>
          <p className="muted">
            Tune typography, spacing, and tone while keeping your progress and focus
            center stage.
          </p>
        </div>
        <div className="reader-experience__actions">
          <button className="button primary">Apply preset</button>
          <button className="button">Save layout</button>
        </div>
      </header>
      <main className="reader-experience__layout">
        <article className="reader-experience__surface panel">
          <div className="reader-meta">
            <h2>Gentle Read: Chapter One</h2>
            <span className="reader-progress">42%</span>
          </div>
          <div className="reader-scroll">
            <pre className="reader-text">
              {`A quiet room, a slow morning, and a shelf of books. The reading
experience is built from stillness—fewer interruptions, clearer options, and
soft structure that keeps the reader in flow.

The panel to the right keeps the adjustments visible, while the surface centers
the text. Toggle the theme, scale the type, and shape the width to your
preference.`}
            </pre>
          </div>
        </article>
        <aside className="reader-experience__panel panel">
          <div className="reader-panel-header">
            <h2>Studio Controls</h2>
            <button className="button">Reset</button>
          </div>
          <div className="field">
            <label>Theme</label>
            <select defaultValue="paper">
              <option value="paper">Paper</option>
              <option value="sepia">Sepia</option>
              <option value="night">Night</option>
            </select>
          </div>
          <div className="field">
            <label>Font</label>
            <select defaultValue="serif">
              <option value="serif">Serif</option>
              <option value="sans">Sans</option>
              <option value="mono">Mono</option>
            </select>
          </div>
          <div className="field">
            <label>Font size</label>
            <input type="range" min={14} max={22} defaultValue={18} />
          </div>
          <div className="field">
            <label>Line height</label>
            <input type="range" min={1.4} max={2} step={0.05} defaultValue={1.7} />
          </div>
          <div className="field">
            <label>Page width</label>
            <input type="range" min={520} max={900} step={20} defaultValue={720} />
          </div>
        </aside>
      </main>
    </section>
  )
}
