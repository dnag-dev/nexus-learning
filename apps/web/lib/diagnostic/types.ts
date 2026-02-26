export interface DiagnosticQuestion {
  questionId: string;
  nodeCode: string;
  nodeTitle: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
  questionText: string;
  options: DiagnosticOption[];
  hint?: string;
}

export interface DiagnosticOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface DiagnosticResponse {
  questionId: string;
  nodeCode: string;
  selectedOptionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  questionIndex: number;
}

/**
 * Represents a node in the ordered search space for binary search.
 * Used both for the default hardcoded list and for goal-aware dynamic lists.
 */
export interface OrderedNode {
  nodeCode: string;
  grade: number;
  difficulty: number;
  title?: string;
  domain?: string;
}

export interface DiagnosticState {
  sessionId: string;
  studentId: string;
  totalQuestions: number;
  questionsAnswered: number;
  responses: DiagnosticResponse[];
  currentNodeCode: string | null;
  searchLow: number;
  searchHigh: number;
  confirmedMastered: string[];
  confirmedUnmastered: string[];
  status: "in_progress" | "complete";
  /** Goal-aware mode fields */
  goalId?: string;
  goalName?: string;
  /** Dynamic ordered node list for goal-aware mode (overrides hardcoded ORDERED_NODES) */
  orderedNodes?: OrderedNode[];
}

export interface PlacementResult {
  frontierNodeCode: string;
  frontierNodeTitle: string;
  gradeEstimate: number;
  confidence: number;
  masteredNodes: string[];
  gapNodes: string[];
  recommendedStartNode: string;
  totalCorrect: number;
  totalQuestions: number;
  summary: string;
}

/**
 * Skill map entry — one per concept in the goal's required node list.
 * Shows mastery status and estimated hours to learn.
 */
export interface SkillMapEntry {
  nodeCode: string;
  title: string;
  domain: string;
  gradeLevel: string;
  difficulty: number;
  status: "mastered" | "gap" | "untested" | "in_progress";
  bktProbability: number;
  estimatedHoursToLearn: number;
  /** True if this concept was tested during the diagnostic */
  wasTested: boolean;
  /** True if answered correctly during diagnostic */
  wasCorrect?: boolean;
}

/**
 * Full skill map result for goal-aware diagnostic mode.
 */
export interface SkillMapResult {
  goalId: string;
  goalName: string;
  sessionId: string;
  studentId: string;
  /** All concepts in the goal, with mastery status */
  entries: SkillMapEntry[];
  /** Summary stats */
  totalConcepts: number;
  masteredCount: number;
  gapCount: number;
  untestedCount: number;
  totalEstimatedHours: number;
  /** Estimated hours for just the unmastered concepts */
  remainingEstimatedHours: number;
  /** Claude-generated narrative about the skill map */
  narrative: string;
  /** Completion percentage (mastered / total) */
  completionPercentage: number;
}
