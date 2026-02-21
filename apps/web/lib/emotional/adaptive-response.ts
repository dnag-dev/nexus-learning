/**
 * Adaptive Response Engine — Phase 6: Emotional Intelligence Layer
 *
 * Maps detected emotional states to concrete adaptations:
 *  - Avatar expression changes
 *  - Voice tone adjustments
 *  - Difficulty changes
 *  - UI interventions (break suggestions, celebrations, encouragement)
 *  - Session state transitions (trigger EMOTIONAL_CHECK)
 *
 * Each adaptation is a data-driven recommendation that the session
 * orchestrator and UI can act upon.
 */

import type { EmotionalStateValue, DetectionResult } from "./state-detector";
import type { AvatarEmotionalState } from "@/components/persona/AvatarDisplay";

// ─── Types ───

export type AdaptationType =
  | "avatar_expression"
  | "voice_adjustment"
  | "difficulty_change"
  | "encouragement"
  | "break_suggestion"
  | "celebration"
  | "pacing_change"
  | "hint_offer"
  | "topic_change"
  | "emotional_checkin";

export type DifficultyAdjustment = "decrease" | "maintain" | "increase";
export type PacingAdjustment = "slower" | "maintain" | "faster";

export interface VoiceAdjustment {
  /** ElevenLabs stability parameter adjustment (0-1) */
  stability: number;
  /** Speaking rate multiplier (0.5=half speed, 1=normal, 1.5=fast) */
  rateMultiplier: number;
  /** Description of the voice mood */
  mood: "warm" | "excited" | "calm" | "encouraging" | "neutral";
}

export interface AdaptiveResponse {
  /** The emotional state that triggered this response */
  triggeredBy: EmotionalStateValue;
  /** Confidence of the detection */
  confidence: number;
  /** List of adaptations to apply */
  adaptations: Adaptation[];
  /** Whether to trigger an EMOTIONAL_CHECK state transition */
  triggerEmotionalCheck: boolean;
  /** Priority (1=highest, 5=lowest) for ordering when multiple responses queue */
  priority: number;
  /** A short description of the response for logging */
  description: string;
}

export interface Adaptation {
  type: AdaptationType;
  /** Avatar emotional state to set */
  avatarExpression?: AvatarEmotionalState;
  /** Voice adjustment parameters */
  voiceAdjustment?: VoiceAdjustment;
  /** Difficulty adjustment direction */
  difficultyChange?: DifficultyAdjustment;
  /** Pacing adjustment direction */
  pacingChange?: PacingAdjustment;
  /** Text message to show the student (in persona voice) */
  message?: string;
  /** Whether this is a persistent change (lasts rest of session) or momentary */
  persistent: boolean;
}

// ─── Response Protocols ───

/**
 * FRUSTRATION Protocol:
 * - Lower avatar to encouraging expression
 * - Soften voice (higher stability, slower rate)
 * - Decrease difficulty
 * - Offer hint proactively
 * - If severe, trigger emotional check-in
 */
function buildFrustrationResponse(detection: DetectionResult): AdaptiveResponse {
  const severe = detection.confidence >= 0.6;
  const adaptations: Adaptation[] = [
    {
      type: "avatar_expression",
      avatarExpression: "encouraging",
      persistent: true,
    },
    {
      type: "voice_adjustment",
      voiceAdjustment: {
        stability: 0.7,
        rateMultiplier: 0.85,
        mood: "warm",
      },
      persistent: true,
    },
    {
      type: "difficulty_change",
      difficultyChange: "decrease",
      persistent: true,
    },
    {
      type: "encouragement",
      message: "take_a_breath",
      persistent: false,
    },
    {
      type: "hint_offer",
      message: "proactive_hint",
      persistent: false,
    },
  ];

  if (severe) {
    adaptations.push({
      type: "pacing_change",
      pacingChange: "slower",
      persistent: true,
    });
  }

  return {
    triggeredBy: "FRUSTRATED",
    confidence: detection.confidence,
    adaptations,
    triggerEmotionalCheck: severe,
    priority: 1,
    description: severe
      ? "Severe frustration detected — emotional check-in triggered"
      : "Frustration detected — lowering difficulty and offering support",
  };
}

