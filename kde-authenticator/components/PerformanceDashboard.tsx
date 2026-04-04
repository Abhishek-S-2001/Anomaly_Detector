'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import RiskGauge, { RiskData } from '@/components/RiskGauge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface MetricsData {
  status:         string;
  auth_rate:      number;
  blocked_rate:   number;
  total_attempts: number;
  kde_plot:       string | null;
  roc_plot:       string | null;
  // KDE
  accuracy_kde:  number | null;
  far_kde:       number | null;
  frr_kde:       number | null;
  eer_kde:       number | null;
  auc_kde:       number | null;
  // Baseline
  accuracy_baseline: number | null;
  far_baseline:      number | null;
  frr_baseline:      number | null;
  eer_baseline:      number | null;
  auc_baseline:      number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type WinDir = 'high' | 'low'; // 'high' = bigger is better, 'low' = smaller is better

function compareWin(kde: number | null, base: number | null, dir: WinDir): 'kde' | 'base' | 'tie' | 'none' {
  if (kde == null || base == null) return 'none';
  const diff = kde - base;
  if (Math.abs(diff) < 0.01) return 'tie';
  if (dir === 'high') return diff > 0 ? 'kde' : 'base';
  return diff < 0 ? 'kde' : 'base';
}

function MetricCard({
  label, unit, kde, base, dir, desc,
}: {
  label: string; unit: string; kde: number | null; base: number | null;
  dir: WinDir; desc: string;
}) {
  const winner = compareWin(kde, base, dir);
  const fmtVal = (v: number | null) =>
    v == null ? '—' : `${v.toFixed(dir === 'high' && label === 'AUC' ? 3 : 1)}${unit}`;

  const kdeWins  = winner === 'kde';
  const baseWins = winner === 'base';

  return (
    <div className="flex flex-col p-2.5 rounded-lg border border-slate-800/40 bg-[#0a0d14] relative overflow-hidden group hover:border-cyan-900/50 transition-colors">
      <div className="mb-2">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{label}</p>
        <p className="text-[8px] text-slate-500 leading-tight mt-0.5">{desc}</p>
      </div>
      <div className="flex justify-between items-end mt-auto pt-1">
        <div className="flex flex-col">
          <span className="text-[8px] text-cyan-700 font-bold tracking-widest uppercase mb-0.5">KDE</span>
          <div className={`text-left text-[14px] font-mono font-bold leading-none ${kdeWins ? 'text-emerald-400' : baseWins ? 'text-rose-400' : 'text-slate-400'}`}>
            {fmtVal(kde)} {kdeWins && <span className="text-[9px]">▲</span>}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] text-amber-700 font-bold tracking-widest uppercase mb-0.5">Base</span>
          <div className={`text-right text-[12px] font-mono font-bold leading-none ${baseWins ? 'text-amber-400' : kde != null && kde !== base ? 'text-slate-500' : 'text-slate-400'}`}>
            {fmtVal(base)} {baseWins && <span className="text-[9px]">▲</span>}
          </div>
        </div>
      </div>
      {/* subtle winner glow */}
      {kdeWins && <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 blur-xl rounded-full" />}
      {baseWins && <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 blur-xl rounded-full" />}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PerformanceDashboard({ userID, refreshTrigger, risk }: { userID: string; refreshTrigger: number; risk: RiskData | null }) {
  const [data, setData]     = useState<MetricsData | null>(null);
  const [tab, setTab]       = useState<'kde' | 'roc'>('kde');
  const { theme }           = useTheme();

  const fetchMetrics = async () => {
    if (!userID) return;
    try {
      const res  = await fetch(`${API_URL}/api/metrics`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: userID, theme }),
      });
      const json = await res.json();
      if (json.status === "success" || json.status === "uncalibrated") setData(json);
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    }
  };

  useEffect(() => { fetchMetrics(); }, [refreshTrigger, userID, theme]);

  const hasMetrics = data?.accuracy_kde != null || data?.accuracy_baseline != null;

  return (
    <div className="w-full h-full border-0 bg-[#0b0f19] flex flex-col overflow-hidden relative">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-row justify-between items-center px-4 py-3 shrink-0 border-b border-slate-800/60">
        <div>
          <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest pl-2 border-l-2 border-cyan-500 flex items-center gap-2">
            Authentication Engine
            <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-900/30 text-cyan-400 font-mono tracking-wider">LIVE</span>
          </p>
          <p className="text-[9px] text-slate-500 tracking-wide pl-2 mt-1">
            Real-time Risk Assessment &amp; Density Probability Mapping
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right pr-3 border-r border-slate-800">
             <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Total Attempts</span>
             <span className="text-[11px] font-mono text-slate-300 font-bold">{data?.total_attempts || 0}</span>
          </div>
          <div className="flex flex-col text-right pr-3 border-r border-slate-800">
             <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest text-emerald-500/70">Auth Rate</span>
             <span className="text-[11px] font-mono text-emerald-400 font-bold">{data?.auth_rate || 0}%</span>
          </div>
          <div className="flex flex-col text-right">
             <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest text-rose-500/70">Block Rate</span>
             <span className="text-[11px] font-mono text-rose-400 font-bold">{data?.blocked_rate || 0}%</span>
          </div>
        </div>
      </div>

      {/* ── Top Half: Split Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-row min-h-0 border-b border-slate-800/60">
        
        {/* Left: Risk Engine Gauge */}
        <div className="w-[30%] min-w-[280px] shrink-0 border-r border-slate-800/60 p-4 bg-[#0a0d14]">
          <RiskGauge risk={risk} />
        </div>

        {/* Right: Map Area */}
        <div className="flex-1 min-w-0 bg-[#0f172a] relative overflow-hidden group">
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            <div className="flex text-[9px] font-bold uppercase tracking-widest rounded bg-[#0b0f19]/80 backdrop-blur border border-slate-700/60 p-0.5 shadow-lg">
              <button onClick={() => setTab('kde')} className={`px-2.5 py-1 rounded transition-colors ${tab === 'kde' ? 'bg-cyan-700/40 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>KDE Scatter</button>
              <button onClick={() => setTab('roc')} className={`px-2.5 py-1 rounded transition-colors ${tab === 'roc' ? 'bg-cyan-700/40 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>ROC Curve</button>
            </div>
            <button onClick={fetchMetrics} className="w-6 h-6 flex items-center justify-center bg-[#0b0f19]/80 border border-slate-700/60 rounded text-slate-400 hover:text-white transition-colors">↻</button>
          </div>

          <div className="absolute top-2 left-2 text-[9px] text-cyan-500 font-mono opacity-80 z-10 bg-slate-900/60 p-1 rounded">
            {tab === 'kde' ? <>PCA_0_X<br />PCA_1_Y</> : 'FPR vs TPR'}
          </div>

          {tab === 'kde' ? (
            data?.kde_plot ? (
              <img src={data.kde_plot} alt="KDE Cloud" className="w-full h-full object-fill opacity-90 group-hover:opacity-100 transition-opacity" />
            ) : <PlotSpinner label="Loading scatter plot…" />
          ) : (
            data?.roc_plot ? (
              <img src={data.roc_plot} alt="ROC Curve" className="w-full h-full object-fill opacity-90 group-hover:opacity-100 transition-opacity" />
            ) : <PlotSpinner label="ROC available after impostor attempts" sub="Use Simulate Impostor toggle, then type" />
          )}
        </div>
      </div>

      {/* ── Bottom Half: Metrics Cards ─────────────────────────────────────── */}
      <div className="shrink-0 bg-[#0b0f19] px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Model Efficiency Comparison</p>
          <div className="flex gap-3 text-[9px] font-bold uppercase tracking-widest">
             <span className="text-emerald-400">▲ KDE Leader</span>
             <span className="text-amber-500">▲ Euclidean Baseline Leader</span>
          </div>
        </div>

        {hasMetrics ? (
          <div className="grid grid-cols-5 gap-3">
            <MetricCard label="Accuracy" unit="%" kde={data?.accuracy_kde ?? null} base={data?.accuracy_baseline ?? null} dir="high" desc="True assertions" />
            <MetricCard label="FAR"      unit="%" kde={data?.far_kde ?? null}      base={data?.far_baseline ?? null}      dir="low"  desc="False Impostor Accept" />
            <MetricCard label="FRR"      unit="%" kde={data?.frr_kde ?? null}      base={data?.frr_baseline ?? null}      dir="low"  desc="False Genuine Reject" />
            <MetricCard label="EER"      unit="%" kde={data?.eer_kde ?? null}      base={data?.eer_baseline ?? null}      dir="low"  desc="Equal Error Rate intersect" />
            <MetricCard label="AUC"      unit=""  kde={data?.auc_kde ?? null}      base={data?.auc_baseline ?? null}      dir="high" desc="ROC discriminability" />
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 border border-dashed border-slate-800 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest italic animate-pulse">
              {data?.status === 'uncalibrated' ? 'Complete calibration to unlock metrics' : 'Requires genuine & impostor samples to compute comparisons'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

function PlotSpinner({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
      <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <div className="text-slate-600 text-[9px] uppercase font-bold tracking-widest">{label}</div>
      {sub && <div className="text-slate-700 text-[8px] uppercase tracking-widest">{sub}</div>}
    </div>
  );
}