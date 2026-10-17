import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  Printer,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  Caixa,
  MovimentacaoCaixa,
  FormaPagamento,
  TipoMovimentacaoCaixa,
  ThermalReceiptData,
} from '../types';
import {
  abrirCaixa,
  registrarMovimentacaoCaixa,
  fecharCaixa,
} from '../services/caixaService';
import {
  formatCurrency,
  formatDateTime,
  formatFormaPagamento,
} from '../utils/formatters';

interface CaixaPageProps {
  caixas: Caixa[];
  movimentacoes: MovimentacaoCaixa[];
  caixaAberto: Caixa | null;
  onPrintReceipt: (receipt: ThermalReceiptData) => void;
}

export const CaixaPage: React.FC<CaixaPageProps> = ({
  caixas,
  movimentacoes,
  caixaAberto,
  onPrintReceipt,
}) => {
  const [saldoInicial, setSaldoInicial] = useState('150.00');
  const [obsAbertura, setObsAbertura] = useState('');

  // Lançamento de movimentação
  const [tipoMov, setTipoMov] = useState<TipoMovimentacaoCaixa>('venda');
  const [formaPagMov, setFormaPagMov] = useState<FormaPagamento>('dinheiro');
  const [valorMov, setValorMov] = useState('');
  const [descricaoMov, setDescricaoMov] = useState('');

  // Fechamento e Conferência
  const [valorInformadoConferencia, setValorInformadoConferencia] = useState('');
  const [obsFechamento, setObsFechamento] = useState('');
  const [processando, setProcessando] = useState(false);

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessando(true);
    try {
      await abrirCaixa(
        parseFloat(saldoInicial.replace(',', '.')) || 0,
        obsAbertura
      );
      setObsAbertura('');
    } finally {
      setProcessando(false);
    }
  };

  const handleLancarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAberto || !valorMov) return;
    setProcessando(true);
    try {
      await registrarMovimentacaoCaixa(
        caixaAberto,
        tipoMov,
        formaPagMov,
        parseFloat(valorMov.replace(',', '.')) || 0,
        descricaoMov || `Lançamento manual (${tipoMov})`
      );
      setValorMov('');
      setDescricaoMov('');
    } finally {
      setProcessando(false);
    }
  };

  const totalCartaoCaixa = caixaAberto
    ? (caixaAberto.totalCartaoDebito || 0) + (caixaAberto.totalCartaoCredito || 0)
    : 0;

  const totalVendasCaixa = caixaAberto
    ? (caixaAberto.totalDinheiro || 0) +
      (caixaAberto.totalPix || 0) +
      totalCartaoCaixa
    : 0;

  const valorEsperadoGeral = caixaAberto
    ? (caixaAberto.saldoInicial || 0) +
      totalVendasCaixa +
      (caixaAberto.totalEntradasExtras || 0) -
      (caixaAberto.totalSaidasSangrias || 0)
    : 0;

  const valorInformadoNum =
    parseFloat(valorInformadoConferencia.replace(',', '.')) || 0;
  const diferencaCalculada = Number(
    (valorInformadoNum - valorEsperadoGeral).toFixed(2)
  );

  const handleFecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAberto) return;
    setProcessando(true);
    try {
      await fecharCaixa(caixaAberto, valorInformadoNum, obsFechamento);

      onPrintReceipt({
        titulo: 'FECHAMENTO E CONFERÊNCIA DE CAIXA',
        numeroDocumento: `CAIXA ${caixaAberto.id.slice(-6).toUpperCase()}`,
        dataHora: formatDateTime(new Date().toISOString()),
        clienteOuMesa: `Operador: ${caixaAberto.abertoPor}`,
        linhas: [
          { descricao: 'Saldo Inicial (Fundo de Troco)', valor: caixaAberto.saldoInicial },
          { descricao: 'Total em Dinheiro (Vendas)', valor: caixaAberto.totalDinheiro },
          { descricao: 'Total em Pix', valor: caixaAberto.totalPix },
          { descricao: 'Total Cartão de Débito', valor: caixaAberto.totalCartaoDebito },
          { descricao: 'Total Cartão de Crédito', valor: caixaAberto.totalCartaoCredito },
          { descricao: 'Total Cartão (Débito + Crédito)', valor: totalCartaoCaixa },
          { descricao: 'Suprimentos / Entradas Extras', valor: caixaAberto.totalEntradasExtras || 0 },
          { descricao: 'Sangrias / Retiradas (-)', valor: caixaAberto.totalSaidasSangrias || 0 },
          { descricao: 'VALOR ESPERADO NO FECHAMENTO', valor: valorEsperadoGeral },
          { descricao: 'VALOR INFORMADO NA CONFERÊNCIA', valor: valorInformadoNum },
          { descricao: 'DIFERENÇA DE CAIXA', valor: diferencaCalculada },
        ],
        total: totalVendasCaixa,
        observacoesGerais: obsFechamento || 'Fechamento conferido no sistema.',
      });

      setValorInformadoConferencia('');
      setObsFechamento('');
    } finally {
      setProcessando(false);
    }
  };

  const movsDoCaixa = caixaAberto
    ? movimentacoes
        .filter((m) => m.caixaId === caixaAberto.id)
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    : [...movimentacoes]
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
        .slice(0, 15);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Contextual */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-700 tracking-wide uppercase font-mono">
            Gestão Financeira & PDV
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight mt-0.5">
            Caixa Operacional & Fechamento
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Abertura, conferência de sangrias, suprimentos e fechamento de turno com relatório térmico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              caixaAberto
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {caixaAberto ? '● CAIXA ABERTO' : '○ CAIXA FECHADO'}
          </span>
        </div>
      </div>

      {!caixaAberto ? (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Abrir Novo Caixa do Turno
                </h2>
                <p className="text-xs text-slate-500">
                  Informe o fundo de troco para iniciar as operações
                </p>
              </div>
            </div>

            <form onSubmit={handleAbrirCaixa} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Saldo Inicial / Fundo de Troco (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl font-mono tabular-nums focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações da Abertura
                </label>
                <input
                  type="text"
                  value={obsAbertura}
                  onChange={(e) => setObsAbertura(e.target.value)}
                  placeholder="Ex: Turno Almoço - Caixa 01"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                disabled={processando}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-95"
              >
                {processando ? 'Abrindo Caixa...' : 'Confirmar e Abrir Caixa'}
              </button>
            </form>
          </div>

          {/* Histórico de Caixas Fechados */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Histórico de Caixas Fechados
            </h2>
            {caixas.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Nenhum histórico de caixa anterior registrado no sistema.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {caixas.slice(0, 6).map((cx) => {
                  const cartao =
                    (cx.totalCartaoDebito || 0) + (cx.totalCartaoCredito || 0);
                  const totalGeral =
                    (cx.totalDinheiro || 0) + (cx.totalPix || 0) + cartao;
                  return (
                    <div
                      key={cx.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          Aberto em {formatDateTime(cx.abertoEm)} por {cx.abertoPor}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Dinheiro: {formatCurrency(cx.totalDinheiro)} · Pix:{' '}
                          {formatCurrency(cx.totalPix)} · Cartão:{' '}
                          {formatCurrency(cartao)}
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="font-bold text-sm text-slate-900">
                          Total: {formatCurrency(totalGeral)}
                        </div>
                        {cx.diferencaFechamento !== undefined && (
                          <div
                            className={`text-[11px] font-semibold ${
                              cx.diferencaFechamento < 0
                                ? 'text-rose-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            Diferença: {formatCurrency(cx.diferencaFechamento)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumo Financeiro do Caixa Aberto */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1">
              <div className="text-xs text-slate-500">Saldo Inicial</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {formatCurrency(caixaAberto.saldoInicial)}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1">
              <div className="text-xs text-slate-500">Dinheiro (Vendas)</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {formatCurrency(caixaAberto.totalDinheiro)}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1">
              <div className="text-xs text-slate-500">Pix Recebido</div>
              <div className="text-lg font-bold font-mono tabular-nums text-emerald-700">
                {formatCurrency(caixaAberto.totalPix)}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1">
              <div className="text-xs text-slate-500">Cartão (Déb + Créd)</div>
              <div className="text-lg font-bold font-mono tabular-nums text-amber-700">
                {formatCurrency(totalCartaoCaixa)}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-1">
              <div className="text-xs text-slate-500">Total Vendas Hoje</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {formatCurrency(totalVendasCaixa)}
              </div>
            </div>

            <div className="bg-slate-950 text-white rounded-xl p-4 shadow-xs space-y-1 border border-slate-800">
              <div className="text-xs text-amber-400 font-medium">Saldo Esperado</div>
              <div className="text-lg font-bold font-mono tabular-nums text-white">
                {formatCurrency(valorEsperadoGeral)}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Registrar Venda, Entrada, Retirada ou Sangria (6 colunas) */}
            <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 font-display">
                Lançamento Rápido no Caixa (Sangria, Suprimento ou Venda)
              </h2>

              <form onSubmit={handleLancarMovimentacao} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Operação
                    </label>
                    <select
                      value={tipoMov}
                      onChange={(e) =>
                        setTipoMov(e.target.value as TipoMovimentacaoCaixa)
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
                    >
                      <option value="venda">Venda / Pagamento Direto</option>
                      <option value="entrada">Suprimento (Entrada de Troco)</option>
                      <option value="sangria">Sangria (Retirada p/ Cofre)</option>
                      <option value="retirada">Despesa / Retirada Avulsa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={formaPagMov}
                      onChange={(e) =>
                        setFormaPagMov(e.target.value as FormaPagamento)
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">Pix</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={valorMov}
                      onChange={(e) => setValorMov(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono tabular-nums focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descrição / Motivo *
                    </label>
                    <input
                      type="text"
                      required
                      value={descricaoMov}
                      onChange={(e) => setDescricaoMov(e.target.value)}
                      placeholder="Ex: Compra de carvão / Sangria cofre..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processando}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-95"
                >
                  Registrar Movimentação
                </button>
              </form>
            </div>

            {/* Conferência e Fechamento de Caixa (6 colunas) */}
            <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Conferência & Fechamento de Turno</span>
              </h2>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Dinheiro em Espécie:</span>
                  <span className="font-mono tabular-nums font-bold">
                    {formatCurrency(caixaAberto.totalDinheiro)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pix Total:</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-700">
                    {formatCurrency(caixaAberto.totalPix)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cartões (Débito + Crédito):</span>
                  <span className="font-mono tabular-nums font-bold">
                    {formatCurrency(totalCartaoCaixa)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-bold">
                  <span>Total de Vendas do Turno:</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(totalVendasCaixa)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleFecharCaixa} className="space-y-3.5">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-100/80 rounded-xl">
                    <div className="text-[11px] text-slate-500">Valor Esperado</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {formatCurrency(valorEsperadoGeral)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Valor Contado (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={valorInformadoConferencia}
                      onChange={(e) => setValorInformadoConferencia(e.target.value)}
                      placeholder={String(valorEsperadoGeral.toFixed(2))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono tabular-nums focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="p-3 bg-slate-100/80 rounded-xl">
                    <div className="text-[11px] text-slate-500">Diferença</div>
                    <div
                      className={`text-sm font-bold font-mono tabular-nums mt-0.5 ${
                        diferencaCalculada < 0
                          ? 'text-rose-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(diferencaCalculada)}
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  value={obsFechamento}
                  onChange={(e) => setObsFechamento(e.target.value)}
                  placeholder="Observações de conferência do fechamento..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600"
                />

                <button
                  type="submit"
                  disabled={processando}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Fechar Caixa & Imprimir Relatório</span>
                </button>
              </form>
            </div>
          </div>

          {/* Extrato de Movimentações */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Extrato de Movimentações do Caixa
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Data/Hora</th>
                    <th className="py-2.5 px-4">Tipo</th>
                    <th className="py-2.5 px-4">Descrição</th>
                    <th className="py-2.5 px-4">Forma</th>
                    <th className="py-2.5 px-4">Operador</th>
                    <th className="py-2.5 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {movsDoCaixa.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Nenhuma movimentação registrada neste caixa.
                      </td>
                    </tr>
                  ) : (
                    movsDoCaixa.map((m) => {
                      const ehSaida = m.tipo === 'retirada' || m.tipo === 'sangria';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500">
                            {formatDateTime(m.criadoEm)}
                          </td>
                          <td className="py-2.5 px-4 uppercase font-semibold text-[11px]">
                            <span className="inline-flex items-center gap-1.5">
                              {ehSaida ? (
                                <ArrowDownCircle className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span>{m.tipo}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-800">{m.descricao}</td>
                          <td className="py-2.5 px-4 text-slate-600">
                            {formatFormaPagamento(m.formaPagamento)}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500">
                            {m.usuarioNome || 'Operador'}
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-mono tabular-nums font-bold ${
                              ehSaida ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {ehSaida ? '- ' : '+ '}
                            {formatCurrency(m.valor)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
