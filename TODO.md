# Nexus Learning — Build TODO

## Phase 1: Foundation (Week 1-2) ✅ COMPLETE
- [x] Initialize Turborepo monorepo (apps/web, apps/mobile, packages/*)
- [x] Set up Next.js 14 with App Router, TailwindCSS
- [x] Set up Expo 52 with Expo Router + NativeWind
- [x] Configure Prisma schema + PostgreSQL (Docker)
- [x] Set up Neo4j connection + Cypher queries
- [x] Docker Compose for PostgreSQL, Redis, Neo4j
- [x] Integrate Auth0 (middleware protecting /dashboard, /api/protected)
- [x] Basic layout components (landing, dashboard, login)
- [x] Shared types package (all enums, interfaces, PersonaId union)
- [x] Shared UI package (Button, Card, ProgressBar, useUser hook)
- [x] Shared config package (ESLint, TypeScript, Tailwind)

## Phase 2: Knowledge Graph + Seed Data (Week 2-3) ✅ COMPLETE
- [x] Neo4j schema for KnowledgeNode + PREREQUISITE_OF edges
- [x] 21 knowledge nodes: K.CC.1-7, 1.OA.1-8, 1.NBT.1-6 (real Common Core)
- [x] 31 prerequisite relationships seeded
- [x] Neo4j query layer: getPrerequisites, getSuccessors, getShortestLearningPath, getNodesByGradeAndDomain
- [x] PostgreSQL seed: 21 nodes + demo parent + student + subscription
- [x] API routes for knowledge graph queries (mastery-map endpoint)
- [x] Knowledge graph visualization component (constellation star map)

## Phase 3: Diagnostic Engine (Week 3-4) ✅ COMPLETE
- [x] Build diagnostic binary search algorithm
- [x] Build Claude prompt for diagnostic question generation
- [x] Build diagnostic API routes (/api/diagnostic/start, /api/diagnostic/answer)
- [x] Build diagnostic UI — "Find Your Aauti Level" flow with Cosmo
- [x] Build diagnostic result storage + parent report
- [ ] Mobile diagnostic UI

## Phase 4: Core Teaching Loop + Session State Machine (Week 4-6) ✅ COMPLETE
- [x] Build session state machine (11 states)
- [x] Build per-state handlers (exposure through mastery celebration)
- [x] Build Claude prompt templates (5 explanation types + problems + feedback)
- [x] Build BKT scoring engine
- [x] Build math answer validation
- [x] Build session API routes (/api/session/start, /answer, /hint, /end)
- [x] Build student session UI (problem display, answer input, hints, feedback)
- [x] Redis session caching (via state machine)
- [ ] Mobile session UI

## Phase 5: Tutor Persona System (Week 5-7) ✅ COMPLETE
- [x] Build persona definitions + configuration (14 personas, 3 tiers)
- [x] Build character selection UI (age-tiered grid with hover previews)
- [x] Cosmo the Bear: emoji placeholder + HeyGen avatar display
- [x] Tier 1 remaining animals: Zara, Pip, Koda, Luna, Rex
- [x] Tier 2 stylized humans: Alex, Mia, Raj, Zoe
- [x] Tier 3 HeyGen avatars: Jordan, Dr. Priya, Marcus, Sam
- [x] ElevenLabs voice integration per persona (API wired, needs real keys)
- [x] HeyGen avatar streaming (WebRTC component built, needs API key)
- [x] Persona-specific Claude prompts (adaptive-response system)
- [x] Rex "deliberate mistake" system

## Phase 6: Emotional Intelligence Layer (Week 6-8) ✅ COMPLETE
- [x] Build behavioral signal tracker
- [x] Build emotional state detector (frustration, boredom, flow, anxiety)
- [x] Build response protocols (frustration, boredom, breakthrough, anxiety)
- [x] Wire emotional signals to avatar expression + voice
- [x] Wire to session state machine (EMOTIONAL_INTERVENTION state)

## Phase 7: Gamification System (Week 7-9) ✅ COMPLETE
- [x] Constellation star map (SVG-based with zoom/pan)
- [x] Boss Challenge system (weekly Sunday unlock)
- [x] Streak system (daily streaks with freeze mechanic)
- [x] Badge system (33 badges, definitions, award logic, display)
- [ ] Mobile constellation + gamification UI

## Phase 8: Spaced Repetition (Week 8-9) ✅ COMPLETE
- [x] Build Ebbinghaus scheduler (3d, 7d, 21d, 60d, 6mo intervals)
- [x] Build nightly batch job for queuing reviews
- [x] Build REVIEW_SESSION handler
- [x] Build review session UI (due widget, forecast calendar, review flow)
- [x] Update mastery status: MASTERED → RETAINED

## Phase 9: Parent Dashboard (Week 9-11) ✅ COMPLETE
- [x] Weekly narrative report (Claude-generated, stored in DB)
- [x] Knowledge graph visualization per child (constellation page)
- [x] Learning velocity trend charts (recharts BarChart + LineChart)
- [x] Emotional engagement score (wellness insights card)
- [x] Spaced repetition health view (review due widget)
- [x] Session history + replay (SessionHistory component with filters)
- [x] Child management (add child form, child cards, sidebar navigation)
- [x] Push notifications (NotificationCenter with mark-read)
- [ ] Mobile parent dashboard
- [ ] SendGrid email integration for weekly reports

## Phase 10: Billing + Subscription (Week 10-11) ✅ COMPLETE
- [x] Stripe products/prices setup (Spark ₹499, Pro ₹999, Family ₹1499)
- [x] Stripe Checkout integration
- [x] Stripe webhook handlers (checkout.session.completed, subscription events)
- [x] Feature gating by tier (FeatureGate component + useFeatureAccess hook)
- [x] Billing portal (PricingCard, UpgradePrompt, SubscriptionStatus)
- [x] Free trial flow (7 days)

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

---

## Known Gaps in Phases 1-10
- Curriculum only covers K and G1 (23 nodes) — G2-G5 not seeded yet
- Settings page is a stub (UI placeholder only)
- All personas share one HeyGen avatar (no per-persona avatar IDs)
- ElevenLabs and HeyGen API keys not configured (code works without them)
- Mobile (Expo) app not started — all mobile items deferred to Phase 12
- SendGrid not integrated — weekly reports generate but don't email
- Student pages now use real child IDs via ?studentId= URL param
