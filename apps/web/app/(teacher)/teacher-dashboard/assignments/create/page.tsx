"use client";

/**
 * Create Assignment Page — Phase 11
 *
 * Form to create a new assignment: select class, title, pick concepts, set due date.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTeacher } from "@/lib/teacher-context";

interface ClassOption {
  id: string;
  name: string;
  gradeLevel: string;
}

interface NodeOption {
  id: string;
  title: string;
  nodeCode: string;
  domain: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  COUNTING: "Counting & Cardinality",
  OPERATIONS: "Operations",
  GEOMETRY: "Geometry",
  MEASUREMENT: "Measurement",
  DATA: "Data",
};

export default function CreateAssignmentPage() {
  const { teacherId } = useTeacher();
  const router = useRouter();

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [nodes, setNodes] = useState<NodeOption[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingNodes, setLoadingNodes] = useState(false);

  // Load classes
  useEffect(() => {
    async function loadClasses() {
      if (!teacherId) return;
      try {
        const res = await fetch(`/api/teacher/${teacherId}/overview`);
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      }
    }
    loadClasses();
  }, [teacherId]);

  // Load nodes when class is selected
  useEffect(() => {
    async function loadNodes() {
      if (!selectedClassId) {
        setNodes([]);
        return;
      }
      setLoadingNodes(true);
      try {
        const res = await fetch(`/api/teacher/class/${selectedClassId}`);
        if (res.ok) {
          const data = await res.json();
          // Fetch nodes for the class grade level
          const nodesRes = await fetch(
            `/api/teacher/class/${selectedClassId}/mastery-heatmap`
          );
          if (nodesRes.ok) {
            const heatmapData = await nodesRes.json();
            setNodes(heatmapData.nodes || []);
          }
        }
      } catch (err) {
        console.error("Failed to load nodes:", err);
      } finally {
        setLoadingNodes(false);
      }
    }
    loadNodes();
  }, [selectedClassId]);

  const toggleNode = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedNodeIds(new Set(nodes.map((n) => n.id)));
  };

  const selectNone = () => {
    setSelectedNodeIds(new Set());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedClassId || selectedNodeIds.size === 0) return;
    setCreating(true);

    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          title: title.trim(),
          description: description.trim() || null,
          nodeIds: Array.from(selectedNodeIds),
          dueDate: dueDate || null,
          status: "DRAFT",
        }),
      });

      if (res.ok) {
        const assignment = await res.json();
        router.push(`/teacher-dashboard/assignments/${assignment.id}`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create assignment");
      }
    } catch (err) {
      console.error("Failed to create assignment:", err);
    } finally {
      setCreating(false);
    }
  };

  // Group nodes by domain
  const nodesByDomain: Record<string, NodeOption[]> = {};
  nodes.forEach((node) => {
    if (!nodesByDomain[node.domain]) {
      nodesByDomain[node.domain] = [];
    }
    nodesByDomain[node.domain].push(node);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create Assignment</h2>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Class Selection */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedNodeIds(new Set());
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a class...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.gradeLevel})
              </option>
            ))}
          </select>
        </div>

        {/* Title & Description */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 3: Addition Practice"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions for students..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Concept Selection */}
        {selectedClassId && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Concepts ({selectedNodeIds.size} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={selectNone}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>

            {loadingNodes ? (
              <div className="text-sm text-gray-400 py-4 text-center">
                Loading concepts...
              </div>
            ) : nodes.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">
                No concepts available for this grade.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(nodesByDomain).map(([domain, domainNodes]) => (
                  <div key={domain}>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                      {DOMAIN_LABELS[domain] || domain}
                    </p>
                    <div className="space-y-1">
                      {domainNodes.map((node) => (
                        <label
                          key={node.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedNodeIds.has(node.id)}
                            onChange={() => toggleNode(node.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            <span className="text-gray-400">
                              {node.nodeCode}:
                            </span>{" "}
                            {node.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={
              creating ||
              !title.trim() ||
              !selectedClassId ||
              selectedNodeIds.size === 0
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create Assignment"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/teacher-dashboard/assignments")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
