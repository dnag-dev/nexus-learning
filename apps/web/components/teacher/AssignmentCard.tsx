"use client";

/**
 * AssignmentCard — Displays assignment summary.
 */

import Link from "next/link";

export interface AssignmentCardData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  nodeCount: number;
  dueDate: string | null;
  submissionCount: number;
  completedCount: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  ASSIGNMENT_ACTIVE: { label: "Active", color: "bg-green-100 text-green-700" },
  ASSIGNMENT_COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700" },
  ARCHIVED: { label: "Archived", color: "bg-gray-100 text-gray-500" },
};

export default function AssignmentCard({
  assignment,
}: {
  assignment: AssignmentCardData;
}) {
  const config = STATUS_CONFIG[assignment.status] || STATUS_CONFIG.DRAFT;

  return (
    <Link
      href={`/teacher-dashboard/assignments/${assignment.id}`}
      className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 text-sm">
          {assignment.title}
        </h4>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}
        >
          {config.label}
        </span>
      </div>

      {assignment.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {assignment.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{assignment.nodeCount} concept{assignment.nodeCount !== 1 ? "s" : ""}</span>
        <span>
          {assignment.completedCount}/{assignment.submissionCount} completed
        </span>
        {assignment.dueDate && (
          <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
        )}
      </div>
    </Link>
  );
}
