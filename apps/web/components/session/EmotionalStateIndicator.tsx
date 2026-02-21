"use client";

/**
 * EmotionalStateIndicator — Session Dashboard Widget
 *
 * Visual indicator of the student's current emotional state during a session.
 * Shows a color-coded mood indicator with label, confidence bar,
 * and optional signal details for debugging.
 *
 * Usage:
 *   <EmotionalStateIndicator
 *     state="ENGAGED"
 *     confidence={0.72}
 *     reason="normal response time, healthy accuracy range"
 *   />
 */

import { useState } from "react";

// ─── Types ───

export type EmotionalState =
  | "ENGAGED"
  | "FRUSTRATED"
  | "BORED"
  | "CONFUSED"
  | "EXCITED"
  | "ANXIOUS"
  | "BREAKTHROUGH"
  | "NEUTRAL";

interface EmotionalStateIndicatorProps {
  state: EmotionalState;
  confidence: number;
  reason?: string;
  /** Show detailed signal information */
  showDetails?: boolean;
  /** Compact mode for header/toolbar */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ─── State Visual Config ───

interface StateVisual {
  emoji: string;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  pulseClass: string;
}

const STATE_VISUALS: Record<EmotionalState, StateVisual> = {
  ENGAGED: {
    emoji: "\u{1F4DA}",
    label: "Focused & Learning",
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
    pulseClass: "",
  },
  FRUSTRATED: {
    emoji: "\u{1F624}",
    label: "Finding It Challenging",
    colorClass: "text-orange-600",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200",
    pulseClass: "animate-pulse",
  },
  BORED: {
    emoji: "\u{1F971}",
    label: "Needs More Challenge",
    colorClass: "text-gray-500",
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200",
    pulseClass: "",
  },
  CONFUSED: {
    emoji: "\u{1F914}",
    label: "Needs Clarification",
    colorClass: "text-yellow-600",
    bgClass: "bg-yellow-50",
    borderClass: "border-yellow-200",
    pulseClass: "animate-pulse",
  },
  EXCITED: {
    emoji: "\u{1F929}",
    label: "Energized & Confident",
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
    pulseClass: "",
  },
  ANXIOUS: {
    emoji: "\u{1F630}",
    label: "Taking It Carefully",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    pulseClass: "animate-pulse",
  },
  BREAKTHROUGH: {
    emoji: "\u{1F4A1}",
    label: "Aha! Moment",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-300",
    pulseClass: "animate-bounce",
  },
  NEUTRAL: {
    emoji: "\u{1F642}",
    label: "Getting Started",
    colorClass: "text-gray-500",
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200",
    pulseClass: "",
  },
};

// ─── Component ───

export default function EmotionalStateIndicator({
  state,
  confidence,
  reason,
  showDetails = false,
  compact = false,
  className = "",
}: EmotionalStateIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visual = STATE_VISUALS[state] ?? STATE_VISUALS.NEUTRAL;
  const confidencePercent = Math.round(confidence * 100);

  // ─── Compact Mode (for header/toolbar) ───
  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${visual.bgClass} ${visual.borderClass} border ${visual.pulseClass} ${className}`}
        title={`${visual.label} (${confidencePercent}% confidence)`}
      >
        <span className="text-sm">{visual.emoji}</span>
        <span className={`text-xs font-medium ${visual.colorClass}`}>
          {visual.label}
        </span>
      </div>
    );
  }

  // ─── Full Mode ───
  return (
    <div
      className={`rounded-xl border ${visual.borderClass} ${visual.bgClass} p-3 ${visual.pulseClass} ${className}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{visual.emoji}</span>
          <div>
            <p className={`text-sm font-semibold ${visual.colorClass}`}>
              {visual.label}
            </p>
            <p className="text-xs text-gray-500">Emotional State</p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="text-right">
          <span className={`text-lg font-bold ${visual.colorClass}`}>
            {confidencePercent}%
          </span>
          <p className="text-xs text-gray-400">confidence</p>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            state === "FRUSTRATED" || state === "ANXIOUS"
              ? "bg-orange-400"
              : state === "EXCITED" || state === "BREAKTHROUGH"
                ? "bg-purple-400"
                : state === "BORED"
                  ? "bg-gray-400"
                  : "bg-green-400"
          }`}
          style={{ width: `${Math.min(confidencePercent, 100)}%` }}
        />
      </div>

      {/* Details Toggle */}
      {(showDetails || reason) && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isExpanded ? "Hide details ▲" : "Show details ▼"}
        </button>
      )}

      {/* Expanded Details */}
      {isExpanded && reason && (
        <div className="mt-2 p-2 bg-white/50 rounded-lg">
          <p className="text-xs text-gray-500">
            <span className="font-medium">Detection reason:</span> {reason}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Exports ───

export { STATE_VISUALS };
