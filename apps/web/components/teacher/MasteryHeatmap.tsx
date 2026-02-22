"use client";

/**
 * MasteryHeatmap — Color-coded grid showing student mastery across concepts.
 */

import { useState, useEffect } from "react";

interface NodeInfo {
  id: string;
  title: string;
  nodeCode: string;
  domain: string;
}

interface StudentMastery {
  id: string;
  displayName: string;
  mastery: Record<string, string>; // nodeId -> MasteryLevel
}

const MASTERY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  NOVICE: { bg: "bg-gray-100", text: "text-gray-500", label: "Novice" },
  DEVELOPING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Developing" },
  PROFICIENT: { bg: "bg-blue-100", text: "text-blue-700", label: "Proficient" },
  ADVANCED: { bg: "bg-green-100", text: "text-green-700", label: "Advanced" },
  MASTERED: { bg: "bg-amber-200", text: "text-amber-800", label: "Mastered" },
};

interface MasteryHeatmapProps {
  classId: string;
}

export default function MasteryHeatmap({ classId }: MasteryHeatmapProps) {
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [students, setStudents] = useState<StudentMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{
    student: string;
    node: string;
    level: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/teacher/class/${classId}/mastery-heatmap`
        );
        if (res.ok) {
          const data = await res.json();
          setNodes(data.nodes || []);
          setStudents(data.students || []);
        }
      } catch (err) {
        console.error("Failed to load heatmap:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classId]);

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading mastery heatmap...
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-500 text-sm">
          No curriculum nodes available for this grade level.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Legend */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-4 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Legend:</span>
        {Object.entries(MASTERY_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded ${val.bg}`} />
            <span className="text-xs text-gray-600">{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-white border border-gray-200" />
          <span className="text-xs text-gray-600">Not Started</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                Student
              </th>
              {nodes.map((node) => (
                <th
                  key={node.id}
                  className="px-1 py-2 text-center min-w-[40px]"
                  title={`${node.nodeCode}: ${node.title}`}
                >
                  <span className="text-[10px] text-gray-400 writing-mode-vertical block transform -rotate-45 origin-bottom-left h-16 overflow-hidden">
                    {node.nodeCode}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="sticky left-0 z-10 bg-white px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap border-r border-gray-100">
                  {student.displayName}
                </td>
                {nodes.map((node) => {
                  const level = student.mastery[node.id];
                  const config = level
                    ? MASTERY_COLORS[level]
                    : null;

                  return (
                    <td
                      key={node.id}
                      className="px-1 py-2 text-center relative"
                      onMouseEnter={() =>
                        setHoveredCell({
                          student: student.displayName,
                          node: node.title,
                          level: level || "Not Started",
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className={`w-6 h-6 rounded mx-auto ${
                          config
                            ? config.bg
                            : "bg-white border border-gray-200"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50">
          <p className="font-medium">{hoveredCell.student}</p>
          <p className="text-gray-300">{hoveredCell.node}</p>
          <p className="text-gray-400">Level: {hoveredCell.level}</p>
        </div>
      )}
    </div>
  );
}
