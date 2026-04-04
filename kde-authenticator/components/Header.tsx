import Link from 'next/link';

export default function Header() {
  return (
    <header className="space-y-1">
      <h1 className="text-xl md:text-2xl font-bold text-cyan-400 uppercase tracking-tight">
        Anomaly Detector
      </h1>
      <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
        Continuous behavioral authentication. R(t) = w_b B(t) + w_c C(t) + w_e E(t)
      </p>
      <div className="flex gap-4 mt-1">
        <Link
          href="/about"
          className="inline-block text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors border-b border-slate-700 hover:border-cyan-500 pb-px"
        >
          Documentation & Architecture →
        </Link>
        <div className="relative group cursor-pointer inline-block">
          <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-emerald-400 transition-colors border-b border-slate-700 group-hover:border-emerald-500 pb-px">
            ✉ Contact Creator
          </span>
          <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-[300px] bg-[#111827] border border-emerald-900/50 shadow-2xl rounded-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 cursor-auto">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 border-b border-slate-800 pb-2">Abhishek Shekhawat</h4>
            <div className="space-y-3">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Email ID</p>
                <code className="text-xs text-emerald-400 select-all font-mono block bg-[#0a0d14] border border-slate-800 p-2 rounded">abhishek.shekhawat.1920@gmail.com</code>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">LinkedIn URL</p>
                <code className="text-xs text-cyan-400 select-all font-mono block bg-[#0a0d14] border border-slate-800 p-2 rounded">https://www.linkedin.com/in/abhishek-shekhawat/</code>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 mt-3 pt-2 border-t border-slate-800 italic text-center">Highlight text to copy</p>
          </div>
        </div>
      </div>
    </header>
  );
}