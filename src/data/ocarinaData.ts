export type NoteId = 'D' | 'F' | 'A' | 'B' | 'D2';

export type ExtendedNoteId =
  | 'C5'
  | 'D5'
  | 'E5'
  | 'F5'
  | 'G5'
  | 'A5'
  | 'B5'
  | 'C6'
  | 'D6'
  | 'E6'
  | 'F6';

export type Articulation = 'short' | 'med' | 'long' | 'loop';

export type KeymapPreset = 'wasd' | 'arrows';

export type InstrumentMode = 'n64' | 'full';

export interface OcarinaNote {
  id: NoteId;
  extendedId: ExtendedNoteId;
  musicalName: string;
  solfege: string;
  n64Label: string;
  glyph: string;
  isAButton: boolean;
  /** Altura na pauta de 0 (mais grave) a 4 (mais aguda) */
  staffLevel: number;
  /** Posição do orifício no SVG (viewBox 0 0 640 360) */
  holePos: { x: number; y: number; r: number };
  keys: {
    wasd: { code: string; label: string };
    arrows: { code: string; label: string };
  };
  audioFiles: Record<Articulation, string>;
}

export interface ScaleNote {
  id: ExtendedNoteId;
  baseNoteId: NoteId;
  semitones: number;
  musicalName: string;
  solfege: string;
  glyph: string;
  isCoreOcarinaNote: boolean;
  isAButton: boolean;
  /** Posição vertical na pauta alargada (0 = C5 mais grave, 10 = F6 mais agudo) */
  scaleLevel: number;
  /** Posição do orifício no SVG quando no modo Escala Completa */
  fullHolePos: { x: number; y: number; r: number };
  fullModeKey: { code: string; label: string };
}

export interface SongStep {
  note: ExtendedNoteId;
  /** Duração em ms para a reprodução de demonstração */
  durationMs: number;
  articulation: Exclude<Articulation, 'loop'>;
  /** Marca se esta nota inicia um novo compasso na partitura */
  barStart?: boolean;
}

export interface ZeldaSong {
  id: string;
  title: string;
  portugueseTitle: string;
  effect: string;
  tempoLabel: string;
  isFullScale?: boolean;
  sequence: ExtendedNoteId[];
  demoSteps: SongStep[];
}

/**
 * Mapeamento das 5 notas reais da Ocarina do Tempo com os respetivos
 * ficheiros .wav fornecidos (curta, média, longa e loop).
 */
