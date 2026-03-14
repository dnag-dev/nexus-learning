"use client";

/**
 * SessionReviewDrawer — Phase 10: Shows all answered questions this session.
 *
 * Opens as a slide-in side drawer from the right.
 * Each entry shows: question text, student answer, correct/wrong status,
 * mastery change, and expandable explanation for wrong answers.
 *
 * READ ONLY — cannot resubmit past answers.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface AnswerRecord {
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  masteryBefore: number;
  masteryAfter: number;
  explanation?: string;
  step: number;
}

interface SessionReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  answers: AnswerRecord[];
  currentMastery: number;
}

const STEP_NAMES = ["", "Learn", "Check", "Guided", "Practice", "Prove"];

export default function SessionReviewDrawer({
  isOpen,
  onClose,
  answers,
  currentMastery,
}: SessionReviewDrawerProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  // Estimate remaining questions based on current mastery and recent accuracy
  const estimatedRemaining = currentMastery >= 85
    ? 0
    : Math.max(1, Math.min(15, Math.ceil((85 - currentMastery) / (accuracy >= 60 ? 15 : 8))));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[380px] max-w-[90vw] bg-white border-l border-[#E2E8F0] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#1F2937]">Session Review</h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  {answers.length} question{answers.length !== 1 ? "s" : ""} answered
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-[#6B7280] hover:text-[#1F2937] text-xl leading-none px-2"
              >
                ×
              </button>
            </div>

            {/* Summary bar */}
            <div className="px-5 py-3 bg-[#F3F4F6] border-b border-[#E2E8F0] grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-[#1F2937]">{correctCount}/{answers.length}</p>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Correct</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#1F2937]">{accuracy}%</p>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Accuracy</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#1F2937]">{Math.round(currentMastery)}%</p>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Mastery</p>
              </div>
            </div>

            {/* Estimated remaining */}
            {estimatedRemaining > 0 && (
              <div className="px-5 py-2 bg-cyan-500/5 border-b border-[#E2E8F0] text-center">
                <p className="text-xs text-cyan-400">
                  📍 ~{estimatedRemaining} question{estimatedRemaining !== 1 ? "s" : ""} to finish
                </p>
              </div>
            )}

            {/* Answer timeline */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {answers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#9CA3AF] text-sm">No questions answered yet</p>
                </div>
              ) : (
                answers.map((answer, idx) => {
                  const isExpanded = expandedIdx === idx;
                  const masteryDelta = Math.round(answer.masteryAfter - answer.masteryBefore);
                  const deltaColor = masteryDelta >= 0 ? "text-green-400" : "text-red-400";
                  const deltaSign = masteryDelta >= 0 ? "+" : "";

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`rounded-xl border p-3 transition-colors ${
                        answer.isCorrect
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      {/* Question header row */}
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5">
                          {answer.isCorrect ? "✅" : "❌"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#9CA3AF] mb-0.5">
                            Q{idx + 1} · {STEP_NAMES[answer.step] || "Practice"}
                          </p>
                          <p className="text-sm text-[#1F2937] leading-snug line-clamp-2">
                            {answer.questionText}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className={`text-xs font-medium ${deltaColor}`}>
                            {deltaSign}{masteryDelta}%
                          </p>
                          <p className="text-[10px] text-gray-600">
                            {Math.round(answer.masteryBefore)}% → {Math.round(answer.masteryAfter)}%
                          </p>
                        </div>
                      </div>

                      {/* Answer detail */}
                      <div className="mt-2 ml-7 text-xs">
                        <p className="text-[#6B7280]">
                          <span className="font-medium">You:</span>{" "}
                          <span className={answer.isCorrect ? "text-green-300" : "text-red-300"}>
                            {answer.selectedAnswer}
                          </span>
                        </p>
                        {!answer.isCorrect && (
                          <p className="text-[#6B7280] mt-0.5">
                            <span className="font-medium">Correct:</span>{" "}
                            <span className="text-green-300">{answer.correctAnswer}</span>
                          </p>
                        )}
                      </div>

                      {/* Expandable explanation for wrong answers */}
                      {!answer.isCorrect && answer.explanation && (
                        <div className="mt-2 ml-7">
                          <button
                            onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {isExpanded ? "Hide explanation ▲" : "💡 Tap to see explanation"}
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="text-xs text-[#6B7280] leading-relaxed mt-1 bg-blue-500/5 rounded-lg p-2 border border-blue-500/10">
                                  {answer.explanation}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
