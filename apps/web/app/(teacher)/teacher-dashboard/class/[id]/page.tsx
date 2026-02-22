"use client";

/**
 * Class Detail Page — Phase 11
 *
 * Shows students table, add student form, mastery heatmap, and export button.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import StudentTable, {
  type StudentRow,
} from "@/components/teacher/StudentTable";
import MasteryHeatmap from "@/components/teacher/MasteryHeatmap";

const GRADE_LABELS: Record<string, string> = {
  K: "Kindergarten",
  G1: "Grade 1",
  G2: "Grade 2",
  G3: "Grade 3",
  G4: "Grade 4",
  G5: "Grade 5",
};

interface ClassData {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
  activeAssignments: number;
  students: StudentRow[];
  totalNodes: number;
}

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [adding, setAdding] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/class/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setClassData(data);
      }
    } catch (err) {
      console.error("Failed to load class:", err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;
    setAdding(true);
    setError(null);

    try {
      const res = await fetch(`/api/teacher/class/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentId.trim() }),
      });

      if (res.ok) {
        setStudentId("");
        setShowAddStudent(false);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add student");
      }
    } catch (err) {
      console.error("Failed to add student:", err);
      setError("Failed to add student.");
    } finally {
      setAdding(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/teacher/class/${classId}/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `class-${classData?.name || classId}-progress.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading class...
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="py-12 text-center text-gray-500">Class not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {classData.name}
          </h2>
          <p className="text-gray-500 mt-1">
            {GRADE_LABELS[classData.gradeLevel] || classData.gradeLevel} &middot;{" "}
            {classData.studentCount} student
            {classData.studentCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {showHeatmap ? "📋 Table View" : "🎨 Mastery Heatmap"}
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => setShowAddStudent(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Add Student Form */}
      {showAddStudent && (
        <div className="bg-white rounded-xl border-2 border-blue-200 p-4">
          <form onSubmit={handleAddStudent} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddStudent(false);
                setError(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </form>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Student Table or Heatmap */}
      {showHeatmap ? (
        <MasteryHeatmap classId={classId} />
      ) : (
        <StudentTable students={classData.students} classId={classId} />
      )}
    </div>
  );
}
