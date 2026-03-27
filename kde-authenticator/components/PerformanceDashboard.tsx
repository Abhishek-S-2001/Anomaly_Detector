'use client';

import { useEffect, useState } from 'react';

export default function PerformanceDashboard({ refreshTrigger }: { refreshTrigger: number }) {
  const [metrics, setMetrics] = useState({
    auth_rate: 0.0,
    blocked_rate: 0.0,
    kde_plot: null as string | null,
    roc_plot: null as string | null,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin_user" })
      });
      const data = await res.json();
      if (data.status === "success") {
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch metrics on mount
  useEffect(() => {
    fetchMetrics();
    // We removed the setInterval. It will now instantly update via the refreshTrigger!
  }, [refreshTrigger]);

  return (
    <div className="pt-8 border-t border-slate-800 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tighter uppercase">System Performance Dashboard</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Real-Time Inference and Model Accuracy Telemetry</p>
        </div>
        <div className="hidden md:block px-3 py-1 border border-slate-700 text-[10px] text-slate-400 font-bold tracking-widest uppercase rounded">
          Engine_V4.2.0_Stable
        </div>
      </div>

      <div className="w-[1400px] grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric Cards */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
          <div className="bg-[#111827] border-l-2 border-cyan-400 p-6 rounded shadow-lg flex flex-col justify-between h-40">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Genuine Auth Rate</p>
            <div>
              <span className="text-4xl font-bold text-white">{loading ? '--' : metrics.auth_rate}</span>
              <span className="text-cyan-400 text-sm ml-1 font-bold">%</span>
            </div>
            <p className="text-xs text-cyan-400">BASED ON RECENT LOGS</p>
          </div>

          <div className="bg-[#111827] border-l-2 border-cyan-400 p-6 rounded shadow-lg flex flex-col justify-between h-40">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Impostor Blocked Rate</p>
            <div>
              <span className="text-4xl font-bold text-white">{loading ? '--' : metrics.blocked_rate}</span>
              <span className="text-cyan-400 text-sm ml-1 font-bold">%</span>
            </div>
            <p className="text-xs text-slate-500">DYNAMIC TELEMETRY</p>
          </div>

          {/* ROC Curve Component */}

          <div className="col-span-2 bg-[#111827] border border-slate-800 p-6 rounded shadow-lg h-96 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 z-10">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ROC Curve Performance</p>
            </div>
            <div className="flex-1 w-full bg-[#0f172a] border border-slate-800 rounded flex items-center justify-center text-slate-600 text-xs overflow-hidden">
              {metrics.roc_plot ? (
                <img src={metrics.roc_plot} alt="ROC Curve" className="w-full h-full object-contain" />
              ) : (
                "[ Loading ROC Curve... ]"
              )}
            </div>
          </div>
        </div>

        {/* KDE Behavioral Cloud Component */}
        <div className="col-span-1 md:col-span-2 bg-[#111827] w-3xl border border-slate-800 p-6 rounded shadow-lg h-full min-h-[600px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">KDE Behavioral Cloud</p>
            <button onClick={fetchMetrics} className="text-slate-600 hover:text-cyan-400 transition-colors">↻ REFRESH</button>
          </div>
          <div className="flex-1 w-full bg-[#0f172a] border border-slate-800 rounded flex items-center justify-center text-slate-600 text-xs relative overflow-hidden">
             <div className="absolute top-4 left-4 text-[8px] text-cyan-500 font-mono opacity-80 z-10">
               AXIS_X: PRINCIPAL_COMP_1<br/>
               AXIS_Y: PRINCIPAL_COMP_2<br/>
               KDE_BANDWIDTH: 0.25
             </div>
             {metrics.kde_plot ? (
                <img src={metrics.kde_plot} alt="KDE Cloud" className="w-full h-full object-contain" />
              ) : (
                "[ Loading KDE Cloud Scatter Plot... ]"
              )}
          </div>
        </div>
      </div>
    </div>
  );
}