export const OCARINA_NOTES: OcarinaNote[] = [
  {
    id: 'D',
    extendedId: 'D5',
    musicalName: 'D5',
    solfege: 'Ré 5',
    n64Label: 'Botão A',
    glyph: 'A',
    isAButton: true,
    staffLevel: 0,
    holePos: { x: 196, y: 198, r: 22 },
    keys: {
      wasd: { code: 'Space', label: 'Espaço' },
      arrows: { code: 'KeyZ', label: 'Z' },
    },
    audioFiles: {
      short: '/assets/aistudio/OOT_Notes_Ocarina_D_short_2833dd2e.wav',
      med: '/assets/aistudio/OOT_Notes_Ocarina_D_med_1a7a05c3.wav',
      long: '/assets/aistudio/OOT_Notes_Ocarina_D_long_27d24174.wav',
      loop: '/assets/aistudio/OOT_Notes_Ocarina_D_loop_7e726e09.wav',
    },
  },
  {
    id: 'F',
    extendedId: 'F5',
    musicalName: 'F5',
    solfege: 'Fá 5',
    n64Label: 'C-Baixo',
    glyph: '▼',
    isAButton: false,
    staffLevel: 1,
    holePos: { x: 266, y: 174, r: 21 },
    keys: {
      wasd: { code: 'KeyS', label: 'S' },
      arrows: { code: 'ArrowDown', label: '↓' },
    },
    audioFiles: {
      short: '/assets/aistudio/OOT_Notes_Ocarina_F_short_e99759c7.wav',
      med: '/assets/aistudio/OOT_Notes_Ocarina_F_med_648b703f.wav',
      long: '/assets/aistudio/OOT_Notes_Ocarina_F_long_dd52ce1e.wav',
      loop: '/assets/aistudio/OOT_Notes_Ocarina_F_loop_084e24ef.wav',
    },
  },
  {
    id: 'A',
    extendedId: 'A5',
    musicalName: 'A5',
    solfege: 'Lá 5',
    n64Label: 'C-Direita',
    glyph: '►',
    isAButton: false,
    staffLevel: 2,
    holePos: { x: 338, y: 152, r: 20 },
    keys: {
      wasd: { code: 'KeyD', label: 'D' },
      arrows: { code: 'ArrowRight', label: '→' },
    },
    audioFiles: {
      short: '/assets/aistudio/OOT_Notes_Ocarina_A_short_4b7f2dcf.wav',
      med: '/assets/aistudio/OOT_Notes_Ocarina_A_med_d76bbcc2.wav',
      long: '/assets/aistudio/OOT_Notes_Ocarina_A_long_7ff22058.wav',
      loop: '/assets/aistudio/OOT_Notes_Ocarina_A_loop_10692fc1.wav',
    },
  },
  {
    id: 'B',
    extendedId: 'B5',
    musicalName: 'B5',
    solfege: 'Si 5',
    n64Label: 'C-Esquerda',
    glyph: '◄',
    isAButton: false,
    staffLevel: 3,
    holePos: { x: 408, y: 132, r: 19 },
    keys: {
      wasd: { code: 'KeyA', label: 'A' },
      arrows: { code: 'ArrowLeft', label: '←' },
    },
    audioFiles: {
      short: '/assets/aistudio/OOT_Notes_Ocarina_B_short_3c96b7c0.wav',
      med: '/assets/aistudio/OOT_Notes_Ocarina_B_med_5d7e3f2c.wav',
      long: '/assets/aistudio/OOT_Notes_Ocarina_B_long_baf27951.wav',
      loop: '/assets/aistudio/OOT_Notes_Ocarina_B_loop_5dd60cff.wav',
    },
  },
  {
    id: 'D2',
    extendedId: 'D6',
    musicalName: 'D6',
    solfege: 'Ré 6',
    n64Label: 'C-Cima',
    glyph: '▲',
    isAButton: false,
    staffLevel: 4,
    holePos: { x: 476, y: 114, r: 18 },
    keys: {
      wasd: { code: 'KeyW', label: 'W' },
      arrows: { code: 'ArrowUp', label: '↑' },
    },
    audioFiles: {
      short: '/assets/aistudio/OOT_Notes_Ocarina_D2_short_70bcb094.wav',
      med: '/assets/aistudio/OOT_Notes_Ocarina_D2_med_0342b199.wav',
      long: '/assets/aistudio/OOT_Notes_Ocarina_D2_long_7357c54d.wav',
      loop: '/assets/aistudio/OOT_Notes_Ocarina_D2_loop_27c55ee4.wav',
    },
  },
];

/**
 * Escala completa (C5 a F6) necessária para tocar a versão integral de Saria's Song.
 * As notas intermédias usam os ficheiros .wav originais afinados por semitons.
 */
