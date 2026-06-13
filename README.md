<div align="center">
  <img src="public/icon.svg" alt="InterviewOS Logo" width="100" />
  <h1>InterviewOS</h1>
  <p><strong>AI-Native Technical Hiring Platform & Workplace Simulation Engine</strong></p>
</div>

---

**InterviewOS** is a next-generation hiring platform that replaces static algorithmic tests with a fully dynamic, AI-driven workplace simulation. Candidates are dropped into a simulated environment complete with stakeholder conflicts, realistic codebase changes, and a post-simulation live AI voice interview that grills them on their decisions.

Live Demo: [interviewos-ytph.onrender.com](https://interviewos-ytph.onrender.com)

---

## 🌟 Core Features

### 1. The Immersive Workspace (Simulation Engine)
Instead of answering multiple-choice questions, the candidate enters a stateful simulated operating system:
*   **Inbox & Slack Channels:** Stakeholders (Product Managers, Engineers, VPs, and Clients) send messages, file bugs, and demand updates dynamically.
*   **Dynamic Stakeholder Memory:** Each stakeholder tracks Trust, Frustration, and Cooperation states based on candidate responses.
*   **Ambiguity & Conflict Engine:** Messages contain missing requirements and contradictory requests to evaluate how candidates manage uncertainty.
*   **Integrated Monaco IDE:** Built-in Monaco editor for live coding tasks triggered by simulation events (e.g., "A critical bug in production!").

### 2. Live AI Voice Interview (RAG & WebRTC)
Immediately after the simulation, the candidate enters a real-time voice interview with an AI.
*   **Contextual Cross-Questioning:** The AI natively ingests the exact log of the candidate's simulation (priorities, code output, stakeholder relations) and questions their trade-offs. (e.g. *"I noticed you ignored Priya's design feedback to rush the CSV export feature. Why did you prioritize the client's feature over team alignment?"*).
*   **Interruptible Audio:** Powered by a Web Audio API `AnalyserNode`, the AI constantly monitors microphone volume and stops speaking instantly if the candidate interrupts.
*   **Dynamic UI Elements:** A glowing waveform visualizer reacts in real-time when the AI speaks.

### 3. Fortress Proctoring
*   **Visual Gaze Tracking:** Uses a WebAssembly build of **MediaPipe FaceLandmarker** locally in the browser to track eye movement and detect when a candidate looks away.
*   **Window Integrity:** Uses the Page Visibility API to detect tab switching.
*   **Strict Execution:** All tracking runs entirely client-side. No video is transmitted, preserving maximum candidate privacy.

### 4. Recruiter Analytics & Real-Time Tracking
*   **Behavioral Intelligence Graph:** Analyzes trade-offs (long-term roadmap vs. immediate fire fighting).
*   **Live Dashboard:** Real-time monitoring of active candidate sessions.

---

## 🏗️ Architecture & Tech Stack

This platform is architected to handle complex, asynchronous AI workloads at scale with secure execution environments.

### Frontend
*   **Framework:** Next.js 16 (App Router with Turbopack)
*   **Editor & Whiteboard:** `@monaco-editor/react`, `@excalidraw/excalidraw`
*   **Styling & Animation:** Tailwind CSS (v4), Framer Motion, Recharts
*   **Audio/Video:** Web Audio API, `MediaPipe` WebAssembly

### Backend & AI
*   **Runtime:** Serverless Next.js Edge Route Handlers
*   **Database:** MongoDB (Mongoose ODM)
*   **AI Models:** Google Gemini 2.5 Flash (Conversational Core & RAG), OpenAI TTS `tts-1` (Natural voice generation)
*   **Authentication:** Custom JWT-based Edge Authentication using `jose` and `bcryptjs`
*   **Payments & Storage:** Stripe API, AWS S3 (Presigned URLs)

---

## 🚀 Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ayushshukla1807/InterviewOS.git
   cd InterviewOS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # AI Providers
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key

   # Database & Auth
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret

   # Storage (AWS S3)
   AWS_REGION=your_aws_region
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_S3_BUCKET=your_s3_bucket_name
   
   # Payments (Optional for dev)
   STRIPE_SECRET_KEY=your_stripe_secret
   ```

4. **Launch the development server:**
   ```bash
   npm run dev
   ```

5. **Visit the app:**
   Open `http://localhost:3000` in your browser.

---

## 📄 License
This project is for demonstration and portfolio purposes.
