# Live Mood Architect

A full-stack AI web application that generates short, supportive,
non-clinical therapeutic affirmations based on a user's name and how
they are feeling.

This project demonstrates full-stack integration, secure API usage,
deployment, validation, error handling, and environment variable
hygiene.

------------------------------------------------------------------------

## Live Application

Frontend (Vercel)\
https://live-mood-architect-euw3.vercel.app/

Backend (Render)\
https://live-mood-architect.onrender.com

Health Check Endpoint\
https://live-mood-architect.onrender.com/health

------------------------------------------------------------------------

## Features

-   Clean, responsive UI built with Next.js and Tailwind
-   FastAPI backend with a single REST endpoint
-   Secure server-side OpenAI API integration
-   Environment variables used for all secrets
-   Friendly error handling (no stack traces exposed)
-   Proper HTTP status codes (400, 429, 502, 504)
-   CORS configured for deployed frontend domain
-   Loading states and UX feedback during generation

------------------------------------------------------------------------

## API Endpoint

POST /api/affirmation

Request body:

{ "name": "Kenneth", "feeling": "overwhelmed", "details": "too many
deadlines" }

Successful response:

{ "affirmation": "Kenneth, even in moments of overwhelm..." }

Health endpoint:

GET /health\
Returns: { "ok": true }

------------------------------------------------------------------------

## Tech Stack

Frontend: - Next.js (React + TypeScript) - Tailwind CSS - Hosted on
Vercel

Backend: - FastAPI (Python) - OpenAI API (server-side call) - Hosted on
Render

------------------------------------------------------------------------

## Running Locally

### 1. Clone the Repository

git clone https://github.com/KenneyTheGoat/live-mood-architect.git\
cd live-mood-architect

------------------------------------------------------------------------

### 2. Backend Setup

cd backend\
python -m venv .venv

Activate virtual environment:

Windows PowerShell:\
..venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

Create a file named `.env` inside the backend folder:

OPENAI_API_KEY=your_openai_api_key_here\
FRONTEND_ORIGIN=http://localhost:3000

Start backend:

uvicorn main:app --reload --port 8000

Test:

http://127.0.0.1:8000/health

------------------------------------------------------------------------

### 3. Frontend Setup

Open a new terminal:

cd frontend\
npm install

Create a file named `.env.local` inside the frontend folder:

NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

Start frontend:

npm run dev

Open:

http://localhost:3000

------------------------------------------------------------------------

## Deployment Configuration

### Backend (Render)

Root Directory:\
backend

Build Command:\
pip install -r requirements.txt

Start Command:\
uvicorn main:app --host 0.0.0.0 --port \$PORT

Environment Variables (Render dashboard):

OPENAI_API_KEY = your_key_here\
FRONTEND_ORIGIN = https://live-mood-architect-euw3.vercel.app

------------------------------------------------------------------------

### Frontend (Vercel)

Root Directory:\
frontend

Environment Variables (Vercel dashboard):

NEXT_PUBLIC_API_BASE_URL = https://live-mood-architect.onrender.com

------------------------------------------------------------------------

## Security & Environment Variables

-   API keys are never committed to GitHub.
-   All secrets are stored in hosting provider environment variables.
-   .env and .env.local are excluded via .gitignore.
-   Backend never exposes raw error traces to the browser.

------------------------------------------------------------------------

## Error Handling

-   400 --- Invalid input (missing name or feeling)
-   429 --- Upstream rate limiting or usage limits
-   502 --- Upstream AI service error
-   504 --- Upstream timeout

Frontend displays user-friendly messages for all failure states.

------------------------------------------------------------------------

## Prompt & Safety Design

The system prompt enforces:

-   No medical or legal advice
-   No diagnosis
-   No crisis counseling
-   Supportive tone
-   2--4 sentence responses
-   If self-harm intent is detected, respond with a safe supportive
    message encouraging professional help

------------------------------------------------------------------------



## Author

Kenneth Kamogelo\
Full-stack AI project 
