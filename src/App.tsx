import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Play, Square, Trash2, Volume2 } from 'lucide-react';
import { ocarinaAudio } from './audio/ocarinaAudio';
import { AudioConfigModal } from './components/AudioConfigModal';
import { MusicalStaff, PlayedNoteEntry } from './components/MusicalStaff';
import { NoteTriggerEvent, OcarinaSvg } from './components/OcarinaSvg';
import { SongbookPanel } from './components/SongbookPanel';
import {
  Articulation,
  ExtendedNoteId,
  InstrumentMode,
  KeymapPreset,
  NoteId,
  OCARINA_NOTES,
  SCALE_NOTES,
  ZELDA_SONGS,
  ZeldaSong,
} from './data/ocarinaData';

const N64_KEY_TO_NOTE: Record<string, ExtendedNoteId> = {
  Space: 'D5',
  KeyZ: 'D5',
  Digit1: 'D5',
  KeyS: 'F5',
  ArrowDown: 'F5',
  Digit2: 'F5',
  KeyD: 'A5',
  ArrowRight: 'A5',
  Digit3: 'A5',
  KeyA: 'B5',
  ArrowLeft: 'B5',
  Digit4: 'B5',
  KeyW: 'D6',
  ArrowUp: 'D6',
  Digit5: 'D6',
};

const FULL_KEY_TO_NOTE: Record<string, ExtendedNoteId> = {
  ...N64_KEY_TO_NOTE,
  KeyQ: 'C5',
  KeyE: 'E5',
  KeyR: 'G5',
  KeyI: 'C6',
  KeyO: 'E6',
  KeyP: 'F6',
};

const ARTICULATION_OPTIONS: { id: Articulation; label: string }[] = [
  { id: 'short', label: 'Curta' },
  { id: 'med', label: 'Média' },
  { id: 'long', label: 'Longa' },
  { id: 'loop', label: 'Sustentar' },
];

interface RecordedNoteEvent {
  noteId: ExtendedNoteId;
  startOffsetMs: number;
  durationMs: number;
  articulation: Articulation;
}

