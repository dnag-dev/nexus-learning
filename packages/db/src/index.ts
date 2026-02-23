export { PrismaClient } from "@prisma/client";
export type {
  User,
  Student,
  KnowledgeNode,
  LearningSession,
  MasteryScore,
  EmotionalLog,
  StreakData,
  Subscription,
  WebhookLog,
} from "@prisma/client";

// Re-export Prisma enums
export {
  UserRole,
  GradeLevel,
  AgeGroup,
  KnowledgeDomain,
  SessionState,
  MasteryLevel,
  EmotionalState,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";

// Prisma singleton for Next.js (avoids multiple instances in dev)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Neo4j exports
export {
  getNeo4jDriver,
  getSession as getNeo4jSession,
  closeNeo4j,
  verifyConnectivity as verifyNeo4jConnectivity,
  isNeo4jAvailable,
} from "../neo4j/neo4j-client";

export {
  getPrerequisites,
  getSuccessors,
  getShortestLearningPath,
  getNodesByGradeAndDomain,
  getNodeByCode,
  getAllNodes,
} from "../neo4j/knowledge-graph.queries";
