from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SearchRequest(BaseModel):
    text: str

class SearchResponse(BaseModel):
    ticker: str

@router.post("/search", response_model=SearchResponse)
async def extract_ticker(request: SearchRequest):
    # This API extracts a ticker from natural language input
    # In a real implementation, this would use Gemini
    text = request.text.upper()
    
    # Simple mock logic
    ticker = "AAPL"
    if "NVIDIA" in text or "NVDA" in text:
        ticker = "NVDA"
    elif "TESLA" in text or "TSLA" in text:
        ticker = "TSLA"
        
    return {"ticker": ticker}
