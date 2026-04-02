'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// ── Reusable Card Component ────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`about-card rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-2xl font-black about-title tracking-tight">{title}</h2>
      </div>
      {subtitle && <p className="about-muted text-sm ml-9">{subtitle}</p>}
      <div className="ml-9 mt-3 h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
    </div>
  );
}

// ── Code Inline ────────────────────────────────────────────────────────────────
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="about-code font-mono text-xs px-2 py-0.5 rounded">
      {children}
    </code>
  );
}

// ── Formula Block ──────────────────────────────────────────────────────────────
function Formula({ label, formula, description }: { label: string; formula: string; description?: string }) {
  return (
    <div className="about-formula rounded-lg p-4 my-3">
      <p className="text-[10px] about-muted uppercase tracking-widest font-bold mb-2">{label}</p>
      <pre className="about-formula-text font-mono text-sm overflow-x-auto whitespace-pre-wrap">{formula}</pre>
      {description && <p className="about-muted text-xs mt-2 leading-relaxed">{description}</p>}
    </div>
  );
}

// ── Flow Arrow ─────────────────────────────────────────────────────────────────
function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center my-1">
      <div className="w-px h-4 about-arrow-line" />
      {label && <span className="text-[9px] about-muted uppercase tracking-widest px-2">{label}</span>}
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M5 6L0 0H10L5 6Z" className="about-arrow-fill" />
      </svg>
    </div>
  );
}

// ── Flow Box ───────────────────────────────────────────────────────────────────
function FlowBox({ label, sublabel, variant = 'default' }: {
  label: string; sublabel?: string; variant?: 'default' | 'blue' | 'purple' | 'emerald' | 'rose' | 'orange' | 'amber' | 'cyan';
}) {
  const variants: Record<string, string> = {
    default: 'about-flowbox-default',
    blue: 'about-flowbox-blue',
    purple: 'about-flowbox-purple',
    emerald: 'about-flowbox-emerald',
    rose: 'about-flowbox-rose',
    orange: 'about-flowbox-orange',
    amber: 'about-flowbox-amber',
    cyan: 'about-flowbox-cyan',
  };
  return (
    <div className={`border rounded-lg px-4 py-2.5 text-center min-w-[140px] ${variants[variant]}`}>
      <p className="text-xs font-bold about-title">{label}</p>
      {sublabel && <p className="text-[9px] about-muted mt-0.5">{sublabel}</p>}
    </div>
  );
}

