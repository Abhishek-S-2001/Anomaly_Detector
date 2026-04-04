import React, { useState, useEffect, useRef } from 'react';
import TermsModal from '@/components/TermsModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface User {
  id: string;
  username: string;
}

interface UserSelectorProps {
  onUserSelected: (user: User | null, isNew: boolean) => void;
}

// ── Password Modal ─────────────────────────────────────────────────────────────
function DeletePasswordModal({
  username,
  onConfirm,
  onCancel,
}: {
  username: string;
  onConfirm: (pwd: string) => void;
  onCancel: () => void;
}) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.trim()) { setError('Password is required.'); return; }
    onConfirm(pwd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111827] border border-rose-900/60 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-rose-900/30 flex items-center justify-center text-rose-400 text-lg shrink-0">
            ⚠
          </div>
          <div>
            <p className="text-slate-200 font-semibold text-sm">Delete Profile</p>
            <p className="text-slate-500 text-xs mt-0.5">
              Enter the password for <span className="text-rose-400 font-mono">{username}</span> to confirm deletion.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(''); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-rose-500 transition-colors text-sm"
            placeholder="Account password…"
          />
          {error && <p className="text-rose-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-rose-800/40 text-rose-400 border border-rose-800/60 rounded-lg hover:bg-rose-700/50 transition-colors text-sm font-semibold"
            >
              Delete Permanently
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function UserSelector({ onUserSelected }: UserSelectorProps) {
  const [users, setUsers]         = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError]   = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteError, setDeleteError]   = useState('');

  // Terms and conditions state
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/`);
      if (response.ok) setUsers(await response.json());
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: User) => onUserSelected(user, false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    // Password validations
    if (!newPassword.trim()) { setPwdError('Password is required.'); return; }
    if (newPassword.length < 4) { setPwdError('Password must be at least 4 characters.'); return; }
    if (newPassword !== confirmPassword) { setPwdError('Passwords do not match.'); return; }
    setPwdError('');

    // Validations passed, show academic consent forms before continuing
    setShowTerms(true);
  };

  const executeUserCreation = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: newUsername.trim(), password: newPassword }),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers([...users, newUser]);
        setNewUsername(''); setNewPassword(''); setConfirmPassword('');
        setIsCreating(false);
        setShowTerms(false);
        onUserSelected(newUser, true);
      } else {
        const err = await response.json();
        setPwdError(err.detail || 'Failed to create user.');
        setShowTerms(false);
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      setShowTerms(false);
    }
  };

  const handleDeleteConfirmed = async (password: string) => {
    if (!deleteTarget) return;
    setDeleteError('');
    try {
      const response = await fetch(`${API_URL}/api/users/${deleteTarget.id}`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        const err = await response.json();
        // surface in the modal via a re-render
        setDeleteError(err.detail || 'Deletion failed.');
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      setDeleteError('Network error. Try again.');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-slate-400">Loading users...</div>;
  }

  return (
    <>
      {/* Delete password modal */}
      {deleteTarget && (
        <DeletePasswordModalWithError
          username={deleteTarget.username}
          serverError={deleteError}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
        />
      )}

      {/* Terms & Conditions modal before creation */}
      {showTerms && (
        <TermsModal 
          username={newUsername.trim()}
          onAccept={executeUserCreation}
          onCancel={() => setShowTerms(false)}
        />
      )}

      <div className="bg-[#111827] border border-slate-800 p-6 rounded-xl shadow-lg w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-200 mb-4 tracking-tight">Select Profile</h2>

        {!isCreating ? (
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-slate-400 text-sm">No profiles found.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {users.map(user => (
                  <div key={user.id} className="flex gap-2">
                    <button
                      onClick={() => handleSelectUser(user)}
                      className="flex-1 text-left px-4 py-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-500/50 transition-all font-medium text-slate-300 hover:text-cyan-400"
                    >
                      {user.username}
                    </button>
                    <button
                      onClick={() => { setDeleteTarget(user); setDeleteError(''); }}
                      className="px-4 shrink-0 rounded-lg bg-slate-800/50 hover:bg-rose-900/50 text-slate-500 hover:text-rose-400 border border-slate-700 hover:border-rose-900/50 transition-all"
                      title="Delete Profile"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsCreating(true)}
              className="w-full mt-4 py-2 border border-dashed border-slate-600 text-slate-400 rounded-lg hover:text-white hover:border-slate-400 transition-colors"
            >
              + Create New Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateUser} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g. alice_wonder"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setPwdError(''); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Min. 4 characters"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setPwdError(''); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Repeat password"
              />
            </div>
            {pwdError && <p className="text-rose-400 text-xs">{pwdError}</p>}
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => { setIsCreating(false); setPwdError(''); setNewPassword(''); setConfirmPassword(''); }}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newUsername.trim()}
                className="flex-1 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-700/50 rounded-lg hover:bg-cyan-600/30 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

// ── Wrapper that can re-show server errors inside the modal ────────────────────
function DeletePasswordModalWithError({
  username,
  serverError,
  onConfirm,
  onCancel,
}: {
  username: string;
  serverError: string;
  onConfirm: (pwd: string) => void;
  onCancel: () => void;
}) {
  const [pwd, setPwd]   = useState('');
  const [err, setErr]   = useState('');
  const inputRef        = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (serverError) setErr(serverError); }, [serverError]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.trim()) { setErr('Password is required.'); return; }
    setErr('');
    onConfirm(pwd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111827] border border-rose-900/60 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-rose-900/30 flex items-center justify-center text-rose-400 text-lg shrink-0">
            ⚠
          </div>
          <div>
            <p className="text-slate-200 font-semibold text-sm">Delete Profile</p>
            <p className="text-slate-500 text-xs mt-0.5">
              Enter the password for <span className="text-rose-400 font-mono">{username}</span> to confirm deletion.
              All biometric data &amp; notes will be <span className="text-rose-400">permanently destroyed</span>.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setErr(''); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-rose-500 transition-colors text-sm"
            placeholder="Account password…"
          />
          {err && (
            <p className="text-rose-400 text-xs flex items-center gap-1">
              <span>✕</span> {err}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2 bg-rose-800/40 text-rose-400 border border-rose-800/60 rounded-lg hover:bg-rose-700/50 transition-colors text-sm font-semibold">
              Delete Permanently
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
