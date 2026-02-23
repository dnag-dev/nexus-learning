"use client";

/**
 * Student Detail Page (Teacher View) — Phase 11
 *
 * Shows individual student progress with teacher-specific actions.
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface StudentDetail {
  student: {
    id: string;
    displayName: string;
    gradeLevel: string;
    avatarPersonaId: string;
    xp: number;
    level: number;
    currentStreak: number;
  };
  domainBreakdown: Record<
    string,
    { mastered: number; inProgress: number; notStarted: number }
  >;
  sessions: Array<{
    id: string;
    type: string;
    conceptTitle: string;
    conceptCode: string;
    startedAt: string;
    durationMinutes: number;
    questionsAnswered: number;
    correctAnswers: number;
    accuracy: number;
    hintsUsed: number;
  }>;
  totalMastered: number;
  totalNodes: number;
}

const DOMAIN_LABELS: Record<string, string> = {
  COUNTING: "Counting & Cardinality",
  OPERATIONS: "Operations & Algebraic Thinking",
  GEOMETRY: "Geometry",
  MEASUREMENT: "Measurement & Data",
  DATA: "Data Analysis",
  GRAMMAR: "Grammar & Language",
  READING: "Reading Comprehension",
  WRITING: "Writing",
  VOCABULARY: "Vocabulary",
};

export default function StudentDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const studentId = params.studentId as string;

  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Focus Area (Blueprint) state ───
  const [showFocusForm, setShowFocusForm] = useState(false);
  const [focusText, setFocusText] = useState("");
  const [savingFocus, setSavingFocus] = useState(false);
  const [focusSaved, setFocusSaved] = useState(false);
  const [currentBlueprint, setCurrentBlueprint] = useState<{
    text: string | null;
    source: string | null;
    nodes: string[];
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [detailRes, bpRes] = await Promise.all([
          fetch(`/api/teacher/student/${studentId}/detail`),
          fetch(`/api/parent/child/${studentId}/blueprint`),
        ]);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setData(detail);
        }
        if (bpRes.ok) {
          const bp = await bpRes.json();
          setCurrentBlueprint(bp);
        }
      } catch (err) {
        console.error("Failed to load student:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  const handleSaveFocus = async () => {
    if (!focusText.trim()) return;
    setSavingFocus(true);
    try {
      const res = await fetch(`/api/parent/child/${studentId}/blueprint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: focusText.trim(),
          source: "TEACHER",
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setCurrentBlueprint({
          text: result.text,
          source: result.source,
          nodes: result.nodes,
        });
        setFocusSaved(true);
        setTimeout(() => {
          setShowFocusForm(false);
          setFocusSaved(false);
          setFocusText("");
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to save focus area:", err);
    } finally {
      setSavingFocus(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading student details...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-gray-500">Student not found.</div>
    );
  }

  const { student, domainBreakdown, sessions, totalMastered, totalNodes } = data;
  const masteryPercent =
    totalNodes > 0 ? Math.round((totalMastered / totalNodes) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/teacher-dashboard/class/${classId}`}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        &larr; Back to class
      </Link>

      {/* Student Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">
              {student.avatarPersonaId === "cosmo" ? "🐻" : "👤"}
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {student.displayName}
              </h2>
              <p className="text-gray-500 text-sm">
                {student.gradeLevel} &middot; Level {student.level} &middot;{" "}
                {student.xp} XP
                {student.currentStreak > 0 && (
                  <span className="ml-2">🔥 {student.currentStreak}d streak</span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">
              {masteryPercent}%
            </p>
            <p className="text-xs text-gray-500">
              {totalMastered}/{totalNodes} mastered
            </p>
          </div>
        </div>
      </div>

      {/* Assign Focus Area */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            🎯 Learning Focus
          </h3>
          <button
            onClick={() => setShowFocusForm(!showFocusForm)}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showFocusForm ? "Cancel" : "Assign Focus Area"}
          </button>
        </div>

        {/* Current blueprint display */}
        {currentBlueprint?.text && !showFocusForm && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-gray-700">{currentBlueprint.text}</p>
            <p className="text-xs text-gray-400 mt-1">
              Set by {currentBlueprint.source?.toLowerCase() ?? "unknown"} &middot;{" "}
              {currentBlueprint.nodes?.length ?? 0} nodes prioritized
            </p>
          </div>
        )}

        {!currentBlueprint?.text && !showFocusForm && (
          <p className="text-sm text-gray-400">
            No focus area assigned. Click &ldquo;Assign Focus Area&rdquo; to guide this student&apos;s learning path.
          </p>
        )}

        {/* Focus form */}
        {showFocusForm && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Describe what this student should focus on. This takes highest priority over parent and kid inputs.
            </p>
            <textarea
              value={focusText}
              onChange={(e) => setFocusText(e.target.value)}
              placeholder="e.g. Focus on comma rules and identifying sentence fragments. Also review subject-verb agreement."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              rows={3}
              maxLength={500}
            />
            <button
              onClick={handleSaveFocus}
              disabled={savingFocus || !focusText.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {focusSaved ? "✓ Saved!" : savingFocus ? "Saving..." : "Save Focus Area"}
            </button>
          </div>
        )}
      </div>

      {/* Domain Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Mastery by Domain
        </h3>
        <div className="space-y-3">
          {Object.entries(domainBreakdown).map(([domain, stats]) => {
            const total = stats.mastered + stats.inProgress + stats.notStarted;
            const pct = total > 0 ? Math.round((stats.mastered / total) * 100) : 0;

            return (
              <div key={domain}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">
                    {DOMAIN_LABELS[domain] || domain}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.mastered}/{total} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-green-500 transition-all"
                      style={{
                        width: `${total > 0 ? (stats.mastered / total) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-blue-400 transition-all"
                      style={{
                        width: `${total > 0 ? (stats.inProgress / total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {Object.keys(domainBreakdown).length === 0 && (
          <p className="text-sm text-gray-400">No mastery data yet.</p>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Sessions</h3>
        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Concept
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Accuracy
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Hints
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {s.conceptTitle}
                      <span className="text-xs text-gray-400 ml-1">
                        ({s.conceptCode})
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {new Date(s.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {s.durationMinutes} min
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-sm font-medium ${
                          s.accuracy >= 80
                            ? "text-green-600"
                            : s.accuracy >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {s.accuracy}%
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({s.correctAnswers}/{s.questionsAnswered})
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {s.hintsUsed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No sessions yet.</p>
        )}
      </div>
    </div>
  );
}
