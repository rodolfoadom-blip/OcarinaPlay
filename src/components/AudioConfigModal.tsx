import React, { useState } from 'react';
import { Check, Copy, Download, RotateCcw, Upload, X } from 'lucide-react';
import { NoteId, OCARINA_NOTES } from '../data/ocarinaData';
import { generateStandaloneOcarinaHtml, PathStyle } from '../utils/standaloneHtmlGenerator';

interface AudioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  customFileNames: Partial<Record<NoteId, string>>;
  onUploadCustomAudio: (noteId: NoteId, file: File) => Promise<void>;
  onResetCustomAudio: (noteId: NoteId) => Promise<void>;
}

export const AudioConfigModal: React.FC<AudioConfigModalProps> = ({
  isOpen,
  onClose,
  customFileNames,
  onUploadCustomAudio,
  onResetCustomAudio,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'export'>('audio');
  const [pathStyle, setPathStyle] = useState<PathStyle>('simple');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlCode = generateStandaloneOcarinaHtml(pathStyle);

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorar erro de clipboard em ambientes restritos
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl bg-[#111827] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 id="modal-title" className="font-display text-lg font-semibold text-slate-100">
            Áudio Personalizado e Exportação HTML
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Separadores */}
        <div className="flex items-center gap-2 px-6 pt-4">
          <div className="inline-flex p-1 rounded-lg bg-[#090d16] border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'audio'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ficheiros de Áudio (.wav / .mp3)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'export'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Exportar index.html Único
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'audio' ? (
            <>
              <p className="text-sm text-slate-300">
                Os teus 20 ficheiros originais da Ocarina já estão carregados e ativos. Podes testar outros ficheiros <span className="font-mono-code text-slate-100">.wav</span> ou <span className="font-mono-code text-slate-100">.mp3</span> em qualquer nota carregando um ficheiro do teu computador.
              </p>

              <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-[#0b101b]">
                {OCARINA_NOTES.map((note) => {
                  const customName = customFileNames[note.id];
                  const defaultName = note.audioFiles.med.split('/').pop();

                  return (
                    <div
                      key={note.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            note.isAButton
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {note.glyph}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-100">
                            {note.solfege} ({note.musicalName}) · {note.n64Label}
                          </div>
                          <div className="text-xs font-mono-code text-slate-400 truncate max-w-[290px]">
                            {customName ? `Personalizado: ${customName}` : defaultName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {customName && (
                          <button
                            type="button"
                            onClick={() => void onResetCustomAudio(note.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Original
                          </button>
                        )}
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          Trocar áudio
                          <input
                            type="file"
                            accept="audio/*"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void onUploadCustomAudio(note.id, file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                Descarrega ou copia o código completo em <strong>ficheiro único HTML</strong> com CSS, SVG e JavaScript embutidos, pronto para colocares os teus áudios na pasta <span className="font-mono-code text-amber-300">sons/</span>.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex p-1 rounded-lg bg-[#090d16] border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPathStyle('simple')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      pathStyle === 'simple'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Caminhos simples (sons/D5.wav)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPathStyle('exact')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      pathStyle === 'exact'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Nomes exatos (OOT_Notes_...)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyHtml}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar código'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadHtml}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descarregar index.html
                  </button>
                </div>
              </div>

              <pre className="rounded-lg bg-[#090d16] border border-slate-800 p-3.5 text-[11px] leading-relaxed font-mono-code text-slate-300 max-h-64 overflow-auto">
                <code>{htmlCode}</code>
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