/**
 * BOREDOM Protocol:
 * - Increase challenge level
 * - Speed up pacing
 * - Offer a "Brain Blast" or boss challenge
 * - Make voice more energetic
 */
function buildBoredomResponse(detection: DetectionResult): AdaptiveResponse {
  const adaptations: Adaptation[] = [
    {
      type: "avatar_expression",
      avatarExpression: "happy",
      persistent: false,
    },
    {
      type: "voice_adjustment",
      voiceAdjustment: {
        stability: 0.4,
        rateMultiplier: 1.15,
        mood: "excited",
      },
      persistent: true,
    },
    {
      type: "difficulty_change",
      difficultyChange: "increase",
      persistent: true,
    },
    {
      type: "pacing_change",
      pacingChange: "faster",
      persistent: true,
    },
    {
      type: "encouragement",
      message: "brain_blast_challenge",
      persistent: false,
    },
  ];

  return {
    triggeredBy: "BORED",
    confidence: detection.confidence,
    adaptations,
    triggerEmotionalCheck: false,
    priority: 3,
    description: "Boredom detected — increasing challenge and energy",
  };
}

/**
 * CONFUSED Protocol:
 * - Keep avatar encouraging
 * - Slow down voice
 * - Offer a different explanation approach
 * - Proactively offer hint
 */
function buildConfusedResponse(detection: DetectionResult): AdaptiveResponse {
  const adaptations: Adaptation[] = [
    {
      type: "avatar_expression",
      avatarExpression: "thinking",
      persistent: false,
    },
    {
      type: "voice_adjustment",
      voiceAdjustment: {
        stability: 0.6,
        rateMultiplier: 0.9,
        mood: "calm",
      },
      persistent: true,
    },
    {
      type: "pacing_change",
      pacingChange: "slower",
      persistent: true,
    },
    {
      type: "hint_offer",
      message: "proactive_hint",
      persistent: false,
    },
    {
      type: "topic_change",
      message: "try_different_explanation",
      persistent: false,
    },
  ];

  return {
    triggeredBy: "CONFUSED",
    confidence: detection.confidence,
    adaptations,
    triggerEmotionalCheck: false,
    priority: 2,
    description: "Confusion detected — offering clarification and slowing pace",
  };
}

/**
 * EXCITED Protocol:
 * - Show happy avatar
 * - Match excitement with energetic voice
 * - Maintain or slightly increase difficulty
 * - Celebrate momentum
 */
function buildExcitedResponse(detection: DetectionResult): AdaptiveResponse {
  const adaptations: Adaptation[] = [
    {
      type: "avatar_expression",
      avatarExpression: "happy",
      persistent: false,
    },
    {
      type: "voice_adjustment",
      voiceAdjustment: {
        stability: 0.35,
        rateMultiplier: 1.1,
        mood: "excited",
      },
      persistent: false,
    },
    {
      type: "celebration",
      message: "momentum_celebration",
      persistent: false,
    },
    {
      type: "difficulty_change",
      difficultyChange: "maintain",
      persistent: false,
    },
  ];

  return {
    triggeredBy: "EXCITED",
    confidence: detection.confidence,
    adaptations,
    triggerEmotionalCheck: false,
    priority: 4,
    description: "Excitement detected — matching energy and celebrating momentum",
  };
}

/**
 * ANXIOUS Protocol:
 * - Warm, calm avatar expression
 * - Very calm voice
 * - Slightly easier questions
 * - Gentle encouragement
 * - If severe, emotional check-in
 */
