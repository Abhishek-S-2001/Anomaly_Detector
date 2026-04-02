'use client';

import { useEffect, useRef, useState } from 'react';
import { RiskData } from './RiskGauge';

interface BDetail {
  log_density: number;
  threshold: number;
  distance: number;
  normalised: number;
  shift: number;
  baseline: number;
}

interface CalcPanelProps {
  risk: RiskData | null;
  bDetail: BDetail | null;
  bHistory: number[];
  cSub: Record<string, number> | null;
  eSub: Record<string, number> | null;
  rawLogDensity: number | null;
  demoAnomalyMode: boolean;
}

function Row({ label, value, unit = '', color = 'text-slate-300', flash = false }: {
  label: string; value: string | number; unit?: string; color?: string; flash?: boolean;
}) {
  const [lit, setLit] = useState(false);
  const prev = useRef<string | number>(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setLit(true);
      const t = setTimeout(() => setLit(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={`flex items-center justify-between gap-2 py-0.5 border-b border-slate-800/40 last:border-0 rounded transition-colors duration-300 ${lit && flash ? 'bg-cyan-900/20' : ''}`}>
      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold truncate mr-2">{label}</span>
      <span className={`font-mono text-[10px] font-bold shrink-0 ${color} transition-colors duration-300`}>
        {value}{unit}
      </span>
    </div>
  );
}

function Section({ title, color, children, alert = false }: { title: string; color: string; children: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`rounded-lg border overflow-hidden bg-slate-900/20 transition-all duration-500 ${alert ? 'border-amber-600/60 shadow-[0_0_8px_rgba(217,119,6,0.2)]' : 'border-slate-800/80'}`}>
      <div className={`px-2 py-1 text-[8px] font-bold uppercase tracking-widest ${color} bg-slate-900/60 border-b ${alert ? 'border-amber-700/40' : 'border-slate-800'} flex items-center gap-1.5`}>
        {alert && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
        {title}
      </div>
      <div className="px-2 py-1 space-y-0">
        {children}
      </div>
    </div>
  );
}

/** Mini SVG sparkline for B(t) history */
function Sparkline({ data, threshold }: { data: number[]; threshold?: number }) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center h-10 text-[8px] text-slate-600 uppercase tracking-widest">
      Collecting data…
    </div>
  );

  const W = 220, H = 36, pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.001;

  const toX = (i: number) => pad + (i / (data.length - 1)) * (W - 2 * pad);
  const toY = (v: number) => H - pad - ((v - min) / range) * (H - 2 * pad);

  const pts = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  // Fill path
  const fillPts = `${toX(0)},${H} ` + data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ') + ` ${toX(data.length - 1)},${H}`;

  // Threshold line
  const thY = threshold !== undefined ? toY(Math.max(min, Math.min(max, threshold))) : null;

  // Colour last dot based on latest value vs threshold
  const latest = data[data.length - 1];
  const dotColor = threshold !== undefined
    ? (latest >= threshold ? '#4ade80' : '#ef4444')
    : '#22d3ee';

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {/* Fill */}
      <polygon points={fillPts} fill="rgba(34,211,238,0.06)" />
      {/* Line */}
      <polyline points={pts} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Threshold dashed line */}
      {thY !== null && (
        <line x1={pad} y1={thY} x2={W - pad} y2={thY}
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
      )}
      {/* Latest dot */}
      <circle cx={toX(data.length - 1)} cy={toY(latest)} r="3" fill={dotColor} />
    </svg>
  );
}

