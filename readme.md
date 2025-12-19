
# 🎙️ AI Interviewer: Professional Technical Prep Platform

A full-stack, real-time AI interview platform built to help developers sharpen their technical skills. This project combines a **Node.js/Express** backend with a **React/Redux** frontend and a **Python FastAPI** microservice powered by **Mistral** and **Whisper AI**.

## 🌟 Key Features

* **Dual-Input Interview Runner**: A split-screen experience where candidates can write code in a **Monaco Editor** while explaining their thought process via **Voice Recording**.
* **Smart AI Evaluation**: Intelligent grading that distinguishes between **Conceptual/Oral** questions (prioritizing speech) and **Coding Challenges** (analyzing both logic and verbal communication).
* **Automated Transcription**: Integrated **OpenAI Whisper** (running locally via Python) to convert user speech into text for analysis.
* **Dynamic Question Generation**: Role-specific questions (MERN, Python, Data Science, etc.) generated on-the-fly based on user-defined difficulty levels.
* **Performance Analytics**: Detailed session reviews featuring **Chart.js** visualizations and per-question technical and confidence scores.
* **Real-time Updates**: **Socket.io** integration for live AI processing status updates (Transcribing, Evaluating, Completed).
* **Mobile-First Design**: Fully responsive navigation and forms, optimized for both desktop and mobile devices.

---

## 🏗️ Technical Architecture

The platform is split into three main services to handle high-compute AI tasks efficiently:

1. **Frontend (React & Redux)**: Manages state with Redux Toolkit, handles real-time audio recording, and provides a professional coding environment.
2. **Backend (Node.js & Express)**: Orchestrates user authentication, session management, and coordinates between the database and the AI microservice.
3. **AI Microservice (FastAPI & Python)**: Handles heavy-lifting tasks like Whisper transcription and LLM-based evaluation using Ollama (Mistral).

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** (v18+)
* **Python** (3.9+)
* **MongoDB** (Local or Atlas)
* **Ollama** (with `mistral` model installed)

### 1. AI Microservice Setup

```bash
cd ai-service
pip install -r requirements.txt
python main.py

```

### 2. Backend Setup

Create a `.env` file in the `backend` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
AI_SERVICE_URL=http://localhost:8000

```

```bash
cd backend
npm install
npm run dev

```

### 3. Frontend Setup

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_id

```

```bash
cd frontend
npm install
npm run dev

```

---

## 📊 Database Schema

The core of the interview logic resides in the **Session Model**, which tracks individual questions, user submissions (code + audio), and AI-generated metrics.

```javascript
// Key Data Structure
{
  role: String,
  level: String,
  overallScore: Number,
  questions: [{
    questionText: String,
    questionType: 'oral' | 'coding',
    userAnswerText: String, // Transcribed from audio
    userSubmittedCode: String,
    technicalScore: Number,
    confidenceScore: Number,
    aiFeedback: String
  }]
}

```

---

## 🛠️ Tech Stack

* **Frontend**: React, Redux Toolkit, Tailwind CSS, Monaco Editor, Chart.js, React-Toastify.
* **Backend**: Node.js, Express, MongoDB/Mongoose, Socket.io, Multer.
* **AI Service**: FastAPI, OpenAI Whisper, Ollama (Mistral), Pydub.

---

## 📝 License

This project is licensed under the MIT License.

---

