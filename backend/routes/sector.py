import yfinance as yf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.gemini_service import gemini_service
import pandas as pd
from google.genai import types
from routes.settings import load_settings

router = APIRouter()

class SectorInfo(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    status: str
    score: int

class SectorResponse(BaseModel):
    sectors: List[SectorInfo]
    insight: str

# ETF to Sector mapping
SECTOR_MAP = {
    "ai_bigtech": {
        'MSFT': 'Microsoft',
        'GOOGL': 'Alphabet',
        'AMZN': 'Amazon',
        'META': 'Meta Platforms',
        'AAPL': 'Apple',
        'PLTR': 'Palantir'
    },
    "semiconductors": {
        'NVDA': 'NVIDIA',
        'AVGO': 'Broadcom',
        'AMD': 'Advanced Micro Devices',
        'TSM': 'TSMC',
        'ASML': 'ASML Holding',
        'ARM': 'Arm Holdings'
    },
    "high_dividend": {
        'SCHD': 'Schwab US Dividend',
        'JEPI': 'JPMorgan Equity Premium',
        'O': 'Realty Income',
        'VZ': 'Verizon',
        'KO': 'Coca-Cola',
        'PEP': 'PepsiCo'
    },
    "defense": {
        'LMT': 'Lockheed Martin',
        'RTX': 'RTX Corporation',
        'NOC': 'Northrop Grumman',
        'GD': 'General Dynamics',
        'SPCE': 'Virgin Galactic',
        'BA': 'Boeing'
    },
    "energy": {
        'XOM': 'Exxon Mobil',
        'CVX': 'Chevron',
        'NEE': 'NextEra Energy',
        'OXY': 'Occidental Petroleum',
        'VLO': 'Valero Energy',
        'FSLR': 'First Solar'
    },
    "healthcare": {
        'LLY': 'Eli Lilly',
        'NVO': 'Novo Nordisk',
        'UNH': 'UnitedHealth Group',
        'JNJ': 'Johnson & Johnson',
        'ABBV': 'AbbVie',
        'ISRG': 'Intuitive Surgical'
    }
}

@router.get("/sector", response_model=SectorResponse)
async def get_sector_performance():
    try:
        user_settings = load_settings()
        sector_key = user_settings.preferred_sector
        if sector_key not in SECTOR_MAP:
            sector_key = "ai_bigtech"
        print("[DEBUG] Sector: ", sector_key)

        SECTORS = SECTOR_MAP[sector_key]

        tickers = list(SECTORS.keys())
        # Fetch 5 days of data to ensure we have at least 2 valid trading days
        df = yf.download(tickers, period="5d")
        
        sectors_info = []
        insight_data = []

        if df.empty or 'Close' not in df:
            raise Exception("No data from yfinance")

        closes = df['Close'].dropna(how='all')
        if len(closes) < 2:
            raise Exception("Not enough trading days data")

        # Get the last two available rows
        prev_close = closes.iloc[-2]
        curr_close = closes.iloc[-1]

        for ticker in tickers:
            try:
                # Need to handle pandas series correctly depending on yfinance version
                prev = float(prev_close[ticker].iloc[0]) if isinstance(prev_close[ticker], pd.Series) else float(prev_close[ticker])
                curr = float(curr_close[ticker].iloc[0]) if isinstance(curr_close[ticker], pd.Series) else float(curr_close[ticker])
                
                if pd.isna(prev) or pd.isna(curr) or prev == 0:
                    continue
                change_pct = ((curr - prev) / prev) * 100
                
                # Mock risk score and status based on daily change
                # Large negative change = higher risk
                score = int(max(0, min(100, 50 - (change_pct * 10))))
                if score >= 70:
                    status = "위험"
                elif score >= 40:
                    status = "경계"
                else:
                    status = "안전"

                sectors_info.append(SectorInfo(
                    symbol=ticker,
                    name=SECTORS[ticker],
                    price=round(curr, 2),
                    change=round(change_pct, 2),
                    status=status,
                    score=score
                ))
                insight_data.append(f"{ticker}: {change_pct:+.2f}%")
            except Exception as e:
                print(f"Error calculating change for {ticker}: {e}")

        if not sectors_info:
            raise Exception("Failed to parse sector data")

        # Generate insight using Gemini
        data_str = ", ".join(insight_data)
        prompt = f"""
        다음은 오늘 미국 주요 모니터링 그룹 ETF의 등락률 데이터입니다:
        {data_str}

        이 데이터를 바탕으로 현재 시장의 자금 흐름이나 특징을 파악하여, **딱 한 문장**으로 짧고 날카로운 투자 인사이트를 작성해주세요.
        """

        insight = "Sector analysis unavailable."
        if gemini_service.client:
            insight = gemini_service.generate_content(prompt)
            insight = insight.replace("*", "").replace("\n", " ").strip()

        return SectorResponse(sectors=sectors_info, insight=insight)

    except Exception as e:
        print(f"Error in /sector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
