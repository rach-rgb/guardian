import React, { useState, useCallback } from 'react';
import styles from './chartAnalysis.module.css';

// 금융 용어 사전
const GLOSSARY: Record<string, string> = {
  "지지선": "주가가 하락할 때 매수세가 받쳐주는 가격대입니다.",
  "저항선": "주가가 상승할 때 매도세가 강해지는 가격대입니다.",
  "종가": "거래일 마감 시의 최종 가격으로, 추세 판단의 핵심 기준입니다.",
  "베어 트랩": "하락인 척 매도를 유도한 뒤 다시 상승하는 패턴입니다.",
  "이동평균선": "일정 기간 평균 주가를 연결해 추세를 보여주는 지표입니다.",
  "RSI": "상대강도지수. 70 이상은 과매수, 30 이하는 과매도 신호입니다.",
  "거래량": "특정 기간 동안 거래된 주식 수. 추세의 신뢰도를 판단합니다.",
  "과매수": "주가가 너무 많이 올라서 단기 조정 가능성이 높은 상태입니다.",
  "과매도": "주가가 너무 많이 내려서 단기 반등 가능성이 높은 상태입니다.",
};

// 1. 볼드 파싱: **텍스트** -> <strong>
const parseBold = (text: string) =>
  text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{part}</strong>
      : part
  );

// 2. 툴팁 컴포넌트
interface GlossaryTermProps {
  term: string;
  definition: string;
}

const GlossaryTerm: React.FC<GlossaryTermProps> = ({ term, definition }) => {
  const [visible, setVisible] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setVisible(v => !v);
    }
    if (e.key === 'Escape') setVisible(false);
  }, []);

  return (
    <span
      className={styles.term}
      role="button"
      tabIndex={0}
      aria-label={`${term}: ${definition}`}
      aria-expanded={visible}
      onClick={() => setVisible(v => !v)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onKeyDown={handleKeyDown}
      onBlur={() => setVisible(false)}
    >
      {term}
      {visible && (
        <span className={styles.tooltip} role="tooltip">
          {definition}
        </span>
      )}
    </span>
  );
};

// 3. 텍스트 파싱: 용어 감지 -> 툴팁 삽입 -> 볼드 처리
const ParsedText: React.FC<{ text: string }> = ({ text }) => {
  const keywords = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${keywords.join('|')})`, 'g');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        GLOSSARY[part]
          ? <GlossaryTerm key={i} term={part} definition={GLOSSARY[part]} />
          : <React.Fragment key={i}>{parseBold(part)}</React.Fragment>
      )}
    </span>
  );
};

// 4. 메인 카드 컴포넌트
interface ChartAnalysisProps {
  pattern_summary?: string;
  pattern_analysis?: string;
  market_sentiment?: string;
}

const ChartAnalysis: React.FC<ChartAnalysisProps> = ({ pattern_summary, pattern_analysis, market_sentiment }) => {
  if (!pattern_summary && !pattern_analysis && !market_sentiment) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>분석 결과를 불러오는 중입니다.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className={styles.card} style={{ margin: 0, borderLeft: '4px solid #38bdf8', background: 'rgba(56, 189, 248, 0.05)' }}>
        <h4 style={{ color: '#38bdf8', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '8px' }}>패턴 요약</h4>
        <p className={styles.line} style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
          <ParsedText text={pattern_summary || '분석 중...'} />
        </p>
      </div>
      
      <div className={styles.card} style={{ margin: 0, borderLeft: '4px solid #a855f7', background: 'rgba(168, 85, 247, 0.05)' }}>
        <h4 style={{ color: '#a855f7', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', paddingBottom: '8px' }}>패턴 분석</h4>
        <p className={styles.line} style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
          <ParsedText text={pattern_analysis || '분석 중...'} />
        </p>
      </div>
      
      <div className={styles.card} style={{ margin: 0, borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
        <h4 style={{ color: '#f59e0b', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', paddingBottom: '8px' }}>시장 심리</h4>
        <p className={styles.line} style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
          <ParsedText text={market_sentiment || '분석 중...'} />
        </p>
      </div>
    </div>
  );
};

export default ChartAnalysis;
