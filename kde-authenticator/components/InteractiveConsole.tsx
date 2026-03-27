import { ChangeEvent, KeyboardEvent } from 'react';

interface InteractiveConsoleProps {
  mode: 'registration' | 'live';
  setMode: (mode: 'registration' | 'live') => void;
  inputValue: string;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDownWrapper: (e: KeyboardEvent<HTMLInputElement>) => void;
  handleKeyUp: (e: KeyboardEvent<HTMLInputElement>) => void;
  resetState: () => void;
  samplesCaptured: number;
  requiredSamples: number;
  targetPassphrase: string;
  authStatus: 'idle' | 'analyzing' | 'success' | 'failed';
  isTestingAsGenuine: boolean;                           // <-- NEW PROP
  setIsTestingAsGenuine: (val: boolean) => void;         // <-- NEW PROP
}

export default function InteractiveConsole({
  mode,
  setMode,
  inputValue,
  handleChange,
  onKeyDownWrapper,
  handleKeyUp,
  resetState,
  samplesCaptured,
  requiredSamples,
  targetPassphrase,
  authStatus,
  isTestingAsGenuine,
  setIsTestingAsGenuine
}: InteractiveConsoleProps) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-lg p-8 shadow-2xl">
      {/* Mode Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-slate-800 pb-4">
        <button
          onClick={() => { setMode('registration'); resetState(); }}
          className={`px-4 py-2 text-xs font-bold tracking-widest uppercase transition-colors ${
            mode === 'registration' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Mode 1: Registration
        </button>
        <button
          onClick={() => { setMode('live'); resetState(); }}
          className={`px-4 py-2 text-xs font-bold tracking-widest uppercase transition-colors ${
            mode === 'live' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Mode 2: Live Auth
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Input Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Target Passphrase</label>
            <div className="bg-[#1e293b] p-4 border-l-2 border-slate-600 font-mono text-lg text-slate-200">
              {targetPassphrase}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Interactive Input Console</label>
            <input
              type="text"
              value={inputValue}
              onChange={handleChange}
              onKeyDown={onKeyDownWrapper}
              onKeyUp={handleKeyUp}
              placeholder="Type target passphrase here..."
              className="w-full bg-transparent border-b-2 border-slate-700 focus:border-cyan-400 p-4 font-mono text-lg text-white placeholder-slate-600 outline-none transition-colors"
              autoComplete="off"
              spellCheck="false"
            />
            <p className="text-[10px] text-slate-500 mt-2">Press ENTER to submit sequence</p>
          </div>

          {/* Conditional Footer (Registration vs Live) */}
          {mode === 'registration' ? (
            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Progress</p>
                <div className="flex space-x-1">
                  {[...Array(requiredSamples)].map((_, i) => (
                    <div key={i} className={`h-1 w-6 ${i < samplesCaptured ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">Sample {samplesCaptured}/{requiredSamples} captured</p>
              </div>
            </div>
          ) : (
            <div className="pt-4 space-y-6">
               {/* --- NEW ROLE TOGGLE UI --- */}
               <div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Testing Role (Ground Truth)</p>
                 <div className="flex bg-[#0f172a] rounded p-1 w-fit border border-slate-700">
                   <button
                     onClick={() => setIsTestingAsGenuine(true)}
                     className={`px-4 py-2 text-xs font-bold uppercase transition-colors rounded ${
                       isTestingAsGenuine ? 'bg-green-500/20 text-green-400' : 'text-slate-500 hover:text-slate-300'
                     }`}
                   >
                     Genuine User
                   </button>
                   <button
                     onClick={() => setIsTestingAsGenuine(false)}
                     className={`px-4 py-2 text-xs font-bold uppercase transition-colors rounded ${
                       !isTestingAsGenuine ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-slate-300'
                     }`}
                   >
                     Impostor
                   </button>
                 </div>
               </div>

               <div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Dynamic State</p>
                 {authStatus === 'idle' && <p className="text-slate-400">Waiting for input...</p>}
                 {authStatus === 'analyzing' && <p className="text-cyan-400 animate-pulse">Analyzing dynamics...</p>}
                 {authStatus === 'success' && <p className="text-green-400 font-bold">Genuine User Authenticated</p>}
                 {authStatus === 'failed' && <p className="text-red-500 font-bold">Impostor Detected</p>}
               </div>
            </div>
          )}
        </div>

        {/* Visualizer Placeholder */}
        <div className="hidden md:flex flex-col items-center justify-center border border-slate-800 bg-[#0f172a] p-8 min-h-[300px]">
           <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin mb-4 opacity-50"></div>
           <p className="text-xs text-slate-500 uppercase tracking-widest mt-4">Live Stream Telemetry</p>
        </div>
      </div>
    </div>
  );
}