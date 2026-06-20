import { create } from 'zustand'

const FIX_TYPES = [
  { id: 'scope', label: '改多了' },
  { id: 'wrong', label: '改错了' },
  { id: 'misread', label: '理解偏了' },
  { id: 'plan_drift', label: '和 Plan 不一致' },
  { id: 'regression', label: '以前好的坏了' },
  { id: 'partial', label: '只对了一部分' },
]

export { FIX_TYPES }

export const useThreadStore = create((set, get) => ({
  phase: 'drift',
  focusOpen: false,
  detailOpen: false,
  peekLevel: 0,
  visibility: 'breath',
  cursorForeground: false,

  fixRound: 0,
  fixType: null,
  fixIntent: 'Agent 改的结果不对',
  coachQuestions: [],
  coachAnswers: {},
  coachQIndex: 0,
  coachLoading: false,
  coachError: '',
  lastPrompt: '',

  sweepTrigger: false,

  setPhase: (phase) => set({ phase }),
  setFocusOpen: (focusOpen) => set({ focusOpen }),
  setDetailOpen: (detailOpen) => set({ detailOpen }),
  toggleDetail: () =>
    set((s) => ({
      detailOpen: !s.detailOpen,
      focusOpen: false,
      phase: s.detailOpen ? 'drift' : s.phase,
    })),
  setPeekLevel: (peekLevel) => set({ peekLevel }),
  setVisibility: (visibility) => set({ visibility }),
  setCursorForeground: (cursorForeground) => set({ cursorForeground }),

  closeFix: () => set({ focusOpen: false, phase: 'drift' }),
  triggerFix: () =>
    set({
      phase: 'tangle',
      focusOpen: true,
      detailOpen: false,
      fixType: null,
      coachQuestions: [],
      coachAnswers: {},
      coachQIndex: 0,
      coachError: '',
    }),

  triggerSweep: () => {
    set({ sweepTrigger: true, phase: 'untangle', focusOpen: false })
    setTimeout(() => {
      set({ sweepTrigger: false, phase: 'drift' })
    }, 500)
  },

  setFixType: (fixType) => set({ fixType }),
  setFixIntent: (fixIntent) => set({ fixIntent }),
  setCoachQuestions: (coachQuestions) => set({ coachQuestions, coachQIndex: 0, coachAnswers: {} }),
  setCoachAnswer: (id, value) =>
    set((s) => ({ coachAnswers: { ...s.coachAnswers, [id]: value } })),
  nextCoachQ: () => set((s) => ({ coachQIndex: s.coachQIndex + 1 })),
  setCoachLoading: (coachLoading) => set({ coachLoading }),
  setCoachError: (coachError) => set({ coachError }),
  setLastPrompt: (lastPrompt) => set({ lastPrompt }),
  incrementFixRound: () => set((s) => ({ fixRound: s.fixRound + 1 })),

  consumeSweepTrigger: () => {
    const v = get().sweepTrigger
    if (v) set({ sweepTrigger: false })
    return v
  },
}))