// ── API Endpoint Card ──────────────────────────────────────────────────────────
function ApiCard({ method, endpoint, description, request, response }: {
  method: string; endpoint: string; description: string;
  request?: string; response?: string;
}) {
  const [open, setOpen] = useState(false);
  const methodColors: Record<string, string> = {
    POST: 'about-badge-post',
    GET:  'about-badge-get',
    DELETE: 'about-badge-delete',
  };
  return (
    <div className="about-api-card border rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 about-api-hover transition-colors text-left"
      >
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${methodColors[method] ?? 'about-badge-default'}`}>
          {method}
        </span>
        <code className="text-cyan-600 dark:text-cyan-400 font-mono text-sm about-api-endpoint">{endpoint}</code>
        <span className="ml-auto about-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="about-api-body border-t p-4 space-y-3">
          <p className="about-secondary text-sm">{description}</p>
          {request && (
            <div>
              <p className="text-[10px] about-muted uppercase tracking-widest font-bold mb-1">Request Body</p>
              <pre className="about-pre-amber rounded p-3 text-xs font-mono overflow-x-auto">{request}</pre>
            </div>
          )}
          {response && (
            <div>
              <p className="text-[10px] about-muted uppercase tracking-widest font-bold mb-1">Response</p>
              <pre className="about-pre-emerald rounded p-3 text-xs font-mono overflow-x-auto">{response}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main About Page ────────────────────────────────────────────────────────────
export default function AboutPage() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="about-page min-h-screen font-sans">
      {/* ── Top Nav ── */}
      <div className="about-topnav border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
        <Link href="/" className="text-xs about-muted hover:text-cyan-500 transition-colors uppercase tracking-widest font-bold">
          ← Dashboard
        </Link>
        <span className="text-xs font-black about-title uppercase tracking-widest">Documentation & Architecture</span>
        <button
          onClick={toggleTheme}
          className="text-[10px] font-bold uppercase tracking-widest border px-3 py-1.5 rounded-lg transition-all about-theme-btn"
        >
          {isLight ? '🌙 Dark' : '☀ Light'}
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="about-hero border-b">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <h1 className="text-4xl md:text-5xl font-black about-title tracking-tighter mb-4">
            Anomaly Detector
          </h1>
          <p className="text-lg about-secondary max-w-2xl leading-relaxed mb-6">
            A zero-trust, continuous biometric authentication system that uses{' '}
            <span className="text-cyan-500 font-semibold">Kernel Density Estimation</span>,{' '}
            <span className="text-purple-600 dark:text-purple-400 font-semibold">multi-factor risk aggregation</span>, and{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">adaptive sliding-window retraining</span>{' '}
            to verify user identity from behavioral signatures alone.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Next.js 15', 'FastAPI', 'Scikit-Learn', 'Supabase', 'KDE', 'PCA'].map(tag => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-widest about-tag px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-20">

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — THE CORE IDEA
            ══════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon="💡" title="The Core Idea" subtitle="Why behavioral biometrics are superior to passwords" />
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <h3 className="about-title font-bold mb-2">The Problem with Passwords</h3>
              <p className="about-secondary text-sm leading-relaxed">
                Traditional authentication is a binary gate — you either know the secret or you don&apos;t.
                Once an attacker steals a credential, they have unlimited, undetected access to the entire session.
                There is no way to distinguish the real user from an impostor after login.
              </p>
            </Card>
            <Card className="about-card-accent">
              <h3 className="text-cyan-600 dark:text-cyan-400 font-bold mb-2">The Biometric Solution</h3>
              <p className="about-secondary text-sm leading-relaxed">
                Every person has a unique &quot;typing rhythm&quot; — a subconscious signature from muscle memory.
                Anomaly Detector captures this pattern silently and continuously, cross-referencing it against
                a learned behavioral model with every keystroke input.
              </p>
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 1.5 — FEATURE EXTRACTION
            ══════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon="⌨️" title="Feature Extraction" subtitle="How raw keystrokes become a 6-dimensional biometric vector" />

          {/* Step 1 — Browser Event Capture */}
          <Card className="mb-4">
            <h3 className="about-title font-bold mb-3">Step 1 — Browser Event Capture</h3>
            <p className="about-secondary text-sm leading-relaxed mb-4">
              The <Code>useKeystrokes</Code> hook attaches low-level DOM listeners to the input target.
              Every key press generates two events — <Code>keydown</Code> and <Code>keyup</Code> — each
              timestamped with <Code>performance.now()</Code> for sub-millisecond precision.
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                {
                  event: 'keydown',
                  color: 'border-blue-400/40 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
                  badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                  desc: 'Fired the instant a key is physically pressed down. Records: key name + timestamp T_down.',
                },
                {
                  event: 'keyup',
                  color: 'border-purple-400/40 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
                  badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                  desc: 'Fired when the key is released. Records: key name + timestamp T_up. Paired with the corresponding keydown.',
                },
                {
                  event: 'performance.now()',
                  color: 'border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
                  badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
                  desc: 'High-resolution monotonic clock. Provides microsecond precision — far superior to Date.now() (1ms resolution).',
                },
              ].map(e => (
                <div key={e.event} className={`border rounded-lg p-3 ${e.color}`}>
                  <code className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${e.badge}`}>{e.event}</code>
                  <p className="text-xs mt-2 leading-relaxed">{e.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Step 2 — Timing Computations */}
          <Card className="mb-4">
            <h3 className="about-title font-bold mb-3">Step 2 — Raw Timing Computations</h3>
            <p className="about-secondary text-sm leading-relaxed mb-4">
              Per keystroke pair, three timing intervals are computed. These represent fundamentally different
              aspects of motor control and typing habit:
            </p>
            <div className="space-y-3">
              {[
                {
                  name: 'Dwell Time',
                  formula: 'D(k) = T_up(k) − T_down(k)',
                  unit: 'milliseconds',
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40',
                  desc: 'Duration for which a single key is held down. Directly reflects per-finger muscle memory and key contact habits. Highly personalized.',
                  example: 'e.g., 85–140ms for most keys; punctuation often has shorter dwell.',
                },
                {
                  name: 'Flight Time',
                  formula: 'F(k, k+1) = T_down(k+1) − T_up(k)',
                  unit: 'milliseconds',
                  color: 'text-cyan-600 dark:text-cyan-400',
                  bg: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800/40',
                  desc: 'Time between releasing one key and pressing the next. Captures finger transition dynamics, hand span, and typing rhythm. Can be negative for overlapping keystrokes.',
                  example: 'e.g., 20–80ms for adjacent keys; larger for cross-hand transitions.',
                },
                {
                  name: 'Hold Time',
                  formula: 'H(k) = T_up(k) − T_down(k)  [synonym for Dwell, computed separately for extended key presses]',
                  unit: 'milliseconds',
                  color: 'text-purple-600 dark:text-purple-400',
                  bg: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40',
                  desc: 'Recorded for each key in the sequence independently — used as a parallel stream to dwell_time to capture any system-level timing delay differences and provide feature redundancy.',
                  example: 'e.g., correlates strongly with dwell_time; acts as a validation signal.',
                },
              ].map(t => (
                <div key={t.name} className={`border rounded-lg p-4 ${t.bg}`}>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h4 className={`font-black text-sm ${t.color}`}>{t.name}</h4>
                    <code className="about-code text-[10px] font-mono">{t.formula}</code>
                    <span className="text-[9px] about-muted uppercase tracking-widest ml-auto">{t.unit}</span>
                  </div>
                  <p className="about-secondary text-xs leading-relaxed">{t.desc}</p>
                  <p className="about-muted text-[10px] mt-1 italic">{t.example}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Step 3 — The 6D Vector */}
          <Card className="mb-4 about-card-dark">
            <h3 className="about-title font-bold mb-3">Step 3 — The 6-Dimensional Feature Vector</h3>
            <p className="about-secondary text-sm leading-relaxed mb-4">
              After a full passphrase is typed, the per-keystroke timing arrays (each of length N keys)
              are reduced to a compact statistical summary. This is computed server-side by{' '}
              <Code>feature_extractor.py</Code> using NumPy:
            </p>
            <Formula
              label="get_6d_features(sample) — Python"
              formula={`dwell_mean  = np.mean(dwell_time)   # avg key contact duration
dwell_std   = np.std(dwell_time)    # variance in contact (consistency)
hold_mean   = np.mean(hold_time)    # avg hold duration
hold_std    = np.std(hold_time)     # variance in holding
flight_mean = np.mean(flight_time)  # avg inter-key transition time
flight_std  = np.std(flight_time)   # variance in transitions (rhythm)

→  returns: [dwell_mean, dwell_std, hold_mean, hold_std, flight_mean, flight_std]`}
              description="np.std() uses population standard deviation (ddof=0). If only one keystroke is recorded (edge case), std defaults to 0.0 to prevent NaN propagation."
            />

            {/* 6D Feature Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b about-border">
                    <th className="text-left py-2 pr-4 about-muted font-bold uppercase tracking-widest text-[9px]">Dimension</th>
                    <th className="text-left py-2 pr-4 about-muted font-bold uppercase tracking-widest text-[9px]">Feature Name</th>
                    <th className="text-left py-2 pr-4 about-muted font-bold uppercase tracking-widest text-[9px]">Source Array</th>
                    <th className="text-left py-2 about-muted font-bold uppercase tracking-widest text-[9px]">What It Encodes</th>
                  </tr>
                </thead>
                <tbody className="divide-y about-border">
                  {[
                    { dim: 'F₁', name: 'dwell_mean', src: 'dwell_time[]', desc: 'Average key contact duration — overall typing speed' },
                    { dim: 'F₂', name: 'dwell_std', src: 'dwell_time[]', desc: 'Consistency of finger contact — typing steadiness' },
                    { dim: 'F₃', name: 'hold_mean', src: 'hold_time[]', desc: 'Average hold duration — redundant signal for F₁' },
                    { dim: 'F₄', name: 'hold_std', src: 'hold_time[]', desc: 'Hold variance — cross-validation for F₂' },
                    { dim: 'F₅', name: 'flight_mean', src: 'flight_time[]', desc: 'Avg transition speed — reflects hand reach habits' },
                    { dim: 'F₆', name: 'flight_std', src: 'flight_time[]', desc: 'Rhythm variance — most discriminative feature' },
                  ].map(row => (
                    <tr key={row.dim}>
                      <td className="py-2 pr-4 font-mono font-black text-cyan-600 dark:text-cyan-400">{row.dim}</td>
                      <td className="py-2 pr-4 font-mono text-amber-700 dark:text-amber-400">{row.name}</td>
                      <td className="py-2 pr-4 font-mono about-muted">{row.src}</td>
                      <td className="py-2 about-secondary">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Step 4 — Why std matters */}
          <Card>
            <h3 className="about-title font-bold mb-3">Step 4 — Normalization & Why Standard Deviation Matters</h3>
            <p className="about-secondary text-sm leading-relaxed mb-3">
              Raw mean values alone are insufficient for discrimination. Two users can have the same average
              dwell time but completely different rhythmic consistency. Including <Code>_std</Code> features
              captures typing <span className="about-title font-semibold">regularity</span> as a separate signal.
            </p>
            <div className="grid md:grid-cols-3 gap-3 text-xs">
              <div className="about-formula rounded-lg p-3">
                <p className="text-[9px] about-muted uppercase tracking-widest font-bold mb-2">StandardScaler</p>
                <pre className="about-formula-text font-mono text-[10px]">{`z = (x - μ) / σ`}</pre>
                <p className="about-muted text-[10px] mt-2">Zero-mean, unit-variance normalization applied before PCA to prevent high-magnitude features from dominating.</p>
              </div>
              <div className="about-formula rounded-lg p-3">
                <p className="text-[9px] about-muted uppercase tracking-widest font-bold mb-2">PCA Projection</p>
                <pre className="about-formula-text font-mono text-[10px]">{`6D → 2D space`}</pre>
                <p className="about-muted text-[10px] mt-2">Removes correlated dimensions (dwell vs. hold are strongly correlated). Maximizes discriminability for KDE.</p>
              </div>
              <div className="about-formula rounded-lg p-3">
                <p className="text-[9px] about-muted uppercase tracking-widest font-bold mb-2">KDE Input</p>
                <pre className="about-formula-text font-mono text-[10px]">{`[PC1, PC2] per sample`}</pre>
                <p className="about-muted text-[10px] mt-2">The 2D PCA coordinates become the input to the KDE. Genuine samples cluster; impostors produce outlier coordinates.</p>
              </div>
            </div>
          </Card>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — ARCHITECTURE
            ══════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon="🏗️" title="System Architecture" subtitle="End-to-end flow from browser event to authentication decision" />

          {/* Layer Diagram */}
          <Card className="about-card-dark overflow-x-auto">
            <p className="text-[10px] about-muted uppercase tracking-widest font-bold mb-6">High-Level Layers</p>
            <div className="flex flex-col md:flex-row items-stretch gap-4 min-w-[600px]">
              <div className="flex-1 border border-blue-400/30 dark:border-blue-800/50 rounded-xl p-4 bg-blue-50 dark:bg-blue-950/20">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-widest font-bold mb-3">Browser (Client)</p>
                <div className="space-y-2 text-xs">
                  {['DOM keydown/keyup Events', 'Precision Timestamps (performance.now)', 'Device Fingerprint Hash', 'Network Type Detection', 'Custom Hook: useKeystrokes'].map(item => (
                    <div key={item} className="bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded px-2 py-1 text-blue-800 dark:text-blue-200">{item}</div>
                  ))}
                </div>
              </div>
              <div className="flex md:flex-col items-center justify-center gap-1 about-muted">
                <svg className="rotate-90 md:rotate-0" width="20" height="10" viewBox="0 0 20 10"><path d="M20 5L10 10V0L20 5Z" fill="currentColor" opacity="0.4"/></svg>
                <span className="text-[9px] uppercase tracking-widest whitespace-nowrap">HTTPS / REST</span>
              </div>
              <div className="flex-1 border border-purple-400/30 dark:border-purple-800/50 rounded-xl p-4 bg-purple-50 dark:bg-purple-950/20">
                <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-widest font-bold mb-3">FastAPI (Backend)</p>
                <div className="space-y-2 text-xs">
                  {['Feature Extraction (6D Vector)', 'StandardScaler Normalization', 'PCA Transformation (6D → 2D)', 'KDE Scoring (Log-Likelihood)', 'Risk Engine: B(t) + C(t) + E(t)'].map(item => (
                    <div key={item} className="bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded px-2 py-1 text-purple-800 dark:text-purple-200">{item}</div>
                  ))}
                </div>
              </div>
              <div className="flex md:flex-col items-center justify-center gap-1 about-muted">
                <svg className="rotate-90 md:rotate-0" width="20" height="10" viewBox="0 0 20 10"><path d="M20 5L10 10V0L20 5Z" fill="currentColor" opacity="0.4"/></svg>
                <span className="text-[9px] uppercase tracking-widest whitespace-nowrap">Read / Write</span>
              </div>
              <div className="flex-1 border border-emerald-400/30 dark:border-emerald-800/50 rounded-xl p-4 bg-emerald-50 dark:bg-emerald-950/20">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold mb-3">Supabase (Data)</p>
                <div className="space-y-2 text-xs">
                  {['users table', 'keystroke_logs table', 'model_metadata table', 'kde-models bucket (.pkl files)', 'PostgreSQL + Object Storage'].map(item => (
                    <div key={item} className="bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded px-2 py-1 text-emerald-800 dark:text-emerald-200">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Auth Flow */}
          <Card className="mt-4 about-card-dark">
            <p className="text-[10px] about-muted uppercase tracking-widest font-bold mb-6">Authentication Request Flow</p>
            <div className="flex flex-col items-center">
              <FlowBox label="User Types Passphrase" sublabel="DOM Events Captured" variant="cyan" />
              <Arrow label="useKeystrokes hook" />
              <FlowBox label="Feature Vector Built" sublabel="dwell, hold, flight timing arrays" />
              <Arrow label="POST /api/authenticate" />
              <FlowBox label="6D Features Extracted" sublabel="server-side processing" variant="purple" />
              <Arrow />
              <FlowBox label="StandardScaler → PCA" sublabel="6D normalized → 2D projection" variant="purple" />
              <Arrow />
              <FlowBox label="KDE.score_samples()" sublabel="log-likelihood vs trained model" variant="purple" />
              <Arrow />
              <div className="flex gap-6 items-start">
                <div className="flex flex-col items-center">
                  <FlowBox label="score ≥ threshold" sublabel="Genuine Region" variant="emerald" />
                  <Arrow />
                  <FlowBox label="B(t) = LOW RISK" sublabel="shifts toward 0.0" variant="emerald" />
                </div>
                <div className="flex flex-col items-center">
                  <FlowBox label="score < threshold" sublabel="Impostor Region" variant="rose" />
                  <Arrow />
                  <FlowBox label="B(t) = HIGH RISK" sublabel="shifts toward 0.80" variant="rose" />
                </div>
              </div>
              <Arrow label="+ C(t) + E(t)" />
              <FlowBox label="R(t) = 0.5·B + 0.3·C + 0.2·E" sublabel="Composite Risk Score [0, 1]" variant="orange" />
              <Arrow />
              <div className="flex gap-4">
                <FlowBox label="ALLOW" sublabel="R < 0.35" variant="emerald" />
                <FlowBox label="MFA" sublabel="0.35 ≤ R ≤ 0.70" variant="amber" />
                <FlowBox label="BLOCK" sublabel="R > 0.70" variant="rose" />
              </div>
            </div>
          </Card>

          {/* Registration Flow */}
          <Card className="mt-4 about-card-dark">
            <p className="text-[10px] about-muted uppercase tracking-widest font-bold mb-6">Registration & Model Training Flow</p>
            <div className="flex flex-col items-center">
              <FlowBox label="5 Sample Registrations" sublabel="User types passphrase 5 times" variant="cyan" />
              <Arrow label="POST /api/register" />
              <FlowBox label="6D Feature Extraction × 5" sublabel="Per-sample timing statistics" />
              <Arrow label="Synthetic augmentation" />
              <FlowBox label="200+ Synthetic Data Points" sublabel="5 samples × 40 points, Gaussian jitter" variant="purple" />
              <Arrow />
              <FlowBox label="StandardScaler.fit()" sublabel="Learn feature mean & variance" variant="purple" />
              <Arrow />
              <FlowBox label="PCA.fit() → 2 Components" sublabel="Preserve max variance in 2D" variant="purple" />
              <Arrow />
              <FlowBox label="KDE.fit() — Gaussian Kernel" sublabel="bandwidth = 0.25" variant="purple" />
              <Arrow />
              <FlowBox label="Threshold = 10th Percentile" sublabel="of training set log-densities" variant="orange" />
              <Arrow label="Upload to Supabase Storage" />
              <div className="flex gap-4">
                <FlowBox label="scaler.pkl" variant="emerald" />
                <FlowBox label="pca.pkl" variant="emerald" />
                <FlowBox label="kde.pkl" variant="emerald" />
              </div>
            </div>
          </Card>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — MATHEMATICAL FOUNDATION
            ══════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon="📐" title="Mathematical Foundation" subtitle="The formal equations powering every authentication decision" />
          <div className="space-y-6">
            <Card>
              <h3 className="about-title font-bold mb-1">1. Kernel Density Estimation (KDE)</h3>
              <p className="about-secondary text-sm mb-3 leading-relaxed">
                Given training observations <Code>{'x₁, x₂, ..., xₙ'}</Code>, the KDE constructs a smooth,
                non-parametric probability density function using a Gaussian kernel:
              </p>
              <Formula
                label="Kernel Density Estimator"
                formula={"f̂_h(x) = (1/nh) · Σᵢ₌₁ⁿ  K((x - xᵢ) / h)\n\nwhere  K(u) = (1/√2π) · exp(-u²/2)  (Gaussian)"}
                description="n = number of training samples, h = bandwidth (0.25), K = Gaussian kernel. Lower bandwidth = sharper, more precise decision boundaries."
              />
            </Card>
            <Card>
              <h3 className="about-title font-bold mb-1">2. PCA Dimensionality Reduction</h3>
              <p className="about-secondary text-sm mb-3 leading-relaxed">
                The 6D feature vector <Code>{'[dwell_μ, dwell_σ, hold_μ, hold_σ, flight_μ, flight_σ]'}</Code> is
                projected into a 2D principal component space to remove correlation and enable visualization.
              </p>
              <Formula
                label="PCA Projection"
                formula={"z = W^T · (x - μ)\n\nwhere  W = top-2 eigenvectors of Cov(X)\n       μ = feature mean vector (from StandardScaler)"}
                description="Eigenvectors selected to maximize explained variance, ensuring the KDE operates on the most discriminative typing dimensions."
              />
            </Card>
            <Card>
              <h3 className="about-title font-bold mb-1">3. Behavioural Score B(t)</h3>
              <Formula
                label="Behavioural Risk Score"
                formula={"distance    = log_density - threshold\nnormalised  = clamp(distance / 4.0, -1.0, 1.0)\nshift       = -normalised × 0.60\nB(t)        = clamp(0.20 + shift, 0.0, 1.0)"}
                description="B(t) ∈ [0,1]. Baseline 0.20 = 80% prior trust. Shifts down (safer) above threshold, up (riskier) below."
              />
            </Card>
            <Card>
              <h3 className="about-title font-bold mb-1">4. Contextual Score C(t)</h3>
              <Formula
                label="Contextual Risk Score"
                formula={"C(t) = 0.25 · hour_score + 0.25 · geo_score + 0.25 · ip_score + 0.25 · velocity_score\n\nhour_score     = min(circular_hour_diff / 12.0, 1.0)\nip_score       = 1.0 if new IP, else 0.0\nvelocity_score = min(logins_in_last_hour / 5.0, 1.0)"}
                description="Circular hour distance ensures 23:00 and 01:00 are only 2h apart. Login velocity detects brute-force attempts."
              />
            </Card>
            <Card>
              <h3 className="about-title font-bold mb-1">5. Environmental Score E(t)</h3>
              <Formula
                label="Environmental Risk Score"
                formula={"E(t) = (device_score + ua_score + network_score + vpn_score) / 4\n\ndevice_score  = 0 if fingerprint_hash known, else 1\nua_score      = 0 if user_agent known, else 1\nnetwork_score = 0.5 if cellular/unknown, else 0\nvpn_score     = 1.0 if VPN detected, else 0"}
                description="Fingerprint = FNV-1a hash of navigator.userAgent + screen size + timezone + language."
              />
            </Card>
            <Card className="about-card-formula-highlight">
              <h3 className="text-orange-600 dark:text-orange-400 font-bold mb-1">6. Composite Risk Score R(t) & Decision</h3>
              <Formula
                label="Risk Aggregation Formula"
                formula={"R(t) = 0.50 · B(t) + 0.30 · C(t) + 0.20 · E(t)\n\nDecision:\n  R < 0.35          → ALLOW\n  0.35 ≤ R ≤ 0.70   → MFA\n  R > 0.70           → BLOCK"}
                description="Weights sum to 1.0. Behavioral carries the most weight as the primary distinguishing signal."
              />
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4 — FRONTEND ARCHITECTURE
            ══════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon="⚛️" title="Frontend Architecture" subtitle="Next.js 15 application structure and component responsibilities" />
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { file: 'app/page.tsx', color: 'text-cyan-600 dark:text-cyan-400', role: 'Application Orchestrator', desc: 'Root page and central state manager. Owns: selectedUser, riskData, notes, authStatus. Coordinates all API calls and passes data to child components via props.' },
              { file: 'hooks/useKeystrokes.ts', color: 'text-purple-600 dark:text-purple-400', role: 'Biometric Capture Engine', desc: 'Attaches raw keydown/keyup DOM listeners. Records precision timestamps via performance.now(). Computes dwell, flight, and hold time arrays as structured API payloads.' },
              { file: 'hooks/useDeviceFingerprint.ts', color: 'text-purple-600 dark:text-purple-400', role: 'Environmental Sensor', desc: 'Hashes navigator.userAgent + screen dimensions + timezone + language using FNV-1a to produce a stable device identifier without cookies.' },
              { file: 'components/RiskGauge.tsx', color: 'text-orange-600 dark:text-orange-400', role: 'Risk Visualization Engine', desc: 'Pure SVG animated gauge rendering R(t), B(t), C(t), E(t). Concentric arc rings with dynamic length calculations, updating on every authentication pass.' },
              { file: 'components/CalcPanel.tsx', color: 'text-orange-600 dark:text-orange-400', role: 'Live Calculation Inspector', desc: 'Renders the numeric breakdown of every formula: KDE log-density, threshold, distance, sub-scores for all three vectors, and the final Decision verdict.' },
              { file: 'components/PerformanceDashboard.tsx', color: 'text-blue-600 dark:text-blue-400', role: 'Model Telemetry Viewer', desc: 'Fetches server-rendered Matplotlib charts (KDE contour cloud + ROC curve) via POST /api/metrics. Re-fetches on every successful authentication.' },
              { file: 'components/NoteEditor.tsx', color: 'text-slate-600 dark:text-slate-400', role: 'Continuous Auth Surface', desc: 'The primary biometric surface. As the user writes notes naturally, useKeystrokes silently captures timing data. Each Enter dispatch triggers a live authentication request.' },
              { file: 'contexts/ThemeContext.tsx', color: 'text-slate-600 dark:text-slate-400', role: 'Theme State Provider', desc: 'Provides theme (light|dark) via React Context. Persists to localStorage. Sets the data-theme attribute on <html> to trigger CSS override rulesets in globals.css.' },
            ].map(item => (
              <Card key={item.file}>
                <code className={`text-[10px] font-mono ${item.color}`}>{item.file}</code>
                <h3 className="about-title font-bold text-sm mt-1 mb-2">{item.role}</h3>
                <p className="about-muted text-xs leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 5 — API REFERENCE
            ══════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon="🔌" title="Backend API Reference" subtitle="All REST endpoints — click any row to expand details" />

          <ApiCard method="POST" endpoint="/api/register"
            description="Receives 5+ keystroke samples. Generates 200+ synthetic points via Gaussian jitter, trains StandardScaler → PCA → KDE, computes 10th-percentile threshold, uploads .pkl models to Supabase Storage, and records model metadata."
            request={`{ "username": "alice", "passphrase": "the quick brown fox",\n  "samples": [{ "dwell_time": [120,95], "hold_time": [130,100], "flight_time": [45,38] }, ...] }`}
            response={`{ "status": "success", "security_threshold": -4.2318 }`}
          />
          <ApiCard method="POST" endpoint="/api/authenticate"
            description="Downloads user .pkl models, extracts 6D features, runs the full ML pipeline, scores log-likelihood, records the attempt, triggers background retraining on success, and returns B(t) breakdown + initial risk scores."
            request={`{ "username": "alice", "is_actual_genuine": true,\n  "sample": { "dwell_time": [118,98], "hold_time": [130,103], "flight_time": [47,41] } }`}
            response={`{ "predicted_genuine": true, "score": -3.782, "threshold": -4.231,\n  "b_score": 0.0875, "r_score": 0.0438, "decision": "allow",\n  "b_detail": { "log_density": -3.782, "distance": 0.449, "normalised": 0.112, "shift": -0.067 } }`}
          />
          <ApiCard method="POST" endpoint="/api/risk/context"
            description="Computes C(t) contextual risk from client IP, current hour, and historical login patterns. Returns hour deviation, geo flag, new-IP flag, and login velocity sub-scores."
            request={`{ "username": "alice", "ip_address": "203.0.113.42", "current_hour": 14 }`}
            response={`{ "c_score": 0.0625, "sub": { "hour": 0.083, "geo": 0.0, "ip": 0.0, "velocity": 0.25 } }`}
          />
          <ApiCard method="POST" endpoint="/api/risk/session"
            description="Computes E(t) environmental risk from the browser fingerprint, user-agent, network type, and VPN status collected by the useDeviceFingerprint hook."
            request={`{ "username": "alice", "fingerprint_hash": "a3f7c9d2",\n  "user_agent": "Mozilla/5.0...", "network_type": "wifi", "is_vpn": false }`}
            response={`{ "e_score": 0.0, "sub": { "device": 0.0, "ua": 0.0, "network": 0.0, "vpn": 0.0 } }`}
          />
          <ApiCard method="POST" endpoint="/api/metrics"
            description="Downloads the user's KDE model, loads all historical logs, renders Matplotlib charts (KDE cloud map + ROC curve) as Base64 PNG URIs. Supports light and dark theme variants."
            request={`{ "username": "alice", "theme": "dark" }`}
            response={`{ "status": "success", "auth_rate": 94.44, "blocked_rate": 100.0,\n  "kde_plot": "data:image/png;base64,...", "roc_plot": "data:image/png;base64,..." }`}
          />
          <ApiCard method="GET" endpoint="/api/users"
            description="Returns all registered user profiles from the Supabase users table. Used by the UserSelector component to populate the profile list on the login screen."
            response={`[{ "id": "uuid-...", "username": "alice", "created_at": "2026-03-28T..." }]`}
          />
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 6 — ADAPTIVE RETRAINING
            ══════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon="🔄" title="Adaptive Sliding-Window Retraining" subtitle="How the model prevents classifier drift over time" />
          <Card>
            <p className="about-secondary text-sm leading-relaxed mb-4">
              Human typing behavior drifts naturally over time. A static model trained at registration
              will progressively reject its own genuine user. The solution is <span className="about-title font-semibold">asynchronous sliding-window retraining</span>.
            </p>
            <div className="flex flex-col items-center my-4">
              <FlowBox label="Successful Genuine Login" variant="emerald" />
              <Arrow label="FastAPI BackgroundTasks" />
              <FlowBox label="Fetch Last 100 Genuine Logs" sublabel="from keystroke_logs" />
              <Arrow />
              <FlowBox label="Rebuild Full KDE Pipeline" sublabel="StandardScaler → PCA → KDE → Threshold" variant="purple" />
              <Arrow />
              <FlowBox label="Upload New .pkl to Supabase" variant="cyan" />
              <Arrow />
              <FlowBox label="Next Auth Uses Updated Model" variant="emerald" />
            </div>
            <p className="about-muted text-xs leading-relaxed">
              Runs as a background async task — never blocks the HTTP response. Window is capped at 100
              samples to maintain recency bias without overfitting to a single session.
            </p>
          </Card>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 7 — SYNTHETIC DATA
            ══════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon="🧬" title="Synthetic Data Generation" subtitle="Solving the cold-start problem with Gaussian multi-cloud augmentation" />
          <Card>
            <p className="about-secondary text-sm leading-relaxed mb-4">
              KDE requires many samples for accurate density boundaries. Asking a user to type hundreds of
              times at registration is impractical. The solution is <span className="about-title font-semibold">Multi-Modal Gaussian Augmentation</span>.
            </p>
            <Formula
              label="Gaussian Jitter Augmentation"
              formula={"For each real sample sᵢ, generate 40 synthetic variants:\n\n  dwell_μ'  ~ N(sᵢ.dwell_μ,  σ=10ms)\n  dwell_σ'  ~ N(sᵢ.dwell_σ,  σ=5ms)\n  flight_μ' ~ N(sᵢ.flight_μ, σ=20ms)  ← greater natural variance\n  flight_σ' ~ N(sᵢ.flight_σ, σ=10ms)\n\nResult: 5 samples × 40 points = 200+ training points"}
              description="Jitter values are empirically calibrated to match natural inter-session variance. Creates a realistic multi-modal density cloud rather than a narrow, fragile spike."
            />
          </Card>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 8 — DATABASE SCHEMA
            ══════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader icon="🗄️" title="Database Schema" subtitle="Supabase (PostgreSQL) table definitions" />
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { table: 'users', color: 'text-blue-600 dark:text-blue-400', cols: [
                { name: 'id', type: 'UUID PK', desc: 'Auto-generated profile identifier' },
                { name: 'username', type: 'TEXT UNIQUE', desc: 'Display name and lookup key' },
                { name: 'passphrase', type: 'TEXT', desc: 'Target phrase for biometric capture' },
                { name: 'created_at', type: 'TIMESTAMPTZ', desc: 'Profile creation timestamp' },
              ]},
              { table: 'keystroke_logs', color: 'text-purple-600 dark:text-purple-400', cols: [
                { name: 'id', type: 'UUID PK', desc: 'Log entry identifier' },
                { name: 'user_id', type: 'UUID FK', desc: 'References users.id' },
                { name: 'attempt_type', type: 'TEXT', desc: '"genuine_login" | "impostor_blocked"' },
                { name: 'features', type: 'JSONB', desc: 'Raw timing arrays + fingerprint data' },
                { name: 'log_density_score', type: 'FLOAT', desc: 'Cached KDE log-likelihood value' },
                { name: 'is_used_for_training', type: 'BOOL', desc: 'Included in retraining?' },
              ]},
              { table: 'model_metadata', color: 'text-orange-600 dark:text-orange-400', cols: [
                { name: 'user_id', type: 'UUID PK/FK', desc: 'References users.id (one-to-one)' },
                { name: 'security_threshold', type: 'FLOAT', desc: '10th percentile of training log-densities' },
                { name: 'scaler_file_path', type: 'TEXT', desc: 'Supabase Storage path for scaler.pkl' },
                { name: 'pca_file_path', type: 'TEXT', desc: 'Supabase Storage path for pca.pkl' },
                { name: 'kde_file_path', type: 'TEXT', desc: 'Supabase Storage path for kde.pkl' },
                { name: 'total_training_samples', type: 'INT', desc: 'Training set size at last calibration' },
              ]},
              { table: 'kde-models (Storage)', color: 'text-emerald-600 dark:text-emerald-400', cols: [
                { name: '{username}/scaler.pkl', type: 'Binary', desc: 'Serialized StandardScaler' },
                { name: '{username}/pca.pkl', type: 'Binary', desc: 'Serialized PCA transformer' },
                { name: '{username}/kde.pkl', type: 'Binary', desc: 'Serialized KernelDensity estimator' },
              ]},
            ].map(t => (
              <Card key={t.table}>
                <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${t.color}`}>Table</p>
                <h3 className="about-title font-bold font-mono mb-3">{t.table}</h3>
                <div className="space-y-2">
                  {t.cols.map(col => (
                    <div key={col.name} className="flex items-start gap-2 text-xs">
                      <code className="text-cyan-600 dark:text-cyan-300 font-mono shrink-0">{col.name}</code>
                      <span className="about-muted shrink-0">·</span>
                      <span className="text-amber-700 dark:text-amber-500/80 font-mono text-[10px] shrink-0">{col.type}</span>
                      <span className="about-muted">{col.desc}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="border-t about-border pt-10 pb-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="about-title font-bold">Anomaly Detector</p>
            <p className="about-muted text-xs">Dissertation Project — Continuous Behavioral Biometric Authentication</p>
          </div>
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 border border-cyan-400/40 px-4 py-2 rounded hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
