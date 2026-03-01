"use client";

/**
 * Parent Reports Page
 *
 * Shows weekly summaries for each child with date, sessions,
 * concepts mastered, and accuracy.
 */

import { useState, useEffect, useCallback } from "react";
import { useParent } from "@/lib/parent-context";
import Link from "next/link";

interface ChildReport {
  id: string;
  displayName: string;
  gradeLevel: string;
  sessions: Array<{
    id: string;
    date: string;
    durationMinutes: number;
    accuracy: number;
    nodesCovered: string[];
    sessionType: string;
  }>;
  totalSessions: number;
  totalMinutes: number;
  avgAccuracy: number;
  conceptsMastered: number;
}

export default function ParentReportsPage() {
  const { parentId } = useParent();
  const [reports, setReports] = useState<ChildReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!parentId) return;
    try {
      // Get children list
      const overviewRes = await fetch(`/api/parent/${parentId}/overview`);
      if (!overviewRes.ok) return;
      const overview = await overviewRes.json();
      const children = overview.childCards || [];

      // Fetch sessions for each child
      const childReports: ChildReport[] = await Promise.all(
        children.map(async (child: { id: string; displayName: string; gradeLevel: string }) => {
          try {
            const sessionsRes = await fetch(`/api/parent/child/${child.id}/sessions`);
            const sessionsData = sessionsRes.ok ? await sessionsRes.json() : { sessions: [] };
            const sessions = sessionsData.sessions || [];

            // Last 7 days
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const weekSessions = sessions.filter(
              (s: { date: string }) => new Date(s.date).getTime() > weekAgo
            );

            const totalMinutes = weekSessions.reduce(
              (sum: number, s: { durationMinutes: number }) => sum + s.durationMinutes,
              0
            );
            const avgAccuracy =
              weekSessions.length > 0
                ? Math.round(
                    weekSessions.reduce((sum: number, s: { accuracy: number }) => sum + s.accuracy, 0) /
                      weekSessions.length
                  )
                : 0;

            return {
              id: child.id,
              displayName: child.displayName,
              gradeLevel: child.gradeLevel,
              sessions: sessions.slice(0, 10),
              totalSessions: weekSessions.length,
              totalMinutes,
              avgAccuracy,
              conceptsMastered: 0,
            };
          } catch {
            return {
              id: child.id,
              displayName: child.displayName,
              gradeLevel: child.gradeLevel,
              sessions: [],
              totalSessions: 0,
              totalMinutes: 0,
              avgAccuracy: 0,
              conceptsMastered: 0,
            };
          }
        })
      );

      setReports(childReports);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="text-gray-500 mt-1">Weekly learning summaries for each child.</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-gray-500 text-sm">No children added yet.</p>
        </div>
      ) : (
        reports.map((child) => (
          <div key={child.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{child.displayName}</h3>
                <p className="text-xs text-gray-500">{child.gradeLevel}</p>
              </div>
              <Link
                href={`/dashboard/child/${child.id}?tab=sessions`}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                View all sessions →
              </Link>
            </div>

            {/* Weekly Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Sessions this week</p>
                <p className="text-xl font-bold text-gray-900">{child.totalSessions}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Time this week</p>
                <p className="text-xl font-bold text-gray-900">{child.totalMinutes}m</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Avg accuracy</p>
                <p className="text-xl font-bold text-gray-900">
                  {child.avgAccuracy > 0 ? `${child.avgAccuracy}%` : "—"}
                </p>
              </div>
            </div>

            {/* Recent Sessions Table */}
            {child.sessions.length > 0 ? (
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Date</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Duration</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Accuracy</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Concepts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.sessions.map((session) => (
                      <tr key={session.id} className="border-t border-gray-50">
                        <td className="px-3 py-2 text-gray-700">
                          {new Date(session.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {session.durationMinutes > 0 ? `${session.durationMinutes}m` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              session.accuracy >= 80
                                ? "text-green-600"
                                : session.accuracy >= 60
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }
                          >
                            {session.accuracy > 0 ? `${session.accuracy}%` : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {session.nodesCovered.length > 0
                            ? session.nodesCovered.join(", ")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No sessions completed yet.
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
