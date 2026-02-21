"use client";

/**
 * Parent Dashboard Overview — Phase 9
 *
 * Shows all children as summary cards plus insight cards.
 * Includes "Add Child" flow.
 */

import { useState, useEffect, useCallback } from "react";
import ChildCard, { type ChildCardData } from "@/components/parent/ChildCard";
import { useParent } from "@/lib/parent-context";

export default function ParentDashboardPage() {
  const { parentId, name } = useParent();
  const [children, setChildren] = useState<ChildCardData[]>([]);
  const [insights, setInsights] = useState<
    Array<{
      title: string;
      description: string;
      metric: string;
      priority: string;
      recommendation: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Add child form state
  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState("");
  const [childGrade, setChildGrade] = useState("G3");
  const [childAge, setChildAge] = useState("MID_8_10");
  const [addingChild, setAddingChild] = useState(false);

  const fetchData = useCallback(async () => {
    if (!parentId) return;
    try {
      const res = await fetch(`/api/parent/${parentId}/overview`);
      if (res.ok) {
        const data = await res.json();
        setChildren(data.childCards || []);
        setInsights(data.insights || []);
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

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) return;
    setAddingChild(true);

    try {
      const res = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          displayName: childName.trim(),
          gradeLevel: childGrade,
          ageGroup: childAge,
        }),
      });

      if (res.ok) {
        setChildName("");
        setShowAddChild(false);
        // Refresh — reload to update sidebar too
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add child");
      }
    } catch (err) {
      console.error("Failed to add child:", err);
      alert("Failed to add child. Check console for details.");
    } finally {
      setAddingChild(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading your children&apos;s progress...
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
          onClick={() => setShowAddChild(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          + Add Child
        </button>
      </div>

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Add a Child Profile
          </h3>
          <form onSubmit={handleAddChild} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child&apos;s Name
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Arjun"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level
                </label>
                <select
                  value={childGrade}
                  onChange={(e) => setChildGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="K">Kindergarten</option>
                  <option value="G1">Grade 1</option>
                  <option value="G2">Grade 2</option>
                  <option value="G3">Grade 3</option>
                  <option value="G4">Grade 4</option>
                  <option value="G5">Grade 5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age Group
                </label>
                <select
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="EARLY_5_7">Ages 5-7</option>
                  <option value="MID_8_10">Ages 8-10</option>
                  <option value="UPPER_11_12">Ages 11-12</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={addingChild || !childName.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {addingChild ? "Adding..." : "Add Child"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddChild(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Child Cards */}
      {children.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            onClick={() => setShowAddChild(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            + Add Your First Child
          </button>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl border p-4 ${
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
                <p className="text-xs text-gray-600 mb-2">
                  {insight.description}
                </p>
                <p className="text-xs text-purple-600 italic">
                  💡 {insight.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
