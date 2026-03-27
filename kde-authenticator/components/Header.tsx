export default function Header() {
  return (
    <header className="space-y-4">
      <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 uppercase tracking-tighter">
        Kernel Density <br /> Estimation Biometrics
      </h1>
      <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
        Leveraging non-parametric probability density functions to model unique keystroke dynamics. 
        Type the passphrase to construct your behavioral signature.
      </p>
    </header>
  );
}