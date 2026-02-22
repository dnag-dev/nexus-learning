"use client";

/**
 * Lesson Plan Page — Phase 11
 *
 * Select concepts, generate AI lesson plan, display + copy.
 */

import { useState, useEffect } from "react";
import { useTeacher } from "@/lib/teacher-context";

interface NodeOption {
  id: string;
  title: string;
  nodeCode: string;
  domain: string;
}

interface ClassOption {
  id: string;
  name: string;
  gradeLevel: string;
}

interface LessonPlan {
  title: string;
  objectives: string[];
  warmUp: { duration: number; activity: string; materials: string[] };
  mainActivity: {
    duration: number;
    activity: string;
    steps: string[];
    materials: string[];
  };
  guidedPractice: {
    duration: number;
    activity: string;
    examples: string[];
  };
  independentPractice: {
    duration: number;
    activity: string;
    problems: string[];
  };
  assessment: { duration: number; method: string; exitTicket: string };
  differentiation: { struggling: string; advanced: string; ell: string };
  materials: string[];
}

const DOMAIN_LABELS: Record<string, string> = {
  COUNTING: "Counting & Cardinality",
  OPERATIONS: "Operations",
  GEOMETRY: "Geometry",
  MEASUREMENT: "Measurement",
  DATA: "Data",
};

