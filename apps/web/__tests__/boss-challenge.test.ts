/**
 * Boss Challenge System Tests — Phase 7: Gamification
 *
 * Tests:
 *  - Boss unlock conditions
 *  - Character selection
 *  - Challenge type selection
 *  - Difficulty adjustment
 *  - Challenge lifecycle (create → start → answer → complete)
 *  - Timer and completion checks
 *  - Boss messages
 *  - Display helpers
 */

import { describe, it, expect } from "vitest";
import {
  checkBossUnlock,
  selectBossCharacter,
  selectChallengeType,
  adjustDifficulty,
  createBossChallenge,
  startBossChallenge,
  recordBossAnswer,
  isBossTimedOut,
  isBossComplete,
  completeBossChallenge,
  getBossTaunt,
  getBossEncouragement,
  getBossOutcomeMessage,
  getChallengeTypeLabel,
  getChallengeTypeIcon,
  getDifficultyLabel,
  formatTimeRemaining,
  getTimeRemaining,
  BOSS_CHARACTERS,
  CHALLENGE_CONFIGS,
} from "../lib/gamification/boss-challenge";

describe("Boss Challenge System", () => {
  // ─── checkBossUnlock ───

  describe("checkBossUnlock", () => {
    it("unlocks on Sunday with enough concepts", () => {
      expect(checkBossUnlock(0, 5)).toBe(true);
    });

    it("does not unlock on non-Sunday", () => {
      expect(checkBossUnlock(1, 10)).toBe(false);
      expect(checkBossUnlock(3, 10)).toBe(false);
      expect(checkBossUnlock(6, 10)).toBe(false);
    });

    it("does not unlock with too few concepts", () => {
      expect(checkBossUnlock(0, 3)).toBe(false);
    });

    it("does not unlock with active challenge", () => {
      expect(checkBossUnlock(0, 10, 5, true)).toBe(false);
    });

    it("respects custom minConcepts", () => {
      expect(checkBossUnlock(0, 8, 10)).toBe(false);
      expect(checkBossUnlock(0, 10, 10)).toBe(true);
    });
  });

  // ─── selectBossCharacter ───

  describe("selectBossCharacter", () => {
    it("returns a valid boss character", () => {
      const boss = selectBossCharacter();
      expect(boss.name).toBeTruthy();
      expect(boss.title).toBeTruthy();
      expect(boss.emoji).toBeTruthy();
      expect(boss.taunts.length).toBeGreaterThan(0);
    });

    it("excludes specified index", () => {
      // Run many times to statistically ensure exclusion
      for (let i = 0; i < 20; i++) {
        const boss = selectBossCharacter(0);
        expect(boss).not.toBe(BOSS_CHARACTERS[0]);
      }
    });
  });

  // ─── selectChallengeType ───

  describe("selectChallengeType", () => {
    it("picks STORY_PROBLEM for fast but inaccurate students", () => {
      expect(selectChallengeType(0.6, 1.3)).toBe("STORY_PROBLEM");
    });

    it("picks SPEED_ROUND for slow but accurate students", () => {
      expect(selectChallengeType(0.9, 0.7)).toBe("SPEED_ROUND");
    });

    it("picks REAL_WORLD for high-performing students", () => {
      expect(selectChallengeType(0.9, 1.1)).toBe("REAL_WORLD");
    });

    it("defaults to MULTI_STEP", () => {
      expect(selectChallengeType(0.8, 0.9)).toBe("MULTI_STEP");
    });

    it("picks from preferred types when defaulting", () => {
      const type = selectChallengeType(0.8, 0.9, ["SPEED_ROUND"]);
      expect(type).toBe("SPEED_ROUND");
    });
  });

  // ─── adjustDifficulty ───

  describe("adjustDifficulty", () => {
    it("increases difficulty every 3 wins", () => {
      const base = CHALLENGE_CONFIGS.MULTI_STEP;
      const adjusted = adjustDifficulty(base, 5, 6); // 6 wins → +2 difficulty
      expect(adjusted.difficulty).toBe(Math.min(5, base.difficulty + 2));
    });

    it("caps difficulty at 5", () => {
      const base = CHALLENGE_CONFIGS.MULTI_STEP;
      const adjusted = adjustDifficulty(base, 10, 30);
      expect(adjusted.difficulty).toBeLessThanOrEqual(5);
    });

    it("increases rewards with difficulty", () => {
      const base = CHALLENGE_CONFIGS.STORY_PROBLEM;
      const adjusted = adjustDifficulty(base, 5, 6);
      expect(adjusted.xpReward).toBeGreaterThan(base.xpReward);
      expect(adjusted.pointsReward).toBeGreaterThan(base.pointsReward);
    });

    it("slightly increases passing score", () => {
      const base = CHALLENGE_CONFIGS.SPEED_ROUND;
      const adjusted = adjustDifficulty(base, 5, 6);
      expect(adjusted.passingScore).toBeGreaterThanOrEqual(base.passingScore);
      expect(adjusted.passingScore).toBeLessThanOrEqual(0.95);
    });

    it("returns base config for 0 wins", () => {
      const base = CHALLENGE_CONFIGS.MULTI_STEP;
      const adjusted = adjustDifficulty(base, 3, 0);
      expect(adjusted.difficulty).toBe(base.difficulty);
    });
  });

  // ─── createBossChallenge ───

  describe("createBossChallenge", () => {
    it("creates challenge with correct state", () => {
      const challenge = createBossChallenge(
        "boss-1",
        ["node-a", "node-b"],
        "STORY_PROBLEM",
        5,
        0
      );
      expect(challenge.challengeId).toBe("boss-1");
      expect(challenge.status).toBe("AVAILABLE");
      expect(challenge.nodeIds).toEqual(["node-a", "node-b"]);
      expect(challenge.character).toBeDefined();
      expect(challenge.config.type).toBe("STORY_PROBLEM");
      expect(challenge.questionsAnswered).toBe(0);
      expect(challenge.correctAnswers).toBe(0);
      expect(challenge.startedAt).toBeNull();
    });
  });

  // ─── startBossChallenge ───

  describe("startBossChallenge", () => {
    it("sets status to ACTIVE", () => {
      const challenge = createBossChallenge("boss-1", ["n1"], "SPEED_ROUND", 3, 0);
      const started = startBossChallenge(challenge);
      expect(started.status).toBe("ACTIVE");
      expect(started.startedAt).toBeInstanceOf(Date);
      expect(started.questionsAnswered).toBe(0);
      expect(started.correctAnswers).toBe(0);
    });
  });

  // ─── recordBossAnswer ───

  describe("recordBossAnswer", () => {
    it("increments questions answered for correct", () => {
      const challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "MULTI_STEP", 3, 0)
      );
      const updated = recordBossAnswer(challenge, true);
      expect(updated.questionsAnswered).toBe(1);
      expect(updated.correctAnswers).toBe(1);
    });

    it("increments questions answered for incorrect", () => {
      const challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "MULTI_STEP", 3, 0)
      );
      const updated = recordBossAnswer(challenge, false);
      expect(updated.questionsAnswered).toBe(1);
      expect(updated.correctAnswers).toBe(0);
    });

    it("accumulates multiple answers", () => {
      let challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "MULTI_STEP", 3, 0)
      );
      challenge = recordBossAnswer(challenge, true);
      challenge = recordBossAnswer(challenge, false);
      challenge = recordBossAnswer(challenge, true);
      expect(challenge.questionsAnswered).toBe(3);
      expect(challenge.correctAnswers).toBe(2);
    });
  });

  // ─── isBossTimedOut ───

  describe("isBossTimedOut", () => {
    it("returns false when not started", () => {
      const challenge = createBossChallenge("boss-1", ["n1"], "SPEED_ROUND", 3, 0);
      expect(isBossTimedOut(challenge)).toBe(false);
    });

    it("returns false when within time limit", () => {
      const challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "SPEED_ROUND", 3, 0)
      );
      expect(isBossTimedOut(challenge)).toBe(false);
    });

    it("returns true when past time limit", () => {
      const challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "SPEED_ROUND", 3, 0)
      );
      // Set started time to long ago
      const timedOut = {
        ...challenge,
        startedAt: new Date(Date.now() - 999999999),
      };
      expect(isBossTimedOut(timedOut)).toBe(true);
    });
  });

  // ─── isBossComplete ───

  describe("isBossComplete", () => {
    it("returns false when questions remain", () => {
      let challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "MULTI_STEP", 3, 0)
      );
      challenge = recordBossAnswer(challenge, true);
      expect(isBossComplete(challenge)).toBe(false);
    });

    it("returns true when all questions answered", () => {
      let challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "MULTI_STEP", 3, 0)
      );
      for (let i = 0; i < challenge.config.questionCount; i++) {
        challenge = recordBossAnswer(challenge, true);
      }
      expect(isBossComplete(challenge)).toBe(true);
    });
  });

  // ─── completeBossChallenge ───

  describe("completeBossChallenge", () => {
    it("returns passed=true when above passing score", () => {
      let challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "STORY_PROBLEM", 3, 0)
      );
      // Answer enough correctly to pass
      const total = challenge.config.questionCount;
      const needed = Math.ceil(total * challenge.config.passingScore);
      for (let i = 0; i < needed; i++) {
        challenge = recordBossAnswer(challenge, true);
      }
      for (let i = needed; i < total; i++) {
        challenge = recordBossAnswer(challenge, false);
      }
      const result = completeBossChallenge(challenge);
      expect(result.passed).toBe(true);
      expect(result.xpEarned).toBe(challenge.config.xpReward);
      expect(result.pointsEarned).toBe(challenge.config.pointsReward);
    });

    it("returns passed=false when below passing score", () => {
      let challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "SPEED_ROUND", 3, 0)
      );
      // Answer all incorrectly
      for (let i = 0; i < challenge.config.questionCount; i++) {
        challenge = recordBossAnswer(challenge, false);
      }
      const result = completeBossChallenge(challenge);
      expect(result.passed).toBe(false);
      expect(result.xpEarned).toBeGreaterThan(0); // Partial XP
      expect(result.pointsEarned).toBe(0);
    });

    it("computes score correctly", () => {
      let challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "MULTI_STEP", 3, 0)
      );
      challenge = recordBossAnswer(challenge, true);
      challenge = recordBossAnswer(challenge, false);
      challenge = recordBossAnswer(challenge, true);
      challenge = recordBossAnswer(challenge, true);
      const result = completeBossChallenge(challenge);
      expect(result.score).toBe(0.75);
      expect(result.questionsCorrect).toBe(3);
      expect(result.questionsTotal).toBe(4);
    });

    it("returns 0 score for no answers", () => {
      const challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "MULTI_STEP", 3, 0)
      );
      const result = completeBossChallenge(challenge);
      expect(result.score).toBe(0);
    });
  });

  // ─── Boss Messages ───

  describe("boss messages", () => {
    it("getBossTaunt returns a non-empty string", () => {
      const boss = BOSS_CHARACTERS[0];
      const taunt = getBossTaunt(boss);
      expect(taunt.length).toBeGreaterThan(0);
      expect(boss.taunts).toContain(taunt);
    });

    it("getBossEncouragement returns a non-empty string", () => {
      const boss = BOSS_CHARACTERS[0];
      const msg = getBossEncouragement(boss);
      expect(msg.length).toBeGreaterThan(0);
      expect(boss.encouragements).toContain(msg);
    });

    it("getBossOutcomeMessage returns defeat message on pass", () => {
      const boss = BOSS_CHARACTERS[0];
      expect(getBossOutcomeMessage(boss, true)).toBe(boss.defeatMessage);
    });

    it("getBossOutcomeMessage returns victory message on fail", () => {
      const boss = BOSS_CHARACTERS[0];
      expect(getBossOutcomeMessage(boss, false)).toBe(boss.victoryMessage);
    });
  });

  // ─── BOSS_CHARACTERS ───

  describe("BOSS_CHARACTERS", () => {
    it("has at least 3 characters", () => {
      expect(BOSS_CHARACTERS.length).toBeGreaterThanOrEqual(3);
    });

    it("all have required fields", () => {
      for (const boss of BOSS_CHARACTERS) {
        expect(boss.name).toBeTruthy();
        expect(boss.title).toBeTruthy();
        expect(boss.emoji).toBeTruthy();
        expect(boss.taunts.length).toBeGreaterThan(0);
        expect(boss.encouragements.length).toBeGreaterThan(0);
        expect(boss.defeatMessage).toBeTruthy();
        expect(boss.victoryMessage).toBeTruthy();
      }
    });
  });

  // ─── CHALLENGE_CONFIGS ───

  describe("CHALLENGE_CONFIGS", () => {
    it("has all 4 types", () => {
      expect(CHALLENGE_CONFIGS.SPEED_ROUND).toBeDefined();
      expect(CHALLENGE_CONFIGS.MULTI_STEP).toBeDefined();
      expect(CHALLENGE_CONFIGS.STORY_PROBLEM).toBeDefined();
      expect(CHALLENGE_CONFIGS.REAL_WORLD).toBeDefined();
    });

    it("all have positive time limits", () => {
      for (const config of Object.values(CHALLENGE_CONFIGS)) {
        expect(config.timeLimitSecs).toBeGreaterThan(0);
      }
    });

    it("all have positive question counts", () => {
      for (const config of Object.values(CHALLENGE_CONFIGS)) {
        expect(config.questionCount).toBeGreaterThan(0);
      }
    });

    it("all have passing scores between 0 and 1", () => {
      for (const config of Object.values(CHALLENGE_CONFIGS)) {
        expect(config.passingScore).toBeGreaterThan(0);
        expect(config.passingScore).toBeLessThanOrEqual(1);
      }
    });
  });

  // ─── Display Helpers ───

  describe("display helpers", () => {
    it("getChallengeTypeLabel returns non-empty strings", () => {
      expect(getChallengeTypeLabel("SPEED_ROUND")).toBe("Speed Round");
      expect(getChallengeTypeLabel("MULTI_STEP")).toBe("Multi-Step Challenge");
      expect(getChallengeTypeLabel("STORY_PROBLEM")).toBe("Story Problem");
      expect(getChallengeTypeLabel("REAL_WORLD")).toBe("Real-World Application");
    });

    it("getChallengeTypeIcon returns emojis", () => {
      expect(getChallengeTypeIcon("SPEED_ROUND")).toBeTruthy();
      expect(getChallengeTypeIcon("STORY_PROBLEM")).toBeTruthy();
    });

    it("getDifficultyLabel returns labels for all levels", () => {
      expect(getDifficultyLabel(1)).toBe("Easy");
      expect(getDifficultyLabel(2)).toBe("Normal");
      expect(getDifficultyLabel(3)).toBe("Hard");
      expect(getDifficultyLabel(4)).toBe("Expert");
      expect(getDifficultyLabel(5)).toBe("Legendary");
    });

    it("formatTimeRemaining formats correctly", () => {
      expect(formatTimeRemaining(900)).toBe("15:00");
      expect(formatTimeRemaining(65)).toBe("1:05");
      expect(formatTimeRemaining(0)).toBe("0:00");
    });

    it("getTimeRemaining returns full time when not started", () => {
      const challenge = createBossChallenge("boss-1", ["n1"], "SPEED_ROUND", 3, 0);
      expect(getTimeRemaining(challenge)).toBe(challenge.config.timeLimitSecs);
    });

    it("getTimeRemaining returns positive for just-started", () => {
      const challenge = startBossChallenge(
        createBossChallenge("boss-1", ["n1"], "SPEED_ROUND", 3, 0)
      );
      expect(getTimeRemaining(challenge)).toBeGreaterThan(0);
    });
  });
});
