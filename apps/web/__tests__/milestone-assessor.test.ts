/**
 * Milestone Assessor Tests — Learning GPS Step 8
 *
 * Tests the milestone evaluation system:
 * - evaluateMilestone pure function (pass/fail logic)
 * - Score calculation
 * - Concept-level pass/fail breakdown
 * - Message generation based on score
 * - Session store operations
 * - PASS_THRESHOLD constant
 */

import { describe, it, expect } from "vitest";
import {
  evaluateMilestone,
  getMilestoneSession,
  setMilestoneSession,
  deleteMilestoneSession,
  PASS_THRESHOLD,
  type MilestoneQuestion,
  type MilestoneAnswer,
  type MilestoneSession,
  type MilestoneEvaluation,
} from "../lib/learning-plan/milestone-assessor";

// ─── Helpers ───

function makeQuestion(overrides: Partial<MilestoneQuestion> = {}): MilestoneQuestion {
  return {
    questionId: `q-${Math.random().toString(36).slice(2, 8)}`,
    conceptCode: "MATH.K.CC.1",
    conceptTitle: "Counting to 10",
    questionText: "What comes after 5?",
    options: [
      { id: "a", text: "4", isCorrect: false },
      { id: "b", text: "6", isCorrect: true },
      { id: "c", text: "7", isCorrect: false },
      { id: "d", text: "5", isCorrect: false },
    ],
    difficulty: 3,
    ...overrides,
  };
}

function makeAnswer(questionId: string, isCorrect: boolean): MilestoneAnswer {
  return {
    questionId,
    selectedOptionId: isCorrect ? "b" : "a",
    isCorrect,
    responseTimeMs: 3000,
  };
}

// ─── Tests ───

