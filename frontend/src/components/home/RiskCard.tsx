import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Shield, Activity, BarChart2, AlertOctagon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RiskData {
  status: string;
  date: string;
  regime: string;
  risk_level: string;
  final_dsri_score: number;
  guardian_data: string;
  factor_scores: {
    volatility: number;
    momentum: number;
    breadth: number;
    liquidity: number;
    credit: number;
    macro: number;
  };
  raw_vix: number;
}

const RiskCard: React.FC = () => {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAlerted, setHasAlerted] = useState<boolean>(false);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const response = await fetch('http://localhost:8000/risk');
        if (!response.ok) {
          throw new Error('Failed to fetch risk data');
        }
        const result: RiskData = await response.json();
        setData(result);
        
        // 3.4 Risk 가 Limit 이상일 때 알림 (Limit: 71)
        if (result.final_dsri_score >= 71 && !hasAlerted) {
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
      <div className="card risk-card-layout">
        <div className="card-header">
          <Activity className="icon-blue animate-pulse" />
          <h2>Market Risk Analysis</h2>
        </div>
        <div className="card-body flex items-center justify-center p-8">
          <p className="text-gray-400">데이터를 분석 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card risk-card-layout">
        <div className="card-header">
          <AlertOctagon className="icon-red" />
          <h2>Market Risk Analysis</h2>
        </div>
        <div className="card-body flex items-center justify-center p-8">
          <p className="text-red-400">오류 발생: {error}</p>
        </div>
      </div>
    );
  }

  const isHighRisk = data.final_dsri_score >= 71;
  const isMediumRisk = data.final_dsri_score >= 31 && data.final_dsri_score < 71;

  return (
    <div className={`card risk-card-layout ${isHighRisk ? 'border-red-500/50' : ''}`}>
      <div className="card-header">
        {isHighRisk ? <AlertTriangle className="icon-red" /> : <Shield className="icon-green" />}
        <h2>Market Risk Analysis</h2>
      </div>
      <div className="card-body">
        <div className="placeholder-content">
          <div className={`big-number ${isHighRisk ? 'text-red-400' : isMediumRisk ? 'text-yellow-400' : 'text-green-400'}`}>
            {data.final_dsri_score.toFixed(1)}
          </div>
          <p className="status-text">{data.risk_level}</p>
        </div>
        <div className="metrics-list grid grid-cols-2 gap-4 my-4">
          <div className="metric-item">
            <TrendingUp size={16} className="text-gray-400" />
            <span className="text-sm">VIX: {data.raw_vix.toFixed(2)}</span>
          </div>
          <div className="metric-item">
            <BarChart2 size={16} className="text-gray-400" />
            <span className="text-sm">Regime: {data.regime}</span>
          </div>
        </div>
        
        <div className="risk-factors grid grid-cols-3 gap-2 my-4 text-xs">
          <div className="p-2 bg-gray-800/50 rounded text-center">
            <div className="text-gray-400 mb-1">Vol</div>
            <div className="font-mono">{data.factor_scores.volatility}</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded text-center">
            <div className="text-gray-400 mb-1">Mom</div>
            <div className="font-mono">{data.factor_scores.momentum}</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded text-center">
            <div className="text-gray-400 mb-1">Liq</div>
            <div className="font-mono">{data.factor_scores.liquidity}</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded text-center">
            <div className="text-gray-400 mb-1">Brdth</div>
            <div className="font-mono">{data.factor_scores.breadth}</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded text-center">
            <div className="text-gray-400 mb-1">Cred</div>
            <div className="font-mono">{data.factor_scores.credit}</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded text-center">
            <div className="text-gray-400 mb-1">Macro</div>
            <div className="font-mono">{data.factor_scores.macro}</div>
          </div>
        </div>

        <div className="guardian-message mt-4 p-4 bg-blue-900/10 rounded-lg border border-blue-500/20 text-sm overflow-y-auto max-h-48">
          <ReactMarkdown>
            {data.guardian_data}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default RiskCard;