export default function LessonPlanPage() {
  const { teacherId } = useTeacher();

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [nodes, setNodes] = useState<NodeOption[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState(45);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
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

  // Load nodes for selected class
  useEffect(() => {
    async function loadNodes() {
      if (!selectedClassId) return;
      setLoadingNodes(true);
      try {
        const res = await fetch(
          `/api/teacher/class/${selectedClassId}/mastery-heatmap`
        );
        if (res.ok) {
          const data = await res.json();
          setNodes(data.nodes || []);
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
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedNodeIds.size === 0) return;
    setGenerating(true);
    setPlan(null);

    try {
      const selectedClass = classes.find((c) => c.id === selectedClassId);
      const res = await fetch("/api/teacher/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId || null,
          nodeIds: Array.from(selectedNodeIds),
          duration,
          gradeLevel: selectedClass?.gradeLevel || "G1",
        }),
      });

      if (res.ok) {
        setPlan(await res.json());
      } else {
        alert("Failed to generate lesson plan. Please try again.");
      }
    } catch (err) {
      console.error("Failed to generate:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!plan) return;
    const text = formatPlanAsText(plan);
    navigator.clipboard.writeText(text).then(() => {
      alert("Lesson plan copied to clipboard!");
    });
  };

  // Group nodes by domain
  const nodesByDomain: Record<string, NodeOption[]> = {};
  nodes.forEach((node) => {
    if (!nodesByDomain[node.domain]) nodesByDomain[node.domain] = [];
    nodesByDomain[node.domain].push(node);
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Lesson Plan Generator
      </h2>
      <p className="text-gray-500">
        Select concepts and duration to generate an AI-powered lesson plan.
      </p>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedNodeIds(new Set());
              setPlan(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Select a class...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-end">
          <button
            onClick={handleGenerate}
            disabled={generating || selectedNodeIds.size === 0}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {generating ? "Generating..." : "Generate Lesson Plan"}
          </button>
        </div>
      </div>

      {/* Concept Selection */}
      {selectedClassId && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Select Concepts ({selectedNodeIds.size} selected)
          </h3>
          {loadingNodes ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {Object.entries(nodesByDomain).map(([domain, domainNodes]) => (
                <div key={domain}>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    {DOMAIN_LABELS[domain] || domain}
                  </p>
                  {domainNodes.map((node) => (
                    <label
                      key={node.id}
                      className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNodeIds.has(node.id)}
                        onChange={() => toggleNode(node.id)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        {node.nodeCode}: {node.title}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generated Plan */}
      {plan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {plan.title}
            </h3>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              📋 Copy
            </button>
          </div>

          {/* Objectives */}
          <PlanSection title="Learning Objectives" icon="🎯">
            <ul className="list-disc list-inside space-y-1">
              {plan.objectives.map((obj, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {obj}
                </li>
              ))}
            </ul>
          </PlanSection>

          {/* Warm Up */}
          <PlanSection
            title={`Warm-Up (${plan.warmUp.duration} min)`}
            icon="🔥"
          >
            <p className="text-sm text-gray-700">{plan.warmUp.activity}</p>
          </PlanSection>

          {/* Main Activity */}
          <PlanSection
            title={`Main Activity (${plan.mainActivity.duration} min)`}
            icon="📚"
          >
            <p className="text-sm text-gray-700 mb-2">
              {plan.mainActivity.activity}
            </p>
            <ol className="list-decimal list-inside space-y-1">
              {plan.mainActivity.steps.map((step, i) => (
                <li key={i} className="text-sm text-gray-600">
                  {step}
                </li>
              ))}
            </ol>
          </PlanSection>

          {/* Guided Practice */}
          <PlanSection
            title={`Guided Practice (${plan.guidedPractice.duration} min)`}
            icon="🤝"
          >
            <p className="text-sm text-gray-700 mb-2">
              {plan.guidedPractice.activity}
            </p>
          </PlanSection>

          {/* Independent Practice */}
          <PlanSection
            title={`Independent Practice (${plan.independentPractice.duration} min)`}
            icon="✏️"
          >
            <p className="text-sm text-gray-700">
              {plan.independentPractice.activity}
            </p>
          </PlanSection>

          {/* Assessment */}
          <PlanSection
            title={`Assessment (${plan.assessment.duration} min)`}
            icon="📝"
          >
            <p className="text-sm text-gray-700">{plan.assessment.method}</p>
            <p className="text-sm text-gray-500 mt-1 italic">
              Exit Ticket: {plan.assessment.exitTicket}
            </p>
          </PlanSection>

          {/* Differentiation */}
          <PlanSection title="Differentiation" icon="🌈">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-red-600">
                  Struggling:
                </span>
                <p className="text-sm text-gray-700">
                  {plan.differentiation.struggling}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-green-600">
                  Advanced:
                </span>
                <p className="text-sm text-gray-700">
                  {plan.differentiation.advanced}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-blue-600">ELL:</span>
                <p className="text-sm text-gray-700">
                  {plan.differentiation.ell}
                </p>
              </div>
            </div>
          </PlanSection>

          {/* Materials */}
          <PlanSection title="Materials Needed" icon="🧰">
            <div className="flex flex-wrap gap-2">
              {plan.materials.map((m, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {m}
                </span>
              ))}
            </div>
          </PlanSection>
        </div>
      )}
    </div>
  );
}

function PlanSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h4 className="font-medium text-gray-900 mb-3">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}

function formatPlanAsText(plan: LessonPlan): string {
  return `LESSON PLAN: ${plan.title}

OBJECTIVES:
${plan.objectives.map((o) => `- ${o}`).join("\n")}

WARM-UP (${plan.warmUp.duration} min):
${plan.warmUp.activity}

MAIN ACTIVITY (${plan.mainActivity.duration} min):
${plan.mainActivity.activity}
Steps:
${plan.mainActivity.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

GUIDED PRACTICE (${plan.guidedPractice.duration} min):
${plan.guidedPractice.activity}

INDEPENDENT PRACTICE (${plan.independentPractice.duration} min):
${plan.independentPractice.activity}

ASSESSMENT (${plan.assessment.duration} min):
${plan.assessment.method}
Exit Ticket: ${plan.assessment.exitTicket}

DIFFERENTIATION:
Struggling: ${plan.differentiation.struggling}
Advanced: ${plan.differentiation.advanced}
ELL: ${plan.differentiation.ell}

MATERIALS:
${plan.materials.map((m) => `- ${m}`).join("\n")}`;
}
