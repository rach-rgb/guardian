from fastapi import APIRouter
from pydantic import BaseModel
import json
import os

router = APIRouter()

SETTINGS_FILE = "user_settings.json"

class UserSettings(BaseModel):
    risk_tolerance: str = "medium"
    preferred_sector: str = "Technology"
    watchlist: list[str] = ["NVDA", "AAPL"]

def load_settings() -> UserSettings:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return UserSettings(**data)
        except Exception:
            pass
    return UserSettings()

def save_settings(settings: UserSettings):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings.model_dump(), f, ensure_ascii=False, indent=4)

@router.get("/settings", response_model=UserSettings)
async def get_settings():
    return load_settings()

@router.post("/settings", response_model=UserSettings)
async def update_settings(settings: UserSettings):
    save_settings(settings)
    return settings
