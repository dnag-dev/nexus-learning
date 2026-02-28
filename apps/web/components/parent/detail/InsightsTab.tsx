"use client";

/**
 * InsightsTab — Per-Child Detail Page
 *
 * All insight cards from the parent overview API.
 */

import { useState, useEffect } from "react";

interface InsightsTabProps {
  parentId: string;
}

interface InsightCard {
  title: string;
  description: string;
  metric: string;
  priority: string;
  recommendation: string;
}

export default function InsightsTab({ parentId }: InsightsTabProps) {
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch(`/api/parent/${parentId}/overview`);
        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights || []);
        }
      } catch (err) {
        console.error("Insights fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [parentId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No insights yet. Complete more sessions to unlock AI-powered learning insights.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        AI-generated insights based on learning patterns and session data.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl border p-5 ${
              insight.priority === "HIGH"
                ? "border-red-200 bg-red-50/30"
                : insight.priority === "MEDIUM"
                  ? "border-amber-200 bg-amber-50/30"
                  : "border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm">
                {insight.title}
              </h4>
              <span className="text-sm font-bold text-purple-600">
                {insight.metric}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {insight.description}
            </p>
            <div className="flex items-start gap-1.5">
              <span className="text-xs">💡</span>
              <p className="text-xs text-purple-600 italic">
                {insight.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
