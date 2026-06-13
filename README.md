# Enterprise Career Ladder Generator

A premium, interactive AI-powered career growth and ladder planning platform built with **Next.js**, **FastAPI**, and **Azure AI Foundry**. 

The application enables employees to upload their CVs, automatically extracts their professional profile, generates a highly visual and branching career tree using React Flow, and provides interactive nodes to dynamically load industry-recognized certifications and job responsibilities.

---

## 🏗️ Architecture & Stack

- **Frontend:** Next.js (TypeScript, React Flow, Framer Motion, Tailwind CSS, Lucide icons)
- **Backend:** FastAPI (Python, Uvicorn, PyMuPDF for PDF extraction, python-docx for DOCX extraction)
- **AI Integration:** Azure AI Foundry inference endpoint using `gpt-4.1-mini` with structured JSON parsing/schema validation
- **Testing:** pytest for API and validation testcases

---

## 🔒 Security Design

The application implements rigorous security safeguards aligned with enterprise compliance standards:

1. **Prompt Injection Mitigation:** User-provided CV text is strictly treated as a lower-privilege data variable, wrapped in structural XML tags (`<resume_data>`), and filtered with hardened system instructions that force the model to ignore configuration overrides.
2. **PII Scrubbing:** Raw text is pre-processed using regex filters to strip phone numbers and email addresses before LLM delivery.
3. **Strict Validation & Schema Enforcement:** Pydantic v2 schemas sanitize all string inputs against XSS vectors using HTML escaping, and enforce strict type/range thresholds (`max_length`, `pattern`, `ge`/`le`).
4. **Ingestion Defenses:** Maximum file uploads are constrained to 5MB, and files are validated using true byte magic numbers (`%PDF-` and `PK..`) rather than trusting user-controlled mime headers.
5. **CORS & CSP Tightening:** CORS is strictly limited to localhost origins, and a comprehensive Content Security Policy (CSP) restricts frame embedding and script injection vectors.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup (FastAPI)

1. Clone/navigate to the project directory:
   ```bash
   cd hackathon_azure
   ```
2. Configure your environment variables:
   Copy `.env.example` to `.env` and fill in your Azure AI Foundry credentials:
   ```bash
   cp .env.example .env
   ```
   *Required Variables:*
   - `AZURE_AI_FOUNDRY_ENDPOINT`: Your Azure AI Foundry project OpenAI-compatible endpoint.
   - `AZURE_OPENAI_API_KEY`: Your project authentication key.
   - `AZURE_OPENAI_EXTRACTION_DEPLOYMENT`: Deployment model name (e.g. `gpt-4.1-mini`).
   - `AZURE_OPENAI_GRAPH_DEPLOYMENT`: Deployment model name.

3. Install python dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

4. Launch the backend server:
   ```bash
   python main.py
   ```
   The API will start on `http://localhost:8000`.

### 2. Frontend Setup (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Running Tests

To validate security middlewares, data validators, and schema parsing controls:

```bash
# From the project root
PYTHONPATH=. .venv/bin/pytest
```
