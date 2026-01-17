import { useEffect, useState } from 'react'
import { ReaderPrefs, ReaderPreset } from '../lib/readerPrefs'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export default function ReaderControls({
  prefs,
  presets,
  activePreset,
  bookScoped,
  customPresets,
  onScopeChange,
  onApplyPreset,
  onSavePreset,
  onRenamePreset,
  onDeletePreset,
  onChange,
  onReset,
}: {
  prefs: ReaderPrefs
  presets: ReaderPreset[]
  activePreset: string
  bookScoped: boolean
  customPresets: ReaderPreset[]
  onScopeChange: (next: boolean) => void
  onApplyPreset: (presetId: string) => void
  onSavePreset: (label: string) => void
  onRenamePreset: (presetId: string, label: string) => void
  onDeletePreset: (presetId: string) => void
  onChange: (prefs: ReaderPrefs) => void
  onReset: () => void
}) {
  const [newPresetName, setNewPresetName] = useState('')
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({})
  const backgroundSwatches = [
    { label: 'Paper', value: '#fffdf7' },
    { label: 'Sepia', value: '#f4eadc' },
    { label: 'Mist', value: '#eef3f5' },
    { label: 'Slate', value: '#1d232a' },
  ]
  const fallbackBackground = backgroundSwatches[0]?.value ?? '#fffdf7'

  useEffect(() => {
    const nextDrafts: Record<string, string> = {}
    customPresets.forEach((preset) => {
      nextDrafts[preset.id] = preset.label
    })
    setRenameDrafts(nextDrafts)
  }, [customPresets])

  const handleSavePreset = () => {
    const trimmed = newPresetName.trim()
    if (!trimmed) {
      return
    }
    onSavePreset(trimmed)
    setNewPresetName('')
  }

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
      <div className="reader-presets">
        <div className="reader-presets-header">
          <h3>Custom presets</h3>
          <span className="muted">Save your current setup.</span>
        </div>
        <div className="reader-presets-create">
          <input
            type="text"
            value={newPresetName}
            onChange={(event) => setNewPresetName(event.target.value)}
            placeholder="Preset name"
          />
          <button
            className="button"
            onClick={handleSavePreset}
            disabled={!newPresetName.trim()}
          >
            Save
          </button>
        </div>
        {customPresets.length === 0 ? (
          <p className="muted reader-presets-empty">No custom presets yet.</p>
        ) : (
          <div className="reader-presets-list">
            {customPresets.map((preset) => {
              const draft = renameDrafts[preset.id] ?? preset.label
              const trimmed = draft.trim()
              const canRename = trimmed.length > 0 && trimmed !== preset.label
              return (
                <div className="reader-preset-item" key={preset.id}>
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) =>
                      setRenameDrafts((prev) => ({
                        ...prev,
                        [preset.id]: event.target.value,
                      }))
                    }
                  />
                  <div className="reader-preset-actions">
                    <button
                      className="button"
                      onClick={() => onApplyPreset(preset.id)}
                    >
                      Apply
                    </button>
                    <button
                      className="button"
                      onClick={() => onRenamePreset(preset.id, trimmed)}
                      disabled={!canRename}
                    >
                      Rename
                    </button>
                    <button
                      className="button"
                      onClick={() => onDeletePreset(preset.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
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
          <option value="slate">Slate</option>
          <option value="mist">Mist</option>
        </select>
      </label>
      <div className="reader-background">
        <div className="reader-background-header">
          <h3>Background</h3>
          <span className="muted">Override the theme if you want a custom tone.</span>
        </div>
        <div className="reader-background-swatches">
          {backgroundSwatches.map((swatch) => (
            <button
              type="button"
              key={swatch.value}
              className={`reader-swatch ${
                prefs.background === swatch.value ? 'active' : ''
              }`}
              style={{ background: swatch.value }}
              onClick={() =>
                onChange({
                  ...prefs,
                  background: swatch.value,
                })
              }
              aria-label={`Background ${swatch.label}`}
            />
          ))}
        </div>
        <div className="reader-background-custom">
          <input
            type="color"
            value={prefs.background || fallbackBackground}
            onChange={(event) =>
              onChange({
                ...prefs,
                background: event.target.value,
              })
            }
            aria-label="Custom background color"
          />
          <button
            type="button"
            className="button"
            onClick={() =>
              onChange({
                ...prefs,
                background: '',
              })
            }
            disabled={!prefs.background}
          >
            Use theme
          </button>
        </div>
        <label className="field">
          Brightness
          <input
            type="range"
            min={0.8}
            max={1.2}
            step={0.02}
            value={prefs.brightness}
            onChange={(event) =>
              onChange({
                ...prefs,
                brightness: clamp(Number(event.target.value), 0.8, 1.2),
              })
            }
          />
          <span className="field-value">{Math.round(prefs.brightness * 100)}%</span>
        </label>
      </div>
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
        Reading pace
        <input
          type="range"
          min={160}
          max={340}
          step={10}
          value={prefs.readingSpeed}
          onChange={(event) =>
            onChange({
              ...prefs,
              readingSpeed: clamp(Number(event.target.value), 160, 340),
            })
          }
        />
        <span className="field-value">{prefs.readingSpeed} wpm</span>
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
