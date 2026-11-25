"""GET /citations -- serves api/app/data/citations.json (public, no auth)."""

import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response

from app.schemas.citations import CitationsResponse

router = APIRouter(prefix="/citations", tags=["citations"])

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "citations.json"


@lru_cache(maxsize=1)
def _load() -> dict:
    """Read the file once. A failed read is not cached, so a fix is picked up."""
    with DATA_PATH.open(encoding="utf-8") as f:
        raw = json.load(f)
    meta = raw.pop("_meta")
    # The file calls it "_meta"; the API calls it "meta" (see the contract).
    return {"meta": meta, "citations": raw}


@router.get("", response_model=CitationsResponse, response_model_exclude_none=True)
def get_citations(response: Response):
    try:
        data = _load()
    except (OSError, ValueError, KeyError):
        raise HTTPException(status_code=500, detail="Citations unavailable")
    response.headers["Cache-Control"] = "public, max-age=3600"
    return data