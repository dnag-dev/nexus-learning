"use client";

/**
 * TopicTree — Interactive hierarchical topic tree with clickable nodes.
 *
 * ⚠️  CRITICAL FEATURE: Interactive topic tree with node-level actions.
 * Each node is clickable:
 *   - Unlocked / Available → Start session on that node
 *   - In-progress → Continue session on that node
 *   - Mastered → Start review session
 *   - Locked → Shows prerequisite info (no action)
 *
 * Props:
 *   - studentId: Student ID for API calls
 *   - domain: Optional domain filter (e.g., "MATH")
 *   - onNodeClick: Optional callback when a node is clicked (receives nodeCode + action)
 *   - onSelectBranch: Optional callback when a branch is selected
 *   - compact: Whether to render in compact mode
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SubjectTabs, { type Subject } from "@/components/kid/SubjectTabs";

const ELA_DOMAINS = new Set(["GRAMMAR", "READING", "WRITING", "VOCABULARY"]);

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

type NodeAction = "start" | "continue" | "review" | "locked";

interface TopicTreeProps {
  studentId: string;
  domain?: string;
  onSelectBranch?: (branchId: string) => void;
  onNodeClick?: (nodeCode: string, action: NodeAction) => void;
  compact?: boolean;
}

/**
 * Determine what action a node click should trigger based on its state.
 */
function getNodeAction(node: BranchNode, branchUnlocked: boolean): NodeAction {
  if (!branchUnlocked) return "locked";
  if (node.trulyMastered) return "review";
  if (node.isCurrent || node.nexusScore > 0) return "continue";
  return "start";
}

/**
 * Get the visual style for a node based on its state.
 */
function getNodeStyle(node: BranchNode, branchUnlocked: boolean): {
  dotClass: string;
  label: string;
  actionLabel: string;
} {
  if (!branchUnlocked) {
    return {
      dotClass: "bg-gray-200 cursor-not-allowed",
      label: "Locked",
      actionLabel: "🔒 Complete prerequisites first",
    };
  }
  if (node.trulyMastered) {
    return {
      dotClass: "bg-green-500 shadow-sm shadow-green-500/50 cursor-pointer hover:ring-2 hover:ring-green-400/50",
      label: "Mastered",
      actionLabel: "Review this concept →",
    };
  }
  if (node.isCurrent) {
    return {
      dotClass: "bg-purple-500 animate-pulse shadow-sm shadow-purple-500/50 cursor-pointer hover:ring-2 hover:ring-purple-400/50",
      label: "In Progress",
      actionLabel: "Continue learning →",
    };
  }
  if (node.nexusScore > 0) {
    return {
      dotClass: "bg-yellow-500/60 cursor-pointer hover:ring-2 hover:ring-yellow-400/50",
      label: "Started",
      actionLabel: "Continue learning →",
    };
  }
  return {
    dotClass: "bg-gray-300 cursor-pointer hover:bg-gray-400 hover:ring-2 hover:ring-gray-300",
    label: "Available",
    actionLabel: "Start learning →",
  };
}

