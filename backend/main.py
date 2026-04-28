from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv() # Load variables from .env before other imports

from routes import risk, wakeup, sector, stock, search, settings

app = FastAPI(title="Guardian API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers from separate files
app.include_router(risk.router, tags=["Risk"])
app.include_router(wakeup.router, tags=["Wakeup"])
app.include_router(sector.router, tags=["Sector"])
app.include_router(stock.router, tags=["Stock"])
app.include_router(search.router, tags=["Search"])
app.include_router(settings.router, tags=["Settings"])

@app.get("/")
async def root():
    return {"message": "Welcome to Guardian API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
