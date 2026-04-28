from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import yfinance as yf
import json
from services.gemini_service import gemini_service

router = APIRouter()

class StockAnalysis(BaseModel):
    pattern_summary: str
    pattern_analysis: str
    market_sentiment: str

class StockDataPoint(BaseModel):
    date: str
    price: float

class StockInfo(BaseModel):
    symbol: str
    price: float
    change: float
    mdd: float
    rsi: float
    risk_score: int
    history: list[StockDataPoint]
    description: str
    analysis: StockAnalysis | None = None

class StockResponse(BaseModel):
    stock: StockInfo

TICKER_SYSTEM_PROMPT = """당신은 1~3년 차 투자자를 위한 '객관적인 금융 데이터 시각화 도우미' 입니다.
목표는 현재 차트의 기술적 상황을 쉽고 구조화된 형태, 특히 대표적인 20가지 기술적 패턴(예: W자 패턴(이중 바닥), M자 패턴(이중 천장), 헤드앤숄더, 컵앤핸들, 상승 깃발형 등) 중 하나로 매칭하여 매우 간결하게 설명하는 것입니다.

# 절대 제약 사항
1. "매수하세요", "매도하세요", "손절하세요" 같은 직접적인 투자 지시나 리딩을 절대 하지 마십시오.
2. 각 항목은 반드시 1~2문장 이내로 매우 간결하게 작성하십시오. (너무 긴 줄글 금지)
3. 이모지(🎯, 🧠 등)나 특수기호를 절대 사용하지 마십시오.
4. 출력은 반드시 아래 JSON 구조만 응답하십시오. 마크다운 백틱(```json) 없이 순수 JSON 문자열만 반환해야 합니다.

# JSON 응답 포맷 (이외의 어떤 텍스트도 포함하지 마십시오):
{
    "pattern_summary": "[어떤 패턴인지 명칭과 핵심 1줄 요약]",
    "pattern_analysis": "[해당 패턴이 나타나는 기술적 근거 1~2줄]",
    "market_sentiment": "[현재 시장 참여자들의 심리 상태 1줄]"
}
"""

@router.get("/stock/{ticker}", response_model=StockResponse)
async def get_stock_data(ticker: str):
    try:
        # Fetch data using yfinance (get 6 months for better SMA calculation)
        stock = yf.Ticker(ticker)
        hist = stock.history(period="6mo")
        if hist.empty:
            raise HTTPException(status_code=404, detail="Ticker data not found")

        # Get latest price and previous close
        latest_price = hist['Close'].iloc[-1]
        prev_price = hist['Close'].iloc[-2] if len(hist) > 1 else latest_price
        change_pct = ((latest_price - prev_price) / prev_price) * 100

        # Technical Indicators
        # 1. RSI
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs)).iloc[-1]

        # 2. SMAs
        sma20 = hist['Close'].rolling(window=20).mean().iloc[-1]
        sma50 = hist['Close'].rolling(window=50).mean().iloc[-1]
        
        # Detected Pattern Summary for Gemini
        trend = "상승" if latest_price > sma20 else "하락"
        pattern_desc = f"현재가는 {latest_price:.2f}로 20일 이평선({sma20:.2f}) 대비 {trend} 추세입니다. RSI는 {rsi:.1f}입니다."
        if rsi > 70: pattern_desc += " (과매수 상태)"
        elif rsi < 30: pattern_desc += " (과매도 상태)"

        # MDD Calculation
        rolling_max = hist['Close'].cummax()
        drawdown = (hist['Close'] - rolling_max) / rolling_max * 100
        mdd = drawdown.min()

        # Risk Score (simple heuristic for UI)
        risk_score = int(min(max(rsi * 0.5 + abs(mdd) * 2, 0), 100))

        # History for Chart
        chart_history = []
        for index, row in hist.iterrows():
            chart_history.append(StockDataPoint(
                date=index.strftime('%Y-%m-%d'),
                price=round(row['Close'], 2)
            ))

        user_prompt = f"종목: {ticker.upper()}, 현재가: ${latest_price:.2f}, 주요 현상: {pattern_desc}"

        analysis_data = None
        try:
            # Attempt to use Gemini
            raw_response = gemini_service.generate_content(TICKER_SYSTEM_PROMPT + "\n\n=== 분석 요청 ===\n" + user_prompt)
            
            # Clean up raw_response to ensure it's parseable JSON (remove markdown ticks if present)
            cleaned_response = raw_response.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.startswith('```'):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
                
            try:
                parsed_json = json.loads(cleaned_response.strip())
                analysis_data = StockAnalysis(
                    pattern_summary=parsed_json.get("pattern_summary", "패턴 요약 정보를 불러올 수 없습니다."),
                    pattern_analysis=parsed_json.get("pattern_analysis", "상세 분석 정보를 불러올 수 없습니다."),
                    market_sentiment=parsed_json.get("market_sentiment", "시장 심리 정보를 불러올 수 없습니다.")
                )
            except json.JSONDecodeError:
                analysis_data = StockAnalysis(
                    pattern_summary="JSON 파싱 오류",
                    pattern_analysis=cleaned_response[:100],
                    market_sentiment="확인 필요"
                )
        except Exception as e:
            print(f"Gemini API Error: {e}")
            analysis_data = StockAnalysis(
                pattern_summary="AI 분석을 현재 사용할 수 없습니다.",
                pattern_analysis="일시적인 서버 오류가 발생했습니다.",
                market_sentiment="API 키 설정을 확인해주세요."
            )

        return StockResponse(
            stock=StockInfo(
                symbol=ticker.upper(),
                price=round(latest_price, 2),
                change=round(change_pct, 2),
                mdd=round(mdd, 2),
                rsi=round(rsi, 1),
                risk_score=risk_score,
                history=chart_history,
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
                mdd=0.0,
                rsi=0.0,
                risk_score=0,
                history=[],
                description="Failed to load data.",
                analysis=None
            )
        )
