import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Info } from 'lucide-react';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  description: string;
  analysis: {
    summary: string;
    sentiment: string;
    checkpoints: string;
  } | null;
}

const StockCard: React.FC = () => {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        // Defaulting to NVDA for the stock card
        const response = await fetch('http://127.0.0.1:8000/stock/NVDA');
        if (!response.ok) {
          throw new Error('Failed to fetch stock data');
        }
        const data = await response.json();
        setStockData(data.stock);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

  // Use dummy data or render loading state
  const displayData = stockData || {
    symbol: 'NVDA',
    price: 0,
    change: 0,
    description: '',
    analysis: null
  };

  const isPositive = displayData.change >= 0;

  // Helper to strip Markdown strong/bold asterisks from strings if present
  // The backend might send: "🎯 **패턴 요약:** 내용"
  const renderMarkdownText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="card stock-card-layout">
      <div className="card-header">
        <Activity className="icon-purple" />
        <h2>Featured Insight</h2>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="loading-state" style={{ padding: '2rem 0', textAlign: 'center', opacity: 0.7 }}>
            Loading market data...
          </div>
        ) : error ? (
          <div className="error-state" style={{ padding: '2rem 0', textAlign: 'center', color: '#ff6b6b' }}>
            Failed to load: {error}
          </div>
        ) : (
          <div className="single-stock-display">
            <div className="stock-main-info">
              <span className="stock-symbol-large">{displayData.symbol}</span>
              <div className="stock-price-group">
                <span className="stock-price-large">${displayData.price.toFixed(2)}</span>
                <span className={`stock-change-badge ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? '+' : ''}{displayData.change.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="stock-analysis-box">
              <div className="analysis-header">
                <TrendingUp size={16} className={isPositive ? 'positive' : 'negative'} />
                <span>Gemini AI Analysis</span>
              </div>
              <div className="analysis-text" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayData.analysis ? (
                  <>
                    <div>{renderMarkdownText(displayData.analysis.summary)}</div>
                    <div>{renderMarkdownText(displayData.analysis.sentiment)}</div>
                    <div>{renderMarkdownText(displayData.analysis.checkpoints)}</div>
                  </>
                ) : (
                  <p>AI Analysis not available.</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="card-footer-info">
          <Info size={14} />
          <span>Showing results for the most active stock</span>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
