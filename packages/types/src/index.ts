// ─── Enums ───

export const SessionState = {
  IDLE: "IDLE",
  DIAGNOSTIC: "DIAGNOSTIC",
  TEACHING: "TEACHING",
  PRACTICE: "PRACTICE",
  HINT_REQUESTED: "HINT_REQUESTED",
  STRUGGLING: "STRUGGLING",
  CELEBRATING: "CELEBRATING",
  BOSS_CHALLENGE: "BOSS_CHALLENGE",
  REVIEW: "REVIEW",
  EMOTIONAL_CHECK: "EMOTIONAL_CHECK",
  COMPLETED: "COMPLETED",
} as const;

export type SessionStateType = (typeof SessionState)[keyof typeof SessionState];

export const MasteryLevel = {
  NOVICE: "NOVICE",
  DEVELOPING: "DEVELOPING",
  PROFICIENT: "PROFICIENT",
  ADVANCED: "ADVANCED",
  MASTERED: "MASTERED",
} as const;

export type MasteryLevelType = (typeof MasteryLevel)[keyof typeof MasteryLevel];

export const EmotionalState = {
  ENGAGED: "ENGAGED",
  FRUSTRATED: "FRUSTRATED",
  BORED: "BORED",
  CONFUSED: "CONFUSED",
  EXCITED: "EXCITED",
  NEUTRAL: "NEUTRAL",
} as const;

export type EmotionalStateType =
  (typeof EmotionalState)[keyof typeof EmotionalState];

export const AgeGroup = {
  EARLY_5_7: "EARLY_5_7",
  MID_8_10: "MID_8_10",
  UPPER_11_12: "UPPER_11_12",
} as const;

export type AgeGroupType = (typeof AgeGroup)[keyof typeof AgeGroup];

export const GradeLevel = {
  K: "K",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
} as const;

export type GradeLevelType = (typeof GradeLevel)[keyof typeof GradeLevel];

export const KnowledgeDomain = {
  COUNTING: "COUNTING",
  OPERATIONS: "OPERATIONS",
  GEOMETRY: "GEOMETRY",
  MEASUREMENT: "MEASUREMENT",
  DATA: "DATA",
} as const;

export type KnowledgeDomainType =
  (typeof KnowledgeDomain)[keyof typeof KnowledgeDomain];

export const UserRole = {
  PARENT: "PARENT",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const SubscriptionPlan = {
  SPARK: "SPARK",
  PRO: "PRO",
  FAMILY: "FAMILY",
  ANNUAL: "ANNUAL",
} as const;

export type SubscriptionPlanType =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  CANCELED: "CANCELED",
  PAST_DUE: "PAST_DUE",
  TRIALING: "TRIALING",
} as const;

export type SubscriptionStatusType =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

// ─── Persona IDs ───

export type PersonaId =
  | "cosmo"
  | "luna"
  | "rex"
  | "nova"
  | "pip"
  | "atlas"
  | "zara"
  | "finn"
  | "echo"
  | "sage"
  | "bolt"
  | "ivy"
  | "max"
  | "aria";

// ─── Model Interfaces ───

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRoleType;
  createdAt: Date;
  updatedAt: Date;
  children?: Student[];
  subscription?: Subscription | null;
}

export interface Student {
  id: string;
  displayName: string;
  avatarPersonaId: PersonaId;
  gradeLevel: GradeLevelType;
  ageGroup: AgeGroupType;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
  parent?: User;
  sessions?: LearningSession[];
  masteryScores?: MasteryScore[];
  emotionalLogs?: EmotionalLog[];
  streakData?: StreakData | null;
}

export interface KnowledgeNode {
  id: string;
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: GradeLevelType;
  domain: KnowledgeDomainType;
  difficulty: number;
  prerequisites?: KnowledgeNode[];
  successors?: KnowledgeNode[];
}

export interface LearningSession {
  id: string;
  studentId: string;
  state: SessionStateType;
  currentNodeId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number;
  questionsAnswered: number;
  correctAnswers: number;
  hintsUsed: number;
  emotionalStateAtStart: EmotionalStateType | null;
  emotionalStateAtEnd: EmotionalStateType | null;
  student?: Student;
}

export interface MasteryScore {
  id: string;
  studentId: string;
  nodeId: string;
  level: MasteryLevelType;
  bktProbability: number;
  practiceCount: number;
  correctCount: number;
  lastPracticed: Date;
  nextReviewAt: Date | null;
  student?: Student;
  node?: KnowledgeNode;
}

export interface EmotionalLog {
  id: string;
  studentId: string;
  sessionId: string;
  detectedState: EmotionalStateType;
  confidence: number;
  triggeredAdaptation: boolean;
  timestamp: Date;
  student?: Student;
  session?: LearningSession;
}

export interface StreakData {
  id: string;
  studentId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  totalDaysActive: number;
  student?: Student;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlanType;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatusType;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  user?: User;
}

// ─── Neo4j Knowledge Graph Types ───

export interface KnowledgeGraphNode {
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
}

export interface KnowledgeGraphEdge {
  from: string;
  to: string;
  relationship: "PREREQUISITE_OF";
}

export interface LearningPath {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  totalDifficulty: number;
}
