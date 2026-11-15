import React, { useEffect, useRef, useState } from 'react';
import {
  ExtendedNoteId,
  InstrumentMode,
  KeymapPreset,
  OCARINA_NOTES,
  SCALE_NOTES,
  SCALE_NOTES_BY_ID,
} from '../data/ocarinaData';

export interface NoteTriggerEvent {
  uid: number;
  noteId: ExtendedNoteId;
}

interface FloatingParticle {
  id: string;
  kind: 'note' | 'mote';
  xPercent: number;
  yPercent: number;
  dx: number;
  dy: number;
  rot: number;
  symbol: string;
  colorClass: string;
  glowColor: string;
  sizeClass: string;
}

interface OcarinaSvgProps {
  activeNotes: Set<ExtendedNoteId>;
  guidedNoteId: ExtendedNoteId | null;
  lastNoteEvent: NoteTriggerEvent | null;
  keymap: KeymapPreset;
  instrumentMode: InstrumentMode;
  onNotePress: (noteId: ExtendedNoteId) => void;
  onNoteRelease: (noteId: ExtendedNoteId) => void;
}

const MUSICAL_SYMBOLS = ['♪', '♫', '♩', '♬'];

export const OcarinaSvg: React.FC<OcarinaSvgProps> = ({
  activeNotes,
  guidedNoteId,
  lastNoteEvent,
  keymap,
  instrumentMode,
  onNotePress,
  onNoteRelease,
}) => {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const particleTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      particleTimersRef.current.forEach((id) => window.clearTimeout(id));
      particleTimersRef.current = [];
    };
  }, []);

  // Gera nota musical flutuante + faíscas subtis no orifício tocado
  useEffect(() => {
    if (!lastNoteEvent) return;

    const scaleNote = SCALE_NOTES_BY_ID[lastNoteEvent.noteId];
    const coreNote = OCARINA_NOTES.find((n) => n.extendedId === lastNoteEvent.noteId);

    const pos =
      instrumentMode === 'full'
        ? scaleNote.fullHolePos
        : coreNote
          ? coreNote.holePos
          : scaleNote.fullHolePos;

    const xPercent = (pos.x / 640) * 100;
    const yPercent = (pos.y / 360) * 100;

    const colorClass = scaleNote.isAButton
      ? 'text-blue-300'
      : scaleNote.isCoreOcarinaNote
        ? 'text-amber-300'
        : 'text-emerald-300';

    const glowColor = scaleNote.isAButton
      ? 'rgba(96, 165, 250, 0.85)'
      : scaleNote.isCoreOcarinaNote
        ? 'rgba(251, 191, 36, 0.85)'
        : 'rgba(52, 211, 153, 0.85)';

    const mainNote: FloatingParticle = {
      id: `${lastNoteEvent.uid}-main`,
      kind: 'note',
      xPercent,
      yPercent: yPercent - 3,
      dx: (Math.random() - 0.5) * 34,
      dy: -(78 + Math.random() * 28),
      rot: (Math.random() - 0.5) * 26,
      symbol: MUSICAL_SYMBOLS[lastNoteEvent.uid % MUSICAL_SYMBOLS.length],
      colorClass,
      glowColor,
      sizeClass: 'text-xl sm:text-2xl font-bold',
    };

    const motes: FloatingParticle[] = [0, 1, 2].map((i) => ({
      id: `${lastNoteEvent.uid}-mote-${i}`,
      kind: 'mote',
      xPercent: xPercent + (Math.random() - 0.5) * 2.5,
      yPercent: yPercent + (Math.random() - 0.5) * 2,
      dx: (Math.random() - 0.5) * 48,
      dy: -(52 + Math.random() * 44),
      rot: 0,
      symbol: i === 0 ? '✦' : '•',
      colorClass,
      glowColor,
      sizeClass: i === 0 ? 'text-xs' : 'text-[10px]',
    }));

    const batch = [mainNote, ...motes];
    setParticles((prev) => [...prev.slice(-28), ...batch]);

    const cleanupTimer = window.setTimeout(() => {
      const idsToRemove = new Set(batch.map((p) => p.id));
      setParticles((prev) => prev.filter((p) => !idsToRemove.has(p.id)));
    }, 1000);
    particleTimersRef.current.push(cleanupTimer);
  }, [lastNoteEvent, instrumentMode]);

  const holesToRender =
    instrumentMode === 'full'
      ? SCALE_NOTES.map((note) => {
          const core = note.isCoreOcarinaNote
            ? OCARINA_NOTES.find((c) => c.extendedId === note.id)
            : undefined;
          const keyLabel = core
            ? core.keys[keymap].label === 'Espaço'
              ? 'Esp'
              : core.keys[keymap].label
            : note.fullModeKey.label;

          return {
            id: note.id,
            x: note.fullHolePos.x,
            y: note.fullHolePos.y,
            r: note.fullHolePos.r,
            glyph: note.isCoreOcarinaNote ? note.glyph : note.musicalName,
            musicalName: note.musicalName,
            solfege: note.solfege,
            keyLabel,
            variant: note.isAButton
              ? ('cobalt' as const)
              : note.isCoreOcarinaNote
                ? ('gold' as const)
                : ('emerald' as const),
          };
        })
      : OCARINA_NOTES.map((note) => ({
          id: note.extendedId,
          x: note.holePos.x,
          y: note.holePos.y,
          r: note.holePos.r,
          glyph: note.glyph,
          musicalName: note.musicalName,
          solfege: note.solfege,
          keyLabel: note.keys[keymap].label,
          variant: note.isAButton ? ('cobalt' as const) : ('gold' as const),
        }));

  return (
    <div className="relative w-full max-w-[680px] mx-auto select-none">
      {/* Camada de partículas / notas musicais flutuantes */}
      <div
        className="pointer-events-none absolute inset-0 overflow-visible z-20"
        aria-hidden="true"
      >
        {particles.map((p) => (
          <span
            key={p.id}
            style={
              {
                left: `${p.xPercent}%`,
                top: `${p.yPercent}%`,
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
                '--rot': `${p.rot}deg`,
                textShadow: `0 0 12px ${p.glowColor}`,
              } as React.CSSProperties
            }
            className={`absolute ${p.colorClass} ${p.sizeClass} ${
              p.kind === 'note' ? 'animate-float-note' : 'animate-float-mote'
            }`}
          >
            {p.symbol}
          </span>
        ))}
      </div>

      <svg
        viewBox="0 0 640 360"
        className="w-full h-auto drop-shadow-[0_24px_48px_rgba(2,6,23,0.85)]"
        role="group"
        aria-label="Ocarina do Tempo interativa"
      >
        <defs>
          {/* Gradiente principal do corpo em cerâmica azul-cobalto */}
          <radialGradient id="ocarinaBodyGrad" cx="42%" cy="34%" r="68%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="32%" stopColor="#1d4ed8" />
            <stop offset="72%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Reflexo especular de esmalte cerâmico */}
          <linearGradient id="ceramicSheen" x1="0%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
            <stop offset="35%" stopColor="#93c5fd" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>

          {/* Sombra inferior do corpo */}
          <linearGradient id="bodyShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="55%" stopColor="#020617" stopOpacity="0" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.62" />
          </linearGradient>

          {/* Banda metálica prateada do bocal */}
          <linearGradient id="silverBandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="35%" stopColor="#f8fafc" />
            <stop offset="65%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Dourado Hylian para a Triforce e contornos */}
          <linearGradient id="hylianGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Brilhos de nota ativa */}
          <radialGradient id="activeCobaltGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#2563eb" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="activeGoldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="activeEmeraldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </radialGradient>

          <filter id="holeInnerShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#020617" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Sombra projetada suave na mesa/ecrã */}
        <ellipse cx="326" cy="298" rx="230" ry="24" fill="#020617" opacity="0.55" />

        {/* Bocal (extensão inferior esquerda) */}
        <path
          d="M 134 226 C 102 250, 74 282, 56 306 C 46 319, 54 333, 72 325 C 96 313, 134 282, 165 256 Z"
          fill="url(#ocarinaBodyGrad)"
          stroke="#1e40af"
          strokeWidth="1.5"
        />
        <ellipse
          cx="62"
          cy="315"
          rx="9"
          ry="5"
          transform="rotate(-38 62 315)"
          fill="#090d16"
          stroke="#64748b"
          strokeWidth="1.2"
        />

        {/* Corpo principal em forma de gota curva (Ocarina do Tempo) */}
        <path
          d="
            M 122 212
            C 92 162, 118 106, 194 88
            C 286 66, 404 54, 498 76
            C 562 91, 598 134, 582 178
            C 564 226, 488 242, 396 244
            C 302 246, 224 268, 174 256
            C 146 250, 132 232, 122 212
            Z
          "
          fill="url(#ocarinaBodyGrad)"
          stroke="#3b82f6"
          strokeOpacity="0.4"
          strokeWidth="2"
        />

        {/* Camada de brilho cerâmico e sombra inferior */}
        <path
          d="
            M 132 204
            C 106 160, 132 114, 200 96
            C 288 73, 404 64, 492 84
            C 542 96, 568 124, 566 156
            C 548 118, 476 102, 388 104
            C 292 106, 206 130, 152 176
            C 138 188, 134 196, 132 204
            Z
          "
          fill="url(#ceramicSheen)"
        />
        <path
          d="
            M 122 212
            C 92 162, 118 106, 194 88
            C 286 66, 404 54, 498 76
            C 562 91, 598 134, 582 178
            C 564 226, 488 242, 396 244
            C 302 246, 224 268, 174 256
            C 146 250, 132 232, 122 212
            Z
          "
          fill="url(#bodyShadow)"
          pointerEvents="none"
        />

        {/* Banda metálica prateada na base do bocal */}
        <path
          d="M 108 244 C 122 234, 146 248, 158 264 L 142 278 C 126 264, 108 256, 94 260 Z"
          fill="url(#silverBandGrad)"
          stroke="#475569"
          strokeWidth="1.2"
        />

        {/* Emblema Triforce gravado na banda prateada */}
        <g transform="translate(122, 246) rotate(-26) scale(0.75)" opacity="0.95">
          <polygon points="12,0 18,10 6,10" fill="url(#hylianGold)" stroke="#78350f" strokeWidth="0.6" />
          <polygon points="6,10 12,20 0,20" fill="url(#hylianGold)" stroke="#78350f" strokeWidth="0.6" />
          <polygon points="18,10 24,20 12,20" fill="url(#hylianGold)" stroke="#78350f" strokeWidth="0.6" />
        </g>

        {/* Orifício acústico decorativo (janela de sopro) */}
        <g transform="translate(152, 224) rotate(-22)">
          <rect
            x="-12"
            y="-6"
            width="24"
            height="12"
            rx="4"
            fill="#070b14"
            stroke="#38bdf8"
            strokeOpacity="0.35"
            strokeWidth="1.2"
          />
          <rect x="-8" y="-3" width="16" height="6" rx="2" fill="#020617" />
        </g>

        {/* Pequenos orifícios decorativos apenas no modo N64 (no modo completo todos têm notas) */}
        {instrumentMode === 'n64' ? (
          <>
            <circle cx="232" cy="116" r="5" fill="#070b14" stroke="#1e40af" strokeWidth="1.2" opacity="0.85" />
            <circle cx="304" cy="100" r="4.5" fill="#070b14" stroke="#1e40af" strokeWidth="1.2" opacity="0.85" />
            <circle cx="526" cy="144" r="5.5" fill="#070b14" stroke="#1e40af" strokeWidth="1.2" opacity="0.85" />
            <circle cx="496" cy="186" r="4.5" fill="#070b14" stroke="#1e40af" strokeWidth="1.2" opacity="0.85" />
            <path
              d="M 196 198 Q 336 154 476 114"
              fill="none"
              stroke="#93c5fd"
              strokeOpacity="0.16"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              pointerEvents="none"
            />
          </>
        ) : (
          /* Linha guia ascendente da esquerda para a direita (C5 até F6) */
          <polyline
            points={holesToRender.map((h) => `${h.x},${h.y}`).join(' ')}
            fill="none"
            stroke="#93c5fd"
            strokeOpacity="0.14"
            strokeWidth="1.2"
            strokeDasharray="3 4"
            pointerEvents="none"
          />
        )}

        {/* Orifícios interativos na Ocarina */}
        {holesToRender.map((hole) => {
          const isActive = activeNotes.has(hole.id);
          const isGuided = guidedNoteId === hole.id;

          const accentColor =
            hole.variant === 'cobalt'
              ? '#60a5fa'
              : hole.variant === 'gold'
                ? '#fbbf24'
                : '#34d399';

          const ringColor =
            hole.variant === 'cobalt'
              ? '#3b82f6'
              : hole.variant === 'gold'
                ? '#f59e0b'
                : '#10b981';

          const activeFill =
            hole.variant === 'cobalt'
              ? '#1d4ed8'
              : hole.variant === 'gold'
                ? '#b45309'
                : '#047857';

          const glowUrl =
            hole.variant === 'cobalt'
              ? 'url(#activeCobaltGlow)'
              : hole.variant === 'gold'
                ? 'url(#activeGoldGlow)'
                : 'url(#activeEmeraldGlow)';

          const badgeWidth = Math.max(30, hole.keyLabel.length * 8 + 12);
          const isLongGlyph = hole.glyph.length > 1;

          return (
            <g
              key={hole.id}
              transform={`translate(${hole.x}, ${hole.y})`}
              className="cursor-pointer outline-none"
              role="button"
              tabIndex={0}
              aria-label={`Tocar nota ${hole.solfege} (${hole.musicalName}), tecla ${hole.keyLabel}`}
              aria-pressed={isActive}
              onPointerDown={(e) => {
                e.preventDefault();
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                onNotePress(hole.id);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onNoteRelease(hole.id);
              }}
              onPointerCancel={() => onNoteRelease(hole.id)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                  e.preventDefault();
                  onNotePress(hole.id);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNoteRelease(hole.id);
                }
              }}
            >
              {/* Halo de guia quando uma música está em modo de prática */}
              {isGuided && !isActive && (
                <circle
                  r={hole.r + 9}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.4"
                  strokeDasharray="5 3"
                  opacity="0.95"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to="360 0 0"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Halo luminoso ao tocar a nota */}
              {isActive && <circle r={hole.r + 16} fill={glowUrl} />}

              {/* Área clicável generosa */}
              <circle r={Math.max(hole.r + 9, 24)} fill="transparent" />

              {/* Aro exterior */}
              <circle
                r={hole.r + 2.5}
                fill={isActive ? ringColor : '#0f172a'}
                fillOpacity={isActive ? 0.35 : 0.78}
                stroke={isActive ? accentColor : isGuided ? '#fbbf24' : accentColor}
                strokeOpacity={isActive || isGuided ? 1 : 0.5}
                strokeWidth={isActive || isGuided ? 2.2 : 1.4}
              />

              {/* Interior do orifício */}
              <circle
                r={hole.r}
                fill={isActive ? activeFill : '#060a14'}
                filter="url(#holeInnerShadow)"
                style={{
                  transform: isActive ? 'scale(0.93)' : 'scale(1)',
                  transition: 'transform 90ms cubic-bezier(0.16, 1, 0.3, 1), fill 120ms ease',
                }}
              />

              {/* Símbolo / nome dentro do orifício */}
              <text
                y={isLongGlyph ? 4 : 5}
                textAnchor="middle"
                fill={isActive ? '#ffffff' : accentColor}
                fontSize={isLongGlyph ? '10.5' : instrumentMode === 'full' ? '13' : '16'}
                fontWeight="700"
                fontFamily={isLongGlyph ? 'JetBrains Mono, monospace' : 'Plus Jakarta Sans, sans-serif'}
                pointerEvents="none"
              >
                {hole.glyph}
              </text>

              {/* Nome musical acima do orifício (no modo N64 ou nos furos de símbolo C/A no modo completo) */}
              {(!isLongGlyph || instrumentMode === 'n64') && (
                <text
                  y={-(hole.r + 8)}
                  textAnchor="middle"
                  fill={isActive ? accentColor : '#cbd5e1'}
                  fontSize="10.5"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                  opacity={isActive ? 1 : 0.85}
                  pointerEvents="none"
                >
                  {hole.musicalName}
                </text>
              )}

              {/* Etiqueta de tecla abaixo do orifício */}
              <g transform={`translate(0, ${hole.r + 17})`} pointerEvents="none">
                <rect
                  x={-badgeWidth / 2}
                  y="-9"
                  width={badgeWidth}
                  height="18"
                  rx="5"
                  fill={isActive ? activeFill : '#0f172a'}
                  fillOpacity={isActive ? 0.98 : 0.9}
                  stroke={isActive ? '#ffffff' : isGuided ? '#fbbf24' : '#334155'}
                  strokeWidth="1"
                />
                <text
                  y="3.5"
                  textAnchor="middle"
                  fill={isActive ? '#ffffff' : '#e2e8f0'}
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {hole.keyLabel}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
