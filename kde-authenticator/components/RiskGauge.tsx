'use client';

import { useMemo } from 'react';

export interface RiskData {
  b_score: number;
  c_score: number;
  e_score: number;
  r_score: number;
  decision: 'allow' | 'mfa' | 'block';
}

interface Props {
  risk: RiskData | null;
}

function ArcPath({ value, color, radius, strokeWidth, dashOffset }: {
  value: number; color: string; radius: number; strokeWidth: number; dashOffset: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270° arc
  const fill = arc * Math.max(0, Math.min(1, value));
  return (
    <circle
      cx="60" cy="60" r={radius}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={`${fill} ${circumference - fill}`}
      strokeDashoffset={dashOffset}
      strokeLinecap="round"
      style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
    />
  );
}

function riskColor(v: number): string {
  if (v < 0.35) return '#4ade80';
  if (v < 0.70) return '#fbbf24';
  return '#ef4444';
}

function SubBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 w-5">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[9px] font-mono text-slate-400 w-6 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export default function RiskGauge({ risk }: Props) {
  // Arc math: SVG viewBox 0 0 120 120, centre 60,60
  // 0.75 of circumference = 270° arc starting at 135° (bottom-left)
  const BASE_DASHOFFSET = useMemo(() => {
    // Start angle = 225° from 3-o'clock = 135° from 12-o'clock
    // strokeDashoffset to start at bottom-left: circumference * (1 - 0.375)
    const r36 = 2 * Math.PI * 36;
    return r36 * (1 - 0.375);
  }, []);

  const r36Offset = 2 * Math.PI * 36 * (1 - 0.375);
  const r28Offset = 2 * Math.PI * 28 * (1 - 0.375);
  const r21Offset = 2 * Math.PI * 21 * (1 - 0.375);

  const r = risk?.r_score ?? 0;
  const b = risk?.b_score ?? 0;
  const c = risk?.c_score ?? 0;
  const e = risk?.e_score ?? 0;

  const decisionConfig = {
    allow: { label: 'Trusted', color: '#4ade80', bg: 'bg-emerald-900/30 border-emerald-700/50' },
    mfa:   { label: 'MFA Prompt', color: '#fbbf24', bg: 'bg-amber-900/30 border-amber-700/50' },
    block: { label: 'Block', color: '#ef4444', bg: 'bg-rose-900/30 border-rose-700/50' },
  }[risk?.decision ?? 'allow'];

  return (
    <div className="relative w-full h-full flex flex-col gap-3">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2 border-l-2 border-purple-500">
        Risk Engine — R(t)
      </p>

      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        {/* Top: Decision Badge */}
        <div className={`text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded border ${decisionConfig.bg}`}
          style={{ color: decisionConfig.color }}>
          {decisionConfig.label}
        </div>

        {/* Arc gauge */}
        <div className="relative shrink-0 w-[180px] h-[135px]">
          <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
            {/* Track rings */}
            {[36, 28, 21].map((r_) => (
              <circle key={r_} cx="60" cy="60" r={r_} fill="none"
                className="stroke-slate-800" strokeWidth={6}
                strokeDasharray={`${2 * Math.PI * r_ * 0.75} ${2 * Math.PI * r_ * 0.25}`}
                strokeDashoffset={2 * Math.PI * r_ * (1 - 0.375)}
                strokeLinecap="round"
              />
            ))}
            {/* R(t) — outer ring */}
            <ArcPath value={r} color={riskColor(r)}       radius={36} strokeWidth={6} dashOffset={r36Offset} />
            {/* B(t) — mid ring */}
            <ArcPath value={b} color={riskColor(b)}       radius={28} strokeWidth={6} dashOffset={r28Offset} />
            {/* C(t) + E(t) — inner ring (avg) */}
            <ArcPath value={(c + e) / 2} color={riskColor((c + e) / 2)} radius={21} strokeWidth={6} dashOffset={r21Offset} />

            {/* Center score */}
            <text x="60" y="56" textAnchor="middle" dominantBaseline="middle"
              className="font-mono" fontSize="16" fontWeight="bold"
              fill={riskColor(r)}>
              {(r * 100).toFixed(0)}
            </text>
            <text x="60" y="69" textAnchor="middle" fontSize="6.5" className="fill-slate-500" fontWeight="500">
              RISK %
            </text>
          </svg>
        </div>

        {/* Legend / Definition */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-auto pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: riskColor(r) }}></div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">R(t) <span className="text-slate-600 font-normal ml-0.5">Composite</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: riskColor(b) }}></div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">B(t) <span className="text-slate-600 font-normal ml-0.5">Behavioral</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: riskColor((c + e) / 2) }}></div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">C+E <span className="text-slate-600 font-normal ml-0.5">Context</span></span>
          </div>
        </div>
      </div>

      {!risk && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center">
          <span className="text-[8px] text-slate-700 uppercase tracking-widest">Start typing to authenticate…</span>
        </div>
      )}
    </div>
  );
}
