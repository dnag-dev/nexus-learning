"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import AvatarDisplay from "@/components/persona/AvatarDisplay";
import type { AvatarEmotionalState, AvatarDisplayHandle } from "@/components/persona/AvatarDisplay";
import type { PersonaId } from "@/lib/personas/persona-config";
import TeachingCard from "@/components/session/TeachingCard";
import SessionHeader from "@/components/session/SessionHeader";
import PracticeQuestion from "@/components/session/PracticeQuestion";
import MasteryCelebration from "@/components/session/MasteryCelebration";
import SessionStats, { MobileStatsRow } from "@/components/session/SessionStats";

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
  checkQuestion: string;
  checkAnswer: string;
}

interface PracticeQuestion {
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

type SessionPhase =
  | "idle"
  | "teaching"
  | "practice"
  | "feedback"
  | "celebrating"
  | "struggling"
  | "emotional_check"
  | "summary";

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
  const DEMO_STUDENT_ID = searchParams.get("studentId") || "demo-student-1";
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [node, setNode] = useState<NodeInfo | null>(null);
  const [teaching, setTeaching] = useState<TeachingContent | null>(null);
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [mastery, setMastery] = useState<MasteryInfo | null>(null);
  const [celebration, setCelebration] = useState<CelebrationContent | null>(
    null
  );
  const [hint, setHint] = useState<HintContent | null>(null);
  const [checkin, setCheckin] = useState<EmotionalCheckin | null>(null);
  const [checkinResponse, setCheckinResponse] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: string;
  } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<PersonaId>("cosmo");
  const [studentName, setStudentName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [isComprehensionCheck, setIsComprehensionCheck] = useState(false);
  const [teachingStreamUrl, setTeachingStreamUrl] = useState<string | null>(null);
  const [teachingReady, setTeachingReady] = useState(false);
  const [teachingLoading, setTeachingLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarEmotion, setAvatarEmotion] =
    useState<AvatarEmotionalState>("neutral");
  const [liveAvatarReady, setLiveAvatarReady] = useState(false);
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

  // ─── Voice + Avatar Helpers ───

  const triggerVoice = useCallback(
    async (text: string) => {
      setIsSpeaking(true);

      // If HeyGen live avatar is ready, use it (avatar speaks with lip-sync)
      if (avatarRef.current?.isStreamReady()) {
        try {
          await avatarRef.current.speak(text);
          // Avatar events will control talking state via onTalkingChange
          return;
        } catch {
          // Fall through to ElevenLabs if avatar speak fails
        }
      }

      // Fallback: ElevenLabs TTS
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
        setAvatarEmotion(
          feedback?.type === "correct" ? "happy" : "encouraging"
        );
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

        if (d.type === "started" || d.type === "progress") {
          // Connection alive — teachingLoading remains true
          return;
        }

        if (d.type === "done") {
          setTeaching({
            emoji: d.emoji ?? "📚",
            hook: d.hook ?? "Let's learn something new!",
            explanation: d.explanation ?? "",
            example: d.example ?? "",
            checkQuestion: d.checkQuestion ?? "Ready to practice?",
            checkAnswer: d.checkAnswer ?? "Yes!",
          });
          setTeachingLoading(false);
          setTeachingReady(true);
          es.close();

          // Trigger voice with the hook (short, punchy — ideal for TTS)
          if (d.hook) {
            triggerVoice(d.hook);
          }
        }

        if (d.type === "error") {
          console.warn("teach-stream error:", d.message);
          // Server will send a fallback "done" event next
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

    // 20s safety timeout (response is faster now with shorter prompt)
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

    // Reset session-local counters on very first start
    setCorrectStreak(0);
    prevMasteryRef.current = 0;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: DEMO_STUDENT_ID }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSessionId(data.sessionId);
      setNode(data.node);
      setPersonaId(data.persona?.id ?? "cosmo");
      setStudentName(data.persona?.studentName ?? "Student");
      setPhase("teaching");

      // Teaching content streams via SSE — triggers the useEffect for TeachingCard
      setTeachingStreamUrl(
        `/api/session/teach-stream?sessionId=${data.sessionId}`
      );

      // Non-blocking: fetch gamification profile for milestone data
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
          .catch(() => {}); // Non-critical
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

  const submitAnswer = useCallback(
    async (optionId: string) => {
      if (!sessionId || !question) return;
      setSelectedOption(optionId);
      const option = question.options.find((o) => o.id === optionId);
      if (!option) return;

      setIsLoading(true);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const res = await fetch("/api/session/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            selectedOptionId: optionId,
            isCorrect: option.isCorrect,
            isComprehensionCheck,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Reset comprehension check flag after submission
        setIsComprehensionCheck(false);
        setQuestionsAnswered((prev) => prev + 1);

        // Track previous mastery for animation delta
        const prevProb = prevMasteryRef.current;
        prevMasteryRef.current = data.mastery?.probability ?? prevProb;

        setMastery(data.mastery);

        // Capture gamification data (XP, level, badges)
        if (data.gamification) {
          setGamification(data.gamification);
          setSessionXPEarned((prev) => prev + (data.gamification.xpAwarded ?? 0));
        }

        // Update streak: increment on correct, reset on incorrect
        if (data.feedback?.type === "correct" || data.state === "CELEBRATING") {
          setCorrectStreak((prev) => prev + 1);
        } else {
          setCorrectStreak(0);
        }

        if (data.state === "CELEBRATING") {
          setConceptsMasteredThisSession((prev) => prev + 1);
          setCelebration(data.celebration);
          setFeedback(null);
          setPhase("celebrating");
          if (data.celebration?.celebration) {
            triggerVoice(data.celebration.celebration);
          }
        } else if (data.state === "STRUGGLING") {
          setFeedback(data.feedback);
          setPhase("struggling");
          if (data.feedback?.message) {
            triggerVoice(data.feedback.message);
          }
        } else {
          setFeedback(data.feedback);
          setPhase("feedback");
          if (data.feedback?.message) {
            triggerVoice(data.feedback.message);
          }

          if (data.questionPrefetched) {
            // New flow: question is being generated in background.
            // Start fetching immediately AND show feedback for 1500ms.
            // After feedback, show loading transition until question is ready.
            const questionPromise = fetch(
              `/api/session/next-question?sessionId=${sessionId}`,
              { signal: AbortSignal.timeout(25000) }
            )
              .then((r) => r.json())
              .then((d) => d.question)
              .catch(() => null);

            // After 1500ms feedback, transition to loading state
            setTimeout(() => {
              setFeedback(null);
              setSelectedOption(null);
              setHint(null);
              setIsLoading(true); // Show loading spinner
              setPhase("practice"); // Move to practice (shows loading UI)

              // Now await the question (may already be ready or still generating)
              questionPromise.then((nextQ) => {
                setIsLoading(false);
                if (nextQ) {
                  setQuestion(nextQ);
                }
              });
            }, 1500);
          } else if (data.nextQuestion) {
            // Legacy flow: question included in response
            setTimeout(() => {
              setQuestion(data.nextQuestion);
              setSelectedOption(null);
              setHint(null);
              setPhase("practice");
            }, 1500);
          } else {
            setTimeout(() => {
              setSelectedOption(null);
              setPhase("practice");
            }, 1500);
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
    [sessionId, question, triggerVoice, isComprehensionCheck]
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

  const startPractice = useCallback(() => {
    if (teaching) {
      setIsComprehensionCheck(true);
      setQuestion({
        questionText: teaching.checkQuestion,
        options: [
          { id: "A", text: "Yes!", isCorrect: true },
          { id: "B", text: "Not sure yet", isCorrect: false },
          { id: "C", text: "Can you explain again?", isCorrect: false },
          { id: "D", text: teaching.checkAnswer, isCorrect: true },
        ],
        correctAnswer: "A",
        explanation: teaching.checkAnswer,
      });
      setPhase("practice");
    }
  }, [teaching]);

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
      setPhase("summary");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to end session"
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Mastery badge styles (used in summary screen — dark theme)
  const masteryColors: Record<string, string> = {
    NOVICE: "bg-gray-500/20 text-gray-300",
    DEVELOPING: "bg-blue-500/20 text-blue-300",
    PROFICIENT: "bg-green-500/20 text-green-300",
    ADVANCED: "bg-purple-500/20 text-purple-300",
    MASTERED: "bg-yellow-500/20 text-yellow-300",
  };

  // Framer Motion transition variants
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

  // ─── Sidebar visibility ───
  const showStats = ["teaching", "practice", "feedback", "struggling"].includes(phase);

  // Props shared across SessionStats and MobileStatsRow
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

  // ─── Render all phases inside AnimatePresence ───

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
            <p className="text-gray-400 mb-8">
              Start a learning session and your AI tutor will guide you through
              new concepts, practice problems, and celebrations!
            </p>
            <button
              onClick={startSession}
              disabled={isLoading}
              className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Setting up..." : "Start Learning! 🚀"}
            </button>
            {error && (
              <p className="mt-4 text-sm text-aauti-danger">{error}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Teaching (Instagram-story style) ─── */}
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
            <TeachingCard
              content={
                teaching
                  ? {
                      emoji: teaching.emoji,
                      hook: teaching.hook,
                      explanation: teaching.explanation,
                      example: teaching.example,
                    }
                  : null
              }
              isLoading={teachingLoading}
              lessonStep={1}
              totalSteps={3}
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

      {/* ─── Practice / Feedback ─── */}
      {(phase === "practice" || phase === "feedback") && question && (
        <motion.div
          key={`practice-${phase === "practice" && isLoading ? "loading" : question.questionText.slice(0, 20)}`}
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
                  Next question coming up...
                </p>
              </div>
            </main>
          ) : (
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
              onRequestHint={requestHint}
              onClearError={() => { setError(null); setSelectedOption(null); }}
            />
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
                    {feedback?.message ??
                      "This topic can be tricky. Let me help you."}
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
                        checkin.followUpResponses[option] ??
                        "Let's keep going!";
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

      {/* ─── Summary ─── */}
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
            <div className="mx-auto mb-6 flex items-center justify-center">
              <AvatarDisplay
                ref={avatarRef}
                personaId={personaId}
                emotionalState="happy"
                size="xl"
                enableLiveAvatar={liveAvatarReady}
                onTalkingChange={handleTalkingChange}
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Session Complete!
            </h1>
            <p className="text-gray-400 mb-8">
              Great work, {studentName}!
            </p>

            {(() => {
              const s = summary as {
                durationMinutes?: number;
                questionsAnswered?: number;
                correctAnswers?: number;
                accuracy?: number;
                hintsUsed?: number;
                currentNode?: { title?: string } | null;
                recentMastery?: {
                  nodeCode: string;
                  title: string;
                  level: string;
                  probability: number;
                }[];
              };
              return (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
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

                  {s.recentMastery && s.recentMastery.length > 0 && (
                    <div className="bg-[#1A2744] rounded-2xl p-5 border border-white/10 mb-6 text-left">
                      <h3 className="font-semibold text-white mb-3">
                        Mastery Progress
                      </h3>
                      {s.recentMastery.map((m) => (
                        <div
                          key={m.nodeCode}
                          className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">
                              {m.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {m.nodeCode}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${masteryColors[m.level] ?? ""}`}
                          >
                            {m.level} ({m.probability}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            <a
              href="/dashboard"
              className="block w-full py-4 text-center text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90"
            >
              Back to Dashboard
            </a>
          </main>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ─── Desktop Stats Sidebar (fixed, outside AnimatePresence) ─── */}
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
    </div>
  );
}
