/**
 * Emotional Intelligence Layer — Phase 6
 *
 * Re-exports all emotional intelligence modules for clean imports.
 */

export {
  SignalTracker,
  getTracker,
  removeTracker,
  getActiveTrackerIds,
  EMPTY_SNAPSHOT,
  type BehavioralSignal,
  type SignalSnapshot,
  type SignalType,
} from "./signal-tracker";

export {
  detectEmotionalState,
  shouldTriggerAdaptation,
  getEmotionalStateLabel,
  DETECTION_THRESHOLDS,
  type EmotionalStateValue,
  type DetectionResult,
} from "./state-detector";

export {
  buildAdaptiveResponse,
  getAdaptationMessage,
  getAvatarExpressionForState,
  ResponseQueue,
  MESSAGE_TEMPLATES,
  type AdaptiveResponse,
  type Adaptation,
  type AdaptationType,
  type DifficultyAdjustment,
  type PacingAdjustment,
  type VoiceAdjustment,
} from "./adaptive-response";
