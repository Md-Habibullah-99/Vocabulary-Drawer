/**
 * SettingsPanel.jsx
 * ------------------
 * A slide-in panel (not a modal) so opening settings feels like pulling
 * open a drawer rather than an interruption — consistent with the
 * catalog-drawer metaphor used throughout the app.
 *
 * Controls:
 *  - Reset Meaning on Navigation
 *  - Audio Simulation Placeholder (future text-to-speech)
 *  - Shuffle Mode
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - settings: { resetMeaningOnNavigation, audioEnabled, shuffleMode }
 *  - onUpdateSetting: (key, value) => void
 *  - onResetData: () => void
 */

import React from "react";
import { X, Volume2, Shuffle, RotateCcw, Trash2 } from "lucide-react";

export default function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onResetData,
}) {
  return (
    <>
      {/* Backdrop — click to dismiss, like closing a drawer */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-ink/30 transition-opacity z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-label="Settings"
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-paper border-l border-rule z-50 shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-rule">
          <h2 className="font-display font-semibold text-xl text-ink">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-sm hover:bg-ink/[0.06] text-ink/60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          <ToggleRow
            Icon={RotateCcw}
            title="Reset meaning on navigation"
            description="Hide the translation again whenever you move to the next or previous card."
            checked={settings.resetMeaningOnNavigation}
            onChange={(value) => onUpdateSetting("resetMeaningOnNavigation", value)}
          />

          <ToggleRow
            Icon={Volume2}
            title="Audio pronunciation"
            description="Placeholder for text-to-speech playback — coming soon."
            checked={settings.audioEnabled}
            onChange={(value) => onUpdateSetting("audioEnabled", value)}
          />

          <ToggleRow
            Icon={Shuffle}
            title="Shuffle mode"
            description="Randomize the card order within whatever category you're viewing."
            checked={settings.shuffleMode}
            onChange={(value) => onUpdateSetting("shuffleMode", value)}
          />

          <div className="pt-4 border-t border-rule">
            <button
              type="button"
              onClick={onResetData}
              className="flex items-center gap-2 text-sm text-accent font-body hover:underline"
            >
              <Trash2 size={14} />
              Clear all cards and progress
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function ToggleRow({ Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="text-ink/50 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-body text-sm font-medium text-ink">{title}</span>
          <Switch checked={checked} onChange={onChange} label={title} />
        </div>
        <p className="font-body text-xs text-ink/50 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

/** A small accessible toggle switch, styled to match the ink/accent palette. */
function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-accent" : "bg-rule"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
