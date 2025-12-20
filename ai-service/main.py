import uvicorn
import os
import io              
import json            
import tempfile
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
import ollama
import whisper
from pydub import AudioSegment

load_dotenv()

# --- Configuration ---
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "mistral")

# Initialize FastAPI App
app = FastAPI(title="AI Interviewer Microservice", version="1.0")

# Add CORS middleware to allow requests from Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model Loading (Optimization) ---
# Load the Whisper model once on startup to save time and memory.
# Using 'base.en' model for efficiency/size.
WHISPER_MODEL = None
try:
    print("Loading Whisper Model...")
    WHISPER_MODEL = whisper.load_model("base.en")
    print("Whisper Model loaded successfully.")
except Exception as e:
    print(f"Failed to load Whisper model: {e}")
# --- Pydantic Schemas for Request/Response ---



# --- Updated Pydantic Schema ---
class UnifiedEvaluationRequest(BaseModel):
    question: str
    question_type: str  # Add this to tell AI the context
    role: str
    level: Optional[str] = None
    user_answer: Optional[str] = None
    user_code: Optional[str] = None


class EvaluationResponse(BaseModel):
    """Schema for the AI's structured evaluation."""
    technicalScore: int
    confidenceScore: int
    aiFeedback: str
    idealAnswer: str

class QuestionRequest(BaseModel):
    role: str = "MERN Stack Developer"
    level: str = "Mid-Level"
    count: int = 5
    interview_type: str = "coding-mix" # Add this field

class QuestionResponse(BaseModel):
    """Schema for the generated questions."""
    questions: list[str]
    model_used: str

# --- Health Check ---
@app.get("/")
async def root():
    """Simple health check for the service."""
    return {"message": "AI Interviewer Microservice is running!", "model": OLLAMA_MODEL_NAME}

# --- Core LLM Function: Generate Interview Questions ---
@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionRequest):
    try:
        # Determine counts based on interview type
        if request.interview_type == "coding-mix":
            coding_count = int(request.count * 0.2)
            oral_count = request.count - coding_count
            
            instruction = (
                f"The first {coding_count} questions MUST be coding challenges requiring function implementation. "
                f"The remaining {oral_count} MUST be conceptual oral questions."
            )
        else:
            # PURE ORAL MODE
            instruction = "All questions MUST be conceptual oral questions. Do NOT generate any coding or implementation challenges."

        system_prompt = (
            "You are a professional technical interviewer. "
            "Task: Generate interview questions. No conversational text or numbering. "
            f"Crucial: {instruction} "
            "Output exactly one question per line."
        )

        user_prompt = (
            f"Generate exactly {request.count} unique interview questions for a "
            f"'{request.level}' level '{request.role}'."
        )

        response = ollama.generate(
            model=OLLAMA_MODEL_NAME,
            prompt=user_prompt,
            system=system_prompt,
            options={'temperature': 0.6}
        )

        raw_text = response['response'].strip()
        questions = [q.strip() for q in raw_text.split('\n') if q.strip()]
        return QuestionResponse(questions=questions[:request.count], model_used=OLLAMA_MODEL_NAME)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# --- Transcription Endpoint (New) ---


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        audio_in_memory = io.BytesIO(audio_bytes)

        # Auto-detect audio format
        audio_segment = AudioSegment.from_file(audio_in_memory)

        # Cross-platform temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            temp_audio_path = tmp.name
            audio_segment.export(temp_audio_path, format="mp3")

        if not WHISPER_MODEL:
            raise HTTPException(status_code=503, detail="Whisper model not loaded.")

        result = WHISPER_MODEL.transcribe(temp_audio_path)
        os.remove(temp_audio_path)

        return {"transcription": result["text"].strip()}

    except Exception as e:
        if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        raise HTTPException(status_code=500, detail=str(e))

# --- LLM Evaluation Endpoint (Updated for Unified Submission) ---
# backend/ai_service/main.py

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: UnifiedEvaluationRequest):
    try:
        # 1. Determine Context Instructions
        if request.question_type == "oral":
            assessment_instruction = (
                "This is a CONCEPTUAL ORAL question. Focus purely on the candidate's verbal explanation. "
                "Ignore any code blocks. "
                "CRITICAL: If the transcript is empty, nonsense (e.g. 'blah blah', 'testing'), or irrelevant to the question, SCORE 0."
            )
        else:
            assessment_instruction = (
                "This is a CODING CHALLENGE. Evaluate the code logic and efficiency. "
                "Use the transcription only for insight into their thought process. "
                "CRITICAL: If the code is 'undefined', empty, just comments, or random characters, SCORE 0."
            )

        # 2. STRICT System Prompt (Fixes Hallucination & JSON Issues)
        system_prompt = (
            "You are a strict technical interviewer. "
            "Do NOT hallucinate positive reviews for bad input. "
            "RULE 1: If the answer is gibberish, irrelevant, or missing, return 'technicalScore': 0 and 'confidenceScore': 0. "
            "RULE 2: For 'idealAnswer', provide a clean Markdown string. Do NOT return a nested JSON object. "
            f"Context: {assessment_instruction} "
            "Respond ONLY with a JSON object. "
            "Required keys: 'technicalScore' (0-100), 'confidenceScore' (0-100), 'aiFeedback', 'idealAnswer'."
        )

        # 3. User Prompt
        user_prompt = (
            f"Role: {request.role}\n"
            f"Question: {request.question}\n"
            f"Verbal Answer: {request.user_answer or 'No verbal answer provided'}\n"
            f"Code Answer: {request.user_code or 'No code provided'}\n"
        )

        # 4. Generate with Low Temperature (0.1 = Stricter, Less Creative)
        response = ollama.generate(
            model=OLLAMA_MODEL_NAME,
            prompt=user_prompt,
            system=system_prompt,
            format="json",
            options={"temperature": 0.1} 
        )

        response_text = response["response"].strip()
        
        # 5. Safe JSON Parsing & Validation
        try:
            evaluation_data = json.loads(response_text)
            
            # FAILSAFE: Ensure idealAnswer is a string, not a nested dict
            if 'idealAnswer' in evaluation_data and not isinstance(evaluation_data['idealAnswer'], str):
                evaluation_data['idealAnswer'] = json.dumps(evaluation_data['idealAnswer'])
            
            return EvaluationResponse(**evaluation_data)
            
        except json.JSONDecodeError:
            # Fallback: Try to clean common JSON formatting errors
            import re
            fixed_text = re.sub(r'[\n\r\t]', ' ', response_text)
            try:
                evaluation_data = json.loads(fixed_text)
                
                if 'idealAnswer' in evaluation_data and not isinstance(evaluation_data['idealAnswer'], str):
                    evaluation_data['idealAnswer'] = json.dumps(evaluation_data['idealAnswer'])
                    
                return EvaluationResponse(**evaluation_data)
            except:
                 # Final Resort: Return a generic failure response so the app doesn't crash
                 print(f"CRITICAL PARSE ERROR: {response_text}")
                 return EvaluationResponse(
                     technicalScore=0,
                     confidenceScore=0,
                     aiFeedback="AI Output Error. Please review manually.",
                     idealAnswer="Error generating answer."
                 )

    except Exception as e:
        print(f"Evaluation Logic Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI evaluation failed: {str(e)}")
    
# --- Run the application using Uvicorn ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=AI_SERVICE_PORT)