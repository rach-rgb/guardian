from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64
import json
from google.genai import types
from services.gemini_service import gemini_service
from typing import Optional

import asyncio
import os

router = APIRouter()

class WakeupRequest(BaseModel):
    audio_base64: Optional[str] = None
    mime_type: Optional[str] = "audio/webm"
    demo_text: Optional[str] = None

class WakeupResponse(BaseModel):
    is_stock_market_related: bool
    text: str

@router.post("/wakeup", response_model=WakeupResponse)
async def post_wakeup(request: WakeupRequest):
    print("[DEBUG] start wakeup")
    try:
        contents = []
        is_demo = os.getenv("DEMO", "true").lower() == "true"
        print("[DEBUG] demo: ", is_demo)
        
        if is_demo:
            request.demo_text = "오늘 시장 상황 보여줘"

        if request.demo_text:
            await asyncio.sleep(5)
            # Demo mode: use text directly
            prompt = '''
            이 텍스트가 주식 시장과 관련이 있는지 판단하세요.
            - 텍스트가 주식 시장과 관련된 경우 true, 그렇지 않은 경우 false를 반환합니다.
            
            결과는 반드시 다음 JSON 형식으로 반환해야 합니다:
            {
                "is_stock_market_related": true,
                "text": "사용자가 전달한 내용"
            }
            '''
            contents = [request.demo_text, prompt]
        elif request.audio_base64:
            # Audio mode
            b64_data = request.audio_base64
            if "," in b64_data:
                b64_data = b64_data.split(",", 1)[1]
            audio_bytes = base64.b64decode(b64_data)
            
            prompt = '''
            이 음성이 주식 시장과 관련이 있는지 판단하고, 음성의 내용을 텍스트로 변환하세요.
            
            결과는 반드시 다음 JSON 형식으로 반환해야 합니다:
            {
                "is_stock_market_related": true,
                "text": "사용자가 말한 내용"
            }
            '''
            contents = [
                types.Part.from_bytes(data=audio_bytes, mime_type=request.mime_type),
                prompt
            ]
        else:
            raise HTTPException(status_code=400, detail="Either audio_base64 or demo_text must be provided")

        if not gemini_service.client:
            raise HTTPException(status_code=500, detail="Gemini client not initialized")

        # Call Gemini
        print("[DEBUG] invoke dashboard")
        response_text = gemini_service.generate_content_with_config(
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        result = json.loads(response_text)
        text_val = result.get("text", request.demo_text if request.demo_text else "음성을 인식하지 못했습니다.")
        return WakeupResponse(
            is_stock_market_related=result.get("is_stock_market_related", False),
            text=text_val
        )

    except Exception as e:
        print(f"Error in /wakeup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
