"use client";

/**
 * Teacher Dashboard Overview — Phase 11
 *
 * Shows stat cards, class grid, recent alerts, and create class modal.
 */

import { useState, useEffect, useCallback } from "react";
import { useTeacher } from "@/lib/teacher-context";
import ClassCard, { type ClassCardData } from "@/components/teacher/ClassCard";
import AlertCard, { type AlertCardData } from "@/components/teacher/AlertCard";

export default function TeacherDashboardPage() {
  const { teacherId, name } = useTeacher();
  const [classes, setClasses] = useState<ClassCardData[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeAlerts: 0,
    activeAssignments: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<AlertCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Create class form state
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [className, setClassName] = useState("");
  const [classGrade, setClassGrade] = useState("G1");
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teacherId) return;
    try {
      const res = await fetch(`/api/teacher/${teacherId}/overview`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
        setStats(
          data.stats || {
            totalStudents: 0,
            activeAlerts: 0,
            activeAssignments: 0,
          }
        );
        setRecentAlerts(data.recentAlerts || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          name: className.trim(),
          gradeLevel: classGrade,
        }),
      });

      if (res.ok) {
        setClassName("");
        setShowCreateClass(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create class");
      }
    } catch (err) {
      console.error("Failed to create class:", err);
      alert("Failed to create class.");
    } finally {
      setCreating(false);
    }
  };

  const handleAlertAcknowledge = async (alertId: string) => {
    try {
      await fetch(`/api/teacher/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACKNOWLEDGED" }),
      });
      setRecentAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: "ACKNOWLEDGED" } : a
        )
      );
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  const handleAlertResolve = async (alertId: string) => {
    try {
      await fetch(`/api/teacher/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      setRecentAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setStats((prev) => ({
        ...prev,
        activeAlerts: Math.max(0, prev.activeAlerts - 1),
      }));
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading your dashboard...
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
            Here&apos;s an overview of your classes.
          </p>
        </div>
        <button
          onClick={() => setShowCreateClass(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Create Class
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {stats.totalStudents}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active Alerts</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              stats.activeAlerts > 0 ? "text-red-600" : "text-gray-900"
            }`}
          >
            {stats.activeAlerts}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active Assignments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {stats.activeAssignments}
          </p>
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create a Class</h3>
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Name
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Grade 1 - Section A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level
              </label>
              <select
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="K">Kindergarten</option>
                <option value="G1">Grade 1</option>
                <option value="G2">Grade 2</option>
                <option value="G3">Grade 3</option>
                <option value="G4">Grade 4</option>
                <option value="G5">Grade 5</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || !className.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create Class"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateClass(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Class Cards */}
      {classes.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Classes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <ClassCard key={cls.id} cls={cls} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">🏫</div>
          <h3 className="font-semibold text-gray-900 mb-1">
            No classes created yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Create a class to start tracking student progress.
          </p>
          <button
            onClick={() => setShowCreateClass(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Create Your First Class
          </button>
        </div>
      )}

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Alerts
            </h3>
            <a
              href="/teacher-dashboard/alerts"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </a>
          </div>
          <div className="space-y-3">
            {recentAlerts.slice(0, 3).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAlertAcknowledge}
                onResolve={handleAlertResolve}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
