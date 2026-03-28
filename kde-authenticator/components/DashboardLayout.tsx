'use client';

import PerformanceDashboard from '@/components/PerformanceDashboard';
import NoteEditor from '@/components/NoteEditor';
import NoteSidebar, { Note } from '@/components/NoteSidebar';

interface DashboardLayoutProps {
  visible: boolean;
  username: string;
  refreshTrigger: number;
  liveKeystrokes: {
    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleKeyUp: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    resetKeystrokes: () => void;
  };
  notes: Note[];
  activeNoteId: string | null;
  activeNote: Note | null;
  isLoadingNotes: boolean;
  onSelectNote: (id: string) => void;
  onCreateNewNote: () => void;
  onSaveNote: (title: string, content: string) => Promise<void>;
  onDeleteNote: () => Promise<void>;
}

export default function DashboardLayout({
  visible,
  username,
  refreshTrigger,
  liveKeystrokes,
  notes,
  activeNoteId,
  activeNote,
  isLoadingNotes,
  onSelectNote,
  onCreateNewNote,
  onSaveNote,
  onDeleteNote,
}: DashboardLayoutProps) {
  return (
    <div className={`flex w-full h-full min-h-[600px] transition-opacity duration-500 gap-6 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

      {/* Left Column: KDE Cloud (top) + Note Editor (bottom) */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        <div className="h-[420px] shrink-0 w-full">
          <PerformanceDashboard username={username} refreshTrigger={refreshTrigger} />
        </div>
        <div className="h-[200px] shrink-0 bg-[#0b0f19] rounded-2xl overflow-hidden border border-[#1a2333] shadow-2xl">
          <NoteEditor
            note={activeNote}
            onSave={onSaveNote}
            onDelete={onDeleteNote}
            inputValue={liveKeystrokes.inputValue}
            setInputValue={liveKeystrokes.setInputValue}
            handleChange={liveKeystrokes.handleChange}
            handleKeyDown={liveKeystrokes.handleKeyDown}
            handleKeyUp={liveKeystrokes.handleKeyUp}
            resetKeystrokes={liveKeystrokes.resetKeystrokes}
          />
        </div>
      </div>

      {/* Right Column: Note Sidebar */}
      <div className="w-80 shrink-0 h-full">
        <NoteSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={onSelectNote}
          onCreateNewNote={onCreateNewNote}
          isLoading={isLoadingNotes}
        />
      </div>
    </div>
  );
}
