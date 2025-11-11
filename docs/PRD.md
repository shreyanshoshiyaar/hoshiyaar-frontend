## Hoshiyaar – Frontend Product Specification (PRD)

- **Product name**: Hoshiyaar (Learning web app)
- **Codebase**: `Hoshiyaar-frontend-main`
- **Tech stack**: React (Vite), React Router, Context API, Axios, TailwindCSS, Node server for SSR/static hosting (env-based), Vercel/Netlify configs present
- **Primary modules**: Auth, Onboarding, Learn (modules/lessons/concepts), Quiz (MCQ/Fillups/Rearrange), Review (Incorrect/Defaults), Profile, Admin upload

### 1) Problem statement
Students need a lightweight, guided way to learn by modules/lessons and practice retention with quizzes and a personalized review queue of previously incorrect questions.

### 2) Goals and objectives
- Provide a smooth learning experience with clear navigation through modules and lessons.
- Deliver multiple quiz formats (MCQ, Fillups, Rearrange) with progress tracking.
- Offer a review flow that prioritizes previously incorrect questions.
- Maintain cross-device progress via backend sync (stars/progress).

### 3) Users and personas
- Students (primary): consume lessons, complete quizzes, build streaks, review mistakes.
- Admin/Content Operators (secondary): upload or validate lesson/test payloads via admin route.

### 4) In-scope features
- Auth: username-based register/login; persistent session in localStorage.
- Onboarding: subject/class/board selections; stored server-side.
- Learn:
  - List modules; deep-links for module, concept, lesson, and quiz items.
  - Track lesson completion and per-question performance to derive stars.
- Quizzes:
  - MCQ, Fillups, Rearrange pages with feedback loops.
  - Local and server progress updates.
- Review:
  - Build review queue from incorrect answers and default pools by scope (module/unit/chapter/subject).
  - Review playback with re-queueing for incorrect responses.
- Profile: view/update onboarding-like profile.
- Admin: test upload route (for payload/content validation in dev).

### 5) Out of scope
- Payments/subscriptions.
- Teacher dashboards, class management.
- Real-time collaboration or proctoring.
- Rich analytics dashboards.

### 6) Success metrics
- Lesson completions per active user.
- Quiz completion rate and average score.
- Review-round completion rate.
- Return rate (7/14/30-day).
- Sync reliability (server vs local progress parity incidents).

### 7) User journeys

- New user
  1. Sign up → Login → Onboarding → Learn dashboard → Start first module → Complete first quiz → See stars → Return next day.
- Returning user
  1. Login (auto) → Continue module/lesson → Attempt quiz → Miss some → Enqueue review → Complete review round.
- Review-focused
  1. Visit `RevisionList` → Pick scope → Start `ReviewRound` → Cycle through queue until empty.

### 8) Information architecture and routing
- Public:
  - `/` Home
  - `/login`, `/signup`
  - `/loading`
- Protected:
  - `/onboard`
  - `/learn`
  - `/profile`
  - `/learn/module/:moduleNumber`
  - `/learn/module/:moduleNumber/concept/:index`
  - `/learn/module/:moduleNumber/lesson/:title`
  - `/learn/module/:moduleNumber/mcq/:index`
  - `/learn/module/:moduleNumber/fillups/:index`
  - `/learn/module/:moduleNumber/rearrange/:index`
  - `/lesson-complete`
  - `/review-round`
  - `/revision`
  - `/admin/upload-test` (admin/dev utility)

Auth guard is implemented via `ProtectedRoute`. Top-level providers: `AuthProvider`, `ReviewProvider`.

### 9) Feature requirements

- Auth
  - Username login/register via `/api/auth/login` and `/api/auth/register`.
  - Persist user in localStorage; hydrate progress (stars) after login.
  - Logout clears all local progress keys.
- Onboarding/Profile
  - Update onboarding and profile via `/api/auth/onboarding` PUT.
- Learn
  - Navigate module → concept → lesson; deep linkable routes.
  - Track per-lesson completion and per-question best score; aggregate to stars.
- Quizzes
  - MCQ, Fillups, Rearrange variants with consistent UX:
    - Show question content, answer inputs, submit/next behavior.
    - Update local best and enqueue incorrect into ReviewContext and server, when applicable.
