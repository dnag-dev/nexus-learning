# Aauti Learn (Nexus Learning)

AI-powered adaptive math tutoring platform that meets every child exactly where they are. Features real-time AI content generation, emotional intelligence, gamification, and a knowledge constellation visualization.

**Live**: [nexus-learning-dnag.vercel.app](https://nexus-learning-dnag.vercel.app)
**Repo**: [github.com/dnag-dev/nexus-learning](https://github.com/dnag-dev/nexus-learning)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | Web app with SSR + API routes |
| Language | TypeScript 5.5 | Full-stack type safety |
| Monorepo | Turborepo + npm workspaces | Fast builds, shared packages |
| Primary DB | PostgreSQL (Neon) | Users, sessions, mastery, billing |
| Graph DB | Neo4j Aura (optional) | Knowledge graph with prerequisites |
| Cache | Redis (Upstash) | Session state caching |
| AI Content | Claude API (raw fetch) | Real-time explanations, questions, feedback |
| Avatar | HeyGen Streaming API | Real-time lip-synced video avatar |
| Voice | ElevenLabs TTS | Emotional text-to-speech per persona |
| Auth | Auth0 (parents) + JWT (children) | Dual authentication system |
| Payments | Stripe | Subscription billing |
| Email | SendGrid | Weekly parent narrative reports |
| Styling | Tailwind CSS 3.4 | Utility-first styling |
| Animation | Framer Motion | UI animations and transitions |
| Charts | Recharts | Data visualization |
| Hosting | Vercel | Serverless deployment |

---

## Project Structure

```
nexus-learning/
  apps/
    web/                    # Next.js 14 web application (primary)
    mobile/                 # React Native + Expo (deferred)
  packages/
    db/                     # Prisma schema, migrations, seeds
    types/                  # Shared TypeScript types
    ui/                     # Shared UI components
    config/                 # Shared config (ESLint, TS)
```

### Web App Structure (`apps/web/`)

```
app/
  page.tsx                  # Landing page (Parent / Kid entry)
  login/                    # Auth0 login page
  kid-login/                # Child login (username + PIN)
  session/                  # Learning session page
  diagnostic/               # Diagnostic assessment
  onboarding/               # Persona selection
  (parent)/                 # Parent route group (Auth0 protected)
    dashboard/              # Parent dashboard with child cards
    child/[id]/             # Child progress, sessions, reports
    billing/                # Subscription management
    settings/               # Account settings
  (child)/                  # Child route group (JWT protected)
    kid/                    # Gamified child dashboard
    kid/constellation/      # Star map visualization
    kid/review/             # Spaced repetition review
  (student)/                # Student route group (URL param auth)
    constellation/          # Constellation view
    review/                 # Review sessions
  (teacher)/                # Teacher route group
    teacher-dashboard/      # Teacher overview
    teacher-dashboard/class/ # Class management
    teacher-dashboard/assignments/ # Assignment CRUD
    teacher-dashboard/alerts/ # Intervention alerts
    teacher-dashboard/lesson-plan/ # AI lesson planning
  api/                      # 58 API routes (see below)

components/
  session/                  # TeachingCard, PracticeQuestion, StreamingText, etc.
  gamification/             # XPBar, StreakWidget, BadgeDisplay, BossChallengeCard
  constellation/            # StarMap, StarDetail
  review/                   # ReviewDueWidget, ReviewForecastCalendar
  parent/                   # ChildCard, ParentSidebar, NotificationCenter, etc.
  teacher/                  # TeacherSidebar, ClassCard, MasteryHeatmap, etc.
  persona/                  # AvatarDisplay

lib/
  session/                  # State machine, BKT engine, Claude client, prefetch
  prompts/                  # Claude prompt templates (practice, hint, teaching, etc.)
  gamification/             # XP, streaks, badges, boss challenges, event bus
  spaced-repetition/        # SM-2 scheduler, review engine, notifications
  emotional/                # Signal tracker, state detector, adaptive response
  billing/                  # Stripe client, subscription service, feature gates
  reports/                  # Narrative reports, insights
  teacher/                  # Alert engine, lesson plan prompt
  diagnostic/               # Diagnostic engine, question generator
  personas/                 # Persona config, Claude persona integration
  avatar/                   # HeyGen client
  voice/                    # ElevenLabs client
  ai/claude/prompts/        # AI prompt templates
  child-auth.ts             # Child JWT auth (bcrypt + jose)
  child-context.tsx         # Child React context
  parent-context.tsx        # Parent React context
  teacher-context.tsx       # Teacher React context
  auth.ts                   # Auth0 integration
```

---

## Database Schema (21 Models)

### Core Models
- **User** - Parent/teacher accounts (Auth0), email, role, subscription
- **Student** - Child profiles, avatar persona, grade level, XP, level, optional username/PIN for independent login
- **KnowledgeNode** - Math concepts with nodeCode, grade level, domain, difficulty, prerequisite relationships
- **LearningSession** - Active tutoring sessions with state machine (11 states), question/answer counters, emotional tracking
- **MasteryScore** - Per-student per-node BKT probability, practice counts, spaced repetition scheduling (SM-2)

### Emotional Intelligence
- **EmotionalLog** - Detected emotional states per session with confidence scores and triggered adaptations
- **BehavioralSignal** - Raw behavioral signals (keystroke timing, response speed, pause duration, hint usage)

### Gamification
- **StreakData** - Daily streaks, longest streak, freezes available/used
- **BossChallenge** - Multi-node challenges (SPEED_ROUND, MULTI_STEP, STORY_PROBLEM, REAL_WORLD)
- **Badge** - Achievement badges across categories (MASTERY, STREAK, SPEED, EMOTIONAL, BOSS)
- **Notification** - In-app notifications (review due, streak reminder, badge earned, level up)

### Parent/Billing
- **Subscription** - Stripe subscription (SPARK free, PRO $19.99/mo, FAMILY $34.99/mo, ANNUAL $199/yr)
- **WeeklyReport** - Claude-generated narrative progress reports with stats JSON
- **WebhookLog** - Stripe webhook event log

### Teacher Dashboard
- **School** - School with district info
- **TeacherProfile** - Teacher linked to User and School
- **Class** - Classes with grade level, linked to teacher
- **ClassStudent** - Many-to-many class enrollment
- **Assignment** - Assignments with target knowledge nodes and due dates
- **AssignmentSubmission** - Student submissions with mastery tracking
- **InterventionAlert** - AI-generated alerts (repeated failure, prolonged absence, sustained frustration)

### Enums (16)
UserRole, GradeLevel, AgeGroup, KnowledgeDomain, SessionState, MasteryLevel, EmotionalState, BossChallengeStatus, BossChallengeType, SessionType, NotificationType, SubscriptionPlan, SubscriptionStatus, AlertType, AlertStatus, AssignmentStatus

---

## API Routes (58 Endpoints)

### Authentication
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/auth/[auth0]` | Auth0 login/callback/logout |
| POST | `/api/auth/sync` | Sync Auth0 user to DB |
| POST | `/api/auth/set-role` | Set user role (parent/teacher) |
| POST | `/api/auth/child-login` | Child login (username + PIN) |
| GET | `/api/auth/child-session` | Verify child JWT session |
| POST | `/api/auth/child-logout` | Child logout (clear cookie) |

### Learning Session
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/session/start` | Start new learning session |
| POST | `/api/session/answer` | Submit answer, update BKT mastery |
| GET | `/api/session/next-question` | Get AI-generated practice question |
| GET | `/api/session/teach-stream` | Stream teaching explanation (SSE) |
| POST | `/api/session/hint` | Request hint for current problem |
| POST | `/api/session/emotion` | Log emotional state |
| POST | `/api/session/signals` | Submit behavioral signals |
| POST | `/api/session/end` | End session |
| GET | `/api/session/[id]` | Get session details |

### Diagnostic
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/diagnostic/start` | Start diagnostic assessment |
| POST | `/api/diagnostic/answer` | Submit diagnostic answer |
| GET | `/api/diagnostic/result` | Get diagnostic results |

### Student
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/student/[id]/gamification` | Get XP, level, streak, badges, boss challenges |
| GET | `/api/student/[id]/mastery-map` | Get mastery scores across knowledge graph |
| GET | `/api/student/[id]/reviews` | Get due review summary |
| PUT | `/api/student/[id]/persona` | Update avatar persona |

### Parent
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/parent/children` | List/create children |
| GET | `/api/parent/[id]/overview` | Parent dashboard overview |
| GET | `/api/parent/[id]/notifications` | Get notifications |
| POST | `/api/parent/[id]/notifications/mark-all-read` | Mark all read |
| POST | `/api/parent/[id]/notifications/[notifId]/read` | Mark single read |
| GET | `/api/parent/child/[id]/progress` | Child progress data |
| GET | `/api/parent/child/[id]/sessions` | Child session history |
| GET | `/api/parent/child/[id]/reports` | List weekly reports |
| POST | `/api/parent/child/[id]/reports/generate` | Generate new report |
| GET | `/api/parent/child/[id]/report/latest` | Latest report |
| GET | `/api/parent/child/[id]/report/week/[weekStart]` | Report by week |

### Review (Spaced Repetition)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/review/start` | Start review session |
| POST | `/api/review/answer` | Submit review answer |
| GET | `/api/review/summary` | Review session summary |

### Billing (Stripe)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/billing/checkout` | Create Stripe checkout session |
| POST | `/api/billing/portal` | Create Stripe billing portal |
| GET | `/api/billing/subscription` | Get subscription status |
| POST | `/api/billing/trial` | Start free trial |
| POST | `/api/billing/webhook` | Stripe webhook handler |

### Teacher Dashboard
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/teacher/[id]/overview` | Teacher dashboard overview |
| GET/POST | `/api/teacher/classes` | List/create classes |
| GET/PUT/DELETE | `/api/teacher/class/[id]` | Class CRUD |
| GET/POST | `/api/teacher/class/[id]/students` | Class students |
| GET | `/api/teacher/class/[id]/mastery-heatmap` | Class mastery heatmap |
| GET | `/api/teacher/class/[id]/assignments` | Class assignments |
| GET | `/api/teacher/class/[id]/export` | Export class data (CSV) |
| GET | `/api/teacher/student/[id]/detail` | Student detail view |
| GET/POST | `/api/teacher/assignments` | Assignment CRUD |
| GET/PUT/DELETE | `/api/teacher/assignments/[id]` | Single assignment |
| GET | `/api/teacher/[id]/alerts` | Intervention alerts |
| PUT | `/api/teacher/alerts/[alertId]` | Update alert status |
| POST | `/api/teacher/lesson-plan` | AI-generated lesson plan |

### Debug
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/debug/claude` | Test Claude API connectivity |
| GET | `/api/protected/me` | Auth-protected user info |

---

## Core Systems

### 1. Bayesian Knowledge Tracing (BKT)

The BKT engine (`lib/session/bkt-engine.ts`) tracks per-student, per-concept mastery probability:

- **P(L)** = probability of mastery (0.0 to 1.0)
- Updates on each answer using Bayesian inference with configurable parameters:
  - P(init) = 0.3 (initial knowledge probability)
  - P(transit) = 0.1 (learning rate per practice)
  - P(slip) = 0.1 (probability of wrong answer despite mastery)
  - P(guess) = 0.25 (probability of correct guess)
- Mastery levels: NOVICE (< 0.4) → DEVELOPING (< 0.6) → PROFICIENT (< 0.8) → ADVANCED (< 0.95) → MASTERED (>= 0.95)
- Node advancement when P(L) >= 0.95

### 2. Session State Machine

11-state finite state machine (`lib/session/state-machine.ts`):

```
IDLE → DIAGNOSTIC → TEACHING → PRACTICE → CELEBRATING → COMPLETED
                        ↕           ↕
                  HINT_REQUESTED  STRUGGLING
                        ↕           ↕
                  EMOTIONAL_CHECK  BOSS_CHALLENGE
                                    ↕
                                  REVIEW
```

### 3. AI Content Generation

All content generated in real-time by Claude API via raw `fetch` (no SDK):

- **Teaching explanations**: Streamed via SSE, persona-adapted
- **Practice questions**: Multiple choice with difficulty scaling
- **Hints**: Progressive hint system (3 levels)
- **Celebrations**: Personalized mastery celebrations
- **Weekly reports**: Narrative parent reports
- **Lesson plans**: Teacher-facing AI lesson plans

Claude prompt templates (`lib/prompts/`): practice, hint, teaching, celebrating, struggling, emotional-check, boss-challenge

### 4. Emotional Intelligence

Real-time emotional state detection (`lib/emotional/`):

- **Signal tracking**: Keystroke timing, response speed, pause duration, hint usage, attempt counts
- **State detection**: 8 states (ENGAGED, FRUSTRATED, BORED, CONFUSED, EXCITED, NEUTRAL, ANXIOUS, BREAKTHROUGH)
- **Adaptive response**: Difficulty adjustment, encouragement injection, break suggestions, pace changes

### 5. Gamification

Full gamification system (`lib/gamification/`):

- **XP + Levels**: XP awards for correct answers, mastery, streaks; level-up celebrations
- **Streaks**: Daily practice streaks with freeze system
- **Badges**: 20+ badge types across 5 categories (MASTERY, STREAK, SPEED, EMOTIONAL, BOSS)
- **Boss Challenges**: Multi-node challenges unlocked at mastery milestones (4 types)
- **Constellation**: Visual star map of mastery progress

### 6. Spaced Repetition (SM-2)

Modified SM-2 algorithm (`lib/spaced-repetition/`):

- Schedules reviews based on easiness factor and review count
- Intervals: 1 day → 6 days → growing with easiness factor
- Review due notifications
- Retention rate tracking per review session

### 7. Dual Authentication

Two independent auth paths:

- **Parent path**: Auth0 → `/dashboard` → manage children → start sessions
- **Child path**: Username + 4-digit PIN → JWT cookie (7-day, httpOnly) → `/kid` gamified dashboard → start sessions
- Middleware protects `/kid/*` routes with JWT verification (jose in Edge Runtime)
- Rate limiting: 5 failed PIN attempts → 15-minute lockout

### 8. Knowledge Graph

Dual data source for curriculum structure:

- **Primary**: PostgreSQL via Prisma (KnowledgeNode model with self-referential prerequisites)
- **Optional**: Neo4j Aura for advanced graph queries (gracefully falls back to Prisma if unavailable)
- Covers K-5 math: Counting, Operations, Geometry, Measurement, Data

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm 10+
- PostgreSQL (Neon recommended)

### Environment Variables

Create `apps/web/.env.local`:

```env
# Database (required)
DATABASE_URL="postgresql://..."

# Auth0 (required for parent login)
AUTH0_SECRET="..."
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://your-tenant.auth0.com"
AUTH0_CLIENT_ID="..."
AUTH0_CLIENT_SECRET="..."

# Claude API (required for AI content)
AAUTI_ANTHROPIC_KEY="sk-ant-..."    # Priority 1
ANTHROPIC_API_KEY="sk-ant-..."      # Priority 2 (fallback)

# Child auth (required for child login)
CHILD_AUTH_SECRET="..."             # Generate: openssl rand -hex 32

# Optional integrations
NEO4J_URI="neo4j+s://..."
NEO4J_USER="neo4j"
NEO4J_PASSWORD="..."
REDIS_URL="redis://..."
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
HEYGEN_API_KEY="..."
ELEVENLABS_API_KEY="..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
SENDGRID_API_KEY="SG...."
```

### Install and Run

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate --schema=packages/db/prisma/schema.prisma

# Run database migrations
npx prisma migrate dev --schema=packages/db/prisma/schema.prisma

# Seed the database
npm run db:seed:pg

# (Optional) Seed Neo4j knowledge graph
npm run db:seed:neo4j

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

### Deploy to Vercel

```bash
npx vercel --prod --yes
```

Note: Ensure all environment variables are set in Vercel project settings.

---

## User Flows

### Parent Flow
1. Landing page → "I'm a Parent" → Auth0 login
2. Dashboard → See all children with progress cards
3. Click "Start Learning" on a child → Session page
4. Session: Teaching → Practice → Mastery celebration → Next concept
5. View child progress, session history, weekly reports
6. Manage subscription (Spark/Pro/Family)

### Child Flow
1. Landing page → "I'm a Kid" → Username + PIN login
2. Gamified dashboard → See XP, streaks, badges, boss challenges
3. "Start Learning" → Session page (same learning experience)
4. Session return → Back to kid dashboard
5. View constellation (star map), review due concepts

### Teacher Flow
1. Login → Teacher dashboard
2. Create classes, add students
3. View mastery heatmap across class
4. Create assignments targeting specific knowledge nodes
5. Monitor intervention alerts (AI-detected struggling students)
6. Generate AI lesson plans

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^14.2.0 | Web framework |
| react | ^18.3.0 | UI library |
| @prisma/client | (generated) | Database ORM |
| @auth0/nextjs-auth0 | ^3.5.0 | Parent authentication |
| bcryptjs | ^3.0.3 | Child PIN hashing |
| jose | (via Next.js) | Child JWT tokens |
| stripe | ^20.3.1 | Payment processing |
| framer-motion | ^12.34.3 | Animations |
| recharts | ^3.7.0 | Charts and graphs |
| canvas-confetti | ^1.9.4 | Celebration effects |
| ioredis | ^5.9.3 | Redis client |
| tailwindcss | ^3.4.0 | CSS framework |
| turbo | ^2.3.0 | Monorepo build tool |
| vitest | ^4.0.18 | Testing framework |

---

## Architecture Notes

- Claude API calls use **raw `fetch`** instead of the Anthropic SDK (SDK v0.78.0 has connection errors on Vercel serverless)
- All session API routes have `maxDuration = 30` for Vercel Pro plan timeout
- Question prefetch uses in-memory cache (works in dev, not on Vercel serverless due to Lambda isolation)
- Neo4j is **optional** — the app gracefully falls back to Prisma queries if Neo4j is unavailable
- The `AAUTI_ANTHROPIC_KEY` env var takes priority over `ANTHROPIC_API_KEY` to avoid conflicts with Claude Code shell environment
- Child auth uses a separate JWT system (not Auth0) for simplicity and kid-friendly UX

---

## License

Private. All rights reserved.
