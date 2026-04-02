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
      <Link
        href="/about"
        className="inline-block text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors border-b border-slate-700 hover:border-cyan-500 pb-px mt-1"
      >
        Documentation & Architecture →
      </Link>
    </header>
  );
}