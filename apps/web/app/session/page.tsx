"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AvatarDisplay from "@/components/persona/AvatarDisplay";
import type { AvatarEmotionalState, AvatarDisplayHandle } from "@/components/persona/AvatarDisplay";
import type { PersonaId } from "@/lib/personas/persona-config";

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
  explanation: string;
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
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white flex items-center justify-center">
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarEmotion, setAvatarEmotion] =
    useState<AvatarEmotionalState>("neutral");
  const [liveAvatarReady, setLiveAvatarReady] = useState(false);
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

  // ─── API Calls ───

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: DEMO_STUDENT_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSessionId(data.sessionId);
      setNode(data.node);
      setTeaching(data.teaching);
      setPersonaId(data.persona?.id ?? "cosmo");
      setStudentName(data.persona?.studentName ?? "Student");
      setPhase("teaching");

      // Trigger voice for teaching content
      if (data.teaching?.explanation) {
        triggerVoice(data.teaching.explanation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setIsLoading(false);
    }
  }, [triggerVoice]);

  const submitAnswer = useCallback(
    async (optionId: string) => {
      if (!sessionId || !question) return;
      setSelectedOption(optionId);
      const option = question.options.find((o) => o.id === optionId);
      if (!option) return;

      setIsLoading(true);
      try {
        const res = await fetch("/api/session/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            selectedOptionId: optionId,
            isCorrect: option.isCorrect,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setMastery(data.mastery);

        if (data.state === "CELEBRATING") {
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
          setTimeout(() => {
            if (data.nextQuestion) {
              setQuestion(data.nextQuestion);
              setSelectedOption(null);
              setHint(null);
              setPhase("practice");
            }
          }, 1500);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit");
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

  const startPractice = useCallback(() => {
    if (teaching) {
      setQuestion({
        questionText: teaching.checkQuestion,
        options: [
          { id: "A", text: "Yes", isCorrect: true },
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

  const masteryColors: Record<string, string> = {
    NOVICE: "bg-gray-200 text-gray-700",
    DEVELOPING: "bg-blue-100 text-blue-700",
    PROFICIENT: "bg-green-100 text-green-700",
    ADVANCED: "bg-purple-100 text-purple-700",
    MASTERED: "bg-yellow-100 text-yellow-700",
  };

  // ─── Idle ───
  if (phase === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white flex items-center justify-center px-4">
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
          <h1 className="text-3xl font-bold text-aauti-text-primary mb-3">
            Ready to Learn?
          </h1>
          <p className="text-aauti-text-secondary mb-8">
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
      </div>
    );
  }

  // ─── Teaching ───
  if (phase === "teaching" && teaching && node) {
    return (
      <div className="min-h-screen bg-aauti-bg-light">
        <SessionHeader
          personaId={personaId}
          speaking={isSpeaking}
          avatarEmotion={avatarEmotion}
          node={node}
          mastery={mastery}
          masteryColors={masteryColors}
          onEnd={endSession}
        />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-aauti-primary/5 rounded-2xl p-5 border border-aauti-primary/10 mb-6">
            <div className="flex gap-3 mb-3">
              <AvatarDisplay
                personaId={personaId}
                speaking={isSpeaking}
                emotionalState="encouraging"
                size="sm"
              />
              <div>
                <p className="font-semibold text-aauti-text-primary mb-1">
                  Let&apos;s learn: {node.title}
                </p>
              </div>
            </div>
            <div className="text-aauti-text-primary leading-relaxed whitespace-pre-line">
              {teaching.explanation}
            </div>
          </div>

          <button
            onClick={startPractice}
            className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors"
          >
            I&apos;m Ready to Practice! 💪
          </button>
        </main>
      </div>
    );
  }

  // ─── Practice / Feedback ───
  if ((phase === "practice" || phase === "feedback") && question) {
    return (
      <div className="min-h-screen bg-aauti-bg-light">
        <SessionHeader
          personaId={personaId}
          speaking={isSpeaking}
          avatarEmotion={avatarEmotion}
          node={node}
          mastery={mastery}
          masteryColors={masteryColors}
          onEnd={endSession}
        />
        <main className="max-w-2xl mx-auto px-4 py-8">
          {phase === "feedback" && feedback && (
            <div
              className={`mb-6 p-4 rounded-2xl text-center font-medium ${
                feedback.type === "correct"
                  ? "bg-aauti-success/10 text-aauti-success border border-aauti-success/20"
                  : "bg-aauti-warning/10 text-aauti-warning border border-aauti-warning/20"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <p className="text-xl text-aauti-text-primary leading-relaxed">
              {question.questionText}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {question.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const showResult = phase === "feedback";

              let style =
                "bg-white border-gray-200 hover:border-aauti-primary";
              if (isSelected && !showResult) {
                style = "bg-aauti-primary/10 border-aauti-primary";
              } else if (showResult && isSelected && option.isCorrect) {
                style = "bg-aauti-success/10 border-aauti-success";
              } else if (showResult && isSelected && !option.isCorrect) {
                style = "bg-aauti-danger/10 border-aauti-danger";
              } else if (showResult && option.isCorrect) {
                style = "bg-aauti-success/5 border-aauti-success/50";
              }

              return (
                <button
                  key={option.id}
                  onClick={() =>
                    phase === "practice" &&
                    !isLoading &&
                    submitAnswer(option.id)
                  }
                  disabled={phase === "feedback" || isLoading}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${style} disabled:cursor-default`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold">
                      {option.id}
                    </span>
                    <span className="text-aauti-text-primary">
                      {option.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hint */}
          {phase === "practice" && (
            <div className="text-center">
              {hint ? (
                <div className="bg-aauti-accent/10 border border-aauti-accent/30 rounded-xl p-4 text-sm">
                  <p className="font-semibold mb-1">💡 Hint:</p>
                  <p className="text-aauti-text-primary">{hint.hint}</p>
                  <p className="text-aauti-text-secondary mt-2 italic">
                    {hint.encouragement}
                  </p>
                </div>
              ) : (
                <button
                  onClick={requestHint}
                  disabled={isLoading}
                  className="text-sm text-aauti-primary hover:underline"
                >
                  💡 Need a hint?
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ─── Celebrating ───
  if (phase === "celebrating" && celebration) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
        <main className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <AvatarDisplay
              ref={avatarRef}
              personaId={personaId}
              speaking={isSpeaking}
              emotionalState="happy"
              size="xl"
              enableLiveAvatar={liveAvatarReady}
              onTalkingChange={handleTalkingChange}
            />
          </div>
          <h1 className="text-3xl font-bold text-aauti-text-primary mb-4">
            Concept Mastered!
          </h1>

          {mastery && (
            <div className="inline-block mb-6">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${masteryColors[mastery.level] ?? ""}`}
              >
                {mastery.level} — {mastery.probability}%
              </span>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6 text-left">
            <p className="text-aauti-text-primary leading-relaxed mb-4">
              {celebration.celebration}
            </p>
            <div className="bg-aauti-primary/5 rounded-xl p-3 mb-4">
              <p className="text-sm text-aauti-text-secondary">
                <span className="font-semibold">Fun fact:</span>{" "}
                {celebration.funFact}
              </p>
            </div>
            <p className="text-aauti-text-primary font-medium">
              {celebration.nextTeaser}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={startSession}
              className="flex-1 py-3 text-white bg-aauti-primary rounded-xl hover:bg-aauti-primary/90 font-semibold"
            >
              Next Concept →
            </button>
            <button
              onClick={endSession}
              className="py-3 px-6 border border-gray-200 rounded-xl text-aauti-text-secondary hover:bg-gray-50"
            >
              Done for now
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Struggling ───
  if (phase === "struggling") {
    return (
      <div className="min-h-screen bg-aauti-bg-light">
        <SessionHeader
          personaId={personaId}
          speaking={isSpeaking}
          avatarEmotion="encouraging"
          node={node}
          mastery={mastery}
          masteryColors={masteryColors}
          onEnd={endSession}
        />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-aauti-primary/5 rounded-2xl p-6 border border-aauti-primary/10 mb-6">
            <div className="flex gap-3 mb-4">
              <AvatarDisplay
                personaId={personaId}
                speaking={isSpeaking}
                emotionalState="encouraging"
                size="sm"
              />
              <div>
                <p className="font-semibold text-aauti-text-primary">
                  Let&apos;s try a different approach!
                </p>
                <p className="text-aauti-text-secondary mt-1">
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
              className="py-3 px-6 border border-gray-200 rounded-xl text-aauti-text-secondary"
            >
              Take a Break
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Emotional Check ───
  if (phase === "emotional_check" && checkin) {
    return (
      <div className="min-h-screen bg-aauti-bg-light flex items-center justify-center px-4">
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
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <p className="text-lg text-aauti-text-primary leading-relaxed text-center">
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
                  className="w-full p-4 text-left bg-white border-2 border-gray-200 rounded-xl hover:border-aauti-primary transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ─── Summary ───
  if (phase === "summary" && summary) {
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
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
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
          <h1 className="text-3xl font-bold text-aauti-text-primary mb-2">
            Session Complete!
          </h1>
          <p className="text-aauti-text-secondary mb-8">
            Great work, {studentName}!
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-aauti-primary">
                {s.questionsAnswered ?? 0}
              </p>
              <p className="text-xs text-aauti-text-secondary">Questions</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-aauti-success">
                {s.accuracy ?? 0}%
              </p>
              <p className="text-xs text-aauti-text-secondary">Accuracy</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-aauti-accent">
                {s.hintsUsed ?? 0}
              </p>
              <p className="text-xs text-aauti-text-secondary">Hints</p>
            </div>
          </div>

          {s.recentMastery && s.recentMastery.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-6 text-left">
              <h3 className="font-semibold text-aauti-text-primary mb-3">
                Mastery Progress
              </h3>
              {s.recentMastery.map((m) => (
                <div
                  key={m.nodeCode}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-aauti-text-primary">
                      {m.title}
                    </p>
                    <p className="text-xs text-aauti-text-muted">
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

          <a
            href="/dashboard"
            className="block w-full py-4 text-center text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90"
          >
            Back to Dashboard
          </a>
        </main>
      </div>
    );
  }

  return null;
}

// ─── Shared Components ───

function SessionHeader({
  personaId,
  speaking,
  avatarEmotion,
  node,
  mastery,
  masteryColors,
  onEnd,
}: {
  personaId: PersonaId;
  speaking: boolean;
  avatarEmotion: AvatarEmotionalState;
  node: NodeInfo | null;
  mastery: MasteryInfo | null;
  masteryColors: Record<string, string>;
  onEnd: () => void;
}) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarDisplay
            personaId={personaId}
            speaking={speaking}
            emotionalState={avatarEmotion}
            size="sm"
          />
          <div>
            <span className="font-semibold text-aauti-text-primary text-sm">
              {node?.title ?? "Learning Session"}
            </span>
            {mastery && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${masteryColors[mastery.level] ?? ""}`}
              >
                {mastery.level} {mastery.probability}%
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onEnd}
          className="text-sm text-aauti-text-secondary hover:text-aauti-text-primary"
        >
          End Session
        </button>
      </div>
    </header>
  );
}
