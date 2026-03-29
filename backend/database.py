import sqlite3
import json

DB_FILE = "resume_data.sqlite"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            match_score REAL,
            matched_skills TEXT,
            missing_skills TEXT,
            status TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_result(filename, match_score, matched_skills, missing_skills, status="Success"):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    matched_skills_json = json.dumps(list(matched_skills))
    missing_skills_json = json.dumps(list(missing_skills))
    
    cursor.execute('''
        INSERT INTO results (filename, match_score, matched_skills, missing_skills, status)
        VALUES (?, ?, ?, ?, ?)
    ''', (filename, match_score, matched_skills_json, missing_skills_json, status))
    
    conn.commit()
    conn.close()

def get_all_results():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM results ORDER BY match_score DESC')
    rows = cursor.fetchall()
    
    results = []
    for i, row in enumerate(rows):
        results.append({
            "id": row["id"],
            "filename": row["filename"],
            "match_score": row["match_score"],
            "matched_skills": json.loads(row["matched_skills"]),
            "missing_skills": json.loads(row["missing_skills"]),
            "status": row["status"],
            "rank": i + 1
        })
        
    conn.close()
    return results

def clear_results():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM results')
    conn.commit()
    conn.close()
