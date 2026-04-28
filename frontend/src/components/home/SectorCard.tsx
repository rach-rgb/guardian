import React, { useEffect, useState } from 'react';
import { BarChart3, Zap, RefreshCcw, AlertCircle } from 'lucide-react';

interface SectorInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  status: string;
  score: number;
}

interface SectorResponse {
  sectors: SectorInfo[];
  insight: string;
}

const SectorCard: React.FC = () => {
  const [data, setData] = useState<SectorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        const response = await fetch('http://localhost:8000/sector');
        if (!response.ok) throw new Error('Failed to fetch sector data');
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSectorData();
  }, []);

  return (
    <div className="sector-main-container">
      <div className="sector-main-header">
        <h3 className="sector-main-title">
          <BarChart3 size={16} />
          핵심 모니터링 그룹 {data?.sectors && `(${data.sectors.length}/${data.sectors.length})`}
        </h3>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem 0' }}>
            <RefreshCcw size={24} className="pulse" style={{ marginBottom: '1rem', color: '#FF4E00' }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.05em' }}>데이터를 연산하고 있습니다...</p>
          </div>
        ) : error || !data ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
            <AlertCircle size={32} style={{ color: 'rgba(239,68,68,0.8)', marginBottom: '0.75rem' }} />
            <p style={{ color: '#f87171', fontSize: '0.875rem', fontWeight: 500 }}>{error || "Failed to load"}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="sector-mini-grid">
              {data.sectors.map((sector, idx) => {
                const isPositive = sector.change >= 0;
                let statusColor = "#22C55E"; // 안전 (emerald)
                if (sector.status === "위험") statusColor = "#EF4444"; // 위험 (red)
                else if (sector.status === "경계") statusColor = "#EAB308"; // 경계 (amber)

                return (
                  <div key={idx} className="sector-mini-card">
                    <div className="sector-mini-header">
                      <div className="sector-mini-symbol">{sector.symbol}</div>
                      <div className={`sector-mini-change ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : ''}{sector.change.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className="sector-mini-footer">
                      <div className="sector-mini-price">${sector.price.toFixed(2)}</div>
                      <div className="sector-mini-status" style={{ color: statusColor }}>
                        {sector.status} <span style={{ fontFamily: 'monospace' }}>{sector.score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="sector-insight-box">
              <Zap size={20} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="sector-insight-title">AI INSIGHT</div>
                <div className="sector-insight-text">{data.insight}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectorCard;
