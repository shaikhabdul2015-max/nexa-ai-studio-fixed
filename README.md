# NEXA AI - Next-Gen Multimodal Architecture

**NEXA AI** is a powerful and modern Next-Generation Multimodal Intelligence platform designed for research, development, data analysis, and synthesis. Built with a robust architecture that is Gemini 1.5 & 3.1 Pro Ready, it features isolated memory, context awareness, and real-time SSE streaming.

## 🚀 Key Features (8 Core Modalities)

The platform provides 8 specialized operational modules accessible directly from the dashboard:

* **Start New Chat:** Multi-turn streaming chat equipped with multimodal vision and advanced reasoning.
* **Deep Research:** Rigorous, grounded web investigation backed by source verification and citations.
* **Analyze Document:** Extract data, compare complex contracts, and summarize heavy PDFs.
* **Analyze Data:** Upload CSV or tabular files to generate statistical insights, trends, and visual charts.
* **Create Image (4K Res):** High-resolution image generation up to 4K using Google Gemini.
* **Start Coding:** A full-featured integrated development environment (IDE) with syntax highlighting, an isolated sandbox, and an AI pair engineer.
* **Create Agent:** Build, customize, and deploy specialized AI agents utilizing 8 curated templates.
* **Voice AI Studio (Real-time):** Real-time speech-to-speech interaction, instant transcription, and deep audio intelligence.

## 🛠️ Tech Stack

* **Frontend & Framework:** Remix, Vite
* **Language:** TypeScript
* **Package Manager:** Bun / NPM
* **Core AI Integration:** Gemini Online (1.5 & 3.1 Pro Ready)
* **Deployment Target:** Pre-configured for Render (`://onrender.com`) and Vercel

## 💻 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com
cd nexa-ai-studio-fixed
```

### 2. Install Dependencies
This project is optimized for **Bun**, but you can also use standard npm:
```bash
bun install
# or
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory by copying the example file:
```bash
cp .env.example .env
```
Open the `.env` file and add your Google Gemini API credentials:
```env
GEMINI_API_KEY=your_api_key_here
```

### 4. Run the Development Server
```bash
bun run dev
# or
npm run dev
```
Open your browser and navigate to the local port displayed in your terminal (usually `http://localhost:5173`).

## 📦 Production Build & Deployment

* **Build Everything:** Compiles both frontend client assets and backend structures seamlessly.
  ```bash
  npm run build:all
  ```
* **Build Server Only:** Bundles backend Node environments explicitly.
  ```bash
  npm run build:server
  ```
* **Routing Security:** Features built-in Single Page Application (SPA) route rewrites via `vercel.json` to prevent unexpected 404 errors during client-side page refreshes.
