# AI-Powered Technical Interview Prepper (AI Proctor)

An advanced, AI-driven mock interview platform designed to help candidates prepare for technical interviews. The platform dynamically generates role-specific interview questions, supports both coding and conceptual questions, and provides real-time, comprehensive evaluation of the candidate's answers.

## 🚀 Features

- **Dynamic Question Generation**: Automatically generates interview questions tailored to the candidate's specific role (e.g., MERN Stack Developer) and experience level (e.g., Junior, Senior).
- **Coding & Conceptual Challenges**: Supports a mix of hands-on coding challenges and conceptual oral questions.
- **Adaptive Follow-up Questions**: Dynamically generates follow-up questions based on the candidate's previous answers and code quality.
- **Lightning-Fast AI (Gemini 2.5 Flash)**: Uses Google's Gemini 2.5 Flash model for incredibly fast, native speech-to-text audio transcription and intelligent question evaluations.
- **Key Rotation**: Built-in API key rotation logic to handle high-traffic environments and prevent rate-limiting.
- **Live Proctoring & Analytics**: Integrates TensorFlow.js (COCO-SSD) for candidate monitoring and Chart.js for visualizing performance metrics.
- **Real-Time Communication**: Uses Socket.io for live syncing between the client and backend.

## 🛠️ Technology Stack

### Frontend (Vercel Ready)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + PostCSS
- **State Management**: Redux Toolkit
- **Code Editor**: Monaco Editor
- **Machine Learning**: TensorFlow.js (COCO-SSD)
- **Authentication**: Google OAuth (@react-oauth/google) + JWT

### Backend (Node.js API)
- **Framework**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io
- **Authentication**: JWT & Google Auth Library

### AI Service (Python Microservice)
- **Framework**: FastAPI
- **LLM & Speech-to-Text**: Google GenAI SDK (`gemini-2.5-flash`)
- **Resilience**: Exponential Backoff Retry Mechanisms & Key Rotation

## 📁 Project Structure

```
.
├── frontend/             # React/Vite Frontend application
├── backend/              # Node.js/Express Main API server
├── ai-service/           # Python/FastAPI Microservice for AI evaluations and STT
```

## ⚙️ Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (3.9 or higher)
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
Run it: `python main.py`

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
Run it: `npm run dev`

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
Run it: `npm run dev`

---

## ☁️ Cloud Deployment (Free Tier)

This repository is optimized for free-tier deployments on **Vercel** and **Render**.

### 1. Database (MongoDB Atlas)
- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Allow network access from anywhere (`0.0.0.0/0`).
- Copy your connection string.

### 2. AI Service (Render)
- Deploy `ai-service` as a **Web Service** on [Render](https://render.com).
- **Build Command**: `pip install -r requirements.txt`
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

## 📝 License
ISC License
