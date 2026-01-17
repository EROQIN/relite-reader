import { ReaderPrefs, ReaderPreset } from '../lib/readerPrefs'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export default function ReaderControls({
  prefs,
  presets,
  activePreset,
  bookScoped,
  onScopeChange,
  onApplyPreset,
  onChange,
  onReset,
}: {
  prefs: ReaderPrefs
  presets: ReaderPreset[]
  activePreset: string
  bookScoped: boolean
  onScopeChange: (next: boolean) => void
  onApplyPreset: (presetId: string) => void
  onChange: (prefs: ReaderPrefs) => void
  onReset: () => void
}) {
  return (
    <div className="panel reader-panel">
      <div className="reader-panel-header">
        <h2>Customize</h2>
        <button className="button" onClick={onReset}>
          Reset
        </button>
      </div>
      <label className="field">
        Preset
        <select
          value={activePreset}
          onChange={(event) => onApplyPreset(event.target.value)}
        >
          <option value="custom">Custom</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field toggle">
        <input
          type="checkbox"
          checked={bookScoped}
          onChange={(event) => onScopeChange(event.target.checked)}
        />
        Apply to this book
      </label>
      <label className="field">
        Theme
        <select
          value={prefs.theme}
          onChange={(event) =>
            onChange({
              ...prefs,
              theme: event.target.value as ReaderPrefs['theme'],
            })
          }
        >
          <option value="paper">Paper</option>
          <option value="sepia">Sepia</option>
          <option value="night">Night</option>
        </select>
      </label>
      <label className="field">
        Font
        <select
          value={prefs.font}
          onChange={(event) =>
            onChange({
              ...prefs,
              font: event.target.value as ReaderPrefs['font'],
            })
          }
        >
          <option value="serif">Serif</option>
          <option value="sans">Sans</option>
          <option value="mono">Mono</option>
        </select>
      </label>
      <label className="field">
        Font size
        <input
          type="range"
          min={14}
          max={22}
          value={prefs.fontSize}
          onChange={(event) =>
            onChange({
              ...prefs,
              fontSize: clamp(Number(event.target.value), 14, 22),
            })
          }
        />
        <span className="field-value">{prefs.fontSize}px</span>
      </label>
      <label className="field">
        Line height
        <input
          type="range"
          min={1.4}
          max={2}
          step={0.05}
          value={prefs.lineHeight}
          onChange={(event) =>
            onChange({
              ...prefs,
              lineHeight: clamp(Number(event.target.value), 1.4, 2),
            })
          }
        />
        <span className="field-value">{prefs.lineHeight.toFixed(2)}</span>
      </label>
      <label className="field">
        Page width
        <input
          type="range"
          min={520}
          max={900}
          step={20}
          value={prefs.pageWidth}
          onChange={(event) =>
            onChange({
              ...prefs,
              pageWidth: clamp(Number(event.target.value), 520, 900),
            })
          }
        />
        <span className="field-value">{prefs.pageWidth}px</span>
      </label>
      <label className="field">
        Alignment
        <select
          value={prefs.textAlign}
          onChange={(event) =>
            onChange({
              ...prefs,
              textAlign: event.target.value as ReaderPrefs['textAlign'],
            })
          }
        >
          <option value="left">Left</option>
          <option value="justify">Justify</option>
        </select>
      </label>
      <label className="field">
        Layout
        <select
          value={prefs.layoutMode}
          onChange={(event) =>
            onChange({
              ...prefs,
              layoutMode: event.target.value as ReaderPrefs['layoutMode'],
            })
          }
        >
          <option value="single">Single</option>
          <option value="columns">Columns</option>
        </select>
      </label>
      <label className="field toggle">
        <input
          type="checkbox"
          checked={prefs.focusMode}
          onChange={(event) =>
            onChange({
              ...prefs,
              focusMode: event.target.checked,
            })
          }
        />
        Focus mode
      </label>
    </div>
  )
}