- Review
  - Build queue from:
    - Incorrect-by-user: `GET /api/review/incorrect?userId&moduleId|chapterId`
    - Default pools: `GET /api/review/defaults?moduleId|unitId|chapterId|subjectId`
  - Save incorrect attempts: `POST /api/review/incorrect` with `{ userId, questionId, moduleId?, chapterId? }`
  - Queue operations: add, start, next, remove active, requeue active for incorrect.
- Stars/Progress
  - Periodically hydrate from server via `getProgress(userId)` to ensure cross-device sync.
  - Local totals and per-module stars persisted as `hs_stars_*` keys; reconciled with server values.

### 10) API contracts (frontend view)

- Base URL
  - Dev: Vite proxy (empty base), set in `vite.config.js`.
  - Prod: `VITE_API_BASE` or current origin.
  - Special-case local IP `192.168.1.11` supported.

- Auth service (`/api/auth/`)
  - `POST /register` → { user }
  - `POST /login` → { user }
  - `PUT /onboarding` → { user }
  - `GET /user/:userId` → { user }
  - `GET /progress/:userId` → Array of progress entries with stats
  - `PUT /progress` → { ok }
  - `GET /completed-modules/:userId?subject` → [moduleIds]
  - `GET /check-username?username` → { available: boolean }

- Review service
  - `GET /api/review/incorrect?userId&moduleId|chapterId` → [questions]
  - `GET /api/review/defaults?moduleId|unitId|chapterId|subjectId` → [questions]
  - `POST /api/review/incorrect` body `{ userId, questionId, moduleId?, chapterId? }` → { ok }

### 11) State management

- `AuthContext`
  - `user`, `loading`, `login(user)`, `logout()`
  - Hydrates stars from server on app load and every 5 minutes; resets client-only caches on account switch.
- `ReviewContext`
  - `queue`, `active`, `hasItems`
  - Actions: `add`, `reset`, `start`, `next`, `removeActive`, `requeueActive`
- Stars
  - Stored in localStorage (`hs_stars_total_v1`, `hs_stars_per_module_v1`, `hs_stars_per_question_v1`) and synced from server best scores.

### 12) Non-functional requirements

- Performance: initial route < 2.5s on 3G; quiz navigation < 300ms.
- Reliability: network timeouts set at 12s; retry or graceful errors on API failures.
- Security: no PII in localStorage beyond minimal user object; guard routes client-side; rely on server auth.
- Accessibility: keyboard navigation for quizzes; sufficient contrast; ARIA for interactive controls.
- Responsiveness: mobile-first layouts, touch-friendly inputs.

### 13) Error handling

- Auth/Progress/Review service requests should surface user-friendly toasts or inline messages.
- Fallbacks:
  - If `getProgress` fails, continue with local stars; schedule re-sync.
  - If review fetch fails, allow retry and show empty-state guidance.

### 14) Environments and config

- Dev: Vite dev server with proxy to backend on localhost:5000.
- Prod: `VITE_API_BASE` set in environment; or same-origin if served behind one domain.
- Hosting: Vercel/Netlify configs included; Node `server.js` available for SSR/static hosting scenarios.

### 15) Analytics and logging

- Console logs present for API base debugging.
- Future: add basic page view and quiz event tracking (answer correctness, time on item).

### 16) Dependencies and integrations

- Backend API (auth, progress, review).
- LocalStorage for persistence.
- TailwindCSS for styling.

### 17) Risks and mitigations

- Drift between local and server progress:
  - Mitigation: periodic server hydration, clear on account switch, unify merge policy (server best as source of truth).
- Deep-linking without preloaded data:
  - Ensure quiz/lesson routes fetch needed data and show skeleton loaders.

### 18) Milestones

- M1: Auth + Onboarding + Learn base routing
- M2: MCQ/Fillups/Rearrange with persistence and stars
- M3: Review queue (incorrect + defaults) + ReviewRound flow
- M4: Profile updates + completed modules
- M5: Accessibility pass + production config hardening

### 19) Acceptance criteria (high-level)

- Users can register/login and remain logged in across refreshes.
- Protected routes redirect to login when unauthenticated.
- Learn routes function for modules, concepts, lessons with deep links.
- Quiz pages record correctness, update stars, and can enqueue incorrect to review.
- Review list loads from server; review round progresses through queue and requeues incorrect.
- Progress hydrates from backend within 5 minutes of login or page load.


