from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class SectorInfo(BaseModel):
    name: str
    change: float

class SectorResponse(BaseModel):
    sectors: List[SectorInfo]
    insight: str

@router.get("/sector", response_model=SectorResponse)
async def get_sector_performance():
    # Placeholder data
    return {
        "sectors": [
            {"name": "Technology", "change": 2.4},
            {"name": "Healthcare", "change": -0.5},
            {"name": "Finance", "change": 1.2}
        ],
        "insight": "Tech sector leading current recovery"
    }
