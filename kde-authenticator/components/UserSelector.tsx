import React, { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface User {
  id: string;
  username: string;
}

interface UserSelectorProps {
  onUserSelected: (user: User | null, isNew: boolean) => void;
}

export default function UserSelector({ onUserSelected }: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    onUserSelected(user, false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend expects standard Pydantic schema for creating a user
        body: JSON.stringify({ username: newUsername.trim(), passphrase: "continuous_baseline" })
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers([...users, newUser]);
        setNewUsername('');
        setIsCreating(false);
        // Pass the new user up, flagging as new so the system can prompt for baseline registration
        onUserSelected(newUser, true);
      }
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const handleDeleteUser = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this profile? All biometric baselines and secure notes will be permanently destroyed.")) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        console.error("Failed to delete user from server");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-slate-400">Loading users...</div>;
  }

  return (
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
                    onClick={(e) => handleDeleteUser(e, user.id)}
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
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="e.g. alice_wonder"
              autoFocus
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
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
  );
}
