"use client";

/**
 * Child Sessions Page — Phase 9: Parent Dashboard
 *
 * Full session history with pagination and filters.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import SessionHistory, {
  type SessionRecord,
} from "@/components/parent/SessionHistory";

export default function ChildSessionsPage() {
  const params = useParams();
  const childId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/parent/child/${childId}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading session history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Session History</h2>
        <p className="text-sm text-gray-500 mt-1">
          View all learning sessions with detailed breakdowns.
        </p>
      </div>

      <SessionHistory sessions={sessions} pageSize={15} />
    </div>
  );
}