function buildAnxiousResponse(detection: DetectionResult): AdaptiveResponse {
  const severe = detection.confidence >= 0.6;
  const adaptations: Adaptation[] = [
    {
      type: "avatar_expression",
      avatarExpression: "encouraging",
      persistent: true,
    },
    {
      type: "voice_adjustment",
      voiceAdjustment: {
        stability: 0.8,
        rateMultiplier: 0.8,
        mood: "calm",
      },
      persistent: true,
    },
    {
      type: "encouragement",
      message: "gentle_reassurance",
      persistent: false,
    },
    {
      type: "difficulty_change",
      difficultyChange: "decrease",
      persistent: false,
    },
  ];

  return {
    triggeredBy: "ANXIOUS",
    confidence: detection.confidence,
    adaptations,
    triggerEmotionalCheck: severe,
    priority: 2,
    description: severe
      ? "Significant anxiety detected — emotional check-in triggered"
      : "Anxiety detected — calming pace and offering reassurance",
  };
}

/**
 * BREAKTHROUGH Protocol:
 * - Celebration mode!
 * - Excited avatar
 * - Energetic voice
 * - Maintain difficulty (they're getting it!)
 * - Big celebration message
 * - Notify parent of breakthrough
 */
function buildBreakthroughResponse(detection: DetectionResult): AdaptiveResponse {
  const adaptations: Adaptation[] = [
    {
      type: "avatar_expression",
      avatarExpression: "happy",
      persistent: false,
    },
    {
      type: "voice_adjustment",
      voiceAdjustment: {
        stability: 0.3,
        rateMultiplier: 1.15,
        mood: "excited",
      },
      persistent: false,
    },
    {
      type: "celebration",
      message: "breakthrough_celebration",
      persistent: false,
    },
    {
      type: "difficulty_change",
      difficultyChange: "maintain",
      persistent: false,
    },
  ];

  return {
    triggeredBy: "BREAKTHROUGH",
    confidence: detection.confidence,
    adaptations,
    triggerEmotionalCheck: false,
    priority: 1,
    description: "Breakthrough moment! Student is overcoming difficulty.",
  };
}

/**
 * ENGAGED Protocol (no intervention needed):
 * - Neutral/happy avatar
 * - Normal voice
 * - Maintain current settings
 */
function buildEngagedResponse(detection: DetectionResult): AdaptiveResponse {
  return {
    triggeredBy: "ENGAGED",
    confidence: detection.confidence,
    adaptations: [
      {
        type: "avatar_expression",
        avatarExpression: "neutral",
        persistent: false,
      },
      {
        type: "voice_adjustment",
        voiceAdjustment: {
          stability: 0.5,
          rateMultiplier: 1.0,
          mood: "neutral",
        },
        persistent: false,
      },
    ],
    triggerEmotionalCheck: false,
    priority: 5,
    description: "Student is engaged — maintaining current settings",
  };
}

/**
 * NEUTRAL Protocol (default):
 */
function buildNeutralResponse(detection: DetectionResult): AdaptiveResponse {
  return {
    triggeredBy: "NEUTRAL",
    confidence: detection.confidence,
    adaptations: [],
    triggerEmotionalCheck: false,
    priority: 5,
    description: "Neutral state — no adaptation needed",
  };
}

// ─── Main Response Builder ───

/**
 * Build an adaptive response for a detected emotional state.
 */
export function buildAdaptiveResponse(detection: DetectionResult): AdaptiveResponse {
  switch (detection.state) {
    case "FRUSTRATED":
      return buildFrustrationResponse(detection);
    case "BORED":
      return buildBoredomResponse(detection);
    case "CONFUSED":
      return buildConfusedResponse(detection);
    case "EXCITED":
      return buildExcitedResponse(detection);
    case "ANXIOUS":
      return buildAnxiousResponse(detection);
    case "BREAKTHROUGH":
      return buildBreakthroughResponse(detection);
    case "ENGAGED":
      return buildEngagedResponse(detection);
    case "NEUTRAL":
      return buildNeutralResponse(detection);
  }
}

// ─── Message Templates ───

/**
 * Persona-aware encouragement message templates.
 * The message key from Adaptation.message maps to a template generator.
 */
export type MessageTemplate = (personaName: string, studentName: string) => string;

