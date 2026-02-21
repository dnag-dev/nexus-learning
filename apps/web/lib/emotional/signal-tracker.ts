/**
 * Behavioral Signal Tracker — Phase 6: Emotional Intelligence Layer
 *
 * Collects and normalizes behavioral signals from the student during a session.
 * These signals are used by the State Detector to classify emotional state.
 *
 * Tracked signals:
 *  - Response time (ms) per question
 *  - Inter-keystroke timing (ms between keystrokes)
 *  - Attempt count per question
 *  - Hint usage pattern (count + frequency)
 *  - Consecutive correct/incorrect streaks
 *  - Pause duration (inactivity periods)
 *  - Session engagement (time on task vs idle)
 *  - Answer change frequency (how often student changes answer)
 */

// ─── Types ───

export type SignalType =
  | "response_time"
  | "keystroke_timing"
  | "attempt_count"
  | "hint_usage"
  | "consecutive_correct"
  | "consecutive_incorrect"
  | "pause_duration"
  | "answer_change"
  | "speed_trend"
  | "accuracy_trend";

export interface BehavioralSignal {
  type: SignalType;
  value: number;
  timestamp: Date;
  questionIndex: number;
  rawData?: Record<string, unknown>;
}

export interface SignalSnapshot {
  /** Average response time over last N questions (ms) */
  avgResponseTimeMs: number;
  /** Response time trend: positive = getting slower, negative = getting faster */
  responseTimeTrend: number;
  /** Average inter-keystroke interval (ms) — 0 if no keystrokes tracked */
  avgKeystrokeIntervalMs: number;
  /** Number of attempts on current question */
  currentAttemptCount: number;
  /** Total hints used this session */
  totalHintsUsed: number;
  /** Hints used in the last 3 questions */
  recentHintRate: number;
  /** Current streak of consecutive correct answers (0 if last was wrong) */
  consecutiveCorrect: number;
  /** Current streak of consecutive incorrect answers (0 if last was correct) */
  consecutiveIncorrect: number;
  /** Longest pause in last 2 minutes (ms) */
  longestRecentPauseMs: number;
  /** Number of answer changes on current question */
  answerChanges: number;
  /** Overall accuracy (0-1) for this session */
  sessionAccuracy: number;
  /** Number of questions answered */
  questionsAnswered: number;
  /** Speed relative to student's average: <1 = slower than normal, >1 = faster */
  relativeSpeed: number;
  /** Raw signals for persistence */
  signals: BehavioralSignal[];
}

// ─── Default empty snapshot ───

export const EMPTY_SNAPSHOT: SignalSnapshot = {
  avgResponseTimeMs: 0,
  responseTimeTrend: 0,
  avgKeystrokeIntervalMs: 0,
  currentAttemptCount: 0,
  totalHintsUsed: 0,
  recentHintRate: 0,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 0,
  longestRecentPauseMs: 0,
  answerChanges: 0,
  sessionAccuracy: 0,
  questionsAnswered: 0,
  relativeSpeed: 1,
  signals: [],
};

// ─── Signal Tracker Class ───

export class SignalTracker {
  private signals: BehavioralSignal[] = [];
  private responseTimes: number[] = [];
  private keystrokeIntervals: number[] = [];
  private correctSequence: boolean[] = [];
  private hintTimestamps: Date[] = [];
  private pauseDurations: number[] = [];
  private answerChangeCount = 0;
  private currentQuestionIndex = 0;
  private currentAttempts = 0;
  private questionStartTime: Date | null = null;
  private lastActivityTime: Date | null = null;
  private lastKeystrokeTime: Date | null = null;

  /** The pause threshold (ms) — pauses longer than this are tracked */
  private readonly PAUSE_THRESHOLD_MS = 10_000; // 10 seconds
  /** Window size for "recent" calculations */
  private readonly RECENT_WINDOW = 3;
  /** Window for speed trend calculation */
  private readonly TREND_WINDOW = 5;

  // ─── Recording Methods ───

  /**
   * Start timing a new question.
   */
  startQuestion(questionIndex: number): void {
    this.currentQuestionIndex = questionIndex;
    this.questionStartTime = new Date();
    this.currentAttempts = 0;
    this.answerChangeCount = 0;
    this.lastActivityTime = new Date();
    this.lastKeystrokeTime = null;
  }

