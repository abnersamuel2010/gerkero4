import React, { useEffect, useState } from 'react';
import { Clock, Printer, Play, CheckCircle2, AlertTriangle, Trash2, ChefHat, Volume2, Flame, ArrowRight } from 'lucide-react';
import {
  PedidoCozinha,
  StatusCozinha,
  Pedido,
  ThermalReceiptData,
} from '../types';
import { atualizarStatusCozinhaKDS } from '../services/cozinhaService';
import { excluirPedidoDefinitivo } from '../services/pedidosService';
import {
  formatTimeOnly,
  formatDateTime,
  getMinutesElapsed,
} from '../utils/formatters';

interface CozinhaKDSPageProps {
  pedidosCozinha: PedidoCozinha[];
  pedidos: Pedido[];
  onPrintReceipt: (receipt: ThermalReceiptData) => void;
}

export const CozinhaKDSPage: React.FC<CozinhaKDSPageProps> = ({
  pedidosCozinha,
  pedidos,
  onPrintReceipt,
}) => {
  // Atualiza o relógio a cada 30s para recalcular tempo de espera
  const [, setTick] = useState(0);
  const [ordemParaExcluir, setOrdemParaExcluir] = useState<PedidoCozinha | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleConfirmarExcluir = async () => {
    if (!ordemParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirPedidoDefinitivo(ordemParaExcluir.referenciaId, ordemParaExcluir.numero);
      setOrdemParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  };

  const ordensAtivas = [...pedidosCozinha]
    .filter((k) => k.status !== 'finalizado')
    .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));

  const colunas: { status: StatusCozinha; titulo: string; cor: string }[] = [
    { status: 'novo', titulo: '1. Fila de Entrada (Novos)', cor: 'text-amber-400' },
    { status: 'em_preparo', titulo: '2. Em Preparo (Chapa / Fogão)', cor: 'text-orange-400' },
    { status: 'pronto', titulo: '3. Prontos (Expedição / Balcão)', cor: 'text-emerald-400' },
  ];

  const handleImprimirKDS = (item: PedidoCozinha) => {
    onPrintReceipt({
      titulo: 'COMANDA DE PRODUÇÃO — COZINHA',
      numeroDocumento: `ORDEM #${item.numero}`,
      dataHora: formatDateTime(item.criadoEm),
      clienteOuMesa: item.identificacao,
      linhas: item.itensTexto.split(' | ').map((txt) => ({
        descricao: txt,
      })),
      observacoesGerais: item.observacoes,
      rodape: 'VIA DA COZINHA (KDS)',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Contextual KDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="text-xs font-semibold text-amber-700 tracking-wide uppercase font-mono flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5 text-amber-600" />
            <span>Produção & Linha Quente</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight mt-0.5">
            Cozinha KDS — Painel em Tempo Real
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sincronização imediata entre Delivery, Balcão de Marmitas e Mesas do Salão.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            No Prazo (&lt; 15m)
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Alerta de Atraso (&ge; 15m)
          </span>
        </div>
      </div>

      {/* Grid de 3 Colunas KDS */}
      <div className="grid lg:grid-cols-3 gap-5 items-start">
        {colunas.map((col) => {
          const itensColuna = ordensAtivas.filter((k) => k.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-slate-950 text-slate-100 rounded-2xl p-4 space-y-4 min-h-[560px] border border-slate-800/80 shadow-md flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                    {col.titulo}
                  </h2>
                </div>
                <span className="font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-300">
                  {itensColuna.length}
                </span>
              </div>

              {itensColuna.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-xs text-slate-500">
                  <ChefHat className="w-8 h-8 text-slate-800 mb-2 stroke-1" />
                  <span>Nenhum pedido nesta etapa</span>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {itensColuna.map((item) => {
                    const minutos = getMinutesElapsed(item.criadoEm);
                    const atrasado = minutos >= 15 && item.status !== 'pronto';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-4 space-y-3 border-2 transition-all shadow-sm ${
                          atrasado
                            ? 'bg-rose-950/70 border-rose-500 text-white shadow-rose-950/50'
                            : item.status === 'pronto'
                            ? 'bg-emerald-950/40 border-emerald-600/60 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-100'
                        }`}
                      >
                        {/* Header da Comanda KDS */}
                        <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                          <div>
                            <div className="text-sm font-bold font-mono tabular-nums text-amber-400 flex items-center gap-1.5">
                              <span>#{item.numero}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                                {item.origem}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-white mt-0.5">
                              {item.identificacao}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-400">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {formatTimeOnly(item.criadoEm)}
                            </div>
                            <div
                              className={`text-[11px] font-mono tabular-nums font-bold ${
                                atrasado ? 'text-rose-300 animate-pulse' : 'text-slate-400'
                              }`}
                            >
                              {minutos} min {atrasado ? '• ATRASADO!' : ''}
                            </div>
                          </div>
                        </div>

                        {/* Itens para Preparar */}
                        <div className="space-y-1 text-xs font-medium leading-relaxed">
                          {item.itensTexto.split(' | ').map((linha, i) => (
                            <div
                              key={i}
                              className="p-2 bg-slate-950/70 rounded-lg border border-white/5 font-mono text-[12px] text-slate-200"
                            >
                              {linha}
                            </div>
                          ))}
                        </div>

                        {/* Observações da Cozinha */}
                        {item.observacoes && (
                          <div className="p-2.5 bg-amber-500/15 border border-amber-400/30 rounded-lg text-xs text-amber-200 font-semibold">
                            ⚠️ OBS: {item.observacoes}
                          </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="pt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleImprimirKDS(item)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                            title="Imprimir comanda na cozinha"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrdemParaExcluir(item)}
                            className="p-2 bg-rose-950/50 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg transition-colors"
                            title="Excluir pedido da cozinha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {item.status === 'novo' && (
                            <button
                              type="button"
                              onClick={() =>
                                atualizarStatusCozinhaKDS(
                                  item,
                                  'em_preparo',
                                  pedidos
                                )
                              }
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Iniciar Preparo</span>
                            </button>
                          )}

                          {item.status === 'em_preparo' && (
                            <button
                              type="button"
                              onClick={() =>
                                atualizarStatusCozinhaKDS(item, 'pronto', pedidos)
                              }
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar PRONTO</span>
                            </button>
                          )}

                          {item.status === 'pronto' && (
                            <button
                              type="button"
                              onClick={() =>
                                atualizarStatusCozinhaKDS(
                                  item,
                                  'finalizado',
                                  pedidos
                                )
                              }
                              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                            >
                              Arquivar Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmação para Excluir da Cozinha */}
      {ordemParaExcluir && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-800 text-white animate-modal">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-950/80 rounded-xl border border-rose-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Excluir Pedido #{ordemParaExcluir.numero}?
                </h3>
                <p className="text-xs text-slate-400">
                  {ordemParaExcluir.identificacao}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja remover este pedido permanentemente da cozinha e do sistema? Esta ação cancela e remove o registro do banco de dados.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={excluindo}
                onClick={() => setOrdemParaExcluir(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleConfirmarExcluir}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{excluindo ? 'Excluindo...' : 'Sim, Excluir Pedido'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
