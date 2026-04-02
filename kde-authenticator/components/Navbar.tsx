'use client';

import Header from '@/components/Header';
import SecurityBadge, { AuthStatus } from '@/components/SecurityBadge';
import { useTheme } from '@/contexts/ThemeContext';

interface NavbarProps {
  selectedUser: { username: string } | null;
  isNewUser: boolean;
  authStatus: AuthStatus;
  trustScore: number | undefined;
  isImposterMode: boolean;
  onToggleImposterMode: () => void;
  demoAnomalyMode: boolean;
  onToggleDemoAnomaly: () => void;
  onRecalibrate: () => void;
  onSignOut: () => void;
}

export default function Navbar({
  selectedUser,
  isNewUser,
  authStatus,
  trustScore,
  isImposterMode,
  onToggleImposterMode,
  demoAnomalyMode,
  onToggleDemoAnomaly,
  onRecalibrate,
  onSignOut,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <Header />

      <div className="flex items-center gap-3 flex-wrap justify-end">
        {/* ── Theme Toggle ─────────────────────────────────────── */}
        <button
          onClick={toggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded-lg transition-all bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
        >
          {isLight ? (
            <>
              {/* Moon SVG */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
              </svg>
              Dark
            </>
          ) : (
            <>
              {/* Sun SVG */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              Light
            </>
          )}
        </button>

        {selectedUser && !isNewUser && (
          <>
            <div className="text-right flex flex-col items-end opacity-80">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Active Identity
              </span>
              <span className="text-sm font-medium text-slate-300">{selectedUser.username}</span>
            </div>
            <SecurityBadge status={authStatus} trustScore={trustScore} />
            <button
              onClick={onToggleImposterMode}
              className={`text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded transition-all ${
                isImposterMode
                  ? 'bg-rose-900/40 text-rose-500 border-rose-800 hover:bg-rose-900/60'
                  : 'bg-transparent text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-500'
              }`}
              title="Toggle simulating an impostor user"
            >
              {isImposterMode ? '⚠ Impostor Mode' : 'Simulate Impostor'}
            </button>
            <button
              onClick={onToggleDemoAnomaly}
              className={`text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded transition-all ${
                demoAnomalyMode
                  ? 'bg-amber-900/40 text-amber-400 border-amber-700 hover:bg-amber-900/60 animate-pulse'
                  : 'bg-transparent text-slate-500 border-slate-700 hover:text-amber-400 hover:border-amber-700'
              }`}
              title="Spoof context & environment signals — simulates login from unknown device, VPN and unusual hour"
            >
              {demoAnomalyMode ? '🔴 Spoof Active' : '🎭 Spoof Context'}
            </button>
            <button
              onClick={onRecalibrate}
              className="text-[10px] font-bold tracking-widest uppercase bg-transparent hover:bg-cyan-900/40 text-cyan-500 hover:text-cyan-300 border border-cyan-800 hover:border-cyan-600 px-3 py-1.5 rounded transition-all"
              title="Wipe current Biometric Baseline and recalibrate"
            >
              ⟳ Recalibrate
            </button>
            <button
              onClick={onSignOut}
              className="text-xs font-semibold bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-900/50 px-3 py-1.5 rounded-lg transition-all"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
