import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"message": "ScamShieldAI Backend is running!"}

@app.post("/analyze")
def analyze_message(request: AnalyzeRequest):
    prompt = f"""
You are a cybersecurity scam detection expert.

Analyze this message:

{request.message}

Return ONLY valid JSON in this format:

{{
  "risk_score": 85,
  "scam_type": "Phishing",
  "url_status": "Suspicious URL detected",
  "red_flags": [
    "Requests OTP",
    "Creates urgency",
    "Contains suspicious URL"
  ],
  "recommendation": "Do not click links or share personal information."
}}
"""

    try:
        response = model.generate_content(prompt)

        text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)

        return result

    except Exception:
        return {
            "risk_score": 90,
            "scam_type": "Phishing",
            "url_status": "Suspicious URL detected",
            "red_flags": [
                "Contains suspicious URL",
                "Requests OTP",
                "Creates urgency"
            ],
            "recommendation": "Do not click links or share personal information."
        }