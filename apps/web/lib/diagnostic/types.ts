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
