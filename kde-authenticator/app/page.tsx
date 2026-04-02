'use client';

import { useState, useCallback, useEffect } from 'react';
import { Note } from '@/components/NoteSidebar';
import { AuthStatus } from '@/components/SecurityBadge';
import { RiskData } from '@/components/RiskGauge';
import { useKeystrokes } from '@/hooks/useKeystrokes';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';
import Navbar from '@/components/Navbar';
import UserSelector from '@/components/UserSelector';
import CalibrationOverlay from '@/components/CalibrationOverlay';
import DashboardLayout from '@/components/DashboardLayout';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const REQUIRED_REGISTRATION_CHUNKS = 5;

interface User { id: string; username: string; }

export default function ContinuousAuthNoteTaker() {
  const [selectedUser, setSelectedUser]   = useState<User | null>(null);
  const [isNewUser, setIsNewUser]         = useState(false);
  const [authStatus, setAuthStatus]       = useState<AuthStatus>('idle');
  const [trustScore, setTrustScore]       = useState<number | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isImposterMode, setIsImposterMode] = useState(false);
  const [demoAnomalyMode, setDemoAnomalyMode] = useState(false);

  // ── Risk state ─────────────────────────────────────────────────────────────
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [bDetail, setBDetail]   = useState<Record<string, number> | null>(null);
  const [bHistory, setBHistory] = useState<number[]>([]);
  const [cScore, setCScore]     = useState(0);
  const [cSub, setCSubState]    = useState<Record<string, number> | null>(null);
  const [eScore, setEScore]     = useState(0);
  const [eSub, setESubState]    = useState<Record<string, number> | null>(null);

  const [notes, setNotes]               = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [registrationSamples, setRegistrationSamples] = useState<any[]>([]);

  // ── Device fingerprint (collected once on mount) ────────────────────────────
  const deviceFp = useDeviceFingerprint();

  // ── Send E(t) session payload once fingerprint & user are ready ─────────────
  useEffect(() => {
    if (!deviceFp || !selectedUser || isNewUser) return;
    fetch(`${API_URL}/api/risk/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: selectedUser.username,
        fingerprint_hash: deviceFp.fingerprint_hash,
        user_agent: deviceFp.user_agent,
        network_type: deviceFp.network_type,
        is_vpn: deviceFp.is_vpn,
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.e_score !== undefined) {
          setEScore(d.e_score);
          setESubState(d.sub ?? null);
        }
      })
      .catch(() => {});
  }, [deviceFp, selectedUser, isNewUser]);

  // ── Demo Anomaly: spoof C(t) + E(t) when toggle is ON, reset when OFF ────────
  const handleToggleDemoAnomaly = useCallback(() => {
    if (!selectedUser) return;
    const next = !demoAnomalyMode;
    setDemoAnomalyMode(next);

    if (next) {
      // Spoof E(t): unknown device + VPN
      fetch(`${API_URL}/api/risk/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUser.username,
          fingerprint_hash: 'demo_unknown_device_xyz987',
          user_agent: 'Mozilla/5.0 (Spoofed Bot; demo)',
          network_type: 'cellular',
          is_vpn: true,
        }),
      }).then(r => r.json()).then(d => {
        if (d.e_score !== undefined) { setEScore(d.e_score); setESubState(d.sub ?? null); }
      }).catch(() => {});

      // Spoof C(t): unusual hour (3am) + velocity spike
      fetch(`${API_URL}/api/risk/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUser.username,
          ip_address: '185.220.101.45',   // known Tor exit IP
          current_hour: 3,
          client_timestamp: new Date().toISOString(),
        }),
      }).then(r => r.json()).then(d => {
        if (d.c_score !== undefined) { setCScore(d.c_score); setCSubState(d.sub ?? null); }
      }).catch(() => {});
    } else {
      // Reset E(t) to real values
      if (deviceFp) {
        fetch(`${API_URL}/api/risk/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: selectedUser.username,
            fingerprint_hash: deviceFp.fingerprint_hash,
            user_agent: deviceFp.user_agent,
            network_type: deviceFp.network_type,
            is_vpn: deviceFp.is_vpn,
          }),
        }).then(r => r.json()).then(d => {
          if (d.e_score !== undefined) { setEScore(d.e_score); setESubState(d.sub ?? null); }
        }).catch(() => {});
      }
      // Reset C(t) to real values
      fetch(`${API_URL}/api/risk/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUser.username,
          ip_address: '',
          current_hour: new Date().getHours(),
          client_timestamp: new Date().toISOString(),
        }),
      }).then(r => r.json()).then(d => {
        if (d.c_score !== undefined) { setCScore(d.c_score); setCSubState(d.sub ?? null); }
      }).catch(() => {});
    }
  }, [demoAnomalyMode, selectedUser, deviceFp]);

  // ── Send C(t) context payload once per session ──────────────────────────────
  useEffect(() => {
    if (!selectedUser || isNewUser) return;
    fetch(`${API_URL}/api/risk/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: selectedUser.username,
        ip_address: '',   // server will use request.client.host
        current_hour: new Date().getHours(),
        client_timestamp: new Date().toISOString(),
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.c_score !== undefined) {
          setCScore(d.c_score);
          setCSubState(d.sub ?? null);
        }
      })
      .catch(() => {});
  }, [selectedUser, isNewUser]);

  // ── Notes API ──────────────────────────────────────────────────────────────
  const fetchNotes = useCallback(async (userId: string) => {
    setIsLoadingNotes(true);
    try {
      const res = await fetch(`${API_URL}/api/notes/${userId}`);
      if (res.ok) setNotes(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoadingNotes(false); }
  }, []);

  useEffect(() => {
    if (selectedUser && !isNewUser) fetchNotes(selectedUser.id);
  }, [selectedUser, isNewUser, fetchNotes]);

  const handleCreateNewNote = () => setActiveNoteId(null);

  const handleSaveNote = async (title: string, content: string) => {
    if (!selectedUser) return;
    const url    = activeNoteId ? `${API_URL}/api/notes/${activeNoteId}` : `${API_URL}/api/notes/${selectedUser.id}`;
    const method = activeNoteId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) });
      if (res.ok) {
        const saved = await res.json();
        if (!activeNoteId && saved?.id) setActiveNoteId(saved.id); // set ID first
        await fetchNotes(selectedUser.id);                           // then refresh list
      }
    } catch (e) { console.error(e); }
  };


  const handleDeleteNote = async () => {
    if (!activeNoteId || !window.confirm('Delete this secure note?')) return;
    try {
      const res = await fetch(`${API_URL}/api/notes/${activeNoteId}`, { method: 'DELETE' });
      if (res.ok) { setActiveNoteId(null); await fetchNotes(selectedUser!.id); }
    } catch (e) { console.error(e); }
  };

  // ── Biometric Registration ─────────────────────────────────────────────────
  const onRegistrationChunkReady = useCallback(async (chunk: any) => {
    if (!isNewUser || !selectedUser) return;
    const samples = [...registrationSamples, chunk];
    setRegistrationSamples(samples);
    if (samples.length >= REQUIRED_REGISTRATION_CHUNKS) {
      setAuthStatus('analyzing');
      try {
        const res = await fetch(`${API_URL}/api/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: selectedUser.username, passphrase: 'continuous_baseline', samples }),
        });
        if (res.ok) {
          setIsNewUser(false); setAuthStatus('success');
          setRefreshTrigger(p => p + 1); fetchNotes(selectedUser.id);
        } else { alert('Registration failed.'); setRegistrationSamples([]); }
      } catch { alert('Could not reach backend.'); }
    }
  }, [isNewUser, selectedUser, registrationSamples, fetchNotes]);

  const registrationKeystrokes = useKeystrokes(30, onRegistrationChunkReady);

  // ── Live Auth ──────────────────────────────────────────────────────────────
  const onLiveChunkReady = useCallback(async (chunk: any) => {
    if (!selectedUser || isNewUser) return;
    setAuthStatus('analyzing');
    try {
      const res = await fetch(`${API_URL}/api/authenticate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUser.username, passphrase: 'continuous_auth', sample: chunk, is_actual_genuine: !isImposterMode }),
      });
      if (res.ok) {
        const r = await res.json();
        setAuthStatus(r.predicted_genuine ? 'success' : 'failed');
        if (r.confidence_score !== undefined) setTrustScore(r.confidence_score);
        else if (r.distance !== undefined) setTrustScore(Math.max(0, 1 - r.distance / 10));

        // ── Merge B(t) from auth response with live C(t) + E(t) ────────────
        if (r.b_score !== undefined) {
          const W1 = 0.5, W2 = 0.3, W3 = 0.2;
          const r_score = Math.min(1, Math.max(0, W1 * r.b_score + W2 * cScore + W3 * eScore));
          const decision: 'allow' | 'mfa' | 'block' =
            r_score < 0.35 ? 'allow' : r_score <= 0.70 ? 'mfa' : 'block';
          setRiskData({
            b_score: r.b_score,
            c_score: cScore,
            e_score: eScore,
            r_score: parseFloat(r_score.toFixed(4)),
            decision,
          });
          if (r.b_detail) setBDetail(r.b_detail);
          // Track B(t) history for sparkline (keep last 20)
          setBHistory(prev => [...prev.slice(-19), r.b_score]);
        }

        // ── Re-fetch C(t) after every chunk so velocity updates live ───────
        if (!demoAnomalyMode) {
          fetch(`${API_URL}/api/risk/context`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: selectedUser.username,
              ip_address: '',
              current_hour: new Date().getHours(),
              client_timestamp: new Date().toISOString(),
            }),
          }).then(r2 => r2.json()).then(d => {
            if (d.c_score !== undefined) { setCScore(d.c_score); setCSubState(d.sub ?? null); }
          }).catch(() => {});
        }

        setRefreshTrigger(p => p + 1);
      } else { setAuthStatus('failed'); }
    } catch { setAuthStatus('failed'); }
  }, [selectedUser, isNewUser, isImposterMode, cScore, eScore, demoAnomalyMode]);

  const liveKeystrokes = useKeystrokes(45, onLiveChunkReady);
  const activeNote = notes.find(n => n.id === activeNoteId) ?? null;

  const handleSignOut = () => {
    setSelectedUser(null); setAuthStatus('idle');
    setTrustScore(undefined); setRiskData(null);
    setBDetail(null); setBHistory([]); setCScore(0); setCSubState(null);
    setEScore(0); setESubState(null); setDemoAnomalyMode(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full bg-[#0b0f19] text-slate-300 font-sans tracking-tight flex flex-col overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 py-3 w-full h-full flex flex-col gap-3">

        <Navbar
          selectedUser={selectedUser}
          isNewUser={isNewUser}
          authStatus={authStatus}
          trustScore={trustScore}
          isImposterMode={isImposterMode}
          onToggleImposterMode={() => setIsImposterMode(!isImposterMode)}
          demoAnomalyMode={demoAnomalyMode}
          onToggleDemoAnomaly={handleToggleDemoAnomaly}
          onRecalibrate={() => { setIsNewUser(true); setRegistrationSamples([]); setAuthStatus('idle'); setTrustScore(undefined); setRiskData(null); liveKeystrokes.resetKeystrokes(); }}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 min-h-0 w-full bg-[#111827] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden relative">
          {!selectedUser && (
            <div className="absolute inset-0 z-10 bg-[#0b0f19]/80 backdrop-blur-sm flex items-center justify-center p-6">
              <UserSelector onUserSelected={(user, isNew) => { setSelectedUser(user); setIsNewUser(isNew); }} />
            </div>
          )}

          {selectedUser && isNewUser && (
            <CalibrationOverlay
              username={selectedUser.username}
              samplesCollected={registrationSamples.length}
              requiredChunks={REQUIRED_REGISTRATION_CHUNKS}
              keystrokeHandlers={registrationKeystrokes}
            />
          )}

          <DashboardLayout
            visible={!!(selectedUser && !isNewUser)}
            username={selectedUser && !isNewUser ? selectedUser.username : ''}
            refreshTrigger={refreshTrigger}
            liveKeystrokes={liveKeystrokes}
            notes={notes}
            activeNoteId={activeNoteId}
            activeNote={activeNote}
            isLoadingNotes={isLoadingNotes}
            onSelectNote={setActiveNoteId}
            onCreateNewNote={handleCreateNewNote}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            riskData={riskData}
            bDetail={bDetail}
            bHistory={bHistory}
            cSub={cSub}
            eSub={eSub}
            demoAnomalyMode={demoAnomalyMode}
          />
        </main>

      </div>
    </div>
  );
}