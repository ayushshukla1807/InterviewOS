# Task Checklist

- [x] Database Extensions
  - [x] Add gamification fields (XP, level, streak, badges) to `lib/db/models/User.ts`
  - [x] Create structured Mongoose schema `lib/db/models/Resume.ts`
- [x] Backend API Changes
  - [x] Update `/api/parse-resume` to structure resume text using Gemini
  - [x] Update `/api/chat` system prompts and output JSON response to include turn-by-turn grading
  - [x] Create `/api/gamification/leaderboard` route to fetch rankings
- [x] Frontend Interfaces
  - [x] Update Candidate Hub (`app/candidate/page.tsx`) with gamification card, badges, and progress bar
  - [x] Update Interview Session (`app/session/page.tsx`) to render turn-by-turn inline grading badges and feedback
  - [x] Create Leaderboard Page (`app/leaderboard/page.tsx`) in a sleek, glassmorphic layout
  - [x] Create Public Portfolio Page (`app/p/[userId]/page.tsx`) showcasing capability radar chart
- [x] Quality Assurance & Build Checks
  - [x] Run typescript diagnostics (`npx tsc --noEmit`)
  - [x] Run production build sanity (`npm run build`)
