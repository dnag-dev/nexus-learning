"use client";

/**
 * Assignments List Page — Phase 11
 *
 * Shows all assignments across all classes for the teacher.
 */

import { useState, useEffect } from "react";
import { useTeacher } from "@/lib/teacher-context";
import AssignmentCard, {
  type AssignmentCardData,
} from "@/components/teacher/AssignmentCard";
import Link from "next/link";

interface ClassAssignments {
  className: string;
  classId: string;
  assignments: AssignmentCardData[];
}

export default function AssignmentsPage() {
  const { teacherId } = useTeacher();
  const [classAssignments, setClassAssignments] = useState<ClassAssignments[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!teacherId) return;
      try {
        // First get all classes
        const overviewRes = await fetch(
          `/api/teacher/${teacherId}/overview`
        );
        if (!overviewRes.ok) return;
        const overview = await overviewRes.json();

        // Then get assignments for each class
        const results = await Promise.all(
          (overview.classes || []).map(
            async (cls: { id: string; name: string }) => {
              const res = await fetch(
                `/api/teacher/class/${cls.id}/assignments`
              );
              if (res.ok) {
                const assignments = await res.json();
                return {
                  className: cls.name,
                  classId: cls.id,
                  assignments,
                };
              }
              return { className: cls.name, classId: cls.id, assignments: [] };
            }
          )
        );

        setClassAssignments(results);
      } catch (err) {
        console.error("Failed to load assignments:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teacherId]);

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading assignments...
      </div>
    );
  }

  const totalAssignments = classAssignments.reduce(
    (sum, ca) => sum + ca.assignments.length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <p className="text-gray-500 mt-1">
            {totalAssignments} assignment
            {totalAssignments !== 1 ? "s" : ""} across all classes
          </p>
        </div>
        <Link
          href="/teacher-dashboard/assignments/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Create Assignment
        </Link>
      </div>

      {classAssignments.map((ca) => (
        <div key={ca.classId}>
          <h3 className="font-semibold text-gray-700 mb-3">{ca.className}</h3>
          {ca.assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {ca.assignments.map((a) => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-6">
              No assignments for this class.
            </p>
          )}
        </div>
      ))}

      {classAssignments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">
            Create a class first, then add assignments.
          </p>
        </div>
      )}
    </div>
  );
}
