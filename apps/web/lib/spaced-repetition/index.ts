/**
 * Spaced Repetition — Phase 8
 *
 * Barrel file re-exporting all spaced repetition modules.
 */

export {
  calculateNextReview,
  getEasinessFactor,
  getDueNodes,
  getOverdueNodes,
  getUpcomingReviews,
  addDays,
  MIN_EASINESS,
  MAX_EASINESS,
  DEFAULT_EASINESS,
  EASINESS_DECREMENT,
  FIXED_INTERVALS,
  type SchedulerInput,
  type SchedulerResult,
  type ReviewForecast,
} from "./scheduler";

export {
  buildReviewSession,
  processReviewAnswer,
  getReviewSummary,
  REVIEW_XP,
  type ReviewSession,
  type ReviewNode,
  type ReviewResult,
  type ReviewSummary,
} from "./review-engine";

export {
  getDueReviewSummary,
  createReviewReminder,
  markNotificationSeen,
  getUnreadNotifications,
  type DueReviewSummary,
  type NotificationData,
} from "./notifications";

export {
  checkReviewsOnSessionStart,
  calculateDueNodes,
  type ReviewSuggestion,
} from "./scheduler-job";
