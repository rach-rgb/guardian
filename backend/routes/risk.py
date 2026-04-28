import yfinance as yf
import pandas as pd
import numpy as np
import scipy.stats as stats
import math
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from services.gemini_service import gemini_service
from datetime import datetime, timedelta

router = APIRouter()

class RiskResponse(BaseModel):
    status: str
    date: str
    regime: str
    risk_level: str
    final_dsri_score: float
    main_cause: str
    guardian_data: str
    factor_scores: Dict[str, float]
    weights_applied: Dict[str, float]
    raw_spy_price: float
    raw_vix: float
    macro_spread_raw: float

ALPHA_MACRO = 0.75
TICKERS = ['SPY', '^VIX', 'HYG', '^TNX', '^IRX', 'RSP']

def erf(x):
    return math.erf(x)

def norm_cdf(x):
    return stats.norm.cdf(x)

def z_to_score(current_val, series, inverse=False):
    series = pd.Series(series).dropna()
    if len(series) < 2 or series.std() == 0:
        return 50.0
    mean = series.mean()
    std = series.std(ddof=1)
    z = (current_val - mean) / std
    if inverse:
        z = -z
    score = norm_cdf(z) * 100
    return min(max(score, 0), 100)

def sigmoid_score(spread, alpha):
    return 100 / (1 + np.exp(spread * alpha))

def get_main_cause(vix_value, recent_vix_changes):
    prompt = f"""
    최근 시장의 VIX 지수는 {vix_value:.2f}입니다. 최근 변화량은 {recent_vix_changes}입니다.
    현재 VIX 지수 수준을 바탕으로 시장의 주요 불안 요인이나 원인을 1문장으로 짧게 요약해주세요. (한국어로 작성)
    """
    try:
        return gemini_service.generate_content(prompt)
    except Exception as e:
        return "시장 데이터 분석 중입니다."

def get_market_guardian_data(guardian_input, user_name="사용자"):
    prompt = f"""
    당신은 시장 상황을 분석하여 사용자({user_name})에게 브리핑하는 금융 AI 비서 '가디언'입니다.
    다음의 데이터 모델을 바탕으로 시장 위험 요약 및 조언을 생성해주세요.
    
    데이터:
    {guardian_input}
    
    제약조건:
    1. 마크다운 형식을 사용하여 가독성 있게 작성할 것. (불릿 포인트 등 활용)
    2. 매우 전문적이고 신뢰감 있는 어조 유지.
    3. 3~4문장 분량으로 짧고 핵심만 전달할 것.
    """
    try:
        return gemini_service.generate_content(prompt)
    except Exception as e:
        return "데이터를 바탕으로 시장 위험을 분석할 수 없습니다."

