import { useEffect, useState } from 'react'
import { ReaderPrefs, ReaderPreset } from '../lib/readerPrefs'
import { useI18n } from '../components/I18nProvider'

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
  const { t } = useI18n()
  const backgroundSwatches = [
    { key: 'paper', value: '#fffdf7' },
    { key: 'sepia', value: '#f4eadc' },
    { key: 'mist', value: '#eef3f5' },
    { key: 'slate', value: '#1d232a' },
  ] as const
  const fallbackBackground = backgroundSwatches[0]?.value ?? '#fffdf7'
  const themeLabel = (key: ReaderPrefs['theme']) => t(`reader.controls.theme.${key}`)
  const fontLabel = (key: ReaderPrefs['font']) => t(`reader.controls.font.${key}`)
  const alignLabel = (key: ReaderPrefs['textAlign']) => t(`reader.controls.alignment.${key}`)
  const layoutLabel = (key: ReaderPrefs['layoutMode']) => t(`reader.controls.layout.${key}`)
  const presetLabel = (preset: ReaderPreset) => {
    const key = `reader.presets.${preset.id}`
    const translated = t(key)
    return translated === key ? preset.label : translated
  }

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
        <h2>{t('reader.controls.title')}</h2>
        <button className="button" onClick={onReset}>
          {t('reader.controls.reset')}
        </button>
      </div>
      <label className="field">
        {t('reader.controls.preset')}
        <select
          value={activePreset}
          onChange={(event) => onApplyPreset(event.target.value)}
        >
          <option value="custom">{t('reader.controls.preset.custom')}</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {presetLabel(preset)}
            </option>
          ))}
        </select>
      </label>
      <div className="reader-presets">
        <div className="reader-presets-header">
          <h3>{t('reader.controls.customPresets.title')}</h3>
          <span className="muted">{t('reader.controls.customPresets.subtitle')}</span>
        </div>
        <div className="reader-presets-create">
          <input
            type="text"
            value={newPresetName}
            onChange={(event) => setNewPresetName(event.target.value)}
            placeholder={t('reader.controls.customPresets.placeholder')}
          />
          <button
            className="button"
            onClick={handleSavePreset}
            disabled={!newPresetName.trim()}
          >
            {t('reader.controls.customPresets.save')}
          </button>
        </div>
        {customPresets.length === 0 ? (
          <p className="muted reader-presets-empty">
            {t('reader.controls.customPresets.empty')}
          </p>
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
                      {t('reader.controls.customPresets.apply')}
                    </button>
                    <button
                      className="button"
                      onClick={() => onRenamePreset(preset.id, trimmed)}
                      disabled={!canRename}
                    >
                      {t('reader.controls.customPresets.rename')}
                    </button>
                    <button
                      className="button"
                      onClick={() => onDeletePreset(preset.id)}
                    >
                      {t('reader.controls.customPresets.delete')}
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
        {t('reader.controls.scope')}
      </label>
      <label className="field">
        {t('reader.controls.theme.label')}
        <select
          value={prefs.theme}
          onChange={(event) =>
            onChange({
              ...prefs,
              theme: event.target.value as ReaderPrefs['theme'],
            })
          }
        >
          <option value="paper">{themeLabel('paper')}</option>
          <option value="sepia">{themeLabel('sepia')}</option>
          <option value="night">{themeLabel('night')}</option>
          <option value="slate">{themeLabel('slate')}</option>
          <option value="mist">{themeLabel('mist')}</option>
        </select>
      </label>
      <div className="reader-background">
        <div className="reader-background-header">
          <h3>{t('reader.controls.background.title')}</h3>
          <span className="muted">{t('reader.controls.background.subtitle')}</span>
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
              aria-label={t('reader.controls.background.swatch', {
                label: themeLabel(swatch.key),
              })}
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
            aria-label={t('reader.controls.background.custom')}
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
            {t('reader.controls.background.useTheme')}
          </button>
        </div>
        <label className="field">
          {t('reader.controls.brightness')}
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
        {t('reader.controls.font.label')}
        <select
          value={prefs.font}
          onChange={(event) =>
            onChange({
              ...prefs,
              font: event.target.value as ReaderPrefs['font'],
            })
          }
        >
          <option value="serif">{fontLabel('serif')}</option>
          <option value="sans">{fontLabel('sans')}</option>
          <option value="mono">{fontLabel('mono')}</option>
        </select>
      </label>
      <label className="field">
        {t('reader.controls.fontSize')}
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
        {t('reader.controls.lineHeight')}
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
        {t('reader.controls.readingPace')}
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
        <span className="field-value">
          {t('reader.controls.readingPace.value', { value: prefs.readingSpeed })}
        </span>
      </label>
      <label className="field">
        {t('reader.controls.pageWidth')}
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
        {t('reader.controls.alignment.label')}
        <select
          value={prefs.textAlign}
          onChange={(event) =>
            onChange({
              ...prefs,
              textAlign: event.target.value as ReaderPrefs['textAlign'],
            })
          }
        >
          <option value="left">{alignLabel('left')}</option>
          <option value="justify">{alignLabel('justify')}</option>
        </select>
      </label>
      <label className="field">
        {t('reader.controls.layout.label')}
        <select
          value={prefs.layoutMode}
          onChange={(event) =>
            onChange({
              ...prefs,
              layoutMode: event.target.value as ReaderPrefs['layoutMode'],
            })
          }
        >
          <option value="single">{layoutLabel('single')}</option>
          <option value="columns">{layoutLabel('columns')}</option>
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
        {t('reader.controls.focusMode')}
      </label>
    </div>
  )
}
