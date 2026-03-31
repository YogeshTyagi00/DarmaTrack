from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from config import settings  # noqa: F401 — ensures config is loaded at startup
from analyzer import analyze_product, send_callback

app = FastAPI(title="Skincare Analyzer AI Agent")


class SkinProfile(BaseModel):
    skinType: str
    age: int
    concerns: list[str] = []
    allergies: list[str] = []


class AnalyzeRequest(BaseModel):
    analysisId: str
    imageUrl: str
    skinProfile: SkinProfile


async def _run_analysis(analysis_id: str, image_url: str, skin_profile: dict) -> None:
    """Background task: run analysis and callback to backend."""
    import traceback
    try:
        result = await analyze_product(
            analysis_id=analysis_id,
            image_url=image_url,
            skin_profile=skin_profile,
        )
    except Exception as e:
        print(f"[ERROR] analyze_product failed: {e}")
        traceback.print_exc()
        result = {"status": "failed", "ingredients": None, "rating": None, "explanation": None}
    
    print(f"[INFO] Analysis result for {analysis_id}: status={result.get('status')}")
    
    try:
        await send_callback(
            analysis_id=analysis_id,
            payload=result,
            backend_url=settings.backend_url,
            internal_api_key=settings.internal_api_key,
        )
        print(f"[INFO] Callback sent successfully for {analysis_id}")
    except Exception as e:
        print(f"[ERROR] Callback failed for {analysis_id}: {e}")
        traceback.print_exc()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze", status_code=202)
async def analyze(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Accept an analysis job and process it asynchronously.
    Returns 202 immediately; processing happens in the background.
    """
    background_tasks.add_task(
        _run_analysis,
        analysis_id=request.analysisId,
        image_url=request.imageUrl,
        skin_profile=request.skinProfile.model_dump(),
    )
    return {"status": "accepted"}
