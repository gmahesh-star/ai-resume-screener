# AI-Powered Resume Screening System

This is a complete, production-ready AI Resume Screening system. It leverages FastAPI for backend API generation, spaCy for basic Natural Language Processing (NLP), and Sentence-Transformers (all-MiniLM-L6-v2) for advanced semantic contextual matching between a job description and candidates' resumes.

## 🌟 Features

- **Upload Resumes:** Support for `.pdf` and `.docx` file formats.
- **Job Description Parsing:** Compares resumes against the exact job description using both skills extraction and semantic similarity scores (TF-IDF + Embeddings).
- **Match Score:** Uses a weighted AI match score from 0% to 100%. 
- **Skills Extraction:** Automatically extracts known tech skills from your custom DB lists.
- **Ranking System:** Orders multiple resumes from highest match to lowest.
- **Persistence:** Underlying SQLite database implementation to store past resume scans.
- **Frontend Panel:** Minimal, sleek HTML/CSS/JS interface to drag-and-drop resumes.

## 📂 Project Structure

```bash
Ai_resume_screening/
├── backend/
│   ├── main.py                # FastAPI Application and Routes
│   ├── database.py            # SQLite setup & queries
│   ├── services/
│   │   └── ai_service.py      # Contains TF-IDF, Sentence Transformer, spaCy NLP logic
│   └── utils/
│       └── file_parser.py     # PDF & DOCX text extraction
├── frontend/
│   ├── index.html             # The Web UI
│   ├── style.css              # Beautifully crafted custom CSS
│   └── script.js              # State handling & XHR fetches
├── data/
│   ├── example_jd.txt         # A default job description mapped to test resumes
│   └── generate_samples.py    # Python script to generate sample DOCX resumes
├── requirements.txt           # Python dependencies
└── README.md                  # Documentation you are reading right now
```

---

## 🚀 Setup & Installation

### 1. Requirements
Ensure you have Python 3.9+ installed and running. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
Install all necessary packages, including machine learning libraries:
```bash
pip install -r requirements.txt
```

### 3. Download the spaCy NLP Model
Required for tokenization and pre-processing:
```bash
python -m spacy download en_core_web_sm
```

*(Note: The `backend/services/ai_service.py` is written to try automatically downloading this on the first run, but manually running it is safer).*

---

## 🧪 Testing with Sample Resumes

We have provided a script that auto-generates some dummy resumes for testing.

1. Navigate to the `data/` folder and run the generator:
```bash
python data/generate_samples.py
```
This will generate `Jane_Doe_Resume.docx`, `John_Smith_Resume.docx`, and `Alice_Jones_Resume.docx`.

---

## ⚙️ Running the Application

### 1. Start the Backend API
Run the FastAPI backend with Uvicorn from the **project root directory**:
```bash
uvicorn backend.main:app --reload
```
The API will be available at: `http://127.0.0.1:8000`

(You can view the Swagger UI Sandbox at `http://127.0.0.1:8000/docs`)

### 2. Start the Frontend
Since it is vanilla HTML/JS/CSS, you can simply double-click `frontend/index.html` to open it in your browser, or you can serve it with Python:
```bash
cd frontend
python -m http.server 8080
```
Then visit `http://127.0.0.1:8080/` in your browser.

---

## 📊 Example Input & Output

### Example Input
- **Job Description:** Paste contents from `data/example_jd.txt` (Senior AI engineer with Python, Machine Learning, NLP...).
- **Resumes Uploaded:** The three DOCX files generated via `data/generate_samples.py`.

### Example Output
- **Rank #1: Jane_Doe_Resume.docx**
  - Score: ~85% Match 
  - Matched Skills: python, machine learning, nlp, fastapi, spacy, git, docker
  - Missing Skills: sql
- **Rank #2: John_Smith_Resume.docx**
  - Score: ~35% Match 
  - Matched Skills: python
  - Missing Skills: machine learning, nlp, docker, etc.
- **Rank #3: Alice_Jones_Resume.docx** 
  - Score: ~15% Match
  - Error/Match: Missing many key indicators.

---

## 🧠 Advanced Notes
- **Matching Algorithm:** Uses a blend of 70% Sentence Transformer semantic similarity (to gauge candidate experience conceptually) and 30% traditional TF-IDF (for exact word counting). 
- **Extending Skills:** The extracted skills list is pre-defined in `backend/services/ai_service.py` within `SKILLS_DB`. You can easily swap this out to load from a JSON or SQL table to catch more custom industry terms.
