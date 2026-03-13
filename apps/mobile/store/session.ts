/**
 * Session store — manages active learning session state.
 *
 * INSTANT FEEDBACK: Results are shown immediately from local data.
 * API submission happens in the background without blocking the UI.
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

// API response shape for submitAnswer — loosely typed since format varies
interface SubmitAnswerResult {
  isCorrect?: boolean;
  correct?: boolean;
  mastery?: { probability?: number; bktProbability?: number };
  state?: string;
  nextAction?: string;
  celebration?: unknown;
  feedback?: { message?: string };
  message?: string;
  gamification?: { xpAwarded?: number; newXP?: number };
  sessionXP?: number;
  learningStep?: number;
  gradeCompletion?: GradeCompletionData;
}

/** Grade completion data — present when mastering a node completes an entire grade+subject. */
export interface GradeCompletionData {
  grade: string;
  subject: string;
  totalNodes: number;
  nextGrade: string | null;
  upcomingTopics: string[];
}

interface MobileQuestion {
  questionText: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer?: string;
  explanation?: string;
  /** Coordinate plane question fields */
  questionType?: "coordinate_plane";
  correctX?: number;
  correctY?: number;
  tolerance?: number;
  gridMin?: number;
  gridMax?: number;
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
  totalCorrect: number;

  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  showCelebration: boolean;

  // XP earned
  xpEarned: number;

  // Grade completion (populated when mastering a node completes an entire grade)
  gradeCompletion: GradeCompletionData | null;

  // Timing
  questionStartTime: number;

  // Prefetched next question
  prefetchedQuestion: MobileQuestion | null;
  prefetchedLearningStep: number | null;

  // Actions
  start: (studentId: string, nodeCode: string) => Promise<void>;
  selectOption: (optionId: string) => void;
  confirmAnswer: (studentId: string) => void;
  confirmCoordinateAnswer: (studentId: string, x: number, y: number) => void;
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
  totalCorrect: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,
  showCelebration: false,
  xpEarned: 0,
  gradeCompletion: null,
  questionStartTime: Date.now(),
  prefetchedQuestion: null,
  prefetchedLearningStep: null,
};

