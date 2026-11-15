import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { ExtendedNoteId, SCALE_NOTES_BY_ID, ZeldaSong } from '../data/ocarinaData';

export interface PlayedNoteEntry {
  uid: number;
  noteId: ExtendedNoteId;
}

interface MusicalStaffProps {
  playedNotes: PlayedNoteEntry[];
  selectedSong: ZeldaSong | null;
  practiceIndex: number;
  activeDemoStepIndex: number | null;
  matchedSong: ZeldaSong | null;
  onClearStaff: () => void;
  onClearPractice: () => void;
}

/**
 * Pauta musical de 4 linhas inspirada em Ocarina of Time.
 * Suporta tanto temas curtos (6 notas) como partituras longas por compassos (ex: Saria's Song Completa).
 */
export const MusicalStaff: React.FC<MusicalStaffProps> = ({
  playedNotes,
  selectedSong,
  practiceIndex,
  activeDemoStepIndex,
  matchedSong,
  onClearStaff,
  onClearPractice,
}) => {
  // Mapeia escala C5 (0) .. F6 (10) para percentagem vertical dentro da pauta
  const levelToTopPercent = (scaleLevel: number) => {
    const clamped = Math.max(0, Math.min(10, scaleLevel));
    return 86 - clamped * 7;
  };

  // Para músicas longas (ex: 87 notas), mostra o bloco/janela atual (~9 notas) em torno do passo ativo
  const activeStep =
    activeDemoStepIndex !== null && selectedSong
      ? activeDemoStepIndex
      : practiceIndex;

  const isLongSong = (selectedSong?.sequence.length ?? 0) > 8;
  const windowSize = 9;
  const windowStart =
    selectedSong && isLongSong
      ? Math.min(
          Math.max(0, Math.floor(activeStep / windowSize) * windowSize),
          Math.max(0, selectedSong.sequence.length - windowSize),
        )
      : 0;
  const visibleSequence = selectedSong
    ? isLongSong
      ? selectedSong.sequence.slice(windowStart, windowStart + windowSize)
      : selectedSong.sequence
    : [];

  return (
    <div className="w-full rounded-xl bg-[#111827]/80 border border-slate-800/90 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-sm sm:text-base font-semibold tracking-wide text-slate-100">
            {selectedSong ? `Modo Prática: ${selectedSong.title}` : 'Pauta Musical'}
          </h2>
          {selectedSong && (
            <span className="text-xs text-amber-300/90 font-mono-code">
              {Math.min(activeStep, selectedSong.sequence.length)}/{selectedSong.sequence.length} notas
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedSong && (
            <button
              type="button"
              onClick={onClearPractice}
              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Modo Livre
            </button>
          )}
          <button
            type="button"
            onClick={onClearStaff}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Limpar pauta"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      </div>

      {/* Área da pauta de 4 linhas */}
      <div className="relative h-32 w-full rounded-lg bg-[#090d16]/90 border border-slate-800/80 overflow-hidden px-4">
        <div className="absolute inset-x-4 top-[22%] h-px bg-slate-700/65" />
        <div className="absolute inset-x-4 top-[42%] h-px bg-slate-700/65" />
        <div className="absolute inset-x-4 top-[62%] h-px bg-slate-700/65" />
        <div className="absolute inset-x-4 top-[82%] h-px bg-slate-700/65" />

        <div
          className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-2xl text-slate-600 select-none"
          aria-hidden="true"
        >
          𝄞
        </div>

        {selectedSong ? (
          <div
            className="relative h-full pl-9 pr-2 grid items-center gap-1"
            style={{
              gridTemplateColumns: `repeat(${visibleSequence.length}, minmax(0, 1fr))`,
            }}
          >
            {visibleSequence.map((noteId, localIdx) => {
              const globalIdx = windowStart + localIdx;
              const note = SCALE_NOTES_BY_ID[noteId];
              const isCompleted = globalIdx < activeStep;
              const isCurrent = globalIdx === activeStep;

              return (
                <div
                  key={`${selectedSong.id}-staff-${globalIdx}`}
                  className="relative h-full flex justify-center"
                >
                  <div
                    style={{ top: `${levelToTopPercent(note.scaleLevel)}%` }}
                    className={`absolute -translate-y-1/2 flex flex-col items-center transition-transform duration-150 ${
                      isCurrent ? 'scale-115 z-10' : 'scale-100'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                        isCompleted
                          ? note.isAButton
                            ? 'bg-blue-600 border-blue-300 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                            : 'bg-amber-500 border-amber-200 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                          : isCurrent
                            ? 'bg-slate-900 border-amber-400 text-amber-300 ring-2 ring-amber-400/45'
                            : 'bg-slate-900/90 border-slate-700 text-slate-400'
                      }`}
                    >
                      {note.glyph}
                    </div>
                    <span className="mt-0.5 text-[9px] font-mono-code text-slate-400">
                      {note.musicalName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : playedNotes.length === 0 ? (
          <div className="h-full pl-8 flex items-center justify-center text-xs sm:text-sm text-slate-400">
            Toca nos orifícios da ocarina ou usa o teclado para ver as notas na pauta.
          </div>
        ) : (
          <div className="relative h-full pl-9 pr-2 flex items-center gap-4 sm:gap-5 overflow-x-auto">
            {playedNotes.map((entry, idx) => {
              const note = SCALE_NOTES_BY_ID[entry.noteId];
              const isLatest = idx === playedNotes.length - 1;

              return (
                <div key={entry.uid} className="relative h-full w-9 shrink-0 flex justify-center">
                  <div
                    style={{ top: `${levelToTopPercent(note.scaleLevel)}%` }}
                    className={`absolute -translate-y-1/2 flex flex-col items-center transition-transform duration-150 ${
                      isLatest ? 'scale-110' : 'opacity-85'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border ${
                        note.isAButton
                          ? 'bg-blue-600 border-blue-300 text-white'
                          : note.isCoreOcarinaNote
                            ? 'bg-amber-400 border-amber-200 text-slate-950'
                            : 'bg-emerald-400 border-emerald-200 text-slate-950'
                      }`}
                    >
                      {note.glyph}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmação de melodia reconhecida */}
      {matchedSong && (
        <div
          role="status"
          className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-amber-500/12 border border-amber-400/35 px-3.5 py-2.5 text-sm"
        >
          <div className="flex items-center gap-2.5 text-amber-200">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-amber-100">
                Melodia concluída: {matchedSong.title}
              </span>
              <span className="hidden sm:inline text-amber-200/80">
                {' '}· {matchedSong.effect}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
