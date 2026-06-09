import { useModal } from '../hooks/useModal'
import { applyPreset } from '../lib/presets'
import { markOnboardingComplete } from '../lib/storage'
import type { FormatSettings } from '../types/script'
import { SAMPLE_SCRIPT } from '../types/script'

interface OnboardingModalProps {
  open: boolean
  currentSettings: FormatSettings
  onApply: (settings: FormatSettings, script: string) => void
  onClose: () => void
}

export function OnboardingModal({
  open,
  currentSettings,
  onApply,
  onClose,
}: OnboardingModalProps) {
  const panelRef = useModal<HTMLDivElement>(open, onClose)

  if (!open) return null

  const handleFormat = () => {
    markOnboardingComplete()
    onApply(applyPreset('dramatists-guild', currentSettings), SAMPLE_SCRIPT)
    onClose()
  }

  const handleDismiss = () => {
    markOnboardingComplete()
    onClose()
  }

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close onboarding"
        onClick={handleDismiss}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative max-w-md rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"
      >
        <h2 id="onboarding-title" className="text-lg font-semibold text-white">
          Format for Dramatists Guild
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Stagecraft applies DG manuscript standards: Courier 12pt, 1.5&quot; binding
          margin, parenthetical stage directions, cast page, and page 1 numbering.
        </p>
        <ul className="mt-4 space-y-2 text-xs text-zinc-500">
          <li>• Character names in ALL CAPS before dialogue</li>
          <li>• Stage directions in parentheses: (MARCUS exits.)</li>
          <li>• Cast page with age, gender, and descriptions</li>
          <li>• Export submission ZIP for agents and theatres</li>
        </ul>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={handleFormat} className="btn-primary flex-1">
            Apply DG format
          </button>
          <button type="button" onClick={handleDismiss} className="btn-secondary">
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
