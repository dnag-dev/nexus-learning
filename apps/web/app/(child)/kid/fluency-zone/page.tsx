"use client";

/**
 * Fluency Zone Page — Phase 13
 *
 * Student-initiated speed practice mode.
 * 3 screens: Topic Picker → Game → Results
 *
 * Entry: /kid/fluency-zone?studentId=...
 */

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FluencyZonePicker from "@/components/kid/fluency-zone/FluencyZonePicker";
import FluencyZoneGame from "@/components/kid/fluency-zone/FluencyZoneGame";
import FluencyZoneResults from "@/components/kid/fluency-zone/FluencyZoneResults";

type Screen = "picker" | "game" | "results";

interface GameSession {
  sessionId: string;
  nodeId: string;
  nodeName: string;
  subject: string;
  timeLimitSeconds: number;
  personalBest: { questionsPerMin: number; correctCount: number } | null;
}

interface GameResults {
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  questionsPerMin: number;
  averageTimeMs: number;
  isPersonalBest: boolean;
  previousBest: number | null;
  nodeName: string;
  timeLimitSeconds: number;
}

export default function FluencyZonePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get("studentId") || "";

  const [screen, setScreen] = useState<Screen>("picker");
  const [session, setSession] = useState<GameSession | null>(null);
  const [results, setResults] = useState<GameResults | null>(null);

  // Start a fluency zone session
  const handleStart = useCallback(
    async (nodeId: string, timeLimitSeconds: number) => {
      try {
        const res = await fetch("/api/session/fluency-zone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            studentId,
            nodeId,
            timeLimitSeconds,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSession({
          sessionId: data.sessionId,
          nodeId: data.nodeId,
          nodeName: data.nodeName,
          subject: data.subject,
          timeLimitSeconds,
          personalBest: data.personalBest,
        });
        setScreen("game");
      } catch (err) {
        console.error("Failed to start fluency zone:", err);
      }
    },
    [studentId]
  );

  // Submit fluency zone results
  const handleComplete = useCallback(
    async (
      answers: Array<{ questionText: string; answer: string; correct: boolean; timeMs: number }>,
      elapsedSeconds: number
    ) => {
      if (!session) return;

      try {
        const res = await fetch("/api/session/fluency-zone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            sessionId: session.sessionId,
            studentId,
            answers,
            elapsedSeconds,
          }),
        });
        const data = await res.json();

        setResults({
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          accuracy: data.accuracy,
          questionsPerMin: data.questionsPerMin,
          averageTimeMs: data.averageTimeMs,
          isPersonalBest: data.isPersonalBest,
          previousBest: data.previousBest,
          nodeName: data.nodeName,
          timeLimitSeconds: session.timeLimitSeconds,
        });
        setScreen("results");
      } catch (err) {
        console.error("Failed to submit results:", err);
      }
    },
    [session, studentId]
  );

  // Play again with same topic
  const handlePlayAgain = useCallback(() => {
    if (session) {
      handleStart(session.nodeId, session.timeLimitSeconds);
    }
  }, [session, handleStart]);

  if (!studentId) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-white flex items-center justify-center">
        <p className="text-gray-500">Missing student ID</p>
      </div>
    );
  }

  switch (screen) {
    case "picker":
      return (
        <FluencyZonePicker
          studentId={studentId}
          onStart={handleStart}
          onBack={() => router.push("/kid")}
        />
      );

    case "game":
      return session ? (
        <FluencyZoneGame
          sessionId={session.sessionId}
          studentId={studentId}
          nodeId={session.nodeId}
          nodeName={session.nodeName}
          subject={session.subject}
          timeLimitSeconds={session.timeLimitSeconds}
          personalBest={session.personalBest}
          onComplete={handleComplete}
        />
      ) : null;

    case "results":
      return results ? (
        <FluencyZoneResults
          {...results}
          onPlayAgain={handlePlayAgain}
          onChangeTopic={() => setScreen("picker")}
          onBack={() => router.push("/kid")}
        />
      ) : null;
  }
}
