import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Play, Square, Target } from 'lucide-react';
import {
  InstrumentMode,
  KeymapPreset,
  OCARINA_NOTES,
  SCALE_NOTES_BY_ID,
  ZELDA_SONGS,
  ZeldaSong,
} from '../data/ocarinaData';

interface SongbookPanelProps {
  keymap: KeymapPreset;
  instrumentMode: InstrumentMode;
  selectedSongId: string | null;
  playingDemoId: string | null;
  activeDemoStepIndex: number | null;
  onSelectSong: (song: ZeldaSong) => void;
  onToggleDemo: (song: ZeldaSong) => void;
}

/**
 * Painel lateral de repertório com a partitura integral de Saria's Song
 * e as restantes melodias clássicas de The Legend of Zelda.
 */
export const SongbookPanel: React.FC<SongbookPanelProps> = ({
  keymap,
  instrumentMode,
  selectedSongId,
  playingDemoId,
  activeDemoStepIndex,
  onSelectSong,
  onToggleDemo,
}) => {
  const [showFullSheet, setShowFullSheet] = useState<boolean>(true);

  const getKeyHint = (noteId: keyof typeof SCALE_NOTES_BY_ID): string => {
    const scaleNote = SCALE_NOTES_BY_ID[noteId];
    if (scaleNote.isCoreOcarinaNote) {
      const core = OCARINA_NOTES.find((n) => n.extendedId === noteId);
      if (core) {
        const label = core.keys[keymap].label;
        return label === 'Espaço' ? 'Esp' : label;
      }
    }
    return scaleNote.fullModeKey.label;
  };

  return (
    <aside className="rounded-xl bg-[#111827]/90 border border-slate-800/90 p-5 flex flex-col">
      <div className="flex items-baseline justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-100">
            Guia de Melodias
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Inclui a partitura completa de Saria&apos;s Song e os temas clássicos.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono-code whitespace-nowrap">
          {ZELDA_SONGS.length} temas
        </span>
      </div>

      <div className="mt-4 space-y-3 overflow-y-auto max-h-[680px] pr-1">
        {ZELDA_SONGS.map((song) => {
          const isSelected = selectedSongId === song.id;
          const isPlayingDemo = playingDemoId === song.id;
          const isLong = song.sequence.length > 8;

          // Agrupa compassos para partituras longas (Saria's Song Completa)
          const bars: { startIndex: number; steps: typeof song.demoSteps }[] = [];
          if (isLong) {
            song.demoSteps.forEach((step, idx) => {
              if (step.barStart || bars.length === 0) {
                bars.push({ startIndex: idx, steps: [step] });
              } else {
                bars[bars.length - 1].steps.push(step);
              }
            });
          }

          return (
            <div
              key={song.id}
              className={`rounded-lg border p-3.5 transition-colors ${
                isSelected
                  ? 'bg-slate-800/80 border-amber-400/50'
                  : 'bg-[#0b101b] border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">
                    {song.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {song.portugueseTitle} · {song.tempoLabel}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectSong(song)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title="Ativar guia passo a passo na pauta"
                  >
                    <Target className="w-3.5 h-3.5" />
                    {isSelected ? 'Em prática' : 'Praticar'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleDemo(song)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      isPlayingDemo
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={isPlayingDemo ? 'Parar demonstração' : 'Ouvir demonstração'}
                  >
                    {isPlayingDemo ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        Parar
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        Ouvir
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isLong ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowFullSheet((prev) => !prev)}
                    className="w-full flex items-center justify-between text-xs font-medium text-amber-300/90 hover:text-amber-200 py-1 cursor-pointer"
                  >
                    <span>
                      {showFullSheet ? 'Ocultar partitura completa (17 compassos)' : 'Ver partitura completa (17 compassos)'}
                    </span>
                    {showFullSheet ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showFullSheet && (
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                      {bars.map((bar, barIdx) => (
                        <div
                          key={`${song.id}-bar-${barIdx}`}
                          className="rounded-md bg-slate-900/70 border border-slate-800/80 p-2"
                        >
                          <div className="text-[10px] font-mono-code text-slate-500 mb-1.5">
                            Compasso {barIdx + 1}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {bar.steps.map((step, stepOffset) => {
                              const globalIdx = bar.startIndex + stepOffset;
                              const note = SCALE_NOTES_BY_ID[step.note];
                              const isCurrentDemo =
                                isPlayingDemo && activeDemoStepIndex === globalIdx;

                              return (
                                <div
                                  key={`${song.id}-step-${globalIdx}`}
                                  className={`min-w-[34px] flex flex-col items-center rounded border px-1.5 py-1 transition-colors ${
                                    isCurrentDemo
                                      ? 'bg-amber-500/25 border-amber-400 text-white'
                                      : 'bg-[#090d16] border-slate-800'
                                  }`}
                                >
                                  <span
                                    className={`text-[11px] font-bold font-mono-code ${
                                      note.isAButton
                                        ? 'text-blue-400'
                                        : note.isCoreOcarinaNote
                                          ? 'text-amber-400'
                                          : 'text-emerald-400'
                                    }`}
                                  >
                                    {note.musicalName}
                                  </span>
                                  <span className="text-[10px] font-mono-code text-slate-400">
                                    {getKeyHint(step.note)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-6 gap-1.5">
                  {song.sequence.map((noteId, idx) => {
                    const note = SCALE_NOTES_BY_ID[noteId];
                    const keyLabel = getKeyHint(noteId);
                    const isCurrentDemo = isPlayingDemo && activeDemoStepIndex === idx;

                    return (
                      <div
                        key={`${song.id}-step-${idx}`}
                        className={`flex flex-col items-center rounded-md border py-1.5 px-1 transition-colors ${
                          isCurrentDemo
                            ? 'bg-amber-500/25 border-amber-400'
                            : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${
                            note.isAButton ? 'text-blue-400' : 'text-amber-400'
                          }`}
                        >
                          {note.glyph}
                        </span>
                        <span className="text-[10px] font-mono-code text-slate-300 mt-0.5 truncate max-w-full">
                          {keyLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
