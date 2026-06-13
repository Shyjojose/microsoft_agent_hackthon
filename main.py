import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agents import CVExtractorAgent, CareerGraphGeneratorAgent, CertificationsAgent, ResponsibilitiesAgent
from schemas import CertificationsRequest, ResponsibilitiesRequest
import fitz  # PyMuPDF
import docx

app = FastAPI(title="Enterprise Learning System API")

# Add CORS middleware restricted to the trusted local deployment origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

cv_agent = CVExtractorAgent()
graph_agent = CareerGraphGeneratorAgent()
cert_agent = CertificationsAgent()
resp_agent = ResponsibilitiesAgent()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])

@app.post("/api/v1/upload")
async def upload_cv(file: UploadFile = File(...)):
    # Read file content
    contents = await file.read()
    
    # Enforce 5MB limit
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds the maximum permitted size of 5MB")
        
    filename = file.filename.lower()
    
    # Basic magic number checks
    if filename.endswith(".pdf"):
        if not contents.startswith(b"%PDF-"):
            raise HTTPException(status_code=415, detail="Invalid file signature for PDF")
        try:
            cv_text = extract_text_from_pdf(contents)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
            
    elif filename.endswith(".docx"):
        if not contents.startswith(b"PK\x03\x04"):
            raise HTTPException(status_code=415, detail="Invalid file signature for DOCX")
        try:
            cv_text = extract_text_from_docx(contents)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse DOCX: {str(e)}")
    else:
        raise HTTPException(status_code=415, detail="Unsupported file format. Only PDF and DOCX are supported.")

    if not cv_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the document.")

    # 1. Extract Profile
    try:
        profile = cv_agent.extract(cv_text)
    except Exception as e:
        # Log the actual exception locally, return generic sanitized message to user
        print(f"Error in extraction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error parsing CV profile metadata.")

    # 2. Generate Graph
    try:
        graph = graph_agent.generate_graph(profile)
    except Exception as e:
        print(f"Error generating graph: {e}")
        raise HTTPException(status_code=500, detail="Internal server error compiling dynamic career path graph.")

    return {
        "profile": profile.model_dump(),
        "graph": graph.model_dump()
    }

@app.post("/api/v1/certifications")
async def get_certifications(req: CertificationsRequest):
    """
    Called when a user clicks a career node in the graph.
    Returns 3-5 industry-recognised certifications relevant to the target role.
    """
    try:
        certs = cert_agent.get_certifications(
            job_title=req.job_title,
            skills_to_acquire=req.skills_to_acquire,
        )
        return {"certifications": [c.model_dump() for c in certs]}
    except Exception as e:
        print(f"Error getting certifications: {e}")
        raise HTTPException(status_code=500, detail="Internal server error retrieving role credentials.")


@app.post("/api/v1/responsibilities")
async def get_responsibilities(req: ResponsibilitiesRequest):
    """
    Returns core responsibilities and headcount management data.
    """
    try:
        resp = resp_agent.get_responsibilities(job_title=req.job_title)
        return {"responsibility": resp.model_dump()}
    except Exception as e:
        print(f"Error getting responsibilities: {e}")
        raise HTTPException(status_code=500, detail="Internal server error retrieving role responsibilities.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
