"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
  tip: string;
}

interface ExamplesTabProps {
  examples: WorkedExample[];
  onEvent?: (type: string, detail?: string) => void;
  onClose?: () => void;
}

export default function ExamplesTab({
  examples,
  onEvent,
  onClose,
}: ExamplesTabProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [revealedSteps, setRevealedSteps] = useState<Record<number, number>>(
    {}
  );

  const toggleExample = useCallback(
    (index: number) => {
      if (expandedIndex === index) {
        setExpandedIndex(null);
      } else {
        setExpandedIndex(index);
        setRevealedSteps((prev) => ({ ...prev, [index]: 0 }));
        onEvent?.("learn_panel_example_viewed", `example_${index + 1}`);
      }
    },
    [expandedIndex, onEvent]
  );

  const revealNextStep = useCallback(
    (exampleIndex: number) => {
      setRevealedSteps((prev) => ({
        ...prev,
        [exampleIndex]: (prev[exampleIndex] ?? 0) + 1,
      }));
    },
    []
  );

  const showAllSteps = useCallback(
    (exampleIndex: number) => {
      setRevealedSteps((prev) => ({
        ...prev,
        [exampleIndex]: examples[exampleIndex].steps.length,
      }));
    },
    [examples]
  );

  const difficultyLabels = ["Easy", "Medium", "Harder"];
  const difficultyColors = [
    "text-green-400 bg-green-500/10 border-green-500/20",
    "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    "text-orange-400 bg-orange-500/10 border-orange-500/20",
  ];

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs text-gray-500 mb-4">
        3 worked examples — tap to expand and reveal the solution step by step
      </p>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {examples.map((example, i) => {
          const isExpanded = expandedIndex === i;
          const stepsRevealed = revealedSteps[i] ?? 0;
          const allRevealed = stepsRevealed >= example.steps.length;

          return (
            <div
              key={i}
              className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
            >
              {/* Header — always visible */}
              <button
                onClick={() => toggleExample(i)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-2xl">
                  {i === 0 ? "1️⃣" : i === 1 ? "2️⃣" : "3️⃣"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 font-medium truncate">
                    {example.problem}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColors[i] ?? difficultyColors[0]}`}
                >
                  {difficultyLabels[i] ?? "Practice"}
                </span>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400"
                >
                  ▼
                </motion.span>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Problem statement */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Problem:</p>
                        <p className="text-sm text-white/90">
                          {example.problem}
                        </p>
                      </div>

                      {/* Solution steps — revealed progressively */}
                      <div className="space-y-2">
                        {example.steps.map((step, stepIdx) => {
                          const isRevealed = stepIdx < stepsRevealed;
                          if (!isRevealed) return null;

                          return (
                            <motion.div
                              key={stepIdx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1, duration: 0.2 }}
                              className="flex items-start gap-2"
                            >
                              <span className="text-xs text-aauti-primary font-bold mt-0.5 shrink-0">
                                {stepIdx + 1}.
                              </span>
                              <p className="text-sm text-white/80">{step}</p>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Step reveal buttons */}
                      {!allRevealed ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => revealNextStep(i)}
                            className="px-4 py-2 bg-aauti-primary/20 text-aauti-primary text-xs rounded-lg font-medium hover:bg-aauti-primary/30 transition-colors"
                          >
                            Show Next Step →
                          </button>
                          <button
                            onClick={() => showAllSteps(i)}
                            className="px-4 py-2 text-gray-400 text-xs hover:text-white transition-colors"
                          >
                            Show All
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Answer */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500/10 border border-green-500/20 rounded-lg p-3"
                          >
                            <p className="text-xs text-green-400 font-medium mb-1">
                              ✅ Answer:
                            </p>
                            <p className="text-sm text-white font-medium">
                              {example.answer}
                            </p>
                          </motion.div>

                          {/* Tip */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"
                          >
                            <p className="text-xs text-amber-400 font-medium mb-1">
                              💡 Key Tip:
                            </p>
                            <p className="text-sm text-white/80">
                              {example.tip}
                            </p>
                          </motion.div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom action */}
      {onClose && (
        <div className="pt-4 border-t border-white/10 mt-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-aauti-primary font-medium hover:text-white transition-colors"
          >
            ← Back to Practice
          </button>
        </div>
      )}
    </div>
  );
}
