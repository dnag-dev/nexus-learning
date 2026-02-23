# Nexus Learning — Architecture Decisions

## Decision Log

### 2026-02-20: Initial Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Full v1.0 | MVP + all 6 personas, emotional intelligence, constellation viz, boss challenges, spaced repetition, mobile app |
| Web Framework | Next.js 14 (App Router) | Modern React framework with built-in API routes, SSR, and excellent DX |
| Mobile | React Native + Expo | Cross-platform mobile with maximum code sharing via Expo Router |
| Monorepo | Turborepo | Fast builds, shared packages between web and mobile |
| Backend | Next.js API routes + Prisma | Simpler monorepo, fewer moving parts than separate Express/Fastify service |
| Primary DB | PostgreSQL (Neon) | Users, sessions, billing, mastery records — managed serverless Postgres |
| Graph DB | Neo4j Aura | Knowledge graph with concept nodes + prerequisite edges — managed cloud Neo4j |
| Cache | Redis (Upstash) | Session state cache for active learning sessions — serverless Redis |
| AI Content | Claude API | All explanations, problems, feedback generated in real time — no static content library |
| Avatar | HeyGen Streaming API | Real-time lip-synced avatar video via WebRTC (Tier 3 personas) |
| Voice | ElevenLabs TTS | Streaming text-to-speech with emotional voice control per persona |
| Auth | Auth0 | Parent accounts with COPPA-compliant child profiles |
| Payments | Stripe | Subscription billing: Spark (free), Pro ($19.99/mo), Family ($34.99/mo), Annual ($199/yr) |
| Email | SendGrid | Weekly parent narrative reports, milestone notifications |
| API Integration | Real APIs from start | No mocks — integrate Claude, HeyGen, ElevenLabs, Auth0, Stripe from day one |
| MVP Mascot | Cosmo the Bear | Brand mascot for K-3 tier, first character built |
| BKT Engine | TypeScript (shared package) | Bayesian Knowledge Tracing implemented in TS, shared between web and mobile |

---

### 2026-02-20: Session State Machine Design

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | 11-state FSM | IDLE, DIAGNOSTIC, TEACHING, PRACTICE, HINT_REQUESTED, STRUGGLING, CELEBRATING, BOSS_CHALLENGE, REVIEW, EMOTIONAL_CHECK, COMPLETED |
| State transitions | Event-driven with guards | `transitionState(sessionId, newState, event, metadata)` — validates transitions before applying |
| Persistence | PostgreSQL (SessionState enum) | States stored in DB via Prisma, not in-memory — survives serverless cold starts |

---

### 2026-02-20: Gamification System Design

| Decision | Choice | Rationale |
|----------|--------|-----------|
| XP system | Per-action XP awards | Correct answer (10 XP), mastery (50 XP), streak bonus (5 XP/day), boss completion (200 XP) |
| Level formula | `Math.floor(xp / 100) + 1` | Simple, predictable — kids can calculate their own level |
| Badge categories | 5 categories | MASTERY, STREAK, SPEED, EMOTIONAL, BOSS — covers all engagement types |
| Boss challenges | Unlock at mastery milestones | 4 types (SPEED_ROUND, MULTI_STEP, STORY_PROBLEM, REAL_WORLD) — keeps mastered content engaging |
| Streaks | Daily with freeze system | Streak resets at midnight, freezes prevent loss during breaks |
| Constellation viz | SVG star map | Each mastered node = star, connections = prerequisite edges, visual progress metaphor |

---

### 2026-02-20: Spaced Repetition (SM-2)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Algorithm | Modified SM-2 | Well-proven algorithm, adapted for child-friendly intervals |
| Initial interval | 1 day | First review after 24 hours |
| Easiness factor | 2.5 default, adjustable | Standard SM-2 EF, decreases on wrong answers, increases on correct |
| Review scheduling | Per-node per-student | `nextReviewAt` field on MasteryScore, queried for due reviews |
| Review sessions | Separate session type | SessionType.REVIEW — distinct from learning sessions |

---

