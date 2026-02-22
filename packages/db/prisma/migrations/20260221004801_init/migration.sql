-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('K', 'G1', 'G2', 'G3', 'G4', 'G5');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('EARLY_5_7', 'MID_8_10', 'UPPER_11_12');

-- CreateEnum
CREATE TYPE "KnowledgeDomain" AS ENUM ('COUNTING', 'OPERATIONS', 'GEOMETRY', 'MEASUREMENT', 'DATA');

-- CreateEnum
CREATE TYPE "SessionState" AS ENUM ('IDLE', 'DIAGNOSTIC', 'TEACHING', 'PRACTICE', 'HINT_REQUESTED', 'STRUGGLING', 'CELEBRATING', 'BOSS_CHALLENGE', 'REVIEW', 'EMOTIONAL_CHECK', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('NOVICE', 'DEVELOPING', 'PROFICIENT', 'ADVANCED', 'MASTERED');

-- CreateEnum
CREATE TYPE "EmotionalState" AS ENUM ('ENGAGED', 'FRUSTRATED', 'BORED', 'CONFUSED', 'EXCITED', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('SPARK', 'PRO', 'FAMILY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarPersonaId" TEXT NOT NULL DEFAULT 'cosmo',
    "gradeLevel" "GradeLevel" NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "parentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_nodes" (
    "id" TEXT NOT NULL,
    "nodeCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gradeLevel" "GradeLevel" NOT NULL,
    "domain" "KnowledgeDomain" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "knowledge_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_sessions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "state" "SessionState" NOT NULL DEFAULT 'IDLE',
    "currentNodeId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "questionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "emotionalStateAtStart" "EmotionalState",
    "emotionalStateAtEnd" "EmotionalState",

    CONSTRAINT "learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mastery_scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "level" "MasteryLevel" NOT NULL DEFAULT 'NOVICE',
    "bktProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "practiceCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "lastPracticed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewAt" TIMESTAMP(3),

    CONSTRAINT "mastery_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotional_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "detectedState" "EmotionalState" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "triggeredAdaptation" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emotional_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streak_data" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalDaysActive" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "streak_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'SPARK',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NodePrerequisites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "students_parentId_idx" ON "students"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_nodes_nodeCode_key" ON "knowledge_nodes"("nodeCode");

-- CreateIndex
CREATE INDEX "knowledge_nodes_gradeLevel_domain_idx" ON "knowledge_nodes"("gradeLevel", "domain");

-- CreateIndex
CREATE INDEX "learning_sessions_studentId_idx" ON "learning_sessions"("studentId");

-- CreateIndex
CREATE INDEX "learning_sessions_currentNodeId_idx" ON "learning_sessions"("currentNodeId");

-- CreateIndex
CREATE INDEX "mastery_scores_studentId_idx" ON "mastery_scores"("studentId");

-- CreateIndex
CREATE INDEX "mastery_scores_nodeId_idx" ON "mastery_scores"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "mastery_scores_studentId_nodeId_key" ON "mastery_scores"("studentId", "nodeId");

-- CreateIndex
CREATE INDEX "emotional_logs_studentId_idx" ON "emotional_logs"("studentId");

-- CreateIndex
CREATE INDEX "emotional_logs_sessionId_idx" ON "emotional_logs"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "streak_data_studentId_key" ON "streak_data"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_NodePrerequisites_AB_unique" ON "_NodePrerequisites"("A", "B");

-- CreateIndex
CREATE INDEX "_NodePrerequisites_B_index" ON "_NodePrerequisites"("B");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_currentNodeId_fkey" FOREIGN KEY ("currentNodeId") REFERENCES "knowledge_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mastery_scores" ADD CONSTRAINT "mastery_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mastery_scores" ADD CONSTRAINT "mastery_scores_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "knowledge_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_logs" ADD CONSTRAINT "emotional_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_logs" ADD CONSTRAINT "emotional_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "learning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streak_data" ADD CONSTRAINT "streak_data_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NodePrerequisites" ADD CONSTRAINT "_NodePrerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NodePrerequisites" ADD CONSTRAINT "_NodePrerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
