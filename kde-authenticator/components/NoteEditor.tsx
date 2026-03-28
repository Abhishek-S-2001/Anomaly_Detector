import React, { useEffect, useState } from 'react';
import { Note } from './NoteSidebar';

interface NoteEditorProps {
  note: Note | null;
  onSave: (title: string, content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  
  // Keystroke hook passthroughs
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  resetKeystrokes: () => void;
}

export default function NoteEditor({
  note,
  onSave,
  onDelete,
  inputValue,
  setInputValue,
  handleKeyDown,
  handleKeyUp,
  handleChange,
  resetKeystrokes,
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync incoming note text with our editor tools when the current note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setInputValue(note.content);
      resetKeystrokes(); // Clear previously buffered keystrokes on note switch
    } else {
      setTitle('');
      setInputValue('');
      resetKeystrokes();
    }
  }, [note?.id]); // Only re-run if ID changes to prevent cursor disruption

  const handleSaveWrapper = async () => {
    setIsSaving(true);
    try {
      await onSave(title, inputValue);
    } finally {
      setIsSaving(false);
    }
  };

  // Removed explicit placeholder render to allow writing new notes when note is null

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f19] h-full rounded-r-2xl relative border-t border-r border-b border-[#1a2333]">
      {/* Editor Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#1a2333]/60 bg-[#0d121f]">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Secure Note Title..."
          className="bg-transparent border-none text-xl font-bold text-slate-200 focus:outline-none focus:ring-0 w-1/2 placeholder-slate-600"
        />
        
        <div className="flex space-x-3 items-center">
          {note && (
            <button 
              onClick={onDelete}
              className="text-xs font-semibold text-rose-500/70 hover:text-rose-400 px-3 py-1.5 transition-colors"
            >
              Delete
            </button>
          )}
          <button 
            onClick={handleSaveWrapper}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-cyan-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20 disabled:opacity-50"
          >
            {isSaving ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            <span>{isSaving ? "Saving..." : "Save Securely"}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <textarea
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder="Begin writing... The system analyzes your unique typing signature silently in the background."
        className="flex-1 w-full bg-transparent p-6 text-slate-300 resize-none focus:outline-none focus:ring-0 leading-relaxed custom-scrollbar tracking-wide"
        autoFocus
      />
    </div>
  );
}