  /**
   * Record a keystroke event — used to compute inter-keystroke timing.
   */
  recordKeystroke(): void {
    const now = new Date();
    if (this.lastKeystrokeTime) {
      const interval = now.getTime() - this.lastKeystrokeTime.getTime();
      this.keystrokeIntervals.push(interval);

      this.addSignal({
        type: "keystroke_timing",
        value: interval,
        timestamp: now,
        questionIndex: this.currentQuestionIndex,
      });
    }
    this.lastKeystrokeTime = now;
    this.recordActivity();
  }

  /**
   * Record an answer submission (correct or incorrect).
   */
  recordAnswer(correct: boolean): void {
    const now = new Date();
    this.currentAttempts++;

    // Record response time
    if (this.questionStartTime) {
      const responseTime = now.getTime() - this.questionStartTime.getTime();
      this.responseTimes.push(responseTime);

      this.addSignal({
        type: "response_time",
        value: responseTime,
        timestamp: now,
        questionIndex: this.currentQuestionIndex,
        rawData: { correct, attemptNumber: this.currentAttempts },
      });
    }

    // Track correctness sequence
    this.correctSequence.push(correct);

    // Record attempt count
    this.addSignal({
      type: "attempt_count",
      value: this.currentAttempts,
      timestamp: now,
      questionIndex: this.currentQuestionIndex,
    });

    this.recordActivity();
  }

  /**
   * Record a hint request.
   */
  recordHintUsed(): void {
    const now = new Date();
    this.hintTimestamps.push(now);

    this.addSignal({
      type: "hint_usage",
      value: this.hintTimestamps.length,
      timestamp: now,
      questionIndex: this.currentQuestionIndex,
    });

    this.recordActivity();
  }

  /**
   * Record an answer change (student changed their selection).
   */
  recordAnswerChange(): void {
    this.answerChangeCount++;
    const now = new Date();

    this.addSignal({
      type: "answer_change",
      value: this.answerChangeCount,
      timestamp: now,
      questionIndex: this.currentQuestionIndex,
    });

    this.recordActivity();
  }

  /**
   * Record generic activity (used for pause detection).
   */
  recordActivity(): void {
    const now = new Date();
    if (this.lastActivityTime) {
      const gap = now.getTime() - this.lastActivityTime.getTime();
      if (gap > this.PAUSE_THRESHOLD_MS) {
        this.pauseDurations.push(gap);

        this.addSignal({
          type: "pause_duration",
          value: gap,
          timestamp: now,
          questionIndex: this.currentQuestionIndex,
        });
      }
    }
    this.lastActivityTime = now;
  }

  // ─── Computed Snapshot ───

  /**
   * Get a snapshot of all current behavioral signals, computed and normalized.
   */
  getSnapshot(): SignalSnapshot {
    const avgResponseTimeMs = this.computeAverage(this.responseTimes);
    const responseTimeTrend = this.computeTrend(this.responseTimes);
    const avgKeystrokeIntervalMs = this.computeAverage(this.keystrokeIntervals);
    const { consecutiveCorrect, consecutiveIncorrect } = this.computeStreaks();
    const recentHintRate = this.computeRecentHintRate();
    const longestRecentPauseMs = this.computeLongestRecentPause();
    const sessionAccuracy = this.computeAccuracy();
    const relativeSpeed = this.computeRelativeSpeed();

    return {
      avgResponseTimeMs,
      responseTimeTrend,
      avgKeystrokeIntervalMs,
      currentAttemptCount: this.currentAttempts,
      totalHintsUsed: this.hintTimestamps.length,
      recentHintRate,
      consecutiveCorrect,
      consecutiveIncorrect,
      longestRecentPauseMs,
      answerChanges: this.answerChangeCount,
      sessionAccuracy,
      questionsAnswered: this.correctSequence.length,
      relativeSpeed,
      signals: [...this.signals],
    };
  }

  /**
   * Reset the tracker for a new session.
   */
  reset(): void {
    this.signals = [];
    this.responseTimes = [];
    this.keystrokeIntervals = [];
    this.correctSequence = [];
    this.hintTimestamps = [];
    this.pauseDurations = [];
    this.answerChangeCount = 0;
    this.currentQuestionIndex = 0;
    this.currentAttempts = 0;
    this.questionStartTime = null;
    this.lastActivityTime = null;
    this.lastKeystrokeTime = null;
  }

