"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface WatchStep {
  label: string;
  visual: string;
  narration: string;
}

interface WatchTabProps {
  definition: string;
  steps: WatchStep[];
  personaId: string;
  onEvent?: (type: string, detail?: string) => void;
}

export default function WatchTab({
  definition,
  steps,
  personaId,
  onEvent,
}: WatchTabProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = showing definition only
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakNarration = useCallback(
    async (text: string) => {
      try {
        setIsSpeaking(true);
        const res = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, personaId }),
        });
        if (!res.ok) {
          setIsSpeaking(false);
          return;
        }
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          setIsSpeaking(false);
          return;
        }
        const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play().catch(() => {});
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
        };
      } catch {
        setIsSpeaking(false);
      }
    },
    [personaId]
  );

  const goToStep = useCallback(
    (index: number) => {
      setCurrentStep(index);
      if (index >= 0 && index < steps.length) {
        onEvent?.("learn_panel_watch_step", `step_${index + 1}`);
        speakNarration(steps[index].narration);
      }
    },
    [steps, speakNarration, onEvent]
  );

  const nextStep = useCallback(() => {
    const next = currentStep + 1;
    if (next < steps.length) {
      goToStep(next);
    }
  }, [currentStep, steps.length, goToStep]);

  const restart = useCallback(() => {
    setCurrentStep(-1);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Definition box */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
        <p className="text-sm text-purple-300 font-medium mb-1">📖 Definition</p>
        <p className="text-white/90 text-sm leading-relaxed">{definition}</p>
      </div>

      {/* Step progress dots */}
      <div className="flex items-center gap-2 mb-4">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => goToStep(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === currentStep
                ? "bg-aauti-primary scale-125"
                : i < currentStep
                  ? "bg-aauti-primary/50"
                  : "bg-white/20"
            }`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
        <span className="text-xs text-gray-500 ml-2">
          {currentStep >= 0
            ? `Step ${currentStep + 1} of ${steps.length}`
            : "Ready to start"}
        </span>
      </div>

      {/* Step content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentStep < 0 ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-center py-8"
            >
              <p className="text-4xl mb-4">🎬</p>
              <p className="text-white/80 text-sm mb-6">
                Watch a step-by-step explanation of this concept
              </p>
              <button
                onClick={() => goToStep(0)}
                className="px-6 py-3 bg-aauti-primary text-white rounded-xl font-medium hover:bg-aauti-primary/90 transition-colors"
              >
                Start Watching ▶️
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="space-y-4"
            >
              {/* Current step card */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <p className="text-sm font-semibold text-aauti-primary mb-2">
                  {steps[currentStep].label}
                </p>
                <div className="text-3xl mb-3 text-center py-2 bg-white/5 rounded-lg">
                  {steps[currentStep].visual}
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {steps[currentStep].narration}
                </p>
              </div>

              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" />
                    <div
                      className="w-1 h-4 bg-purple-400 rounded-full animate-pulse"
                      style={{ animationDelay: "100ms" }}
                    />
                    <div
                      className="w-1 h-2 bg-purple-400 rounded-full animate-pulse"
                      style={{ animationDelay: "200ms" }}
                    />
                  </div>
                  Speaking...
                </div>
              )}

              {/* Previous steps (dimmed) */}
              {currentStep > 0 && (
                <div className="space-y-2 opacity-40">
                  {steps.slice(0, currentStep).map((step, i) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-lg p-3 border border-white/5 cursor-pointer hover:opacity-70"
                      onClick={() => goToStep(i)}
                    >
                      <p className="text-xs text-gray-400">{step.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/10 mt-4">
        {currentStep >= 0 && (
          <button
            onClick={restart}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            🔄 Restart
          </button>
        )}
        <div className="flex-1" />
        {currentStep >= 0 && currentStep < steps.length - 1 ? (
          <button
            onClick={nextStep}
            className="px-5 py-2.5 bg-aauti-primary text-white text-sm rounded-xl font-medium hover:bg-aauti-primary/90 transition-colors"
          >
            Next Step →
          </button>
        ) : currentStep === steps.length - 1 ? (
          <p className="text-sm text-green-400 font-medium">
            ✅ All steps complete!
          </p>
        ) : null}
      </div>
    </div>
  );
}
