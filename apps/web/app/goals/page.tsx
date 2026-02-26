"use client";

import { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// ─── Types ───

interface LearningGoalOption {
  id: string;
  name: string;
  description: string;
  category: "GRADE_PROFICIENCY" | "EXAM_PREP" | "SKILL_BUILDING" | "CUSTOM";
  gradeLevel: number | null;
  examType: string | null;
  estimatedHours: number;
  requiredNodeIds: string[];
}

interface InterpretResult {
  primaryMatch: {
    goalId: string;
    goalName: string;
    confidence: number;
    reason: string;
  };
  alternativeMatches: Array<{
    goalId: string;
    goalName: string;
    reason: string;
  }>;
  interpretation: string;
}

interface PlanResult {
  planId: string;
  conceptSequence: string[];
  totalEstimatedHours: number;
  projectedCompletionDate: string;
  weeklyMilestones: unknown[];
  narrative: string;
  conceptsAlreadyMastered: number;
  conceptsRemaining: number;
}

type Phase =
  | "select-category"
  | "select-goal"
  | "timeline"
  | "practice-time"
  | "prior-knowledge"
  | "building"
  | "complete";

type GoalCategoryType = "GRADE_PROFICIENCY" | "EXAM_PREP" | "CUSTOM";
type TimelineOption = "asap" | "3months" | "6months" | "custom";
type PriorKnowledgeOption = "test-me" | "self-report";

// ─── Constants ───

const GRADE_OPTIONS = [
  { value: 0, label: "Kindergarten", short: "K" },
  { value: 1, label: "Grade 1", short: "G1" },
  { value: 2, label: "Grade 2", short: "G2" },
  { value: 3, label: "Grade 3", short: "G3" },
  { value: 4, label: "Grade 4", short: "G4" },
  { value: 5, label: "Grade 5", short: "G5" },
  { value: 6, label: "Grade 6", short: "G6" },
  { value: 7, label: "Grade 7", short: "G7" },
  { value: 8, label: "Grade 8", short: "G8" },
];

const SUBJECT_OPTIONS = [
  { value: "MATH", label: "Math", emoji: "🔢" },
  { value: "ELA", label: "English Language Arts", emoji: "📖" },
  { value: "BOTH", label: "Both Subjects", emoji: "🎯" },
];

const EXAM_OPTIONS = [
  {
    type: "SAT",
    name: "SAT",
    description: "College Board entrance exam",
    emoji: "🎓",
    subjects: ["SAT Math", "SAT Reading & Writing"],
  },
  {
    type: "ACT",
    name: "ACT",
    description: "American College Testing",
    emoji: "📝",
    subjects: ["ACT Math", "ACT English"],
  },
  {
    type: "PSAT",
    name: "PSAT/NMSQT",
    description: "Practice SAT & scholarship qualifier",
    emoji: "📋",
    subjects: ["PSAT Math", "PSAT Reading & Writing"],
  },
  {
    type: "ISEE",
    name: "ISEE",
    description: "Independent School Entrance Exam",
    emoji: "🏫",
    subjects: ["ISEE Lower Level", "ISEE Middle Level", "ISEE Upper Level"],
  },
];

const TIMELINE_OPTIONS: Array<{
  value: TimelineOption;
  label: string;
  sublabel: string;
  emoji: string;
}> = [
  {
    value: "asap",
    label: "As soon as possible",
    sublabel: "Fastest pace based on your schedule",
    emoji: "🚀",
  },
  {
    value: "3months",
    label: "3 months",
    sublabel: "Steady, balanced approach",
    emoji: "📅",
  },
  {
    value: "6months",
    label: "6 months",
    sublabel: "Relaxed, thorough coverage",
    emoji: "🌱",
  },
  {
    value: "custom",
    label: "Pick a date",
    sublabel: "Set your own deadline",
    emoji: "🎯",
  },
];

// ─── Animations ───

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

// ─── Component Wrapper (Suspense boundary for useSearchParams) ───

export default function GoalSelectionPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      }
    >
      <GoalSelectionPage />
    </Suspense>
  );
}

// ─── Main Page ───

function GoalSelectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const STUDENT_ID = searchParams.get("studentId") || "demo-student-1";

  // ─── Phase & Navigation ───
  const [phase, setPhase] = useState<Phase>("select-category");
  const [phaseHistory, setPhaseHistory] = useState<Phase[]>([]);

  // ─── Goal Selection State ───
  const [allGoals, setAllGoals] = useState<LearningGoalOption[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<GoalCategoryType | null>(null);

  // Grade Proficiency specifics
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("MATH");

  // Exam Prep specifics
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null);
  const [selectedExamGoalId, setSelectedExamGoalId] = useState<string | null>(null);

  // Custom goal
  const [customGoalText, setCustomGoalText] = useState("");
  const [interpretResult, setInterpretResult] = useState<InterpretResult | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);

  // Final selected goal
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedGoalName, setSelectedGoalName] = useState<string>("");

  // ─── Timeline State ───
  const [timeline, setTimeline] = useState<TimelineOption>("asap");
  const [customDate, setCustomDate] = useState("");

  // ─── Practice Time State ───
  const [minutesPerDay, setMinutesPerDay] = useState(20);

  // ─── Prior Knowledge State ───
  const [priorKnowledge, setPriorKnowledge] = useState<PriorKnowledgeOption | null>(null);

  // ─── Plan Creation State ───
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildMessage, setBuildMessage] = useState("Analyzing your goal...");
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Computed Values ───
  const weeklyHours = useMemo(() => (minutesPerDay * 7) / 60, [minutesPerDay]);

  const targetDate = useMemo(() => {
    if (timeline === "custom" && customDate) return customDate;
    const now = new Date();
    if (timeline === "3months") {
      now.setMonth(now.getMonth() + 3);
      return now.toISOString().split("T")[0];
    }
    if (timeline === "6months") {
      now.setMonth(now.getMonth() + 6);
      return now.toISOString().split("T")[0];
    }
    return undefined; // "asap" — no target date, use fastest pace
  }, [timeline, customDate]);

  const estimatedWeeks = useMemo(() => {
    if (!selectedGoalId || !allGoals.length) return null;
    const goal = allGoals.find((g) => g.id === selectedGoalId);
    if (!goal) return null;
    const hoursNeeded = goal.estimatedHours;
    if (weeklyHours <= 0) return null;
    return Math.ceil(hoursNeeded / weeklyHours);
  }, [selectedGoalId, allGoals, weeklyHours]);

  // ─── Grade Proficiency: auto-select goal ───
  const matchingGradeGoals = useMemo(() => {
    if (selectedGrade === null || !allGoals.length) return [];
    return allGoals.filter(
      (g) =>
        g.category === "GRADE_PROFICIENCY" &&
        g.gradeLevel === selectedGrade &&
        (selectedSubject === "BOTH" ||
          (selectedSubject === "MATH" && g.name.toLowerCase().includes("math")) ||
          (selectedSubject === "ELA" &&
            (g.name.toLowerCase().includes("ela") || g.name.toLowerCase().includes("english"))))
    );
  }, [selectedGrade, selectedSubject, allGoals]);

  // ─── Exam goals filtered by exam type ───
  const matchingExamGoals = useMemo(() => {
    if (!selectedExamType || !allGoals.length) return [];
    return allGoals.filter(
      (g) =>
        g.category === "EXAM_PREP" &&
        g.examType?.startsWith(selectedExamType)
    );
  }, [selectedExamType, allGoals]);

  // ─── Navigation helpers ───
  const goToPhase = useCallback(
    (next: Phase) => {
      setPhaseHistory((prev) => [...prev, phase]);
      setPhase(next);
      setError(null);
    },
    [phase]
  );

  const goBack = useCallback(() => {
    if (phaseHistory.length > 0) {
      const prev = phaseHistory[phaseHistory.length - 1];
      setPhaseHistory((h) => h.slice(0, -1));
      setPhase(prev);
      setError(null);
    }
  }, [phaseHistory]);

  // ─── Fetch all goals on mount ───
  useEffect(() => {
    async function fetchGoals() {
      try {
        const res = await fetch("/api/goals/list");
        if (res.ok) {
          const data = await res.json();
          setAllGoals(data.goals || []);
        }
      } catch {
        // Silently fall back — user can still navigate
      } finally {
        setGoalsLoading(false);
      }
    }
    fetchGoals();
  }, []);

  // ─── Custom goal interpreter ───
  const interpretCustomGoal = useCallback(async () => {
    if (!customGoalText.trim() || customGoalText.trim().length < 3) return;
    setIsInterpreting(true);
    setError(null);
    try {
      const res = await fetch("/api/goals/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: customGoalText, studentId: STUDENT_ID }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to interpret goal");
      }
      const data: InterpretResult = await res.json();
      setInterpretResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsInterpreting(false);
    }
  }, [customGoalText, STUDENT_ID]);

  // ─── Build the learning plan ───
  const buildPlan = useCallback(async () => {
    if (!selectedGoalId) return;

    setIsBuilding(true);
    setBuildProgress(0);
    setBuildMessage("Analyzing your goal...");
    setError(null);
    goToPhase("building");

    // Simulate progress stages while waiting for API
    const stages = [
      { progress: 15, message: "Checking what you already know...", delay: 800 },
      { progress: 35, message: "Mapping the learning path...", delay: 1200 },
      { progress: 55, message: "Ordering concepts by prerequisites...", delay: 1000 },
      { progress: 70, message: "Estimating time for each concept...", delay: 800 },
      { progress: 85, message: "Generating your personalized roadmap...", delay: 1500 },
    ];

    let stageIndex = 0;
    const progressInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setBuildProgress(stages[stageIndex].progress);
        setBuildMessage(stages[stageIndex].message);
        stageIndex++;
      }
    }, stages[stageIndex]?.delay || 1000);

    try {
      const res = await fetch("/api/goals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: selectedGoalId,
          studentId: STUDENT_ID,
          weeklyHoursAvailable: weeklyHours,
          targetDate: targetDate || undefined,
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create plan");
      }

      const data: PlanResult = await res.json();
      setBuildProgress(100);
      setBuildMessage("Your learning plan is ready!");
      setPlanResult(data);

      // Brief pause to show 100% before transitioning
      setTimeout(() => {
        setPhase("complete");
      }, 1200);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Failed to build plan");
      setBuildProgress(0);
      // Go back to prior knowledge phase so user can retry
      setPhase("prior-knowledge");
      setIsBuilding(false);
    }
  }, [selectedGoalId, STUDENT_ID, weeklyHours, targetDate, goToPhase]);

  // ─── Progress indicator ───
  const phaseIndex = useMemo(() => {
    const phases: Phase[] = [
      "select-category",
      "select-goal",
      "timeline",
      "practice-time",
      "prior-knowledge",
    ];
    return phases.indexOf(phase);
  }, [phase]);

  const totalSteps = 5;

  // ─── Render Phases ───

  // ═══════════════════════════════════════════════
  // PHASE: select-category — Hero + 3 category cards
  // ═══════════════════════════════════════════════
  if (phase === "select-category") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
        <main className="max-w-2xl mx-auto px-4 py-12">
          <motion.div {...fadeUp}>
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-aauti-primary/10 flex items-center justify-center">
                <span className="text-6xl">🧭</span>
              </div>
              <h1 className="text-3xl font-bold text-aauti-text-primary mb-3">
                Where Do You Want to Go?
              </h1>
              <p className="text-lg text-aauti-text-secondary max-w-md mx-auto">
                Choose your learning destination and Cosmo will build a personalized roadmap to get you there.
              </p>
            </div>

            {/* Category Cards */}
            <motion.div
              className="space-y-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Grade Proficiency */}
              <motion.button
                variants={staggerItem}
                onClick={() => {
                  setSelectedCategory("GRADE_PROFICIENCY");
                  goToPhase("select-goal");
                }}
                className="w-full text-left bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-aauti-primary hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    📚
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-aauti-text-primary mb-1">
                      Grade Proficiency
                    </h3>
                    <p className="text-sm text-aauti-text-secondary mb-3">
                      Master all Common Core concepts for a specific grade and subject. Perfect for catching up, keeping pace, or getting ahead.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        K-8 Math
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                        K-8 ELA
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                        Standards-aligned
                      </span>
                    </div>
                  </div>
                  <span className="text-aauti-text-muted group-hover:text-aauti-primary transition-colors text-xl mt-1">
                    &rarr;
                  </span>
                </div>
              </motion.button>

              {/* Exam Prep */}
              <motion.button
                variants={staggerItem}
                onClick={() => {
                  setSelectedCategory("EXAM_PREP");
                  goToPhase("select-goal");
                }}
                className="w-full text-left bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-aauti-secondary hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    🎯
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-aauti-text-primary mb-1">
                      Exam Prep
                    </h3>
                    <p className="text-sm text-aauti-text-secondary mb-3">
                      Focused preparation for standardized tests. Covers exactly the concepts and skills tested on exam day.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-600">
                        SAT / ACT
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-600">
                        PSAT
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-600">
                        ISEE
                      </span>
                    </div>
                  </div>
                  <span className="text-aauti-text-muted group-hover:text-aauti-secondary transition-colors text-xl mt-1">
                    &rarr;
                  </span>
                </div>
              </motion.button>

              {/* Custom Goal */}
              <motion.button
                variants={staggerItem}
                onClick={() => {
                  setSelectedCategory("CUSTOM");
                  goToPhase("select-goal");
                }}
                className="w-full text-left bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-aauti-accent hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-aauti-text-primary mb-1">
                      Custom Goal
                    </h3>
                    <p className="text-sm text-aauti-text-secondary mb-3">
                      Describe what you want to learn in your own words and Cosmo will map it to the best path.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                        AI-interpreted
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                        Flexible
                      </span>
                    </div>
                  </div>
                  <span className="text-aauti-text-muted group-hover:text-aauti-accent transition-colors text-xl mt-1">
                    &rarr;
                  </span>
                </div>
              </motion.button>
            </motion.div>
          </motion.div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PHASE: select-goal — Grade/Exam/Custom selection
  // ═══════════════════════════════════════════════
  if (phase === "select-goal") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
        <GoalHeader
          phaseIndex={1}
          totalSteps={totalSteps}
          title={
            selectedCategory === "GRADE_PROFICIENCY"
              ? "Choose Grade & Subject"
              : selectedCategory === "EXAM_PREP"
                ? "Choose Your Exam"
                : "Describe Your Goal"
          }
          onBack={goBack}
        />

        <main className="max-w-2xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {/* ─── Grade Proficiency Selector ─── */}
            {selectedCategory === "GRADE_PROFICIENCY" && (
              <motion.div key="grade" {...fadeUp}>
                {/* Subject selector */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-aauti-text-primary mb-3">
                    Subject
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {SUBJECT_OPTIONS.map((subj) => (
                      <button
                        key={subj.value}
                        onClick={() => setSelectedSubject(subj.value)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedSubject === subj.value
                            ? "border-aauti-primary bg-aauti-primary/5 shadow-sm"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <span className="text-2xl block mb-1">{subj.emoji}</span>
                        <span
                          className={`text-sm font-medium ${
                            selectedSubject === subj.value
                              ? "text-aauti-primary"
                              : "text-aauti-text-primary"
                          }`}
                        >
                          {subj.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grade selector */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-aauti-text-primary mb-3">
                    Grade Level
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {GRADE_OPTIONS.map((grade) => (
                      <button
                        key={grade.value}
                        onClick={() => setSelectedGrade(grade.value)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedGrade === grade.value
                            ? "border-aauti-primary bg-aauti-primary/5 shadow-sm"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <span
                          className={`text-lg font-bold block ${
                            selectedGrade === grade.value
                              ? "text-aauti-primary"
                              : "text-aauti-text-primary"
                          }`}
                        >
                          {grade.short}
                        </span>
                        <span className="text-xs text-aauti-text-muted">
                          {grade.value === 0 ? "Kinder" : `Grade ${grade.value}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Matching goals preview */}
                {selectedGrade !== null && matchingGradeGoals.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-8"
                  >
                    <label className="block text-sm font-medium text-aauti-text-primary mb-3">
                      {matchingGradeGoals.length === 1
                        ? "Your Goal"
                        : `Select a Goal (${matchingGradeGoals.length} available)`}
                    </label>
                    <div className="space-y-2">
                      {matchingGradeGoals.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setSelectedGoalName(goal.name);
                          }}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedGoalId === goal.id
                              ? "border-aauti-primary bg-aauti-primary/5"
                              : "border-gray-100 bg-white hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-aauti-text-primary">
                                {goal.name}
                              </div>
                              <div className="text-sm text-aauti-text-secondary mt-0.5">
                                {goal.requiredNodeIds.length} concepts &middot; ~{Math.round(goal.estimatedHours)}h estimated
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedGoalId === goal.id
                                  ? "border-aauti-primary bg-aauti-primary"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedGoalId === goal.id && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {selectedGrade !== null && matchingGradeGoals.length === 0 && !goalsLoading && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-8">
                    <p className="text-sm text-amber-800">
                      No goals found for {GRADE_OPTIONS.find((g) => g.value === selectedGrade)?.label}{" "}
                      {selectedSubject === "MATH" ? "Math" : selectedSubject === "ELA" ? "ELA" : ""}. Try a different grade or subject.
                    </p>
                  </div>
                )}

                {/* Continue button */}
                <button
                  onClick={() => goToPhase("timeline")}
                  disabled={!selectedGoalId}
                  className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue &rarr;
                </button>
              </motion.div>
            )}

            {/* ─── Exam Prep Selector ─── */}
            {selectedCategory === "EXAM_PREP" && (
              <motion.div key="exam" {...fadeUp}>
                {/* Exam type cards */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-aauti-text-primary mb-3">
                    Select Exam
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {EXAM_OPTIONS.map((exam) => (
                      <button
                        key={exam.type}
                        onClick={() => {
                          setSelectedExamType(exam.type);
                          setSelectedExamGoalId(null);
                          setSelectedGoalId(null);
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedExamType === exam.type
                            ? "border-aauti-secondary bg-aauti-secondary/5 shadow-sm"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <span className="text-3xl block mb-2">{exam.emoji}</span>
                        <span
                          className={`text-base font-semibold block ${
                            selectedExamType === exam.type
                              ? "text-aauti-secondary"
                              : "text-aauti-text-primary"
                          }`}
                        >
                          {exam.name}
                        </span>
                        <span className="text-xs text-aauti-text-muted block mt-0.5">
                          {exam.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific exam goal selection */}
                {selectedExamType && matchingExamGoals.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-8"
                  >
                    <label className="block text-sm font-medium text-aauti-text-primary mb-3">
                      Choose Focus Area
                    </label>
                    <div className="space-y-2">
                      {matchingExamGoals.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => {
                            setSelectedExamGoalId(goal.id);
                            setSelectedGoalId(goal.id);
                            setSelectedGoalName(goal.name);
                          }}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedExamGoalId === goal.id
                              ? "border-aauti-secondary bg-aauti-secondary/5"
                              : "border-gray-100 bg-white hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-aauti-text-primary">
                                {goal.name}
                              </div>
                              <div className="text-sm text-aauti-text-secondary mt-0.5">
                                {goal.requiredNodeIds.length} concepts &middot; ~{Math.round(goal.estimatedHours)}h estimated
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedExamGoalId === goal.id
                                  ? "border-aauti-secondary bg-aauti-secondary"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedExamGoalId === goal.id && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {selectedExamType && matchingExamGoals.length === 0 && !goalsLoading && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-8">
                    <p className="text-sm text-amber-800">
                      No {selectedExamType} prep goals found yet. More exam prep content coming soon!
                    </p>
                  </div>
                )}

                <button
                  onClick={() => goToPhase("timeline")}
                  disabled={!selectedGoalId}
                  className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue &rarr;
                </button>
              </motion.div>
            )}

            {/* ─── Custom Goal Input ─── */}
            {selectedCategory === "CUSTOM" && (
              <motion.div key="custom" {...fadeUp}>
                <div className="mb-6">
                  <div className="bg-aauti-primary/5 rounded-2xl p-5 border border-aauti-primary/10 mb-6">
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">🐻</span>
                      <p className="text-aauti-text-primary text-sm leading-relaxed">
                        Tell me what you want to learn in your own words! For example:
                        <br />
                        <span className="italic text-aauti-text-secondary">
                          &ldquo;I want my kid to be ready for 5th grade math&rdquo;
                        </span>
                        <br />
                        <span className="italic text-aauti-text-secondary">
                          &ldquo;Prepare for the SAT math section&rdquo;
                        </span>
                        <br />
                        <span className="italic text-aauti-text-secondary">
                          &ldquo;Help with reading comprehension for a 3rd grader&rdquo;
                        </span>
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={customGoalText}
                    onChange={(e) => {
                      setCustomGoalText(e.target.value);
                      setInterpretResult(null);
                    }}
                    placeholder="Describe your learning goal..."
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base resize-none focus:ring-2 focus:ring-aauti-primary focus:border-aauti-primary transition-all"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-aauti-text-muted">
                      {customGoalText.length}/500
                    </span>
                    <button
                      onClick={interpretCustomGoal}
                      disabled={
                        isInterpreting || customGoalText.trim().length < 3
                      }
                      className="text-sm font-medium text-aauti-primary hover:text-aauti-primary/80 disabled:text-gray-400 transition-colors"
                    >
                      {isInterpreting ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                          Interpreting...
                        </span>
                      ) : (
                        "Interpret Goal"
                      )}
                    </button>
                  </div>
                </div>

                {/* Interpretation results */}
                {interpretResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <div className="bg-white rounded-xl border-2 border-aauti-primary/20 p-4 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-aauti-text-primary">
                          Best Match
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-aauti-success/10 text-aauti-success font-medium">
                          {Math.round(interpretResult.primaryMatch.confidence * 100)}% match
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedGoalId(interpretResult.primaryMatch.goalId);
                          setSelectedGoalName(interpretResult.primaryMatch.goalName);
                        }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedGoalId === interpretResult.primaryMatch.goalId
                            ? "border-aauti-primary bg-aauti-primary/5"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="font-medium text-aauti-text-primary">
                          {interpretResult.primaryMatch.goalName}
                        </div>
                        <div className="text-xs text-aauti-text-secondary mt-1">
                          {interpretResult.primaryMatch.reason}
                        </div>
                      </button>
                    </div>

                    {/* Alternative matches */}
                    {interpretResult.alternativeMatches.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-aauti-text-muted uppercase tracking-wide">
                          Also consider
                        </span>
                        {interpretResult.alternativeMatches.map((alt) => (
                          <button
                            key={alt.goalId}
                            onClick={() => {
                              setSelectedGoalId(alt.goalId);
                              setSelectedGoalName(alt.goalName);
                            }}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              selectedGoalId === alt.goalId
                                ? "border-aauti-primary bg-aauti-primary/5"
                                : "border-gray-100 bg-white hover:border-gray-200"
                            }`}
                          >
                            <div className="font-medium text-sm text-aauti-text-primary">
                              {alt.goalName}
                            </div>
                            <div className="text-xs text-aauti-text-secondary mt-0.5">
                              {alt.reason}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {error && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-6">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={() => goToPhase("timeline")}
                  disabled={!selectedGoalId}
                  className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue &rarr;
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PHASE: timeline — When do you want to finish?
  // ═══════════════════════════════════════════════
  if (phase === "timeline") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
        <GoalHeader
          phaseIndex={2}
          totalSteps={totalSteps}
          title="When Do You Want to Finish?"
          onBack={goBack}
        />

        <main className="max-w-2xl mx-auto px-4 py-8">
          <motion.div {...fadeUp}>
            {/* Selected goal badge */}
            <div className="bg-aauti-primary/5 rounded-xl px-4 py-3 border border-aauti-primary/10 mb-8 flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <div className="text-xs text-aauti-text-muted">Your Goal</div>
                <div className="font-medium text-aauti-text-primary text-sm">
                  {selectedGoalName}
                </div>
              </div>
            </div>

            {/* Timeline options */}
            <div className="space-y-3 mb-8">
              {TIMELINE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeline(option.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    timeline === option.value
                      ? "border-aauti-primary bg-aauti-primary/5 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{option.emoji}</span>
                    <div className="flex-1">
                      <div
                        className={`font-medium ${
                          timeline === option.value
                            ? "text-aauti-primary"
                            : "text-aauti-text-primary"
                        }`}
                      >
                        {option.label}
                      </div>
                      <div className="text-sm text-aauti-text-secondary">
                        {option.sublabel}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        timeline === option.value
                          ? "border-aauti-primary bg-aauti-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {timeline === option.value && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom date picker */}
            {timeline === "custom" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-8"
              >
                <label className="block text-sm font-medium text-aauti-text-primary mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0]}
                  max={new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-aauti-primary focus:border-aauti-primary transition-all"
                />
              </motion.div>
            )}

            <button
              onClick={() => goToPhase("practice-time")}
              disabled={timeline === "custom" && !customDate}
              className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue &rarr;
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PHASE: practice-time — Minutes per day slider
  // ═══════════════════════════════════════════════
  if (phase === "practice-time") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
        <GoalHeader
          phaseIndex={3}
          totalSteps={totalSteps}
          title="How Much Time Per Day?"
          onBack={goBack}
        />

        <main className="max-w-2xl mx-auto px-4 py-8">
          <motion.div {...fadeUp}>
            {/* Selected goal badge */}
            <div className="bg-aauti-primary/5 rounded-xl px-4 py-3 border border-aauti-primary/10 mb-8 flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <div className="text-xs text-aauti-text-muted">Your Goal</div>
                <div className="font-medium text-aauti-text-primary text-sm">
                  {selectedGoalName}
                </div>
              </div>
            </div>

            {/* Time display */}
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-aauti-primary mb-2">
                {minutesPerDay}
              </div>
              <div className="text-lg text-aauti-text-secondary">
                minutes per day
              </div>
              <div className="text-sm text-aauti-text-muted mt-1">
                {Math.round(weeklyHours * 10) / 10} hours per week
              </div>
            </div>

            {/* Slider */}
            <div className="mb-8 px-2">
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={minutesPerDay}
                onChange={(e) => setMinutesPerDay(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-aauti-primary"
                style={{
                  background: `linear-gradient(to right, #6C5CE7 0%, #6C5CE7 ${((minutesPerDay - 10) / 50) * 100}%, #e5e7eb ${((minutesPerDay - 10) / 50) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-aauti-text-muted">10 min</span>
                <span className="text-xs text-aauti-text-muted">60 min</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              {[10, 15, 20, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setMinutesPerDay(mins)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    minutesPerDay === mins
                      ? "bg-aauti-primary text-white"
                      : "bg-white border border-gray-200 text-aauti-text-primary hover:border-gray-300"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            {/* ETA estimate */}
            {estimatedWeeks !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 mb-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-aauti-success/10 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-aauti-text-secondary">
                      Estimated completion
                    </div>
                    <div className="text-lg font-bold text-aauti-text-primary">
                      {estimatedWeeks <= 1
                        ? "About 1 week"
                        : estimatedWeeks <= 4
                          ? `About ${estimatedWeeks} weeks`
                          : `About ${Math.round(estimatedWeeks / 4)} months`}
                    </div>
                    <div className="text-xs text-aauti-text-muted mt-0.5">
                      Based on {minutesPerDay} min/day &middot; Adjusts as you learn
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cosmo encouragement based on time choice */}
            <div className="bg-aauti-primary/5 rounded-2xl p-4 border border-aauti-primary/10 mb-8">
              <div className="flex gap-3">
                <span className="text-xl flex-shrink-0">🐻</span>
                <p className="text-sm text-aauti-text-primary leading-relaxed">
                  {minutesPerDay <= 15
                    ? "Even a little practice every day adds up! Consistency is more important than session length."
                    : minutesPerDay <= 25
                      ? "Great balance! 20 minutes is the sweet spot for focused learning without fatigue."
                      : minutesPerDay <= 40
                        ? "Ambitious! You'll make great progress with this practice schedule."
                        : "Power learner mode! Just remember to take breaks — quality matters as much as quantity."}
                </p>
              </div>
            </div>

            <button
              onClick={() => goToPhase("prior-knowledge")}
              className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors"
            >
              Continue &rarr;
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PHASE: prior-knowledge — Test me or self-report
  // ═══════════════════════════════════════════════
  if (phase === "prior-knowledge") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
        <GoalHeader
          phaseIndex={4}
          totalSteps={totalSteps}
          title="What Do You Already Know?"
          onBack={goBack}
        />

        <main className="max-w-2xl mx-auto px-4 py-8">
          <motion.div {...fadeUp}>
            {/* Summary card of selections so far */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-8">
              <h3 className="text-sm font-medium text-aauti-text-muted uppercase tracking-wide mb-3">
                Your Plan Summary
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-aauti-text-secondary">Goal</span>
                  <span className="text-sm font-medium text-aauti-text-primary">
                    {selectedGoalName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-aauti-text-secondary">Timeline</span>
                  <span className="text-sm font-medium text-aauti-text-primary">
                    {timeline === "asap"
                      ? "As soon as possible"
                      : timeline === "3months"
                        ? "3 months"
                        : timeline === "6months"
                          ? "6 months"
                          : customDate
                            ? new Date(customDate).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Custom date"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-aauti-text-secondary">
                    Practice
                  </span>
                  <span className="text-sm font-medium text-aauti-text-primary">
                    {minutesPerDay} min/day ({Math.round(weeklyHours * 10) / 10}h/week)
                  </span>
                </div>
                {estimatedWeeks !== null && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-aauti-text-secondary">
                      Est. Completion
                    </span>
                    <span className="text-sm font-bold text-aauti-success">
                      {estimatedWeeks <= 4
                        ? `~${estimatedWeeks} week${estimatedWeeks !== 1 ? "s" : ""}`
                        : `~${Math.round(estimatedWeeks / 4)} month${Math.round(estimatedWeeks / 4) !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Prior knowledge options */}
            <div className="mb-3">
              <p className="text-sm text-aauti-text-secondary mb-4">
                Help Cosmo personalize your plan by letting us know what you already know.
                This makes your roadmap more accurate and skips concepts you&apos;ve already mastered.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {/* Test Me option */}
              <button
                onClick={() => setPriorKnowledge("test-me")}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                  priorKnowledge === "test-me"
                    ? "border-aauti-primary bg-aauti-primary/5 shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                    🎯
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-semibold ${
                        priorKnowledge === "test-me"
                          ? "text-aauti-primary"
                          : "text-aauti-text-primary"
                      }`}
                    >
                      Test Me
                    </div>
                    <div className="text-sm text-aauti-text-secondary mt-1">
                      Take a quick 5-minute diagnostic. Cosmo will adapt the
                      questions to find exactly where your knowledge starts and
                      stops.
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        ~5 min
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        Most accurate
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Skip / Start Fresh option */}
              <button
                onClick={() => setPriorKnowledge("self-report")}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                  priorKnowledge === "self-report"
                    ? "border-aauti-primary bg-aauti-primary/5 shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0">
                    🚀
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-semibold ${
                        priorKnowledge === "self-report"
                          ? "text-aauti-primary"
                          : "text-aauti-text-primary"
                      }`}
                    >
                      Start From the Beginning
                    </div>
                    <div className="text-sm text-aauti-text-secondary mt-1">
                      Skip the diagnostic and start from the first concept. Cosmo
                      will still adapt as you learn — if something&apos;s too easy,
                      you&apos;ll breeze through it.
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                        Instant start
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                        Adapts as you go
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Build Plan button */}
            <button
              onClick={() => {
                if (priorKnowledge === "test-me") {
                  // Redirect to diagnostic with goalId context, then come back
                  router.push(
                    `/diagnostic?studentId=${STUDENT_ID}&goalId=${selectedGoalId}&returnTo=goals`
                  );
                } else {
                  buildPlan();
                }
              }}
              disabled={!priorKnowledge || isBuilding}
              className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {priorKnowledge === "test-me"
                ? "Start Diagnostic &rarr;"
                : isBuilding
                  ? "Building..."
                  : "Build My Plan! 🚀"}
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PHASE: building — Progress animation
  // ═══════════════════════════════════════════════
  if (phase === "building") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          {/* Animated compass */}
          <div className="w-28 h-28 mx-auto mb-8 relative">
            <div className="absolute inset-0 rounded-full bg-aauti-primary/10 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-aauti-primary/5 flex items-center justify-center">
              <span className="text-5xl animate-spin" style={{ animationDuration: "3s" }}>
                🧭
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-aauti-text-primary mb-2">
            Building Your Roadmap
          </h2>
          <p className="text-aauti-text-secondary mb-8">{buildMessage}</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <motion.div
              className="bg-aauti-primary h-3 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${buildProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-aauti-text-muted">{buildProgress}%</p>

          {error && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 mt-6">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  buildPlan();
                }}
                className="mt-2 text-sm font-medium text-aauti-primary hover:underline"
              >
                Try Again
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PHASE: complete — Plan created successfully
  // ═══════════════════════════════════════════════
  if (phase === "complete" && planResult) {
    const completionDate = new Date(planResult.projectedCompletionDate);
    const formattedDate = completionDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
        <main className="max-w-lg mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Celebration header */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-aauti-accent/20 flex items-center justify-center">
                <span className="text-5xl">🎉</span>
              </div>
              <h1 className="text-3xl font-bold text-aauti-text-primary mb-2">
                Your Plan is Ready!
              </h1>
              <p className="text-lg text-aauti-text-secondary">
                Cosmo mapped your personalized learning journey.
              </p>
            </div>

            {/* Plan stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-aauti-primary">
                  {planResult.conceptsRemaining}
                </p>
                <p className="text-xs text-aauti-text-secondary">Concepts to learn</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-aauti-success">
                  {planResult.conceptsAlreadyMastered}
                </p>
                <p className="text-xs text-aauti-text-secondary">Already mastered</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-aauti-text-primary">
                  ~{Math.round(planResult.totalEstimatedHours)}h
                </p>
                <p className="text-xs text-aauti-text-secondary">Total estimated</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-aauti-text-primary">
                  {planResult.weeklyMilestones.length}
                </p>
                <p className="text-xs text-aauti-text-secondary">Weekly milestones</p>
              </div>
            </div>

            {/* Projected completion */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-6 text-center">
              <p className="text-sm text-aauti-text-secondary mb-1">
                Projected Completion
              </p>
              <p className="text-2xl font-bold text-aauti-primary">{formattedDate}</p>
              <p className="text-xs text-aauti-text-muted mt-1">
                At {minutesPerDay} min/day &middot; Updates as you learn
              </p>
            </div>

            {/* Narrative */}
            {planResult.narrative && (
              <div className="bg-aauti-primary/5 rounded-2xl p-5 border border-aauti-primary/10 mb-6">
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">🐻</span>
                  <p className="text-sm text-aauti-text-primary leading-relaxed">
                    {planResult.narrative}
                  </p>
                </div>
              </div>
            )}

            {/* First 5 concepts preview */}
            {planResult.conceptSequence.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-aauti-text-primary mb-3">
                  Your Learning Path
                </h3>
                <div className="space-y-2">
                  {planResult.conceptSequence.slice(0, 5).map((code, i) => (
                    <div
                      key={code}
                      className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          i === 0
                            ? "bg-aauti-primary"
                            : "bg-gray-300"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="text-sm text-aauti-text-primary">{code}</span>
                    </div>
                  ))}
                  {planResult.conceptSequence.length > 5 && (
                    <div className="text-center text-sm text-aauti-text-muted pt-1">
                      +{planResult.conceptSequence.length - 5} more concepts
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="space-y-3">
              <a
                href={`/gps?studentId=${STUDENT_ID}&planId=${planResult.planId}`}
                className="block w-full py-4 text-center text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors"
              >
                View My GPS Dashboard 🧭
              </a>
              <a
                href={`/session?studentId=${STUDENT_ID}`}
                className="block w-full py-4 text-center text-lg font-semibold text-aauti-primary bg-white border-2 border-aauti-primary rounded-2xl hover:bg-aauti-primary/5 transition-colors"
              >
                Start Learning Now! 🚀
              </a>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Fallback
  return null;
}

// ─── Shared Header Component ───

function GoalHeader({
  phaseIndex,
  totalSteps,
  title,
  onBack,
}: {
  phaseIndex: number;
  totalSteps: number;
  title: string;
  onBack: () => void;
}) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-aauti-text-secondary hover:text-aauti-text-primary transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <span className="text-sm text-aauti-text-muted">
            Step {phaseIndex + 1} of {totalSteps}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
          <div
            className="bg-aauti-primary h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${((phaseIndex + 1) / totalSteps) * 100}%`,
            }}
          />
        </div>
        <h2 className="text-xl font-bold text-aauti-text-primary">{title}</h2>
      </div>
    </header>
  );
}
