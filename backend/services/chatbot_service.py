import random
import re
from backend.services.ai_service import sentence_model
from sklearn.metrics.pairwise import cosine_similarity

# ----------------------------------------------------
# 1. EXPANDED KNOWLEDGE BASE
# We expanded this to cover ATS, more resume scenarios, troubleshooting,
# and generalized app interactions.
# ----------------------------------------------------
KNOWLEDGE_BASE = [
    {"question": "How do I upload a resume?", "answer": "You can easily upload a resume by dragging and dropping your PDF or DOCX files into the central upload area, or by clicking the 'Upload' area to browse for files."},
    {"question": "What file formats are supported?", "answer": "We currently process PDF (.pdf) and Microsoft Word (.docx) files."},
    {"question": "How does the scoring work?", "answer": "Your match score uniquely blends two powerful methods: Semantic Similarity (70%) to understand context and meaning, and TF-IDF (30%) to ensure specific technical keywords are present."},
    {"question": "What is semantic similarity?", "answer": "Instead of just checking if a word exactly matches, Semantic Similarity uses an AI (Sentence Transformers) to understand the concept. For instance, 'predictive modeling' semantically matches 'machine learning'!"},
    {"question": "How can I improve my match score?", "answer": "To significantly boost your score, customize your resume for the specific job description. Ensure you explicitly list the core tools, skills, and languages they are asking for, ideally in a 'Skills' section."},
    {"question": "How to write a good job description?", "answer": "An effective job description separates 'Must-Have' technical skills (like Python, Docker, SQL) from 'Nice-to-Have' skills, states expected experience years, and clarifies daily responsibilities."},
    {"question": "What skills should I look for in a Python developer?", "answer": "A modern Python developer should ideally know core Python, Web Frameworks (FastAPI/Django), REST APIs, Databases (SQL/NoSQL), Git, and testing tools like PyTest."},
    {"question": "Why did a candidate score low?", "answer": "Low scores generally occur if the candidate entirely lacks the core skills requested in the job description, or if their resume is so short the AI can't build a strong context graph."},
    {"question": "What does a high score mean?", "answer": "A high score (> 75%) indicates the candidate is a fantastic match contextually and technically for the current job description, making them a prime candidate for a phone screen!"},
    {"question": "Who built this AI Resume Screener?", "answer": "This is a powerful, smart hiring assistant designed with modern web technologies on the frontend and blazing-fast Python AI (FastAPI, spaCy, Transformers) on the backend."},
    {"question": "Can I process multiple resumes at once?", "answer": "Absolutely! Drop as many resumes as you want into the upload area; our AI will analyze and rank them all simultaneously."},
    {"question": "Is my data stored securely?", "answer": "Yes! We run entirely on local AI models. We DO NOT send your resumes to OpenAI, Google, or any third party APIs. All data limits to your local SQLite database."},
    {"question": "What is an ATS?", "answer": "ATS stands for Applicant Tracking System. It's software used by recruiters (like this app!) to filter, parse, and rank large numbers of resumes based on job descriptions."},
    {"question": "How to beat the ATS?", "answer": "To pass an ATS, use standard section headers (Experience, Education, Skills), avoid complex formatting (tables, graphics, weird fonts), and always include the exact keywords found in the job posting."},
    {"question": "Does my resume need a summary?", "answer": "A summary isn't strictly necessary, but a strong 2-sentence summary right at the top can help outline your exact years of experience and core specialty instantly."},
    {"question": "Should I include a photo on my resume?", "answer": "In countries like the US, UK, and Canada, it is strongly recommended NOT to include a photo to avoid unconscious bias. In some European countries, it is standard. Our AI ignores photos anyway."},
    {"question": "How long should my resume be?", "answer": "A good rule of thumb is 1 page for every 5-7 years of experience. Most early-to-mid career professionals should stick to a single page."},
    {"question": "Why can't the app read my PDF?", "answer": "If your PDF is essentially a scanned picture (no selectable text), the AI cannot read it. Ensure your PDFs are exported directly from Word, Google Docs, or LaTeX."},
    {"question": "Clear all the data", "answer": "You can quickly wipe the current analysis using the 'Clear All' button in the Upload section, and clear past history securely from the History section below."},
    {"question": "Tell me a joke about HR", "answer": "Why did the recruiter get upset at the applicant? Because they couldn't 'C' their 'C#' experience!"},
    {"question": "What are soft skills?", "answer": "Soft skills are interpersonal attributes like communication, teamwork, adaptability, and leadership. While our AI focuses heavily on hard technical skills, human recruiters weigh soft skills heavily during interviews."},
    {"question": "How to rank candidates?", "answer": "Simply paste the job description, upload the batch of resumes, and click 'Analyze'. The system will automatically sort and rank the applicants from best (#1) to worst based on the semantic match."},
]