### 2026-02-20: Emotional Intelligence System

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Signal collection | Client-side behavioral tracking | Keystroke timing, response speed, pause duration, hint usage, attempt counts |
| State detection | Rule-based classifier | 8 emotional states with confidence scores — simpler than ML, sufficient for v1 |
| Adaptation types | 5 strategies | Difficulty decrease, encouragement injection, break suggestion, pace change, topic switch |
| Logging | Per-session emotional log | Timestamps, confidence, triggered adaptations — feeds into weekly reports |

---

### 2026-02-20: Billing Architecture (Stripe)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Plans | 4 tiers | SPARK (free, limited), PRO ($19.99/mo), FAMILY ($34.99/mo, 5 kids), ANNUAL ($199/yr) |
| Webhook handling | Idempotent with WebhookLog | Dedup via eventId, log all events for debugging |
| Feature gating | Server-side check | `canAccess(userId, feature)` — checks subscription plan against feature requirements |
| Trial | 14-day Pro trial | `trialEndsAt` field, auto-downgrade to Spark after expiry |

---

### 2026-02-20: Teacher Dashboard

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Role system | UserRole enum (PARENT, TEACHER, ADMIN) | Teachers are Users with TeacherProfile linked |
| Class model | Teacher → Classes → ClassStudents → Students | Flexible many-to-many with enrollment tracking |
| Mastery heatmap | Per-class, per-node grid | Visual overview of class-wide understanding gaps |
| Intervention alerts | AI-generated | AlertEngine detects: repeated failure, prolonged absence, sustained frustration, low mastery velocity |
| Assignments | Node-targeted | Teachers assign specific KnowledgeNodes, track mastery per submission |
| Lesson plans | Claude-generated | Teacher provides topic/grade → Claude generates structured lesson plan |
| Data export | CSV | Class-level data export for external reporting |

---

### 2026-02-21: Deployment & Infrastructure

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Vercel (serverless) | Native Next.js support, edge network, automatic scaling |
| Deploy method | Vercel CLI (`npx vercel --prod`) | Git integration not linked — CLI deploys from local build |
| Build system | `turbo build` via `vercel-build` script | Turborepo handles workspace dependency ordering |
| Env var passthrough | `turbo.json` globalPassThroughEnv | 18 env vars explicitly passed through Turborepo to build tasks |
| Function timeout | `maxDuration = 30` on all session routes | Pro plan allows up to 60s; 30s sufficient for Claude API calls |

---

### 2026-02-21: Neo4j Made Optional

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Neo4j dependency | Optional with Prisma fallback | Neo4j Aura connection fails silently; mastery-map API falls back to `prisma.knowledgeNode.findMany()` with self-join for prerequisites |
| Knowledge graph queries | Dual implementation | `neo4j-client.ts` wraps connection with try/catch; `knowledge-graph-queries.ts` has both Neo4j and Prisma paths |
| Error handling | Graceful degradation | `"Unknown scheme: null"` Neo4j error caught and logged; API returns Prisma data instead of 500 |

---

### 2026-02-22: Claude API — Raw Fetch Over SDK

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API client | Raw `fetch` to `https://api.anthropic.com/v1/messages` | Anthropic SDK v0.78.0 throws "Connection error" on Vercel serverless; raw fetch works reliably (tested: 1.25s response time in production) |
| Model | `claude-sonnet-4-5-20250929` | Haiku models (`claude-3-5-haiku-*`) return 404 on this API key; Sonnet responds in 1-3s which is acceptable |
| Streaming | Manual SSE parsing via `response.body.getReader()` | `streamClaude()` generator function parses `content_block_delta` events with `text_delta` type |
| API key priority | `AAUTI_ANTHROPIC_KEY` > `ANTHROPIC_API_KEY` | Avoids conflict with Claude Code CLI which sets `ANTHROPIC_API_KEY` in shell environment |
| Key validation | `key.length > 10` guard | Prevents using placeholder or empty env var values |
| Backward compat | `getClaudeClient()` returns `{ apiKey }` object | Callers that imported the SDK client still work; actual calls go through `callClaude()` / `streamClaude()` |
| Diagnostics | `/api/debug/claude` endpoint | Tests multiple models via raw fetch; returns status, elapsed time, and response for each — used for production debugging |

