"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import AvatarDisplay from "@/components/persona/AvatarDisplay";
import type { AvatarEmotionalState, AvatarDisplayHandle } from "@/components/persona/AvatarDisplay";
import type { PersonaId } from "@/lib/personas/persona-config";
import TeachingCard from "@/components/session/TeachingCard";
import SessionHeader from "@/components/session/SessionHeader";
import PracticeQuestion from "@/components/session/PracticeQuestion";
import MasteryCelebration from "@/components/session/MasteryCelebration";
import FluencyDrill from "@/components/session/FluencyDrill";
import type { FluencyAnswerResult } from "@/components/session/FluencyDrill";
import SessionStats, { MobileStatsRow } from "@/components/session/SessionStats";
import NexusScore from "@/components/gamification/NexusScore";
import LearnPanel from "@/components/session/LearnPanel";

// ─── Types ───

interface NodeInfo {
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
}

interface TeachingContent {
  emoji: string;
  hook: string;
  explanation: string;
  example: string;
  example2?: string;
  commonMistake?: string;
  commonMistakeWhy?: string;
}

interface PracticeQuestionData {
  questionText: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
}

interface MasteryInfo {
  level: string;
  probability: number;
  practiceCount: number;
  correctCount: number;
}

interface CelebrationContent {
  celebration: string;
  funFact: string;
  nextTeaser: string;
}

interface EmotionalCheckin {
  checkinMessage: string;
  options: string[];
  followUpResponses: Record<string, string>;
}

interface HintContent {
  hint: string;
  encouragement: string;
}

interface StepProgress {
  correct: number;
  total: number;
  required: number;
  outOf: number;
}

interface RemediationData {
  whatWentWrong: string;
  reExplanation: string;
  newExample: string;
}

type SessionPhase =
  | "idle"
  | "teaching"
  | "practice"
  | "feedback"
  | "celebrating"
  | "struggling"
  | "emotional_check"
  | "fluency_drill"
  | "summary";

// ─── Step labels ───
const STEP_LABELS = ["Learn", "Check", "Guided", "Practice", "Prove"];
const STEP_DESCRIPTIONS = [
  "Learning the concept",
  "Check Understanding",
  "Guided Practice",
  "Independent Practice",
  "Mastery Proof",
];

// ─── Voice Helper ───

async function speakText(text: string, personaId: string): Promise<void> {
  try {
    const res = await fetch("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, personaId }),
    });
    if (!res.ok) return;

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength === 0) return;

    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {
    // Voice is non-critical — silent fallback to text
  }
}

// ─── 5-Step Progress Bar Component ───

function StepProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-1 mb-4 max-w-2xl mx-auto px-4">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex-1">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i < step
                ? "bg-aauti-primary"
                : i === step - 1
                  ? "bg-aauti-primary/70"
                  : "bg-white/10"
            }`}
          />
          <p
            className={`text-[10px] mt-1 text-center transition-colors duration-300 ${
              i < step ? "text-aauti-primary" : "text-gray-600"
            }`}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───

export default function SessionPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    }>
      <SessionPage />
    </Suspense>
  );
}

function SessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const DEMO_STUDENT_ID = searchParams.get("studentId") || "demo-student-1";
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const subjectParam = searchParams.get("subject") || "MATH";
  const planIdParam = searchParams.get("planId") || undefined;
  const nodeCodeParam = searchParams.get("nodeCode") || undefined;

  // ─── Topic Search State ───
  const [topicInput, setTopicInput] = useState("");

  // ─── Core State ───
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [shareToast, setShareToast] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [node, setNode] = useState<NodeInfo | null>(null);
  const [teaching, setTeaching] = useState<TeachingContent | null>(null);
  const [question, setQuestion] = useState<PracticeQuestionData | null>(null);
  const [mastery, setMastery] = useState<MasteryInfo | null>(null);
  const [celebration, setCelebration] = useState<CelebrationContent | null>(null);
  const [hint, setHint] = useState<HintContent | null>(null);
  const [checkin, setCheckin] = useState<EmotionalCheckin | null>(null);
  const [checkinResponse, setCheckinResponse] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<PersonaId>("cosmo");
  const [studentName, setStudentName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);

  // ─── 5-Step Learning Loop State ───
  const [learningStep, setLearningStep] = useState(1);
  const [stepProgress, setStepProgress] = useState<StepProgress | null>(null);
  const [remediation, setRemediation] = useState<RemediationData | null>(null);

  // ─── Fluency Drill State ───
  const [fluencyConsecutive, setFluencyConsecutive] = useState(0);
  const [fluencyBenchmarkMs, setFluencyBenchmarkMs] = useState<number | null>(null);
  const [fluencyPersonalBest, setFluencyPersonalBest] = useState<number | null>(null);
  const [nexusScore, setNexusScore] = useState<number | null>(null);

  // ─── Plan/GPS Context State ───
  const [todaysPlan, setTodaysPlan] = useState<{
    planId: string;
    goalName: string;
    goalCategory: string;
    positionInPlan: number;
    totalInPlan: number;
    progress: number;
    isAheadOfSchedule: boolean;
    reason: string;
  } | null>(null);
  const [gpsNavigation, setGpsNavigation] = useState<{
    planId: string;
    goalName: string;
    progress: number;
    isAheadOfSchedule: boolean;
    redirectUrl: string;
  } | null>(null);
  const [hasActivePlans, setHasActivePlans] = useState(false);

  // ─── Teaching Stream State ───
  const [teachingStreamUrl, setTeachingStreamUrl] = useState<string | null>(null);
  const [teachingReady, setTeachingReady] = useState(false);
  const [teachingLoading, setTeachingLoading] = useState(false);

  // ─── Avatar + Voice State ───
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotionalState>("neutral");
  const [liveAvatarReady, setLiveAvatarReady] = useState(false);

  // ─── Gamification + Session Stats ───
  const [gamification, setGamification] = useState<{
    xpAwarded: number;
    newXP: number;
    newLevel: number;
    leveledUp: boolean;
    newTitle: string | null;
  } | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [conceptsMasteredThisSession, setConceptsMasteredThisSession] = useState(0);
  const [sessionXPEarned, setSessionXPEarned] = useState(0);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const gamProfileRef = useRef<{ totalMastered: number; badges: string[] } | null>(null);
  const prevMasteryRef = useRef(0);
  const avatarRef = useRef<AvatarDisplayHandle>(null);
  // ─── Response Time Tracking ───
  const questionStartTimeRef = useRef<number>(0);

  // ─── Voice + Avatar Helpers ───

  const triggerVoice = useCallback(
    async (text: string) => {
      setIsSpeaking(true);
      if (avatarRef.current?.isStreamReady()) {
        try {
          await avatarRef.current.speak(text);
          return;
        } catch {
          // Fall through to ElevenLabs
        }
      }
      await speakText(text, personaId);
      const duration = Math.min(Math.max(text.length * 40, 1500), 10000);
      setTimeout(() => setIsSpeaking(false), duration);
    },
    [personaId]
  );

  const handleTalkingChange = useCallback((isTalking: boolean) => {
    setIsSpeaking(isTalking);
  }, []);

  // Map session phase to avatar emotion
  useEffect(() => {
    switch (phase) {
      case "teaching":
        setAvatarEmotion("encouraging");
        break;
      case "celebrating":
        setAvatarEmotion("happy");
        break;
      case "struggling":
      case "emotional_check":
        setAvatarEmotion("encouraging");
        break;
      case "feedback":
        setAvatarEmotion(feedback?.type === "correct" ? "happy" : "encouraging");
        break;
      default:
        setAvatarEmotion("neutral");
        break;
    }
  }, [phase, feedback]);

  // ─── SSE connection for teaching content ───

  useEffect(() => {
    if (!teachingStreamUrl) return;
    setTeachingLoading(true);

    const es = new EventSource(teachingStreamUrl);

    es.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data);

        if (d.type === "started" || d.type === "progress") return;

        if (d.type === "done") {
          setTeaching({
            emoji: d.emoji ?? "📚",
            hook: d.hook ?? "Let's learn something new!",
            explanation: d.explanation ?? "",
            example: d.example ?? "",
            example2: d.example2 ?? "",
            commonMistake: d.commonMistake ?? "",
            commonMistakeWhy: d.commonMistakeWhy ?? "",
          });
          setTeachingLoading(false);
          setTeachingReady(true);
          es.close();

          if (d.hook) {
            triggerVoice(d.hook);
          }
        }

        if (d.type === "error") {
          console.warn("teach-stream error:", d.message);
        }
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) return;
      setTeachingLoading(false);
      es.close();
    };

    const timeout = setTimeout(() => {
      if (es.readyState !== EventSource.CLOSED) {
        es.close();
        setTeachingLoading(false);
      }
    }, 20000);

    return () => {
      clearTimeout(timeout);
      es.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachingStreamUrl]);

  // ─── API Calls ───

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setTeachingReady(false);
    setTeachingStreamUrl(null);
    setLearningStep(1);
    setStepProgress(null);
    setRemediation(null);
    setCorrectStreak(0);
    prevMasteryRef.current = 0;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: DEMO_STUDENT_ID,
          subject: subjectParam,
          ...(planIdParam ? { planId: planIdParam } : {}),
          ...(nodeCodeParam ? { nodeCode: nodeCodeParam } : {}),
          ...(topicInput.trim().length >= 2 && !nodeCodeParam ? { topic: topicInput.trim() } : {}),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSessionId(data.sessionId);
      setNode(data.node);
      setPersonaId(data.persona?.id ?? "cosmo");
      setStudentName(data.persona?.studentName ?? "Student");
      if (data.todaysPlan) setTodaysPlan(data.todaysPlan);
      setPhase("teaching");

      setTeachingStreamUrl(
        `/api/session/teach-stream?sessionId=${data.sessionId}`
      );

      if (!gamProfileRef.current) {
        fetch(`/api/student/${DEMO_STUDENT_ID}/gamification`)
          .then((r) => (r.ok ? r.json() : null))
          .then((gData) => {
            if (gData) {
              gamProfileRef.current = {
                totalMastered: (gData.masteryMap ?? []).filter(
                  (m: { level: string }) => m.level === "MASTERED"
                ).length,
                badges: (gData.badges ?? []).map(
                  (b: { badgeType: string }) => b.badgeType
                ),
              };
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Request timed out — please try again"
          : err instanceof Error
            ? err.message
            : "Failed to start";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Start Practice: Fetch first real question (Step 2) ───
  const startPractice = useCallback(async () => {
    if (!sessionId) return;
    setLearningStep(2);
    setStepProgress({ correct: 0, total: 0, required: 1, outOf: 1 });
    setIsLoading(true);
    setPhase("practice");
    setQuestion(null);
    setSelectedOption(null);
    setFeedback(null);
    setRemediation(null);
    setHint(null);

    try {
      const res = await fetch(
        `/api/session/next-question?sessionId=${sessionId}`,
        { signal: AbortSignal.timeout(25000) }
      );
      const data = await res.json();
      if (data.question) {
        setQuestion(data.question);
        questionStartTimeRef.current = Date.now();
        if (data.learningStep) setLearningStep(data.learningStep);
      } else {
        setError("Failed to load question — please try again");
      }
    } catch (err) {
      console.error("Failed to fetch first question:", err);
      setError("Failed to load question — please try again");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // ─── Submit Answer (5-step aware) ───
  const submitAnswer = useCallback(
    async (optionId: string) => {
      if (!sessionId || !question) return;
      setSelectedOption(optionId);
      const option = question.options.find((o) => o.id === optionId);
      if (!option) return;

      const correctOption = question.options.find((o) => o.isCorrect);

      setIsLoading(true);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const responseTimeMs = questionStartTimeRef.current > 0
          ? Date.now() - questionStartTimeRef.current
          : undefined;

        const res = await fetch("/api/session/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            selectedOptionId: optionId,
            isCorrect: option.isCorrect,
            // Context for remediation generation (Step 3 wrong answers)
            questionText: question.questionText,
            selectedAnswerText: option.text,
            correctAnswerText: correctOption?.text ?? "",
            explanation: question.explanation,
            // Response time tracking for mastery gating + fluency
            responseTimeMs,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setQuestionsAnswered((prev) => prev + 1);

        // Track mastery
        const prevProb = prevMasteryRef.current;
        prevMasteryRef.current = data.mastery?.probability ?? prevProb;
        setMastery(data.mastery);

        // Update 5-step tracking
        if (data.learningStep !== undefined) setLearningStep(data.learningStep);
        if (data.stepProgress) setStepProgress(data.stepProgress);
        if (data.remediation) setRemediation(data.remediation);
        else setRemediation(null);

        // Gamification
        if (data.gamification) {
          setGamification(data.gamification);
          setSessionXPEarned((prev) => prev + (data.gamification.xpAwarded ?? 0));
        }

        // Streak
        if (data.isCorrect || data.state === "CELEBRATING") {
          setCorrectStreak((prev) => prev + 1);
        } else {
          setCorrectStreak(0);
        }

        // Update Nexus Score if returned
        if (data.nexusScore?.nexusScore !== undefined) {
          setNexusScore(data.nexusScore.nexusScore);
        }

        // ═══ Handle response based on state ═══
        if (data.state === "FLUENCY_DRILL") {
          // Transition to fluency drill mode
          setFluencyConsecutive(0);
          if (data.nexusScore?.benchmarkMs) {
            setFluencyBenchmarkMs(data.nexusScore.benchmarkMs);
          }
          if (data.nexusScore?.personalBestMs) {
            setFluencyPersonalBest(data.nexusScore.personalBestMs);
          }
          setFeedback(data.feedback);
          setPhase("feedback");
          if (data.feedback?.message) {
            triggerVoice(data.feedback.message);
          }
          // After feedback, switch to fluency mode
          setTimeout(() => {
            setFeedback(null);
            setSelectedOption(null);
            setPhase("fluency_drill");
            // Fetch a fluency question
            setIsLoading(true);
            fetch(`/api/session/next-question?sessionId=${sessionId}`, {
              signal: AbortSignal.timeout(25000),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.question) {
                  setQuestion(d.question);
                  questionStartTimeRef.current = Date.now();
                }
                setIsLoading(false);
              })
              .catch(() => setIsLoading(false));
          }, 2500);
          return;
        }

        if (data.state === "CELEBRATING") {
          setConceptsMasteredThisSession((prev) => prev + 1);
          setCelebration(data.celebration);
          setFeedback(null);
          setRemediation(null);
          setPhase("celebrating");
          if (data.celebration?.celebration) {
            triggerVoice(data.celebration.celebration);
          }
        } else {
          setFeedback(data.feedback);
          setPhase("feedback");
          if (data.feedback?.message) {
            triggerVoice(data.feedback.message);
          }

          if (data.questionPrefetched) {
            // Determine delay: longer for remediation content
            const feedbackDelay = data.remediation ? 5000 : 1500;

            // Start fetching next question immediately (overlaps with feedback display)
            const questionPromise = fetch(
              `/api/session/next-question?sessionId=${sessionId}`,
              { signal: AbortSignal.timeout(25000) }
            )
              .then((r) => r.json())
              .then((d) => d.question)
              .catch(() => null);

            setTimeout(() => {
              setFeedback(null);
              setRemediation(null);
              setSelectedOption(null);
              setHint(null);
              setIsLoading(true);
              setPhase("practice");

              questionPromise.then((nextQ) => {
                setIsLoading(false);
                if (nextQ) {
                  setQuestion(nextQ);
                  questionStartTimeRef.current = Date.now();
                }
              });
            }, feedbackDelay);
          }
        }
      } catch (err) {
        const message =
          err instanceof Error && err.name === "AbortError"
            ? "Request timed out — please try again"
            : err instanceof Error
              ? err.message
              : "Failed to submit";
        setError(message);
        setSelectedOption(null);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, question, triggerVoice]
  );

  const requestHint = useCallback(async () => {
    if (!sessionId || !question) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/session/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionText: question.questionText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHint(data.hint);
      if (data.hint?.hint) {
        triggerVoice(data.hint.hint);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get hint");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, question, triggerVoice]);

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary(data.summary);
      if (data.gpsNavigation) setGpsNavigation(data.gpsNavigation);
      if (data.hasActivePlans) setHasActivePlans(true);
      setPhase("summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end session");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // ─── Derived values ───
  const masteryColors: Record<string, string> = {
    NOVICE: "bg-gray-500/20 text-gray-300",
    DEVELOPING: "bg-blue-500/20 text-blue-300",
    PROFICIENT: "bg-green-500/20 text-green-300",
    ADVANCED: "bg-purple-500/20 text-purple-300",
    MASTERED: "bg-yellow-500/20 text-yellow-300",
  };

  const pageVariants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };
  const celebrationVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, x: -30 },
  };
  const pageTransition = { duration: 0.3, ease: "easeOut" as const };

  const currentDomain = node?.domain ?? "OPERATIONS";

  // Only show hints for Steps 2-3 (guided), NOT for Steps 4-5 (independent/mastery)
  const showHintButton = learningStep <= 3;

  const showStats = ["teaching", "practice", "feedback", "struggling"].includes(phase);

  const statsProps = {
    mastery,
    correctStreak,
    conceptsMasteredThisSession,
    sessionXPEarned,
    previousMasteryProbability: prevMasteryRef.current,
    domain: currentDomain,
    totalMasteredAllTime: gamProfileRef.current?.totalMastered ?? 0,
    earnedBadgeIds: gamProfileRef.current?.badges ?? [],
    phase,
  };

  // ─── Render ───

  return (
    <div className={`transition-[padding] duration-300 ${showStats ? "lg:pr-[280px]" : ""}`}>
    <AnimatePresence mode="wait">
      {/* ─── Idle ─── */}
      {phase === "idle" && (
        <motion.div
          key="idle"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-[#0D1B2A] flex items-center justify-center px-4"
        >
          <div className="max-w-lg text-center">
            <div className="mx-auto mb-6 flex items-center justify-center">
              <AvatarDisplay
                ref={avatarRef}
                personaId={personaId}
                size="xl"
                emotionalState="neutral"
                enableLiveAvatar={true}
                onStreamReady={() => setLiveAvatarReady(true)}
                onTalkingChange={handleTalkingChange}
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Ready to Learn?
            </h1>
            <p className="text-gray-400 mb-6">
              Type a topic you want to learn, or just press Start and your AI
              tutor will pick the next best concept for you!
            </p>
            <div className="relative mb-4">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) startSession();
                }}
                placeholder="e.g. exponents, fractions, algebra..."
                className="w-full px-5 py-4 bg-slate-800/80 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-base"
              />
              {topicInput.length > 0 && (
                <button
                  onClick={() => setTopicInput("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={startSession}
              disabled={isLoading}
              className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading
                ? "Setting up..."
                : topicInput.trim().length >= 2
                  ? `Learn "${topicInput.trim()}" 🚀`
                  : "Start Learning! 🚀"}
            </button>
            {/* GPS navigation — show when student has active plans */}
            {planIdParam && (
              <a
                href={`/gps?studentId=${DEMO_STUDENT_ID}`}
                className="block w-full mt-3 py-3 text-center text-sm font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-xl hover:bg-teal-500/20 transition-colors"
              >
                🗺️ View your Learning GPS Dashboard
              </a>
            )}
            {!planIdParam && (
              <a
                href={`/goals?studentId=${DEMO_STUDENT_ID}`}
                className="block w-full mt-3 py-3 text-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                🎯 Set a Learning Goal
              </a>
            )}
            {error && (
              <p className="mt-4 text-sm text-aauti-danger">{error}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Teaching (Step 1: TEACH IT) ─── */}
      {phase === "teaching" && node && (
        <motion.div
          key="teaching"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-[#0D1B2A]"
        >
          <SessionHeader
            personaId={personaId}
            speaking={isSpeaking}
            avatarEmotion={avatarEmotion}
            node={node}
            mastery={mastery}
            domain={currentDomain}
            questionsAnswered={questionsAnswered}
            onEnd={endSession}
          />
          <div className="lg:hidden">
            <MobileStatsRow
              {...statsProps}
              isExpanded={statsExpanded}
              onToggle={() => setStatsExpanded((prev) => !prev)}
            />
          </div>
          <main className="max-w-2xl mx-auto px-4 py-8">
            {/* ─── Today's Plan Banner (GPS context) ─── */}
            {todaysPlan && (
              <div className="mb-4 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-xl p-3 border border-teal-500/20 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🗺️</span>
                    <div>
                      <p className="text-xs text-teal-400 font-semibold">
                        {todaysPlan.goalName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Concept {todaysPlan.positionInPlan} of {todaysPlan.totalInPlan} · {todaysPlan.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-teal-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(todaysPlan.progress, 3)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-teal-400 font-medium">{todaysPlan.progress}%</span>
                  </div>
                </div>
              </div>
            )}

            <TeachingCard
              content={teaching}
              isLoading={teachingLoading}
              lessonStep={1}
              totalSteps={5}
            />

            {teachingReady ? (
              <button
                onClick={startPractice}
                className="w-full py-4 text-lg font-semibold text-white bg-gradient-to-r from-aauti-primary to-purple-600 rounded-2xl hover:from-purple-600 hover:to-aauti-primary hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(108,92,231,0.5)] transition-all duration-200 mt-8 opacity-0 animate-fade-in-up shadow-lg"
                style={{ animationDelay: "1200ms" }}
              >
                I&apos;m Ready to Practice! 💪
              </button>
            ) : (
              <div className="mt-8 h-14" />
            )}
          </main>
        </motion.div>
      )}

      {/* ─── Practice / Feedback (Steps 2-5) ─── */}
      {(phase === "practice" || phase === "feedback") && (
        <motion.div
          key={`practice-${phase === "practice" && isLoading ? "loading" : question?.questionText?.slice(0, 20) ?? "empty"}`}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-[#0D1B2A]"
        >
          <SessionHeader
            personaId={personaId}
            speaking={isSpeaking}
            avatarEmotion={avatarEmotion}
            node={node}
            mastery={mastery}
            domain={currentDomain}
            questionsAnswered={questionsAnswered}
            onEnd={endSession}
          />
          <div className="lg:hidden">
            <MobileStatsRow
              {...statsProps}
              isExpanded={statsExpanded}
              onToggle={() => setStatsExpanded((prev) => !prev)}
            />
          </div>

          {/* 5-Step Progress Bar */}
          <div className="pt-4">
            <StepProgressBar step={learningStep} />
          </div>

          {/* Step Label + Counter */}
          <div className="text-center mb-2">
            <p className="text-sm font-medium text-gray-300">
              {STEP_DESCRIPTIONS[learningStep - 1] ?? "Practice"}
            </p>
            {/* Step 3: show X/3 counter */}
            {learningStep === 3 && stepProgress && (
              <p className="text-xs text-gray-500 mt-0.5">
                Question {Math.min(stepProgress.total + 1, 3)} of 3
                {stepProgress.correct > 0 && (
                  <span className="text-aauti-success ml-1">
                    ({stepProgress.correct} correct ✓)
                  </span>
                )}
              </p>
            )}
            {/* Step 4: show X/5 counter */}
            {learningStep === 4 && stepProgress && (
              <p className="text-xs text-gray-500 mt-0.5">
                Question {Math.min(stepProgress.total + 1, 5)} of 5
                {stepProgress.correct > 0 && (
                  <span className="text-aauti-success ml-1">
                    ({stepProgress.correct} correct ✓)
                  </span>
                )}
              </p>
            )}
            {/* Step 5: special label */}
            {learningStep === 5 && (
              <p className="text-xs text-amber-400 mt-0.5">
                Final Challenge — prove you&apos;ve mastered it! 🏆
              </p>
            )}
          </div>

          {/* Loading transition between questions */}
          {phase === "practice" && isLoading ? (
            <main className="max-w-2xl mx-auto px-4 py-8">
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-aauti-primary animate-teaching-dot" style={{ animationDelay: "0ms" }} />
                  <div className="w-3 h-3 rounded-full bg-aauti-primary animate-teaching-dot" style={{ animationDelay: "150ms" }} />
                  <div className="w-3 h-3 rounded-full bg-aauti-primary animate-teaching-dot" style={{ animationDelay: "300ms" }} />
                </div>
                <p className="text-gray-400 text-sm mt-4">
                  {learningStep === 2
                    ? "Let's check your understanding..."
                    : learningStep === 5
                      ? "Preparing your final challenge..."
                      : "Next question coming up..."}
                </p>
              </div>
            </main>
          ) : question ? (
            <>
              <PracticeQuestion
                question={question}
                phase={phase === "feedback" ? "feedback" : "practice"}
                feedback={feedback}
                selectedOption={selectedOption}
                isLoading={isLoading}
                hint={hint}
                domain={currentDomain}
                error={error}
                onSubmitAnswer={submitAnswer}
                onRequestHint={showHintButton ? requestHint : undefined}
                onClearError={() => { setError(null); setSelectedOption(null); }}
              />

              {/* ─── Remediation Card (Step 3 wrong answers) ─── */}
              {phase === "feedback" && remediation && (
                <div className="max-w-2xl mx-auto px-4 -mt-2 pb-8">
                  <div className="bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20 animate-fade-in-up">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">💡</span>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-400 mb-1">
                            What happened:
                          </p>
                          <p className="text-white/90 text-sm leading-relaxed">
                            {remediation.whatWentWrong}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-400 mb-1">
                            Let me explain it differently:
                          </p>
                          <p className="text-white/90 text-sm leading-relaxed">
                            {remediation.reExplanation}
                          </p>
                        </div>
                        <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/10">
                          <p className="text-sm font-semibold text-blue-300 mb-1">
                            New example:
                          </p>
                          <p className="text-white/80 text-sm leading-relaxed">
                            {remediation.newExample}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <main className="max-w-2xl mx-auto px-4 py-8">
              <p className="text-center text-gray-400">Loading question...</p>
            </main>
          )}
        </motion.div>
      )}

      {/* ─── Celebrating ─── */}
      {phase === "celebrating" && celebration && mastery && (
        <motion.div
          key="celebrating"
          variants={celebrationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <MasteryCelebration
            personaId={personaId}
            isSpeaking={isSpeaking}
            liveAvatarReady={liveAvatarReady}
            avatarRef={avatarRef}
            onTalkingChange={handleTalkingChange}
            mastery={mastery}
            celebration={celebration}
            gamification={gamification}
            onNextConcept={startSession}
            onEndSession={endSession}
          />
        </motion.div>
      )}

      {/* ─── Fluency Drill ─── */}
      {phase === "fluency_drill" && (
        <motion.div
          key="fluency-drill"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-[#0D1B2A]"
        >
          <SessionHeader
            personaId={personaId}
            speaking={isSpeaking}
            avatarEmotion="encouraging"
            node={node}
            mastery={mastery}
            domain={currentDomain}
            questionsAnswered={questionsAnswered}
            onEnd={endSession}
          />
          <div className="lg:hidden">
            <MobileStatsRow
              {...statsProps}
              isExpanded={statsExpanded}
              onToggle={() => setStatsExpanded((prev) => !prev)}
            />
          </div>
          <div className="pt-4">
            {isLoading ? (
              <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-teaching-dot" style={{ animationDelay: "0ms" }} />
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-teaching-dot" style={{ animationDelay: "150ms" }} />
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-teaching-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                  <p className="text-gray-400 text-sm mt-4">
                    Preparing fluency drill...
                  </p>
                </div>
              </main>
            ) : question ? (
              <FluencyDrill
                sessionId={sessionId!}
                question={question}
                benchmarkMs={fluencyBenchmarkMs}
                consecutiveCorrect={fluencyConsecutive}
                personalBestMs={fluencyPersonalBest}
                onAnswer={(result: FluencyAnswerResult) => {
                  setFluencyConsecutive(result.consecutiveCorrect);
                  if (result.personalBestMs !== null) {
                    setFluencyPersonalBest(result.personalBestMs);
                  }
                  if (result.nexusScore !== null) {
                    setNexusScore(result.nexusScore);
                  }
                  setQuestionsAnswered((prev) => prev + 1);
                  if (result.isCorrect) {
                    setCorrectStreak((prev) => prev + 1);
                  } else {
                    setCorrectStreak(0);
                  }
                }}
                onComplete={() => {
                  // Fluency mastery achieved — celebrate
                  setCelebration({
                    celebration: "You've achieved true fluency! Speed AND accuracy mastered!",
                    funFact: "Your brain now processes this automatically — like riding a bike!",
                    nextTeaser: "Ready for the next challenge?",
                  });
                  setPhase("celebrating");
                }}
                onRequestNextQuestion={() => {
                  setIsLoading(true);
                  fetch(`/api/session/next-question?sessionId=${sessionId}`, {
                    signal: AbortSignal.timeout(25000),
                  })
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.question) {
                        setQuestion(d.question);
                        questionStartTimeRef.current = Date.now();
                      }
                      setIsLoading(false);
                    })
                    .catch(() => setIsLoading(false));
                }}
              />
            ) : null}
          </div>
        </motion.div>
      )}

      {/* ─── Struggling ─── */}
      {phase === "struggling" && (
        <motion.div
          key="struggling"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-[#0D1B2A]"
        >
          <SessionHeader
            personaId={personaId}
            speaking={isSpeaking}
            avatarEmotion="encouraging"
            node={node}
            mastery={mastery}
            domain={currentDomain}
            questionsAnswered={questionsAnswered}
            onEnd={endSession}
          />
          <div className="lg:hidden">
            <MobileStatsRow
              {...statsProps}
              isExpanded={statsExpanded}
              onToggle={() => setStatsExpanded((prev) => !prev)}
            />
          </div>
          <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-aauti-primary/10 rounded-2xl p-6 border border-aauti-primary/15 mb-6">
              <div className="flex gap-3 mb-4">
                <AvatarDisplay
                  personaId={personaId}
                  speaking={isSpeaking}
                  emotionalState="encouraging"
                  size="sm"
                />
                <div>
                  <p className="font-semibold text-white">
                    Let&apos;s try a different approach!
                  </p>
                  <p className="text-gray-300 mt-1">
                    {feedback?.message ?? "This topic can be tricky. Let me help you."}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={startPractice}
                className="flex-1 py-3 text-white bg-aauti-primary rounded-xl font-semibold"
              >
                Try Again 💪
              </button>
              <button
                onClick={endSession}
                className="py-3 px-6 border border-white/10 rounded-xl text-gray-300"
              >
                Take a Break
              </button>
            </div>
          </main>
        </motion.div>
      )}

      {/* ─── Emotional Check ─── */}
      {phase === "emotional_check" && checkin && (
        <motion.div
          key="emotional_check"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-[#0D1B2A] flex items-center justify-center px-4"
        >
          <div className="max-w-lg">
            <div className="text-center mb-6 flex items-center justify-center">
              <AvatarDisplay
                ref={avatarRef}
                personaId={personaId}
                speaking={isSpeaking}
                emotionalState="encouraging"
                size="xl"
                enableLiveAvatar={liveAvatarReady}
                onTalkingChange={handleTalkingChange}
              />
            </div>
            <div className="bg-[#1A2744] rounded-2xl p-6 border border-white/10 mb-6">
              <p className="text-lg text-white leading-relaxed text-center">
                {checkinResponse ?? checkin.checkinMessage}
              </p>
            </div>
            {!checkinResponse ? (
              <div className="space-y-3">
                {checkin.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      const response =
                        checkin.followUpResponses[option] ?? "Let's keep going!";
                      setCheckinResponse(response);
                      triggerVoice(response);
                      setTimeout(() => {
                        setCheckin(null);
                        setCheckinResponse(null);
                        setPhase("practice");
                      }, 2500);
                    }}
                    className="w-full p-4 text-left text-white bg-[#1A2744] border-2 border-white/10 rounded-xl hover:border-aauti-primary transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </motion.div>
      )}

      {/* ─── Summary (Redesigned: Phases 1-6) ─── */}
      {phase === "summary" && summary && (
        <motion.div
          key="summary"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-[#0D1B2A]"
        >
          <main className="max-w-lg mx-auto px-4 py-12 text-center">
            {/* Avatar */}
            <div className="mx-auto mb-4 flex items-center justify-center">
              <AvatarDisplay
                ref={avatarRef}
                personaId={personaId}
                emotionalState="happy"
                size="xl"
                enableLiveAvatar={liveAvatarReady}
                onTalkingChange={handleTalkingChange}
              />
            </div>

            {/* Streak Callout */}
            {(() => {
              const s = summary as { streak?: { current: number; longest: number } };
              if (s.streak && s.streak.current >= 2) {
                return (
                  <div className="mb-4">
                    <p className="text-amber-400 font-bold text-lg">
                      🔥 {s.streak.current} sessions in a row! Keep it up, {studentName}!
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <h1 className="text-3xl font-bold text-white mb-2">
              Session Complete!
            </h1>
            <p className="text-gray-400 mb-6">
              Great work, {studentName}!
            </p>

            {(() => {
              const s = summary as {
                durationMinutes?: number;
                questionsAnswered?: number;
                correctAnswers?: number;
                accuracy?: number;
                hintsUsed?: number;
                sessionSubject?: string;
                currentNode?: { title?: string; subject?: string } | null;
                mathMastery?: Array<{
                  nodeCode: string; title: string; level: string; probability: number; domain: string; gradeLevel: string;
                }>;
                englishMastery?: Array<{
                  nodeCode: string; title: string; level: string; probability: number; domain: string; gradeLevel: string;
                }>;
                recentMastery?: Array<{
                  nodeCode: string; title: string; level: string; probability: number; subject?: string;
                }>;
                gradeProgress?: Array<{
                  subject: string; gradeLevel: string; label: string; mastered: number; total: number; percentage: number;
                }>;
                nextUpNodes?: Array<{
                  subject: string; nodeCode: string; title: string;
                }>;
                streak?: { current: number; longest: number };
              };

              const mathNodes = s.mathMastery ?? [];
              const engNodes = s.englishMastery ?? [];
              const hasMastery = mathNodes.length > 0 || engNodes.length > 0;
              const sessionSubject = s.sessionSubject ?? subjectParam;
              const sessionXP = sessionXPEarned;

              return (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-[#1A2744] rounded-xl p-4 border border-white/10">
                      <p className="text-2xl font-bold text-aauti-primary">
                        {s.questionsAnswered ?? 0}
                      </p>
                      <p className="text-xs text-gray-400">Questions</p>
                    </div>
                    <div className="bg-[#1A2744] rounded-xl p-4 border border-white/10">
                      <p className="text-2xl font-bold text-aauti-success">
                        {s.accuracy ?? 0}%
                      </p>
                      <p className="text-xs text-gray-400">Accuracy</p>
                    </div>
                    <div className="bg-[#1A2744] rounded-xl p-4 border border-white/10">
                      <p className="text-2xl font-bold text-aauti-accent">
                        {s.hintsUsed ?? 0}
                      </p>
                      <p className="text-xs text-gray-400">Hints</p>
                    </div>
                  </div>

                  {/* Nexus Score */}
                  {nexusScore !== null && nexusScore > 0 && (
                    <div className="bg-[#1A2744] rounded-2xl p-5 border border-white/10 mb-4">
                      <h3 className="font-semibold text-white mb-3 text-center">Nexus Score</h3>
                      <NexusScore score={nexusScore} size="sm" showBreakdown={false} />
                    </div>
                  )}

                  {/* Subject XP */}
                  {sessionXP > 0 && (
                    <div className="flex justify-center gap-3 mb-6">
                      {sessionSubject === "MATH" && (
                        <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
                          <span className="text-green-400 font-bold text-sm">+{sessionXP} XP</span>
                          <span className="text-green-400/70 text-xs">Math</span>
                        </div>
                      )}
                      {sessionSubject === "ENGLISH" && (
                        <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2">
                          <span className="text-purple-400 font-bold text-sm">+{sessionXP} XP</span>
                          <span className="text-purple-400/70 text-xs">English</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mastery Progress */}
                  {hasMastery ? (
                    <div className="bg-[#1A2744] rounded-2xl p-5 border border-white/10 mb-6 text-left">
                      <h3 className="font-semibold text-white mb-3">Mastery Progress</h3>
                      {engNodes.length > 0 && (
                        <div className="mb-4 last:mb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">📖</span>
                            <span className="text-sm font-semibold text-purple-400">English</span>
                          </div>
                          {engNodes.map((m) => (
                            <div key={m.nodeCode} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 ml-5">
                              <p className="text-sm font-medium text-white">{m.title}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${masteryColors[m.level] ?? ""}`}>
                                {m.level} ({m.probability}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {mathNodes.length > 0 && (
                        <div className="mb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">🔢</span>
                            <span className="text-sm font-semibold text-green-400">Math</span>
                          </div>
                          {mathNodes.map((m) => (
                            <div key={m.nodeCode} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 ml-5">
                              <p className="text-sm font-medium text-white">{m.title}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${masteryColors[m.level] ?? ""}`}>
                                {m.level} ({m.probability}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#1A2744] rounded-2xl p-5 border border-white/10 mb-6">
                      <p className="text-gray-400 text-sm">Keep going — you&apos;re building mastery! 💪</p>
                    </div>
                  )}

                  {/* Grade Progress */}
                  {s.gradeProgress && s.gradeProgress.length > 0 && (
                    <div className="bg-[#1A2744] rounded-2xl p-5 border border-white/10 mb-6 text-left">
                      <h3 className="font-semibold text-white mb-3">Your Progress</h3>
                      <div className="space-y-3">
                        {s.gradeProgress.map((gp) => {
                          const isEnglish = gp.subject === "ENGLISH";
                          const barColor = isEnglish ? "bg-purple-500" : "bg-green-500";
                          const barTrack = isEnglish ? "bg-purple-500/15" : "bg-green-500/15";
                          return (
                            <div key={`${gp.subject}-${gp.gradeLevel}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-300">{gp.label}</span>
                                <span className="text-xs text-gray-500">{gp.mastered} of {gp.total} topics mastered</span>
                              </div>
                              <div className={`h-2.5 rounded-full ${barTrack} overflow-hidden`}>
                                <div
                                  className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
                                  style={{ width: `${Math.max(gp.percentage, 2)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* GPS Plan Progress (when session was part of a plan) */}
                  {gpsNavigation && (
                    <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl p-5 border border-teal-500/20 mb-6 text-left">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🗺️</span>
                        <h3 className="font-semibold text-white">Learning GPS</h3>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{gpsNavigation.goalName}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-teal-500/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-400 rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(gpsNavigation.progress, 3)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-teal-400">{gpsNavigation.progress}%</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <span className={`text-xs font-medium ${gpsNavigation.isAheadOfSchedule ? "text-green-400" : "text-amber-400"}`}>
                          {gpsNavigation.isAheadOfSchedule ? "📈 Ahead of schedule" : "⏳ Keep pushing!"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* What's Next */}
                  {s.nextUpNodes && s.nextUpNodes.length > 0 && (
                    <div className="bg-[#1A2744] rounded-2xl p-5 border border-white/10 mb-6 text-left">
                      <h3 className="font-semibold text-white mb-3">What&apos;s Next</h3>
                      <div className="space-y-2">
                        {s.nextUpNodes.map((nu) => {
                          const isEnglish = nu.subject === "ENGLISH";
                          const allMastered = nu.nodeCode === "__ALL_MASTERED__";
                          return (
                            <button
                              key={nu.subject}
                              onClick={() => {
                                if (!allMastered) {
                                  router.push(
                                    `/session?studentId=${DEMO_STUDENT_ID}&subject=${nu.subject}&returnTo=${returnTo}`
                                  );
                                }
                              }}
                              disabled={allMastered}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                                allMastered
                                  ? "opacity-60 cursor-default"
                                  : "hover:bg-white/5 cursor-pointer active:bg-white/10"
                              }`}
                            >
                              <span className="text-lg">{isEnglish ? "📖" : "🔢"}</span>
                              <span className={`text-sm font-medium ${isEnglish ? "text-purple-400" : "text-green-400"}`}>
                                {isEnglish ? "English" : "Math"}
                              </span>
                              <span className="text-gray-500 text-sm">→</span>
                              <span className="text-sm text-white flex-1">
                                {allMastered ? "🎉 All caught up!" : nu.title}
                              </span>
                              {!allMastered && (
                                <span className="text-gray-500 text-xs">▶</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Share */}
                  <button
                    onClick={async () => {
                      const date = new Date().toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      });
                      const masteredList = [
                        ...engNodes.filter((m) => m.level === "MASTERED").map((m) => `- ${m.title} (English)`),
                        ...mathNodes.filter((m) => m.level === "MASTERED").map((m) => `- ${m.title} (Math)`),
                      ];
                      const progressLines = (s.gradeProgress ?? []).map(
                        (gp) => `- ${gp.label}: ${gp.mastered} of ${gp.total} topics mastered`
                      );
                      const nextUpLines = (s.nextUpNodes ?? [])
                        .filter((nu) => nu.nodeCode !== "__ALL_MASTERED__")
                        .map((nu) => `${nu.title} (${nu.subject === "ENGLISH" ? "English" : "Math"})`);

                      const shareText = [
                        `🎓 Nexus Learning Update — ${studentName}`,
                        "",
                        `Session: ${date}`,
                        `Accuracy: ${s.accuracy ?? 0}%`,
                        `Questions: ${s.questionsAnswered ?? 0}`,
                        "",
                        masteredList.length > 0 ? `✅ Mastered Today:\n${masteredList.join("\n")}` : "",
                        progressLines.length > 0 ? `\n📊 Overall Progress:\n${progressLines.join("\n")}` : "",
                        nextUpLines.length > 0 ? `\nNext up: ${nextUpLines.join(", ")}` : "",
                        "",
                        "Powered by Nexus Learning",
                      ].filter(Boolean).join("\n");

                      if (typeof navigator !== "undefined" && navigator.share) {
                        try {
                          await navigator.share({ text: shareText });
                        } catch {
                          await navigator.clipboard?.writeText(shareText);
                          setShareToast(true);
                          setTimeout(() => setShareToast(false), 2000);
                        }
                      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                        await navigator.clipboard.writeText(shareText);
                        setShareToast(true);
                        setTimeout(() => setShareToast(false), 2000);
                      }
                    }}
                    className="w-full py-3 mb-3 text-base font-semibold text-gray-300 bg-transparent border border-white/15 rounded-2xl hover:bg-white/5 hover:border-white/25 transition-colors"
                  >
                    Share with Parent 📤
                  </button>

                  {shareToast && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in-up">
                      Copied! ✓
                    </div>
                  )}
                </>
              );
            })()}

            {/* GPS Dashboard Button (when session was part of a plan) */}
            {gpsNavigation && (
              <a
                href={gpsNavigation.redirectUrl}
                className="block w-full py-4 text-center text-lg font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl hover:from-teal-600 hover:to-cyan-700 transition-all mb-3"
              >
                🗺️ View GPS Dashboard
              </a>
            )}
            {/* GPS link for students with active plans but session wasn't plan-linked */}
            {!gpsNavigation && hasActivePlans && (
              <a
                href={`/gps?studentId=${DEMO_STUDENT_ID}`}
                className="block w-full py-3 text-center text-base font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-2xl hover:bg-teal-500/20 transition-colors mb-3"
              >
                🗺️ View Learning GPS
              </a>
            )}
            <a
              href={returnTo}
              className={`block w-full py-4 text-center text-lg font-semibold rounded-2xl transition-colors ${
                gpsNavigation
                  ? "text-gray-300 bg-transparent border border-white/10 hover:bg-white/5"
                  : "text-white bg-aauti-primary hover:bg-aauti-primary/90"
              }`}
            >
              Back to Dashboard
            </a>
          </main>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ─── Desktop Stats Sidebar ─── */}
    <AnimatePresence>
      {showStats && (
        <motion.aside
          key="session-stats"
          initial={{ x: 280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 280, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
          className="hidden lg:flex fixed right-0 top-0 bottom-0 w-[280px] bg-[#0F1B2D]/95 backdrop-blur-sm border-l border-white/5 shadow-lg z-30 overflow-y-auto"
        >
          <SessionStats {...statsProps} />
        </motion.aside>
      )}
    </AnimatePresence>

    {/* ─── Learn More Panel (available during practice/feedback/struggling) ─── */}
    {sessionId && node && (
      <LearnPanel
        sessionId={sessionId}
        nodeTitle={node.title}
        personaId={personaId}
        isVisible={
          phase === "practice" ||
          phase === "feedback" ||
          phase === "struggling"
        }
      />
    )}
    </div>
  );
}
