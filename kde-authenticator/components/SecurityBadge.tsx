import React from 'react';

export type AuthStatus = 'idle' | 'analyzing' | 'success' | 'failed';

interface SecurityBadgeProps {
  status: AuthStatus;
  trustScore?: number;
}

export default function SecurityBadge({ status, trustScore }: SecurityBadgeProps) {
  let badgeColor = "bg-slate-700/50 text-slate-400 border-slate-600";
  let icon = "🛡️";
  let label = "Idle";

  if (status === 'analyzing') {
    badgeColor = "bg-amber-900/40 text-amber-400 border-amber-700 animate-pulse";
    icon = "⏳";
    label = "Analyzing...";
  } else if (status === 'success') {
    badgeColor = "bg-emerald-900/40 text-emerald-400 border-emerald-700";
    icon = "✅";
    label = "Genuine User";
  } else if (status === 'failed') {
    badgeColor = "bg-rose-900/40 text-rose-400 border-rose-700";
    icon = "❌";
    label = "Impostor Detected";
  }

  return (
    <div className={`flex items-center space-x-3 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 shrink-0 ${badgeColor}`}>
      <span className="text-sm">{icon}</span>
      <span className="text-sm font-semibold tracking-wide whitespace-nowrap">{label}</span>
      {trustScore !== undefined && (
        <span className="ml-2 text-xs opacity-80 border-l pl-2 border-current">
          Score: {(trustScore * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}
