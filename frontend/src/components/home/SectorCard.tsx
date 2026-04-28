import React, { useEffect, useState } from 'react';
import { PieChart, Zap, RefreshCcw, AlertCircle } from 'lucide-react';

interface SectorInfo {
  name: string;
  change: number;
}

interface SectorResponse {
  sectors: SectorInfo[];
  insight: string;
}

const SectorCard: React.FC = () => {
  const [data, setData] = useState<SectorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        const response = await fetch('http://localhost:8000/sector');
        if (!response.ok) throw new Error('Failed to fetch sector data');
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSectorData();
  }, []);

  return (
    <div className="bg-[#121215] border border-white/5 rounded-[24px] p-5 sm:p-6 lg:p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5 sm:mb-6">
        <h3 className="text-[12px] sm:text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
          <PieChart className="w-4 h-4" />
          Sector Performance
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40 py-12">
            <RefreshCcw className="w-6 h-6 animate-spin mb-4 text-[#FF4E00]" />
            <p className="text-sm font-medium tracking-wide">데이터를 연산하고 있습니다...</p>
          </div>
        ) : error || !data ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-8 h-8 text-red-500/80 mb-3" />
            <p className="text-red-400 text-sm font-medium">{error || "Failed to load"}</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {data.sectors.map((sector, idx) => {
                const isPositive = sector.change >= 0;
                return (
                  <div 
                    key={idx} 
                    className="bg-[#1A1A1E] border border-white/5 hover:border-white/20 rounded-xl p-4 transition-all duration-300 shadow-sm"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="font-bold text-sm sm:text-base text-white/90 truncate">{sector.name}</div>
                      <div className={`text-[11px] sm:text-xs font-bold font-mono px-2 py-1 rounded w-fit ${
                        isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {isPositive ? '+' : ''}{sector.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-auto bg-black/40 border border-white/5 p-4 sm:p-5 rounded-2xl flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                  AI INSIGHT
                </div>
                <div className="text-[13px] sm:text-sm text-white/90 leading-[1.6] font-medium">
                  {data.insight}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectorCard;
