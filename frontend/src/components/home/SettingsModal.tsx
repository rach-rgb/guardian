import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Layout, List, Power } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [tolerance, setTolerance] = useState('medium');
  const [sector, setSector] = useState('Technology');
  const [watchlistStr, setWatchlistStr] = useState('NVDA, AAPL');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('isDemoMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isDemoMode', String(isDemoMode));
  }, [isDemoMode]);

  useEffect(() => {
    if (isOpen) {
      // Fetch settings when modal opens
      fetch('http://localhost:8000/settings')
        .then(res => res.json())
        .then(data => {
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>User Preferences</h2>
          <button className="close-btn" onClick={onClose} disabled={isLoading}><X size={20} /></button>
        </header>
        
        <div className="modal-body">
          <div className="settings-section">
            <div className="section-title">
              <Shield size={18} />
              <span>Risk Tolerance</span>
            </div>
            <div className="radio-group">
              {['low', 'medium', 'high'].map((t) => (
                <label key={t} className={`radio-label ${tolerance === t ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="tolerance" 
                    value={t} 
                    checked={tolerance === t}
                    onChange={(e) => setTolerance(e.target.value)}
                  />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="section-title">
              <Layout size={18} />
              <span>Preferred Sector</span>
            </div>
            <select 
              className="settings-select"
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
            <div className="section-title">
              <List size={18} />
              <span>Default Watchlist</span>
            </div>
            <input 
              type="text" 
              className="settings-input w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mt-2"
              value={watchlistStr}
              onChange={(e) => setWatchlistStr(e.target.value)}
              placeholder="e.g., NVDA, AAPL, TSLA"
            />
          </div>

          <div className="settings-section">
            <div className="section-title">
              <Power size={18} />
              <span>Auto Mode</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="demo-mode-toggle"
                checked={isDemoMode}
                onChange={(e) => setIsDemoMode(e.target.checked)}
              />
              <label htmlFor="demo-mode-toggle"></label>
            </div>
          </div>

        </div>

        <footer className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="save-btn" onClick={handleSave} disabled={isLoading}>
            <Save size={18} />
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
