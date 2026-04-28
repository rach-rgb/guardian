import yfinance as yf
import pandas as pd
import numpy as np
import scipy.stats as stats
import math
import json
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
    warn_limit: int
    danger_limit: int

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

def get_gemini_market_analysis(user_settings, market_context):
    SECTOR_MAP = {
        "ai_bigtech": "AI / 빅테크",
        "semiconductors": "반도체",
        "high_dividend": "고배당 / 인컴",
        "defense": "방산 / 우주",
        "energy": "에너지 / 자원",
        "healthcare": "헬스케어",
    }
    sectorsKr = SECTOR_MAP.get(user_settings.preferred_sector, "지정되지 않음")

    STRATEGY_MAP = {
        "low": "안정성 지향",
        "medium": "균형 투자",
        "high": "수익성 지향",
    }
    strategiesKr = STRATEGY_MAP.get(user_settings.risk_tolerance, "지정되지 않음")

    risk_guidance = f"""- 저(low): DSRI 스코어 {user_settings.warn_limit} 이상 '경계', {user_settings.danger_limit} 이상 '위험'으로 판단합니다. 변동성 관리에 집중합니다.
- 중(medium): DSRI 스코어 {user_settings.warn_limit} 이상 '경계', {user_settings.danger_limit} 이상 '위험'으로 판단합니다. 균형적인 시각을 유지합니다.
- 고(high): DSRI 스코어 {user_settings.warn_limit} 이상 '경계', {user_settings.danger_limit} 이상 '위험'으로 판단합니다. 높은 변동성을 감수하며 기회를 모색합니다."""

    prompt = f"""
당신은 삼성 스마트 TV 환경에서 작동하는 주가 위험 관리 시스템 'Market Guardian TV'의 핵심 AI 엔진입니다.
아래 프로필과 시장 데이터를 바탕으로 분석합니다.

[유저 투자 프로필]
- 위험 수용도: {user_settings.risk_tolerance}
- 투자 전략: {strategiesKr}
- 관심 섹터: {sectorsKr}

[위험 수용도 가중치 적용 기준]
{risk_guidance}

[시장 데이터]
{json.dumps(market_context, indent=2, ensure_ascii=False)}

[분석 원칙]
1. 각 지표를 독립적으로 나열하지 말고, 지표 간 상호 강화(confluence) 관계를 밝힐 것.
2. [summary 필드] 반드시 1~2문장의 평서문으로 작성하며, 볼드체(**)나 기호 등 마크다운 형식을 절대 사용하지 마세요.
3. [details 필드] "~입니다" 식의 단순 서술을 금지하고 "왜냐하면", "이는 ~를 의미"와 같은 인과 구조를 사용하여 깊이 있는 분석을 제공하세요. (마크다운 활용 권장)
4. 투자 시사점은 구체적인 수치(예: 포지션 10%% 축소, VIX 30 돌파 시 등)를 포함하세요.
5. 확신 과장 금지 — 불확실성은 솔직히 명시할 것.
6. Detail 은 10줄 이내로 작성해주세요.

[출력 형식]
반드시 다음 구조의 순수 JSON 포맷으로만 응답하세요.
```json
{{
  "summary": "...",
  "details": "..."
}}
```
"""
    try:
        response_text = gemini_service.generate_content(prompt)
        # The response from Gemini might have ```json ... ``` markdown, need to strip it.
        clean_response = response_text.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]

        data = json.loads(clean_response)
        summary = data.get("summary", "요약 생성 실패")
        details = data.get("details", "상세 분석 생성 실패")
        return summary, details
    except Exception as e:
        print(f"Error in Gemini analysis: {e}")
        return "시장 데이터 분석 중입니다.", "데이터를 바탕으로 시장 위험을 분석할 수 없습니다."

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



        risk_level = "🟢 안전"
        if final_score >= danger_limit:
            risk_level = "🔴 위험"
        elif final_score >= warn_limit:
            risk_level = "🟡 경계"

        print("[DEBUG] Score: ", final_score)
        print("[DEBUG] Limit: ", warn_limit, danger_limit)
        print("[DEBUG] ", risk_level)

        dsri_score_rounded = round(float(final_score), 1)

        # Gemini Integration
        current_rsi = min(max(current['RSI'], 0), 100)
        macd_ind = "Bullish Crossover / Positive" if current['MACD_V'] > 0 else "Bearish Crossover / Negative"
        ma_ind = "200일선 이탈 (Below 200 SMA)" if current['SPY'] < spy_sma200 else "200일선 상회 (Above 200 SMA)"

        market_context = {
            "dsri_score": dsri_score_rounded,
            "market_regime": regime,
            "risk_level": risk_level,
            "factor_scores": factors,
            "weights_applied": weights,
            "raw_vix": round(float(current['VIX']), 2),
            "spy_price": round(float(current['SPY']), 2),
            "macro_spread": round(float(current['MACRO_SPREAD']), 4),
            "technical_indicators": {
                "RSI": round(float(current_rsi), 1),
                "MACD": macd_ind,
                "Moving_Average": ma_ind
            }
        }
        
        main_cause, guardian_message = get_gemini_market_analysis(user_settings, market_context)

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
            macro_spread_raw=round(float(current['MACRO_SPREAD']), 4),
            warn_limit=warn_limit,
            danger_limit=danger_limit
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
