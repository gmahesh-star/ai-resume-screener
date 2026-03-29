import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # We use a slight delay or just run it directly. 
    # This guarantees the PORT env variable is respected without shell issues.
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
