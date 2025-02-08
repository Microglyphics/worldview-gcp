# main.py
import os
from pathlib import Path
import logging
import json
from decimal import Decimal
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse
from src.api.routes import pdf_routes

from models import SurveyResponse, Question
from db_manager import DatabaseManager
from src.visualization.perspective_analyzer import PerspectiveAnalyzer

# Dev environment setup
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database manager instance
logger.info("Creating database manager instance")
db_manager = DatabaseManager()

# Get base directory for data files
BASE_DIR = Path(__file__).resolve().parent

# Create FastAPI app
app = FastAPI(
    title="Modernity Worldview Analysis API",
    description="API for the Modernity Worldview Analysis survey",
    version="1.0.0"
)

# Setup templates and static files
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://modernity-worldview.uc.r.appspot.com",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"]
)

app.include_router(pdf_routes.router, prefix="/api")

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' https:; "
        "img-src 'self' https: data:; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "connect-src 'self' https://unpkg.com"
    )
    return response

# Main routes and handlers
@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/submit")
async def submit_survey(response: SurveyResponse):
    try:
        data = response.dict()
        for key in data:
            if isinstance(data[key], Decimal):
                data[key] = float(data[key])
        
        record_id = db_manager.save_response(data)
        return {
            "status": "success",
            "message": "Survey response recorded",
            "session_id": response.session_id,
            "record_id": record_id
        }
    except Exception as e:
        logger.error(f"Submission error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/questions")
async def get_questions():
    try:
        questions = load_questions()
        return questions
    except Exception as e:
        logger.error(f"Error getting questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_survey(responses: dict):
    try:
        questions_data = load_questions()["questions"]
        templates = load_templates()
        
        total_scores = calculate_perspective_scores(responses, questions_data)
        analysis = PerspectiveAnalyzer.get_perspective_summary(total_scores)
        description = PerspectiveAnalyzer.get_perspective_description(analysis)
        category_responses = get_category_responses(analysis, templates)
        
        return {
            "status": "success",
            "perspective": description,
            "scores": total_scores,
            "analysis": analysis,
            "category_responses": category_responses
        }
    except Exception as e:
        logger.error(f"Error analyzing survey: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
def load_questions():
    path = BASE_DIR / "src" / "data" / "questions_responses.json"
    with open(path) as f:
        data = json.load(f)
        if "questions" not in data:
            raise ValueError("Invalid questions data format")
        return data

def load_templates():
    path = BASE_DIR / "src" / "data" / "response_templates.json"
    with open(path) as f:
        data = json.load(f)
        if "categories" not in data:
            raise ValueError("Invalid templates data format")
        return data["categories"]

def calculate_perspective_scores(responses: dict, questions_data: dict) -> list:
    total_scores = [0, 0, 0]  # [PreModern, Modern, PostModern]
    
    for q_id, response_num in responses.items():
        if response_num is not None:
            question_key = q_id.replace("_response", "").upper()
            if question_key in questions_data:
                question = questions_data[question_key]
                response_idx = response_num - 1
                if 0 <= response_idx < len(question["responses"]):
                    scores = question["responses"][response_idx]["scores"]
                    total_scores = [a + b for a, b in zip(total_scores, scores)]
    
    total = sum(total_scores)
    if total > 0:
        normalized_scores = [round((score / total) * 100, 1) for score in total_scores]
        adjustment = 100 - sum(normalized_scores)
        normalized_scores[-1] += adjustment
        return normalized_scores
    return [0, 0, 0]

def get_category_responses(analysis: dict, templates: dict) -> dict:
    perspective_type = analysis['primary']
    if analysis['strength'] != 'Strong' and analysis['secondary']:
        perspective_type = f"{analysis['primary']}-{analysis['secondary']}"
    elif analysis['strength'] == 'Mixed':
        perspective_type = 'Modern-Balanced'
        
    category_responses = {}
    for category in templates:
        if perspective_type in templates[category]:
            category_responses[category] = templates[category][perspective_type]["response"]
        else:
            primary = perspective_type.split('-')[0]
            category_responses[category] = templates[category][primary]["response"]
            
    return category_responses