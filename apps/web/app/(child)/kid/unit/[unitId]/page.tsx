"use client";

/**
 * Unit Detail Page — Phase 13
 *
 * Shows a single unit with cluster breakdowns, mastery state colors,
 * and action buttons: Continue Learning, Test Out, Unit Test.
 *
 * Entry: /kid/unit/[unitId]?studentId=...
 */

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  getMasteryStateInfo,
  getAllStates,
  type MasteryState,
} from "@/lib/mastery-states";

interface NodeSummary {
  nodeId: string;
  nodeCode: string;
  title: string;
  bktProbability: number;
  masteryState: MasteryState;
  practiceCount: number;
}

interface ClusterData {
  id: string;
  name: string;
  nodes: NodeSummary[];
  stateCounts: Record<MasteryState, number>;
}

interface UnitData {
  id: string;
  name: string;
  description: string;
  gradeLevel: string;
  subject: string;
  clusters: ClusterData[];
  totalNodes: number;
  masteredNodes: number;
  stateCounts: Record<MasteryState, number>;
  isComplete: boolean;
}

export default function UnitDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const unitId = params.unitId as string;
  const studentId = searchParams.get("studentId") || "";

  const [unit, setUnit] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !unitId) return;

    // Fetch unit detail via the units API with specific unit filtering
    fetch(`/api/student/${studentId}/units?unitId=${unitId}`)
      .then((r) => r.json())
      .then((data) => {
        // The API returns an array; find our unit
        const found = data.units?.find((u: UnitData) => u.id === unitId);
        if (found) {
          setUnit(found);
          // Auto-expand first non-complete cluster
          const firstActive = found.clusters.find(
            (c: ClusterData) => c.stateCounts.mastered < c.nodes.length
          );
          if (firstActive) setExpandedCluster(firstActive.id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, unitId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading unit...</div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-white flex items-center justify-center">
        <p className="text-gray-500">Unit not found</p>
      </div>
    );
  }

  const allStates = getAllStates();

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-4 text-sm"
        >
          ← Back
        </button>

        {/* Unit Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-white/10 rounded px-2 py-0.5">
              {unit.gradeLevel}
            </span>
            <span className="text-xs bg-white/10 rounded px-2 py-0.5">
              {unit.subject}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{unit.name}</h1>
          {unit.description && (
            <p className="text-gray-400 text-sm mt-1">{unit.description}</p>
          )}
        </div>

        {/* Progress Summary */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">
              {unit.masteredNodes} / {unit.totalNodes} topics mastered
            </span>
            <span className="text-sm font-bold text-cyan-400">
              {unit.totalNodes > 0
                ? Math.round((unit.masteredNodes / unit.totalNodes) * 100)
                : 0}
              %
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all duration-500"
              style={{
                width: `${unit.totalNodes > 0 ? (unit.masteredNodes / unit.totalNodes) * 100 : 0}%`,
              }}
            />
          </div>
          {/* State counts legend */}
          <div className="flex gap-3 mt-3 flex-wrap">
            {allStates.map((s) => {
              const count = unit.stateCounts[s.state] || 0;
              if (count === 0) return null;
              return (
                <span key={s.state} className="text-xs flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${s.dotClass}`} />
                  <span className="text-gray-400">
                    {count} {s.label}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() =>
              router.push(
                `/session?studentId=${studentId}&subject=${unit.subject}`
              )
            }
            className="py-3 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-500 transition-colors"
          >
            📖 Continue Learning
          </button>
          <button
            onClick={() => {
              // Start unit test via API
              startUnitTest();
            }}
            className="py-3 rounded-xl bg-cyan-600 text-white font-medium text-sm hover:bg-cyan-500 transition-colors"
          >
            🏆 Take Unit Test
          </button>
        </div>

        {/* Clusters */}
        <div className="space-y-4">
          {unit.clusters.map((cluster, ci) => {
            const isExpanded = expandedCluster === cluster.id;
            const clusterComplete =
              cluster.nodes.length > 0 &&
              cluster.stateCounts.mastered === cluster.nodes.length;

            return (
              <div
                key={cluster.id}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Cluster header */}
                <button
                  onClick={() =>
                    setExpandedCluster(isExpanded ? null : cluster.id)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 font-mono w-6">
                      {ci + 1}.
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        clusterComplete ? "text-green-400" : "text-white"
                      }`}
                    >
                      {clusterComplete ? "✅ " : ""}
                      {cluster.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {cluster.stateCounts.mastered || 0}/{cluster.nodes.length}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </div>
                </button>

                {/* Cluster nodes */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-4 pb-3">
                    {cluster.nodes.map((node) => {
                      const stateInfo = getMasteryStateInfo(
                        node.bktProbability
                      );
                      return (
                        <div
                          key={node.nodeId}
                          className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-3 h-3 rounded-full ${stateInfo.dotClass}`}
                            />
                            <span className="text-sm text-gray-300">
                              {node.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${stateInfo.badgeClass}`}
                            >
                              {stateInfo.label}
                            </span>
                            {node.masteryState !== "mastered" &&
                              node.masteryState !== "not_started" && (
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/session?studentId=${studentId}&nodeCode=${node.nodeCode}`
                                    )
                                  }
                                  className="text-xs text-cyan-400 hover:text-cyan-300"
                                >
                                  Continue →
                                </button>
                              )}
                            {node.masteryState === "not_started" && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/session?studentId=${studentId}&nodeCode=${node.nodeCode}`
                                  )
                                }
                                className="text-xs text-purple-400 hover:text-purple-300"
                              >
                                Start →
                              </button>
                            )}
                            {node.masteryState === "mastered" && (
                              <span className="text-xs text-green-500">✓</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Test Out hint for clusters with unmastered topics */}
                    {!clusterComplete && cluster.nodes.length > 0 && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        💡 Tip: Click &quot;Start&quot; on any topic and choose
                        &quot;Test Out&quot; if you already know it!
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  async function startUnitTest() {
    try {
      const res = await fetch("/api/session/unit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          unitId: unit?.id,
          testType: "unit_test",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Navigate to a test session with the test ID
        router.push(
          `/session?studentId=${studentId}&testId=${data.testId}&testType=unit_test`
        );
      }
    } catch (err) {
      console.error("Failed to start unit test:", err);
    }
  }
}
