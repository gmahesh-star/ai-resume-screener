import pdfplumber
import docx
import io

def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract text from PDF or DOCX file."""
    text = ""
    try:
        if filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            raise ValueError(f"Unsupported file format: {filename}")
    except Exception as e:
        print(f"Error extracting text from {filename}: {e}")
        return ""
    
    return text.strip()