export const SCALE_NOTES: ScaleNote[] = [
  {
    id: 'C5',
    baseNoteId: 'D',
    semitones: -2,
    musicalName: 'C5',
    solfege: 'Dó 5',
    glyph: 'C5',
    isCoreOcarinaNote: false,
    isAButton: false,
    scaleLevel: 0,
    fullHolePos: { x: 174, y: 142, r: 15 },
    fullModeKey: { code: 'KeyQ', label: 'Q' },
  },
  {
    id: 'D5',
    baseNoteId: 'D',
    semitones: 0,
    musicalName: 'D5',
    solfege: 'Ré 5',
    glyph: 'A',
    isCoreOcarinaNote: true,
    isAButton: true,
    scaleLevel: 1,
    fullHolePos: { x: 214, y: 204, r: 17 },
    fullModeKey: { code: 'Space', label: 'Espaço' },
  },
  {
    id: 'E5',
    baseNoteId: 'F',
    semitones: -1,
    musicalName: 'E5',
    solfege: 'Mi 5',
    glyph: 'E5',
    isCoreOcarinaNote: false,
    isAButton: false,
    scaleLevel: 2,
    fullHolePos: { x: 252, y: 124, r: 15 },
    fullModeKey: { code: 'KeyE', label: 'E' },
  },
  {
    id: 'F5',
    baseNoteId: 'F',
    semitones: 0,
    musicalName: 'F5',
    solfege: 'Fá 5',
    glyph: '▼',
    isCoreOcarinaNote: true,
    isAButton: false,
    scaleLevel: 3,
    fullHolePos: { x: 288, y: 198, r: 17 },
    fullModeKey: { code: 'KeyS', label: 'S' },
  },
  {
    id: 'G5',
    baseNoteId: 'F',
    semitones: 2,
    musicalName: 'G5',
    solfege: 'Sol 5',
    glyph: 'G5',
    isCoreOcarinaNote: false,
    isAButton: false,
    scaleLevel: 4,
    fullHolePos: { x: 324, y: 112, r: 15 },
    fullModeKey: { code: 'KeyR', label: 'R' },
  },
  {
    id: 'A5',
    baseNoteId: 'A',
    semitones: 0,
    musicalName: 'A5',
    solfege: 'Lá 5',
    glyph: '►',
    isCoreOcarinaNote: true,
    isAButton: false,
    scaleLevel: 5,
    fullHolePos: { x: 360, y: 192, r: 17 },
    fullModeKey: { code: 'KeyD', label: 'D' },
  },
  {
    id: 'B5',
    baseNoteId: 'B',
    semitones: 0,
    musicalName: 'B5',
    solfege: 'Si 5',
    glyph: '◄',
    isCoreOcarinaNote: true,
    isAButton: false,
    scaleLevel: 6,
    fullHolePos: { x: 396, y: 108, r: 16 },
    fullModeKey: { code: 'KeyA', label: 'A' },
  },
  {
    id: 'C6',
    baseNoteId: 'B',
    semitones: 1,
    musicalName: 'C6',
    solfege: 'Dó 6',
    glyph: 'C6',
    isCoreOcarinaNote: false,
    isAButton: false,
    scaleLevel: 7,
    fullHolePos: { x: 432, y: 186, r: 15 },
    fullModeKey: { code: 'KeyI', label: 'I' },
  },
  {
    id: 'D6',
    baseNoteId: 'D2',
    semitones: 0,
    musicalName: 'D6',
    solfege: 'Ré 6',
    glyph: '▲',
    isCoreOcarinaNote: true,
    isAButton: false,
    scaleLevel: 8,
    fullHolePos: { x: 468, y: 110, r: 16 },
    fullModeKey: { code: 'KeyW', label: 'W' },
  },
  {
    id: 'E6',
    baseNoteId: 'D2',
    semitones: 2,
    musicalName: 'E6',
    solfege: 'Mi 6',
    glyph: 'E6',
    isCoreOcarinaNote: false,
    isAButton: false,
    scaleLevel: 9,
    fullHolePos: { x: 506, y: 180, r: 15 },
    fullModeKey: { code: 'KeyO', label: 'O' },
  },
  {
    id: 'F6',
    baseNoteId: 'D2',
    semitones: 3,
    musicalName: 'F6',
    solfege: 'Fá 6',
    glyph: 'F6',
    isCoreOcarinaNote: false,
    isAButton: false,
    scaleLevel: 10,
    fullHolePos: { x: 542, y: 132, r: 14 },
    fullModeKey: { code: 'KeyP', label: 'P' },
  },
];

export const NOTES_BY_ID: Record<NoteId, OcarinaNote> = OCARINA_NOTES.reduce(
  (acc, note) => {
    acc[note.id] = note;
    return acc;
  },
  {} as Record<NoteId, OcarinaNote>,
);

export const SCALE_NOTES_BY_ID: Record<ExtendedNoteId, ScaleNote> = SCALE_NOTES.reduce(
  (acc, note) => {
    acc[note.id] = note;
    return acc;
  },
  {} as Record<ExtendedNoteId, ScaleNote>,
);

/**
 * Transcrição integral da partitura de "Saria's Song" (Lost Woods),
 * compasso a compasso conforme a folha musical enviada.
 */
