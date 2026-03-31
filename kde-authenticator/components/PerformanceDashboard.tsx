'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PerformanceDashboard({ userID, refreshTrigger }: { userID: string, refreshTrigger: number }) {
  const [kdePlot, setKdePlot] = useState<string | null>(null);
  const { theme } = useTheme();

  const fetchMetrics = async () => {
    if (!userID) return;

    try {
      const res = await fetch(`${API_URL}/api/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userID, theme })
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
  }, [refreshTrigger, userID, theme]);

  return (
    <div className="w-full h-full border-0 bg-[#0b0f19] flex flex-col overflow-hidden relative">

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-row justify-between items-center px-3 py-2 shrink-0 border-b border-slate-800/60">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2 border-l-2 border-cyan-500">
            Live KDE Model
          </p>
          <p className="text-[9px] text-slate-500 tracking-wide pl-2 mt-0.5">
            Real-time scatter projection of your biomechanics.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="text-[10px] bg-slate-800/50 hover:bg-slate-700 text-slate-400 py-1 px-3 rounded transition-colors tracking-widest uppercase font-bold shrink-0"
        >
          ↻ Refresh
        </button>
      </div>

      {/* --- PLOT SECTION --- */}
      <div className="flex-1 min-h-0 w-full bg-[#0f172a] relative overflow-hidden group">
        <div className="absolute top-2 left-2 text-[9px] text-cyan-500 font-mono opacity-80 z-10 bg-slate-900/60 p-1 rounded">
          PCA_0_X<br />
          PCA_1_Y
        </div>

        {kdePlot ? (
          <img
            src={kdePlot}
            alt="KDE Cloud"
            className="w-full h-full object-fill opacity-90 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-slate-600 text-[10px] uppercase font-bold tracking-widest animate-pulse">
              Scanning Bio-Signature...
            </div>
          </div>
        )}
      </div>

    </div>
  );
}