describe("Milestone Assessor", () => {
  // ─── PASS_THRESHOLD ───

  describe("PASS_THRESHOLD", () => {
    it("is 0.75 (75%)", () => {
      expect(PASS_THRESHOLD).toBe(0.75);
    });
  });

  // ─── evaluateMilestone ───

  describe("evaluateMilestone", () => {
    it("passes when score >= 75%", () => {
      const questions = Array.from({ length: 8 }, (_, i) =>
        makeQuestion({ questionId: `q${i}`, conceptCode: `C${i % 4}` })
      );
      const answers = new Map<string, MilestoneAnswer>();
      // 6/8 = 75% — exactly at threshold
      for (let i = 0; i < 8; i++) {
        answers.set(`q${i}`, makeAnswer(`q${i}`, i < 6));
      }

      const result = evaluateMilestone(questions, answers);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(75);
    });

    it("fails when score < 75%", () => {
      const questions = Array.from({ length: 8 }, (_, i) =>
        makeQuestion({ questionId: `q${i}`, conceptCode: `C${i % 4}` })
      );
      const answers = new Map<string, MilestoneAnswer>();
      // 5/8 = 62.5% — below threshold
      for (let i = 0; i < 8; i++) {
        answers.set(`q${i}`, makeAnswer(`q${i}`, i < 5));
      }

      const result = evaluateMilestone(questions, answers);
      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(75);
    });

    it("returns perfect score for 8/8 correct", () => {
      const questions = Array.from({ length: 8 }, (_, i) =>
        makeQuestion({ questionId: `q${i}` })
      );
      const answers = new Map<string, MilestoneAnswer>();
      for (let i = 0; i < 8; i++) {
        answers.set(`q${i}`, makeAnswer(`q${i}`, true));
      }

      const result = evaluateMilestone(questions, answers);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.totalCorrect).toBe(8);
      expect(result.totalQuestions).toBe(8);
    });

    it("returns 0 score for 0/8 correct", () => {
      const questions = Array.from({ length: 8 }, (_, i) =>
        makeQuestion({ questionId: `q${i}` })
      );
      const answers = new Map<string, MilestoneAnswer>();
      for (let i = 0; i < 8; i++) {
        answers.set(`q${i}`, makeAnswer(`q${i}`, false));
      }

      const result = evaluateMilestone(questions, answers);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
    });

    it("calculates concept-level results correctly", () => {
      const questions = [
        makeQuestion({ questionId: "q1", conceptCode: "MATH.1", conceptTitle: "Addition" }),
        makeQuestion({ questionId: "q2", conceptCode: "MATH.1", conceptTitle: "Addition" }),
        makeQuestion({ questionId: "q3", conceptCode: "MATH.2", conceptTitle: "Subtraction" }),
        makeQuestion({ questionId: "q4", conceptCode: "MATH.2", conceptTitle: "Subtraction" }),
      ];
      const answers = new Map<string, MilestoneAnswer>();
      answers.set("q1", makeAnswer("q1", true));
      answers.set("q2", makeAnswer("q2", true));
      answers.set("q3", makeAnswer("q3", true));
      answers.set("q4", makeAnswer("q4", false));

      const result = evaluateMilestone(questions, answers);
      expect(result.conceptResults).toHaveLength(2);

      const math1 = result.conceptResults.find((c) => c.conceptCode === "MATH.1");
      expect(math1?.correct).toBe(2);
      expect(math1?.total).toBe(2);
      expect(math1?.passed).toBe(true);

      const math2 = result.conceptResults.find((c) => c.conceptCode === "MATH.2");
      expect(math2?.correct).toBe(1);
      expect(math2?.total).toBe(2);
      expect(math2?.passed).toBe(true); // 50% passes individual concept
    });

    it("identifies failed concepts (< 50% correct)", () => {
      const questions = [
        makeQuestion({ questionId: "q1", conceptCode: "MATH.1", conceptTitle: "Addition" }),
        makeQuestion({ questionId: "q2", conceptCode: "MATH.1", conceptTitle: "Addition" }),
        makeQuestion({ questionId: "q3", conceptCode: "MATH.2", conceptTitle: "Subtraction" }),
        makeQuestion({ questionId: "q4", conceptCode: "MATH.2", conceptTitle: "Subtraction" }),
      ];
      const answers = new Map<string, MilestoneAnswer>();
      answers.set("q1", makeAnswer("q1", true));
      answers.set("q2", makeAnswer("q2", true));
      answers.set("q3", makeAnswer("q3", false)); // Both wrong for MATH.2
      answers.set("q4", makeAnswer("q4", false));

      const result = evaluateMilestone(questions, answers);
      expect(result.failedConcepts).toContain("MATH.2");
      expect(result.failedConcepts).not.toContain("MATH.1");
    });

    it("generates encouraging message for perfect score", () => {
      const questions = Array.from({ length: 4 }, (_, i) =>
        makeQuestion({ questionId: `q${i}` })
      );
      const answers = new Map<string, MilestoneAnswer>();
      for (let i = 0; i < 4; i++) {
        answers.set(`q${i}`, makeAnswer(`q${i}`, true));
      }

      const result = evaluateMilestone(questions, answers);
      expect(result.message).toContain("Perfect");
      expect(result.encouragement).toBeTruthy();
    });

    it("generates supportive message for failing score", () => {
      const questions = Array.from({ length: 4 }, (_, i) =>
        makeQuestion({ questionId: `q${i}` })
      );
      const answers = new Map<string, MilestoneAnswer>();
      for (let i = 0; i < 4; i++) {
        answers.set(`q${i}`, makeAnswer(`q${i}`, false));
      }

      const result = evaluateMilestone(questions, answers);
      expect(result.passed).toBe(false);
      expect(result.encouragement).toBeTruthy();
      expect(result.encouragement.length).toBeGreaterThan(10);
    });

    it("handles empty questions array", () => {
      const result = evaluateMilestone([], new Map());
      expect(result.score).toBe(0);
      expect(result.totalQuestions).toBe(0);
      expect(result.conceptResults).toHaveLength(0);
    });

    it("handles unanswered questions (treat as incorrect)", () => {
      const questions = [
        makeQuestion({ questionId: "q1" }),
        makeQuestion({ questionId: "q2" }),
      ];
      const answers = new Map<string, MilestoneAnswer>();
      // Only answer 1 of 2
      answers.set("q1", makeAnswer("q1", true));

      const result = evaluateMilestone(questions, answers);
      expect(result.totalCorrect).toBe(1);
      expect(result.score).toBe(50); // 1/2 = 50%
    });

    it("returns MilestoneEvaluation with all required fields", () => {
      const questions = [makeQuestion({ questionId: "q1" })];
      const answers = new Map<string, MilestoneAnswer>();
      answers.set("q1", makeAnswer("q1", true));

      const result: MilestoneEvaluation = evaluateMilestone(questions, answers);
      expect(result).toHaveProperty("passed");
      expect(result).toHaveProperty("score");
      expect(result).toHaveProperty("totalCorrect");
      expect(result).toHaveProperty("totalQuestions");
      expect(result).toHaveProperty("conceptResults");
      expect(result).toHaveProperty("failedConcepts");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("encouragement");
    });
  });

  // ─── In-memory session store ───

  describe("Milestone Session Store", () => {
    it("stores and retrieves a session", () => {
      const session: MilestoneSession = {
        planId: "plan-123",
        weekNumber: 2,
        studentId: "student-1",
        questions: [makeQuestion()],
        answers: new Map(),
        startedAt: new Date(),
        currentQuestionIndex: 0,
      };

      const key = "test-session-1";
      setMilestoneSession(key, session);
      const retrieved = getMilestoneSession(key);

      expect(retrieved).toBeTruthy();
      expect(retrieved?.planId).toBe("plan-123");
      expect(retrieved?.weekNumber).toBe(2);
    });

    it("returns undefined for non-existent session", () => {
      const result = getMilestoneSession("non-existent-key");
      expect(result).toBeUndefined();
    });

    it("deletes a session", () => {
      const session: MilestoneSession = {
        planId: "plan-delete",
        weekNumber: 1,
        studentId: "student-1",
        questions: [],
        answers: new Map(),
        startedAt: new Date(),
        currentQuestionIndex: 0,
      };

      const key = "test-session-delete";
      setMilestoneSession(key, session);
      expect(getMilestoneSession(key)).toBeTruthy();

      deleteMilestoneSession(key);
      expect(getMilestoneSession(key)).toBeUndefined();
    });

    it("overwrites existing session", () => {
      const key = "test-session-overwrite";
      setMilestoneSession(key, {
        planId: "plan-v1",
        weekNumber: 1,
        studentId: "s1",
        questions: [],
        answers: new Map(),
        startedAt: new Date(),
        currentQuestionIndex: 0,
      });

      setMilestoneSession(key, {
        planId: "plan-v2",
        weekNumber: 2,
        studentId: "s1",
        questions: [],
        answers: new Map(),
        startedAt: new Date(),
        currentQuestionIndex: 3,
      });

      const result = getMilestoneSession(key);
      expect(result?.planId).toBe("plan-v2");
      expect(result?.weekNumber).toBe(2);
    });
  });
});
