from fastapi import APIRouter
from pydantic import BaseModel
from services.gemini_service import gemini_service


router = APIRouter()

class RiskResponse(BaseModel):
    number: float
    string: str

@router.get("/risk", response_model=RiskResponse)
async def get_risk():
    # Example logic placeholder
    # result = gemini_service.generate_content("explain: {result}")

    return {"number": 45.5, "string": "Moderate risk detected based on market volatility."}
