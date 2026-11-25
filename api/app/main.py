from fastapi import FastAPI

from app.routers import citations, progression, workout

app = FastAPI(title="IRON API")
app.include_router(progression.router)
app.include_router(workout.router)
app.include_router(citations.router)


@app.get("/health")
def health():
    return {"status": "ok"}