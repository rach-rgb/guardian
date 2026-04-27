import React from 'react';
import { useNavigate } from 'react-router-dom';

const Ambient: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="ambient-container" onClick={() => navigate('/')}>
      <div className="glitter-background"></div>
      <div className="ambient-content">
        <h2 className="fade-in">Market is Calm</h2>
        <p className="pulse">Click anywhere to enter Dashboard</p>
      </div>
    </div>
  );
};

export default Ambient;
