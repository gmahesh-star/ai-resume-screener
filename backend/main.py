from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from backend.utils.file_parser import extract_text
from backend.services.ai_service import match_resume
from backend.services.chatbot_service import get_chat_response, get_suggested_questions
from pydantic import BaseModel
from backend.database import init_db, save_result, get_all_results, clear_results

app = FastAPI(title="AI Resume Screening API")

# Allow all CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/upload-resume")
async def upload_resumes(job_description: str = Form(...), files: List[UploadFile] = File(...)):
    if not job_description or len(job_description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Job description is required and must be meaningful.")
    
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    
    results = []
    
    for file in files:
        content = await file.read()
        filename = file.filename
        
        try:
            resume_text = extract_text(content, filename)
            
            if not resume_text:
                 save_result(filename, 0.0, [], [], status="Failed Extraction/Empty")
                 results.append({"filename": filename, "error": "Extraction failed or empty file."})
                 continue
                 
            # AI Magic happens here
            match_data = match_resume(resume_text, job_description)
            
            save_result(
                filename=filename,
                match_score=match_data["match_score"],
                matched_skills=match_data["matched_skills"],
                missing_skills=match_data["missing_skills"],
                status="Success"
            )
            
            results.append({
                "filename": filename,
                "score": match_data["match_score"],
                "matched_skills": match_data["matched_skills"],
                "missing_skills": match_data["missing_skills"]
            })
            
        except Exception as e:
            save_result(filename, 0.0, [], [], status=f"Error: {str(e)}")
            results.append({"filename": filename, "error": str(e)})

    # Return results sorted by score (Ranking)
    results = sorted(results, key=lambda x: x.get("score", 0), reverse=True)
    return {"status": "success", "results": results}

@app.get("/results")
async def get_results_endpoint():
    try:
        results = get_all_results()
        return {"status": "success", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/results")
async def clear_results_endpoint():
    clear_results()
    return {"status": "success", "message": "Results cleared"}

class ChatRequest(BaseModel):
    message: str
    context: dict = None

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    response = get_chat_response(req.message, req.context)
    return {"status": "success", **response}

@app.get("/chat/suggestions")
async def chat_suggestions_endpoint():
    return {"status": "success", "suggestions": get_suggested_questions()}
