<div align="center">
  <img src="frontend/public/logo.svg" alt="Lumina AI Logo" width="120" />
  <h1>Lumina AI - Next-Gen Technical Interviewer</h1>
  <p>An advanced, AI-driven mock interview platform designed to help candidates prepare for technical interviews with real-time feedback, voice synthesis, and performance analytics.</p>
</div>

---

## 🌟 Overview

Lumina AI dynamically generates role-specific interview questions, supports both coding and conceptual questions, and provides real-time, comprehensive evaluation of the candidate's answers. It simulates a realistic interview environment by utilizing **Text-to-Speech (TTS)** for human-like voice interactions and **Speech-to-Text (STT)** via Google Gemini for seamless verbal communication.

## 🚀 Key Features

- **Dynamic Question Generation**: Automatically generates interview questions tailored to the candidate's specific role (e.g., *MERN Stack Developer*) and experience level (e.g., *Junior, Senior*).
- **Coding & Conceptual Challenges**: Supports a mix of hands-on coding challenges via Monaco Editor and conceptual oral questions.
- **Adaptive Follow-up Questions**: Dynamically generates follow-up questions based on the candidate's previous answers and code quality.
- **Lightning-Fast AI (Gemini 2.5 Flash)**: Uses Google's Gemini 2.5 Flash model for incredibly fast, native audio evaluation and intelligent question generation.
- **Human-like TTS Voices**: Integrated with `edge-tts` to stream highly realistic AI voices directly to the browser, eliminating the robotic feel of standard web speech APIs.
- **Analytics Dashboard**: Comprehensive user profile dashboard powered by `chart.js` that tracks historical performance, skill breakdowns (Radar charts), and progress over time.
- **Live Proctoring**: Integrates TensorFlow.js (COCO-SSD) for candidate monitoring and anti-cheat mechanisms.
- **Real-Time Communication**: Uses Socket.io for live syncing between the client, Node.js backend, and Python microservice to provide an instantaneous, polling-free experience.

## 🛠️ Technology Stack

### Frontend (Vite + React)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + PostCSS
- **State Management**: Redux Toolkit
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Machine Learning**: TensorFlow.js (COCO-SSD) for proctoring
- **Charts**: Chart.js + react-chartjs-2
- **Authentication**: Google OAuth + JWT

### Backend (Node.js API)
- **Framework**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io
- **Authentication**: JWT & Google Auth Library

### AI Service (Python Microservice)
- **Framework**: FastAPI
- **LLM Engine**: Google GenAI SDK (`gemini-2.5-flash`)
- **Voice Synthesis (TTS)**: `edge-tts` (Microsoft Edge Neural Voices)
- **Audio Processing**: `pydub`, `python-multipart`
- **Resilience**: Exponential Backoff Retry Mechanisms & API Key Rotation

## 📂 Project Structure

```text
.
├── frontend/             # React/Vite Frontend application
├── backend/              # Node.js/Express Main API server
└── ai-service/           # Python/FastAPI Microservice for AI evaluations and TTS
```

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (3.9 or higher)
- [FFmpeg](https://ffmpeg.org/) (Required for `pydub` audio processing)
- Google Gemini API Keys

### 1. Setup AI Service (Python)
```bash
cd ai-service
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```
Create a `.env` in `ai-service/`:
```env
AI_SERVICE_PORT=8000 
GOOGLE_API_KEY1=your_api_key_here
GOOGLE_API_KEY2=your_api_key_here
```
Run the FastAPI server:
```bash
python main.py
```

### 2. Setup Backend (Node.js)
```bash
cd backend
npm install
```
Create a `.env` in `backend/`:
```env
MONGO_URI=mongodb://localhost:27017/ai
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=supersecretjwtkey
GOOGLE_CLIENT_ID=your_google_client_id
```
Start the development server:
```bash
npm run dev
```

### 3. Setup Frontend (React)
```bash
cd frontend
npm install
```
Create a `.env` in `frontend/`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```
Start the Vite dev server:
```bash
npm run dev
```

---

## ☁️ Cloud Deployment (Free Tier)

This repository is optimized for free-tier deployments on **Vercel** and **Render**.

### 1. Database (MongoDB Atlas)
- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Allow network access from anywhere (`0.0.0.0/0`).
- Copy your connection string.

### 2. AI Service (Render)
- Deploy `ai-service` as a **Web Service** on [Render](https://render.com).
- **Build Command**: `pip install -r requirements.txt && apt-get update && apt-get install -y ffmpeg` *(Note: ffmpeg must be installed on the deployment environment for audio parsing to work).*
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set your `GOOGLE_API_KEY`s in the Environment Variables.

### 3. Node.js Backend (Render)
- Deploy `backend` as a **Web Service** on Render.
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Set `MONGO_URI`, `AI_SERVICE_URL` (URL from Step 2), and `FRONTEND_URL` in the Environment Variables.

### 4. Frontend (Vercel)
- Deploy `frontend` on [Vercel](https://vercel.com) (Vite preset will be auto-detected).
- Set `VITE_API_URL` to your deployed Backend URL (from Step 3).

## 📄 License
ISC License
