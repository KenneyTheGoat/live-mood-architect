import os
from typing import Optional
from openai import AuthenticationError, RateLimitError, APIConnectionError, APITimeoutError

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import RateLimitError
from openai import OpenAI

# Load local env if present (Render uses dashboard env vars, not .env)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

if not OPENAI_API_KEY:
    # Fail fast on server start (better than runtime confusion)
    raise RuntimeError("Missing OPENAI_API_KEY environment variable")

client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

# CORS (only allow your frontend origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

class AffirmationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    feeling: str = Field(..., min_length=1, max_length=280)
    details: Optional[str] = Field(default=None, max_length=600)

class AffirmationResponse(BaseModel):
    affirmation: str

def looks_like_self_harm(text: str) -> bool:
    # Keep simple and non-graphic; this is not a detector, just a safety fallback.
    t = (text or "").lower()
    flags = ["suicid", "kill myself", "hurt myself", "end it", "self harm", "self-harm"]
    return any(f in t for f in flags)

SYSTEM_PROMPT = """You generate short, supportive, non-clinical therapeutic affirmations.

Rules:
- No medical or legal advice. No diagnosis.
- No crisis counseling or instructions.
- If the user expresses self-harm intent, respond with a brief supportive message encouraging them to seek professional help or reach out to a trusted person.
- Keep responses 2–4 sentences, warm, specific to the user's name and feeling.
"""

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/api/affirmation", response_model=AffirmationResponse)
def create_affirmation(payload: AffirmationRequest):
    name = payload.name.strip()
    feeling = payload.feeling.strip()
    details = (payload.details or "").strip()

    if not name or not feeling:
        raise HTTPException(status_code=400, detail="Name and feeling are required.")

    combined = f"{feeling} {details}".strip()

    # Safety fallback (keep it simple + supportive)
    if looks_like_self_harm(combined):
        msg = (
            f"{name}, I’m really sorry you’re feeling this way. "
            "You deserve support right now—please consider reaching out to a trusted person or a qualified professional. "
            "You don’t have to handle this alone."
        )
        return AffirmationResponse(affirmation=msg)

    user_prompt = (
        f"User name: {name}\n"
        f"Feeling: {feeling}\n"
        f"Details (optional): {details if details else 'N/A'}\n"
        "Write the affirmation now."
    )

    try:
        resp = client.responses.create(
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            timeout=20,
        )
        text = (resp.output_text or "").strip()
        if not text:
            raise HTTPException(status_code=502, detail="AI returned an empty response.")
        return AffirmationResponse(affirmation=text)

    except AuthenticationError:
        # Don’t leak secrets; just say service misconfigured
        raise HTTPException(status_code=502, detail="AI service misconfigured. Please try again later.")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="The AI service is busy right now. Please try again later.")
    except (APITimeoutError, APIConnectionError):
        raise HTTPException(status_code=504, detail="The AI service timed out. Please try again.")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="We couldn’t generate an affirmation right now. Please try again in a moment.",
        )