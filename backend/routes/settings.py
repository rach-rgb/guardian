from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class UserSettings(BaseModel):
    risk_tolerance: str = "medium"
    preferred_sector: str = "Technology"
    watchlist: list = ["NVDA", "AAPL"]

# Mock storage
mock_settings = UserSettings()

@router.get("/settings", response_model=UserSettings)
async def get_settings():
    return mock_settings

@router.post("/settings", response_model=UserSettings)
async def update_settings(settings: UserSettings):
    global mock_settings
    mock_settings = settings
    return mock_settings
