# InterviewOS

An AI-powered interview and hiring simulation platform. Built to go beyond MCQs — it puts candidates inside real workplace pressure and evaluates how they actually think, not just what they memorized.

Live → [interviewos-ytph.onrender.com](https://interviewos-ytph.onrender.com)

---

## What it does

Most interview tools ask generic questions and call it a day. InterviewOS does something different.

It runs a conversational AI interviewer that listens to your voice, adapts follow-up questions based on your answers, tracks your gaze and background noise in real-time, and generates a full behavioral report the moment the session ends — all without a human recruiter in the loop.

There are three core parts:

**Voice Interview Engine** — A fully voice-driven AI interview session. The interviewer has a persona, speaks with natural OpenAI TTS audio, and dynamically adjusts question difficulty based on how confidently you respond. Built on the Web Speech API for real-time transcription and streamed Gemini responses for low-latency replies.

**Neural Analytics HUD** — While you speak, 8 ML signals run simultaneously in the browser: gaze tracking via MediaPipe FaceLandmarker (WebAssembly), acoustic load via Web Audio API FFT analysis, live vocal confidence scoring, behavioral trait extraction via NLP, and code originality detection using vector embeddings + cosine similarity. No backend required for any of this — it all runs client-side.

**Workplace Simulation Engine** — Candidates get dropped into a simulated workplace crisis. Slack messages start arriving, an escalating client email lands in the inbox, Jira tickets pile up. They have to write real responses and justify their priority decisions. The AI evaluates emotional control, stakeholder communication, and decision quality — not multiple choice answers.

---

## Tech stack

- **Framework** — Next.js 16 (App Router, Turbopack)
- **AI** — Gemini 2.5 Flash (interview brain + question generation), OpenAI GPT-4o (behavioral NLP), OpenAI TTS `tts-1` (natural voice output)
- **ML / CV** — MediaPipe FaceLandmarker (WebAssembly, runs in-browser), Web Audio API (FFT acoustic analysis), Google `text-embedding-004` (vector embeddings for originality + resume fit)
- **Frontend** — TypeScript, Tailwind CSS, Framer Motion
- **Infra** — Deployed on Render, GitHub CI

---

## Features

- Role-aware interview generation from job descriptions — not a fixed question bank
- Adaptive difficulty — questions get harder or softer based on your previous answer
- Real-time gaze + noise proctoring without any server round-trips
- Semantic resume-to-JD fit scoring using embeddings
- Code plagiarism detection via cosine similarity against known generic patterns
- Workplace OS simulation — Slack, email, tasks, open-ended written challenges
- Full recruiter dashboard with candidate ranking, red flags, and hiring probability
- 16-point behavioral merit report generated post-interview
- Tab-switch integrity detection + pressure timer

---

## Running locally

```bash
git clone https://github.com/ayushshukla1807/InterviewOS.git
cd InterviewOS
npm install
```

Create a `.env.local` file:

```
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

```bash
npm run dev
```

Open `http://localhost:3000`

---

## Project structure

```
app/
  session/          # Voice interview engine
  simulation/       # Workplace OS simulation
  recruiter/        # Recruiter dashboard
  candidate/        # Candidate portfolio
  report/           # Post-interview merit report
  api/
    chat/           # Streaming interview conversation
    evaluate/       # Predictive hiring engine
    tts/            # OpenAI TTS endpoint
    ml/             # Behavioral, originality, fit-score ML routes
    test-engine/    # JD → simulation blueprint translation
lib/
  ai/               # Prompts, personas, roles, interviewers
  db/               # Question engine
```

---

## Background

Started this as a way to see how far you could push browser-native ML for hiring. Ended up being a full hiring platform — resume parsing, JD-aware question generation, real-time proctoring, behavioral scoring, workplace simulation, the whole thing.

The part that took the most work was getting MediaPipe's FaceLandmarker running inside a Next.js app without breaking SSR, while keeping the animation loop smooth enough to not tank the interview UX. Worth it.

---

## License

MIT
