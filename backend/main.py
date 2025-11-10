from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import Optional, Dict, List
import logging
import os
import google.generativeai as genai
from dotenv import load_dotenv
import base64
from fastapi.responses import JSONResponse   # ✅ add this line

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
    item_price: Optional[str] = None  # ✅ Add this



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
    


# @app.post("/generate_image")
# async def generate_product_image(query_item: QueryItem):
#     """
#     Fetch a realistic product image from Unsplash or fallback placeholder.
#     """
#     try:
#         search_query = query_item.item_title or query_item.item_category or "product"
#         # Use Unsplash random query image
#         unsplash_url = f"https://source.unsplash.com/600x600/?{search_query.replace(' ', '%20')}"
#         logger.info(f"✅ Using Unsplash image for {search_query}: {unsplash_url}")
#         return JSONResponse(content={"image_url": unsplash_url})
#     except Exception as e:
#         logger.error(f"Image generation error: {e}")
#         return JSONResponse(
#             content={"image_url": "https://via.placeholder.com/300?text=No+Image"},
#             status_code=200,
#         )


import requests

@app.post("/generate_image")
async def generate_product_image(query_item: QueryItem):
    """
    Fetch a realistic and accurate product image using Serper (Google Images API).
    Hardcoded Serper API key version.
    """
    try:
        # ✅ Hardcode your Serper API key here
        SERPER_API_KEY = "06bf07fb344c970040b13248c85873b67994263e"

        search_query = (
            query_item.item_title
            or query_item.item_category
            or query_item.query
            or "product"
        )

        logger.info(f"🔍 Searching image for query: {search_query}")

        # Call Serper API (Google Images)
        url = "https://google.serper.dev/images"
        payload = {"q": search_query, "num": 5}
        headers = {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json",
        }

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        # Extract image URLs
        images = data.get("images", [])
        if images and len(images) > 0:
            image_url = images[0].get("imageUrl") or images[0].get("thumbnailUrl")
            logger.info(f"✅ Found image for '{search_query}': {image_url}")
        else:
            logger.warning(f"No images found for {search_query}, using fallback.")
            image_url = f"https://source.unsplash.com/600x600/?{search_query.replace(' ', '%20')}"

        return JSONResponse(content={"image_url": image_url})

    except Exception as e:
        logger.error(f"Image generation error: {e}")
        return JSONResponse(
            content={"image_url": "https://via.placeholder.com/300?text=No+Image"},
            status_code=200,
        )
    

# @app.post("/query/info")
# async def get_query_information(data: Dict[str, str]):
#     """
#     Given a user query, use Gemini to generate an informative response.
#     Example request: { "query": "latest iPhone features" }
#     """
#     try:
#         query = data.get("query", "").strip()
#         if not query:
#             raise HTTPException(status_code=400, detail="Query is required.")

#         logger.info(f"Fetching info for query: {query[:50]}...")

#         prompt = f"""
# You are a helpful and simple search assistant. Explain the following query in a clear and easy way so that anyone can understand it.

# Use short sentences and simple words. Avoid technical jargon unless necessary.

# Also, find or describe one image that best represents this topic.

# Query: "{query}"

# Give the answer in this format:

# Title: Short and simple title  
# Summary: Easy-to-read summary explaining the topic.  
# Key Points:
# main point 1  
# main point 2  
# main point 3  

# Image Description: Short description of one image that best fits the topic
# """



#         # Call Gemini
#         response = model.generate_content(prompt)
#         response_text = response.text.strip()

#         import json
#         try:
#             ai_data = json.loads(response_text)
#         except json.JSONDecodeError:
#             # fallback if model returns non-strict JSON
#             ai_data = {"title": query, "summary": response_text, "key_points": []}

#         return {
#             "query": query,
#             "title": ai_data.get("title", query),
#             "summary": ai_data.get("summary", "No summary available."),
#             "key_points": ai_data.get("key_points", [])
#         }

#     except HTTPException as e:
#         raise e
#     except Exception as e:
#         logger.error(f"Error while fetching query info: {e}")
#         raise HTTPException(status_code=500, detail="Failed to fetch query information.")


@app.post("/query/info")
async def get_query_information(data: Dict[str, str]):
    """
    Given a user query, return a clear summary (via Gemini)
    and one relevant image (via Serper / Unsplash fallback).
    """
    try:
        query = data.get("query", "").strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query is required.")

        logger.info(f"🔍 Processing query: {query}")

        # --- Step 1: Ask Gemini for an informative summary ---
        prompt = f"""
Explain the topic "{query}" in a simple and clear way.
Write:
A short title
A 2–3 sentence summary
3 key bullet points
Avoid extra formatting or markdown.
"""

        gemini_response = model.generate_content(prompt)
        text = gemini_response.text.strip()

        # Try to parse Gemini output into structure
        import re
        title = re.search(r'(?i)title[:\-]?\s*(.+)', text)
        title = title.group(1).strip() if title else query

        summary = re.search(r'(?i)summary[:\-]?\s*(.+)', text)
        summary = summary.group(1).strip() if summary else text.split("\n")[0]

        key_points = re.findall(r'[-•]\s*(.+)', text)
        if not key_points:
            # fallback: split lines if bullets not found
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            key_points = lines[1:4] if len(lines) > 1 else []

        # --- Step 2: Fetch related image using Serper ---
        SERPER_API_KEY = "06bf07fb344c970040b13248c85873b67994263e"
        image_url = None

        try:
            headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
            payload = {"q": query, "num": 3}
            response = requests.post("https://google.serper.dev/images", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            images = data.get("images", [])

            if images and len(images) > 0:
                img = images[0]
                image_url = img.get("imageUrl") or img.get("thumbnailUrl") or img.get("link")
                logger.info(f"🖼️ Image found for '{query}': {image_url}")
            else:
                logger.warning(f"No image found for {query}, using Unsplash fallback.")
                image_url = f"https://source.unsplash.com/600x600/?{query.replace(' ', '%20')}"

        except Exception as e:
            logger.warning(f"⚠️ Serper image fetch failed: {e}")
            image_url = f"https://source.unsplash.com/600x600/?{query.replace(' ', '%20')}"

        # --- Step 3: Return clean structured output ---
        return {
            "query": query,
            "title": title,
            "summary": summary,
            "key_points": key_points,
            "image_url": image_url
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"❌ Error while processing query info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch query information.")