  // ─── Private Helpers ───

  private addSignal(signal: BehavioralSignal): void {
    this.signals.push(signal);
  }

  private computeAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Compute a linear trend over the last TREND_WINDOW values.
   * Positive = increasing (getting slower/worse), Negative = decreasing (getting faster/better).
   * Returns change per question (ms/question for response time).
   */
  private computeTrend(values: number[]): number {
    const window = values.slice(-this.TREND_WINDOW);
    if (window.length < 2) return 0;

    // Simple linear regression: slope of the trend line
    const n = window.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += window[i];
      sumXY += i * window[i];
      sumXX += i * i;
    }
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return 0;
    return (n * sumXY - sumX * sumY) / denom;
  }

  /**
   * Compute consecutive correct/incorrect streaks from the end.
   */
  private computeStreaks(): { consecutiveCorrect: number; consecutiveIncorrect: number } {
    if (this.correctSequence.length === 0) {
      return { consecutiveCorrect: 0, consecutiveIncorrect: 0 };
    }

    const last = this.correctSequence[this.correctSequence.length - 1];
    let count = 0;
    for (let i = this.correctSequence.length - 1; i >= 0; i--) {
      if (this.correctSequence[i] === last) {
        count++;
      } else {
        break;
      }
    }

    return last
      ? { consecutiveCorrect: count, consecutiveIncorrect: 0 }
      : { consecutiveCorrect: 0, consecutiveIncorrect: count };
  }

  /**
   * Compute the hint usage rate over the last RECENT_WINDOW questions.
   * Returns a value 0-1 (fraction of recent questions where hints were used).
   */
  private computeRecentHintRate(): number {
    if (this.correctSequence.length === 0) return 0;

    const recentQuestionCount = Math.min(this.RECENT_WINDOW, this.correctSequence.length);
    const cutoffIndex = this.correctSequence.length - recentQuestionCount;

    // Count hints used on questions >= cutoffIndex
    const recentHints = this.signals.filter(
      (s) => s.type === "hint_usage" && s.questionIndex >= cutoffIndex
    );

    // Deduplicate by question index (multiple hint requests per question count as 1)
    const uniqueQuestions = new Set(recentHints.map((s) => s.questionIndex));
    return uniqueQuestions.size / recentQuestionCount;
  }

  /**
   * Get the longest pause in the last 2 minutes.
   */
  private computeLongestRecentPause(): number {
    const twoMinAgo = Date.now() - 2 * 60 * 1000;
    const recentPauses = this.signals
      .filter((s) => s.type === "pause_duration" && s.timestamp.getTime() > twoMinAgo)
      .map((s) => s.value);

    return recentPauses.length > 0 ? Math.max(...recentPauses) : 0;
  }

  /**
   * Compute session accuracy (0-1).
   */
  private computeAccuracy(): number {
    if (this.correctSequence.length === 0) return 0;
    const correct = this.correctSequence.filter(Boolean).length;
    return correct / this.correctSequence.length;
  }

  /**
   * Compute speed relative to the student's average.
   * Returns <1 if slower than average, >1 if faster.
   */
  private computeRelativeSpeed(): number {
    if (this.responseTimes.length < 2) return 1;

    const overallAvg = this.computeAverage(this.responseTimes);
    const recent = this.responseTimes.slice(-this.RECENT_WINDOW);
    const recentAvg = this.computeAverage(recent);

    if (recentAvg === 0) return 1;
    // Invert: if recent is slower (higher ms), ratio < 1
    return overallAvg / recentAvg;
  }
}

// ─── Singleton for server-side use ───

const trackers = new Map<string, SignalTracker>();

/**
 * Get or create a signal tracker for a session.
 */
export function getTracker(sessionId: string): SignalTracker {
  let tracker = trackers.get(sessionId);
  if (!tracker) {
    tracker = new SignalTracker();
    trackers.set(sessionId, tracker);
  }
  return tracker;
}

/**
 * Remove a tracker when a session ends.
 */
export function removeTracker(sessionId: string): void {
  trackers.delete(sessionId);
}

/**
 * Get all active tracker session IDs (for debugging/monitoring).
 */
export function getActiveTrackerIds(): string[] {
  return Array.from(trackers.keys());
}
