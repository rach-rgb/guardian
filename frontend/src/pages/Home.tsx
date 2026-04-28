import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Settings, User } from 'lucide-react';
import RiskCard from '../components/home/RiskCard';
import SectorCard from '../components/home/SectorCard';
import StockCard from '../components/home/StockCard';
import SettingsModal from '../components/home/SettingsModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userName, setUserName] = useState('');

  const voiceIntent = location.state?.voiceIntent;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:8000/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.user_name) setUserName(data.user_name);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, [refreshKey]);

  const handleSettingsSaved = () => {
    setIsSettingsOpen(false);
    setRefreshKey(prev => prev + 1); // Trigger re-fetch in children
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
                gap: '0.5rem', 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                background: 'rgba(255,255,255,0.05)', 
                padding: '0.5rem 1.25rem', 
                borderRadius: '2rem', 
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}>
                <User size={16} style={{ color: '#38bdf8' }} />
                <span>{userName}</span>
              </div>
            )}
          </div>
          <h1 style={{ flex: 'none', margin: 0 }}>Guardian Dashboard</h1>
          <div style={{ flex: 1 }}></div>
        </div>
      </header>

      <main className="content">
        <div className="home-grid">
          <div className="risk-card-layout">
            <RiskCard key={`risk-${refreshKey}`} />
          </div>
          <div className="sector-card-layout">
            <SectorCard key={`sector-${refreshKey}`} />
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
