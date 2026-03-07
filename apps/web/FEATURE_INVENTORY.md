# Feature Inventory — Aauti Learn Web App

## Purpose

This file lists every critical user-facing feature and where it lives in code.
Before any UI overhaul or refactor, check that every feature below still works.

---

## Critical Features Checklist

### 1. Prompt-Based Learning (Topic Search)
- **What**: Students can type a topic (e.g., "fractions") and start a session on it.
- **Components**:
  - `components/kid/TopicSearchInput.tsx` — Reusable search input with 3 variants
  - `app/api/session/start/route.ts` — `findConceptByTopic()` function (Mode 2)
  - `app/session/page.tsx` — Reads `topic` URL param and passes to API
- **Used in**: Tier1Home, Tier2Home, Tier3Home
- **History**: Accidentally removed in Phase 5 UX overhaul (commit 50dd928). Restored.

### 2. Subject Switching (Math / English)
- **What**: Students can switch between Math and English subjects.
- **Components**:
  - `components/kid/SubjectTabs.tsx` — Reusable tab switcher with 3 variants
  - `app/api/session/start/route.ts` — `subject` param controls which nodes are selected
  - `app/session/page.tsx` — Reads `subject` URL param
- **Used in**: Tier1Home, Tier2Home, Tier3Home, Constellation page

### 3. Interactive Topic Tree
- **What**: Students can click on individual knowledge nodes to start sessions.
- **Components**:
  - `components/constellation/TopicTree.tsx` — Clickable nodes with visual states
  - `components/constellation/StarDetail.tsx` — Star click → session start
  - `app/(child)/kid/constellation/page.tsx` — Kid constellation page
  - `app/(student)/constellation/page.tsx` — Student constellation page
- **Node States**: locked, available, in-progress, mastered
- **Click Actions**: start session, continue, review, view prerequisite

### 4. 4-Mode Session Start API
- **Endpoint**: `POST /api/session/start`
- **Modes**:
  - Mode 1: `nodeCode` — Explicit node (from topic tree / constellation clicks)
  - Mode 2: `topic` — Free-text search (from TopicSearchInput)
  - Mode 3: `planId` — Learning plan-aware (from GPS)
  - Mode 4: Auto — Smart sequencer picks most urgent concept
- **NEVER remove any mode** — each serves a different user flow.

### 5. Age-Based Dashboard Tiers
- **What**: Different dashboards for K-G3, G4-G7, G8-G12.
- **Components**:
  - `components/kid/Tier1Home.tsx` — Young (K-G3): Big button, simple
  - `components/kid/Tier2Home.tsx` — Mid (G4-G7): Mission, stats, badges
  - `components/kid/Tier3Home.tsx` — Teen (G8-G12): Clean, data-driven
  - `app/(child)/kid/page.tsx` — Routes to correct tier
  - `lib/student/age-tier.ts` — Grade → tier mapping

### 6. Spaced Repetition / Reviews
- **Endpoint**: `GET /api/student/:id/reviews`
- **Components**:
  - `app/(child)/kid/review/page.tsx` — Kid review page
  - `components/review/ReviewDueWidget.tsx` — Dashboard widget
  - `lib/spaced-repetition/scheduler.ts` — SM-2 intervals
  - `lib/session/bkt-engine.ts` — BKT mastery tracking

### 7. Constellation / Star Map
- **Components**:
  - `components/constellation/StarMap.tsx` — Canvas star visualization
  - `components/constellation/StarDetail.tsx` — Click detail panel
  - `components/constellation/TopicTree.tsx` — Tree view
  - `components/constellation/BranchChoiceModal.tsx` — Branch selection

### 8. Student Onboarding
- **Gate**: `firstLoginComplete` field on Student model
- **Components**:
  - `app/(child)/kid/onboarding/page.tsx`
  - Components in `components/kid/onboarding/`

### 9. Gamification
- **Endpoint**: `GET /api/student/:id/gamification`
- **Features**: XP, levels, streaks, badges, boss challenges
- **Components**: `components/gamification/` directory

### 10. GPS / Learning Plans
- **Features**: Goal setting, plan generation, milestone tracking
- **Endpoints**: `/api/gps/*`, `/api/parent/child/[id]/gps`

---

## Pre-Refactor Checklist

Before any major UI change, verify:
- [ ] Topic search input exists on all 3 tier dashboards
- [ ] Subject tabs exist on all 3 tier dashboards
- [ ] Session start `topic` param is read and passed to API
- [ ] Session start `subject` param is read and passed to API
- [ ] Topic tree nodes are clickable → navigate to session
- [ ] Star map star clicks → navigate to session with nodeCode
- [ ] `findConceptByTopic()` exists and is called in session start API
- [ ] All 4 session start modes work
- [ ] Build passes with zero errors