export default function TopicTree({
  studentId,
  domain,
  onSelectBranch,
  onNodeClick,
  compact = false,
}: TopicTreeProps) {
  const router = useRouter();
  const [allBranches, setAllBranches] = useState<TopicBranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState<Subject>("MATH");

  useEffect(() => {
    const url = domain
      ? `/api/student/${studentId}/topic-tree?domain=${domain}`
      : `/api/student/${studentId}/topic-tree`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const branchList: TopicBranchInfo[] = data.branches ?? [];
        setAllBranches(branchList);
        // Auto-expand all unlocked branches so nodes are visible and clickable
        const expanded = new Set<string>();
        for (const b of branchList) {
          if (b.unlocked) expanded.add(b.id);
        }
        if (data.activeBranchId) {
          setSelectedBranch(data.activeBranchId);
          expanded.add(data.activeBranchId);
        }
        setExpandedBranches(expanded);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, domain]);

  // Filter branches by selected subject (Math vs English)
  // Sort by grade level within each subject
  const GRADE_ORDER = ["K","G1","G2","G3","G4","G5","G6","G7","G8","G9","G10"];
  const branches = useMemo(() => {
    // If domain prop is already set, don't show tabs — just use all branches
    if (domain) return allBranches;

    return allBranches
      .filter((b) => {
        const isELA = ELA_DOMAINS.has(b.domain);
        return subject === "ENGLISH" ? isELA : !isELA;
      })
      .sort((a, b) => {
        // Extract grade from branch name or use domain sort
        const aGrade = GRADE_ORDER.indexOf(a.nodes[0]?.nodeCode?.split(".")[0] ?? "");
        const bGrade = GRADE_ORDER.indexOf(b.nodes[0]?.nodeCode?.split(".")[0] ?? "");
        if (aGrade !== bGrade) return aGrade - bGrade;
        return 0;
      });
  }, [allBranches, subject, domain]);

  const handleNodeClick = useCallback(
    (node: BranchNode, branchUnlocked: boolean) => {
      const action = getNodeAction(node, branchUnlocked);

      if (action === "locked") return; // No action for locked nodes

      // If custom handler provided, use it
      if (onNodeClick) {
        onNodeClick(node.nodeCode, action);
        return;
      }

      // Default: navigate to session
      const params = new URLSearchParams({
        studentId,
        nodeCode: node.nodeCode,
        returnTo: "/kid/constellation",
      });

      if (action === "review") {
        params.set("review", "true");
      }

      router.push(`/session?${params.toString()}`);
    },
    [studentId, router, onNodeClick]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-8 text-[#9CA3AF]">
        <p className="text-lg">No topic branches yet</p>
        <p className="text-sm mt-1">Complete more lessons to unlock branches!</p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Subject tabs — only shown when no domain filter is applied */}
      {!domain && (
        <div className="flex justify-center mb-4">
          <SubjectTabs subject={subject} onSubjectChange={setSubject} />
        </div>
      )}
      {branches.map((branch) => {
        const isExpanded = expandedBranches.has(branch.id);

        return (
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
                    : "bg-[#F3F4F6] border-[#E2E8F0] hover:bg-gray-100"
                : "bg-gray-50 border-[#E2E8F0] opacity-50"
            } ${compact ? "p-3" : "p-4"}`}
          >
            {/* Branch header — clickable to expand/collapse */}
            <div
              className="flex items-center justify-between mb-2 cursor-pointer"
              onClick={() => {
                if (branch.unlocked) {
                  setExpandedBranches((prev) => {
                    const next = new Set(prev);
                    if (next.has(branch.id)) next.delete(branch.id);
                    else next.add(branch.id);
                    return next;
                  });
                  if (onSelectBranch && !branch.completed) {
                    onSelectBranch(branch.id);
                    setSelectedBranch(branch.id);
                  }
                }
              }}
            >
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
                <h3 className={`font-semibold text-[#1F2937] ${compact ? "text-sm" : "text-base"}`}>
                  {branch.name}
                </h3>
                {/* Expand indicator */}
                {branch.unlocked && !compact && (
                  <span className={`text-xs text-[#9CA3AF] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                    ▶
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${
                branch.completed
                  ? "text-green-400"
                  : branch.unlocked
                    ? "text-[#6B7280]"
                    : "text-[#9CA3AF]"
              }`}>
                {branch.nodesCompleted}/{branch.totalNodes}
              </span>
            </div>

            {!compact && (
              <p className="text-xs text-[#6B7280] mb-3">{branch.description}</p>
            )}

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
              <motion.div
                className={`h-full rounded-full ${
                  branch.completed ? "bg-green-500" : "bg-purple-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${branch.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>

            {/* Node dots — always visible in compact mode */}
            {!compact && branch.unlocked && (
              <div className="flex gap-1.5 flex-wrap mb-1">
                {branch.nodes.map((node) => {
                  const style = getNodeStyle(node, branch.unlocked);
                  return (
                    <div
                      key={node.nodeId}
                      className="group relative"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${style.dotClass}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNodeClick(node, branch.unlocked);
                        }}
                      />
                      {/* Enhanced tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                        <div className="bg-white border border-[#E2E8F0] text-[#1F2937] text-[10px] px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                          <p className="font-medium text-xs">{node.title}</p>
                          <p className={`text-[10px] mt-0.5 ${
                            node.trulyMastered ? "text-green-400" :
                            node.isCurrent ? "text-purple-400" :
                            node.nexusScore > 0 ? "text-yellow-400" :
                            "text-[#6B7280]"
                          }`}>
                            {style.label}
                            {node.nexusScore > 0 && !node.trulyMastered && (
                              <span className="text-yellow-400 ml-1">
                                ({Math.round(node.nexusScore)}%)
                              </span>
                            )}
                          </p>
                          <p className="text-[#9CA3AF] text-[9px] mt-1 border-t border-[#E2E8F0] pt-1">
                            {style.actionLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expanded node list — detailed view when branch is expanded */}
            {!compact && branch.unlocked && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-1"
              >
                {branch.nodes.map((node) => {
                  const style = getNodeStyle(node, branch.unlocked);
                  const action = getNodeAction(node, branch.unlocked);
                  return (
                    <div
                      key={node.nodeId}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                        action !== "locked"
                          ? "hover:bg-gray-50 cursor-pointer"
                          : "opacity-50"
                      }`}
                      onClick={() => handleNodeClick(node, branch.unlocked)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          node.trulyMastered ? "bg-green-500" :
                          node.isCurrent ? "bg-purple-500" :
                          node.nexusScore > 0 ? "bg-yellow-500" :
                          "bg-gray-300"
                        }`} />
                        <span className="text-sm text-[#6B7280]">{node.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {node.nexusScore > 0 && (
                          <span className="text-[10px] text-[#9CA3AF]">
                            {Math.round(node.nexusScore)}%
                          </span>
                        )}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          node.trulyMastered
                            ? "bg-green-500/20 text-green-400"
                            : node.isCurrent
                              ? "bg-purple-500/20 text-purple-400"
                              : node.nexusScore > 0
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-[#F3F4F6] text-[#6B7280] font-medium"
                        }`}>
                          {style.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
