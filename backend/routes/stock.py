from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class StockInfo(BaseModel):
    symbol: str
    price: float
    change: float
    description: str

class StockResponse(BaseModel):
    stock: StockInfo

@router.get("/stock/{ticker}", response_model=StockResponse)
async def get_stock_data(ticker: str):
    # This API provides detailed data for a specific ticker
    # Mock data for the requested ticker
    return {
        "stock": {
            "symbol": ticker.upper(),
            "price": 245.12,
            "change": 1.5,
            "description": f"Detailed market data and Gemini analysis for {ticker.upper()}."
        }
    }
