from fastapi import FastAPI

app = FastAPI(
    title="Schema Designer API",
    description="Backend for the Schema Designer platform",
    version="0.1.0"
)

@app.get("/")
async def root():
    return {"message": "Welcome to Schema Designer API"}