---

### 2026-02-22: Question Generation & Fallbacks

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary path | On-demand Claude generation | `callClaude(prompt)` in `next-question` route — reliable on Vercel with raw fetch |
| Prefetch cache | In-memory Map via `globalThis` | Works in long-lived Node.js (dev); unreliable on Vercel serverless (Lambda isolation between answer and next-question routes) |
| Fallback questions | Varied by difficulty level | 3 easy questions + 2 medium questions randomly selected — replaced the constant "What is 5+3?" fallback |
| Prompt templates | Structured with persona adaptation | `practice.prompt.ts` builds prompts with student name, age group, persona, node context, BKT probability |

---

### 2026-02-22: Child Independent Login

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth mechanism | Separate JWT system (not Auth0) | Simpler UX for kids; no email required; parent creates username + 4-digit PIN |
| PIN storage | bcrypt hash (cost factor 10) | `bcryptjs` for hashing; secure against brute force |
| Token format | JWT (HS256, 7-day expiry) | Signed with `CHILD_AUTH_SECRET` env var; `jose` library (available in Edge Runtime) |
| Cookie | `aauti-child-session` | httpOnly, secure, sameSite=lax, maxAge=7 days |
| Rate limiting | 5 failed attempts → 15-min lockout | In-memory Map per username; prevents PIN brute force |
| Middleware | Edge Runtime JWT verification | `middleware.ts` checks `/kid/*` routes; redirects to `/kid-login` if invalid |
| Login UX | Username + 4 separate PIN digit boxes | Auto-advance between digits; `inputMode="numeric"`; dark space theme |

---

### 2026-02-22: Child Dashboard (Game Lobby)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Route group | `(child)/kid/` | Separate from `(parent)` and `(student)` route groups |
| Layout | Dark space theme (`bg-[#0D1B2A]`) | Game lobby feel; no sidebar — kids don't need nav complexity |
| Components | Reuse existing gamification components | XPBar, StreakWidget, BadgeDisplay, BossChallengeCard, ReviewDueWidget — already built |
| Session link | `/session?studentId={id}&returnTo=/kid` | `returnTo` param ensures "Back to Dashboard" returns to kid dashboard, not parent dashboard |
| Context | `ChildContext` + `useChild()` hook | Mirrors `ParentContext` pattern; provides studentId, displayName, avatarPersonaId, xp, level |

---

### 2026-02-22: Landing Page — Dual Entry Points

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Entry buttons | "I'm a Parent" + "I'm a Kid" | Clear split entry; parent goes to Auth0, kid goes to `/kid-login` |
| Kid button styling | Orange/amber gradient, larger | Playful, eye-catching for children; distinct from parent button |
| Parent button | Solid primary color | Professional, understated compared to kid button |

---

## Implementation Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Monorepo setup, Prisma schema, Auth0 | Done |
| 2 | Knowledge graph (Neo4j + Prisma) | Done |
| 3 | BKT engine, session state machine | Done |
| 4 | Claude AI content generation (teaching, practice, hints) | Done |
| 5 | Emotional intelligence (signals, detection, adaptation) | Done |
| 6 | Gamification (XP, streaks, badges, boss challenges) | Done |
| 7 | Constellation visualization (star map) | Done |
| 8 | Spaced repetition (SM-2 scheduler, review sessions) | Done |
| 9 | Parent dashboard (progress, reports, notifications) | Done |
| 10 | Billing (Stripe subscriptions, feature gating) | Done |
| 11 | Teacher dashboard (classes, heatmaps, alerts, assignments) | Done |
| 12 | Persona system (6 avatar personas with Claude adaptation) | Done |
| 13 | Vercel deployment + production debugging | Done |
| 14 | Claude API fix (SDK → raw fetch) | Done |
| 15 | Child independent login + gamified dashboard | Done |
| — | Mobile app (React Native + Expo) | Deferred |
| — | HeyGen avatar integration | Deferred |
| — | ElevenLabs voice integration | Deferred |
