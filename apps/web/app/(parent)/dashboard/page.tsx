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
import { DashboardSkeleton } from "@/components/ui/Skeleton";

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
  const [childUsername, setChildUsername] = useState("");
  const [childPin, setChildPin] = useState("");
  const [childPinConfirm, setChildPinConfirm] = useState("");
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

    // Validate PIN if provided
    if (childPin && childPin !== childPinConfirm) {
      alert("PINs don't match!");
      return;
    }
    if (childPin && !/^\d{4}$/.test(childPin)) {
      alert("PIN must be exactly 4 digits");
      return;
    }
    if (childUsername && (childUsername.length < 3 || !/^[a-zA-Z0-9_]+$/.test(childUsername))) {
      alert("Username must be 3-20 characters (letters, numbers, underscores)");
      return;
    }

    try {
      const res = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          displayName: childName.trim(),
          gradeLevel: childGrade,
          ageGroup: childAge,
          username: childUsername.trim().toLowerCase() || undefined,
          pin: childPin || undefined,
        }),
      });

      if (res.ok) {
        setChildName("");
        setChildUsername("");
        setChildPin("");
        setChildPinConfirm("");
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
                  <option value="G6">Grade 6</option>
                  <option value="G7">Grade 7</option>
                  <option value="G8">Grade 8</option>
                  <option value="G9">Grade 9</option>
                  <option value="G10">Grade 10</option>
                  <option value="G11">Grade 11</option>
                  <option value="G12">Grade 12</option>
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
                  <option value="TEEN_13_15">Ages 13-15</option>
                  <option value="HIGH_16_18">Ages 16-18</option>
                </select>
              </div>
            </div>
            {/* Kid Login Credentials (optional) */}
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-xs text-gray-500 mb-3">
                🚀 <strong>Optional:</strong> Set up a Kid Login so your child can sign in independently
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={childUsername}
                    onChange={(e) => setChildUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                    placeholder="e.g. arjun_star"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    4-Digit PIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={childPin}
                    onChange={(e) => setChildPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="e.g. 5728"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    maxLength={4}
                  />
                </div>
              </div>
              {childPin && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm PIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={childPinConfirm}
                    onChange={(e) => setChildPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Re-enter PIN"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      childPinConfirm && childPinConfirm !== childPin
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    maxLength={4}
                  />
                  {childPinConfirm && childPinConfirm !== childPin && (
                    <p className="text-xs text-red-500 mt-1">PINs don&apos;t match</p>
                  )}
                </div>
              )}
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
