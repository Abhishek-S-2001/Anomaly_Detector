'use client';

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
  cSub: Record<string, number> | null;
  eSub: Record<string, number> | null;
  rawLogDensity: number | null;
}

function Row({ label, value, unit = '', color = 'text-slate-300' }: {
  label: string; value: string | number; unit?: string; color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-800/40 last:border-0">
      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold truncate mr-2">{label}</span>
      <span className={`font-mono text-[10px] font-bold shrink-0 ${color}`}>
        {value}{unit}
      </span>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800/80 overflow-hidden bg-slate-900/20">
      <div className={`px-2 py-1 text-[8px] font-bold uppercase tracking-widest ${color} bg-slate-900/60 border-b border-slate-800`}>
        {title}
      </div>
      <div className="px-2 py-1 space-y-0">
        {children}
      </div>
    </div>
  );
}

export default function CalcPanel({ risk, bDetail, cSub, eSub, rawLogDensity }: CalcPanelProps) {
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

  return (
    <div className="w-full h-full border border-slate-800 bg-[#0b0f19] rounded-xl p-2 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2 border-l-2 border-yellow-500 shrink-0 mb-1">
        Live Calculations
      </p>

      {/* ── B(t) ── */}
      <Section title="Behavioural B(t)" color="text-blue-400">
        <Row label="KDE Density" value={bDetail.log_density.toFixed(2)} color="text-cyan-300" />
        <Row label="Threshold" value={bDetail.threshold.toFixed(2)} color="text-cyan-300" />
        <Row label="Distance" value={bDetail.distance.toFixed(2)} color={bDetail.distance >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
        <Row label="Normalised" value={bDetail.normalised.toFixed(2)} />
        <Row label="Shift" value={bDetail.shift.toFixed(3)} />
        <Row label="B(t) Score" value={risk.b_score.toFixed(4)} color="text-blue-300" />
      </Section>

      {/* ── C(t) ── */}
      <Section title="Contextual C(t)" color="text-teal-400">
        {cSub ? (
          <>
            <Row label="Hour Dev" value={cSub.hour?.toFixed(2) ?? '—'} />
            <Row label="Geo Dev" value={cSub.geo?.toFixed(2) ?? '—'} />
            <Row label="IP Flag" value={cSub.ip?.toFixed(0) ?? '—'} />
            <Row label="Velocity" value={cSub.velocity?.toFixed(2) ?? '—'} />
            <Row label="C(t) Score" value={risk.c_score.toFixed(4)} color="text-teal-300" />
          </>
        ) : <span className="text-[8px] text-slate-600 italic">No data</span>}
      </Section>

      {/* ── E(t) ── */}
      <Section title="Environmental E(t)" color="text-purple-400">
        {eSub ? (
          <>
            <Row label="Device Hash" value={eSub.device?.toFixed(2) ?? '—'} />
            <Row label="UA Match" value={eSub.ua?.toFixed(2) ?? '—'} />
            <Row label="Network" value={eSub.network?.toFixed(2) ?? '—'} />
            <Row label="VPN" value={eSub.vpn?.toFixed(0) ?? '—'} />
            <Row label="E(t) Score" value={risk.e_score.toFixed(4)} color="text-purple-300" />
          </>
        ) : <span className="text-[8px] text-slate-600 italic">No data</span>}
      </Section>

      {/* ── R(t) aggregate ── */}
      <Section title="R(t) Aggregation" color="text-orange-400">
        <Row label="0.5 × B(t)" value={(0.5 * risk.b_score).toFixed(3)} />
        <Row label="0.3 × C(t)" value={(0.3 * risk.c_score).toFixed(3)} />
        <Row label="0.2 × E(t)" value={(0.2 * risk.e_score).toFixed(3)} />
        <Row label="R(t) Global" value={risk.r_score.toFixed(4)} color="text-orange-300" />
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