kb_questions = [qa["question"] for qa in KNOWLEDGE_BASE]
try:
    kb_embeddings = sentence_model.encode(kb_questions)
except Exception as e:
    print(f"Error encoding knowledge base: {e}")
    kb_embeddings = None

# ----------------------------------------------------
# 2. DYNAMIC FALLBACK RESPONSES
# ----------------------------------------------------
FALLBACKS = [
    "I'm not completely sure about that. Try asking me about resume scoring, ATS tips, or how to use this app!",
    "That's a bit outside my expertise. I specialize in HR, resume screening, and matching algorithms. Any questions on those?",
    "Sorry, my local database doesn't have the answer to that. You can ask me how to improve a match score instead!",
    "I didn't quite catch the intent there. If you're wondering how the AI works, ask 'How does scoring work?'"
]

def get_fallback() -> str:
    return random.choice(FALLBACKS)

# ----------------------------------------------------
# 3. GREETING / SMALL TALK HEURISTICS
# Instant overrides so the bot feels natural without 
# forcing semantic heavy-lifting for generic phrases.
# ----------------------------------------------------
def get_greeting_override(message: str) -> str:
    msg = message.lower().strip()
    
    # Simple regex matches
    if re.fullmatch(r"h[ea]llo[o]*( there)?", msg) or re.fullmatch(r"hi+", msg) or re.fullmatch(r"hey+", msg):
        return "Hello there! I'm your offline recruitment assistant. Need help with scores, resumes, or ATS rules?"
    
    if "help" == msg:
         return "I can help! You can ask me things like 'How to improve a score', 'What is an ATS?', or 'How are scores calculated?'"
         
    if re.fullmatch(r"(thank you|thanks)( a lot)?", msg) or msg == "thx":
        return "You're very welcome! Let me know if you need anything else."
        
    if "who are you" in msg or "what are you" in msg:
        return "I'm a local AI assistant built into this application. I don't use the cloud, meaning everything I do is completely private and runs on your machine!"
        
    if "good morning" in msg:
        return "Good morning! Ready to screen some resumes?"
        
    if "good afternoon" in msg:
        return "Good afternoon! How can I assist with your hiring today?"
        
    if "good evening" in msg:
        return "Good evening! Need some late-night resume tips?"
        
    return ""

def get_chat_response(message: str, context: dict = None) -> dict:
    """Find the best matching answer for a user's question with greetings & dynamic fallbacks."""
    if not message.strip():
        return {"reply": "Please ask a question.", "confidence": 0}
        
    if kb_embeddings is None:
        return {"reply": "The AI model is still initializing. Please try again in a moment.", "confidence": 0}

    # 1. Check greetings
    greeting_reply = get_greeting_override(message)
    if greeting_reply:
         return {"reply": greeting_reply, "confidence": 1.0}

    # 2. Check context overrides
    lower_msg = message.lower()
    if context and context.get("results"):
        if "top candidate" in lower_msg or "best candidate" in lower_msg or "rank 1" in lower_msg:
            top_res = context["results"][0]
            return {
                "reply": f"Based on your recent analysis, the top candidate is **{top_res.get('filename')}** with a match score of **{top_res.get('score', top_res.get('match_score', 0))}%**.",
                "confidence": 1.0
            }

    # 3. Semantic Search
    user_embedding = sentence_model.encode([message])
    similarities = cosine_similarity(user_embedding, kb_embeddings)[0]
    
    best_idx = similarities.argmax()
    best_score = float(similarities[best_idx])
    
    # 4. LOWERED THRESHOLD! Down from 0.50 to 0.35 to be more forgiving.
    THRESHOLD = 0.35
    
    if best_score >= THRESHOLD:
        return {
            "reply": KNOWLEDGE_BASE[best_idx]["answer"],
            "confidence": best_score
        }
    else:
        return {
            "reply": get_fallback(),
            "confidence": best_score
        }

def get_suggested_questions() -> list:
    """Return a list of suggested starter questions."""
    return [
        "How is the match score calculated?",
        "What is an ATS system?",
        "How can I improve my match score?",
        "Is my uploaded data held securely?"
    ]
