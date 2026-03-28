'use client';

interface CalibrationProps {
  username: string;
  samplesCollected: number;
  requiredChunks: number;
  keystrokeHandlers: {
    inputValue: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleKeyUp: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  };
}

export default function CalibrationOverlay({
  username,
  samplesCollected,
  requiredChunks,
  keystrokeHandlers,
}: CalibrationProps) {
  return (
    <div className="absolute inset-0 z-10 bg-[#0b0f19]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="max-w-xl w-full">
        <h2 className="text-3xl font-bold tracking-tighter text-cyan-400 mb-2">Initialize Biometric Baseline</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Welcome to your secure vault, {username}. To enable continuous authentication, we need to learn your unique
          typing rhythm. Please retype the text below until calibration is complete.
        </p>

        <div className="bg-[#111827] border border-slate-800 p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start mb-6 gap-4">
            <p className="text-left text-slate-400 italic text-sm border-l-2 border-slate-700 pl-4 max-w-sm">
              "Continuous authentication eliminates the need for complex passwords by treating the human behavioral
              signature as the primary credential. This creates a frictionless and highly secure environment."
            </p>
            <div className="text-xs font-semibold text-cyan-500 bg-cyan-900/40 px-3 py-1.5 rounded-full border border-cyan-800 whitespace-nowrap shrink-0 shadow-inner tracking-widest uppercase">
              {samplesCollected} / {requiredChunks} Chunks
            </div>
          </div>

          <textarea
            autoFocus
            value={keystrokeHandlers.inputValue}
            onChange={keystrokeHandlers.handleChange}
            onKeyDown={keystrokeHandlers.handleKeyDown}
            onKeyUp={keystrokeHandlers.handleKeyUp}
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:border-cyan-500 hover:border-slate-600 transition-colors resize-none"
            placeholder="Start typing here..."
          />
        </div>
      </div>
    </div>
  );
}
