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
          <p className="text-[#6B7280]">Loading reviews...</p>
        </div>
      </div>
    );
  }

  const hasDueReviews = (summary?.dueNow ?? 0) > 0 || nodes.length > 0;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/kid"
        className="text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors"
      >
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#1F2937]">📚 Review Time</h1>
        <p className="text-[#6B7280] mt-1">
          Keep your knowledge fresh by reviewing what you&apos;ve learned!
        </p>
      </div>

      {/* Summary Card — only show when there are due reviews */}
      {summary && hasDueReviews && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold text-[#1F2937]">
                {summary.dueNow}
              </div>
              <div className="text-xs text-[#6B7280]">due now</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">
                {summary.overdueCount}
              </div>
              <div className="text-xs text-[#6B7280]">overdue</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-aauti-secondary">
                ~{summary.estimatedMinutes}
              </div>
              <div className="text-xs text-[#6B7280]">minutes</div>
            </div>
          </div>
        </div>
      )}

      {/* Start Review Button */}
      {hasDueReviews ? (
        <>
          <Link
            href={`/session?studentId=${studentId}&review=true&returnTo=/kid/review`}
            className="block w-full py-4 text-center text-lg font-bold text-white rounded-2xl bg-gradient-to-r from-aauti-primary to-aauti-secondary hover:from-aauti-primary/90 hover:to-aauti-secondary/90 transition-all shadow-lg shadow-aauti-primary/25"
          >
            📖 Start Review ({summary?.dueNow ?? nodes.length} topics)
          </Link>

          {/* Due Topics */}
          {nodes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[#1F2937] font-semibold text-sm">Topics to review:</h3>
              {nodes.map((node) => (
                <div
                  key={node.nodeId}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[#1F2937] text-sm font-medium">
                      {node.title}
                    </span>
                    <span className="block text-xs text-[#9CA3AF]">
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
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-[#1F2937] font-bold text-lg">All caught up!</h3>
          <p className="text-[#6B7280] text-sm mt-1">
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
