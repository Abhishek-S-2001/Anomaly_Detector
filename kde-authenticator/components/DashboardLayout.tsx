'use client';

import PerformanceDashboard from '@/components/PerformanceDashboard';
import NoteEditor from '@/components/NoteEditor';
import NoteSidebar, { Note } from '@/components/NoteSidebar';
import RiskGauge, { RiskData } from '@/components/RiskGauge';
import CalcPanel from '@/components/CalcPanel';

interface DashboardLayoutProps {
  visible: boolean;
  username: string;
  refreshTrigger: number;
  liveKeystrokes: any;
  notes: Note[];
  activeNoteId: string | null;
  activeNote: Note | null;
  isLoadingNotes: boolean;
  onSelectNote: (id: string) => void;
  onCreateNewNote: () => void;
  onSaveNote: (title: string, content: string) => Promise<void>;
  onDeleteNote: () => Promise<void>;
  riskData: RiskData | null;
  bDetail: Record<string, number> | null;
  bHistory: number[];
  cSub: Record<string, number> | null;
  eSub: Record<string, number> | null;
  demoAnomalyMode: boolean;
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
  riskData,
  bDetail,
  bHistory,
  cSub,
  eSub,
  demoAnomalyMode,
}: DashboardLayoutProps) {
  return (
    // Fills the <main> container — no own h-screen, parent controls height
    <div className={`flex w-full h-full gap-3 p-3 overflow-hidden transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

      {/* ── COL A: Note Sidebar (fixed 240px) ── */}
      <div className="w-[240px] shrink-0 flex flex-col min-h-0">
        <NoteSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={onSelectNote}
          onCreateNewNote={onCreateNewNote}
          isLoading={isLoadingNotes}
        />
      </div>

      {/* ── COL B: KDE Cloud + Risk Gauge + Note Editor (flex grow) ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">


        <div className="w-full h-[480px] shrink-0 rounded-xl border border-slate-800/60 bg-[#0b0f19] overflow-hidden shadow-xl shadow-cyan-900/10">
          <PerformanceDashboard userID={username} refreshTrigger={refreshTrigger} risk={riskData} />
        </div>

        <div className="flex-1 min-h-0 w-full rounded-xl border border-[#1a2333] bg-[#0b0f19] overflow-hidden flex flex-col">
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

      {/* ── COL C: Live Calculations (fixed 260px) ── */}
      <div className="w-[260px] shrink-0 flex flex-col min-h-0">
        <CalcPanel
          risk={riskData}
          bDetail={bDetail as any}
          bHistory={bHistory}
          cSub={cSub}
          eSub={eSub}
          rawLogDensity={bDetail?.log_density ?? null}
          demoAnomalyMode={demoAnomalyMode}
        />
      </div>
    </div>
  );
}