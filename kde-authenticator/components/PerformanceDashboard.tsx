'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PerformanceDashboard({ username, refreshTrigger }: { username: string, refreshTrigger: number }) {
  const [kdePlot, setKdePlot] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!username) return;
    
    try {
      const res = await fetch(`${API_URL}/api/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.status === "success" && data.kde_plot) {
        setKdePlot(data.kde_plot);
      }
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [refreshTrigger, username]);

  return (
    <div className="w-full h-full border border-slate-800 bg-[#0b0f19] flex flex-col md:flex-row p-4 shadow-inner rounded-xl overflow-hidden relative">
      <div className="md:w-64 flex flex-col justify-between mb-4 md:mb-0 md:pr-6 md:border-r border-slate-800 shrink-0">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2 border-l-2 border-cyan-500 mb-2">Live KDE Model</p>
          <p className="text-[9px] text-slate-500 tracking-wide mt-2">
            Real-time scatter projection of your biomechanics.
          </p>
        </div>
        <button onClick={fetchMetrics} className="text-[10px] bg-slate-800/50 hover:bg-slate-700 text-slate-400 py-1.5 px-3 rounded text-center transition-colors tracking-widest uppercase font-bold mt-4 self-start">↻ Refresh</button>
      </div>

      <div className="flex-1 w-full h-full bg-[#0f172a] border border-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden group ml-0 md:ml-4">
        <div className="absolute top-3 left-3 text-[9px] text-cyan-500 font-mono opacity-80 z-10 transition-opacity bg-slate-900/60 p-1.5 rounded">
          PCA_0_X<br/>
          PCA_1_Y<br/>
        </div>
        
        {kdePlot ? (
          <img src={kdePlot} alt="KDE Cloud" className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-slate-600 text-[10px] uppercase font-bold tracking-widest animate-pulse">Scanning Bio-Signature...</div>
          </div>
        )}
      </div>
    </div>
  );
}