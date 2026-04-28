import yfinance as yf
import numpy as np

def calculate_risk(ticker_symbol="SOXL"):
    stock = yf.Ticker(ticker_symbol)
    hist = stock.history(period="180d")
    
    if hist.empty:
        print("No data found")
        return
        
    current_price = hist['Close'].iloc[-1]
    high_price = hist['High'].max()
    
    # MDD Calculation
    mdd = ((current_price - high_price) / high_price) * 100
    
    # Volatility
    returns = hist['Close'].pct_change().dropna()
    volatility = returns.std() * np.sqrt(252) * 100
    
    # RSI (14 days)
    delta = hist['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs.iloc[-1]))
    
    print(f"--- {ticker_symbol} Data Check ---")
    print(f"Current Price: ${current_price:.2f}")
    print(f"180d High: ${high_price:.2f}")
    print(f"MDD: {mdd:.2f}%")
    print(f"Volatility (Annualized): {volatility:.2f}%")
    print(f"RSI (14): {rsi:.2f}")
    
    # Risk Score calculation logic from backend
    score = 50
    if rsi > 70:
        score += (rsi - 70) * 1.5
    elif rsi < 30:
        score -= (30 - rsi) * 1.5
        
    if mdd < -20:
        score += abs(mdd + 20) * 1.2
        
    if volatility > 40:
        score += (volatility - 40) * 0.5
        
    final_score = min(max(int(score), 0), 100)
    print(f"Calculated Risk Score: {final_score}")

if __name__ == "__main__":
    calculate_risk()
