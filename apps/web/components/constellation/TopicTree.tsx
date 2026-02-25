"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BranchNode {
  nodeId: string;
  nodeCode: string;
  title: string;
  nexusScore: number;
  trulyMastered: boolean;
  isCurrent: boolean;
}

interface TopicBranchInfo {
  id: string;
  name: string;
  description: string;
  domain: string;
  isAdvanced: boolean;
  nodes: BranchNode[];
  unlocked: boolean;
  completed: boolean;
  progress: number;
  nodesCompleted: number;
  totalNodes: number;
}

interface TopicTreeProps {
  studentId: string;
  domain?: string;
  onSelectBranch?: (branchId: string) => void;
  compact?: boolean;
}

export default function TopicTree({
  studentId,
  domain,
  onSelectBranch,
  compact = false,
}: TopicTreeProps) {
  const [branches, setBranches] = useState<TopicBranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  useEffect(() => {
    const url = domain
      ? `/api/student/${studentId}/topic-tree?domain=${domain}`
      : `/api/student/${studentId}/topic-tree`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setBranches(data.branches ?? []);
        if (data.activeBranchId) setSelectedBranch(data.activeBranchId);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, domain]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">No topic branches yet</p>
        <p className="text-sm mt-1">Complete more lessons to unlock branches!</p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {branches.map((branch) => (
        <motion.div
          key={branch.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border transition-all duration-300 ${
            branch.unlocked
              ? branch.completed
                ? "bg-green-500/10 border-green-500/30"
                : selectedBranch === branch.id
                  ? "bg-purple-500/15 border-purple-500/40"
                  : "bg-white/5 border-white/10 hover:bg-white/8 cursor-pointer"
              : "bg-white/2 border-white/5 opacity-50"
          } ${compact ? "p-3" : "p-4"}`}
          onClick={() => {
            if (branch.unlocked && !branch.completed && onSelectBranch) {
              onSelectBranch(branch.id);
              setSelectedBranch(branch.id);
            }
          }}
        >
          {/* Branch header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {!branch.unlocked && (
                <span className="text-sm">🔒</span>
              )}
              {branch.completed && (
                <span className="text-sm">✅</span>
              )}
              {branch.isAdvanced && branch.unlocked && !branch.completed && (
                <span className="text-sm">⭐</span>
              )}
              <h3 className={`font-semibold text-white ${compact ? "text-sm" : "text-base"}`}>
                {branch.name}
              </h3>
            </div>
            <span className={`text-xs font-medium ${
              branch.completed
                ? "text-green-400"
                : branch.unlocked
                  ? "text-gray-400"
                  : "text-gray-600"
            }`}>
              {branch.nodesCompleted}/{branch.totalNodes}
            </span>
          </div>

          {!compact && (
            <p className="text-xs text-gray-400 mb-3">{branch.description}</p>
          )}

          {/* Progress bar */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
            <motion.div
              className={`h-full rounded-full ${
                branch.completed ? "bg-green-500" : "bg-purple-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${branch.progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Node dots */}
          {!compact && branch.unlocked && (
            <div className="flex gap-1 flex-wrap">
              {branch.nodes.map((node) => (
                <div
                  key={node.nodeId}
                  className="group relative"
                  title={`${node.title} (${node.nexusScore})`}
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      node.trulyMastered
                        ? "bg-green-500 shadow-sm shadow-green-500/50"
                        : node.isCurrent
                          ? "bg-purple-500 animate-pulse shadow-sm shadow-purple-500/50"
                          : node.nexusScore > 0
                            ? "bg-yellow-500/60"
                            : "bg-white/10"
                    }`}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      {node.title}
                      {node.nexusScore > 0 && (
                        <span className="text-yellow-400 ml-1">
                          {node.nexusScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
