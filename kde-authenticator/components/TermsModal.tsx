'use client';

import { useState } from 'react';

interface TermsModalProps {
  username: string;
  onAccept: () => void;
  onCancel: () => void;
}

export default function TermsModal({ username, onAccept, onCancel }: TermsModalProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 10;
    if (bottom) {
      setHasScrolled(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0d14]/80 backdrop-blur-sm">
      <div className="bg-[#111827] border border-cyan-900/50 rounded-xl shadow-2xl shadow-cyan-900/20 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-200 tracking-tight uppercase">Academic Research Consent</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Anomaly Detector Dissertation Project</p>
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300 transition-colors p-2"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-sm text-slate-300"
          onScroll={handleScroll}
        >
          <p className="text-slate-300 bg-cyan-900/20 p-3 rounded-lg border border-cyan-800/30">
            Welcome, <strong>{username}</strong>. Before proceeding with system calibration, please read and consent to the data collection practices of this academic research project.
          </p>

          <section>
            <h3 className="font-bold text-slate-200 mb-2 uppercase tracking-wide text-xs">1. Project Purpose</h3>
            <p className="leading-relaxed text-slate-400">
              The &quot;Anomaly Detector&quot; is a university dissertation project evaluating the efficacy of Continuous Behavioral Biometric Authentication via Kernel Density Estimation. The system aims to distinguish genuine users from impostors seamlessly based purely on how they physically interact with a keyboard.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-200 mb-2 uppercase tracking-wide text-xs">2. Data Collected</h3>
            <p className="leading-relaxed text-slate-400 mb-2">To perform behavioral assessment, the system records:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Keystroke Timings:</strong> High-precision timestamps of DOM <code>keydown</code> and <code>keyup</code> events (Dwell, Hold, and Flight times).</li>
              <li><strong>Environmental Telemetry:</strong> Hashed browser fingerprints, user-agent strings, and estimated network types.</li>
              <li><strong>Contextual Telemetry:</strong> Time of access and IP-derived geolocation patterns.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-rose-400 mb-2 uppercase tracking-wide text-xs">3. Data NOT Collected (Zero-Knowledge)</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>No Passwords Stored:</strong> Your calibration passphrase is only used to compute mathematical timings; the text itself is never saved.</li>
              <li><strong>No Raw Keylogging:</strong> The physical keys you press (e.g., &apos;A&apos;, &apos;Shift&apos;) are discarded immediately after computing the numerical time difference.</li>
              <li><strong>No PII:</strong> No personal identification information is transmitted or stored.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-200 mb-2 uppercase tracking-wide text-xs">4. Voluntary Participation & Deletion</h3>
            <p className="leading-relaxed text-slate-400">
              Your participation is entirely voluntary. At any time, you may delete your profile from the main dashboard. This action will permanently erase your profile, behavioral models (.pkl files), and all keystroke logs across the network.
            </p>
          </section>

          <section className="bg-slate-800/50 p-4 rounded border border-slate-700/50">
            <h3 className="font-bold text-slate-200 mb-2 uppercase tracking-wide text-xs">Principal Investigator Contact</h3>
            <p className="text-xs text-slate-400 space-y-1">
              <span className="block text-slate-300 font-bold mb-1">Abhishek Shekhawat</span>
              <span className="block">Email: <a href="mailto:abhishek.shekhawat.1920@gmail.com" className="text-cyan-400 hover:underline">abhishek.shekhawat.1920@gmail.com</a></span>
              <span className="block">LinkedIn: <a href="https://www.linkedin.com/in/abhishek-shekhawat/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">linkedin.com/in/abhishek-shekhawat/</a></span>
            </p>
          </section>
        </div>

        {/* Footer / Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-800 border-slate-600 group-hover:border-slate-500'}`}>
              {isChecked && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={isChecked} 
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <span className={`text-sm font-medium ${isChecked ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-300'}`}>
              I have read and consent to this data collection.
            </span>
          </label>
          
          <button
            disabled={!isChecked}
            onClick={onAccept}
            className={`px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-xs transition-all ${
              isChecked 
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            Create Profile
          </button>
        </div>
      </div>
    </div>
  );
}
