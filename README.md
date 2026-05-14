# HoshiYaar Frontend

## Product Overview
**HoshiYaar** is a high-fidelity CBSE Science learning platform designed for students in Class 6–8. The platform focuses on interactive learning through modules, lessons, and a gamified experience including stars and progress tracking. It provides a seamless experience across Web and Android (via Capacitor).

## Tech Stack
- **Core**: React 19, Vite
- **Routing**: React Router 7
- **Styling**: Tailwind CSS
- **API Communication**: Axios (with centralized `apiClient`)
- **Mobile Support**: Capacitor (Android/iOS)
- **State Management**: React Context API (Auth, Stars, Review)
- **Charts**: Recharts

## Local Setup
1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd Hoshiyaar-frontend-main
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run development server**:
   ```bash
   npm run dev
   ```

## Environment Variables
Create a `.env` file in the root directory:
```env
VITE_API_BASE=http://localhost:5000
VITE_OLA_MAPS_API_KEY=your_api_key_here
```

## Build
- **Standard Build**: `npm run build` (outputs to `/dist`)
- **SPA Build**: `npm run build:spa` (special build for single page application hosting)

## Android Build
- **Sync Capacitor**: `npm run build:android`
- **Open in Android Studio**: `npm run android:open`

## Folder Structure
- `src/assets`: Images, icons, and static assets.
- `src/components`:
  - `/Learn`: Core learning components (Dashboard, Lessons, Quiz).
  - `/admin`: Administrative tools and panels.
  - `/forms`: Login, Signup, and other form layouts.
  - `/layout`: Global layout components (Navbar, ProtectedRoutes).
  - `/ui`: Reusable UI components (Buttons, ProgressBars).
- `src/context`: Application-wide states (Auth, Stars, Review).
- `src/services`: API service layers (centralized `apiClient`).
- `src/utils`: Helper functions and utilities.

## API Services
All API calls are centralized in `src/services/` and use a shared `apiClient.js` for automatic token injection and base URL management.
- `authService.js`: User authentication and profile management.
- `curriculumService.js`: Boards, Classes, Subjects, and Modules.
- `pointsService.js`: Points/Stars management.
- `reviewService.js`: Revision and incorrect question tracking.

## Auth Flow
1. **Authentication**: Handled via JWT. The token is stored in the `user` object in `localStorage`.
2. **Admin Auth**: Separate backend check for the `admin` role. Admin-specific tokens are stored in `sessionStorage` for additional security.
3. **Protected Routes**: Handled by `ProtectedRoute` and `AdminProtectedRoute`.

## Deployment
- **Web**: Hosted on Netlify/Vercel.
- **Backend**: API must be accessible at the URL defined in `VITE_API_BASE`.

## Release Checklist
- [ ] Verify `VITE_API_BASE` points to production API.
- [ ] Ensure `capacitor.config.json` has `cleartext: false` and `allowMixedContent: false`.
- [ ] Run `npm run build` and verify the `dist` folder.
- [ ] Run `npx cap sync` for mobile updates.
- [ ] Test core flows: Login -> Onboarding -> Learning -> Admin.
