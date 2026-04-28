import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface RiskData {
  raw_vix: number;
  regime: string;
  factor_scores: {
    volatility: number;
    momentum: number;
    liquidity: number;
    breadth: number;
    credit: number;
    macro: number;
  };
  final_dsri_score: number;
  risk_level: string;
  guardian_data: string;
}

const RiskCard: React.FC = () => {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAlerted, setHasAlerted] = useState(false);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const response = await fetch('http://localhost:8000/risk');
        if (!response.ok) {
          throw new Error('Failed to fetch risk data');
        }
        const result: RiskData = await response.json();
        setData(result);
        
        // 3.4 Risk 가 Limit 이상일 때 알림 (동적 Threshold 적용)
        if (result.risk_level === '🔴 위험' && !hasAlerted) {
          alert(`[위험 경고] 현재 시장 위험 점수가 ${result.final_dsri_score}점으로 매우 높습니다. 포트폴리오 점검이 필요합니다.`);
          setHasAlerted(true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, [hasAlerted]);

  if (loading) {
    return (
      <div className="card risk-card-layout tv-risk-card bg-gray-900 flex items-center justify-center">
        <div className="tv-weather-label text-gray-500 animate-pulse">Analyzing Atmosphere...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card risk-card-layout tv-risk-card bg-gray-900 flex items-center justify-center">
        <div className="tv-weather-label text-red-500">Connection Error</div>
      </div>
    );
  }

  const isHighRisk = data.risk_level === '🔴 위험';
  const isMediumRisk = data.risk_level === '🟡 경계';

  // Determine the weather style
  let weatherClass = 'tv-risk-clear';
  let weatherText = 'CLEAR SKIES';
  let scoreClass = 'tv-clear-text';

  if (isHighRisk) {
    weatherClass = 'tv-risk-storm';
    weatherText = 'MARKET STORM';
    scoreClass = 'tv-storm-text';
  } else if (isMediumRisk) {
    weatherClass = 'tv-risk-rain';
    weatherText = 'CLOUDY VOLATILITY';
    scoreClass = 'tv-rain-text';
  }

  // Extract just the first brief sentence from guardian_data for TV display
  const summaryText = data.guardian_data.split('\n').find(line => line.trim().length > 10) || data.guardian_data;

  return (
    <div className={`card risk-card-layout tv-risk-card ${weatherClass}`}>
      <div className="tv-weather-label fade-in">
        {weatherText}
      </div>
      
      <div className={`tv-huge-score fade-in ${scoreClass}`}>
        {data.final_dsri_score.toFixed(1)}
      </div>

      <div className="tv-ai-summary fade-in">
        <ReactMarkdown
          components={{
            p: ({node, ...props}) => <span {...props} />, // Prevent paragraph margins
            h3: () => <></>, // Hide headers if any
          }}
        >
          {summaryText}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default RiskCard;