@router.get("/risk", response_model=RiskResponse)
async def get_risk():
    try:
        # Fetch data for 3 years to ensure we have enough data for 500+ trading days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365*3)
        
        # Download data, group_by ticker so columns are flat or handle multi-index
        df_raw = yf.download(TICKERS, start=start_date, end=end_date, progress=False)
        if df_raw.empty:
            raise HTTPException(status_code=500, detail="Failed to fetch data from yfinance")

        # In yfinance, if multiple tickers are downloaded, columns are MultiIndex (Price, Ticker)
        # Check if it's MultiIndex, and extract 'Close', 'High', 'Low', 'Volume'
        if isinstance(df_raw.columns, pd.MultiIndex):
            df_close = df_raw['Close'] if 'Close' in df_raw else df_raw['Adj Close']
            df_high = df_raw['High']
            df_low = df_raw['Low']
            df_vol = df_raw['Volume']
        else:
            raise HTTPException(status_code=500, detail="Expected MultiIndex from yfinance for multiple tickers")
        
        # Ensure SPY exists
        if 'SPY' not in df_close.columns:
            raise HTTPException(status_code=500, detail="SPY data missing")

        # Forward fill to handle NaNs in alignment
        df_close = df_close.ffill().dropna(subset=['SPY'])
        df_high = df_high.ffill().dropna(subset=['SPY'])
        df_low = df_low.ffill().dropna(subset=['SPY'])
        df_vol = df_vol.ffill().dropna(subset=['SPY'])

        # Calculate factors
        spy = df_close['SPY']
        spy_high = df_high['SPY']
        spy_low = df_low['SPY']
        spy_vol = df_vol['SPY']

        vix = df_close['^VIX']
        rsp = df_close['RSP']
        hyg = df_close['HYG']
        tnx = df_close['^TNX']
        irx = df_close['^IRX']

        # RMA / RSI
        delta = spy.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        avg_gain = gain.ewm(alpha=1/14, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/14, adjust=False).mean()
        avg_loss = avg_loss.replace(0, 1e-10) # avoid division by zero
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        rsi = rsi.clip(0, 100)

        # MACD
        ema12 = spy.ewm(span=12, adjust=False).mean()
        ema26 = spy.ewm(span=26, adjust=False).mean()
        macd_raw = ema12 - ema26

        # ATR
        tr1 = spy_high - spy_low
        tr2 = (spy_high - spy.shift(1)).abs()
        tr3 = (spy_low - spy.shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr26 = tr.ewm(alpha=1/26, adjust=False).mean()
        atr26 = atr26.replace(0, 1e-10)

        macd_v = (macd_raw / atr26) * 100

        # ILLIQ
        daily_ret_abs = (spy / spy.shift(1) - 1).abs()
        dollar_vol = spy * spy_vol
        dollar_vol = dollar_vol.replace(0, np.nan)
        illiq = (daily_ret_abs / dollar_vol) * 1e9
        
        # 99th percentile of ILLIQ over 252 days
        illiq_upper = illiq.rolling(window=252, min_periods=30).quantile(0.99)
        final_illiq = np.minimum(illiq, illiq_upper.fillna(np.inf))

        # Breadth
        breadth = rsp / spy

        # Credit (HYG/HYG(5d) - 1)
        credit = (hyg / hyg.shift(5)) - 1

        # Macro Spread
        macro_spread = tnx - irx

        # Collect factors into a DataFrame
        df = pd.DataFrame({
            'SPY': spy,
            'VIX': vix,
            'RSI': rsi,
            'MACD_V': macd_v,
            'ILLIQ': final_illiq,
            'BREADTH': breadth,
            'CREDIT': credit,
            'MACRO_SPREAD': macro_spread
        })

        df = df.dropna()
        if len(df) < 253:
            raise HTTPException(status_code=500, detail="Not enough data after alignment and dropping NaNs")

        # Get recent 252 days (excluding current) and current day
        recent_252 = df.iloc[-253:-1]
        current = df.iloc[-1]
        current_date_str = str(df.index[-1].date())

        # Volatility Score
        vix_recent = recent_252['VIX'].values
        current_vix = current['VIX']
        vol_score = (np.sum(vix_recent < current_vix) / len(vix_recent)) * 100

        # Momentum Score
        s_rsi_part = (100 - current['RSI']) / 2
        macd_v_recent = recent_252['MACD_V'].dropna()
        mean_macd = macd_v_recent.mean()
        std_macd = macd_v_recent.std(ddof=1)
        if std_macd != 0 and not np.isnan(std_macd):
            s_macd_part = (1 - norm_cdf((current['MACD_V'] - mean_macd) / std_macd)) * 50
        else:
            s_macd_part = 25.0
        mom_score = s_rsi_part + s_macd_part

        # Other Scores using z_to_score
        breadth_score = z_to_score(current['BREADTH'], recent_252['BREADTH'], inverse=True)
        illiq_score = z_to_score(current['ILLIQ'], recent_252['ILLIQ'], inverse=False)
        credit_score = z_to_score(current['CREDIT'], recent_252['CREDIT'], inverse=True)
        
        # Macro Score
        macro_score = sigmoid_score(current['MACRO_SPREAD'], ALPHA_MACRO)

        factors = {
            "volatility": round(float(vol_score), 1),
            "momentum": round(float(mom_score), 1),
            "breadth": round(float(breadth_score), 1),
            "liquidity": round(float(illiq_score), 1),
            "credit": round(float(credit_score), 1),
            "macro": round(float(macro_score), 1)
        }

        # Regime detection
        spy_sma200 = df['SPY'].iloc[-200:].mean()
        vix_sma200 = df['VIX'].iloc[-200:].mean()

        spy_below_sma = current['SPY'] < spy_sma200
        vix_above_sma = current['VIX'] > vix_sma200 * 1.10

        is_crisis = spy_below_sma or vix_above_sma
        regime = "Crisis" if is_crisis else "Normal"

        weights = {
            "volatility": 0.30 if is_crisis else 0.15,
            "momentum": 0.10 if is_crisis else 0.25,
            "breadth": 0.10 if is_crisis else 0.20,
            "liquidity": 0.30 if is_crisis else 0.15,
            "credit": 0.10 if is_crisis else 0.15,
            "macro": 0.10 if is_crisis else 0.10
        }

        final_score = (
            factors['volatility'] * weights['volatility'] +
            factors['momentum'] * weights['momentum'] +
            factors['breadth'] * weights['breadth'] +
            factors['liquidity'] * weights['liquidity'] +
            factors['credit'] * weights['credit'] +
            factors['macro'] * weights['macro']
        )

        from routes.settings import load_settings
        user_settings = load_settings()
        
        danger_limit = user_settings.danger_limit
        warn_limit = user_settings.warn_limit

        print(warn_limit, danger_limit)

        risk_level = "🟢 안전"
        if final_score >= danger_limit:
            risk_level = "🔴 위험"
        elif final_score >= warn_limit:
            risk_level = "🟡 경계"

        dsri_score_rounded = round(float(final_score), 1)

        # Gemini Integration
        main_cause = get_main_cause(current_vix, "변화 요약 없음")
        current_rsi = min(max(current['RSI'], 0), 100)
        macd_ind = "Bullish Crossover / Positive" if current['MACD_V'] > 0 else "Bearish Crossover / Negative"
        ma_ind = "200일선 이탈 (Below 200 SMA)" if current['SPY'] < spy_sma200 else "200일선 상회 (Above 200 SMA)"

        guardian_input = {
            "current_risk_score": dsri_score_rounded,
            "vix_level": round(float(current['VIX']), 2),
            "vix_news_summary": main_cause,
            "technical_indicators": {
                "RSI": round(float(current_rsi), 1),
                "MACD": macd_ind,
                "Moving_Average": ma_ind
            }
        }
        
        guardian_message = get_market_guardian_data(guardian_input, "세하")

        return RiskResponse(
            status="success",
            date=current_date_str,
            regime=regime,
            risk_level=risk_level,
            final_dsri_score=dsri_score_rounded,
            main_cause=main_cause,
            guardian_data=guardian_message,
            factor_scores=factors,
            weights_applied=weights,
            raw_spy_price=round(float(current['SPY']), 2),
            raw_vix=round(float(current['VIX']), 2),
            macro_spread_raw=round(float(current['MACRO_SPREAD']), 4)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
