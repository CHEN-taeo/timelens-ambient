import { useEffect, useState, useCallback, useRef } from 'react'
import { useThreadStore, FIX_TYPES } from '../store/useThreadStore.js'

const BOUNDARY_OPTIONS = [
  '只改我提到的函数/文件',
  '不要动其它模块',
  '不确定，标注 [待确认]',
  '我不确定，你帮我选',
]

export default function ThreadFocus() {
  const focusOpen = useThreadStore((s) => s.focusOpen)
  const fixType = useThreadStore((s) => s.fixType)
  const fixIntent = useThreadStore((s) => s.fixIntent)
  const coachQuestions = useThreadStore((s) => s.coachQuestions)
  const coachAnswers = useThreadStore((s) => s.coachAnswers)
  const coachQIndex = useThreadStore((s) => s.coachQIndex)
  const coachLoading = useThreadStore((s) => s.coachLoading)
  const coachError = useThreadStore((s) => s.coachError)
  const fixRound = useThreadStore((s) => s.fixRound)

  const setFixType = useThreadStore((s) => s.setFixType)
  const setFixIntent = useThreadStore((s) => s.setFixIntent)
  const setCoachQuestions = useThreadStore((s) => s.setCoachQuestions)
  const nextCoachQ = useThreadStore((s) => s.nextCoachQ)
  const setCoachLoading = useThreadStore((s) => s.setCoachLoading)
  const setCoachError = useThreadStore((s) => s.setCoachError)
  const triggerSweep = useThreadStore((s) => s.triggerSweep)
  const incrementFixRound = useThreadStore((s) => s.incrementFixRound)
  const setLastPrompt = useThreadStore((s) => s.setLastPrompt)

  const [step, setStep] = useState('type')
  const [activeOption, setActiveOption] = useState(0)
  const confirmRef = useRef(null)

  const runCoach = useCallback(async (body) => {
    if (!window.timelens?.runCoach) {
      throw new Error('Coach 未就绪')
    }
    return window.timelens.runCoach(body)
  }, [])

  const finishWithPrompt = useCallback(
    async (prompt) => {
      await window.timelens?.writeClipboard?.(prompt)
      setLastPrompt(prompt)
      saveFixHistory(prompt, fixType)
      incrementFixRound()
      triggerSweep()
    },
    [fixType, incrementFixRound, setLastPrompt, triggerSweep],
  )

  const confirmOption = useCallback(
    async (idx) => {
      if (useThreadStore.getState().coachLoading) return

      if (step === 'type') {
        const picked = FIX_TYPES[idx]
        if (!picked) return
        setFixType(picked.id)
        setStep('intent')
        return
      }

      if (step === 'intent') {
        setStep('boundary')
        setActiveOption(0)
        return
      }

      if (step === 'boundary') {
        const boundary = BOUNDARY_OPTIONS[idx]
        setCoachLoading(true)
        setCoachError('')
        try {
          const intent = buildIntent(fixIntent, fixType, boundary, fixRound)
          const data = await runCoach({
            intent,
            mode: 'fix',
            clientVague: intent.length < 12,
          })

          if (data.ready && data.prompt) {
            await finishWithPrompt(data.prompt)
            return
          }

          const qs = data.questions || []
          if (!qs.length) throw new Error('没有生成问题')
          setCoachQuestions(qs)
          setStep('coach')
          setActiveOption(0)
        } catch (err) {
          setCoachError(err.message || '请求失败')
        } finally {
          setCoachLoading(false)
        }
        return
      }

      if (step === 'coach') {
        const q = coachQuestions[coachQIndex]
        if (!q) return
        const value = q.options[idx]
        const next = { ...coachAnswers, [q.id]: value }

        if (coachQIndex + 1 < coachQuestions.length) {
          useThreadStore.setState({ coachAnswers: next })
          nextCoachQ()
          setActiveOption(0)
          return
        }

        setCoachLoading(true)
        setCoachError('')
        try {
          const intent = buildIntent(fixIntent, fixType, null, fixRound)
          const data = await runCoach({
            intent,
            mode: 'fix',
            answers: next,
          })
          if (!data.prompt) throw new Error('未生成 prompt')
          await finishWithPrompt(data.prompt)
        } catch (err) {
          setCoachError(err.message || '生成失败')
        } finally {
          setCoachLoading(false)
        }
      }
    },
    [
      step,
      fixIntent,
      fixType,
      fixRound,
      coachQuestions,
      coachQIndex,
      coachAnswers,
      runCoach,
      finishWithPrompt,
      setFixType,
      setCoachQuestions,
      nextCoachQ,
      setCoachLoading,
      setCoachError,
    ],
  )

  confirmRef.current = confirmOption

  useEffect(() => {
    if (!focusOpen) {
      setStep('type')
      setActiveOption(0)
    }
  }, [focusOpen])

  useEffect(() => {
    const onKey = (e) => {
      if (!useThreadStore.getState().focusOpen) return
      const s = step
      const opts =
        s === 'type'
          ? FIX_TYPES
          : s === 'boundary'
            ? BOUNDARY_OPTIONS.map((label) => ({ label }))
            : coachQuestions[coachQIndex]?.options?.map((label) => ({ label })) || []

      if (e.key === 'Tab') {
        e.preventDefault()
        setActiveOption((i) => (i + 1) % Math.max(1, opts.length))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        confirmRef.current?.(activeOption)
      }
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1
        if (idx < opts.length) confirmRef.current?.(idx)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, coachQuestions, coachQIndex, activeOption])

  if (!focusOpen) return null

  return (
    <div className="thread-focus no-drag">
      <div className="thread-focus-head">
        撤步 {fixRound > 0 ? `· 第 ${fixRound + 1} 轮` : ''}
      </div>

      {step === 'type' && (
        <>
          <p className="thread-focus-q">AI 哪类错了？</p>
          <div className="thread-focus-options">
            {FIX_TYPES.map((t, i) => (
              <button
                key={t.id}
                type="button"
                className={`thread-opt${i === activeOption ? ' active' : ''}`}
                onMouseEnter={() => setActiveOption(i)}
                onClick={() => confirmOption(i)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'intent' && (
        <>
          <p className="thread-focus-q">一句话说哪里不对（可模糊）</p>
          <textarea
            className="thread-focus-input"
            value={fixIntent}
            onChange={(e) => setFixIntent(e.target.value)}
            rows={2}
            placeholder="比如：登录按钮也被改坏了"
          />
          <button type="button" className="thread-focus-btn" onClick={() => confirmOption(0)}>
            继续
          </button>
        </>
      )}

      {step === 'boundary' && (
        <>
          <p className="thread-focus-q">哪些不能动？</p>
          <div className="thread-focus-options">
            {BOUNDARY_OPTIONS.map((label, i) => (
              <button
                key={label}
                type="button"
                className={`thread-opt${i === activeOption ? ' active' : ''}`}
                onMouseEnter={() => setActiveOption(i)}
                onClick={() => confirmOption(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'coach' && coachQuestions[coachQIndex] && (
        <>
          <p className="thread-focus-q">{coachQuestions[coachQIndex].question}</p>
          <div className="thread-focus-options">
            {coachQuestions[coachQIndex].options.map((label, i) => (
              <button
                key={label}
                type="button"
                className={`thread-opt${i === activeOption ? ' active' : ''}`}
                onMouseEnter={() => setActiveOption(i)}
                onClick={() => confirmOption(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {coachLoading && <p className="thread-focus-hint">生成中…</p>}
      {coachError && <p className="thread-focus-error">{coachError}</p>}
      <p className="thread-focus-hint">Tab 切换 · Enter 确认 · 1–9 快选</p>
    </div>
  )
}

function buildIntent(base, fixType, boundary, fixRound) {
  const typeLabel = FIX_TYPES.find((t) => t.id === fixType)?.label || fixType
  let s = `${base}（类型：${typeLabel}）`
  if (boundary) s += `（边界：${boundary}）`
  if (fixRound > 0) s += `（第 ${fixRound + 1} 轮纠正，上次未完全生效）`
  return s
}

function saveFixHistory(prompt, fixType) {
  try {
    const key = 'thread-fix-history'
    const raw = JSON.parse(localStorage.getItem(key) || '[]')
    raw.unshift({
      at: Date.now(),
      fixType,
      prompt: prompt.slice(0, 500),
    })
    localStorage.setItem(key, JSON.stringify(raw.slice(0, 20)))
  } catch {
    /* ignore */
  }
}
