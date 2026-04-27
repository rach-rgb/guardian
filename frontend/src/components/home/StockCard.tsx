import React from 'react';
import { Activity, TrendingUp, Info } from 'lucide-react';

const StockCard: React.FC = () => {
  return (
    <div className="card stock-card-layout">
      <div className="card-header">
        <Activity className="icon-purple" />
        <h2>Featured Insight</h2>
      </div>
      <div className="card-body">
        <div className="single-stock-display">
          <div className="stock-main-info">
            <span className="stock-symbol-large">NVDA</span>
            <div className="stock-price-group">
              <span className="stock-price-large">$894.33</span>
              <span className="stock-change-badge positive">+3.5%</span>
            </div>
          </div>
          
          <div className="stock-analysis-box">
            <div className="analysis-header">
              <TrendingUp size={16} className="positive" />
              <span>Gemini AI Analysis</span>
            </div>
            <p className="analysis-text">
              NVIDIA is showing strong momentum due to increased demand in AI data centers. 
              The technical indicators suggest a continued bullish trend.
            </p>
          </div>
        </div>
        
        <div className="card-footer-info">
          <Info size={14} />
          <span>Showing results for the most active stock</span>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
