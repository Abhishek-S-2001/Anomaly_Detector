'use client';

import { useState, useCallback, useEffect } from 'react';
import { Note } from '@/components/NoteSidebar';
import { AuthStatus } from '@/components/SecurityBadge';
import { useKeystrokes } from '@/hooks/useKeystrokes';
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

  const [notes, setNotes]               = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [registrationSamples, setRegistrationSamples] = useState<any[]>([]);

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
    const url  = activeNoteId ? `${API_URL}/api/notes/${activeNoteId}` : `${API_URL}/api/notes/${selectedUser.id}`;
    const method = activeNoteId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) });
      if (res.ok) {
        await fetchNotes(selectedUser.id);
        if (!activeNoteId) { const n = await res.json(); if (n?.id) setActiveNoteId(n.id); }
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
        body: JSON.stringify({ username: selectedUser.username, passphrase: 'continuous_auth', sample: chunk, is_actual_genuine: true }),
      });
      if (res.ok) {
        const r = await res.json();
        setAuthStatus(r.predicted_genuine ? 'success' : 'failed');
        if (r.confidence_score !== undefined) setTrustScore(r.confidence_score);
        else if (r.distance !== undefined) setTrustScore(Math.max(0, 1 - r.distance / 10));
        setRefreshTrigger(p => p + 1);
      } else { setAuthStatus('failed'); }
    } catch { setAuthStatus('failed'); }
  }, [selectedUser, isNewUser]);

  const liveKeystrokes = useKeystrokes(45, onLiveChunkReady);
  const activeNote = notes.find(n => n.id === activeNoteId) ?? null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-slate-300 font-sans tracking-tight flex flex-col">
      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full flex-1 flex flex-col space-y-8">

        <Navbar
          selectedUser={selectedUser}
          isNewUser={isNewUser}
          authStatus={authStatus}
          trustScore={trustScore}
          onRecalibrate={() => { setIsNewUser(true); setRegistrationSamples([]); setAuthStatus('idle'); setTrustScore(undefined); liveKeystrokes.resetKeystrokes(); }}
          onSignOut={() => { setSelectedUser(null); setAuthStatus('idle'); setTrustScore(undefined); }}
        />

        <main className="flex-1 w-full bg-[#111827] rounded-2xl shadow-2xl border border-slate-800 flex flex-col md:flex-row overflow-hidden relative">
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
            username={selectedUser?.username ?? ''}
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
          />
        </main>

      </div>
    </div>
  );
}