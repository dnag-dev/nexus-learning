/**
 * Session store — manages active learning session state.
 *
 * Calls the real API endpoints via @aauti/api-client.
 * Adapts the API response shapes to a simpler mobile-friendly state.
 */

import { create } from "zustand";
import {
  startSession as apiStart,
  getNextQuestion as apiNextQ,
  submitAnswer as apiSubmit,
  endSession as apiEnd,
} from "@aauti/api-client";
import type {
  StartSessionResponse,
  NextQuestionResponse,
  SubmitAnswerResponse,
  QuestionOption,
} from "@aauti/api-client";

interface MobileQuestion {
  questionText: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer?: string;
  explanation?: string;
}

interface SessionState {
  // Session info
  sessionId: string | null;
  nodeCode: string;
  nodeTitle: string;
  subject: string;

  // Current question
  currentQuestion: MobileQuestion | null;
  learningStep: number;
  questionsAnswered: number;

  // Answer state
  selectedOptionId: string | null;
  isConfirmed: boolean;
  isCorrect: boolean | null;
  explanation: string | null;

  // Mastery
  masteryPercent: number;
  isMastered: boolean;

  // Correct streak within session
  correctStreak: number;

  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  showCelebration: boolean;

  // XP earned
  xpEarned: number;

  // Actions
  start: (studentId: string, nodeCode: string) => Promise<void>;
  selectOption: (optionId: string) => void;
  confirmAnswer: (studentId: string) => Promise<void>;
  advanceToNext: () => Promise<void>;
  endSessionAction: (studentId: string) => Promise<void>;
  dismissTeaching: () => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  nodeCode: "",
  nodeTitle: "",
  subject: "",
  currentQuestion: null,
  learningStep: 0,
  questionsAnswered: 0,
  selectedOptionId: null,
  isConfirmed: false,
  isCorrect: null,
  explanation: null,
  masteryPercent: 0,
  isMastered: false,
  correctStreak: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,
  showCelebration: false,
  xpEarned: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  start: async (studentId: string, nodeCode: string) => {
    set({ ...initialState, isLoading: true, nodeCode });
    try {
      // Start session
      const res = await apiStart({ studentId, nodeCode });

      set({
        sessionId: res.sessionId,
        nodeTitle: res.node?.title || nodeCode,
        nodeCode: res.node?.nodeCode || nodeCode,
        subject: res.subject || "",
        isLoading: false,
      });

      // Immediately fetch first question
      const q = await apiNextQ(res.sessionId);
      set({
        currentQuestion: q.question
          ? {
              questionText: q.question.questionText,
              options: q.question.options.map((o) => ({
                id: o.id,
                text: o.text,
              })),
              correctAnswer: q.question.correctAnswer,
              explanation: q.question.explanation,
            }
          : null,
        learningStep: q.learningStep ?? 0,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to start session",
      });
    }
  },

  selectOption: (optionId: string) => {
    if (get().isConfirmed) return;
    set({ selectedOptionId: optionId });
  },

  confirmAnswer: async (studentId: string) => {
    const { sessionId, selectedOptionId, currentQuestion } = get();
    if (!sessionId || !selectedOptionId || !currentQuestion) return;

    // Determine if correct from local data
    const selectedOption = currentQuestion.options.find(
      (o) => o.id === selectedOptionId
    );
    const isCorrectLocal = selectedOptionId === currentQuestion.correctAnswer;

    set({ isSubmitting: true, isConfirmed: true });

    try {
      const res = (await apiSubmit({
        sessionId,
        selectedOptionId,
        isCorrect: isCorrectLocal,
        responseTimeMs: 0, // TODO: track actual time
        questionText: currentQuestion.questionText,
        selectedAnswerText: selectedOption?.text,
        correctAnswerText: currentQuestion.options.find(
          (o) => o.id === currentQuestion.correctAnswer
        )?.text,
        explanation: currentQuestion.explanation,
      })) as any;

      // API returns isCorrect (not correct), mastery.probability (not bktProbability)
      const correct = res.isCorrect ?? res.correct ?? isCorrectLocal;
      const rawMastery = res.mastery?.probability ?? res.mastery?.bktProbability ?? 0;
      // API may return 0-1 (probability) or 0-100 (percentage) — normalize to 0-100
      const masteryPct = Math.min(100, Math.round(rawMastery > 1 ? rawMastery : rawMastery * 100));
      const mastered =
        res.state === "MASTERED" || res.nextAction === "mastered" || res.celebration != null;
      const feedbackMsg = res.feedback?.message ?? res.message ?? null;
      const xp = res.gamification?.xpAwarded ?? res.gamification?.newXP ?? res.sessionXP ?? 0;

      set((state) => ({
        isCorrect: correct,
        explanation: currentQuestion.explanation || feedbackMsg,
        masteryPercent: masteryPct,
        learningStep: res.learningStep ?? Math.min(
          4,
          correct ? state.learningStep + 1 : state.learningStep
        ),
        questionsAnswered: state.questionsAnswered + 1,
        correctStreak: correct ? state.correctStreak + 1 : 0,
        xpEarned: xp > state.xpEarned ? xp : state.xpEarned,
        isMastered: mastered,
        showCelebration: mastered,
        isSubmitting: false,
      }));
    } catch (err) {
      set({
        isSubmitting: false,
        isConfirmed: false,
        error: err instanceof Error ? err.message : "Failed to submit answer",
      });
    }
  },

  advanceToNext: async () => {
    const { sessionId, isMastered } = get();
    if (!sessionId || isMastered) return;

    set({
      isLoading: true,
      selectedOptionId: null,
      isConfirmed: false,
      isCorrect: null,
      explanation: null,
    });

    try {
      const q = await apiNextQ(sessionId);

      set({
        currentQuestion: q.question
          ? {
              questionText: q.question.questionText,
              options: q.question.options.map((o) => ({
                id: o.id,
                text: o.text,
              })),
              correctAnswer: q.question.correctAnswer,
              explanation: q.question.explanation,
            }
          : null,
        learningStep: q.learningStep ?? get().learningStep,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error ? err.message : "Failed to load next question",
      });
    }
  },

  endSessionAction: async (studentId: string) => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      await apiEnd(sessionId, studentId);
    } catch {
      // Don't block navigation
    }
    set(initialState);
  },

  dismissTeaching: () => {
    // No-op for now; teaching handled in question flow
  },

  reset: () => set(initialState),
}));
