from fastapi import FastAPI

from app.routers import progression

app = FastAPI(title="IRON API")
app.include_router(progression.router)


@app.get("/health")
def health():
    return {"status": "ok"}
