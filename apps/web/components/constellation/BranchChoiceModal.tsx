"use client";

import { motion, AnimatePresence } from "framer-motion";

interface BranchOption {
  id: string;
  name: string;
  description: string;
  totalNodes: number;
  isAdvanced: boolean;
  label: string; // "Go Deeper" or "Go Broader"
}

interface BranchChoiceModalProps {
  isOpen: boolean;
  options: BranchOption[];
  onChoose: (branchId: string) => void;
  onClose: () => void;
}

export default function BranchChoiceModal({
  isOpen,
  options,
  onChoose,
  onClose,
}: BranchChoiceModalProps) {
  if (!isOpen || options.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-[#0D1B2A] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">🌟</span>
              <h2 className="text-xl font-bold text-white">
                Choose Your Path!
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                You&apos;ve unlocked new branches. Where do you want to go?
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onChoose(option.id)}
                  className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/40 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-purple-400">
                      {option.label}
                    </span>
                    {option.isAdvanced && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                        Advanced
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold">{option.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {option.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {option.totalNodes} concepts to master
                  </p>
                </button>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-full mt-4 text-center text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
            >
              Decide later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