/** Map API question response to MobileQuestion, preserving coordinate plane fields */
function mapApiQuestion(q: any): MobileQuestion | null {
  if (!q) return null;
  const base: MobileQuestion = {
    questionText: q.questionText,
    options: (q.options ?? []).map((o: any) => ({ id: o.id, text: o.text })),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  };
  // Coordinate plane fields
  if (q.questionType === "coordinate_plane") {
    base.questionType = "coordinate_plane";
    base.correctX = q.correctX;
    base.correctY = q.correctY;
    base.tolerance = q.tolerance;
    base.gridMin = q.gridMin;
    base.gridMax = q.gridMax;
  }
  return base;
}

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
        // Use existing BKT mastery instead of starting at 0
        masteryPercent: res.initialMastery ?? 0,
      });

      // Immediately fetch first question
      const q = await apiNextQ(res.sessionId);
      set({
        currentQuestion: mapApiQuestion(q.question),
        learningStep: q.learningStep ?? 0,
        questionStartTime: Date.now(),
        isLoading: false,
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

  // INSTANT: Show result immediately, submit to API in background
  confirmAnswer: (studentId: string) => {
    const { sessionId, selectedOptionId, currentQuestion, questionStartTime } = get();
    if (!sessionId || !selectedOptionId || !currentQuestion) return;

    const selectedOption = currentQuestion.options.find(
      (o) => o.id === selectedOptionId
    );
    const isCorrectLocal = selectedOptionId === currentQuestion.correctAnswer;
    const responseTimeMs = Date.now() - questionStartTime;

    // ── INSTANT UI UPDATE ──
    // Show result immediately — no waiting for API
    set((state) => ({
      isConfirmed: true,
      isSubmitting: false,
      isCorrect: isCorrectLocal,
      explanation: currentQuestion.explanation || null,
      questionsAnswered: state.questionsAnswered + 1,
      totalCorrect: isCorrectLocal ? state.totalCorrect + 1 : state.totalCorrect,
      correctStreak: isCorrectLocal ? state.correctStreak + 1 : 0,
      // Estimate mastery locally (each correct ~12%, incorrect stays same)
      masteryPercent: isCorrectLocal
        ? Math.min(100, state.masteryPercent + 12)
        : state.masteryPercent,
    }));

    // ── BACKGROUND: Submit to API + prefetch next question ──
    // Fire-and-forget: don't block the UI
    apiSubmit({
      sessionId,
      selectedOptionId,
      isCorrect: isCorrectLocal,
      responseTimeMs,
      questionText: currentQuestion.questionText,
      selectedAnswerText: selectedOption?.text,
      correctAnswerText: currentQuestion.options.find(
        (o) => o.id === currentQuestion.correctAnswer
      )?.text,
      explanation: currentQuestion.explanation,
    })
      .then((raw) => {
        const res = raw as SubmitAnswerResult;
        const rawMastery = res.mastery?.probability ?? res.mastery?.bktProbability ?? 0;
        const masteryPct = Math.min(100, Math.round(rawMastery > 1 ? rawMastery : rawMastery * 100));
        const mastered =
          res.state === "MASTERED" || res.nextAction === "mastered" || res.celebration != null;
        const xp = res.gamification?.xpAwarded ?? res.gamification?.newXP ?? res.sessionXP ?? 0;

        // Update with real server data (mastery, XP, mastered status, grade completion)
        set((state) => ({
          masteryPercent: masteryPct > 0 ? masteryPct : state.masteryPercent,
          learningStep: res.learningStep ?? state.learningStep,
          xpEarned: xp > state.xpEarned ? xp : state.xpEarned,
          isMastered: mastered,
          showCelebration: mastered,
          gradeCompletion: res.gradeCompletion ?? state.gradeCompletion,
        }));
      })
      .catch(() => {
        // API failed silently — local result is already shown
        // Mastery tracking will be slightly off but UX continues
      });

    // Prefetch next question in background so advance is instant too
    apiNextQ(sessionId)
      .then((q) => {
        if (q.question) {
          set({
            prefetchedQuestion: mapApiQuestion(q.question),
            prefetchedLearningStep: q.learningStep ?? null,
          });
        } else {
          // No more questions — will show celebration on next advance
          set({ prefetchedQuestion: null, prefetchedLearningStep: null });
        }
      })
      .catch(() => {
        // Will fetch on advance instead
      });
  },

  // INSTANT: Coordinate plane answer — show result immediately, submit in background
  confirmCoordinateAnswer: (studentId: string, x: number, y: number) => {
    const { sessionId, currentQuestion, questionStartTime } = get();
    if (!sessionId || !currentQuestion || currentQuestion.questionType !== "coordinate_plane") return;

    const correctX = currentQuestion.correctX ?? 0;
    const correctY = currentQuestion.correctY ?? 0;
    const tolerance = currentQuestion.tolerance ?? 0.5;
    const dx = Math.abs(x - correctX);
    const dy = Math.abs(y - correctY);
    const isCorrectLocal = dx <= tolerance && dy <= tolerance;
    const responseTimeMs = Date.now() - questionStartTime;

    // ── INSTANT UI UPDATE ──
    set((state) => ({
      isConfirmed: true,
      isSubmitting: false,
      isCorrect: isCorrectLocal,
      explanation: currentQuestion.explanation || null,
      questionsAnswered: state.questionsAnswered + 1,
      totalCorrect: isCorrectLocal ? state.totalCorrect + 1 : state.totalCorrect,
      correctStreak: isCorrectLocal ? state.correctStreak + 1 : 0,
      masteryPercent: isCorrectLocal
        ? Math.min(100, state.masteryPercent + 12)
        : state.masteryPercent,
    }));

    // ── BACKGROUND: Submit to API ──
    apiSubmit({
      sessionId,
      questionType: "coordinate_plane",
      selectedX: x,
      selectedY: y,
      correctX,
      correctY,
      isCorrect: isCorrectLocal,
      responseTimeMs,
      questionText: currentQuestion.questionText,
      explanation: currentQuestion.explanation,
    })
      .then((raw) => {
        const res = raw as SubmitAnswerResult;
        const rawMastery = res.mastery?.probability ?? res.mastery?.bktProbability ?? 0;
        const masteryPct = Math.min(100, Math.round(rawMastery > 1 ? rawMastery : rawMastery * 100));
        const mastered =
          res.state === "MASTERED" || res.nextAction === "mastered" || res.celebration != null;
        const xp = res.gamification?.xpAwarded ?? res.gamification?.newXP ?? res.sessionXP ?? 0;

        set((state) => ({
          masteryPercent: masteryPct > 0 ? masteryPct : state.masteryPercent,
          learningStep: res.learningStep ?? state.learningStep,
          xpEarned: xp > state.xpEarned ? xp : state.xpEarned,
          isMastered: mastered,
          showCelebration: mastered,
          gradeCompletion: res.gradeCompletion ?? state.gradeCompletion,
        }));
      })
      .catch(() => {});

    // Prefetch next question
    apiNextQ(sessionId)
      .then((q) => {
        if (q.question) {
          set({
            prefetchedQuestion: mapApiQuestion(q.question),
            prefetchedLearningStep: q.learningStep ?? null,
          });
        } else {
          set({ prefetchedQuestion: null, prefetchedLearningStep: null });
        }
      })
      .catch(() => {});
  },

  advanceToNext: async () => {
    const { sessionId, isMastered, prefetchedQuestion, prefetchedLearningStep } = get();
    if (!sessionId || isMastered) return;

    // Use prefetched question if available (instant!)
    if (prefetchedQuestion) {
      set({
        currentQuestion: prefetchedQuestion,
        learningStep: prefetchedLearningStep ?? get().learningStep,
        selectedOptionId: null,
        isConfirmed: false,
        isCorrect: null,
        explanation: null,
        showCelebration: false,
        questionStartTime: Date.now(),
        prefetchedQuestion: null,
        prefetchedLearningStep: null,
      });
      return;
    }

    // No prefetch — fetch now (with loading spinner)
    set({
      isLoading: true,
      selectedOptionId: null,
      isConfirmed: false,
      isCorrect: null,
      explanation: null,
      showCelebration: false,
    });

    try {
      const q = await apiNextQ(sessionId);

      if (!q.question) {
        set({
          currentQuestion: null,
          isLoading: false,
          isMastered: true,
          showCelebration: true,
        });
        return;
      }

      set({
        currentQuestion: mapApiQuestion(q.question),
        learningStep: q.learningStep ?? get().learningStep,
        questionStartTime: Date.now(),
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