export default function CalcPanel({ risk, bDetail, bHistory, cSub, eSub, demoAnomalyMode }: CalcPanelProps) {
  if (!risk || !bDetail) {
    return (
      <div className="w-full h-full border border-slate-800 bg-[#0b0f19] rounded-xl p-3 flex flex-col gap-2">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2 border-l-2 border-yellow-500">
          Live Calculations
        </p>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] text-slate-600 uppercase tracking-widest animate-pulse">
            Awaiting data...
          </span>
        </div>
      </div>
    );
  }

  const decColor = risk.decision === 'allow' ? 'text-emerald-400'
    : risk.decision === 'mfa' ? 'text-amber-400' : 'text-rose-400';

  const cElevated = (risk.c_score ?? 0) > 0.4;
  const eElevated = (risk.e_score ?? 0) > 0.4;

  return (
    <div className="w-full h-full border border-slate-800 bg-[#0b0f19] rounded-xl p-2 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2 border-l-2 border-yellow-500 shrink-0 mb-1">
        Live Calculations
      </p>

      {/* ── Demo Anomaly Banner ── */}
      {demoAnomalyMode && (
        <div className="rounded-lg border border-amber-700/60 bg-amber-900/20 px-2 py-1.5 flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span className="text-[8px] text-amber-300 font-bold uppercase tracking-widest leading-snug">
            Spoofed signals active<br />
            <span className="text-amber-500 font-normal normal-case tracking-normal">Unknown device · VPN · 3am hour</span>
          </span>
        </div>
      )}

      {/* ── B(t) Detail ── */}
      <Section title="Behavioural B(t)" color="text-blue-400">
        <Row label="KDE Density"  value={bDetail.log_density.toFixed(2)} color="text-cyan-300" flash />
        <Row label="Threshold"    value={bDetail.threshold.toFixed(2)}   color="text-cyan-300" />
        <Row label="Distance"     value={bDetail.distance.toFixed(2)}    color={bDetail.distance >= 0 ? 'text-emerald-400' : 'text-rose-400'} flash />
        <Row label="Normalised"   value={bDetail.normalised.toFixed(2)}  flash />
        <Row label="Shift"        value={bDetail.shift.toFixed(3)}       flash />
        <Row label="B(t) Score"   value={risk.b_score.toFixed(4)}        color="text-blue-300" flash />
      </Section>

      {/* ── C(t) ── */}
      <Section title="Contextual C(t)" color={cElevated ? 'text-amber-400' : 'text-teal-400'} alert={cElevated}>
        {cSub ? (
          <>
            <Row label="Hour Dev"  value={cSub.hour?.toFixed(2)     ?? '—'} flash color={cSub.hour > 0.3 ? 'text-amber-400' : 'text-slate-300'} />
            <Row label="Geo Dev"   value={cSub.geo?.toFixed(2)      ?? '—'} flash />
            <Row label="IP Flag"   value={cSub.ip?.toFixed(0)       ?? '—'} flash color={cSub.ip > 0 ? 'text-rose-400' : 'text-slate-300'} />
            <Row label="Velocity"  value={cSub.velocity?.toFixed(2) ?? '—'} flash color={cSub.velocity > 0.5 ? 'text-amber-400' : 'text-slate-300'} />
            <Row label="C(t) Score" value={risk.c_score.toFixed(4)} color={cElevated ? 'text-amber-400' : 'text-teal-300'} flash />
          </>
        ) : <span className="text-[8px] text-slate-600 italic">No data</span>}
      </Section>

      {/* ── E(t) ── */}
      <Section title="Environmental E(t)" color={eElevated ? 'text-amber-400' : 'text-purple-400'} alert={eElevated}>
        {eSub ? (
          <>
            <Row label="Device Hash" value={eSub.device?.toFixed(2)  ?? '—'} flash color={eSub.device > 0 ? 'text-rose-400' : 'text-slate-300'} />
            <Row label="UA Match"    value={eSub.ua?.toFixed(2)       ?? '—'} flash color={eSub.ua > 0 ? 'text-rose-400' : 'text-slate-300'} />
            <Row label="Network"     value={eSub.network?.toFixed(2)  ?? '—'} flash color={eSub.network > 0 ? 'text-amber-400' : 'text-slate-300'} />
            <Row label="VPN"         value={eSub.vpn?.toFixed(0)      ?? '—'} flash color={eSub.vpn > 0 ? 'text-rose-400' : 'text-slate-300'} />
            <Row label="E(t) Score"  value={risk.e_score.toFixed(4)}          color={eElevated ? 'text-amber-400' : 'text-purple-300'} flash />
          </>
        ) : <span className="text-[8px] text-slate-600 italic">No data</span>}
      </Section>

      {/* ── R(t) aggregate ── */}
      <Section title="R(t) Aggregation" color="text-orange-400">
        <Row label="0.5 × B(t)" value={(0.5 * risk.b_score).toFixed(3)} flash />
        <Row label="0.3 × C(t)" value={(0.3 * risk.c_score).toFixed(3)} flash color={cElevated ? 'text-amber-400' : 'text-slate-300'} />
        <Row label="0.2 × E(t)" value={(0.2 * risk.e_score).toFixed(3)} flash color={eElevated ? 'text-amber-400' : 'text-slate-300'} />
        <Row label="R(t) Global" value={risk.r_score.toFixed(4)} color="text-orange-300" flash />
      </Section>

      <Section title="Final Verdict" color="text-orange-400">
        <div className="flex flex-col items-center justify-center py-4 bg-slate-900/40 rounded-b-lg">
          <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-1">Status</span>
          <span className={`text-2xl font-black tracking-tighter ${decColor}`}>
            {risk.decision.toUpperCase()}
          </span>
        </div>
      </Section>
    </div>
  );
}
