
# Mathcounts Club HQ

A comprehensive, AI-powered platform designed for middle school Mathcounts coaches and students. This application streamlines club management, performance tracking, and competition preparation using the Google Gemini API.

## Features

- AI Practice Arena: Generate Mathcounts-style problems on demand with step-by-step solutions and an AI math tutor for hints.
- Coach's Ledger: Automated weighted rankings for students based on quizzes and school rounds.
- Handbook Data Analyzer: Upload official Mathcounts PDFs; the AI extracts problem data, categories, and difficulty levels automatically.
- Smart Scheduler: Bulk-generate club meeting calendars with specific topics and assigned lead coaches.
- Achievement System: Gamified experience for students with badges and streaks to encourage daily practice.
- Performance Insights: Visualized progress charts using Recharts.

## Tech Stack

- Frontend: React 19, TypeScript, Tailwind CSS
- Icons: Heroicons
- Charts: Recharts
- Intelligence: Google Gemini API via `@google/genai`
- Routing: React Router 7

## Getting Started

### Prerequisites

- Node.js (v18+)
- A Google Gemini API Key

### Installation and Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root:
   ```bash
   cp .env .env.local
   ```
3. Set the Gemini API key in `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open the local Vite URL shown in the terminal, typically:
   [http://localhost:5173](http://localhost:5173)

### Available Scripts

- `npm run dev`: Start the Vite development server.
- `npm run build`: Create a production build.
- `npm run preview`: Preview the production build locally.

## Notes

- The app currently loads Tailwind via CDN in `/Users/xchen/Documents/Labs/mathcounts-club-hq/index.html`.
- The client code reads the API key from `import.meta.env.VITE_GEMINI_API_KEY`.

## License

This project is open-source and available under the MIT License.
