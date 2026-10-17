import React, { useState } from 'react';
import {
  Plus,
  Users,
  Utensils,
  CalendarClock,
  Clock,
  X,
  Trash2,
  AlertTriangle,
  Layers,
  MapPin,
  Info,
  Sparkles,
  Sliders,
} from 'lucide-react';
import {
  Mesa,
  Comanda,
  ConfiguracaoRestaurante,
} from '../types';
import {
  criarMesa,
  atualizarStatusMesa,
  excluirMesa,
  limparTodasAsMesas,
} from '../services/mesasService';
import { abrirComandaMesa } from '../services/comandasService';
import { formatCurrency } from '../utils/formatters';

interface MesasPageProps {
  mesas: Mesa[];
  comandas: Comanda[];
  config: ConfiguracaoRestaurante;
  onOpenComanda: (comandaId: string) => void;
}

export const MesasPage: React.FC<MesasPageProps> = ({
  mesas,
  comandas,
  config,
  onOpenComanda,
}) => {
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [pessoas, setPessoas] = useState(2);
  const [modalidadeBuffet, setModalidadeBuffet] = useState<
    'sem_buffet' | 'adulto' | 'crianca'
  >('sem_buffet');
  const [nomeReserva, setNomeReserva] = useState('');
  const [abrindo, setAbrindo] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const [confirmarLimpezaAberto, setConfirmarLimpezaAberto] = useState(false);
  const [modalNovaMesaAberto, setModalNovaMesaAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'livre' | 'ocupada' | 'aguardando_pagamento' | 'reservada'
  >('todos');

  // Dados para criação de mesa com especificações completas
  const [novoNumeroMesa, setNovoNumeroMesa] = useState('');
  const [novaCapacidade, setNovaCapacidade] = useState('4');
  const [novoSetor, setNovoSetor] = useState('Salão Principal');
  const [novoSetorCustom, setNovoSetorCustom] = useState('');
  const [novasObservacoes, setNovasObservacoes] = useState('');
  const [salvandoMesa, setSalvandoMesa] = useState(false);

  const mesasOrdenadas = [...mesas].sort((a, b) => a.numero - b.numero);

  const mesasFiltradas = mesasOrdenadas.filter((m) => {
    if (filtroStatus === 'todos') return true;
    return m.status === filtroStatus;
  });

  const handleClickMesa = (mesa: Mesa) => {
    const comandaAtiva = comandas.find(
      (c) =>
        (c.id === mesa.comandaId || c.mesaId === mesa.id) &&
        (c.status === 'aberta' || c.status === 'aguardando_pagamento')
    );

    if (comandaAtiva) {
      onOpenComanda(comandaAtiva.id);
      return;
    }

    setMesaSelecionada(mesa);
    setPessoas(mesa.pessoas > 0 ? mesa.pessoas : 2);
    setNomeReserva(mesa.clienteReserva || '');
    setModalidadeBuffet('sem_buffet');
  };

  const handleConfirmarAberturaComanda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mesaSelecionada) return;
    setAbrindo(true);
    try {
      let tipoBuffet = 'Consumo à la carte / Cardápio';
      let valorPorPessoa = 0;

      if (modalidadeBuffet === 'adulto') {
        tipoBuffet = 'Buffet Livre Adulto';
        valorPorPessoa = config.precoBuffetAdulto || 44.9;
      } else if (modalidadeBuffet === 'crianca') {
        tipoBuffet = 'Buffet Infantil (até 6 anos - Meia)';
        valorPorPessoa = config.precoBuffetCrianca || 24.9;
      }

      const comandaId = await abrirComandaMesa({
        mesa: mesaSelecionada,
        pessoas,
        tipoBuffet,
        valorPorPessoaBuffet: valorPorPessoa,
      });

      setMesaSelecionada(null);
      onOpenComanda(comandaId);
    } finally {
      setAbrindo(false);
    }
  };

  const handleReservarMesa = async () => {
    if (!mesaSelecionada) return;
    await atualizarStatusMesa(
      mesaSelecionada,
      'reservada',
      pessoas,
      '',
      nomeReserva || 'Cliente Reservado'
    );
    setMesaSelecionada(null);
  };

  const handleLiberarMesa = async () => {
    if (!mesaSelecionada) return;
    await atualizarStatusMesa(mesaSelecionada, 'livre', 0, '', '');
    setMesaSelecionada(null);
  };

  const handleExcluirMesaAtual = async () => {
    if (!mesaSelecionada) return;
    if (confirm(`Excluir permanentemente a Mesa ${mesaSelecionada.numero}?`)) {
      await excluirMesa(mesaSelecionada);
      setMesaSelecionada(null);
    }
  };

  const handleLimparTodasAsMesas = async () => {
    setLimpando(true);
    try {
      await limparTodasAsMesas();
      setConfirmarLimpezaAberto(false);
    } finally {
      setLimpando(false);
    }
  };

  const handleSalvarMesaEspecificacoes = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(novoNumeroMesa, 10);
    if (!num || num <= 0) {
      alert('Por favor, informe um número válido para a mesa.');
      return;
    }

    setSalvandoMesa(true);
    try {
      const setorFinal = novoSetor === 'outro' ? (novoSetorCustom || 'Outro Setor') : novoSetor;
      await criarMesa(
        num,
        parseInt(novaCapacidade, 10) || 4,
        setorFinal,
        novasObservacoes
      );
      setNovoNumeroMesa('');
      setNovasObservacoes('');
      setNovoSetorCustom('');
      setModalNovaMesaAberto(false);
    } catch (err: any) {
      alert(err?.message || 'Erro ao criar mesa.');
    } finally {
      setSalvandoMesa(false);
    }
  };

  const obterEstiloMesa = (status: Mesa['status']) => {
    switch (status) {
      case 'livre':
        return {
          card: 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 text-emerald-950 shadow-xs hover:shadow-md',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: 'Livre',
          dot: 'bg-emerald-500',
        };
      case 'ocupada':
        return {
          card: 'bg-rose-50/70 border-rose-300 hover:border-rose-500 text-rose-950 shadow-xs hover:shadow-md',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          label: 'Ocupada',
          dot: 'bg-rose-500',
        };
      case 'aguardando_pagamento':
        return {
          card: 'bg-amber-50/80 border-amber-300 hover:border-amber-500 text-amber-950 shadow-xs hover:shadow-md',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'Pediu Conta',
          dot: 'bg-amber-500',
        };
      case 'reservada':
        return {
          card: 'bg-sky-50/70 border-sky-300 hover:border-sky-500 text-sky-950 shadow-xs hover:shadow-md',
          badge: 'bg-sky-100 text-sky-800 border-sky-200',
          label: 'Reservada',
          dot: 'bg-sky-500',
        };
    }
  };

  const totalLivres = mesas.filter((m) => m.status === 'livre').length;
  const totalOcupadas = mesas.filter((m) => m.status === 'ocupada').length;
  const totalPagamento = mesas.filter((m) => m.status === 'aguardando_pagamento').length;
  const totalReservadas = mesas.filter((m) => m.status === 'reservada').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho e Ações */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="text-xs font-semibold text-amber-700 tracking-wide uppercase font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Salão & Atendimento Presencial
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight mt-0.5">
            Mapa Visual de Mesas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre as mesas com suas especificações e gerencie o salão em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mesas.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmarLimpezaAberto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shadow-xs"
              title="Apagar todas as mesas para reiniciar o salão do zero"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Todas as Mesas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setModalNovaMesaAberto(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Adicionar Mesa com Especificações</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Status do Salão (apenas se houver mesas) */}
      {mesas.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroStatus('todos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filtroStatus === 'todos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todas ({mesas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('livre')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filtroStatus === 'livre'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Livres ({totalLivres})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('ocupada')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filtroStatus === 'ocupada'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-rose-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Ocupadas ({totalOcupadas})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('aguardando_pagamento')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filtroStatus === 'aguardando_pagamento'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-amber-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Pediu Conta ({totalPagamento})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('reservada')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filtroStatus === 'reservada'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Reservadas ({totalReservadas})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Taxa de ocupação:{' '}
            <span className="font-bold text-slate-900">
              {mesas.length > 0
                ? `${Math.round(((totalOcupadas + totalPagamento) / mesas.length) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>
      )}

      {/* Grid Visual de Mesas ou Estado Vazio */}
      {mesas.length === 0 ? (
        <div className="p-12 sm:p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
            <Layers className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Salão Pronto e Sem Mesas de Exemplo
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              O salão está completamente limpo e pronto para você cadastrar as mesas reais do seu restaurante com todas as especificações desejadas (número, capacidade, setor e observações).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalNovaMesaAberto(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Mesa</span>
          </button>
        </div>
      ) : mesasFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          Nenhuma mesa encontrada com o filtro selecionado.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
          {mesasFiltradas.map((mesa) => {
            const estilo = obterEstiloMesa(mesa.status);
            const comandaVinculada = comandas.find(
              (c) =>
                (c.id === mesa.comandaId || c.mesaId === mesa.id) &&
                (c.status === 'aberta' || c.status === 'aguardando_pagamento')
            );

            return (
              <button
                key={mesa.id}
                type="button"
                onClick={() => handleClickMesa(mesa)}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between min-h-[160px] active:scale-98 ${estilo.card}`}
              >
                <div className="flex items-start justify-between w-full">
                  <div>
                    <div className="text-lg font-bold font-display tracking-tight text-slate-900">
                      Mesa {String(mesa.numero).padStart(2, '0')}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${estilo.dot}`} />
                      <span>{estilo.label}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 bg-white/70 px-2 py-0.5 rounded-md border border-black/5 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {mesa.pessoas > 0 ? `${mesa.pessoas}/${mesa.capacidade}` : `${mesa.capacidade} lug.`}
                  </span>
                </div>

                {/* Especificações da Mesa (Setor e Detalhes) */}
                <div className="my-2 space-y-1">
                  {mesa.setor && (
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 bg-black/5 rounded-md text-slate-700 truncate max-w-full">
                      📍 {mesa.setor}
                    </span>
                  )}
                  {mesa.observacoes && (
                    <div className="text-[10px] text-slate-500 truncate" title={mesa.observacoes}>
                      💬 {mesa.observacoes}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-black/10 w-full space-y-0.5 text-xs">
                  {comandaVinculada ? (
                    <>
                      <div className="font-mono tabular-nums text-[11px] text-slate-600 flex items-center justify-between">
                        <span>{comandaVinculada.codigo}</span>
                        <span className="text-[10px] text-amber-700 font-bold">Consumo</span>
                      </div>
                      <div className="font-mono tabular-nums font-bold text-sm text-slate-900">
                        {formatCurrency(comandaVinculada.total)}
                      </div>
                    </>
                  ) : mesa.status === 'reservada' ? (
                    <div className="truncate font-semibold text-sky-950 text-[11px]">
                      Reserva: {mesa.clienteReserva || 'Confirmada'}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-medium">
                      + Abrir comanda
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal para Adicionar Mesa com Especificações */}
      {modalNovaMesaAberto && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-modal">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  Cadastrar Mesa com Especificações
                </h2>
                <p className="text-xs text-slate-500">
                  Adicione o número, capacidade de lugares, setor e detalhes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaMesaAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarMesaEspecificacoes} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número da Mesa *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={novoNumeroMesa}
                    onChange={(e) => setNovoNumeroMesa(e.target.value)}
                    placeholder="Ex: 1, 2, 3..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono tabular-nums focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacidade (Lugares) *
                  </label>
                  <select
                    value={novaCapacidade}
                    onChange={(e) => setNovaCapacidade(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="2">2 Lugares</option>
                    <option value="4">4 Lugares</option>
                    <option value="6">6 Lugares</option>
                    <option value="8">8 Lugares</option>
                    <option value="10">10 Lugares</option>
                    <option value="12">12 Lugares</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Setor / Localização no Salão
                </label>
                <select
                  value={novoSetor}
                  onChange={(e) => setNovoSetor(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
                >
                  <option value="Salão Principal">Salão Principal</option>
                  <option value="Varanda / Área Externa">Varanda / Área Externa</option>
                  <option value="Deck Gourmet">Deck Gourmet</option>
                  <option value="Área VIP / Reservada">Área VIP / Reservada</option>
                  <option value="Espaço Família">Espaço Família</option>
                  <option value="Balcão / Bar">Balcão / Bar</option>
                  <option value="outro">Outro (personalizado)...</option>
                </select>
              </div>

              {novoSetor === 'outro' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Setor Personalizado
                  </label>
                  <input
                    type="text"
                    value={novoSetorCustom}
                    onChange={(e) => setNovoSetorCustom(e.target.value)}
                    placeholder="Ex: Mezanino, Jardim dos Fundos..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Especificações da Mesa (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={novasObservacoes}
                  onChange={(e) => setNovasObservacoes(e.target.value)}
                  placeholder="Ex: Mesa redonda perto da janela, possui ponto de tomada, preferência para casais..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaMesaAberto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoMesa}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{salvandoMesa ? 'Cadastrando...' : 'Salvar Mesa no Salão'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Limpeza Total das Mesas */}
      {confirmarLimpezaAberto && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-modal">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Limpar Todas as Mesas do Salão?
                </h3>
                <p className="text-xs text-slate-500">
                  Todas as {mesas.length} mesas serão apagadas para você cadastrar do zero.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Esta ação removerá todas as mesas cadastradas no salão. Você poderá cadastrar novamente suas mesas reais quando quiser.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmarLimpezaAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={limpando}
                onClick={handleLimparTodasAsMesas}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{limpando ? 'Limpando...' : 'Sim, Limpar Todas as Mesas'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Abertura de Comanda ou Reserva da Mesa */}
      {mesaSelecionada && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-modal">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Mesa {String(mesaSelecionada.numero).padStart(2, '0')} — Abrir Comanda
                </h2>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  {mesaSelecionada.setor && <span>📍 {mesaSelecionada.setor}</span>}
                  <span>Capacidade: {mesaSelecionada.capacidade} lugares</span>
                </div>
              </div>
              <button
                onClick={() => setMesaSelecionada(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mesaSelecionada.observacoes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Especificações da Mesa:</span>
                  <span>{mesaSelecionada.observacoes}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmarAberturaComanda} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantidade de Pessoas na Mesa
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={pessoas}
                  onChange={(e) => setPessoas(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl font-mono tabular-nums focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Modalidade Inicial
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center justify-between p-3 border rounded-xl text-xs cursor-pointer transition-colors ${
                    modalidadeBuffet === 'sem_buffet'
                      ? 'border-amber-500 bg-amber-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <span className="flex items-center gap-2.5 font-medium text-slate-800">
                      <input
                        type="radio"
                        name="buffet"
                        checked={modalidadeBuffet === 'sem_buffet'}
                        onChange={() => setModalidadeBuffet('sem_buffet')}
                      />
                      À La Carte / Porções / Bebidas
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">Sem buffet fixo</span>
                  </label>

                  <label className={`flex items-center justify-between p-3 border rounded-xl text-xs cursor-pointer transition-colors ${
                    modalidadeBuffet === 'adulto'
                      ? 'border-amber-500 bg-amber-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <span className="flex items-center gap-2.5 font-medium text-slate-800">
                      <input
                        type="radio"
                        name="buffet"
                        checked={modalidadeBuffet === 'adulto'}
                        onChange={() => setModalidadeBuffet('adulto')}
                      />
                      Buffet Livre Adulto ({pessoas}x)
                    </span>
                    <span className="font-mono tabular-nums font-bold text-amber-700">
                      {formatCurrency(config.precoBuffetAdulto)}/pessoa
                    </span>
                  </label>

                  <label className={`flex items-center justify-between p-3 border rounded-xl text-xs cursor-pointer transition-colors ${
                    modalidadeBuffet === 'crianca'
                      ? 'border-amber-500 bg-amber-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <span className="flex items-center gap-2.5 font-medium text-slate-800">
                      <input
                        type="radio"
                        name="buffet"
                        checked={modalidadeBuffet === 'crianca'}
                        onChange={() => setModalidadeBuffet('crianca')}
                      />
                      Buffet Infantil (até 6 anos - Meia) ({pessoas}x)
                    </span>
                    <span className="font-mono tabular-nums font-bold text-amber-700">
                      {formatCurrency(config.precoBuffetCrianca)}/pessoa
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={abrindo}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-98"
              >
                <Utensils className="w-4 h-4" />
                <span>{abrindo ? 'Abrindo Comanda...' : 'Confirmar e Abrir Comanda'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                Gerenciar Reserva da Mesa:
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nomeReserva}
                  onChange={(e) => setNomeReserva(e.target.value)}
                  placeholder="Nome do cliente para reserva..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={handleReservarMesa}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs active:scale-95"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Reservar</span>
                </button>
              </div>
              {mesaSelecionada.status === 'reservada' && (
                <button
                  type="button"
                  onClick={handleLiberarMesa}
                  className="w-full py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  Liberar Mesa para Livre
                </button>
              )}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleExcluirMesaAtual}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir esta Mesa {mesaSelecionada.numero}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
