import React from 'react';

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

interface NoteSidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNewNote: () => void;
  isLoading: boolean;
}

export default function NoteSidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNewNote,
  isLoading
}: NoteSidebarProps) {
  return (
    <div className="w-full bg-[#0d121f] flex flex-col h-full rounded-2xl border border-[#1a2333] overflow-hidden shadow-2xl">
      <div className="px-5 py-4 border-b border-[#1a2333] flex flex-col justify-center shrink-0 bg-[#111827]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-300 tracking-wide text-sm">Secure Vault</h3>
          <button
            onClick={onCreateNewNote}
            className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-400 px-3 py-1.5 rounded-md border border-cyan-800/50 transition-colors"
            title="New Note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar flex flex-col bg-[#0b0f19]">
        {isLoading ? (
          <div className="flex flex-col space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-16 bg-slate-800/50 rounded-xl border border-[#1a2333]"></div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-xs text-slate-500 italic mb-4">No notes physically stored yet.</p>
            <button 
              onClick={onCreateNewNote}
              className="text-xs bg-cyan-900/30 text-cyan-400 px-4 py-2 rounded-full hover:bg-cyan-800/40 transition-colors border border-cyan-900/50"
            >
              Start Typing
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-3 pb-2 w-full">
            {notes.map(note => {
              const isActive = activeNoteId === note.id;
              return (
                <button
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all outline-none focus:outline-none flex flex-col border ${
                    isActive 
                      ? 'bg-slate-800 border-cyan-700/50 text-cyan-50 shadow-[0_2px_10px_rgba(8,145,178,0.15)] ring-1 ring-cyan-500/20' 
                      : 'bg-[#111827] border-[#1a2333] text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold truncate w-full tracking-wide text-sm mb-1">
                    {note.title.trim() || "Untitled Note"}
                  </div>
                  <div className="text-[10px] opacity-60 font-mono tracking-widest uppercase">
                    {note.created_at ? new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft Workspace'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
