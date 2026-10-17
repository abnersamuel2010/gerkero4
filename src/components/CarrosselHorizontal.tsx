import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarrosselHorizontalProps {
  children: React.ReactNode;
  titulo?: React.ReactNode;
  subtitulo?: React.ReactNode;
  badge?: React.ReactNode;
  icone?: React.ReactNode;
  acoesExtras?: React.ReactNode;
  className?: string;
}

export const CarrosselHorizontal: React.FC<CarrosselHorizontalProps> = ({
  children,
  titulo,
  subtitulo,
  badge,
  icone,
  acoesExtras,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [podeRolarEsquerda, setPodeRolarEsquerda] = useState(false);
  const [podeRolarDireita, setPodeRolarDireita] = useState(true);

  const verificarScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setPodeRolarEsquerda(scrollLeft > 10);
    setPodeRolarDireita(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    verificarScroll();
    const el = containerRef.current;
    if (!el) return;

    const handleResize = () => verificarScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [verificarScroll, children]);

  const rolar = (direcao: 'esquerda' | 'direita') => {
    const el = containerRef.current;
    if (!el) return;
    const deslocamento = Math.max(280, el.clientWidth * 0.75);
    el.scrollBy({
      left: direcao === 'esquerda' ? -deslocamento : deslocamento,
      behavior: 'smooth',
    });
    setTimeout(verificarScroll, 350);
  };

  return (
    <section className={`space-y-3.5 relative ${className}`}>
      {/* Cabeçalho da Seção com Título, Subtítulo e Setas de Navegação */}
      {(titulo || subtitulo) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {icone}
              <h3 className="text-lg sm:text-xl font-extrabold text-white font-display tracking-tight flex items-center gap-2">
                {titulo}
              </h3>
            </div>
            {subtitulo && (
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                {subtitulo}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {badge}
            {acoesExtras}

            {/* Setas de Passar para o Lado (Desktop e Mobile) */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={() => rolar('esquerda')}
                disabled={!podeRolarEsquerda}
                title="Rolar para a esquerda"
                aria-label="Ver itens anteriores"
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                  podeRolarEsquerda
                    ? 'bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 border-slate-700 text-white shadow-sm hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-slate-900/50 border-slate-800/60 text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => rolar('direita')}
                disabled={!podeRolarDireita}
                title="Rolar para a direita"
                aria-label="Ver mais itens à direita"
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                  podeRolarDireita
                    ? 'bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 border-slate-700 text-white shadow-sm hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-slate-900/50 border-slate-800/60 text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Container Carrossel Deslizável com setas laterais flutuantes no desktop */}
      <div className="relative group/carrossel">
        {/* Seta Flutuante Esquerda (Desktop) */}
        {podeRolarEsquerda && (
          <button
            type="button"
            onClick={() => rolar('esquerda')}
            aria-label="Rolar para a esquerda"
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/95 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700/80 shadow-xl items-center justify-center transition-all hover:scale-110 active:scale-95 backdrop-blur-xs opacity-0 group-hover/carrossel:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Trilho de Itens Deslizáveis */}
        <div
          ref={containerRef}
          onScroll={verificarScroll}
          className="flex items-stretch gap-4 overflow-x-auto py-2 px-0.5 scroll-smooth snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {children}
        </div>

        {/* Seta Flutuante Direita (Desktop) */}
        {podeRolarDireita && (
          <button
            type="button"
            onClick={() => rolar('direita')}
            aria-label="Rolar para a direita"
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/95 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700/80 shadow-xl items-center justify-center transition-all hover:scale-110 active:scale-95 backdrop-blur-xs opacity-0 group-hover/carrossel:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
};