export const MESSAGE_TEMPLATES: Record<string, MessageTemplate> = {
  take_a_breath: (persona, student) =>
    `Hey ${student}, ${persona} here! Let's take a quick breath together. This stuff can be tricky, and that's totally okay. We'll figure it out together!`,

  proactive_hint: (persona, student) =>
    `${student}, I have a helpful hint that might make this clearer. Want to see it?`,

  brain_blast_challenge: (persona, student) =>
    `Whoa ${student}, you're crushing it! Want to try a Brain Blast challenge? It's like a bonus round — extra tricky!`,

  try_different_explanation: (persona, student) =>
    `Hmm, let me try explaining this differently, ${student}. Sometimes seeing it from another angle makes it click!`,

  gentle_reassurance: (persona, student) =>
    `${student}, there's absolutely no rush. Take your time. ${persona} believes in you!`,

  momentum_celebration: (persona, student) =>
    `${student}, you're on FIRE! Look at that streak! Keep it going!`,

  breakthrough_celebration: (persona, student) =>
    `OH WOW ${student}! Did you feel that?! Something just CLICKED! You went from struggling to nailing it — that's what a real breakthrough feels like!`,
};

/**
 * Get a formatted message for a given template key.
 */
export function getAdaptationMessage(
  messageKey: string,
  personaName: string,
  studentName: string
): string {
  const template = MESSAGE_TEMPLATES[messageKey];
  if (!template) return "";
  return template(personaName, studentName);
}

// ─── Avatar Expression Mapping ───

/**
 * Map emotional states to avatar expressions for the AvatarDisplay component.
 */
export function getAvatarExpressionForState(state: EmotionalStateValue): AvatarEmotionalState {
  switch (state) {
    case "FRUSTRATED":
    case "ANXIOUS":
      return "encouraging";
    case "EXCITED":
    case "BREAKTHROUGH":
      return "happy";
    case "CONFUSED":
      return "thinking";
    case "BORED":
    case "ENGAGED":
    case "NEUTRAL":
      return "neutral";
  }
}

// ─── Response Queue ───

/**
 * Manages a queue of adaptive responses, ordered by priority.
 * Prevents duplicate responses and ensures the most important
 * adaptation is applied first.
 */
export class ResponseQueue {
  private queue: AdaptiveResponse[] = [];
  private lastProcessedState: EmotionalStateValue | null = null;
  private lastProcessedAt: Date | null = null;
  /** Minimum time between adaptations (ms) to prevent flapping */
  private readonly COOLDOWN_MS = 15_000; // 15 seconds

  /**
   * Add a response to the queue.
   * Returns true if the response was accepted (not a duplicate/cooldown).
   */
  enqueue(response: AdaptiveResponse): boolean {
    // Check cooldown
    if (this.lastProcessedAt) {
      const elapsed = Date.now() - this.lastProcessedAt.getTime();
      if (elapsed < this.COOLDOWN_MS && response.triggeredBy === this.lastProcessedState) {
        return false; // Too soon for the same state
      }
    }

    // Remove any existing response for the same state
    this.queue = this.queue.filter(
      (r) => r.triggeredBy !== response.triggeredBy
    );

    // Add and sort by priority (1 = highest)
    this.queue.push(response);
    this.queue.sort((a, b) => a.priority - b.priority);

    return true;
  }

  /**
   * Get and remove the highest-priority response from the queue.
   */
  dequeue(): AdaptiveResponse | null {
    const response = this.queue.shift() ?? null;
    if (response) {
      this.lastProcessedState = response.triggeredBy;
      this.lastProcessedAt = new Date();
    }
    return response;
  }

  /**
   * Peek at the next response without removing it.
   */
  peek(): AdaptiveResponse | null {
    return this.queue[0] ?? null;
  }

  /**
   * Check if the queue has any pending responses.
   */
  hasPending(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Clear the queue.
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get the current queue size.
   */
  get size(): number {
    return this.queue.length;
  }
}
