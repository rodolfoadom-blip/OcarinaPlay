import {
  Articulation,
  ExtendedNoteId,
  NoteId,
  OCARINA_NOTES,
  SCALE_NOTES_BY_ID,
} from '../data/ocarinaData';

interface ActiveVoice {
  noteId: ExtendedNoteId;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

/**
 * Motor de áudio de baixa latência baseado na Web Audio API (classe OcarinaAudioEngine).
 * Pré-carrega os 20 ficheiros .wav reais da Ocarina e inclui:
 * - Efeito global de Reverb ambiental (ConvolverNode com resposta ao impulso estéreo estilo Templo do Tempo)
 * - Escala completa C5 a F6 usando afinação precisa por semitons sobre os .wav reais
 * - Articulação curta, média, longa ou sustentada em loop contínuo
 * - Transição monofónica suave mantendo a cauda de reverberação na sala
 */
class OcarinaAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private reverbToneFilter: BiquadFilterNode | null = null;

  private buffers = new Map<string, AudioBuffer>();
  private loadingPromise: Promise<void> | null = null;
  private activeVoice: ActiveVoice | null = null;
  private volume = 0.85;
  private reverbAmount = 0.42;
  private customUrls = new Map<NoteId, string>();

  /**
   * Cria uma resposta ao impulso (Impulse Response) estéreo sintética
   * com ataque suave e decaimento exponencial quente para simular a acústica
   * de pedra/templo do jogo.
   */
  private createAmbientImpulseResponse(
    ctx: AudioContext,
    durationSeconds = 2.1,
    decay = 2.9,
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSeconds);
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const fadeInSamples = Math.floor(sampleRate * 0.025);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const progress = i / length;
        const envelope = Math.pow(1 - progress, decay);
        const attack = i < fadeInSamples ? i / fadeInSamples : 1;
        const whiteNoise = Math.random() * 2 - 1;
        channelData[i] = whiteNoise * envelope * attack * 0.55;
      }
    }

    return impulse;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(ctx.destination);

      // Barramento paralelo Dry / Wet para o efeito global de Reverb
      this.dryGain = ctx.createGain();
      this.wetGain = ctx.createGain();

      this.convolver = ctx.createConvolver();
      this.convolver.buffer = this.createAmbientImpulseResponse(ctx);

      this.reverbToneFilter = ctx.createBiquadFilter();
      this.reverbToneFilter.type = 'lowpass';
      this.reverbToneFilter.frequency.value = 3200;

      this.dryGain.connect(this.masterGain);
      this.convolver.connect(this.reverbToneFilter);
      this.reverbToneFilter.connect(this.wetGain);
      this.wetGain.connect(this.masterGain);

      this.applyReverbGains();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private applyReverbGains(): void {
    if (!this.ctx || !this.dryGain || !this.wetGain) return;
    const now = this.ctx.currentTime;
    const dryLevel = 1 - this.reverbAmount * 0.22;
    const wetLevel = this.reverbAmount * 0.68;

    this.dryGain.gain.setTargetAtTime(dryLevel, now, 0.02);
    this.wetGain.gain.setTargetAtTime(wetLevel, now, 0.02);
  }

  private cacheKey(noteId: NoteId, articulation: Articulation): string {
    return `${noteId}:${articulation}`;
  }

  public async preloadAll(): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const ctx = this.ensureContext();
      const tasks: Promise<void>[] = [];

      for (const note of OCARINA_NOTES) {
        const articulations: Articulation[] = ['short', 'med', 'long', 'loop'];
        for (const art of articulations) {
          const url = note.audioFiles[art];
          const key = this.cacheKey(note.id, art);
          tasks.push(
            fetch(url)
              .then((res) => {
                if (!res.ok) throw new Error(`Falha ao carregar ${url}`);
                return res.arrayBuffer();
              })
              .then((arr) => ctx.decodeAudioData(arr))
              .then((decoded) => {
                this.buffers.set(key, decoded);
              })
              .catch((err) => {
                console.warn(`Aviso ao pré-carregar ${key}:`, err);
              }),
          );
        }
      }

      await Promise.all(tasks);
    })();

    return this.loadingPromise;
  }

  public setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.015);
    }
  }

  public setReverb(amount: number): void {
    this.reverbAmount = Math.max(0, Math.min(1, amount));
    this.applyReverbGains();
  }

  public async setCustomAudioFile(noteId: NoteId, file: File): Promise<string> {
    const ctx = this.ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer);

    const prevUrl = this.customUrls.get(noteId);
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    this.customUrls.set(noteId, objectUrl);

    const articulations: Articulation[] = ['short', 'med', 'long', 'loop'];
    for (const art of articulations) {
      this.buffers.set(this.cacheKey(noteId, art), decoded);
    }
    return file.name;
  }

  public async resetCustomAudio(noteId: NoteId): Promise<void> {
    const ctx = this.ensureContext();
    const prevUrl = this.customUrls.get(noteId);
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
      this.customUrls.delete(noteId);
    }

    const note = OCARINA_NOTES.find((n) => n.id === noteId);
    if (!note) return;

    const articulations: Articulation[] = ['short', 'med', 'long', 'loop'];
    await Promise.all(
      articulations.map(async (art) => {
        const res = await fetch(note.audioFiles[art]);
        const arr = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arr);
        this.buffers.set(this.cacheKey(noteId, art), decoded);
      }),
    );
  }

  public async playNote(extendedNoteId: ExtendedNoteId, articulation: Articulation): Promise<void> {
    const ctx = this.ensureContext();
    if (!this.dryGain || !this.convolver) return;

    const scaleNote = SCALE_NOTES_BY_ID[extendedNoteId];
    const baseId = scaleNote.baseNoteId;
    const key = this.cacheKey(baseId, articulation);
    let buffer = this.buffers.get(key);

    if (!buffer) {
      const baseNote = OCARINA_NOTES.find((n) => n.id === baseId);
      if (baseNote) {
        try {
          const res = await fetch(baseNote.audioFiles[articulation]);
          const arr = await res.arrayBuffer();
          buffer = await ctx.decodeAudioData(arr);
          this.buffers.set(key, buffer);
        } catch (err) {
          console.error('Erro ao reproduzir áudio da nota:', err);
          return;
        }
      }
    }

    if (!buffer) return;

    // Fade-out suave da voz anterior mantendo a cauda do reverb ambiental ativa
    this.stopCurrentVoice(0.04);

    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = articulation === 'loop';

    if (scaleNote.semitones !== 0) {
      source.playbackRate.setValueAtTime(Math.pow(2, scaleNote.semitones / 12), now);
    }

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.001, now);
    voiceGain.gain.linearRampToValueAtTime(1.0, now + 0.012);

    // Envia o sinal tanto para o canal direto (dry) como para o convolver de reverb (wet)
    source.connect(voiceGain);
    voiceGain.connect(this.dryGain);
    voiceGain.connect(this.convolver);
    source.start(now);

    const voice: ActiveVoice = { noteId: extendedNoteId, source, gain: voiceGain };
    this.activeVoice = voice;

    source.onended = () => {
      if (this.activeVoice === voice) {
        this.activeVoice = null;
      }
      try {
        source.disconnect();
        voiceGain.disconnect();
      } catch {
        // Ignorar desconexão já realizada
      }
    };
  }

  public stopNoteIfMatching(noteId: ExtendedNoteId): void {
    if (this.activeVoice && this.activeVoice.noteId === noteId) {
      this.stopCurrentVoice(0.085);
    }
  }

  public stopAll(): void {
    this.stopCurrentVoice(0.05);
  }

  private stopCurrentVoice(fadeSeconds: number): void {
    if (!this.activeVoice || !this.ctx) return;
    const voice = this.activeVoice;
    this.activeVoice = null;

    const now = this.ctx.currentTime;
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value || 1, now);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);
      voice.source.stop(now + fadeSeconds + 0.01);
    } catch {
      // Voz já parada
    }
  }
}

export const ocarinaAudio = new OcarinaAudioEngine();
