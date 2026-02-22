"use client";

/**
 * ClassCard — Displays class summary on teacher dashboard.
 */

import Link from "next/link";

export interface ClassCardData {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
  activeAssignments: number;
}

const GRADE_LABELS: Record<string, string> = {
  K: "Kindergarten",
  G1: "Grade 1",
  G2: "Grade 2",
  G3: "Grade 3",
  G4: "Grade 4",
  G5: "Grade 5",
};

export default function ClassCard({ cls }: { cls: ClassCardData }) {
  return (
    <Link
      href={`/teacher-dashboard/class/${cls.id}`}
      className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{cls.name}</h3>
          <p className="text-sm text-gray-500">
            {GRADE_LABELS[cls.gradeLevel] || cls.gradeLevel}
          </p>
        </div>
        <span className="text-2xl">🏫</span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">👥</span>
          <span className="text-gray-600">
            {cls.studentCount} student{cls.studentCount !== 1 ? "s" : ""}
          </span>
        </div>
        {cls.activeAssignments > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">📋</span>
            <span className="text-gray-600">
              {cls.activeAssignments} active
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
