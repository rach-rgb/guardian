import React from 'react';
import { PieChart, Zap } from 'lucide-react';

const SectorCard: React.FC = () => {
  return (
    <div className="card sector-card-layout">
      <div className="card-header">
        <PieChart className="icon-blue" />
        <h2>Sector Performance</h2>
      </div>
      <div className="card-body">
        <div className="sector-list">
          <div className="sector-item">
            <span className="sector-name">Technology</span>
            <span className="sector-value positive">+2.4%</span>
          </div>
          <div className="sector-item">
            <span className="sector-name">Healthcare</span>
            <span className="sector-value negative">-0.5%</span>
          </div>
          <div className="sector-item">
            <span className="sector-name">Finance</span>
            <span className="sector-value positive">+1.2%</span>
          </div>
        </div>
        <div className="quick-insight">
          <Zap size={14} />
          <span>Tech sector leading current recovery</span>
        </div>
      </div>
    </div>
  );
};

export default SectorCard;
