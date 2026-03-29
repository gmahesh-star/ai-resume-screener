import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import re

# Load NLP Models
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading en_core_web_sm model...")
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

sentence_model = SentenceTransformer('all-MiniLM-L6-v2')

# Predefined Skills
SKILLS_DB = [
    "python", "java", "sql", "ml", "machine learning", "fastapi", "flask", 
    "spacy", "scikit-learn", "nlp", "pandas", "numpy", "tensorflow", "pytorch",
    "docker", "kubernetes", "aws", "gcp", "azure", "git", "ci/cd",
    "c++", "c#", "javascript", "react", "angular", "vue", "html", "css",
    "react native", "flutter", "swift", "kotlin", "ruby", "django",
    "data analysis", "data science", "deep learning", "agile", "scrum",
    "mongodb", "postgresql", "mysql", "nosql", "REST API", "graphql"
]

def preprocess_text(text: str) -> str:
    """Preprocess text: lowercasing, remove stopwords & punctuation, lemmatization."""
    doc = nlp(text.lower())
    tokens = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct and not token.is_space]
    return " ".join(tokens)

def extract_skills(text: str) -> set:
    """Extract predefined skills from text."""
    text_lower = text.lower()
    
    extracted_skills = set()
    
    # Direct string matching
    for skill in SKILLS_DB:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            extracted_skills.add(skill.lower())
            
    return extracted_skills

def calculate_similarity_tfidf(resume_text: str, job_desc: str) -> float:
    """Basic TF-IDF similarity. Used as fallback or combined score."""
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([job_desc, resume_text])
    sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    return float(sim * 100)

def calculate_similarity_semantic(resume_text: str, job_desc: str) -> float:
    """Advanced Sentence Transformers similarity."""
    embeddings = sentence_model.encode([job_desc, resume_text])
    sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return float(sim * 100)

def match_resume(resume_text: str, job_desc: str):
    """Main matching function."""
    preprocessed_job = preprocess_text(job_desc)
    preprocessed_resume = preprocess_text(resume_text)
    
    job_skills = extract_skills(job_desc)
    resume_skills = extract_skills(resume_text)
    
    matched_skills = job_skills.intersection(resume_skills)
    missing_skills = job_skills.difference(resume_skills)
    
    # Blend Semantic and TF-IDF similarity
    semantic_score = calculate_similarity_semantic(preprocessed_resume, preprocessed_job)
    tfidf_score = calculate_similarity_tfidf(preprocessed_resume, preprocessed_job)
    
    # Weighing semantic score more heavily than tf-idf
    score = (semantic_score * 0.7) + (tfidf_score * 0.3)
    
    # Cap score at 100
    score = min(score, 100.0)
    # Ensure score is not negative
    score = max(score, 0.0)
    
    return {
        "match_score": round(score, 2),
        "matched_skills": list(matched_skills),
        "missing_skills": list(missing_skills)
    }
