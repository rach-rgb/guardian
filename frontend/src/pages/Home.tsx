import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import RiskCard from '../components/home/RiskCard';
import SectorCard from '../components/home/SectorCard';
import StockCard from '../components/home/StockCard';
import SettingsModal from '../components/home/SettingsModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSettingsSaved = () => {
    setIsSettingsOpen(false);
    setRefreshKey(prev => prev + 1); // Trigger re-fetch in children
  };

  return (
    <div className="page-container">
      <header className="premium-header">
        <div className="header-top">
          <button className="icon-btn" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={24} />
          </button>
          <h1>Guardian Dashboard</h1>
          <div style={{ width: 44 }}></div> {/* Spacer for balance */}
        </div>
      </header>

      <main className="content">
        <div className="home-grid">
          <RiskCard key={`risk-${refreshKey}`} />
          <SectorCard />
          <StockCard />
        </div>

        <button className="secondary-btn" onClick={() => navigate('/ambient')}>
          <Bell size={18} />
          Back to Ambient Mode
        </button>
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
