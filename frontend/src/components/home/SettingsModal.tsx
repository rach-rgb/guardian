import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Layout, List, Power, User } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [userName, setUserName] = useState('Guardian User');
  const [tolerance, setTolerance] = useState('medium');
  const [sector, setSector] = useState('Technology');
  const [watchlistStr, setWatchlistStr] = useState('NVDA, AAPL');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch settings when modal opens
      fetch('http://localhost:8000/settings')
        .then(res => res.json())
        .then(data => {
          setUserName(data.user_name || 'Guardian User');
          setTolerance(data.risk_tolerance);
          setSector(data.preferred_sector);
          setWatchlistStr(data.watchlist.join(', '));
        })
        .catch(err => console.error("Failed to load settings", err));
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    const watchlist = watchlistStr.split(',').map(s => s.trim()).filter(s => s);
    
    try {
      const response = await fetch('http://localhost:8000/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_name: userName,
          risk_tolerance: tolerance,
          preferred_sector: sector,
          watchlist: watchlist
        })
      });
      
      if (response.ok) {
        if (onSaved) onSaved();
        else onClose();
      } else {
        console.error("Failed to save settings");
      }
    } catch (err) {
      console.error("Error saving settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div className="modal-content" style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1.5rem', width: '90%', maxWidth: '500px', boxShadow: '0 8px 32px 0 rgba( 0, 0, 0, 0.37 )', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
        <header className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>User Preferences</h2>
          <button className="close-btn" onClick={onClose} disabled={isLoading} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'color 0.2s ease' }}>
            <X size={20} />
          </button>
        </header>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="settings-section">
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <User size={18} />
              <span>User Name</span>
            </div>
            <input 
              type="text" 
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g., John Doe"
            />
          </div>
          <div className="settings-section">
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <Shield size={18} />
              <span>Risk Tolerance</span>
            </div>
            <div className="radio-group" style={{ display: 'flex', gap: '0.75rem' }}>
              {['low', 'medium', 'high'].map((t) => (
                <label key={t} className={`radio-label ${tolerance === t ? 'active' : ''}`} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: tolerance === t ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)', 
                    border: `1px solid ${tolerance === t ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`, 
                    borderRadius: '0.5rem', 
                    padding: '0.5rem 1rem', 
                    cursor: 'pointer', 
                    color: tolerance === t ? '#38bdf8' : 'rgba(255,255,255,0.7)',
                    fontWeight: 500,
                    fontSize: '0.9rem'
                }}>
                  <input 
                    type="radio" 
                    name="tolerance" 
                    value={t} 
                    checked={tolerance === t}
                    onChange={(e) => setTolerance(e.target.value)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <Layout size={18} />
              <span>Preferred Sector</span>
            </div>
            <select 
              className="settings-select"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.9rem',
                fontWeight: 500,
                appearance: 'none', // Remove default arrow
                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22white%22%20d%3D%22M287%20197.9c-3.6%203.6-8.3%205.4-13%205.4s-9.4-1.8-13-5.4L146.2%2099.9l-114.8%2098c-3.6%203.6-8.3%205.4-13%205.4s-9.4-1.8-13-5.4c-7.3-7.3-7.3-19.1%200-26.4L133.2%2066.6c3.6-3.6%208.3-5.4%2013-5.4s9.4%201.8%2013%205.4l133.8%20114.8c7.3%207.3%207.3%2019.1%200%2026.4z%22%2F%3E%3C%2Fsvg%3E")', // Custom arrow
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '0.75rem',
              }}
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              <option value="ai_bigtech">1. AI / 빅테크 (AI / Big Tech)</option>
              <option value="semiconductors">2. 반도체 (Semiconductors)</option>
              <option value="high_dividend">3. 고배당 / 인컴 (High Dividend / Income)</option>
              <option value="defense">4. 방산 / 우주 (Defense / Aerospace)</option>
              <option value="energy">5. 에너지 / 자원 (Energy / Resources)</option>
              <option value="healthcare">6. 헬스케어 (Healthcare)</option>
            </select>
          </div>

          <div className="settings-section">
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <List size={18} />
              <span>Default Watchlist</span>
            </div>
            <input 
              type="text" 
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.9)',
                marginTop: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
              value={watchlistStr}
              onChange={(e) => setWatchlistStr(e.target.value)}
              placeholder="e.g., NVDA, AAPL, TSLA"
            />
          </div>

        </div>

        <footer className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', gap: '1rem' }}>
          <button className="cancel-btn" onClick={onClose} disabled={isLoading} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontWeight: 500, transition: 'all 0.2s ease' }}>Cancel</button>
          <button className="save-btn" onClick={handleSave} disabled={isLoading} style={{ background: '#38bdf8', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#000', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease' }}>
            <Save size={18} />
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
