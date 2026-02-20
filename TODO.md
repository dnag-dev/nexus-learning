# Nexus Learning — Build TODO

## Phase 1: Foundation (Week 1-2)
- [ ] Initialize Turborepo monorepo (apps/web, apps/mobile, packages/*)
- [ ] Set up Next.js 14 with App Router, TailwindCSS, Shadcn/UI
- [ ] Set up Expo/React Native project with Expo Router
- [ ] Configure Prisma schema + PostgreSQL (Neon)
- [ ] Set up Neo4j Aura connection + basic Cypher queries
- [ ] Set up Redis (Upstash) connection
- [ ] Integrate Auth0 (parent signup/login, child profile creation)
- [ ] Basic layout components (student shell, parent shell)
- [ ] Shared types package with all TypeScript interfaces

## Phase 2: Knowledge Graph + Seed Data (Week 2-3)
- [ ] Design Neo4j schema for concept nodes and prerequisite edges
- [ ] Build knowledge graph seed data: ~150 Math K-5 concept nodes
- [ ] Build Neo4j query layer: CRUD, pathfinding, student overlay
- [ ] Build API routes for knowledge graph queries
- [ ] Build knowledge graph visualization component (constellation preview)

## Phase 3: Diagnostic Engine (Week 3-4)
- [ ] Build diagnostic binary search algorithm
- [ ] Build Claude prompt for diagnostic question generation
- [ ] Build diagnostic API routes
- [ ] Build diagnostic UI — "Find Your Nexus Level" flow
- [ ] Build diagnostic result storage + parent report
- [ ] Mobile diagnostic UI

## Phase 4: Core Teaching Loop + Session State Machine (Week 4-6)
- [ ] Build session state machine (11 states)
- [ ] Build per-state handlers (exposure through mastery celebration)
- [ ] Build Claude prompt templates (5 explanation types + problems + feedback)
- [ ] Build BKT scoring engine
- [ ] Build math answer validation
- [ ] Build session API routes
- [ ] Build student session UI (problem display, answer input, hints, feedback)
- [ ] Redis session caching
- [ ] Mobile session UI

## Phase 5: Tutor Persona System (Week 5-7)
- [ ] Build persona definitions + configuration (14 personas, 3 tiers)
- [ ] Build character selection UI (age-tiered)
- [ ] Cosmo the Bear: SVG illustration + Lottie animation
- [ ] Tier 1 remaining animals: Zara, Pip, Koda, Luna, Rex
- [ ] Tier 2 stylized humans: Alex, Mia, Raj, Zoe
- [ ] Tier 3 HeyGen avatars: Jordan, Dr. Priya, Marcus, Sam
- [ ] ElevenLabs voice integration per persona
- [ ] HeyGen avatar streaming (WebRTC)
- [ ] Persona-specific Claude prompts
- [ ] Rex "deliberate mistake" system

## Phase 6: Emotional Intelligence Layer (Week 6-8)
- [ ] Build behavioral signal tracker
- [ ] Build emotional state detector
- [ ] Build response protocols (frustration, boredom, breakthrough, anxiety)
- [ ] Wire emotional signals to avatar expression + voice
- [ ] Wire to session state machine (EMOTIONAL_INTERVENTION state)

## Phase 7: Gamification System (Week 7-9)
- [ ] Constellation star map (WebGL/Three.js)
- [ ] Boss Challenge system (weekly Sunday unlock)
- [ ] Streak system (concept, subject, perfect practice, speed, comeback)
- [ ] Badge system (definitions, award logic, display)
- [ ] Mobile constellation + gamification UI

## Phase 8: Spaced Repetition (Week 8-9)
- [ ] Build Ebbinghaus scheduler (3d, 7d, 21d, 60d, 6mo)
- [ ] Build nightly batch job for queuing reviews
- [ ] Build REVIEW_SESSION handler
- [ ] Build review session UI
- [ ] Update mastery status: MASTERED → RETAINED

## Phase 9: Parent Dashboard (Week 9-11)
- [ ] Weekly narrative report (Claude-generated + SendGrid email)
- [ ] Knowledge graph visualization per child
- [ ] Learning velocity trend charts
- [ ] Emotional engagement score
- [ ] Spaced repetition health view
- [ ] Session history + replay
- [ ] Child management (add/remove, time limits, persona config)
- [ ] Push notifications (breakthrough, milestone, re-engagement)
- [ ] Mobile parent dashboard

## Phase 10: Billing + Subscription (Week 10-11)
- [ ] Stripe products/prices setup (Spark, Pro, Family, Annual)
- [ ] Stripe Checkout integration
- [ ] Stripe webhook handlers
- [ ] Feature gating by tier
- [ ] Billing portal
- [ ] Free trial flow (7 days)

## Phase 11: Teacher Dashboard (Week 11-12)
- [ ] Teacher account type + school association
- [ ] Class view (all students on knowledge graph)
- [ ] Assignment mode
- [ ] Intervention alerts
- [ ] Progress export (CSV/PDF)
- [ ] Lesson planning assistant

## Phase 12: Polish + Mobile Parity (Week 12-14)
- [ ] Mobile feature parity
- [ ] Push notifications (Expo)
- [ ] Performance optimization
- [ ] Accessibility pass
- [ ] Error handling + graceful degradation
- [ ] End-to-end testing
