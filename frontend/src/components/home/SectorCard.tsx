import React, { useEffect, useState } from 'react';
import { BarChart3, Zap, RefreshCcw, AlertTriangle } from 'lucide-react';

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

  const fetchSectorData = async () => {
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    fetchSectorData();
  }, []);

  if (loading && !data) {
    return (
      <div className="sector-main-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCcw className="pulse" size={32} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading Sector Insights...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="sector-main-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ef4444' }}>Error: {error}</div>
        <button onClick={fetchSectorData} style={{ marginTop: '1rem', background: '#38bdf8', color: '#000', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
      </div>
    );
  }
  
  if (!data) return null;

  return (
    <div className="sector-main-container" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={16} />
                    핵심 모니터링 그룹
                </div>
                <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.25rem 0.65rem', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '2rem',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.8rem',
                    fontWeight: 600
                }}>
                    {data.sectors.length} Sectors Monitored
                </div>
            </div>
            <button 
                onClick={fetchSectorData} 
                style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: '36px', 
                    height: '36px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
            <div className="sector-mini-grid" style={{ gap: '0.75rem', marginBottom: '0' }}>
            {data.sectors.map((sector, idx) => {
                const isPositive = sector.change >= 0;
                let statusColor = "#34d399";
                if (sector.status === "위험") statusColor = "#f87171";
                else if (sector.status === "경계") statusColor = "#fbbf24";

                return (
                <div key={idx} className="sector-mini-card" style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255, 0.9)' }}>{sector.symbol}</div>
                        <div style={{
                            color: isPositive ? '#34d399' : '#f87171',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums'
                        }}>
                            {isPositive ? '+' : ''}{sector.change.toFixed(2)}%
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                            ${sector.price.toFixed(2)}
                        </div>
                        <div style={{ color: statusColor, fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                             <AlertTriangle size={11} /> {sector.status} ({sector.score})
                        </div>
                    </div>
                </div>
                );
            })}
            </div>
            
            <div style={{
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '1rem', 
                padding: '1.25rem',
                display: 'flex',
                gap: '1rem',
                marginTop: 'auto'
            }}>
              <Zap size={20} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '4px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600 }}>AI INSIGHT</div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, fontWeight: 500 }}>{data.insight}</div>
              </div>
            </div>
        </div>
    </div>
  );
};

export default SectorCard;

