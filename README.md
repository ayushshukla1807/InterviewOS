# InterviewOS V2 🚀

A simulation-first platform designed to test candidates by dropping them into a living workplace environment, followed by a voice-based technical interview that grills them on their decisions. 

Standard multiple-choice tests and algorithmic coding puzzles are easy to game. InterviewOS does something different: it compresses weeks of workplace decisions, stakeholder conflicts, and coding tasks into a stateful 40-minute simulation, analyzing behavioral traits and real-world execution.

Live Demo: [interviewos-ytph.onrender.com](https://interviewos-ytph.onrender.com)

---

## The Workflow

### 1. The Immersive Workspace (Act 1 / 2 / 3)
Instead of answering questions, the candidate enters a simulated operating system complete with:
*   **Inbox & Slack Channels:** Where stakeholders (Product Managers, Engineers, VPs, and Clients) send messages, file bugs, and demand updates.
*   **Dynamic Stakeholder Memory:** Each stakeholder has active states tracking their Trust, Frustration, and Cooperation. Your responses (or lack thereof) modify these states.
*   **Consequence & Escalation Engine:** Ignoring an urgent client bug causes them to lose trust, eventually resulting in angry follow-up emails and a direct escalation to your VP.
*   **Ambiguity Engine:** Messages are intentionally messy. They contain missing requirements, contradictory requests from product and sales, or unclear priorities.
*   **Integrated Monaco Code IDE:** Mid-simulation events trigger coding challenges. Candidates write code in a full split-screen Monaco editor with syntax highlighting, autocomplete, and live error checking.

### 2. Live Voice Interview (Context Carryover)
Immediately after the simulation, the candidate enters a voice interview with an AI recruiter. 
*   **Simulation Behavior Ingestion (RAG):** The AI doesn't just read a list of static questions. It natively ingests the exact log of the candidate's simulation (response times, communication style, priorities, code output, and stakeholder relations).
*   **Direct Cross-Questioning:** The interviewer questions the candidate about their actual trade-offs. (e.g. *"I noticed you ignored Priya's design feedback to rush Sarah's CSV export feature. Why did you prioritize the client's feature over team alignment?"*).
*   **Interruptible Audio:** The system uses a Web Audio API `AnalyserNode` to constantly monitor candidate microphone volume. If the candidate speaks over the AI, it instantly cancels its own speech and listens to the candidate.
*   **Dynamic Audio Visualizer:** A glowing waveform visualizer reacts in real-time when the AI speaks, giving the UI an immersive "JARVIS" aesthetic.

### 3. Fortress Proctoring
*   **Visual Gaze Tracking:** Uses a WebAssembly build of **MediaPipe FaceLandmarker** in the browser to track eye movement and detect when a candidate keeps looking away.
*   **Window Integrity:** Uses the native Page Visibility API to detect tab switching, incrementing violation strikes.
*   **Copy/Paste Blocks:** Natively intercepts and prevents copy/paste actions to prevent external code injection.
*   *Everything runs client-side inside the browser. No video is ever sent to a server, keeping candidate data secure and private.*

### 4. Recruiter Analytics
*   **Behavioral Intelligence Graph:** Visualizes the candidate's trade-off handling (long-term roadmap vs. immediate fire fighting, client happiness vs. internal technical debt, flexibility under pressure).
*   **Predictive Match Score:** Combines behavioral scores, code quality, resume fit, and proctoring integrity flags to output hiring probability.

---

## Tech Stack

*   **App Core:** Next.js 16 (App Router with Turbopack)
*   **Database & API:** Serverless Next.js route handlers
*   **AI Models:** Gemini 2.5 Flash (Conversational Core & RAG), OpenAI TTS `tts-1` (Natural voice generation)
*   **In-Browser ML:** MediaPipe FaceLandmarker WebAssembly, Web Audio API AnalyzerNode
*   **Procedural Audio:** Custom `SFXEngine` using `OscillatorNode` for zero-dependency UI sounds
*   **Editor:** Monaco Editor (`@monaco-editor/react`)
*   **Styling:** HSL-based Tailwind CSS, Framer Motion

---

## Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/ayushshukla1807/InterviewOS.git
   cd InterviewOS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Launch the development server:
   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000` inside your browser.
