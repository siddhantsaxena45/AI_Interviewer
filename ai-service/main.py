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
from google import genai
from google.genai import types
from google.genai.errors import APIError
import asyncio

load_dotenv()

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))
GEMINI_MODEL_NAME = "gemini-2.5-flash"

app = FastAPI(title="AI Interviewer Microservice", version="1.0")

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Key Rotation Logic ---
class RotatingGeminiClient:
    def __init__(self):
        self.clients = []
        self.current_index = 0
        
        # Load up to 10 keys
        for i in range(1, 11):
            key = os.getenv(f"GOOGLE_API_KEY{i}")
            if key:
                self.clients.append(genai.Client(api_key=key))
        
        if not self.clients:
            print("WARNING: No GOOGLE_API_KEYs found in environment!")
            
    def get_client(self):
        if not self.clients:
            raise HTTPException(status_code=500, detail="Gemini API keys not configured.")
        client = self.clients[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.clients)
        return client

gemini_manager = RotatingGeminiClient()

async def generate_with_retry(client, **kwargs):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return await client.aio.models.generate_content(**kwargs)
        except APIError as e:
            if attempt < max_retries - 1 and e.code in [429, 503]:
                print(f"Gemini API Error (Code {e.code}). Retrying in {2 ** attempt}s...")
                await asyncio.sleep(2 ** attempt)
            else:
                raise

# --- Request / Response Models ---
class QuestionResquest(BaseModel):
    role: str = "MERN Stack Developer"
    level: str = "Junior"
    count: int = 5
    interview_type: str = "coding-mix"

class NextQuestionRequest(BaseModel):
    role: str
    level: str
    interview_type: str
    previous_question: str
    user_answer: Optional[str] = None
    user_code: Optional[str] = None
    ai_feedback: str

class QuestionResponse(BaseModel):
    questions: list[str]
    model_used: str

class EvaluationRequest(BaseModel):
    question: str
    question_type: str
    role: str
    level: str
    user_answer: Optional[str] = None
    user_code: Optional[str] = None

class EvaluationResponse(BaseModel):
    technicalScore: int
    confidenceScore: int
    aiFeedback: str
    idealAnswer: str

@app.get("/")
async def root():
    return {"message": "Hello from AI Interviewer Microservice !", "model": GEMINI_MODEL_NAME}


@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionResquest):
    try:
        client = gemini_manager.get_client()
        
        if request.interview_type == "coding-mix":
            coding_count = int(request.count * 0.2)
            oral_oral = int(request.count) - int(coding_count)
            instruction = (
                f"The first {coding_count} questions MUST be coding challenge requiring function implementation. "
                f"The remaining {oral_oral} questions MUST be conceptual oral questions."
            )
        else:
            instruction = "All questions MUST be conceptual oral questions. Do Not generate any coding or implementation challenges."

        system_instruction = (
            "You are an expert technical interviewer. "
            "Task: Generate interview questions. "
            "CRITICAL: Do NOT include any introductory phrases like 'To help you understand...' or 'Here is a question:'. "
            "CRITICAL: Start immediately with the question body. "
            f"Instructions: {instruction} "
            "Respond ONLY with a JSON object containing a 'questions' array of strings."
        )

        user_prompt = (
            f"Generate exactly {request.count} unique, comprehensive interview questions for a {request.level} level {request.role}. "
            "Preserve all necessary code context or scenario details within the single question string."
        )
        
        response = await generate_with_retry(
            client=client,
            model=GEMINI_MODEL_NAME,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.6,
                response_mime_type="application/json",
            )
        )

        response_text = response.text.strip()
        response_data = json.loads(response_text)

        questions = response_data.get('questions', [])
        
        # Fallback if AI didn't return an array but a string
        if isinstance(questions, str):
            questions = [questions]
            
        clean_questions = []
        for q in questions:
            if isinstance(q, dict):
                clean_questions.append(q.get('question') or q.get('text') or list(q.values())[0])
            else:
                clean_questions.append(str(q))
            
        return QuestionResponse(questions=clean_questions[:request.count], model_used=GEMINI_MODEL_NAME)

    except Exception as e:
        print(f"generate_questions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/generate-next-question")
