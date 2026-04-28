from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64
import json
from google.genai import types
from services.gemini_service import gemini_service

router = APIRouter()

class WakeupRequest(BaseModel):
    audio_base64: str
    mime_type: str = "audio/webm"

class WakeupResponse(BaseModel):
    tickers: list[str]
    intent: str
    query: str

@router.post("/wakeup", response_model=WakeupResponse)
async def post_wakeup(request: WakeupRequest):
    try:
        # Decode base64 audio (strip data URI prefix if present)
        b64_data = request.audio_base64
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]
            
        audio_bytes = base64.b64decode(b64_data)
        
        prompt = """
        이 음성을 듣고 주식 시장과 관련된 사용자의 의도를 추출하세요.
        1. 'tickers': 최대 3개의 가능성 있는 티커 심볼 리스트를 식별합니다.
           - 삼성전자처럼 한국 주식의 경우, `.KS` (코스피) 또는 `.KQ` (코스닥) 접미사를 포함한 후보를 반드시 제안해야 합니다. (예: ["005930.KS", "005930", "SMSN"])
           - 항상 가장 가능성이 높은 거래소 접미사가 붙은 버전을 포함하세요.
           - 만약 사용자가 "가디언즈", "안녕" 같은 짧은 호출어(Wake word)만 말하거나, "시장", "시황", "오늘 어때" 처럼 전반적인 상황을 묻는다면, 미국 전체 시장을 대표하는 S&P 500 ETF인 ["SPY"]를 반환하세요.
        2. 'intent': 사용자의 의도를 'price', 'chart', 'news', 'analysis' 중 하나로 분류합니다. (시장 전반이나 호출어만 들어오면 'analysis'로 설정)
        3. 'query': 음성에서 추출한 원본 텍스트를 제공합니다.

        결과는 반드시 다음 JSON 형식으로 반환해야 합니다:
        {
            "tickers": ["SYMBOL1", "SYMBOL2", "SYMBOL3"],
            "intent": "INTENT",
            "query": "TRANSCRIPT"
        }
        """

        if not gemini_service.client:
            raise HTTPException(status_code=500, detail="Gemini client not initialized")

        # Call Gemini
        response = gemini_service.client.models.generate_content(
            model="gemini-1.5-pro",
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type=request.mime_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        result = json.loads(response.text)
        return WakeupResponse(**result)

    except Exception as e:
        print(f"Error in /wakeup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