export default function App() {
  const [articulation, setArticulation] = useState<Articulation>('med');
  const [keymap, setKeymap] = useState<KeymapPreset>('wasd');
  const [instrumentMode, setInstrumentMode] = useState<InstrumentMode>('n64');
  const [volume, setVolume] = useState<number>(85);
  const [reverb, setReverb] = useState<number>(42);
  const [activeNotes, setActiveNotes] = useState<Set<ExtendedNoteId>>(new Set());
  const [playedNotes, setPlayedNotes] = useState<PlayedNoteEntry[]>([]);
  const [selectedSong, setSelectedSong] = useState<ZeldaSong | null>(null);
  const [practiceIndex, setPracticeIndex] = useState<number>(0);
  const [matchedSong, setMatchedSong] = useState<ZeldaSong | null>(null);
  const [playingDemoId, setPlayingDemoId] = useState<string | null>(null);
  const [activeDemoStepIndex, setActiveDemoStepIndex] = useState<number | null>(null);
  const [lastNoteEvent, setLastNoteEvent] = useState<NoteTriggerEvent | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingCount, setRecordingCount] = useState<number>(0);
  const [recordedEvents, setRecordedEvents] = useState<RecordedNoteEvent[]>([]);
  const [isPlayingRecording, setIsPlayingRecording] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [customFileNames, setCustomFileNames] = useState<Partial<Record<NoteId, string>>>({});

  const noteUidRef = useRef(0);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const demoTimersRef = useRef<number[]>([]);
  const recordingPlaybackTimersRef = useRef<number[]>([]);
  const matchTimerRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const recordStartTimeRef = useRef<number | null>(null);
  const recordedBufferRef = useRef<RecordedNoteEvent[]>([]);
  const openRecordedIndexRef = useRef<number | null>(null);

  // Pré-carregar todos os 20 ficheiros .wav na montagem
  useEffect(() => {
    void ocarinaAudio.preloadAll();
    return () => {
      demoTimersRef.current.forEach((id) => window.clearTimeout(id));
      recordingPlaybackTimersRef.current.forEach((id) => window.clearTimeout(id));
      ocarinaAudio.stopAll();
    };
  }, []);

  const clearDemoTimers = useCallback(() => {
    demoTimersRef.current.forEach((id) => window.clearTimeout(id));
    demoTimersRef.current = [];
  }, []);

  const stopDemo = useCallback(() => {
    clearDemoTimers();
    setPlayingDemoId(null);
    setActiveDemoStepIndex(null);
    setActiveNotes(new Set());
    ocarinaAudio.stopAll();
  }, [clearDemoTimers]);

  const stopRecordingPlayback = useCallback(() => {
    recordingPlaybackTimersRef.current.forEach((id) => window.clearTimeout(id));
    recordingPlaybackTimersRef.current = [];
    setIsPlayingRecording(false);
    setActiveNotes(new Set());
    ocarinaAudio.stopAll();
  }, []);

  const checkSongMatch = useCallback((recentNotes: ExtendedNoteId[]) => {
    const found = ZELDA_SONGS.find((song) => {
      if (recentNotes.length < song.sequence.length) return false;
      const slice = recentNotes.slice(-song.sequence.length);
      return song.sequence.every((n, i) => n === slice[i]);
    });

    if (found) {
      setMatchedSong(found);
      if (matchTimerRef.current) window.clearTimeout(matchTimerRef.current);
      matchTimerRef.current = window.setTimeout(() => {
        setMatchedSong(null);
      }, 4500);
    }
  }, []);

  const triggerNote = useCallback(
    (noteId: ExtendedNoteId, overrideArticulation?: Articulation, fromAutomated = false) => {
      if (!fromAutomated && playingDemoId) {
        stopDemo();
      }
      if (!fromAutomated && isPlayingRecording) {
        stopRecordingPlayback();
      }

      const art = overrideArticulation ?? articulation;
      void ocarinaAudio.playNote(noteId, art);

      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.add(noteId);
        return next;
      });

      noteUidRef.current += 1;
      const uid = noteUidRef.current;
      setLastNoteEvent({ uid, noteId });

      if (!fromAutomated) {
        // Registo de gravação com temporização exata relativa à primeira nota
        if (isRecordingRef.current) {
          const now = performance.now();
          if (recordStartTimeRef.current === null) {
            recordStartTimeRef.current = now;
          }
          if (openRecordedIndexRef.current !== null) {
            const prevEvt = recordedBufferRef.current[openRecordedIndexRef.current];
            if (prevEvt) {
              prevEvt.durationMs = Math.max(
                100,
                now - (recordStartTimeRef.current + prevEvt.startOffsetMs),
              );
            }
          }
          const idx = recordedBufferRef.current.length;
          recordedBufferRef.current.push({
            noteId,
            startOffsetMs: now - recordStartTimeRef.current,
            durationMs: 360,
            articulation: art,
          });
          openRecordedIndexRef.current = idx;
          setRecordingCount(recordedBufferRef.current.length);
        }

        const entry: PlayedNoteEntry = { uid, noteId };

        setPlayedNotes((prev) => {
          const next = [...prev, entry].slice(-14);
          checkSongMatch(next.map((item) => item.noteId));
          return next;
        });

        if (selectedSong) {
          setPracticeIndex((prevIdx) => {
            const expected = selectedSong.sequence[prevIdx];
            if (noteId === expected) {
              const nextIdx = prevIdx + 1;
              if (nextIdx >= selectedSong.sequence.length) {
                setMatchedSong(selectedSong);
                if (matchTimerRef.current) window.clearTimeout(matchTimerRef.current);
                matchTimerRef.current = window.setTimeout(() => {
                  setMatchedSong(null);
                }, 4500);
                return 0;
              }
              return nextIdx;
            }
            return noteId === selectedSong.sequence[0] ? 1 : 0;
          });
        }
      }
    },
    [
      articulation,
      checkSongMatch,
      isPlayingRecording,
      playingDemoId,
      selectedSong,
      stopDemo,
      stopRecordingPlayback,
    ],
  );

  const releaseNote = useCallback(
    (noteId: ExtendedNoteId) => {
      if (isRecordingRef.current && openRecordedIndexRef.current !== null && recordStartTimeRef.current !== null) {
        const openEvt = recordedBufferRef.current[openRecordedIndexRef.current];
        if (openEvt && openEvt.noteId === noteId) {
          openEvt.durationMs = Math.max(
            120,
            performance.now() - (recordStartTimeRef.current + openEvt.startOffsetMs),
          );
          openRecordedIndexRef.current = null;
        }
      }

      setActiveNotes((prev) => {
        if (!prev.has(noteId)) return prev;
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });

      if (articulation === 'loop') {
        ocarinaAudio.stopNoteIfMatching(noteId);
      }
    },
    [articulation],
  );

  // Controlos de teclado globais adaptados ao modo (5 notas N64 vs Escala Completa)
  useEffect(() => {
    const keyMap = instrumentMode === 'full' ? FULL_KEY_TO_NOTE : N64_KEY_TO_NOTE;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const noteId = keyMap[e.code];
      if (!noteId) return;

      e.preventDefault();
      if (e.repeat || pressedKeysRef.current.has(e.code)) return;

      pressedKeysRef.current.add(e.code);
      triggerNote(noteId);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const noteId = keyMap[e.code];
      if (!noteId) return;

      pressedKeysRef.current.delete(e.code);
      releaseNote(noteId);
    };

    const handleBlur = () => {
      pressedKeysRef.current.clear();
      setActiveNotes(new Set());
      ocarinaAudio.stopAll();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [instrumentMode, isModalOpen, releaseNote, triggerNote]);

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    ocarinaAudio.setVolume(val / 100);
  };

  const handleReverbChange = (val: number) => {
    setReverb(val);
    ocarinaAudio.setReverb(val / 100);
  };

  const handleSelectSong = (song: ZeldaSong) => {
    if (selectedSong?.id === song.id) {
      setSelectedSong(null);
      setPracticeIndex(0);
    } else {
      setSelectedSong(song);
      setPracticeIndex(0);
      setMatchedSong(null);
      setInstrumentMode(song.isFullScale ? 'full' : 'n64');
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
      if (openRecordedIndexRef.current !== null && recordStartTimeRef.current !== null) {
        const openEvt = recordedBufferRef.current[openRecordedIndexRef.current];
        if (openEvt) {
          openEvt.durationMs = Math.max(
            120,
            performance.now() - (recordStartTimeRef.current + openEvt.startOffsetMs),
          );
        }
        openRecordedIndexRef.current = null;
      }
      setRecordedEvents([...recordedBufferRef.current]);
      return;
    }

    if (playingDemoId) stopDemo();
    if (isPlayingRecording) stopRecordingPlayback();

    recordedBufferRef.current = [];
    recordStartTimeRef.current = null;
    openRecordedIndexRef.current = null;
    isRecordingRef.current = true;
    setRecordingCount(0);
    setRecordedEvents([]);
    setIsRecording(true);
  };

  const handleTogglePlayRecording = () => {
    if (isPlayingRecording) {
      stopRecordingPlayback();
      return;
    }
    if (recordedEvents.length === 0) return;
    if (playingDemoId) stopDemo();
    if (isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
    }

    setIsPlayingRecording(true);
    let maxEndMs = 0;

    recordedEvents.forEach((evt) => {
      const startTimer = window.setTimeout(() => {
        triggerNote(evt.noteId, evt.articulation, true);
      }, evt.startOffsetMs);

      const endOffset = evt.startOffsetMs + evt.durationMs;
      if (endOffset > maxEndMs) maxEndMs = endOffset;

      const releaseTimer = window.setTimeout(() => {
        setActiveNotes((prev) => {
          const next = new Set(prev);
          next.delete(evt.noteId);
          return next;
        });
        if (evt.articulation === 'loop') {
          ocarinaAudio.stopNoteIfMatching(evt.noteId);
        }
      }, endOffset);

      recordingPlaybackTimersRef.current.push(startTimer, releaseTimer);
    });

    const finishTimer = window.setTimeout(() => {
      setIsPlayingRecording(false);
      setActiveNotes(new Set());
    }, maxEndMs + 120);
    recordingPlaybackTimersRef.current.push(finishTimer);
  };

  const handleClearRecording = () => {
    stopRecordingPlayback();
    recordedBufferRef.current = [];
    setRecordedEvents([]);
    setRecordingCount(0);
  };

  const handleToggleDemo = (song: ZeldaSong) => {
    if (playingDemoId === song.id) {
      stopDemo();
      return;
    }

    if (isPlayingRecording) stopRecordingPlayback();
    stopDemo();
    setPlayingDemoId(song.id);
    setSelectedSong(song);
    setPracticeIndex(0);
    if (song.isFullScale) {
      setInstrumentMode('full');
    }

    let elapsed = 80;
    song.demoSteps.forEach((step, idx) => {
      const startTimer = window.setTimeout(() => {
        setActiveDemoStepIndex(idx);
        triggerNote(step.note, step.articulation, true);
      }, elapsed);

      const releaseTimer = window.setTimeout(() => {
        setActiveNotes((prev) => {
          const next = new Set(prev);
          next.delete(step.note);
          return next;
        });
      }, elapsed + Math.max(150, step.durationMs - 65));

      demoTimersRef.current.push(startTimer, releaseTimer);
      elapsed += step.durationMs;
    });

    const endTimer = window.setTimeout(() => {
      setPlayingDemoId(null);
      setActiveDemoStepIndex(null);
      setActiveNotes(new Set());
    }, elapsed + 180);
    demoTimersRef.current.push(endTimer);
  };


  const handleUploadCustomAudio = async (noteId: NoteId, file: File) => {
    const name = await ocarinaAudio.setCustomAudioFile(noteId, file);
    setCustomFileNames((prev) => ({ ...prev, [noteId]: name }));
  };

  const handleResetCustomAudio = async (noteId: NoteId) => {
    await ocarinaAudio.resetCustomAudio(noteId);
    setCustomFileNames((prev) => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  };

  const guidedNoteId =
    selectedSong && activeDemoStepIndex === null
      ? selectedSong.sequence[practiceIndex] ?? null
      : null;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Cabeçalho minimalista para publicação */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="font-display text-lg sm:text-xl font-bold tracking-wide text-slate-100 whitespace-nowrap">
            Ocarina do Tempo
          </span>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Palco principal da Ocarina */}
          <section
            id="instrumento"
            className="lg:col-span-8 rounded-xl bg-[#111827]/70 border border-slate-800/90 p-5 sm:p-6 space-y-6"
          >
            {/* Cabeçalho do instrumento + controlos de modo, articulação e teclado */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-semibold text-slate-100">
                  Simulador de Ocarina
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Clica nos orifícios com o rato, toca no ecrã ou usa o teclado.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Alternar entre 5 notas N64 e Escala Completa (11 notas para Saria's Song) */}
                <div
                  className="inline-flex p-1 rounded-lg bg-[#090d16] border border-slate-800"
                  role="group"
                  aria-label="Modo do instrumento"
                >
                  <button
                    type="button"
                    onClick={() => setInstrumentMode('n64')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      instrumentMode === 'n64'
                        ? 'bg-slate-800 text-amber-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    5 Notas (N64)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstrumentMode('full')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      instrumentMode === 'full'
                        ? 'bg-slate-800 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Escala Completa (C5–F6)
                  </button>
                </div>

                {/* Controlo de articulação */}
                <div
                  className="inline-flex p-1 rounded-lg bg-[#090d16] border border-slate-800"
                  role="group"
                  aria-label="Duração da nota"
                >
                  {ARTICULATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setArticulation(opt.id)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        articulation === opt.id
                          ? 'bg-slate-800 text-amber-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Alternador visual de teclas */}
                <div
                  className="inline-flex p-1 rounded-lg bg-[#090d16] border border-slate-800"
                  role="group"
                  aria-label="Disposição do teclado"
                >
                  <button
                    type="button"
                    onClick={() => setKeymap('wasd')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      keymap === 'wasd'
                        ? 'bg-slate-800 text-slate-100'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    WASD + Espaço
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeymap('arrows')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      keymap === 'arrows'
                        ? 'bg-slate-800 text-slate-100'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Setas + Z
                  </button>
                </div>
              </div>
            </div>

            {/* Ocarina estilizada em SVG */}
            <div className="py-1">
              <OcarinaSvg
                activeNotes={activeNotes}
                guidedNoteId={guidedNoteId}
                lastNoteEvent={lastNoteEvent}
                keymap={keymap}
                instrumentMode={instrumentMode}
                onNotePress={(id) => triggerNote(id)}
                onNoteRelease={releaseNote}
              />
            </div>

            {/* Barra de botões táteis (5 notas N64 ou Escala Completa de 11 notas) */}
            <div className="space-y-4">
              {instrumentMode === 'n64' ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {OCARINA_NOTES.map((note) => {
                    const isActive = activeNotes.has(note.extendedId);
                    const isGuided = guidedNoteId === note.extendedId;
                    const keyInfo = note.keys[keymap];

                    return (
                      <button
                        key={note.id}
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          triggerNote(note.extendedId);
                        }}
                        onPointerUp={() => releaseNote(note.extendedId)}
                        onPointerLeave={() => releaseNote(note.extendedId)}
                        onPointerCancel={() => releaseNote(note.extendedId)}
                        className={`min-h-[54px] rounded-lg border px-3 py-2 flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer ${
                          isActive
                            ? note.isAButton
                              ? 'bg-blue-600/25 border-blue-400 text-white translate-y-[1px]'
                              : 'bg-amber-500/20 border-amber-400 text-white translate-y-[1px]'
                            : isGuided
                              ? 'bg-[#0b101b] border-amber-400/75 text-slate-100 ring-1 ring-amber-400/35'
                              : 'bg-[#0b101b] border-slate-800 text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              note.isAButton ? 'text-blue-400' : 'text-amber-400'
                            }`}
                          >
                            {note.glyph}
                          </span>
                          <span className="text-xs font-medium text-slate-300">
                            {note.solfege}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono-code text-slate-400">
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-200 border border-slate-700">
                            {keyInfo.label}
                          </kbd>
                          <span>{note.musicalName}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-1.5">
                  {SCALE_NOTES.map((note) => {
                    const isActive = activeNotes.has(note.id);
                    const isGuided = guidedNoteId === note.id;
                    const coreNote = note.isCoreOcarinaNote
                      ? OCARINA_NOTES.find((n) => n.extendedId === note.id)
                      : undefined;
                    const keyLabel = coreNote
                      ? coreNote.keys[keymap].label === 'Espaço'
                        ? 'Esp'
                        : coreNote.keys[keymap].label
                      : note.fullModeKey.label;

                    return (
                      <button
                        key={note.id}
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          triggerNote(note.id);
                        }}
                        onPointerUp={() => releaseNote(note.id)}
                        onPointerLeave={() => releaseNote(note.id)}
                        onPointerCancel={() => releaseNote(note.id)}
                        className={`min-h-[58px] rounded-lg border px-1.5 py-2 flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer ${
                          isActive
                            ? note.isAButton
                              ? 'bg-blue-600/30 border-blue-400 text-white translate-y-[1px]'
                              : note.isCoreOcarinaNote
                                ? 'bg-amber-500/25 border-amber-400 text-white translate-y-[1px]'
                                : 'bg-emerald-500/25 border-emerald-400 text-white translate-y-[1px]'
                            : isGuided
                              ? 'bg-[#0b101b] border-amber-400 text-slate-100 ring-2 ring-amber-400/45'
                              : 'bg-[#0b101b] border-slate-800 text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold font-mono-code ${
                            note.isAButton
                              ? 'text-blue-400'
                              : note.isCoreOcarinaNote
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                          }`}
                        >
                          {note.musicalName}
                        </span>
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-800/90 text-[10px] font-mono-code text-slate-200 border border-slate-700">
                          {keyLabel}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Barra inferior de volume, reverb e ligação rápida aos ficheiros de áudio */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <label htmlFor="volume-slider" className="whitespace-nowrap">
                      Volume
                    </label>
                    <input
                      id="volume-slider"
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-24 accent-amber-400 cursor-pointer"
                    />
                    <span className="font-mono-code w-9 text-right text-slate-300">
                      {volume}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <label htmlFor="reverb-slider" className="whitespace-nowrap">
                      Reverb
                    </label>
                    <input
                      id="reverb-slider"
                      type="range"
                      min={0}
                      max={100}
                      value={reverb}
                      onChange={(e) => handleReverbChange(Number(e.target.value))}
                      className="w-24 accent-blue-400 cursor-pointer"
                    />
                    <span className="font-mono-code w-9 text-right text-slate-300">
                      {reverb}%
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs font-medium text-slate-300 hover:text-amber-300 underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Personalizar áudios (.wav / .mp3)
                </button>
              </div>

              {/* Barra do gravador de melodias (Gravar / Reproduzir com timing original) */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#0b101b] border border-slate-800/90 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleRecording}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        Parar gravação
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                        Gravar
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleTogglePlayRecording}
                    disabled={isRecording || recordedEvents.length === 0}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                      isPlayingRecording
                        ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                        : isRecording || recordedEvents.length === 0
                          ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {isPlayingRecording ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        Parar reprodução
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Reproduzir
                      </>
                    )}
                  </button>

                  {!isRecording && recordedEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearRecording}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white bg-slate-800/70 hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Apagar gravação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Apagar
                    </button>
                  )}
                </div>

                <div className="text-xs font-mono-code text-slate-400">
                  {isRecording ? (
                    <span className="text-red-400 font-medium">
                      A gravar · {recordingCount} {recordingCount === 1 ? 'nota' : 'notas'}
                    </span>
                  ) : recordedEvents.length > 0 ? (
                    <span>
                      {recordedEvents.length} {recordedEvents.length === 1 ? 'nota' : 'notas'} ·{' '}
                      {(
                        (recordedEvents[recordedEvents.length - 1].startOffsetMs +
                          recordedEvents[recordedEvents.length - 1].durationMs) /
                        1000
                      ).toFixed(1)}
                      s
                    </span>
                  ) : (
                    <span>Nenhuma gravação guardada</span>
                  )}
                </div>
              </div>
            </div>

            {/* Pauta Musical */}
            <MusicalStaff
              playedNotes={playedNotes}
              selectedSong={selectedSong}
              practiceIndex={practiceIndex}
              activeDemoStepIndex={activeDemoStepIndex}
              matchedSong={matchedSong}
              onClearStaff={() => {
                setPlayedNotes([]);
                setMatchedSong(null);
                setPracticeIndex(0);
              }}
              onClearPractice={() => {
                setSelectedSong(null);
                setPracticeIndex(0);
              }}
            />
          </section>

          {/* Painel lateral: Guia de Músicas */}
          <div id="cancioneiro" className="lg:col-span-4">
            <SongbookPanel
              keymap={keymap}
              instrumentMode={instrumentMode}
              selectedSongId={selectedSong?.id ?? null}
              playingDemoId={playingDemoId}
              activeDemoStepIndex={activeDemoStepIndex}
              onSelectSong={handleSelectSong}
              onToggleDemo={handleToggleDemo}
            />
          </div>
        </div>
      </main>

      {/* Modal de configuração de áudios e exportação HTML */}
      <AudioConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customFileNames={customFileNames}
        onUploadCustomAudio={handleUploadCustomAudio}
        onResetCustomAudio={handleResetCustomAudio}
      />
    </div>
  );
}
