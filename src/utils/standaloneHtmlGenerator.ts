import { OCARINA_NOTES } from '../data/ocarinaData';

export type PathStyle = 'simple' | 'exact';

/**
 * Gera um ficheiro HTML único, limpo e extensamente comentado (com CSS, SVG e JS embutidos),
 * incluindo suporte para os áudios reais, escala completa (C5–F6) e Saria's Song integral.
 */
export function generateStandaloneOcarinaHtml(pathStyle: PathStyle = 'simple'): string {
  const pathsBlock =
    pathStyle === 'simple'
      ? `      D:  'sons/D5.wav',   // Botão A       | Tecla Espaço / W
      F:  'sons/F5.wav',   // Botão C-Baixo | Tecla S / R
      A:  'sons/A5.wav',   // Botão C-Dir   | Tecla D / Y
      B:  'sons/B5.wav',   // Botão C-Esq   | Tecla A / U
      D2: 'sons/D6.wav',   // Botão C-Cima  | Tecla W / O`
      : OCARINA_NOTES.map((n) => {
          const fileName = n.audioFiles.med.split('/').pop() || `${n.id}.wav`;
          return `      ${n.id.padEnd(2, ' ')}: 'sons/${fileName}', // ${n.musicalName} (${n.n64Label})`;
        }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ocarina do Tempo — Simulador Interativo</title>
  <style>
    /* =========================================================================
       ESTILOS VISUAIS (CSS EMBUTIDO)
       ========================================================================= */
    :root {
      --bg-canvas: #090d16;
      --bg-panel: #111827;
      --bg-inset: #0b101b;
      --border-subtle: rgba(148, 163, 184, 0.16);
      --text-primary: #f1f5f9;
      --text-muted: #94a3b8;
      --accent-cobalt: #2563eb;
      --accent-gold: #f59e0b;
      --accent-emerald: #10b981;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at 50% 15%, #16213e 0%, var(--bg-canvas) 70%);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.5;
      padding: 24px 16px 40px;
    }

    .container {
      max-width: 1180px;
      margin: 0 auto;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 24px;
    }

    header h1 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(1.4rem, 2.5vw, 1.9rem);
      font-weight: 700;
      letter-spacing: 0.03em;
      color: #f8fafc;
    }

    header p {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .layout {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 920px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: rgba(17, 24, 39, 0.9);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 20px;
    }

    .ocarina-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .ocarina-wrap {
      position: relative;
      width: 100%;
      max-width: 640px;
    }

    .particles-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: visible;
      z-index: 10;
    }

    .floating-particle {
      position: absolute;
      font-weight: 700;
      animation: floatUp 920ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      will-change: transform, opacity;
    }

    @keyframes floatUp {
      0% {
        transform: translate3d(-50%, -50%, 0) scale(0.7) rotate(0deg);
        opacity: 0;
      }
      18% {
        opacity: 1;
      }
      100% {
        transform: translate3d(calc(-50% + var(--dx, 0px)), calc(-50% + var(--dy, -88px)), 0) scale(1.18) rotate(var(--rot, 12deg));
        opacity: 0;
      }
    }

    .mode-switch {
      display: inline-flex;
      gap: 6px;
      padding: 4px;
      background: var(--bg-inset);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      align-self: flex-end;
    }

    .mode-btn {
      border: none;
      background: transparent;
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }

    .mode-btn.active {
      background: #1e293b;
      color: #fde68a;
    }

    .ocarina-svg {
      width: 100%;
      max-width: 640px;
      height: auto;
      user-select: none;
      filter: drop-shadow(0 24px 40px rgba(2, 6, 23, 0.85));
    }

    .hole-group {
      cursor: pointer;
      outline: none;
    }

    .hole-inner {
      transition: transform 90ms ease, fill 120ms ease;
      transform-origin: center;
    }

    .hole-group.active .hole-inner {
      transform: scale(0.92);
    }

    /* Barra de botões das 11 notas (C5-F6) ou 5 notas (N64) */
    .note-strip {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(11, minmax(0, 1fr));
      gap: 6px;
    }

    @media (max-width: 680px) {
      .note-strip {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .note-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 9px 4px;
      border-radius: 9px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-inset);
      color: var(--text-primary);
      cursor: pointer;
      transition: transform 90ms ease, border-color 120ms ease, background 120ms ease;
    }

    .note-btn:hover {
      border-color: rgba(148, 163, 184, 0.45);
    }

    .note-btn.active {
      transform: translateY(1px);
      border-color: var(--accent-gold);
      background: rgba(245, 158, 11, 0.18);
    }

    .note-btn.is-a.active {
      border-color: var(--accent-cobalt);
      background: rgba(37, 99, 235, 0.24);
    }

    .note-btn.is-ext.active {
      border-color: var(--accent-emerald);
      background: rgba(16, 185, 129, 0.22);
    }

    .note-name {
      font-family: ui-monospace, monospace;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--accent-gold);
    }

    .note-btn.is-a .note-name {
      color: #60a5fa;
    }

    .note-btn.is-ext .note-name {
      color: #34d399;
    }

    .kbd-badge {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }

    .staff-box {
      width: 100%;
      background: var(--bg-inset);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 12px 14px;
    }

    .staff-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .staff-notes {
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 36px;
      flex-wrap: wrap;
    }

    .played-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      background: #1e293b;
      font-size: 0.78rem;
      font-weight: 600;
      font-family: ui-monospace, monospace;
    }

    .btn-small {
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .btn-small:hover {
      background: #334155;
    }

    .songbook h2 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 1.15rem;
      margin-bottom: 4px;
    }

    .songbook .subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 14px;
    }

    .song-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 620px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .song-item {
      background: var(--bg-inset);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 12px;
    }

    .song-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }

    .song-title {
      font-weight: 600;
      font-size: 0.92rem;
    }

    .song-desc {
      font-size: 0.76rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .bars-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 210px;
      overflow-y: auto;
    }

    .bar-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 6px;
      background: #111827;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.12);
    }

    .song-seq {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 6px;
    }

    .seq-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #111827;
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 6px;
      padding: 4px 5px;
      font-size: 0.72rem;
      font-family: ui-monospace, monospace;
    }

    .seq-step strong {
      color: var(--accent-gold);
    }

    .seq-step.is-a strong {
      color: #60a5fa;
    }

    .seq-step.is-ext strong {
      color: #34d399;
    }

    .seq-step span {
      font-size: 0.65rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Ocarina do Tempo</h1>
        <p>Clica nos orifícios ou usa WASD + Espaço (e Q, E, R, I, O, P para as notas extras).</p>
      </div>
      <div style="font-size: 0.82rem; color: #94a3b8;">
        Padrão N64: <strong style="color:#f8fafc;">W A S D + Espaço</strong> · Extras: <strong style="color:#34d399;">Q E R I O P</strong>
      </div>
    </header>

    <main class="layout">
      <!-- SECÇÃO ESQUERDA: OCARINA INTERATIVA -->
      <section class="card ocarina-stage">
        <div class="ocarina-wrap">
          <div class="particles-layer" id="particles-layer" aria-hidden="true"></div>
          <svg class="ocarina-svg" viewBox="0 0 640 360" role="group" aria-label="Ocarina do Tempo">
          <defs>
            <radialGradient id="bodyGrad" cx="42%" cy="34%" r="68%">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="35%" stop-color="#1d4ed8" />
              <stop offset="75%" stop-color="#1e3a8a" />
              <stop offset="100%" stop-color="#0f172a" />
            </radialGradient>
            <linearGradient id="silverBand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#cbd5e1" />
              <stop offset="45%" stop-color="#f8fafc" />
              <stop offset="100%" stop-color="#64748b" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fde68a" />
              <stop offset="100%" stop-color="#b45309" />
            </linearGradient>
          </defs>

          <ellipse cx="326" cy="298" rx="230" ry="22" fill="#020617" opacity="0.55" />
          <path d="M 134 226 C 102 250, 74 282, 56 306 C 46 319, 54 333, 72 325 C 96 313, 134 282, 165 256 Z"
                fill="url(#bodyGrad)" stroke="#1e40af" stroke-width="1.5" />
          <path d="M 122 212 C 92 162, 118 106, 194 88 C 286 66, 404 54, 498 76 C 562 91, 598 134, 582 178 C 564 226, 488 242, 396 244 C 302 246, 224 268, 174 256 C 146 250, 132 232, 122 212 Z"
                fill="url(#bodyGrad)" stroke="#3b82f6" stroke-opacity="0.4" stroke-width="2" />
          <path d="M 108 244 C 122 234, 146 248, 158 264 L 142 278 C 126 264, 108 256, 94 260 Z"
                fill="url(#silverBand)" stroke="#475569" stroke-width="1.2" />
          <g transform="translate(122, 246) rotate(-26) scale(0.75)">
            <polygon points="12,0 18,10 6,10" fill="url(#goldGrad)" />
            <polygon points="6,10 12,20 0,20" fill="url(#goldGrad)" />
            <polygon points="18,10 24,20 12,20" fill="url(#goldGrad)" />
          </g>

          <!-- Os 11 orifícios interativos na Ocarina (C5 a F6) -->
          <polyline points="174,142 214,204 252,124 288,198 324,112 360,192 396,108 432,186 468,110 506,180 542,132"
                    fill="none" stroke="#93c5fd" stroke-opacity="0.14" stroke-width="1.2" stroke-dasharray="3 4" />

          <g class="hole-group" data-note="C5" transform="translate(174, 142)">
            <circle r="24" fill="transparent" />
            <circle class="hole-inner" r="15" fill="#060a14" stroke="#34d399" stroke-width="1.8" />
            <text y="4" text-anchor="middle" fill="#34d399" font-size="10.5" font-weight="700" font-family="monospace">C5</text>
            <text y="31" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[Q]</text>
          </g>
          <g class="hole-group" data-note="D5" transform="translate(214, 204)">
            <circle r="25" fill="transparent" />
            <circle class="hole-inner" r="17" fill="#060a14" stroke="#60a5fa" stroke-width="2" />
            <text y="5" text-anchor="middle" fill="#60a5fa" font-size="13" font-weight="700">A</text>
            <text y="-24" text-anchor="middle" fill="#cbd5e1" font-size="10" font-family="monospace">D5</text>
            <text y="33" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[Esp]</text>
          </g>
          <g class="hole-group" data-note="E5" transform="translate(252, 124)">
            <circle r="24" fill="transparent" />
            <circle class="hole-inner" r="15" fill="#060a14" stroke="#34d399" stroke-width="1.8" />
            <text y="4" text-anchor="middle" fill="#34d399" font-size="10.5" font-weight="700" font-family="monospace">E5</text>
            <text y="31" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[E]</text>
          </g>
          <g class="hole-group" data-note="F5" transform="translate(288, 198)">
            <circle r="25" fill="transparent" />
            <circle class="hole-inner" r="17" fill="#060a14" stroke="#fbbf24" stroke-width="2" />
            <text y="5" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700">▼</text>
            <text y="-24" text-anchor="middle" fill="#cbd5e1" font-size="10" font-family="monospace">F5</text>
            <text y="33" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[S]</text>
          </g>
          <g class="hole-group" data-note="G5" transform="translate(324, 112)">
            <circle r="24" fill="transparent" />
            <circle class="hole-inner" r="15" fill="#060a14" stroke="#34d399" stroke-width="1.8" />
            <text y="4" text-anchor="middle" fill="#34d399" font-size="10.5" font-weight="700" font-family="monospace">G5</text>
            <text y="31" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[R]</text>
          </g>
          <g class="hole-group" data-note="A5" transform="translate(360, 192)">
            <circle r="25" fill="transparent" />
            <circle class="hole-inner" r="17" fill="#060a14" stroke="#fbbf24" stroke-width="2" />
            <text y="5" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700">►</text>
            <text y="-24" text-anchor="middle" fill="#cbd5e1" font-size="10" font-family="monospace">A5</text>
            <text y="33" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[D]</text>
          </g>
          <g class="hole-group" data-note="B5" transform="translate(396, 108)">
            <circle r="25" fill="transparent" />
            <circle class="hole-inner" r="16" fill="#060a14" stroke="#fbbf24" stroke-width="2" />
            <text y="5" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700">◄</text>
            <text y="-23" text-anchor="middle" fill="#cbd5e1" font-size="10" font-family="monospace">B5</text>
            <text y="32" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[A]</text>
          </g>
          <g class="hole-group" data-note="C6" transform="translate(432, 186)">
            <circle r="24" fill="transparent" />
            <circle class="hole-inner" r="15" fill="#060a14" stroke="#34d399" stroke-width="1.8" />
            <text y="4" text-anchor="middle" fill="#34d399" font-size="10.5" font-weight="700" font-family="monospace">C6</text>
            <text y="31" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[I]</text>
          </g>
          <g class="hole-group" data-note="D6" transform="translate(468, 110)">
            <circle r="25" fill="transparent" />
            <circle class="hole-inner" r="16" fill="#060a14" stroke="#fbbf24" stroke-width="2" />
            <text y="5" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="700">▲</text>
            <text y="-23" text-anchor="middle" fill="#cbd5e1" font-size="10" font-family="monospace">D6</text>
            <text y="32" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[W]</text>
          </g>
          <g class="hole-group" data-note="E6" transform="translate(506, 180)">
            <circle r="24" fill="transparent" />
            <circle class="hole-inner" r="15" fill="#060a14" stroke="#34d399" stroke-width="1.8" />
            <text y="4" text-anchor="middle" fill="#34d399" font-size="10.5" font-weight="700" font-family="monospace">E6</text>
            <text y="31" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[O]</text>
          </g>
          <g class="hole-group" data-note="F6" transform="translate(542, 132)">
            <circle r="23" fill="transparent" />
            <circle class="hole-inner" r="14" fill="#060a14" stroke="#34d399" stroke-width="1.8" />
            <text y="4" text-anchor="middle" fill="#34d399" font-size="10.5" font-weight="700" font-family="monospace">F6</text>
            <text y="30" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="monospace">[P]</text>
          </g>
        </svg>
        </div>

        <!-- Teclado completo de 11 notas (C5 a F6) -->
        <div class="note-strip" id="note-strip"></div>

        <!-- Barra de gravação e reprodução -->
        <div class="staff-box" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" id="btn-gravar" class="btn-small">● Gravar</button>
            <button type="button" id="btn-reproduzir" class="btn-small" disabled style="opacity:0.5;">▶ Reproduzir</button>
          </div>
          <span id="gravacao-estado" style="font-size:0.78rem; color:#94a3b8; font-family:monospace;">Nenhuma gravação guardada</span>
        </div>

        <!-- Registo de notas tocadas -->
        <div class="staff-box">
          <div class="staff-header">
            <span>Histórico de notas tocadas</span>
            <button type="button" id="btn-limpar" class="btn-small">Limpar</button>
          </div>
          <div id="staff-notes" class="staff-notes">
            <span style="font-size:0.8rem; color:#64748b;">Nenhuma nota tocada ainda.</span>
          </div>
        </div>
      </section>

      <!-- SECÇÃO DIREITA: GUIA DE MÚSICAS -->
      <aside class="card songbook">
        <h2>Guia de Melodias</h2>
        <p class="subtitle">Inclui a partitura completa de Saria's Song (17 compassos) e reprodução automática.</p>
        <div class="song-list" id="song-list"></div>
      </aside>
    </main>
  </div>

  <script>
    /**
     * =========================================================================
     * 1. CONFIGURAÇÃO DOS FICHEIROS DE ÁUDIO PERSONALIZADOS
     * =========================================================================
     * Coloca os teus 5 ficheiros base (.wav ou .mp3) na pasta "sons/" junto a
     * este HTML. As notas intermédias da escala (C5, E5, G5, C6, E6, F6) são
     * afinadas automaticamente com precisão de semitom a partir destes ficheiros.
     */
    const CAMINHOS_AUDIO = {
${pathsBlock}
    };

    const ESCALA = {
      C5: { base: 'D',  semitons: -2, freq: 523.25, tecla: 'Q',   code: 'KeyQ',  tipo: 'ext', x: 174, y: 142 },
      D5: { base: 'D',  semitons:  0, freq: 587.33, tecla: 'Esp', code: 'Space', tipo: 'a',   x: 214, y: 204 },
      E5: { base: 'F',  semitons: -1, freq: 659.25, tecla: 'E',   code: 'KeyE',  tipo: 'ext', x: 252, y: 124 },
      F5: { base: 'F',  semitons:  0, freq: 698.46, tecla: 'S',   code: 'KeyS',  tipo: 'c',   x: 288, y: 198 },
      G5: { base: 'F',  semitons:  2, freq: 783.99, tecla: 'R',   code: 'KeyR',  tipo: 'ext', x: 324, y: 112 },
      A5: { base: 'A',  semitons:  0, freq: 880.00, tecla: 'D',   code: 'KeyD',  tipo: 'c',   x: 360, y: 192 },
      B5: { base: 'B',  semitons:  0, freq: 987.77, tecla: 'A',   code: 'KeyA',  tipo: 'c',   x: 396, y: 108 },
      C6: { base: 'B',  semitons:  1, freq: 1046.5, tecla: 'I',   code: 'KeyI',  tipo: 'ext', x: 432, y: 186 },
      D6: { base: 'D2', semitons:  0, freq: 1174.7, tecla: 'W',   code: 'KeyW',  tipo: 'c',   x: 468, y: 110 },
      E6: { base: 'D2', semitons:  2, freq: 1318.5, tecla: 'O',   code: 'KeyO',  tipo: 'ext', x: 506, y: 180 },
      F6: { base: 'D2', semitons:  3, freq: 1396.9, tecla: 'P',   code: 'KeyP',  tipo: 'ext', x: 542, y: 132 },
    };

    const SARIAS_COMPLETA_COMPASSOS = [
      [['F5',220],['A5',220],['B5',440],['F5',220],['A5',220],['B5',440]],
      [['F5',220],['A5',220],['B5',220],['E6',220],['D6',440],['B5',220],['C6',220]],
      [['B5',220],['G5',220],['E5',660],['E5',220],['D5',220]],
      [['E5',220],['G5',220],['E5',1120]],
      [['F5',220],['A5',220],['B5',440],['F5',220],['A5',220],['B5',440]],
      [['F5',220],['A5',220],['B5',220],['E6',220],['D6',440],['B5',220],['C6',220]],
      [['E6',220],['C6',220],['G5',660],['G5',220],['C6',220]],
      [['G5',220],['D5',220],['E5',1120]],
      [['D5',220],['E5',220],['F5',440],['G5',220],['A5',220],['B5',440]],
      [['C6',220],['B5',220],['E5',1120]],
      [['D5',220],['E5',220],['F5',440],['G5',220],['A5',220],['B5',440]],
      [['C6',220],['D6',220],['E6',1120]],
      [['D5',220],['E5',220],['F5',440],['G5',220],['A5',220],['B5',440]],
      [['C6',220],['B5',220],['E5',1120]],
      [['D5',220],['C5',220],['E5',220],['D5',220],['G5',220],['F5',220],['A5',220],['G5',220]],
      [['B5',220],['A5',220],['C6',220],['B5',220],['D6',220],['C6',220],['E6',220],['F6',220],['D6',220]],
      [['E6',1540]],
    ];

    const MUSICAS_CURTAS = [
      { titulo: "Zelda's Lullaby", desc: 'Canção de Embalar de Zelda', seq: ['B5','D6','A5','B5','D6','A5'] },
      { titulo: "Epona's Song", desc: 'Chama a égua Epona', seq: ['D6','B5','A5','D6','B5','A5'] },
      { titulo: 'Song of Time', desc: 'Canção do Tempo', seq: ['A5','D5','F5','A5','D5','F5'] },
      { titulo: 'Song of Storms', desc: 'Canção das Tempestades', seq: ['D5','F5','D6','D5','F5','D6'] },
    ];

    /**
     * =========================================================================
     * 2. MOTOR WEB AUDIO API (FICHEIROS REAIS + REVERB AMBIENTAL + RESERVA)
     * =========================================================================
     */
    let audioCtx = null;
    let dryBus = null;
    let wetBus = null;
    let convolverNode = null;
    const buffers = {};
    let vozAtual = null;
    let demoTimers = [];

    function criarImpulseReverb(ctx, duracao = 2.1, decaimento = 2.9) {
      const len = Math.floor(ctx.sampleRate * duracao);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      const fadeIn = Math.floor(ctx.sampleRate * 0.025);
      for (let ch = 0; ch < 2; ch++) {
        const data = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          const env = Math.pow(1 - i / len, decaimento);
          const atk = i < fadeIn ? i / fadeIn : 1;
          data[i] = (Math.random() * 2 - 1) * env * atk * 0.55;
        }
      }
      return ir;
    }

    function garantirAudioCtx() {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new Ctx();

        dryBus = audioCtx.createGain();
        wetBus = audioCtx.createGain();
        dryBus.gain.value = 0.9;
        wetBus.gain.value = 0.3;

        convolverNode = audioCtx.createConvolver();
        convolverNode.buffer = criarImpulseReverb(audioCtx);

        const filtro = audioCtx.createBiquadFilter();
        filtro.type = 'lowpass';
        filtro.frequency.value = 3200;

        dryBus.connect(audioCtx.destination);
        convolverNode.connect(filtro);
        filtro.connect(wetBus);
        wetBus.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }

    // Pré-carregar os ficheiros configurados em CAMINHOS_AUDIO
    async function carregarBuffers() {
      const ctx = garantirAudioCtx();
      await Promise.all(
        Object.entries(CAMINHOS_AUDIO).map(async ([base, caminho]) => {
          try {
            const res = await fetch(caminho);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const arr = await res.arrayBuffer();
            buffers[base] = await ctx.decodeAudioData(arr);
          } catch (err) {
            console.warn('Áudio local indisponível (' + caminho + '), será usado som de reserva.');
          }
        })
      );
    }

    function pararVozAtual() {
      if (!vozAtual || !audioCtx) return;
      const agora = audioCtx.currentTime;
      try {
        vozAtual.gain.gain.setValueAtTime(vozAtual.gain.gain.value || 1, agora);
        vozAtual.gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.04);
        vozAtual.source.stop(agora + 0.05);
      } catch {}
      vozAtual = null;
    }

    async function tocarNota(nota, daAutomacao = false) {
      const ctx = garantirAudioCtx();
      if (Object.keys(buffers).length === 0) {
        await carregarBuffers();
      }
      pararVozAtual();

      if (!daAutomacao && aGravar) {
        const agoraMs = performance.now();
        if (inicioGravacaoMs === null) inicioGravacaoMs = agoraMs;
        if (indiceNotaAberta !== null && gravacao[indiceNotaAberta]) {
          gravacao[indiceNotaAberta].duracao = Math.max(100, agoraMs - (inicioGravacaoMs + gravacao[indiceNotaAberta].offset));
        }
        indiceNotaAberta = gravacao.length;
        gravacao.push({ nota, offset: agoraMs - inicioGravacaoMs, duracao: 320 });
        atualizarEstadoGravacao();
      }

      const info = ESCALA[nota];
      const agora = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(dryBus);
      gain.connect(convolverNode);

      const buf = buffers[info.base];
      if (buf) {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        if (info.semitons !== 0) {
          src.playbackRate.setValueAtTime(Math.pow(2, info.semitons / 12), agora);
        }
        gain.gain.setValueAtTime(0.001, agora);
        gain.gain.linearRampToValueAtTime(0.9, agora + 0.015);
        src.connect(gain);
        src.start(agora);
        vozAtual = { source: src, gain };
      } else {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(info.freq, agora);
        gain.gain.setValueAtTime(0.001, agora);
        gain.gain.linearRampToValueAtTime(0.28, agora + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.5);
        osc.connect(gain);
        osc.start(agora);
        osc.stop(agora + 0.52);
        vozAtual = { source: osc, gain };
      }

      registarNota(nota);
      definirAtivo(nota, true);
      lancarParticulas(nota);
    }

    const particlesLayer = document.getElementById('particles-layer');
    const SIMBOLOS_NOTA = ['♪', '♫', '♩', '♬'];
    let contadorParticulas = 0;

    function lancarParticulas(nota) {
      const info = ESCALA[nota];
      if (!info || !particlesLayer) return;
      const xPct = (info.x / 640) * 100;
      const yPct = (info.y / 360) * 100;
      const cor = info.tipo === 'a' ? '#93c5fd' : info.tipo === 'c' ? '#fcd34d' : '#6ee7b7';

      const itens = [
        { sim: SIMBOLOS_NOTA[contadorParticulas++ % SIMBOLOS_NOTA.length], size: '1.35rem', dy: -(78 + Math.random() * 24) },
        { sim: '✦', size: '0.75rem', dy: -(52 + Math.random() * 34) },
        { sim: '•', size: '0.65rem', dy: -(46 + Math.random() * 30) },
      ];

      itens.forEach((item) => {
        const el = document.createElement('span');
        el.className = 'floating-particle';
        el.textContent = item.sim;
        el.style.left = xPct + '%';
        el.style.top = (yPct - 2) + '%';
        el.style.color = cor;
        el.style.fontSize = item.size;
        el.style.textShadow = '0 0 10px ' + cor;
        el.style.setProperty('--dx', ((Math.random() - 0.5) * 38).toFixed(1) + 'px');
        el.style.setProperty('--dy', item.dy.toFixed(1) + 'px');
        el.style.setProperty('--rot', ((Math.random() - 0.5) * 24).toFixed(1) + 'deg');
        particlesLayer.appendChild(el);
        setTimeout(() => el.remove(), 960);
      });
    }

    function definirAtivo(nota, ativo) {
      document.querySelectorAll('[data-note="' + nota + '"]').forEach((el) => {
        el.classList.toggle('active', ativo);
      });
    }

    // Construir barra de 11 notas (C5-F6)
    const stripEl = document.getElementById('note-strip');
    Object.entries(ESCALA).forEach(([nota, info]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'note-btn is-' + info.tipo;
      btn.setAttribute('data-note', nota);
      btn.innerHTML = '<span class="note-name">' + nota + '</span><span class="kbd-badge">' + info.tecla + '</span>';
      stripEl.appendChild(btn);
    });

    function libertarNota(nota) {
      if (aGravar && indiceNotaAberta !== null && inicioGravacaoMs !== null) {
        const item = gravacao[indiceNotaAberta];
        if (item && item.nota === nota) {
          item.duracao = Math.max(120, performance.now() - (inicioGravacaoMs + item.offset));
          indiceNotaAberta = null;
        }
      }
      definirAtivo(nota, false);
    }

    // Eventos de ponteiro para SVG + botões
    document.querySelectorAll('[data-note]').forEach((el) => {
      const nota = el.getAttribute('data-note');
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        tocarNota(nota);
      });
      el.addEventListener('pointerup', () => libertarNota(nota));
      el.addEventListener('pointerleave', () => libertarNota(nota));
      el.addEventListener('pointercancel', () => libertarNota(nota));
    });

    // Teclado (mantém WASD + Espaço, Setas + Z e teclas extras Q, E, R, I, O, P)
    const codeParaNota = {
      KeyZ: 'D5',
      ArrowDown: 'F5',
      ArrowRight: 'A5',
      ArrowLeft: 'B5',
      ArrowUp: 'D6',
    };
    Object.entries(ESCALA).forEach(([nota, info]) => {
      codeParaNota[info.code] = nota;
    });
    const teclasPremidas = new Set();

    window.addEventListener('keydown', (e) => {
      const nota = codeParaNota[e.code];
      if (!nota) return;
      e.preventDefault();
      if (teclasPremidas.has(e.code)) return;
      teclasPremidas.add(e.code);
      tocarNota(nota);
    });

    window.addEventListener('keyup', (e) => {
      const nota = codeParaNota[e.code];
      if (!nota) return;
      teclasPremidas.delete(e.code);
      libertarNota(nota);
    });

    // Histórico
    const historico = [];
    const staffEl = document.getElementById('staff-notes');
    function registarNota(nota) {
      historico.push(nota);
      if (historico.length > 16) historico.shift();
      staffEl.innerHTML = '';
      historico.forEach((n) => {
        const chip = document.createElement('span');
        chip.className = 'played-chip';
        chip.textContent = n;
        staffEl.appendChild(chip);
      });
    }

    document.getElementById('btn-limpar').addEventListener('click', () => {
      historico.length = 0;
      staffEl.innerHTML = '<span style="font-size:0.8rem; color:#64748b;">Nenhuma nota tocada ainda.</span>';
    });

    // Gravador de sequências com timing original
    let aGravar = false;
    let aReproduzir = false;
    let inicioGravacaoMs = null;
    let indiceNotaAberta = null;
    let gravacao = [];
    let playbackTimers = [];

    const btnGravar = document.getElementById('btn-gravar');
    const btnReproduzir = document.getElementById('btn-reproduzir');
    const estadoGravacaoEl = document.getElementById('gravacao-estado');

    function atualizarEstadoGravacao() {
      if (aGravar) {
        estadoGravacaoEl.textContent = 'A gravar · ' + gravacao.length + ' notas';
        estadoGravacaoEl.style.color = '#f87171';
      } else if (gravacao.length > 0) {
        const ultimo = gravacao[gravacao.length - 1];
        const seg = ((ultimo.offset + ultimo.duracao) / 1000).toFixed(1);
        estadoGravacaoEl.textContent = gravacao.length + ' notas · ' + seg + 's';
        estadoGravacaoEl.style.color = '#94a3b8';
      } else {
        estadoGravacaoEl.textContent = 'Nenhuma gravação guardada';
        estadoGravacaoEl.style.color = '#94a3b8';
      }
      const podeReproduzir = !aGravar && gravacao.length > 0;
      btnReproduzir.disabled = !podeReproduzir && !aReproduzir;
      btnReproduzir.style.opacity = (podeReproduzir || aReproduzir) ? '1' : '0.5';
    }

    function pararReproducaoGravada() {
      playbackTimers.forEach((id) => clearTimeout(id));
      playbackTimers = [];
      aReproduzir = false;
      btnReproduzir.textContent = '▶ Reproduzir';
      Object.keys(ESCALA).forEach((n) => definirAtivo(n, false));
      atualizarEstadoGravacao();
    }

    btnGravar.addEventListener('click', () => {
      if (aGravar) {
        aGravar = false;
        if (indiceNotaAberta !== null && inicioGravacaoMs !== null && gravacao[indiceNotaAberta]) {
          gravacao[indiceNotaAberta].duracao = Math.max(120, performance.now() - (inicioGravacaoMs + gravacao[indiceNotaAberta].offset));
          indiceNotaAberta = null;
        }
        btnGravar.textContent = '● Gravar';
        btnGravar.style.background = '#1e293b';
      } else {
        pararDemo();
        pararReproducaoGravada();
        gravacao = [];
        inicioGravacaoMs = null;
        indiceNotaAberta = null;
        aGravar = true;
        btnGravar.textContent = '■ Parar';
        btnGravar.style.background = '#dc2626';
      }
      atualizarEstadoGravacao();
    });

    btnReproduzir.addEventListener('click', () => {
      if (aReproduzir) {
        pararReproducaoGravada();
        return;
      }
      if (aGravar || gravacao.length === 0) return;
      pararDemo();
      aReproduzir = true;
      btnReproduzir.textContent = '■ Parar';
      let maxFim = 0;

      gravacao.forEach((ev) => {
        playbackTimers.push(setTimeout(() => tocarNota(ev.nota, true), ev.offset));
        const fim = ev.offset + ev.duracao;
        if (fim > maxFim) maxFim = fim;
        playbackTimers.push(setTimeout(() => definirAtivo(ev.nota, false), fim));
      });
      playbackTimers.push(setTimeout(pararReproducaoGravada, maxFim + 120));
    });

    // Guia de Músicas + Botão Ouvir Saria's Song Completa
    const songListEl = document.getElementById('song-list');

    function pararDemo() {
      demoTimers.forEach((id) => clearTimeout(id));
      demoTimers = [];
      Object.keys(ESCALA).forEach((n) => definirAtivo(n, false));
    }

    function tocarSariaCompleta() {
      pararReproducaoGravada();
      pararDemo();
      let tempo = 60;
      SARIAS_COMPLETA_COMPASSOS.flat().forEach(([nota, dur]) => {
        demoTimers.push(setTimeout(() => tocarNota(nota, true), tempo));
        demoTimers.push(setTimeout(() => definirAtivo(nota, false), tempo + dur - 50));
        tempo += dur;
      });
    }

    const sariaCard = document.createElement('div');
    sariaCard.className = 'song-item';
    sariaCard.innerHTML = \`
      <div class="song-head">
        <div>
          <div class="song-title">Saria's Song (Completa)</div>
          <div class="song-desc">Partitura integral · 17 compassos (C5–F6)</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button type="button" id="btn-ouvir-saria" class="btn-small">Ouvir</button>
          <button type="button" id="btn-parar-saria" class="btn-small">Parar</button>
        </div>
      </div>
      <div class="bars-wrap" id="saria-bars"></div>
    \`;
    songListEl.appendChild(sariaCard);

    const barsContainer = document.getElementById('saria-bars');
    SARIAS_COMPLETA_COMPASSOS.forEach((compasso) => {
      const row = document.createElement('div');
      row.className = 'bar-row';
      compasso.forEach(([nota]) => {
        const info = ESCALA[nota];
        const step = document.createElement('div');
        step.className = 'seq-step is-' + info.tipo;
        step.innerHTML = '<strong>' + nota + '</strong><span>' + info.tecla + '</span>';
        row.appendChild(step);
      });
      barsContainer.appendChild(row);
    });

    document.getElementById('btn-ouvir-saria').addEventListener('click', tocarSariaCompleta);
    document.getElementById('btn-parar-saria').addEventListener('click', pararDemo);

    MUSICAS_CURTAS.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'song-item';
      const seqHtml = m.seq
        .map((n) => {
          const info = ESCALA[n];
          return '<div class="seq-step is-' + info.tipo + '"><strong>' + n + '</strong><span>' + info.tecla + '</span></div>';
        })
        .join('');
      card.innerHTML = '<div class="song-title">' + m.titulo + '</div><div class="song-desc">' + m.desc + '</div><div class="song-seq">' + seqHtml + '</div>';
      songListEl.appendChild(card);
    });
  </script>
</body>
</html>`;
}
