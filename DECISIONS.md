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
