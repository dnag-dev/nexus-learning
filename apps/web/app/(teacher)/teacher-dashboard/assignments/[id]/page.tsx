"use client";

/**
 * Assignment Detail Page — Phase 11
 *
 * Shows assignment info, node list, and submission table.
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface AssignmentDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  nodeIds: string[];
  dueDate: string | null;
  createdAt: string;
  class: { id: string; name: string; gradeLevel: string };
  nodes: Array<{ id: string; title: string; nodeCode: string }>;
  submissions: Array<{
    id: string;
    studentId: string;
    studentName: string;
    avatarPersonaId: string;
    nodesAttempted: string[];
    nodesMastered: string[];
    score: number | null;
    completedAt: string | null;
  }>;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  const [data, setData] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/teacher/assignments/${assignmentId}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load assignment:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [assignmentId]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading assignment...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-gray-500">
        Assignment not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/teacher-dashboard/assignments"
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        &larr; Back to assignments
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{data.title}</h2>
            {data.description && (
              <p className="text-gray-500 text-sm mt-1">{data.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {data.class.name} &middot; Created{" "}
              {new Date(data.createdAt).toLocaleDateString()}
              {data.dueDate &&
                ` · Due ${new Date(data.dueDate).toLocaleDateString()}`}
            </p>
          </div>
          <div className="flex gap-2">
            {data.status === "DRAFT" && (
              <button
                onClick={() => updateStatus("ASSIGNMENT_ACTIVE")}
                disabled={updating}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Activate
              </button>
            )}
            {data.status === "ASSIGNMENT_ACTIVE" && (
              <button
                onClick={() => updateStatus("ASSIGNMENT_COMPLETED")}
                disabled={updating}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Complete
              </button>
            )}
            {data.status !== "ARCHIVED" && (
              <button
                onClick={() => updateStatus("ARCHIVED")}
                disabled={updating}
                className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Concepts */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          Concepts ({data.nodes.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.nodes.map((node) => (
            <span
              key={node.id}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
            >
              {node.nodeCode}: {node.title}
            </span>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Submissions ({data.submissions.length})
          </h3>
        </div>
        {data.submissions.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Attempted
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mastered
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {sub.studentName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sub.nodesAttempted.length}/{data.nodes.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sub.nodesMastered.length}/{data.nodes.length}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.score !== null ? (
                      <span
                        className={`font-medium ${
                          sub.score >= 80
                            ? "text-green-600"
                            : sub.score >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {Math.round(sub.score)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sub.completedAt
                      ? new Date(sub.completedAt).toLocaleDateString()
                      : "In progress"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-8 text-center text-gray-400 text-sm">
            No submissions yet.
          </div>
        )}
      </div>
    </div>
  );
}
