import { motion } from 'framer-motion'

export default function PeakToast({ toast, onDismiss, onUndo }) {
  if (!toast) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="no-drag pointer-events-auto absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-black/70 px-2.5 py-2 backdrop-blur-md"
    >
      <span className="truncate text-[11px] text-txt-primary">{toast.message}</span>
      <div className="flex shrink-0 items-center gap-2">
        {toast.undoLabel && onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            className="text-[11px] text-accent-bright hover:text-accent"
          >
            {toast.undoLabel}
          </button>
        ) : null}
        <button type="button" onClick={onDismiss} className="text-[10px] text-txt-muted hover:text-txt-secondary">
          ✕
        </button>
      </div>
    </motion.div>
  )
}
