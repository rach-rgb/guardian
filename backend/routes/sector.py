import yfinance as yf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.gemini_service import gemini_service
import pandas as pd

router = APIRouter()

class SectorInfo(BaseModel):
    name: str
    change: float

class SectorResponse(BaseModel):
    sectors: List[SectorInfo]
    insight: str

# ETF to Sector mapping
SECTORS = {
    'SPY': 'S&P 500 ETF',
    'IWM': 'Russell 2000',
    'SMH': 'Semiconductor ETF',
    'ITA': 'Aerospace & Defense',
    'XLU': 'Utilities (AI Power)',
    'XBI': 'Biotech ETF'
}


@router.get("/sector", response_model=SectorResponse)
async def get_sector_performance():
    try:
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
                sectors_info.append(SectorInfo(name=SECTORS[ticker], change=round(change_pct, 2)))
                insight_data.append(f"{SECTORS[ticker]}: {change_pct:+.2f}%")
            except Exception as e:
                print(f"Error calculating change for {ticker}: {e}")

        if not sectors_info:
            raise Exception("Failed to parse sector data")

        # Sort sectors by change descending
        sectors_info.sort(key=lambda x: x.change, reverse=True)

        # Generate insight using Gemini
        data_str = ", ".join(insight_data)
        prompt = f"""
        다음은 오늘 미국 주요 섹터 ETF의 등락률 데이터입니다:
        {data_str}

        이 데이터를 바탕으로 현재 시장의 자금 흐름이나 특징을 파악하여, **딱 한 문장**으로 짧고 날카로운 투자 인사이트를 작성해주세요. (예: "기술주가 시장 상승을 주도하는 반면, 에너지는 약세를 보이고 있습니다.")
        """

        insight = "Sector analysis unavailable."
        if gemini_service.client:
            # gemini_service.generate_content defaults to gemini-2.5-flash
            insight = gemini_service.generate_content(prompt)
            insight = insight.replace("*", "").replace("\n", " ").strip()

        return SectorResponse(sectors=sectors_info, insight=insight)

    except Exception as e:
        print(f"Error in /sector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
