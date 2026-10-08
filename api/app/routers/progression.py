"""POST /progression/suggest -- thin wrapper around suggest_next()."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.progression import SuggestRequest, SuggestResponse
from app.services.progression import suggest_next

router = APIRouter(prefix="/progression", tags=["progression"])

# auto_error=False so a missing token returns 401 (per the contract), not 403.
bearer_scheme = HTTPBearer(auto_error=False)


def require_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """
    Auth stub. Rejects requests with no bearer token, but does NOT yet
    verify the token.

    TODO(nathaniel): verify the Supabase access token (JWT secret vs.
    Supabase's auth endpoint -- open question in the contract) and
    return the user id. Do not deploy publicly until this is real.
    """
    if creds is None or not creds.credentials.strip():
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return creds.credentials  # placeholder until verification exists


@router.post("/suggest", response_model=SuggestResponse)
def suggest(req: SuggestRequest, _user: str = Depends(require_user)):
    result = suggest_next(
        exercise=req.exercise.model_dump(),
        recent_sets=[s.model_dump() for s in req.recent_sets],
        goal=req.goal,
        training_experience=req.training_experience,
    )
    # Contract: kg values are display-rounded by the client; round the
    # 1RM estimate here so the payload isn't 15 decimal places.
    result["current_estimated_1rm"] = round(result["current_estimated_1rm"], 1)
    return result