const SARIAS_SONG_FULL_STEPS: SongStep[] = [
  // Compasso 1: F5 A5 B5 | F5 A5 B5
  { note: 'F5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 440, articulation: 'med' },
  { note: 'F5', durationMs: 220, articulation: 'short' },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 440, articulation: 'med' },

  // Compasso 2: F5 A5 B5 E6 D6 B5 C6
  { note: 'F5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 220, articulation: 'short' },
  { note: 'E6', durationMs: 220, articulation: 'short' },
  { note: 'D6', durationMs: 440, articulation: 'med' },
  { note: 'B5', durationMs: 220, articulation: 'short' },
  { note: 'C6', durationMs: 220, articulation: 'short' },

  // Compasso 3: B5 G5 E5—E5 D5
  { note: 'B5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'G5', durationMs: 220, articulation: 'short' },
  { note: 'E5', durationMs: 660, articulation: 'long' },
  { note: 'E5', durationMs: 220, articulation: 'short' },
  { note: 'D5', durationMs: 220, articulation: 'short' },

  // Compasso 4: E5 G5 E5 — —
  { note: 'E5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'G5', durationMs: 220, articulation: 'short' },
  { note: 'E5', durationMs: 1120, articulation: 'long' },

  // Compasso 5: F5 A5 B5 | F5 A5 B5
  { note: 'F5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 440, articulation: 'med' },
  { note: 'F5', durationMs: 220, articulation: 'short' },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 440, articulation: 'med' },

  // Compasso 6: F5 A5 B5 E6 D6 B5 C6
  { note: 'F5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 220, articulation: 'short' },
  { note: 'E6', durationMs: 220, articulation: 'short' },
  { note: 'D6', durationMs: 440, articulation: 'med' },
  { note: 'B5', durationMs: 220, articulation: 'short' },
  { note: 'C6', durationMs: 220, articulation: 'short' },

  // Compasso 7: E6 C6 G5—G5 C6
  { note: 'E6', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'C6', durationMs: 220, articulation: 'short' },
  { note: 'G5', durationMs: 660, articulation: 'long' },
  { note: 'G5', durationMs: 220, articulation: 'short' },
  { note: 'C6', durationMs: 220, articulation: 'short' },

  // Compasso 8: G5 D5 E5 — —
  { note: 'G5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'D5', durationMs: 220, articulation: 'short' },
  { note: 'E5', durationMs: 1120, articulation: 'long' },

  // Compasso 9: D5 E5 F5 G5 A5 B5
  { note: 'D5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'E5', durationMs: 220, articulation: 'short' },
  { note: 'F5', durationMs: 440, articulation: 'med' },
  { note: 'G5', durationMs: 220, articulation: 'short' },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 440, articulation: 'med' },

  // Compasso 10: C6 B5 E5 — —
  { note: 'C6', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'B5', durationMs: 220, articulation: 'short' },
  { note: 'E5', durationMs: 1120, articulation: 'long' },

  // Compasso 11: D5 E5 F5 G5 A5 B5
  { note: 'D5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'E5', durationMs: 220, articulation: 'short' },
  { note: 'F5', durationMs: 440, articulation: 'med' },
  { note: 'G5', durationMs: 220, articulation: 'short' },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 440, articulation: 'med' },

  // Compasso 12: C6 D6 E6 — —
  { note: 'C6', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'D6', durationMs: 220, articulation: 'short' },
  { note: 'E6', durationMs: 1120, articulation: 'long' },

  // Compasso 13: D5 E5 F5 G5 A5 B5
  { note: 'D5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'E5', durationMs: 220, articulation: 'short' },
  { note: 'F5', durationMs: 440, articulation: 'med' },
  { note: 'G5', durationMs: 220, articulation: 'short' },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 440, articulation: 'med' },

  // Compasso 14: C6 B5 E5 — —
  { note: 'C6', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'B5', durationMs: 220, articulation: 'short' },
  { note: 'E5', durationMs: 1120, articulation: 'long' },

  // Compasso 15: D5 C5 E5 D5 G5 F5 A5 G5
  { note: 'D5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'C5', durationMs: 220, articulation: 'short' },
  { note: 'E5', durationMs: 220, articulation: 'short' },
  { note: 'D5', durationMs: 220, articulation: 'short' },
  { note: 'G5', durationMs: 220, articulation: 'short' },
  { note: 'F5', durationMs: 220, articulation: 'short' },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'G5', durationMs: 220, articulation: 'short' },

  // Compasso 16: B5 A5 C6 B5 D6 C6 E6 F6 D6
  { note: 'B5', durationMs: 220, articulation: 'short', barStart: true },
  { note: 'A5', durationMs: 220, articulation: 'short' },
  { note: 'C6', durationMs: 220, articulation: 'short' },
  { note: 'B5', durationMs: 220, articulation: 'short' },
  { note: 'D6', durationMs: 220, articulation: 'short' },
  { note: 'C6', durationMs: 220, articulation: 'short' },
  { note: 'E6', durationMs: 220, articulation: 'short' },
  { note: 'F6', durationMs: 220, articulation: 'short' },
  { note: 'D6', durationMs: 220, articulation: 'short' },

  // Compasso 17: E6 — — —
  { note: 'E6', durationMs: 1540, articulation: 'long', barStart: true },
];

/**
 * Cancioneiro oficial de Hyrule
 */
export const ZELDA_SONGS: ZeldaSong[] = [
  {
    id: 'sarias-song-full',
    title: "Saria's Song (Completa)",
    portugueseTitle: 'Lost Woods · Partitura Integral (17 compassos)',
    effect: 'Tema completo da Floresta Perdida (escala C5–F6)',
    tempoLabel: '4/4 · 87 notas',
    isFullScale: true,
    sequence: SARIAS_SONG_FULL_STEPS.map((s) => s.note),
    demoSteps: SARIAS_SONG_FULL_STEPS,
  },
  {
    id: 'zeldas-lullaby',
    title: "Zelda's Lullaby",
    portugueseTitle: 'Canção de Embalar de Zelda',
    effect: 'Desperta selos reais e invoca a Família Real de Hyrule',
    tempoLabel: '3/4 Lento',
    sequence: ['B5', 'D6', 'A5', 'B5', 'D6', 'A5'],
    demoSteps: [
      { note: 'B5', durationMs: 650, articulation: 'med' },
      { note: 'D6', durationMs: 360, articulation: 'short' },
      { note: 'A5', durationMs: 920, articulation: 'long' },
      { note: 'B5', durationMs: 650, articulation: 'med' },
      { note: 'D6', durationMs: 360, articulation: 'short' },
      { note: 'A5', durationMs: 1100, articulation: 'long' },
    ],
  },
  {
    id: 'eponas-song',
    title: "Epona's Song",
    portugueseTitle: 'Canção da Epona',
    effect: 'Chama a égua Epona através das planícies de Hyrule',
    tempoLabel: '4/4 Pastoral',
    sequence: ['D6', 'B5', 'A5', 'D6', 'B5', 'A5'],
    demoSteps: [
      { note: 'D6', durationMs: 420, articulation: 'short' },
      { note: 'B5', durationMs: 420, articulation: 'short' },
      { note: 'A5', durationMs: 840, articulation: 'long' },
      { note: 'D6', durationMs: 420, articulation: 'short' },
      { note: 'B5', durationMs: 420, articulation: 'short' },
      { note: 'A5', durationMs: 1050, articulation: 'long' },
    ],
  },
  {
    id: 'song-of-time',
    title: 'Song of Time',
    portugueseTitle: 'Canção do Tempo',
    effect: 'Abre a Porta do Tempo e move os blocos azuis do Templo',
    tempoLabel: '4/4 Solene',
    sequence: ['A5', 'D5', 'F5', 'A5', 'D5', 'F5'],
    demoSteps: [
      { note: 'A5', durationMs: 560, articulation: 'med' },
      { note: 'D5', durationMs: 900, articulation: 'long' },
      { note: 'F5', durationMs: 560, articulation: 'med' },
      { note: 'A5', durationMs: 560, articulation: 'med' },
      { note: 'D5', durationMs: 900, articulation: 'long' },
      { note: 'F5', durationMs: 1050, articulation: 'long' },
    ],
  },
  {
    id: 'song-of-storms',
    title: 'Song of Storms',
    portugueseTitle: 'Canção das Tempestades',
    effect: 'Invoca chuva torrencial e acelera o moinho de Kakariko',
    tempoLabel: '3/4 Valsa',
    sequence: ['D5', 'F5', 'D6', 'D5', 'F5', 'D6'],
    demoSteps: [
      { note: 'D5', durationMs: 280, articulation: 'short' },
      { note: 'F5', durationMs: 280, articulation: 'short' },
      { note: 'D6', durationMs: 760, articulation: 'med' },
      { note: 'D5', durationMs: 280, articulation: 'short' },
      { note: 'F5', durationMs: 280, articulation: 'short' },
      { note: 'D6', durationMs: 960, articulation: 'long' },
    ],
  },
  {
    id: 'sarias-song',
    title: "Saria's Song (Ocarina N64)",
    portugueseTitle: 'Toque rápido de 6 notas no jogo',
    effect: 'Comunica com Saria na Floresta Perdida',
    tempoLabel: '4/4 Alegre',
    sequence: ['F5', 'A5', 'B5', 'F5', 'A5', 'B5'],
    demoSteps: [
      { note: 'F5', durationMs: 280, articulation: 'short' },
      { note: 'A5', durationMs: 280, articulation: 'short' },
      { note: 'B5', durationMs: 560, articulation: 'med' },
      { note: 'F5', durationMs: 280, articulation: 'short' },
      { note: 'A5', durationMs: 280, articulation: 'short' },
      { note: 'B5', durationMs: 780, articulation: 'long' },
    ],
  },
  {
    id: 'suns-song',
    title: "Sun's Song",
    portugueseTitle: 'Canção do Sol',
    effect: 'Alterna o ciclo entre o dia e a noite e paralisa ReDeads',
    tempoLabel: '4/4 Luminoso',
    sequence: ['A5', 'F5', 'D6', 'A5', 'F5', 'D6'],
    demoSteps: [
      { note: 'A5', durationMs: 320, articulation: 'short' },
      { note: 'F5', durationMs: 320, articulation: 'short' },
      { note: 'D6', durationMs: 680, articulation: 'med' },
      { note: 'A5', durationMs: 320, articulation: 'short' },
      { note: 'F5', durationMs: 320, articulation: 'short' },
      { note: 'D6', durationMs: 880, articulation: 'long' },
    ],
  },
  {
    id: 'minuet-of-forest',
    title: 'Minuet of Forest',
    portugueseTitle: 'Minueto da Floresta',
    effect: 'Teletransporta para o Prado Sagrado da Floresta',
    tempoLabel: '3/4 Lírico',
    sequence: ['D5', 'D6', 'B5', 'A5', 'B5', 'A5'],
    demoSteps: [
      { note: 'D5', durationMs: 360, articulation: 'short' },
      { note: 'D6', durationMs: 440, articulation: 'med' },
      { note: 'B5', durationMs: 640, articulation: 'med' },
      { note: 'A5', durationMs: 420, articulation: 'short' },
      { note: 'B5', durationMs: 420, articulation: 'short' },
      { note: 'A5', durationMs: 960, articulation: 'long' },
    ],
  },
  {
    id: 'song-of-healing',
    title: 'Song of Healing',
    portugueseTitle: 'Canção da Cura',
    effect: 'Acalma espíritos atormentados e sela máscaras antigas',
    tempoLabel: '3/4 Sereno',
    sequence: ['B5', 'A5', 'F5', 'B5', 'A5', 'F5'],
    demoSteps: [
      { note: 'B5', durationMs: 520, articulation: 'med' },
      { note: 'A5', durationMs: 520, articulation: 'med' },
      { note: 'F5', durationMs: 800, articulation: 'long' },
      { note: 'B5', durationMs: 520, articulation: 'med' },
      { note: 'A5', durationMs: 520, articulation: 'med' },
      { note: 'F5', durationMs: 960, articulation: 'long' },
    ],
  },
];
