"""Core analysis logic: GPT-4o vision for ingredient extraction and rating."""

import base64
import io
import os

import httpx
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

# Point pytesseract to the Tesseract executable on Windows
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


class AnalysisResult(BaseModel):
    ingredients: list[str] = Field(description="List of ingredients extracted from the product image")
    rating: int = Field(description="Rating from 1 to 5 for the product suitability", ge=1, le=5)
    explanation: str = Field(description="Human-readable explanation of the rating referencing specific ingredients")


async def download_image_as_base64(image_url: str) -> str:
    """Download an image from a URL and return it as a base64 string."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(image_url)
        response.raise_for_status()
    return base64.b64encode(response.content).decode("utf-8")


async def analyze_product(
    analysis_id: str,
    image_url: str,
    skin_profile: dict,
    chain=None,
) -> dict:
    """
    Full analysis pipeline: download image → GPT-4o vision → return result dict.
    Returns a dict with keys: status, ingredients, rating, explanation.
    """
    try:
        image_b64 = await download_image_as_base64(image_url)
        print(f"[INFO] Image downloaded for {analysis_id}")
    except Exception as e:
        print(f"[ERROR] download_image failed for {image_url}: {e}")
        return {"status": "failed", "ingredients": None, "rating": None, "explanation": None}

    skin_type = skin_profile.get("skinType", "unknown")
    age = skin_profile.get("age", "unknown")
    concerns = ", ".join(skin_profile.get("concerns", [])) or "none"
    allergies = ", ".join(skin_profile.get("allergies", [])) or "none"

    parser = PydanticOutputParser(pydantic_object=AnalysisResult)

    prompt_text = f"""You are a skincare expert. Look at this product image and:
1. Extract ALL ingredients listed on the product label
2. Rate the product from 1 (very bad) to 5 (excellent) for this user's skin profile
3. Explain the rating referencing specific ingredients relevant to their skin

User skin profile:
- Skin type: {skin_type}
- Age: {age}
- Skin concerns: {concerns}
- Allergies: {allergies}

If you cannot read any ingredients from the image, still provide your best assessment.

{parser.get_format_instructions()}"""

    try:
        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY", ""),
        )

        from langchain_core.messages import HumanMessage
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt_text},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                },
            ]
        )

        response = await llm.ainvoke([message])
        result: AnalysisResult = parser.parse(response.content)  # type: ignore
        print(f"[INFO] GPT-4o analysis complete for {analysis_id}: {len(result.ingredients)} ingredients, rating={result.rating}")

        return {
            "status": "completed",
            "ingredients": result.ingredients,
            "rating": result.rating,
            "explanation": result.explanation,
        }
    except Exception as e:
        print(f"[ERROR] GPT-4o analysis failed for {analysis_id}: {e}")
        import traceback; traceback.print_exc()
        return {"status": "failed", "ingredients": None, "rating": None, "explanation": None}


async def send_callback(
    analysis_id: str,
    payload: dict,
    backend_url: str,
    internal_api_key: str,
) -> None:
    """Send the analysis result back to the backend via PATCH /analyses/:id."""
    url = f"{backend_url}/analyses/{analysis_id}"
    headers = {"x-api-key": internal_api_key, "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.patch(url, json=payload, headers=headers)
