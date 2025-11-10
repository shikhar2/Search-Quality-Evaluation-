from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import Optional, Dict, List
import logging
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app with production considerations
app = FastAPI(
    title="Search Quality Evaluation API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    # Configure this properly for production based on your domain
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY environment variable not set. Please set it in a .env file or environment.")

genai.configure(api_key=GEMINI_API_KEY)
# Using Gemini 1.5 Flash as 2.5 might not be available yet
model = genai.GenerativeModel('gemini-2.5-flash')


class QueryItem(BaseModel):
    query: str
    item_title: str
    item_description: str
    item_category: str
    item_attributes: Dict[str, str] = {}


class EvaluationResult(BaseModel):
    relevance_score: int  # 1-8 scale
    reason_code: Optional[str]
    confidence: float
    ai_reasoning: Optional[str] = None

    class Config:
        exclude_none = False


class BatchEvaluationRequest(BaseModel):
    evaluations: List[QueryItem]


class BatchEvaluationResponse(BaseModel):
    results: List[EvaluationResult]


@app.get("/")
def read_root():
    return {"message": "Search Quality Evaluation API is running. Visit /static/index.html for the web interface."}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/evaluate", response_model=EvaluationResult)
async def evaluate_relevance(query_item: QueryItem):
    """
    Evaluate query-item relevance using Gemini AI.
    """
    try:
        logger.info(f"Evaluating query: {query_item.query[:50]}...")

        # Create prompt for Gemini
        prompt = f"""
Evaluate the relevance of this search query to this product on a scale of 1-8 (1=not relevant at all, 8=highly relevant).

Query: "{query_item.query}"
Item Title: "{query_item.item_title}"
Item Description: "{query_item.item_description}"
Item Category: "{query_item.item_category}"
Item Attributes: {query_item.item_attributes}

Respond with exactly this format:
Score: [number 1-8]
Confidence: [number 0.0-1.0]
Reason: [brief explanation]
"""

        # Call Gemini API
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Parse the response
        import re
        try:
            score_match = re.search(r'Score:\s*(\d+)', response_text)
            confidence_match = re.search(
                r'Confidence:\s*([0-9.]+)', response_text)
            reason_match = re.search(r'Reason:\s*(.+)', response_text)

            final_score = int(score_match.group(1)) if score_match else 1
            confidence = float(confidence_match.group(1)
                               ) if confidence_match else 0.5
            reason = reason_match.group(1).strip(
            ) if reason_match else "Unable to parse response"

            # Constrain score to 0-8 range
            final_score = max(0, min(8, final_score))
            confidence = max(0.0, min(1.0, confidence))
        except Exception as e:
            logger.warning(
                f"Failed to parse Gemini response: {response_text}, error: {e}")
            final_score = 1
            confidence = 0.5
            reason = "Unable to parse response"

        # Quality assessment codes based on score (0-8 scale)
        quality_codes = {
            8: "Excellent",
            7: "Good",
            6: "Okay",
            5: "Informational",
            4: "Bad",
            3: "Nonsensical",
            2: "Embarrassing",
            1: "UTD (Unable To Determine)",
            0: "PDNL (Page Does Not Load)"
        }

        # Get reason code with fallback error handling
        if final_score in quality_codes:
            reason_code = quality_codes[final_score]
        else:
            logger.error(
                f"Unexpected score {final_score} returned by AI model")
            reason_code = "Error: Invalid Score"
            # Raise an exception to notify the user
            raise HTTPException(
                status_code=500,
                detail=f"AI model returned invalid score {final_score}. Expected score between 0-8."
            )

        logger.info(
            f"Evaluation complete: score {final_score}, confidence {confidence:.2f}, reason: {reason}")

        return EvaluationResult(
            relevance_score=final_score,
            reason_code=reason_code,
            confidence=round(confidence, 2),
            ai_reasoning=reason
        )

    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail="Invalid input data")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/evaluate/batch", response_model=BatchEvaluationResponse)
async def evaluate_batch(batch_request: BatchEvaluationRequest):
    """
    Evaluate multiple query-item pairs in batch.
    """
    try:
        results = []
        for item in batch_request.evaluations:
            result = await evaluate_relevance(item)
            results.append(result)
        return BatchEvaluationResponse(results=results)
    except Exception as e:
        logger.error(f"Batch evaluation error: {e}")
        raise HTTPException(status_code=500, detail="Batch evaluation failed")
