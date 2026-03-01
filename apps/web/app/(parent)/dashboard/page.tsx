"use client";

/**
 * Parent Dashboard Overview — Phase 9 (UX Overhaul)
 *
 * Shows all children as summary cards plus insight cards.
 * Uses AddChildWizard instead of inline form.
 */

import { useState, useEffect, useCallback } from "react";
import ChildCard, { type ChildCardData } from "@/components/parent/ChildCard";
import { useParent } from "@/lib/parent-context";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import AddChildWizard from "@/components/parent/wizard/AddChildWizard";

export default function ParentDashboardPage() {
  const { parentId, name } = useParent();
  const [children, setChildren] = useState<ChildCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const fetchData = useCallback(async () => {
    if (!parentId) return;
    try {
      const res = await fetch(`/api/parent/${parentId}/overview`);
      if (res.ok) {
        const data = await res.json();
        setChildren(data.childCards || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back{name ? `, ${name.split(" ")[0]}` : ""}!
          </h2>
          <p className="text-gray-500 mt-1">
            Here&apos;s how your children are doing.
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          + Add Child
        </button>
      </div>

      {/* Add Child Wizard */}
      {showWizard && (
        <AddChildWizard onClose={() => setShowWizard(false)} />
      )}

      {/* Child Cards */}
      {children.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">👶</div>
          <h3 className="font-semibold text-gray-900 mb-1">
            No children added yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Add a child profile to start tracking their learning progress.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            + Add Your First Child
          </button>
        </div>
      )}

    </div>
  );
}
