"use client";

/**
 * Kid Review Page — Simplified spaced repetition hub for child.
 *
 * Shows due review count and starts review sessions.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useChild } from "@/lib/child-context";

interface ReviewNode {
  nodeId: string;
  nodeCode: string;
  title: string;
  domain: string;
  gradeLevel: string;
  bktProbability: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  isOverdue: boolean;
}

interface ReviewSummary {
  dueNow: number;
  overdueCount: number;
  estimatedMinutes: number;
  urgency: string;
}

export default function KidReviewPage() {
  const { studentId } = useChild();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [nodes, setNodes] = useState<ReviewNode[]>([]);

  const fetchReviews = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await fetch(`/api/student/${studentId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setNodes(data.nodes ?? []);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">📚</div>
          <p className="text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  const dueNodes = nodes.filter(
    (n) => new Date(n.nextReviewAt) <= new Date()
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/kid"
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">📚 Review Time</h1>
        <p className="text-gray-400 mt-1">
          Keep your knowledge fresh by reviewing what you&apos;ve learned!
        </p>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-6 text-center">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold text-white">
                {summary.dueNow}
              </div>
              <div className="text-xs text-gray-400">due now</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">
                {summary.overdueCount}
              </div>
              <div className="text-xs text-gray-400">overdue</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-aauti-secondary">
                ~{summary.estimatedMinutes}
              </div>
              <div className="text-xs text-gray-400">minutes</div>
            </div>
          </div>
        </div>
      )}

      {/* Start Review Button */}
      {dueNodes.length > 0 ? (
        <>
          <Link
            href={`/session?studentId=${studentId}&review=true&returnTo=/kid/review`}
            className="block w-full py-4 text-center text-lg font-bold text-white rounded-2xl bg-gradient-to-r from-aauti-primary to-aauti-secondary hover:from-aauti-primary/90 hover:to-aauti-secondary/90 transition-all shadow-lg shadow-aauti-primary/25"
          >
            📖 Start Review ({dueNodes.length} topics)
          </Link>

          {/* Due Topics */}
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-sm">Topics to review:</h3>
            {dueNodes.map((node) => (
              <div
                key={node.nodeId}
                className="bg-[#1A2744] rounded-xl border border-white/5 p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-white text-sm font-medium">
                    {node.title}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {node.domain} · {node.gradeLevel}
                  </span>
                </div>
                {node.isOverdue && (
                  <span className="text-xs text-orange-400 font-medium">
                    Overdue
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-white font-bold text-lg">All caught up!</h3>
          <p className="text-gray-400 text-sm mt-1">
            No reviews due right now. Keep learning to unlock more!
          </p>
          <Link
            href="/kid"
            className="inline-block mt-4 px-6 py-2 bg-aauti-primary/20 text-aauti-primary rounded-lg text-sm font-medium hover:bg-aauti-primary/30 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
