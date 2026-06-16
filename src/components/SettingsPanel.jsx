import { useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore.js'
import { CATEGORIES, loadOverrides, removeOverride, addOverride } from '../utils/rules.js'
import { formatClockLabel } from '../utils/settings.js'

const CATEGORY_OPTIONS = Object.values(CATEGORIES).filter((c) => c.key !== 'idle')

export default function SettingsPanel({ onBack }) {
  const { settings, patch, setMainline } = useSettingsStore()
  const [overrides, setOverrides] = useState(() => loadOverrides())
  const [newPattern, setNewPattern] = useState('')
  const [newCategory, setNewCategory] = useState('coding')

  const refreshOverrides = () => setOverrides(loadOverrides())

  const handleRemoveOverride = (pattern) => {
    removeOverride(pattern)
    refreshOverrides()
  }

  const handleAddOverride = () => {
    const p = newPattern.trim()
    if (!p) return
    addOverride(p, newCategory)
    setNewPattern('')
    refreshOverrides()
  }

  return (
    <div className="no-drag flex h-full flex-col gap-2.5 overflow-y-auto p-3 pb-2 pt-1" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-medium text-txt-primary">校准 TimeLens</span>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md px-2 py-0.5 text-[10px] text-txt-muted hover:bg-white/5 hover:text-txt-primary"
        >
          返回
        </button>
      </div>

      <Section title="今日主线">
        <input
          value={settings.mainlineDate === new Date().toISOString().slice(0, 10) ? settings.mainline : ''}
          onChange={(e) => setMainline(e.target.value)}
          placeholder="今天最重要的一件事…"
          className="field-input"
        />
        <p className="mt-1 text-[9px] leading-snug text-txt-muted">每天一条，番茄意图会优先参考它。</p>
      </Section>

      <Section title="外观">
        <select
          value={settings.presentationMode}
          onChange={(e) => patch({ presentationMode: e.target.value })}
          className="field-input w-full"
        >
          <option value="meniscus">弯月面 · Meniscus（默认）</option>
          <option value="standard">标准 · 点 + 分缝文字</option>
          <option value="horizon">地平线 · 顶线强调</option>
          <option value="minimal">极简 · 仅呼吸点</option>
        </select>
        <p className="mt-1 text-[9px] leading-snug text-txt-muted">
          液面色调 = 当前类别 · 顶线 = 一日航程 · 悬停时液面润湿展开，窥视文字浮于液面
        </p>
      </Section>

      <Section title="目标">
        <div className="grid grid-cols-2 gap-2">
          <Field
            label="番茄 / 天"
            type="number"
            min={1}
            max={20}
            value={settings.dailyPomodoroGoal}
            onChange={(v) => patch({ dailyPomodoroGoal: Number(v) })}
          />
          <Field
            label="专注目标 (h)"
            type="number"
            min={1}
            max={12}
            value={settings.productiveGoalHours}
            onChange={(v) => patch({ productiveGoalHours: Number(v) })}
          />
        </div>
      </Section>

      <Section title="工作日 · Dead reckoning">
        <div className="grid grid-cols-2 gap-2">
          <Field
            label="开始"
            type="time"
            value={formatClockLabel(settings.workDayStartHour, settings.workDayStartMin)}
            onChange={(v) => {
              const [h, m] = v.split(':').map(Number)
              patch({ workDayStartHour: h, workDayStartMin: m })
            }}
          />
          <Field
            label="结束"
            type="time"
            value={formatClockLabel(settings.workDayEndHour, settings.workDayEndMin)}
            onChange={(v) => {
              const [h, m] = v.split(':').map(Number)
              patch({ workDayEndHour: h, workDayEndMin: m })
            }}
          />
        </div>
      </Section>

      <Section title="番茄钟">
        <div className="grid grid-cols-3 gap-1.5">
          <Field
            label="专注"
            type="number"
            min={5}
            max={90}
            value={settings.pomodoroFocusMin}
            onChange={(v) => patch({ pomodoroFocusMin: Number(v) })}
          />
          <Field
            label="短休"
            type="number"
            min={1}
            max={30}
            value={settings.pomodoroShortBreakMin}
            onChange={(v) => patch({ pomodoroShortBreakMin: Number(v) })}
          />
          <Field
            label="长休"
            type="number"
            min={5}
            max={60}
            value={settings.pomodoroLongBreakMin}
            onChange={(v) => patch({ pomodoroLongBreakMin: Number(v) })}
          />
        </div>
      </Section>

      <Section title="我的分类规则">
        <div className="flex gap-1.5">
          <input
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="关键词，如 figma"
            className="field-input min-w-0 flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddOverride()}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="field-input w-[72px] shrink-0 px-1"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label.slice(0, 4)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddOverride}
            className="shrink-0 rounded-lg border border-white/10 px-2 text-[10px] text-txt-secondary hover:border-accent/40"
          >
            添加
          </button>
        </div>
        {overrides.length === 0 ? (
          <p className="mt-1.5 text-[9px] text-txt-muted">暂无 — 在面板里点「纠正」也会自动记住。</p>
        ) : (
          <ul className="mt-1.5 max-h-20 space-y-1 overflow-y-auto">
            {overrides.map((o) => (
              <li key={o.pattern} className="flex items-center gap-1.5 text-[10px]">
                <span className="min-w-0 flex-1 truncate text-txt-secondary">「{o.pattern}」</span>
                <span className="shrink-0 text-txt-muted">{CATEGORIES[o.categoryKey]?.label || o.categoryKey}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOverride(o.pattern)}
                  className="shrink-0 text-txt-muted hover:text-[#FCA5A5]"
                  title="删除"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      <div className="mb-1.5 text-[9px] uppercase tracking-wide text-txt-muted">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, type, value, onChange, min, max }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[9px] text-txt-muted">{label}</span>
      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-input w-full"
      />
    </label>
  )
}
