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
    danger_limit: int = 71
    warn_limit: int = 31

def load_settings() -> UserSettings:
    settings = UserSettings()
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                settings = UserSettings(**data)
        except Exception:
            pass

    if settings.risk_tolerance == "low":
        settings.danger_limit, settings.warn_limit = 50, 20
    elif settings.risk_tolerance == "high":
        settings.danger_limit, settings.warn_limit = 85, 45
    else:
        settings.danger_limit, settings.warn_limit = 71, 31

    return settings

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
