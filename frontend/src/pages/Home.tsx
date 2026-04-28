import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Settings, User, Moon } from 'lucide-react';
import RiskCard from '../components/home/RiskCard';
import SectorCard from '../components/home/SectorCard';
import StockCard from '../components/home/StockCard';
import SettingsModal from '../components/home/SettingsModal';

const SECTOR_NAMES: Record<string, string> = {
  "ai_bigtech": "AI / 빅테크 (AI/Big Tech)",
  "semiconductors": "반도체 (Semiconductors)",
  "high_dividend": "고배당 / 인컴 (Dividend/Income)",
  "defense": "방산 / 우주 (Defense/Space)",
  "energy": "에너지 / 자원 (Energy)",
  "healthcare": "헬스케어 (Healthcare)"
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userName, setUserName] = useState('');

  const voiceIntent = location.state?.voiceIntent;

  const [settings, setSettings] = useState<any>(null);

  const loadSettings = async () => {
    try {
      const res = await fetch('http://localhost:8000/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.user_name) setUserName(data.user_name);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [refreshKey]);

  const handleSettingsSaved = () => {
    setIsSettingsOpen(false);
    window.location.reload(); // Trigger a hard refresh to reload settings and all components
  };

  return (
    <div className="page-container">
      <header className="premium-header">
        <div className="header-top" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="icon-btn" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={24} />
            </button>
            {userName && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                background: 'rgba(255,255,255,0.05)', 
                padding: '0.4rem 1rem', 
                borderRadius: '2rem', 
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}>
                <User size={15} style={{ color: '#38bdf8' }} />
                <span>{userName}님</span>
              </div>
            )}
          </div>
          <h1 style={{ flex: 'none', margin: 0 }}>Guardian Dashboard</h1>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="icon-btn" onClick={() => navigate('/ambient')} title="Go to Ambient Mode">
              <Moon size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="home-grid">
          <div className="risk-card-layout">
            <RiskCard key={`risk-${refreshKey}`} />
          </div>
          <div className="sector-card-layout">
            <SectorCard 
              key={`sector-${refreshKey}`} 
              sectorGroupName={settings?.preferred_sector ? SECTOR_NAMES[settings.preferred_sector] : undefined}
            />
          </div>
          <div className="stock-card-layout">
            <StockCard key={`stock-${refreshKey}`} initialVoiceIntent={voiceIntent} />
          </div>
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSaved={handleSettingsSaved}
      />
    </div>
  );
};

export default Home;
