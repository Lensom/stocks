# Olivia Backend

Python backend boilerplate for your AI stock project practice.

## Stack

- FastAPI
- Uvicorn
- Pydantic settings

## Quick start

1. Create and activate virtual environment:
   - Windows PowerShell:
     - `python -m venv .venv`
     - `.venv\Scripts\Activate.ps1`
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy env file:
   - `copy .env.example .env`
4. Run API:
   - `uvicorn app.main:app --reload`

## First endpoint

- `GET /health` -> checks that API is running.
