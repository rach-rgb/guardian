import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { RefreshCcw, Info, Lightbulb, Activity, CloudSun, CloudLightning, Sun, AlertTriangle } from 'lucide-react';

interface RiskData {
  raw_vix: number;
  regime: string;
  factor_scores: any;
  final_dsri_score: number;
  risk_level: string;
  main_cause: string;
  guardian_data: string;
}

const RiskCard: React.FC = () => {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/risk');
      if (!response.ok) {
        throw new Error('Failed to fetch risk data');
      }
      const result: RiskData = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  if (loading && !data) {
    return (
      <div className="sector-main-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCcw className="pulse" size={32} style={{ color: '#38bdf8', marginBottom: '1rem' }} />
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>Analyzing System Risk...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="sector-main-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ef4444' }}>Error: {error}</div>
        <button onClick={fetchRiskData} style={{ marginTop: '1rem', background: '#38bdf8', color: '#000', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const score = data.final_dsri_score;
  const isHighRisk = score >= 70;
  const isMediumRisk = score >= 40 && score < 70;
  
  let levelText = "안전 (SAFE)";
  let badgeColor = "#34d399";
  let badgeBg = "rgba(16, 185, 129, 0.1)";
  let badgeBorder = "rgba(16, 185, 129, 0.2)";
  let WeatherIcon = Sun;
  let weatherColor = "#34d399";

  if (isHighRisk) {
    levelText = "위험 (DANGER)";
    badgeColor = "#f87171";
    badgeBg = "rgba(239, 68, 68, 0.1)";
    badgeBorder = "rgba(239, 68, 68, 0.2)";
    WeatherIcon = CloudLightning;
    weatherColor = "#f87171";
  } else if (isMediumRisk) {
    levelText = "경계 (CAUTION)";
    badgeColor = "#fbbf24";
    badgeBg = "rgba(245, 158, 11, 0.1)";
    badgeBorder = "rgba(245, 158, 11, 0.2)";
    WeatherIcon = CloudSun;
    weatherColor = "#fbbf24";
  }

  return (
    <div className="sector-main-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontWeight: 500 }}>
            시스템 리스크 지수
          </div>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.375rem 0.75rem', 
            background: badgeBg, 
            border: `1px solid ${badgeBorder}`, 
            borderRadius: '2rem',
            color: badgeColor,
            fontSize: '0.875rem',
            fontWeight: 700
          }}>
            <AlertTriangle size={14} />
            {levelText}
          </div>
        </div>
        <button 
          onClick={fetchRiskData} 
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

      {/* Gauge Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
        <svg width="280" height="150" viewBox="0 0 200 110">
          {/* Base path for background (optional, faint arc) */}
          <path d="M 20,100 A 80,80 0 0,1 180,100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" strokeLinecap="round" />
          
          {/* Green Segment (0-33%) */}
          <path d="M 20,100 A 80,80 0 0,1 180,100" fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" 
            strokeDasharray="70.44 251.32" strokeDashoffset="0" />
            
          {/* Yellow Segment (33-66%) */}
          <path d="M 20,100 A 80,80 0 0,1 180,100" fill="none" stroke="#fbbf24" strokeWidth="16" strokeLinecap="round" 
            strokeDasharray="70.44 251.32" strokeDashoffset="-90.44" />
            
          {/* Red Segment (66-100%) */}
          <path d="M 20,100 A 80,80 0 0,1 180,100" fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round" 
            strokeDasharray="70.44 251.32" strokeDashoffset="-180.88" />
        </svg>

        {/* Center Content */}
        <div style={{ position: 'absolute', top: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <WeatherIcon size={32} style={{ color: weatherColor, marginBottom: '0.25rem' }} />
          <div style={{ 
            fontSize: '5rem', 
            fontWeight: 800, 
            lineHeight: 1, 
            color: weatherColor,
            textShadow: `0 0 25px ${weatherColor}50`,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em'
          }}>
            {score.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Bottom Information Box */}
      <div style={{ 
        background: 'rgba(0,0,0,0.3)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '1rem', 
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        marginTop: 'auto'
      }}>
        
        {/* Main Cause */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Info size={14} />
            핵심 결론 요약
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Lightbulb size={22} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '0.1rem' }} />
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fbbf24', lineHeight: 1.4 }}>
              {data.main_cause || "시장 데이터 분석 중입니다."}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', width: '100%' }}></div>

        {/* Guardian Message */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Activity size={14} />
            상세 모니터링 분석 및 시사점
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, fontWeight: 500 }}>
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <span {...props} />, // Prevent paragraph margins
                h3: () => <></>, // Hide headers if any
              }}
            >
              {data.guardian_data}
            </ReactMarkdown>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RiskCard;
