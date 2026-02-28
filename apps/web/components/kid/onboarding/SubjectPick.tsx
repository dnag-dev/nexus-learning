"use client";

/**
 * Onboarding Step 2 — Pick a subject focus.
 *
 * Three big cards: Math / English / Both.
 * Context line shows parent-set goal if available.
 */

import { useState } from "react";
import { useChild } from "@/lib/child-context";

interface Props {
  parentGoal?: string | null;
  value: string | null;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUBJECTS = [
  {
    id: "MATH",
    emoji: "🔢",
    label: "Math",
    description: "Numbers, shapes, and problem solving",
    color: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500",
    ring: "ring-blue-500/30",
  },
  {
    id: "ENGLISH",
    emoji: "📖",
    label: "English",
    description: "Reading, writing, and grammar",
    color: "from-emerald-500/20 to-green-500/20",
    border: "border-emerald-500",
    ring: "ring-emerald-500/30",
  },
  {
    id: "BOTH",
    emoji: "🌟",
    label: "Both",
    description: "Practice math and English together",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500",
    ring: "ring-purple-500/30",
  },
];

export default function SubjectPick({
  parentGoal,
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  const { displayName } = useChild();
  const [selected, setSelected] = useState<string | null>(value);

  const handleSelect = (id: string) => {
    setSelected(id);
    onChange(id);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        What should we focus on?
      </h1>
      <p className="text-sm text-gray-400 mb-8 text-center">
        Pick what you want to learn, {displayName}
      </p>

      {/* Subject cards */}
      <div className="w-full max-w-sm space-y-3 mb-6">
        {SUBJECTS.map((subject) => (
          <button
            key={subject.id}
            onClick={() => handleSelect(subject.id)}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
              selected === subject.id
                ? `${subject.border} bg-gradient-to-r ${subject.color} ring-2 ${subject.ring}`
                : "border-white/10 bg-[#141d30] hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{subject.emoji}</span>
              <div>
                <p className="text-white font-bold text-lg">{subject.label}</p>
                <p className="text-gray-400 text-sm">{subject.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Parent context */}
      {parentGoal && (
        <p className="text-xs text-gray-500 mb-6 text-center">
          Your parent set your goal as{" "}
          <span className="text-gray-400">{parentGoal}</span>
        </p>
      )}

      {/* Buttons */}
      <div className="w-full max-w-sm flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors border border-white/10"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
