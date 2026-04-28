from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import yfinance as yf
import json
from services.gemini_service import gemini_service

router = APIRouter()

class StockAnalysis(BaseModel):
    summary: str
    sentiment: str
    checkpoints: str

class StockInfo(BaseModel):
    symbol: str
    price: float
    change: float
    description: str
    analysis: StockAnalysis | None = None

class StockResponse(BaseModel):
    stock: StockInfo

TICKER_SYSTEM_PROMPT = """당신은 1~3년 차 투자자를 위한 '객관적인 금융 데이터 시각화 도우미' 입니다.
목표는 현재 차트의 기술적 상황을 쉽고 구조화된 형태로 설명하는 것입니다.

# 절대 제약 사항
1. "매수하세요", "매도하세요", "손절하세요" 같은 직접적인 투자 지시나 리딩을 절대 하지 마십시오.
2. "관찰이 필요합니다", "확인해야 합니다"와 같은 중립적인 체크포인트 형식으로만 작성하십시오.
3. 출력은 반드시 아래 JSON 구조만 응답하십시오. 마크다운 백틱(```json) 없이 순수 JSON 문자열만 반환해야 합니다.

# JSON 응답 포맷 (이외의 어떤 텍스트도 포함하지 마십시오):
{
    "summary": "🎯 **패턴 요약:** [내용]",
    "sentiment": "🧠 **시장 심리:** [내용]",
    "checkpoints": "🔍 **체크포인트:** [내용]"
}
"""

@router.get("/stock/{ticker}", response_model=StockResponse)
async def get_stock_data(ticker: str):
    try:
        # Fetch data using yfinance
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1mo")
        if hist.empty:
            raise HTTPException(status_code=404, detail="Ticker data not found")

        # Get latest price and previous close
        latest_price = hist['Close'].iloc[-1]
        prev_price = hist['Close'].iloc[-2] if len(hist) > 1 else latest_price
        
        change_pct = ((latest_price - prev_price) / prev_price) * 100

        # Create a simple pattern summary based on recent movement
        trend = "상승" if change_pct > 0 else "하락" if change_pct < 0 else "횡보"
        detected_pattern = f"최근 한 달간 {trend} 흐름을 보였으며, 전일 대비 {change_pct:.2f}% 변동했습니다."

        user_prompt = f"종목: {ticker.upper()}, 현재가: ${latest_price:.2f}, 주요 현상: {detected_pattern}"

        analysis_data = None
        try:
            # Attempt to use Gemini
            raw_response = gemini_service.generate_content(TICKER_SYSTEM_PROMPT + "\n\n=== 분석 요청 ===\n" + user_prompt)
            # clean JSON markdown blocks if any
            clean_text = raw_response.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_text)
            
            analysis_data = StockAnalysis(
                summary=parsed.get("summary", "🎯 **패턴 요약:** 패턴 정보를 불러올 수 없습니다."),
                sentiment=parsed.get("sentiment", "🧠 **시장 심리:** 시장 심리 정보를 불러올 수 없습니다."),
                checkpoints=parsed.get("checkpoints", "🔍 **체크포인트:** 체크포인트 정보를 불러올 수 없습니다.")
            )
        except Exception as e:
            print(f"Gemini API Error: {e}")
            analysis_data = StockAnalysis(
                summary="🎯 **패턴 요약:** AI 분석을 현재 사용할 수 없습니다.",
                sentiment="🧠 **시장 심리:** 정보 없음.",
                checkpoints="🔍 **체크포인트:** API 키 설정을 확인해주세요."
            )

        return StockResponse(
            stock=StockInfo(
                symbol=ticker.upper(),
                price=round(latest_price, 2),
                change=round(change_pct, 2),
                description=f"Detailed market data and Gemini analysis for {ticker.upper()}.",
                analysis=analysis_data
            )
        )
    except Exception as e:
        print(f"Error fetching stock data: {e}")
        # fallback for UI
        return StockResponse(
            stock=StockInfo(
                symbol=ticker.upper(),
                price=0.0,
                change=0.0,
                description="Failed to load data.",
                analysis=None
            )
        )
