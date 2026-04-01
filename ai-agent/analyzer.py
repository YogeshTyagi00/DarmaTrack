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

    prompt_text = f"""You are a board-certified dermatologist and cosmetic chemist with 20+ years of clinical experience. 
Analyze this skincare product image with the precision of a professional skin consultation.

## STEP 1: PRODUCT & INGREDIENT IDENTIFICATION
First, determine what you can see in the image:
- If the image shows a **brand/product shot without ingredients**: Identify the product name and brand, then USE YOUR KNOWLEDGE to recall the known/commonly listed ingredients for that specific product. State clearly: "Ingredients sourced from product knowledge (not label)."
- If the image shows an **ingredient list/label**: Extract ALL ingredients exactly as listed, in order (INCI names).
- If partially visible: Extract what's readable and note gaps.

## STEP 2: PRODUCT TYPE DETECTION
Identify the product category (face wash / moisturizer / sunscreen / serum / toner / other) as this determines which harmful ingredient flags to apply.

## STEP 3: HARMFUL INGREDIENT AUDIT
Scan the ingredient list and flag the following based on product type:

### 🚨 FOR ALL PRODUCT TYPES — Universal Red Flags:
- **Artificial Fragrances** (listed as "Fragrance", "Parfum", or any synthetic scent compound) — common allergen, causes irritation and sensitization
- **Artificial Colors / Dyes** (CI XXXXX numbers, FD&C dyes, D&C dyes) — no skin benefit, potential allergen
- **Disodium EDTA** — synthetic chelating agent, enhances penetration of other chemicals (including harmful ones), potential skin irritant
- **Parabens** (Methylparaben, Propylparaben, Butylparaben, etc.) — endocrine disruptors, potential hormonal interference
- **Formaldehyde-releasing preservatives** (DMDM Hydantoin, Imidazolidinyl Urea, Quaternium-15) — carcinogen risk, allergenic

### 🚨 FOR FACE WASH SPECIFICALLY:
- **Sodium Lauryl Sulfate (SLS)** — harsh surfactant, strips natural skin barrier, causes dryness and irritation, damages skin microbiome. A gentler alternative is Sodium Laureth Sulfate (SLES) though still mildly concerning
- **Sodium Laureth Sulfate (SLES)** — milder than SLS but may contain 1,4-dioxane contamination
- **Alcohol Denat / SD Alcohol** — severely drying, disrupts skin barrier
- **Triclosan** — antibacterial agent linked to hormonal disruption and antibiotic resistance
- **Microbeads / Polyethylene** — physical exfoliants that damage skin and are environmentally harmful

### 🚨 FOR MOISTURIZER SPECIFICALLY:
- **Mineral Oil** (Paraffinum Liquidum) — petroleum byproduct used as cheap filler in brands like Pond's, Nivea, Vaseline; occlusive but clogs pores, does not provide actual nourishment
- **Silicones**: **Dimethicone, Cyclopentasiloxane, Cyclomethicone, Dimethiconol** — create an artificial "smooth" feel and are common in oil-free formulas, but can trap debris in pores, disrupt skin microbiome, and may accumulate in the body over time
- **Petrolatum** (low-grade) — similar concerns as mineral oil if not highly refined (USP grade)
- **Disodium EDTA** — see universal flags above; especially concerning in leave-on products
- **Propylene Glycol** (in high concentrations) — can cause irritation and barrier disruption in sensitive skin

### 🚨 FOR SUNSCREEN SPECIFICALLY:
- **Chemical UV Filters** — these absorb into the bloodstream through the skin and may act as endocrine disruptors. Flag ALL of the following:
  - **Oxybenzone (Benzophenone-3)** — strongest endocrine disruptor concern, found in breast milk and bloodstream
  - **Octinoxate (Ethylhexyl Methoxycinnamate)** — hormone-disrupting chemical filter, often hidden in "mineral" sunscreens
  - **Octisalate, Octocrylene, Avobenzone, Homosalate** — all chemical filters with absorption/hormonal concerns
  - **Benzene-based filters** — carcinogen contamination risk
- **Silicones in Sunscreen** (Dimethicone, Cyclopentasiloxane) — may reduce mineral filter efficacy and add unnecessary chemical load
- ⚠️ **"Mineral Sunscreen" Fraud Check**: If the product is marketed as mineral but contains ANY chemical filter (like octinoxate) alongside zinc oxide/titanium dioxide — flag this as misleading labeling
- ✅ **Safe mineral filters**: Zinc Oxide and Titanium Dioxide are the ONLY two sunscreen actives considered safe and non-systemic

## STEP 4: BENEFICIAL INGREDIENT HIGHLIGHTS
Identify and highlight positive, evidence-backed ingredients relevant to the user's skin profile:
- Humectants: Hyaluronic Acid, Glycerin, Aloe Vera
- Barrier repair: Ceramides, Niacinamide, Centella Asiatica, Panthenol
- Antioxidants: Vitamin C (Ascorbic Acid), Vitamin E (Tocopherol), Resveratrol
- Anti-aging: Retinol/Retinoids, Peptides, Bakuchiol
- Soothing: Allantoin, Bisabolol, Oat Extract
- AHA/BHA exfoliants: note if appropriate for user's concern

## STEP 5: PERSONALIZED RATING & RECOMMENDATION

**User Skin Profile:**
- Skin Type: {skin_type}
- Age: {age}  
- Skin Concerns: {concerns}
- Known Allergies: {allergies}

Rate the product **1–5** based on:
| Score | Meaning |
|-------|---------|
| 5 | Excellent — clean formulation, highly suitable for profile |
| 4 | Good — minor concerns, generally suitable |
| 3 | Average — mixed; some beneficial but notable concerns |
| 2 | Poor — significant harmful ingredients for this profile |
| 1 | Avoid — multiple red flags, not suitable |

Deduct points for:
- Each red-flagged harmful ingredient (-0.5 to -1 depending on severity)
- Ingredients conflicting with user's allergies (automatic -2 or disqualification)
- Ingredients inappropriate for skin type/concern

Add weight for:
- Clinically proven actives matching user's concerns
- Clean, minimal, transparent formulation

## OUTPUT FORMAT:
{parser.get_format_instructions()}

**Tone**: Be direct, scientific, and honest — like a dermatologist in a consultation room, not a product reviewer. If a product is harmful, say so clearly. If a product is genuinely good, acknowledge it.
"""

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
