from fastapi import APIRouter

router = APIRouter()

@router.get("/wakeup")
async def get_wakeup():
    return True
