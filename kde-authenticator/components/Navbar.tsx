'use client';

import Header from '@/components/Header';
import SecurityBadge, { AuthStatus } from '@/components/SecurityBadge';

interface NavbarProps {
  selectedUser: { username: string } | null;
  isNewUser: boolean;
  authStatus: AuthStatus;
  trustScore: number | undefined;
  onRecalibrate: () => void;
  onSignOut: () => void;
}

export default function Navbar({
  selectedUser,
  isNewUser,
  authStatus,
  trustScore,
  onRecalibrate,
  onSignOut,
}: NavbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
      <Header />
      {selectedUser && !isNewUser && (
        <div className="flex items-center space-x-6">
          <div className="text-right flex flex-col items-end opacity-80">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Active Identity
            </span>
            <span className="text-sm font-medium text-slate-300">{selectedUser.username}</span>
          </div>
          <SecurityBadge status={authStatus} trustScore={trustScore} />
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
        </div>
      )}
    </div>
  );
}
