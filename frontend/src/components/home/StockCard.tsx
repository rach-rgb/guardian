import React, { useState, useEffect } from 'react';
import { Search, Mic, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';
import ChartAnalysis from './ChartAnalysis';
import styles from './stockCard.module.css';

interface StockDataPoint {
  date: string;
  price: number;
}

interface StockData {
  symbol: string;
  price: number;
  change: number;
  mdd: number;
  rsi: number;
  risk_score: number;
  history: StockDataPoint[];
  description: string;
  analysis: {
    pattern_summary: string;
    pattern_analysis: string;
    market_sentiment: string;
  } | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(30, 41, 59, 0.9)', padding: '10px', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{label}</p>
        <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 'bold' }}>${payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const StockCard: React.FC = () => {
  const [ticker, setTicker] = useState<string>('SPY');
  const [searchInput, setSearchInput] = useState<string>('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [tab, setTab] = useState<'chart' | 'analysis'>('chart');
  const [showRiskDetails, setShowRiskDetails] = useState<boolean>(false);

  const fetchStockData = async (targetTicker: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://127.0.0.1:8000/stock/${targetTicker}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${targetTicker}`);
      }
      const data = await response.json();
      setStockData(data.stock);
      setTicker(data.stock.symbol);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(ticker);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchStockData(searchInput.trim().toUpperCase());
      setSearchInput('');
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('음성 인식을 지원하지 않는 브라우저입니다.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toUpperCase().replace(/\s/g, '').replace(/[^A-Z]/g, '');
      if (transcript) {
        setSearchInput(transcript);
        fetchStockData(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Safe defaults if loading or error
  const displayData = stockData || {
    symbol: ticker,
    price: 0,
    change: 0,
    mdd: 0,
    rsi: 0,
    risk_score: 0,
    history: [],
    description: '',
    analysis: null
  };

  const minPrice = displayData.history.length > 0 ? Math.min(...displayData.history.map(d => d.price)) * 0.95 : 0;
  const maxPrice = displayData.history.length > 0 ? Math.max(...displayData.history.map(d => d.price)) * 1.05 : 100;

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} color="#888" />
          <input 
            type="text" 
            placeholder="티커 검색 (예: AAPL)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="button" onClick={handleVoiceSearch} className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}>
            <Mic size={18} />
          </button>
        </div>
        <button type="submit" className={styles.searchBtn}>조회</button>
      </form>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricBox}>
          <div className={styles.label}>선택 티커</div>
          <div className={styles.value}>{displayData.symbol}</div>
        </div>
        <div className={styles.metricBox}>
          <div className={styles.label}>현재가</div>
          <div className={styles.value}>${displayData.price.toFixed(2)}</div>
        </div>
        <div className={styles.metricBox}>
          <div className={styles.label}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>고점 대비 하락</span>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>(MDD)</span>
            </div>
          </div>
          <div className={styles.value} style={{ color: '#ef4444' }}>{displayData.mdd}%</div>
        </div>
        <div className={styles.metricBox}>
          <div className={styles.label}>차트 단기 위험도</div>
          <div className={styles.value} style={{ color: displayData.risk_score < 40 ? '#10b981' : displayData.risk_score < 70 ? '#f59e0b' : '#ef4444' }}>
            {displayData.risk_score}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${tab === 'chart' ? styles.active : ''}`}
          onClick={() => setTab('chart')}
        >
          시세 차트
        </button>
        <button 
          className={`${styles.tabBtn} ${tab === 'analysis' ? styles.active : ''}`}
          onClick={() => setTab('analysis')}
        >
          차트 분석도
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>데이터 분석 중...</div>
      ) : error ? (
        <div className={styles.loadingState} style={{ color: '#ef4444' }}>{error}</div>
      ) : (
        <>
          {/* Tab Content: Chart */}
          {tab === 'chart' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className={styles.chartFull}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayData.history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <YAxis domain={[minPrice, maxPrice]} hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className={styles.smallMetrics}>
                <div className={`${styles.smBox} ${displayData.rsi > 70 ? styles.danger : displayData.rsi < 30 ? styles.safe : ''}`}>
                  RSI
                  <span>{displayData.rsi}</span>
                </div>
                <div className={`${styles.smBox}`}>
                  MDD
                  <span style={{ color: '#ef4444' }}>{displayData.mdd}%</span>
                </div>
                <div 
                  className={`${styles.smBox} ${styles.clickable}`}
                  onClick={() => setShowRiskDetails(!showRiskDetails)}
                >
                  위험지수 설명
                  <span style={{ fontSize: '14px', color: '#888', marginTop: '12px' }}>
                    상세 보기 {showRiskDetails ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {showRiskDetails && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                  <div className={styles.metricBox} style={{ minHeight: 'auto', padding: '24px', justifyContent: 'flex-start' }}>
                    <h4 style={{ color: '#38bdf8', marginBottom: '20px', fontSize: '15px', fontWeight: 'bold' }}>RSI 및 MDD 요약</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <li style={{ fontSize: '13px', color: displayData.rsi > 70 ? '#ef4444' : displayData.rsi < 30 ? '#10b981' : '#f59e0b', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', lineHeight: 1.5, wordBreak: 'keep-all', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '6px' }}>
                        {displayData.rsi > 70 ? '🚨 과매수 구간 (단기 조정 유의)' : displayData.rsi < 30 ? '✅ 과매도 구간 (단기 반등 대기)' : '📊 중립적인 수급 상태'}
                      </li>
                      <li style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-block', width: '80px', color: '#94a3b8' }}>RSI 지수:</span> 
                        <strong style={{ color: '#fff', fontSize: '16px' }}>{displayData.rsi}</strong>
                      </li>
                      <li style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-block', width: '80px', color: '#94a3b8' }}>고점 대비:</span> 
                        <strong style={{ color: '#ef4444', fontSize: '16px' }}>{displayData.mdd}%</strong>
                      </li>
                    </ul>
                  </div>
                  <div className={`${styles.metricBox}`} style={{ minHeight: 'auto', padding: '24px', justifyContent: 'flex-start' }}>
                    <h4 style={{ color: displayData.risk_score < 40 ? '#10b981' : displayData.risk_score < 70 ? '#f59e0b' : '#ef4444', marginBottom: '20px', fontSize: '15px', fontWeight: 'bold' }}>차트 단기 위험도</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <li style={{ fontSize: '13px', color: displayData.risk_score < 40 ? '#10b981' : displayData.risk_score < 70 ? '#f59e0b' : '#ef4444', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', lineHeight: 1.5, wordBreak: 'keep-all', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '6px' }}>
                        {displayData.risk_score < 40 ? '✅ 안정적인 단기 주가 흐름' : displayData.risk_score < 70 ? '⚠️ 변동성 확대 (주의 필요)' : '🚨 가격 변동폭 과열 상태!'}
                      </li>
                      <li style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-block', width: '80px', color: '#94a3b8' }}>위험도 점수:</span> 
                        <strong style={{ fontSize: '16px', color: displayData.risk_score < 40 ? '#10b981' : displayData.risk_score < 70 ? '#f59e0b' : '#ef4444' }}>{displayData.risk_score}점</strong>
                      </li>
                      <li style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginTop: '4px' }}>
                        차트 변동성, 추세 모멘텀, 수급을 종합한 수치입니다. 점수가 높을수록 현재 시장 내 가격 변동폭(Risk)이 큼을 의미합니다.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Analysis */}
          {tab === 'analysis' && (
            <div className={styles.analysisLayout}>
              <h3 className={styles.analysisHeader}>최근 180일 기준 기술적 패턴 분석</h3>
              <ChartAnalysis 
                pattern_summary={displayData.analysis?.pattern_summary}
                pattern_analysis={displayData.analysis?.pattern_analysis}
                market_sentiment={displayData.analysis?.market_sentiment}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StockCard;
