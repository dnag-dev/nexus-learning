/**
 * Adaptive Response Engine Tests
 *
 * Tests:
 *  - Response protocols for each emotional state
 *  - Adaptation structure and content
 *  - Message templates
 *  - Avatar expression mapping
 *  - Response queue management
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  buildAdaptiveResponse,
  getAdaptationMessage,
  getAvatarExpressionForState,
  ResponseQueue,
  MESSAGE_TEMPLATES,
  type AdaptiveResponse,
} from "../lib/emotional/adaptive-response";
import type { EmotionalStateValue, DetectionResult } from "../lib/emotional/state-detector";

// ─── Helper to build a detection result ───

function makeDetection(
  state: EmotionalStateValue,
  confidence: number = 0.6
): DetectionResult {
  return {
    state,
    confidence,
    scores: {} as Record<EmotionalStateValue, number>,
    reason: `Test detection for ${state}`,
    detectedAt: new Date(),
  };
}

// ─── FRUSTRATION Response ───

describe("Adaptive Response — FRUSTRATED", () => {
  it("builds frustration response with all required adaptations", () => {
    const detection = makeDetection("FRUSTRATED", 0.7);
    const response = buildAdaptiveResponse(detection);

    expect(response.triggeredBy).toBe("FRUSTRATED");
    expect(response.priority).toBe(1); // Highest priority

    const types = response.adaptations.map((a) => a.type);
    expect(types).toContain("avatar_expression");
    expect(types).toContain("voice_adjustment");
    expect(types).toContain("difficulty_change");
    expect(types).toContain("encouragement");
    expect(types).toContain("hint_offer");
  });

  it("sets avatar to encouraging", () => {
    const response = buildAdaptiveResponse(makeDetection("FRUSTRATED"));
    const avatarAdaptation = response.adaptations.find(
      (a) => a.type === "avatar_expression"
    );
    expect(avatarAdaptation?.avatarExpression).toBe("encouraging");
  });

  it("lowers voice speed and increases stability", () => {
    const response = buildAdaptiveResponse(makeDetection("FRUSTRATED"));
    const voiceAdaptation = response.adaptations.find(
      (a) => a.type === "voice_adjustment"
    );
    expect(voiceAdaptation?.voiceAdjustment?.stability).toBeGreaterThan(0.5);
    expect(voiceAdaptation?.voiceAdjustment?.rateMultiplier).toBeLessThan(1);
    expect(voiceAdaptation?.voiceAdjustment?.mood).toBe("warm");
  });

  it("decreases difficulty", () => {
    const response = buildAdaptiveResponse(makeDetection("FRUSTRATED"));
    const diffAdaptation = response.adaptations.find(
      (a) => a.type === "difficulty_change"
    );
    expect(diffAdaptation?.difficultyChange).toBe("decrease");
  });

  it("triggers emotional check for severe frustration", () => {
    const response = buildAdaptiveResponse(makeDetection("FRUSTRATED", 0.7));
    expect(response.triggerEmotionalCheck).toBe(true);
  });

  it("does not trigger emotional check for mild frustration", () => {
    const response = buildAdaptiveResponse(makeDetection("FRUSTRATED", 0.4));
    expect(response.triggerEmotionalCheck).toBe(false);
  });

  it("adds pacing change for severe frustration", () => {
    const response = buildAdaptiveResponse(makeDetection("FRUSTRATED", 0.7));
    const pacingAdaptation = response.adaptations.find(
      (a) => a.type === "pacing_change"
    );
    expect(pacingAdaptation?.pacingChange).toBe("slower");
  });
});

// ─── BOREDOM Response ───

describe("Adaptive Response — BORED", () => {
  it("builds boredom response", () => {
    const response = buildAdaptiveResponse(makeDetection("BORED"));

    expect(response.triggeredBy).toBe("BORED");
    expect(response.priority).toBe(3);
    expect(response.triggerEmotionalCheck).toBe(false);

    const types = response.adaptations.map((a) => a.type);
    expect(types).toContain("difficulty_change");
    expect(types).toContain("pacing_change");
    expect(types).toContain("voice_adjustment");
  });

  it("increases difficulty", () => {
    const response = buildAdaptiveResponse(makeDetection("BORED"));
    const diffAdaptation = response.adaptations.find(
      (a) => a.type === "difficulty_change"
    );
    expect(diffAdaptation?.difficultyChange).toBe("increase");
  });

  it("increases pacing", () => {
    const response = buildAdaptiveResponse(makeDetection("BORED"));
    const pacingAdaptation = response.adaptations.find(
      (a) => a.type === "pacing_change"
    );
    expect(pacingAdaptation?.pacingChange).toBe("faster");
  });

  it("makes voice more excited", () => {
    const response = buildAdaptiveResponse(makeDetection("BORED"));
    const voiceAdaptation = response.adaptations.find(
      (a) => a.type === "voice_adjustment"
    );
    expect(voiceAdaptation?.voiceAdjustment?.mood).toBe("excited");
  });
});

// ─── CONFUSED Response ───

describe("Adaptive Response — CONFUSED", () => {
  it("builds confusion response", () => {
    const response = buildAdaptiveResponse(makeDetection("CONFUSED"));

    expect(response.triggeredBy).toBe("CONFUSED");
    expect(response.priority).toBe(2);

    const types = response.adaptations.map((a) => a.type);
    expect(types).toContain("avatar_expression");
    expect(types).toContain("hint_offer");
    expect(types).toContain("topic_change");
    expect(types).toContain("pacing_change");
  });

  it("sets avatar to thinking", () => {
    const response = buildAdaptiveResponse(makeDetection("CONFUSED"));
    const avatarAdaptation = response.adaptations.find(
      (a) => a.type === "avatar_expression"
    );
    expect(avatarAdaptation?.avatarExpression).toBe("thinking");
  });

  it("slows pacing", () => {
    const response = buildAdaptiveResponse(makeDetection("CONFUSED"));
    const pacingAdaptation = response.adaptations.find(
      (a) => a.type === "pacing_change"
    );
    expect(pacingAdaptation?.pacingChange).toBe("slower");
  });
});

// ─── EXCITED Response ───

describe("Adaptive Response — EXCITED", () => {
  it("builds excitement response", () => {
    const response = buildAdaptiveResponse(makeDetection("EXCITED"));

    expect(response.triggeredBy).toBe("EXCITED");
    expect(response.priority).toBe(4);
    expect(response.triggerEmotionalCheck).toBe(false);

    const types = response.adaptations.map((a) => a.type);
    expect(types).toContain("avatar_expression");
    expect(types).toContain("celebration");
  });

  it("sets avatar to happy", () => {
    const response = buildAdaptiveResponse(makeDetection("EXCITED"));
    const avatarAdaptation = response.adaptations.find(
      (a) => a.type === "avatar_expression"
    );
    expect(avatarAdaptation?.avatarExpression).toBe("happy");
  });

  it("maintains difficulty", () => {
    const response = buildAdaptiveResponse(makeDetection("EXCITED"));
    const diffAdaptation = response.adaptations.find(
      (a) => a.type === "difficulty_change"
    );
    expect(diffAdaptation?.difficultyChange).toBe("maintain");
  });
});

// ─── ANXIOUS Response ───

describe("Adaptive Response — ANXIOUS", () => {
  it("builds anxiety response", () => {
    const response = buildAdaptiveResponse(makeDetection("ANXIOUS"));

    expect(response.triggeredBy).toBe("ANXIOUS");
    expect(response.priority).toBe(2);

    const types = response.adaptations.map((a) => a.type);
    expect(types).toContain("avatar_expression");
    expect(types).toContain("voice_adjustment");
    expect(types).toContain("encouragement");
    expect(types).toContain("difficulty_change");
  });

  it("sets calm voice", () => {
    const response = buildAdaptiveResponse(makeDetection("ANXIOUS"));
    const voiceAdaptation = response.adaptations.find(
      (a) => a.type === "voice_adjustment"
    );
    expect(voiceAdaptation?.voiceAdjustment?.mood).toBe("calm");
    expect(voiceAdaptation?.voiceAdjustment?.stability).toBeGreaterThan(0.7);
  });

  it("triggers emotional check for severe anxiety", () => {
    const response = buildAdaptiveResponse(makeDetection("ANXIOUS", 0.7));
    expect(response.triggerEmotionalCheck).toBe(true);
  });
});

// ─── BREAKTHROUGH Response ───

describe("Adaptive Response — BREAKTHROUGH", () => {
  it("builds breakthrough response", () => {
    const response = buildAdaptiveResponse(makeDetection("BREAKTHROUGH"));

    expect(response.triggeredBy).toBe("BREAKTHROUGH");
    expect(response.priority).toBe(1);
    expect(response.triggerEmotionalCheck).toBe(false);

    const types = response.adaptations.map((a) => a.type);
    expect(types).toContain("avatar_expression");
    expect(types).toContain("celebration");
  });

  it("sets avatar to happy", () => {
    const response = buildAdaptiveResponse(makeDetection("BREAKTHROUGH"));
    const avatarAdaptation = response.adaptations.find(
      (a) => a.type === "avatar_expression"
    );
    expect(avatarAdaptation?.avatarExpression).toBe("happy");
  });

  it("maintains difficulty", () => {
    const response = buildAdaptiveResponse(makeDetection("BREAKTHROUGH"));
    const diffAdaptation = response.adaptations.find(
      (a) => a.type === "difficulty_change"
    );
    expect(diffAdaptation?.difficultyChange).toBe("maintain");
  });
});

// ─── ENGAGED Response ───

describe("Adaptive Response — ENGAGED", () => {
  it("builds engaged response with minimal adaptations", () => {
    const response = buildAdaptiveResponse(makeDetection("ENGAGED"));

    expect(response.triggeredBy).toBe("ENGAGED");
    expect(response.priority).toBe(5);
    expect(response.triggerEmotionalCheck).toBe(false);
    expect(response.adaptations.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── NEUTRAL Response ───

describe("Adaptive Response — NEUTRAL", () => {
  it("builds neutral response with no adaptations", () => {
    const response = buildAdaptiveResponse(makeDetection("NEUTRAL"));

    expect(response.triggeredBy).toBe("NEUTRAL");
    expect(response.priority).toBe(5);
    expect(response.triggerEmotionalCheck).toBe(false);
    expect(response.adaptations).toHaveLength(0);
  });
});

// ─── All states produce valid responses ───

describe("Adaptive Response — all states", () => {
  const allStates: EmotionalStateValue[] = [
    "FRUSTRATED", "BORED", "CONFUSED", "EXCITED",
    "ANXIOUS", "BREAKTHROUGH", "ENGAGED", "NEUTRAL",
  ];

  for (const state of allStates) {
    it(`builds valid response for ${state}`, () => {
      const response = buildAdaptiveResponse(makeDetection(state));
      expect(response.triggeredBy).toBe(state);
      expect(typeof response.priority).toBe("number");
      expect(typeof response.triggerEmotionalCheck).toBe("boolean");
      expect(typeof response.description).toBe("string");
      expect(response.description.length).toBeGreaterThan(0);
      expect(Array.isArray(response.adaptations)).toBe(true);
    });
  }
});

// ─── Message Templates ───

describe("Message Templates", () => {
  const templateKeys = [
    "take_a_breath",
    "proactive_hint",
    "brain_blast_challenge",
    "try_different_explanation",
    "gentle_reassurance",
    "momentum_celebration",
    "breakthrough_celebration",
  ];

  for (const key of templateKeys) {
    it(`template "${key}" exists and generates text`, () => {
      expect(MESSAGE_TEMPLATES[key]).toBeDefined();
      const message = getAdaptationMessage(key, "Cosmo", "Alex");
      expect(message.length).toBeGreaterThan(0);
      expect(message).toContain("Alex"); // Student name should be in the message
    });
  }

  it("returns empty string for unknown template key", () => {
    const message = getAdaptationMessage("nonexistent_key", "Cosmo", "Alex");
    expect(message).toBe("");
  });
});

// ─── Avatar Expression Mapping ───

describe("getAvatarExpressionForState", () => {
  it("maps FRUSTRATED to encouraging", () => {
    expect(getAvatarExpressionForState("FRUSTRATED")).toBe("encouraging");
  });

  it("maps ANXIOUS to encouraging", () => {
    expect(getAvatarExpressionForState("ANXIOUS")).toBe("encouraging");
  });

  it("maps EXCITED to happy", () => {
    expect(getAvatarExpressionForState("EXCITED")).toBe("happy");
  });

  it("maps BREAKTHROUGH to happy", () => {
    expect(getAvatarExpressionForState("BREAKTHROUGH")).toBe("happy");
  });

  it("maps CONFUSED to thinking", () => {
    expect(getAvatarExpressionForState("CONFUSED")).toBe("thinking");
  });

  it("maps ENGAGED to neutral", () => {
    expect(getAvatarExpressionForState("ENGAGED")).toBe("neutral");
  });

  it("maps BORED to neutral", () => {
    expect(getAvatarExpressionForState("BORED")).toBe("neutral");
  });

  it("maps NEUTRAL to neutral", () => {
    expect(getAvatarExpressionForState("NEUTRAL")).toBe("neutral");
  });
});

// ─── Response Queue ───

describe("ResponseQueue", () => {
  let queue: ResponseQueue;

  beforeEach(() => {
    queue = new ResponseQueue();
  });

  it("starts empty", () => {
    expect(queue.hasPending()).toBe(false);
    expect(queue.size).toBe(0);
    expect(queue.dequeue()).toBeNull();
    expect(queue.peek()).toBeNull();
  });

  it("enqueues and dequeues responses", () => {
    const response = buildAdaptiveResponse(makeDetection("FRUSTRATED"));
    queue.enqueue(response);
    expect(queue.hasPending()).toBe(true);
    expect(queue.size).toBe(1);

    const dequeued = queue.dequeue();
    expect(dequeued?.triggeredBy).toBe("FRUSTRATED");
    expect(queue.hasPending()).toBe(false);
  });

  it("orders by priority (lower number = higher priority)", () => {
    const bored = buildAdaptiveResponse(makeDetection("BORED")); // priority 3
    const frustrated = buildAdaptiveResponse(makeDetection("FRUSTRATED")); // priority 1
    const excited = buildAdaptiveResponse(makeDetection("EXCITED")); // priority 4

    queue.enqueue(bored);
    queue.enqueue(excited);
    queue.enqueue(frustrated);

    expect(queue.dequeue()?.triggeredBy).toBe("FRUSTRATED"); // priority 1
    expect(queue.dequeue()?.triggeredBy).toBe("BORED"); // priority 3
    expect(queue.dequeue()?.triggeredBy).toBe("EXCITED"); // priority 4
  });

  it("replaces duplicate state responses", () => {
    const r1 = buildAdaptiveResponse(makeDetection("FRUSTRATED", 0.5));
    const r2 = buildAdaptiveResponse(makeDetection("FRUSTRATED", 0.8));

    queue.enqueue(r1);
    queue.enqueue(r2);

    expect(queue.size).toBe(1);
    const dequeued = queue.dequeue();
    expect(dequeued?.confidence).toBe(0.8); // Should be the second one
  });

  it("peek returns but does not remove", () => {
    queue.enqueue(buildAdaptiveResponse(makeDetection("CONFUSED")));
    const peeked = queue.peek();
    expect(peeked?.triggeredBy).toBe("CONFUSED");
    expect(queue.size).toBe(1); // Still there
  });

  it("clear empties the queue", () => {
    queue.enqueue(buildAdaptiveResponse(makeDetection("BORED")));
    queue.enqueue(buildAdaptiveResponse(makeDetection("CONFUSED")));
    queue.clear();
    expect(queue.hasPending()).toBe(false);
    expect(queue.size).toBe(0);
  });

  it("respects cooldown for same state", () => {
    const r1 = buildAdaptiveResponse(makeDetection("EXCITED"));
    const r2 = buildAdaptiveResponse(makeDetection("EXCITED"));

    queue.enqueue(r1);
    queue.dequeue(); // Process it (sets lastProcessed)

    const accepted = queue.enqueue(r2);
    expect(accepted).toBe(false); // Should be rejected (within cooldown)
  });

  it("allows different state after cooldown", () => {
    const r1 = buildAdaptiveResponse(makeDetection("EXCITED"));
    const r2 = buildAdaptiveResponse(makeDetection("FRUSTRATED"));

    queue.enqueue(r1);
    queue.dequeue();

    const accepted = queue.enqueue(r2);
    expect(accepted).toBe(true); // Different state, should be accepted
  });
});
