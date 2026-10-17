import React, { useState } from 'react';
import {
  Share2,
  UtensilsCrossed,
  Trash2,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  Grid,
  ChefHat,
  Truck,
  Banknote,
  QrCode,
  CreditCard,
  DollarSign,
  Clock,
  Sparkles,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import {
  Pedido,
  Mesa,
  Comanda,
  Pagamento,
  PedidoCozinha,
} from '../types';
import {
  formatCurrency,
  formatTimeOnly,
  formatFormaPagamento,
  formatStatusPedido,
  isToday,
} from '../utils/formatters';
import { NavigationTab } from '../components/Sidebar';
import { excluirPedidoDefinitivo } from '../services/pedidosService';

interface DashboardPageProps {
  pedidos: Pedido[];
  mesas: Mesa[];
  comandas: Comanda[];
  pagamentos: Pagamento[];
  pedidosCozinha: PedidoCozinha[];
  temDadosDemo: boolean;
  onNavigate: (tab: NavigationTab) => void;
  onOpenBancoModal: () => void;
  onIniciarBancoReal: () => void;
  onConverterDemoParaReal: () => void;
  onOpenLinkClienteModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  pedidos,
  mesas,
  comandas,
  pagamentos,
  pedidosCozinha,
  temDadosDemo,
  onNavigate,
  onOpenBancoModal,
  onIniciarBancoReal,
  onConverterDemoParaReal,
  onOpenLinkClienteModal,
}) => {
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<Pedido | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const handleConfirmarExcluir = async () => {
    if (!pedidoParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirPedidoDefinitivo(pedidoParaExcluir.id, pedidoParaExcluir.numero);
      setPedidoParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  };

  // Filtrar dados do dia
  const pedidosHoje = pedidos.filter(
    (p) => isToday(p.criadoEm) && p.status !== 'cancelado'
  );
  const comandasFechadasHoje = comandas.filter(
    (c) => isToday(c.criadoEm) && c.status === 'fechada'
  );
  const pagamentosHoje = pagamentos.filter((pag) => isToday(pag.criadoEm));

  // Se houver pagamentos registrados hoje, usamos os pagamentos reais; caso contrário somamos pedidos + comandas do dia
  const totalDinheiro =
    pagamentosHoje.length > 0
      ? pagamentosHoje
          .filter((p) => p.formaPagamento === 'dinheiro')
          .reduce((acc, p) => acc + p.valor, 0)
      : pedidosHoje
          .filter((p) => p.formaPagamento === 'dinheiro')
          .reduce((acc, p) => acc + p.total, 0);

  const totalPix =
    pagamentosHoje.length > 0
      ? pagamentosHoje
          .filter((p) => p.formaPagamento === 'pix')
          .reduce((acc, p) => acc + p.valor, 0)
      : pedidosHoje
          .filter((p) => p.formaPagamento === 'pix')
          .reduce((acc, p) => acc + p.total, 0);

  const totalCartao =
    pagamentosHoje.length > 0
      ? pagamentosHoje
          .filter(
            (p) =>
              p.formaPagamento === 'cartao_debito' ||
              p.formaPagamento === 'cartao_credito'
          )
          .reduce((acc, p) => acc + p.valor, 0)
      : pedidosHoje
          .filter(
            (p) =>
              p.formaPagamento === 'cartao_debito' ||
              p.formaPagamento === 'cartao_credito'
          )
          .reduce((acc, p) => acc + p.total, 0);

  const faturamentoPedidosHoje = pedidosHoje.reduce((acc, p) => acc + p.total, 0);
  const faturamentoComandasHoje = comandasFechadasHoje.reduce(
    (acc, c) => acc + c.total,
    0
  );
  const faturamentoPagamentosHoje = pagamentosHoje.reduce(
    (acc, p) => acc + p.valor,
    0
  );

  const faturamentoDoDia = Math.max(
    faturamentoPagamentosHoje,
    faturamentoPedidosHoje + faturamentoComandasHoje
  );

  const numeroPedidosHoje = pedidosHoje.length + comandasFechadasHoje.length;

  const marmitasVendidasHoje = pedidosHoje.reduce((acc, p) => {
    if (p.qtdMarmitas && p.qtdMarmitas > 0) return acc + p.qtdMarmitas;
    if (p.origem === 'marmita') return acc + 1;
    return acc;
  }, 0);

  const mesasOcupadas = mesas.filter((m) => m.status !== 'livre').length;
  const mesasLivres = mesas.filter((m) => m.status === 'livre').length;

  const pedidosEmPreparo =
    pedidos.filter((p) => p.status === 'em_preparo' || p.status === 'confirmando')
      .length ||
    pedidosCozinha.filter((k) => k.status === 'novo' || k.status === 'em_preparo')
      .length;

  const pedidosAguardandoEntrega = pedidos.filter(
    (p) =>
      p.origem === 'delivery' &&
      (p.status === 'pronto' || p.status === 'saiu_para_entrega')
  ).length;

  // Dados para gráfico de barras por canal
  const vendasDelivery = pedidosHoje
    .filter((p) => p.origem === 'delivery')
    .reduce((acc, p) => acc + p.total, 0);
  const vendasMarmitaBalcao = pedidosHoje
    .filter((p) => p.origem === 'marmita' || p.origem === 'balcao')
    .reduce((acc, p) => acc + p.total, 0);
  const vendasMesas = comandas
    .filter((c) => isToday(c.criadoEm) && c.status !== 'cancelada')
    .reduce((acc, c) => acc + c.total, 0);

  const maxCanal = Math.max(
    1,
    vendasDelivery,
    vendasMarmitaBalcao,
    vendasMesas
  );

  const maxPagamento = Math.max(1, totalDinheiro, totalPix, totalCartao);

  const ultimosPedidos = [...pedidos]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, 8);

  const percCanalDelivery = Math.round((vendasDelivery / (faturamentoDoDia || 1)) * 100);
  const percCanalMarmitas = Math.round((vendasMarmitaBalcao / (faturamentoDoDia || 1)) * 100);
  const percCanalMesas = Math.round((vendasMesas / (faturamentoDoDia || 1)) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho Contextual */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 tracking-wide uppercase font-mono">
            <span>Operação do Restaurante</span>
            <span className="text-slate-300">/</span>
            <span>Turno Atual em Tempo Real</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight mt-1">
            Painel Executivo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas financeiras, salão, buffet, pedidos delivery e fila KDS sincronizados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('marmitas')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs hover:shadow-sm transition-all whitespace-nowrap active:scale-95"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>+ Nova Marmita</span>
          </button>
          <button
            onClick={() => onNavigate('mesas')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-all whitespace-nowrap active:scale-95"
          >
            <Grid className="w-3.5 h-3.5 text-slate-500" />
            <span>Abrir Mesa / Comanda</span>
          </button>
        </div>
      </div>

      {/* Banner de Pedidos Online para Clientes */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white p-5 lg:p-6 border border-slate-800/80 shadow-md">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">
                  Portal de Pedidos do Cliente (Estilo iFood)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Disponível 24/7
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Compartilhe o link pelo WhatsApp ou redes sociais. Os pedidos chegam diretamente no seu <strong>Kanban de Delivery</strong> e disparam na <strong>Cozinha KDS</strong> com som e comprovante térmico.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
            {onOpenLinkClienteModal && (
              <button
                type="button"
                onClick={onOpenLinkClienteModal}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap"
              >
                <Share2 className="w-4 h-4" />
                <span>Copiar Link & WhatsApp</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('delivery_cliente')}
              className="flex-1 md:flex-initial px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>Ver como Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {mesas.length === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              <span>Inicialização do Banco de Dados Cloud Firestore</span>
            </h3>
            <p className="text-xs text-amber-900/90 leading-relaxed max-w-2xl">
              Seu banco está conectado. Inicialize o cardápio oficial, as 12 mesas do salão, regiões de entrega e dados operacionais oficiais.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onIniciarBancoReal}
              className="px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              Iniciar Banco Oficial
            </button>
            <button
              onClick={onOpenBancoModal}
              className="px-3 py-2 text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap"
            >
              Opções
            </button>
          </div>
        </div>
      )}

      {temDadosDemo && mesas.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-700">Aviso:</span>
            <span>Existem itens com marcador [Demo]. Converta para o catálogo oficial real.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onConverterDemoParaReal}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors text-xs"
            >
              Converter para Real
            </button>
            <button
              onClick={onOpenBancoModal}
              className="px-3 py-1 bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 rounded-md transition-colors text-xs"
            >
              Gerenciar
            </button>
          </div>
        </div>
      )}

      {/* 10 Indicadores Principais com Design Refinado */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* KPI 1: Faturamento do Dia */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 relative overflow-hidden card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Faturamento Hoje</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(faturamentoDoDia)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Tempo real</span>
          </div>
        </div>

        {/* KPI 2: Número de Pedidos */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total de Pedidos</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {numeroPedidosHoje}
          </div>
          <div className="text-[11px] text-slate-500">
            Pedidos + Comandas
          </div>
        </div>

        {/* KPI 3: Marmitas Vendidas */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Marmitas Vendidas</span>
            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-bold text-amber-700 font-mono tabular-nums">
            {marmitasVendidasHoje}
          </div>
          <div className="text-[11px] text-slate-500">
            Unidades preparadas
          </div>
        </div>

        {/* KPI 4: Mesas Ocupadas */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Mesas Ocupadas</span>
            <Grid className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-600 font-mono tabular-nums">
            {mesasOcupadas}
          </div>
          <div className="text-[11px] text-slate-500">
            Comanda ativa no salão
          </div>
        </div>

        {/* KPI 5: Mesas Livres */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Mesas Livres</span>
            <Grid className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
            {mesasLivres}
          </div>
          <div className="text-[11px] text-slate-500">
            Prontas para clientes
          </div>
        </div>

        {/* KPI 6: Pedidos em Preparo (KDS) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Cozinha KDS</span>
            <ChefHat className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-600 font-mono tabular-nums">
            {pedidosEmPreparo}
          </div>
          <div className="text-[11px] text-slate-500">
            Na fila de preparo
          </div>
        </div>

        {/* KPI 7: Aguardando Entrega */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Delivery em Rota</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {pedidosAguardandoEntrega}
          </div>
          <div className="text-[11px] text-slate-500">
            Pronto / Saiu para entrega
          </div>
        </div>

        {/* KPI 8: Total em Dinheiro */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Dinheiro</span>
            <Banknote className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalDinheiro)}
          </div>
          <div className="text-[11px] text-slate-500">
            Em espécie no caixa
          </div>
        </div>

        {/* KPI 9: Total em Pix */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Pix</span>
            <QrCode className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 font-mono tabular-nums">
            {formatCurrency(totalPix)}
          </div>
          <div className="text-[11px] text-slate-500">
            Instantâneo no banco
          </div>
        </div>

        {/* KPI 10: Total em Cartão */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1 card-hover">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Cartão</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalCartao)}
          </div>
          <div className="text-[11px] text-slate-500">
            Débito e Crédito
          </div>
        </div>
      </div>

      {/* Gráficos de Vendas & Formas de Pagamento */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Vendas por Canal */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-display">
                Vendas por Canal de Atendimento
              </h2>
              <p className="text-xs text-slate-500">
                Distribuição percentual entre Delivery, Marmitas Balcão e Salão/Buffet
              </p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  Delivery Online (iFood)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">({percCanalDelivery}%)</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">{formatCurrency(vendasDelivery)}</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (vendasDelivery / maxCanal) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  Marmitaria & Balcão
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">({percCanalMarmitas}%)</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">{formatCurrency(vendasMarmitaBalcao)}</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (vendasMarmitaBalcao / maxCanal) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Salão, Mesas & Buffet
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">({percCanalMesas}%)</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">{formatCurrency(vendasMesas)}</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (vendasMesas / maxCanal) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Formas de Pagamento */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-display">
              Receita por Forma de Pagamento
            </h2>
            <p className="text-xs text-slate-500">
              Valores consolidados de pagamentos do dia
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Pix (Instantâneo)
                </span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">{formatCurrency(totalPix)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalPix / maxPagamento) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  Cartão (Débito e Crédito)
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">{formatCurrency(totalCartao)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalCartao / maxPagamento) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  Dinheiro em Espécie
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">{formatCurrency(totalDinheiro)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-700 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalDinheiro / maxPagamento) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Últimos Pedidos em Tempo Real */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-display">
              Últimos Pedidos Registrados
            </h2>
            <p className="text-xs text-slate-500">
              Sincronização em tempo real via Cloud Firestore
            </p>
          </div>
          <button
            onClick={() => onNavigate('pedidos')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {ultimosPedidos.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum pedido registrado hoje. Lance novas vendas em &ldquo;Venda de Marmitas&rdquo; ou compartilhe o link de delivery.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                  <th className="py-2.5 px-4">Nº Pedido</th>
                  <th className="py-2.5 px-4">Horário</th>
                  <th className="py-2.5 px-4">Origem</th>
                  <th className="py-2.5 px-4">Cliente</th>
                  <th className="py-2.5 px-4">Itens</th>
                  <th className="py-2.5 px-4">Pagamento</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {ultimosPedidos.map((ped) => (
                  <tr key={ped.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-slate-900">
                      #{ped.numero}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500">
                      {formatTimeOnly(ped.criadoEm)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] font-medium text-slate-700 capitalize">
                        {ped.origem}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {ped.clienteNome}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                      {ped.resumoItens || 'Itens diversos'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {formatFormaPagamento(ped.formaPagamento)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] font-semibold text-slate-800">
                        {formatStatusPedido(ped.status)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(ped.total)}
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPedidoParaExcluir(ped)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200/60"
                        title="Excluir pedido definitivamente"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Excluir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação para Excluir Pedido */}
      {pedidoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-modal">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Excluir Pedido #{pedidoParaExcluir.numero}?
                </h3>
                <p className="text-xs text-slate-500">
                  Cliente: {pedidoParaExcluir.clienteNome} · Total: {formatCurrency(pedidoParaExcluir.total)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir este pedido permanentemente? Ele será removido do painel, da cozinha e do histórico de pedidos.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={excluindo}
                onClick={() => setPedidoParaExcluir(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleConfirmarExcluir}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {excluindo ? 'Excluindo...' : 'Sim, Excluir Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
