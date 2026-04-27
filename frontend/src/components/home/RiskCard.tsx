import React from 'react';
import { AlertTriangle, TrendingUp, Shield } from 'lucide-react';

const RiskCard: React.FC = () => {
  return (
    <div className="card risk-card-layout">
      <div className="card-header">
        <AlertTriangle className="icon-red" />
        <h2>Market Risk Analysis</h2>
      </div>
      <div className="card-body">
        <div className="placeholder-content">
          <div className="big-number">74</div>
          <p className="status-text">High Volatility Detected</p>
        </div>
        <div className="metrics-list">
          <div className="metric-item">
            <TrendingUp size={16} />
            <span>Volatility Index: 24.5</span>
          </div>
          <div className="metric-item">
            <Shield size={16} />
            <span>Protection Level: Optimal</span>
          </div>
        </div>
        <div className="placeholder-chart">
          {/* Placeholder for a chart */}
          <div className="bar-chart-placeholder">
            <div className="bar" style={{ height: '60%' }}></div>
            <div className="bar" style={{ height: '80%' }}></div>
            <div className="bar" style={{ height: '40%' }}></div>
            <div className="bar" style={{ height: '90%' }}></div>
            <div className="bar" style={{ height: '70%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskCard;