async def generate_next_question(request: NextQuestionRequest):
    try:
        client = gemini_manager.get_client()
        
        system_instruction = (
            "You are a professional technical interviewer. "
            "Task: Generate ONE follow-up interview question based on the candidate's last answer. "
            "If the answer was poor, ask a simpler follow-up. If it was good, challenge them with something advanced. "
            "CRITICAL: Do NOT include any conversational filler (e.g. 'Good job!', 'Interesting approach...'). "
            "CRITICAL: Start immediately with the question body. "
            "Respond ONLY with a JSON object: {'question': 'text', 'questionType': 'oral' | 'coding'}"
        )

        user_prompt = (
            f"Role: {request.role}\nLevel: {request.level}\n"
            f"Previous Question: {request.previous_question}\n"
            f"Candidate's Answer: {request.user_answer or 'None'}\n"
            f"Candidate's Code: {request.user_code or 'None'}\n"
            f"Evaluation: {request.ai_feedback}\n"
            "Ask the next question now."
        )

        response = await generate_with_retry(
            client=client,
            model=GEMINI_MODEL_NAME,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                response_mime_type="application/json",
            )
        )

        response_text = response.text.strip()
        next_q_data = json.loads(response_text)

        return {"question": next_q_data.get('question', ""), "questionType": next_q_data.get('questionType', 'oral')}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    temp_audio_path = None
    try:
        client = gemini_manager.get_client()
        
        # Save uploaded file temporarily
        audio_bytes = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            temp_audio_path = tmp.name
            tmp.write(audio_bytes)
        
        # Upload to Gemini API
        uploaded_file = await client.aio.files.upload(file=temp_audio_path)
        
        system_instruction = "You are an expert audio transcriptionist. Your ONLY job is to transcribe the spoken words in the audio file."
        user_prompt = "Transcribe the exact words spoken in this audio file. Output nothing else. Do not add formatting like quotes."
        
        response = await generate_with_retry(
            client=client,
            model=GEMINI_MODEL_NAME,
            contents=[uploaded_file, user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1
            )
        )
        
        transcription = response.text.strip()
        
        # Clean up the file from Gemini and local
        await client.aio.files.delete(name=uploaded_file.name)
        os.remove(temp_audio_path)
        
        return {"transcription": transcription}

    except Exception as e:
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest):
    try:
        client = gemini_manager.get_client()
        
        if request.question_type == "oral":
            assessment_instruction = (
                "This is a conceptual oral question. Focus purely on candidate's verbal explanation. "
                "Ignore any code blocks. "
                "CRITICAL: If the transcript is empty, nonsense (e.g. 'blah blah','testing') or irrelevant to the question, SCORE 0."
            )
        else:
            assessment_instruction = (
                "This is a coding challenge question. Evaluate the code logic and efficiency. "
                "Use the transcription only for insight into their thought process. "
                "CRITICAL: If the code is 'undefined', empty, just random comments, or random characters, SCORE 0."
            )
        
        system_instruction = (
            "You are a strict technical interviewer. "
            "Do NOT hallucinate positive reviews for bad input. "
            "RULE 1: If the answer is gibberish, irrelevant, or missing, return 'technicalScore':0 and 'confidenceScore':0. "
            "RULE 2: For 'idealAnswer', provide a clean Markdown string. Do NOT return a nested JSON object. "
            f"Context: {assessment_instruction}"
        )
        
        user_prompt = (
            f"Role: {request.role}\n"
            f"Question: {request.question}\n"
            f"Level: {request.level}\n"
            f"Verbal Answer: {request.user_answer or 'No verbal answer provided'}\n"
            f"Code Answer: {request.user_code or 'No code provided'}\n"
        )
        
        # We need the output to match the EvaluationResponse schema exactly
        response = await generate_with_retry(
            client=client,
            model=GEMINI_MODEL_NAME,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "technicalScore": {"type": "INTEGER"},
                        "confidenceScore": {"type": "INTEGER"},
                        "aiFeedback": {"type": "STRING"},
                        "idealAnswer": {"type": "STRING"}
                    },
                    "required": ["technicalScore", "confidenceScore", "aiFeedback", "idealAnswer"]
                }
            )
        )
        
        response_text = response.text.strip()
        evaluation_data = json.loads(response_text)
                
        if 'idealAnswer' in evaluation_data and not isinstance(evaluation_data['idealAnswer'], str):
            evaluation_data['idealAnswer'] = json.dumps(evaluation_data['idealAnswer'])
            
        return EvaluationResponse(**evaluation_data)

    except Exception as e:
        print(f"Failed to generate response: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=AI_SERVICE_PORT)