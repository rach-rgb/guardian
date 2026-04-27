import React, { useState } from 'react';
import { X, Save, Shield, Layout, List } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [tolerance, setTolerance] = useState('medium');
  const [sector, setSector] = useState('Technology');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>User Preferences</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
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
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Energy">Energy</option>
            </select>
          </div>

          <div className="settings-section">
            <div className="section-title">
              <List size={18} />
              <span>Default Watchlist</span>
            </div>
            <div className="mock-input">NVDA, AAPL, TSLA</div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={onClose}>
            <Save size={18} />
            Save Settings
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
