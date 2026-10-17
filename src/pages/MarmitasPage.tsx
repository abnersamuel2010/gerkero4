import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Check,
  Coffee,
  Cookie,
  Salad,
  ShoppingBag,
  Sparkles,
  Utensils,
  Layers,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { CarrosselHorizontal } from '../components/CarrosselHorizontal';
import {
  Produto,
  ConfiguracaoRestaurante,
  FormaPagamento,
  PagamentoMistoParcela,
  Pedido,
  ThermalReceiptData,
} from '../types';
import {
  criarPedidoCompleto,
  NovoItemPedidoInput,
} from '../services/pedidosService';
import {
  formatCurrency,
  formatDateTime,
  formatFormaPagamento,
} from '../utils/formatters';
import { DIAS_DA_SEMANA, getDiaHojeKey } from '../data/cardapioOficial';

export type OpcaoTamanhoRefeicao =
  | 'Pequena'
  | 'Média'
  | 'Grande';

interface MarmitasPageProps {
  produtos: Produto[];
  config: ConfiguracaoRestaurante;
  pedidos: Pedido[];
  onPrintReceipt: (receipt: ThermalReceiptData) => void;
}

export const MarmitasPage: React.FC<MarmitasPageProps> = ({
  produtos,
  config,
  pedidos,
  onPrintReceipt,
}) => {
  const [diaSemana, setDiaSemana] = useState<
    'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'
  >(getDiaHojeKey());
  const [tamanho, setTamanho] = useState<OpcaoTamanhoRefeicao>('Média');
  const [carnesSelecionadasIds, setCarnesSelecionadasIds] = useState<string[]>([]);
  const [avisoCarnes, setAvisoCarnes] = useState<string>('');
  const [acompanhamentosSelecionados, setAcompanhamentosSelecionados] = useState<string[]>([
    'Arroz',
    'Feijão',
    'Farofa',
  ]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<string[]>([]);
  const [bebidaId, setBebidaId] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacaoItem, setObservacaoItem] = useState<string>('');

  const [carrinho, setCarrinho] = useState<NovoItemPedidoInput[]>([]);
  const [secaoPedido, setSecaoPedido] = useState<
    'almoco' | 'marmita' | 'bebidas' | 'porcoes' | 'sobremesas'
  >('almoco');

  // Estado para Almoço no Salão / Executivo (sem escolha de carne)
  const [tipoAlmoco, setTipoAlmoco] = useState<'inteira' | 'meia'>('inteira');
  const [qtdAlmoco, setQtdAlmoco] = useState<number>(1);
  const [obsAlmoco, setObsAlmoco] = useState<string>('');

  // Estado para Porções Avulsas (em Marmita Separada)
  const [porcaoTipo, setPorcaoTipo] = useState<'carne' | 'acompanhamento'>('carne');
  const [porcaoItemNome, setPorcaoItemNome] = useState<string>('');
  const [porcaoQtd, setPorcaoQtd] = useState<number>(1);
  const [porcaoObs, setPorcaoObs] = useState<string>('');

  const [qtdProdutosAvulsos, setQtdProdutosAvulsos] = useState<Record<string, number>>({});
  const [clienteNome, setClienteNome] = useState<string>('Cliente Balcão');
  const [clienteTelefone, setClienteTelefone] = useState<string>('');

  // Pagamento: único ou misto (múltiplas formas)
  const [modoPagamento, setModoPagamento] = useState<'unico' | 'multiplo'>('unico');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [trocoPara, setTrocoPara] = useState<string>('');
  const [valoresMistos, setValoresMistos] = useState<{
    dinheiro: string;
    pix: string;
    cartao_debito: string;
    cartao_credito: string;
  }>({
    dinheiro: '',
    pix: '',
    cartao_debito: '',
    cartao_credito: '',
  });
  const [trocoMistoDinheiro, setTrocoMistoDinheiro] = useState<string>('');

  const [observacaoPedido, setObservacaoPedido] = useState<string>('');
  const [finalizando, setFinalizando] = useState(false);
  const [ultimoPedidoCriado, setUltimoPedidoCriado] = useState<number | null>(null);

  // Filtrar apenas produtos ativos e disponíveis no dia
  const disponiveis = produtos.filter((p) => p.ativo && p.disponivel);
  const carnesLista = disponiveis.filter(
    (p) => p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais'
  );

  // Carnes filtradas pela escala do dia da semana
  const carnesDoDia = carnesLista.filter(
    (c) => !c.diasSemana || c.diasSemana.length === 0 || c.diasSemana.includes(diaSemana)
  );

  const carnesNormaisDoDia = carnesDoDia.filter(
    (c) => !c.ehEspecial && !c.exigeSegundaCarne
  );
  const carnesEspeciaisDoDia = carnesDoDia.filter(
    (c) => c.ehEspecial || c.exigeSegundaCarne
  );

  const acompanhamentosLista = disponiveis.filter(
    (p) => p.categoria === 'Acompanhamentos'
  );
  const adicionaisLista = disponiveis.filter((p) => p.categoria === 'Adicionais');
  const bebidasLista = disponiveis.filter((p) => p.categoria === 'Bebidas');
  const sobremesasLista = disponiveis.filter(
    (p) =>
      p.categoria === 'Doces e Sobremesas' ||
      p.nome.toLowerCase().includes('doce') ||
      p.nome.toLowerCase().includes('pudim') ||
      p.nome.toLowerCase().includes('trufa') ||
      p.nome.toLowerCase().includes('paçoca') ||
      p.nome.toLowerCase().includes('canudo') ||
      (p.categoria === 'Outros' && p.preco > 0)
  );
  const saladasAvulsasLista = disponiveis.filter(
    (p) =>
      p.categoria === 'Saladas Avulsas' ||
      (p.categoria === 'Porções' && p.nome.toLowerCase().includes('salada')) ||
      p.nome.toLowerCase().includes('salada')
  );

  const handleAdicionarProdutoAvulso = (prod: Produto) => {
    const qtd = Math.max(1, qtdProdutosAvulsos[prod.id] || 1);
    const novoItem: NovoItemPedidoInput = {
      tipo: 'produto',
      nome: prod.nome,
      quantidade: qtd,
      valorUnitario: prod.preco,
    };
    setCarrinho((prev) => [...prev, novoItem]);
    // reset da quantidade desse produto
    setQtdProdutosAvulsos((prev) => ({ ...prev, [prod.id]: 1 }));
  };

  // Preços de Almoço Salão / Executivo (sem carne)
  const precoAlmocoInteira = Number(config.precoAlmocoInteira) || 30;
  const precoAlmocoMeia = Number(config.precoAlmocoMeia) || 20;
  const precoAlmocoUnitario = tipoAlmoco === 'inteira' ? precoAlmocoInteira : precoAlmocoMeia;

  const handleAdicionarAlmocoAoPedido = () => {
    const nomeItem =
      tipoAlmoco === 'inteira'
        ? 'Almoço Inteira (Adulto)'
        : 'Almoço Meia (Criança)';

    const novoItem: NovoItemPedidoInput = {
      tipo: 'produto',
      nome: nomeItem,
      quantidade: Math.max(1, qtdAlmoco),
      valorUnitario: precoAlmocoUnitario,
      observacao: obsAlmoco.trim() || undefined,
    };

    setCarrinho((prev) => [...prev, novoItem]);
    setObsAlmoco('');
    setQtdAlmoco(1);
  };

  const obterPrecoBaseTamanho = (tam: OpcaoTamanhoRefeicao): number => {
    switch (tam) {
      case 'Pequena':
        return Number(config.precoMarmitaP) || 16;
      case 'Média':
        return Number(config.precoMarmitaM) || 20;
      case 'Grande':
        return Number(config.precoMarmitaG) || 25;
      default:
        return Number(config.precoMarmitaM) || 20;
    }
  };

  // Limites e regras de carnes dinâmicas vindas das configurações do restaurante
  const diaHojeKey = getDiaHojeKey();
  const diaPermitido =
    Array.isArray(config.diasPermiteDuasCarnes) &&
    config.diasPermiteDuasCarnes.includes(diaHojeKey);
  const permiteMaisDeUmaHoje = Boolean(
    config.permitirMaisDeUmaCarne && diaPermitido
  );
  const limiteCarnesPermitido = permiteMaisDeUmaHoje
    ? (config.limiteCarnesMarmita || 2)
    : (config.quantidadeCarnesPadrao || 1);
  const taxaCarneExtra = Number(config.valorAdicionalSegundaCarne) || 0;

  const carnesSelecionadasObjs = carnesSelecionadasIds
    .map((id) => carnesLista.find((c) => c.id === id))
    .filter(Boolean) as Produto[];

  const temEspecial = carnesSelecionadasObjs.some(
    (c) => c.ehEspecial || c.exigeSegundaCarne
  );
  const qtdCarnesExtras = Math.max(0, carnesSelecionadasObjs.length - 1);
  const adicionalCarnesExtras = qtdCarnesExtras * taxaCarneExtra;

  const valorExtrasCarnes =
    carnesSelecionadasObjs.reduce((acc, c) => acc + (c.preco || 0), 0) +
    adicionalCarnesExtras;

  const bebidaObj = bebidasLista.find((b) => b.id === bebidaId);
  const valorAdicionais = adicionaisSelecionados.reduce((acc, id) => {
    const ad = adicionaisLista.find((a) => a.id === id);
    return acc + (ad?.preco || 0);
  }, 0);
  const valorBebida = bebidaObj?.preco || 0;

  const precoUnitarioMarmita =
    obterPrecoBaseTamanho(tamanho) +
    valorExtrasCarnes +
    valorAdicionais +
    valorBebida;

  // Produtos sugeridos para o carrossel de upselling dentro da montagem
  const produtosSugeridos = disponiveis.filter(
    (p) =>
      p.categoria === 'Bebidas' ||
      p.categoria === 'Doces e Sobremesas' ||
      p.categoria === 'Porções' ||
      p.categoria === 'Adicionais'
  );

  const handleMudarTamanho = (novoTam: OpcaoTamanhoRefeicao) => {
    setTamanho(novoTam);
    setAvisoCarnes('');
    if (novoTam === 'Pequena') {
      // Pequena aceita apenas 1 carne normal
      setCarnesSelecionadasIds((prev) => {
        const normais = prev.filter((id) => {
          const c = carnesLista.find((item) => item.id === id);
          return c && !c.ehEspecial && !c.exigeSegundaCarne;
        });
        return normais.slice(0, 1);
      });
    }
  };

  const toggleCarne = (carne: Produto) => {
    setAvisoCarnes('');
    const jaSelecionada = carnesSelecionadasIds.includes(carne.id);

    if (jaSelecionada) {
      setCarnesSelecionadasIds((prev) => prev.filter((id) => id !== carne.id));
      return;
    }

    const ehEstaEspecial = Boolean(carne.ehEspecial || carne.exigeSegundaCarne);

    // 1. Regra Marmita Pequena: apenas 1 carne tradicional e NÃO aceita especial
    if (tamanho === 'Pequena') {
      if (ehEstaEspecial) {
        alert('Carnes especiais só podem ser escolhidas na Marmita Média ou Grande.');
        return;
      }
      if (carnesSelecionadasIds.length >= 1) {
        alert('A Marmita Pequena permite apenas 1 carne tradicional.');
        return;
      }
      setCarnesSelecionadasIds([carne.id]);
      return;
    }

    // 2. Limite configurado de carnes (se tem especial, ela OBRIGATORIAMENTE deve acompanhar 1 normal, então permite ao menos 2)
    const limiteEfetivo = temEspecial || ehEstaEspecial
      ? Math.max(limiteCarnesPermitido, 2)
      : limiteCarnesPermitido;

    if (carnesSelecionadasIds.length >= limiteEfetivo) {
      alert(
        limiteEfetivo === 1
          ? 'Conforme as configurações do restaurante, é permitida apenas 1 carne por marmita.'
          : `Limite atingido! É permitido escolher no máximo ${limiteEfetivo} carnes.`
      );
      return;
    }

    // 3. Regra: Não se pode colocar duas carnes especiais na mesma marmita
    if (ehEstaEspecial && temEspecial) {
      alert('Não é permitido colocar duas carnes especiais na mesma marmita. A carne especial obrigatoriamente tem que acompanhar uma carne tradicional.');
      return;
    }

    // 4. Se está adicionando carne especial, alerta exclusivamente que precisa de carne tradicional
    if (ehEstaEspecial) {
      setAvisoCarnes('⚠️ Carne Especial selecionada: Obrigatoriamente selecione também 1 carne tradicional para acompanhar (não vai sozinha).');
    } else if (taxaCarneExtra > 0 && carnesSelecionadasIds.length >= 1) {
      setAvisoCarnes(`Aviso: Adicional de ${formatCurrency(taxaCarneExtra)} aplicado para carne adicional.`);
    }

    setCarnesSelecionadasIds((prev) => [...prev, carne.id]);
  };

  const toggleAcompanhamento = (nomeAcomp: string) => {
    setAcompanhamentosSelecionados((prev) =>
      prev.includes(nomeAcomp)
        ? prev.filter((a) => a !== nomeAcomp)
        : [...prev, nomeAcomp]
    );
  };

  const toggleAdicional = (idAdic: string) => {
    setAdicionaisSelecionados((prev) =>
      prev.includes(idAdic) ? prev.filter((a) => a !== idAdic) : [...prev, idAdic]
    );
  };

  // Adicionar Marmita montada ao pedido
  const handleAdicionarAoPedido = () => {
    if (carnesSelecionadasIds.length === 0) {
      alert('Por favor, selecione pelo menos uma carne para a marmita.');
      return;
    }

    const carnesNormais = carnesSelecionadasObjs.filter((c) => !c.ehEspecial && !c.exigeSegundaCarne);
    const carnesEspeciais = carnesSelecionadasObjs.filter((c) => c.ehEspecial || c.exigeSegundaCarne);

    // REGRA OBRIGATÓRIA: Carne especial tem que acompanhar outra carne normal, não vai sozinha!
    if (carnesEspeciais.length > 0 && carnesNormais.length === 0) {
      alert('A carne especial obrigatoriamente tem que acompanhar outra carne normal! Não tem a opção dela ir sozinha.');
      return;
    }

    const diaObj = DIAS_DA_SEMANA.find((d) => d.key === diaSemana);
    const carnesNomes = carnesSelecionadasObjs.map((c) => c.nome).join(' + ');
    const detalheCarnes = qtdCarnesExtras > 0 && taxaCarneExtra > 0
      ? ` (${qtdCarnesExtras}x Carne Extra: +${formatCurrency(adicionalCarnesExtras)})`
      : temEspecial
      ? ' (Carne Especial + Tradicional)'
      : '';

    const adicNomes = adicionaisSelecionados
      .map((id) => adicionaisLista.find((a) => a.id === id)?.nome)
      .filter(Boolean)
      .join(', ');

    const prefixoNome = `Marmita ${tamanho}`;

    const novoItem: NovoItemPedidoInput = {
      tipo: 'marmita',
      nome: `${prefixoNome} (${carnesNomes || 'Carne do Dia'}${detalheCarnes})`,
      tamanhoMarmita: tamanho,
      carnes: carnesNomes || 'Carne do Dia',
      acompanhamentos:
        acompanhamentosSelecionados.length > 0
          ? acompanhamentosSelecionados.join(', ')
          : 'Arroz, Feijão e Farofa',
      adicionais: adicNomes || undefined,
      bebidas: bebidaObj?.nome || undefined,
      quantidade: Math.max(1, quantidade),
      valorUnitario: Number(precoUnitarioMarmita.toFixed(2)),
      observacao: observacaoItem.trim() || undefined,
    };

    setCarrinho((prev) => [...prev, novoItem]);
    setCarnesSelecionadasIds([]);
    setAvisoCarnes('');
    setAdicionaisSelecionados([]);
    setBebidaId('');
    setQuantidade(1);
    setObservacaoItem('');
  };

  // Preço e adição de Porção Avulsa (em Marmita Separada)
  const precoPorcaoCalculado =
    porcaoTipo === 'carne'
      ? (config.precoPorcaoCarne || 22)
      : (config.precoPorcaoAcompanhamento || 12);

  const handleAdicionarPorcaoAvulsa = () => {
    const itemEscolhido =
      porcaoItemNome ||
      (porcaoTipo === 'carne'
        ? carnesNormaisDoDia[0]?.nome || 'Carne do Dia'
        : 'Arroz');

    const nomeItem =
      porcaoTipo === 'carne'
        ? `Porção Avulsa de Carne em Marmita Separada (${itemEscolhido})`
        : `Porção Avulsa de Acompanhamento (${itemEscolhido})`;

    const novoItem: NovoItemPedidoInput = {
      tipo: 'produto',
      nome: nomeItem,
      quantidade: Math.max(1, porcaoQtd),
      valorUnitario: precoPorcaoCalculado,
      observacao: porcaoObs.trim() || undefined,
    };

    setCarrinho((prev) => [...prev, novoItem]);
    setPorcaoObs('');
    setPorcaoQtd(1);
  };

  const removerItemCarrinho = (idx: number) => {
    setCarrinho((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalCarrinho = carrinho.reduce(
    (acc, item) => acc + item.quantidade * item.valorUnitario,
    0
  );

  // Cálculos para pagamentos divididos / múltiplos
  const totalPagoMisto = useMemo(() => {
    const d = parseFloat(valoresMistos.dinheiro.replace(',', '.')) || 0;
    const p = parseFloat(valoresMistos.pix.replace(',', '.')) || 0;
    const cd = parseFloat(valoresMistos.cartao_debito.replace(',', '.')) || 0;
    const cc = parseFloat(valoresMistos.cartao_credito.replace(',', '.')) || 0;
    return Number((d + p + cd + cc).toFixed(2));
  }, [valoresMistos]);

  const restanteMisto = Number((totalCarrinho - totalPagoMisto).toFixed(2));

  const handlePreencherRestante = (forma: 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito') => {
    const atual = parseFloat(valoresMistos[forma].replace(',', '.')) || 0;
    const aPreencher = Math.max(0, Number((atual + restanteMisto).toFixed(2)));
    setValoresMistos((prev) => ({
      ...prev,
      [forma]: aPreencher > 0 ? aPreencher.toFixed(2) : '',
    }));
  };

  const proximoNumeroPedido =
    pedidos.length > 0
      ? Math.max(...pedidos.map((p) => p.numero || 100)) + 1
      : 101;

  const handleFinalizarPedidoMarmita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (carrinho.length === 0) return;
    setFinalizando(true);
    try {
      const numGerado = proximoNumeroPedido;
      let formaPagamentoFinal: FormaPagamento = formaPagamento;
      let pagamentosMistosFinal: PagamentoMistoParcela[] | undefined = undefined;
      let textoFormaCupom = formatFormaPagamento(formaPagamento);
      let trocoCupom: string | undefined = undefined;
      let trocoNum = 0;

      if (modoPagamento === 'multiplo') {
        const vDinheiro = parseFloat(valoresMistos.dinheiro.replace(',', '.')) || 0;
        const vPix = parseFloat(valoresMistos.pix.replace(',', '.')) || 0;
        const vDebito = parseFloat(valoresMistos.cartao_debito.replace(',', '.')) || 0;
        const vCredito = parseFloat(valoresMistos.cartao_credito.replace(',', '.')) || 0;
        const totalInformado = Number((vDinheiro + vPix + vDebito + vCredito).toFixed(2));

        if (totalInformado < totalCarrinho - 0.05) {
          alert(`O valor total distribuído (${formatCurrency(totalInformado)}) é menor que o total do pedido (${formatCurrency(totalCarrinho)}). Por favor, informe o valor completo.`);
          setFinalizando(false);
          return;
        }

        const mistos: PagamentoMistoParcela[] = [];
        if (vDinheiro > 0) mistos.push({ forma: 'dinheiro', valor: vDinheiro });
        if (vPix > 0) mistos.push({ forma: 'pix', valor: vPix });
        if (vDebito > 0) mistos.push({ forma: 'cartao_debito', valor: vDebito });
        if (vCredito > 0) mistos.push({ forma: 'cartao_credito', valor: vCredito });

        if (mistos.length === 0) {
          alert('Por favor, informe ao menos uma forma de pagamento na divisão de valores.');
          setFinalizando(false);
          return;
        }

        formaPagamentoFinal = 'multiplo';
        pagamentosMistosFinal = mistos;

        const detalhes = mistos
          .map((m) => `${formatFormaPagamento(m.forma)} (${formatCurrency(m.valor)})`)
          .join(' + ');
        textoFormaCupom = `Misto: ${detalhes}`;

        const trocoMistoNum = parseFloat(trocoMistoDinheiro.replace(',', '.')) || 0;
        if (trocoMistoNum > vDinheiro && vDinheiro > 0) {
          trocoNum = trocoMistoNum - vDinheiro;
          trocoCupom = `Troco no Dinheiro: ${formatCurrency(trocoNum)} (Recebido ${formatCurrency(trocoMistoNum)} para pagar ${formatCurrency(vDinheiro)})`;
        }
      } else {
        trocoNum = formaPagamento === 'dinheiro'
          ? parseFloat(trocoPara.replace(',', '.')) || 0
          : 0;
        if (formaPagamento === 'dinheiro' && trocoNum > totalCarrinho) {
          trocoCupom = `Troco para ${formatCurrency(trocoNum)}: ${formatCurrency(trocoNum - totalCarrinho)}`;
        }
      }

      await criarPedidoCompleto({
        numero: numGerado,
        origem: 'marmita',
        clienteNome: clienteNome.trim() || 'Cliente Balcão',
        clienteTelefone: clienteTelefone.trim() || undefined,
        formaPagamento: formaPagamentoFinal,
        pagamentosMistos: pagamentosMistosFinal,
        trocoPara: trocoNum > 0 ? trocoNum : undefined,
        observacoes: observacaoPedido.trim() || undefined,
        itens: carrinho,
        enviarParaCozinha: true,
      });

      setUltimoPedidoCriado(numGerado);

      // Abrir cupom térmico automaticamente (compatível com Chrome / Bematech MP-4200)
      onPrintReceipt({
        titulo: 'CUPOM DE MARMITA / COZINHA',
        numeroDocumento: `PEDIDO #${numGerado}`,
        dataHora: formatDateTime(new Date().toISOString()),
        clienteOuMesa: clienteNome || 'Cliente Balcão',
        telefone: clienteTelefone || undefined,
        linhas: carrinho.map((item) => ({
          qtd: item.quantidade,
          descricao: item.tipo === 'marmita'
            ? `${item.nome} - Carnes: ${item.carnes} | Acomp: ${item.acompanhamentos}${
                item.adicionais ? ` | Adic: ${item.adicionais}` : ''
              }${item.bebidas ? ` | Bebida: ${item.bebidas}` : ''}`
            : item.nome,
          valor: item.quantidade * item.valorUnitario,
          observacao: item.observacao,
        })),
        subtotal: totalCarrinho,
        total: totalCarrinho,
        formaPagamento: textoFormaCupom,
        troco: trocoCupom,
        observacoesGerais: observacaoPedido || undefined,
      });

      setCarrinho([]);
      setObservacaoPedido('');
      setTrocoPara('');
      setValoresMistos({ dinheiro: '', pix: '', cartao_debito: '', cartao_credito: '' });
      setTrocoMistoDinheiro('');
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Venda e Montagem de Marmitas
          </h1>
          <p className="text-sm text-slate-600">
            Monte marmitas personalizadas (P, M ou G) com 1 ou 2 carnes, acompanhamentos, adicionais e bebidas
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-600">
          Próximo Pedido: <strong className="text-slate-900">#{proximoNumeroPedido}</strong>
        </div>
      </div>

      {ultimoPedidoCriado && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Pedido <strong>#{ultimoPedidoCriado}</strong> gerado com sucesso e enviado imediatamente para a Cozinha (KDS)!
            </span>
          </div>
          <button
            onClick={() => setUltimoPedidoCriado(null)}
            className="text-xs font-semibold underline"
          >
            Fechar aviso
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Montador de Marmita ou Produtos (7 colunas) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {/* Área de Seleção do Pedido: O que o cliente deseja incluir? */}
          <div className="space-y-2 pb-2 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Área de Seleção do Pedido (O que deseja pedir?)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Selecione o tipo
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setSecaoPedido('almoco')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  secaoPedido === 'almoco'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Utensils className="w-4 h-4" />
                  <span className="text-xs font-bold">1. Almoço</span>
                </div>
                <span className={`text-[10px] mt-1 ${secaoPedido === 'almoco' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Inteira R$ 30 · Meia R$ 20 (Sem carne)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSecaoPedido('marmita')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  secaoPedido === 'marmita'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-bold">2. Marmita</span>
                </div>
                <span className={`text-[10px] mt-1 ${secaoPedido === 'marmita' ? 'text-amber-100' : 'text-slate-500'}`}>
                  P, M, G · Carnes & Acomp.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSecaoPedido('bebidas')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  secaoPedido === 'bebidas'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Coffee className="w-4 h-4" />
                  <span className="text-xs font-bold">3. Bebidas</span>
                </div>
                <span className={`text-[10px] mt-1 ${secaoPedido === 'bebidas' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Refrigerantes, Água, Sucos
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSecaoPedido('porcoes')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  secaoPedido === 'porcoes'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-bold">4. Porção Avulsa</span>
                </div>
                <span className={`text-[10px] mt-1 ${secaoPedido === 'porcoes' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Marmita separada
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSecaoPedido('sobremesas')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  secaoPedido === 'sobremesas'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Cookie className="w-4 h-4" />
                  <span className="text-xs font-bold">5. Sobremesas</span>
                </div>
                <span className={`text-[10px] mt-1 ${secaoPedido === 'sobremesas' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Pudim, doces caseiros
                </span>
              </button>
            </div>
          </div>

          {secaoPedido === 'almoco' ? (
            /* SEÇÃO DE ALMOÇO (SALÃO / EXECUTIVO) - NÃO ESCOLHE CARNE */
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-amber-600" />
                      Almoço no Salão (Adulto & Criança)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Para clientes que almoçam no salão ou executivo. Não requer escolha de carnes.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sem escolha de carne
                  </span>
                </div>
              </div>

              {/* Opções: Inteira (Adulto) vs Meia (Criança) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  1. Selecione a Opção do Almoço
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoAlmoco('inteira')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      tipoAlmoco === 'inteira'
                        ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Adulto
                        </span>
                        {tipoAlmoco === 'inteira' && (
                          <Check className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-2">
                        Almoço Inteira (Adulto)
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Refeição completa servida no salão com pratos quentes e buffet à vontade.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60">
                      <span className="text-xs text-slate-500 block">Preço do Cardápio:</span>
                      <span className="text-base font-bold font-mono text-amber-700">
                        {formatCurrency(precoAlmocoInteira)}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoAlmoco('meia')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      tipoAlmoco === 'meia'
                        ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Criança
                        </span>
                        {tipoAlmoco === 'meia' && (
                          <Check className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-2">
                        Almoço Meia (Criança)
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Opção econômica para crianças e porções reduzidas servidas no salão.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60">
                      <span className="text-xs text-slate-500 block">Preço do Cardápio:</span>
                      <span className="text-base font-bold font-mono text-blue-700">
                        {formatCurrency(precoAlmocoMeia)}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quantidade e Observações */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Quantidade de Almoços
                  </label>
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs w-32">
                    <button
                      type="button"
                      onClick={() => setQtdAlmoco((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 font-mono font-semibold text-slate-900 text-center flex-1">
                      {qtdAlmoco}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQtdAlmoco((q) => q + 1)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Observação do Almoço (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mesa 04, Cliente no salão..."
                    value={obsAlmoco}
                    onChange={(e) => setObsAlmoco(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total do Almoço:</span>
                  <span className="text-lg font-bold font-mono text-amber-700">
                    {formatCurrency(precoAlmocoUnitario * qtdAlmoco)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAdicionarAlmocoAoPedido}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Almoço ao Pedido
                </button>
              </div>
            </div>
          ) : secaoPedido === 'porcoes' ? (
            /* SEÇÃO DE PORÇÃO AVULSA (EM MARMITA SEPARADA) */
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Montagem de Porção Avulsa (Em Marmita Separada)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione carne extra do dia ou acompanhamentos em uma marmita individual lacrada.
                </p>
              </div>

              {/* Escolha: Carne OU Acompanhamento */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  1. O que o cliente deseja na porção?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPorcaoTipo('carne');
                      setPorcaoItemNome(carnesNormaisDoDia[0]?.nome || 'Carne do Dia');
                    }}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      porcaoTipo === 'carne'
                        ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">🥩 Porção de Carne</div>
                    <div className="text-sm font-mono font-bold text-amber-700 mt-1">
                      {formatCurrency(Number(config.precoPorcaoCarne) || 22)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Carne selecionada do dia
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPorcaoTipo('acompanhamento');
                      setPorcaoItemNome('Arroz');
                    }}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      porcaoTipo === 'acompanhamento'
                        ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">🍚 Porção de Acompanhamento</div>
                    <div className="text-sm font-mono font-bold text-emerald-700 mt-1">
                      {formatCurrency(Number(config.precoPorcaoAcompanhamento) || 12)}
                    </div>
                    <span className="text-[10px] text-emerald-600 mt-0.5 block">
                      Mais barato · Marmita separada
                    </span>
                  </button>
                </div>
              </div>

              {/* Escolha do Item */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  2. Selecione {porcaoTipo === 'carne' ? 'a Carne do Dia' : 'o Acompanhamento'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(porcaoTipo === 'carne'
                    ? carnesNormaisDoDia.map((c) => c.nome)
                    : ['Arroz', 'Feijão', 'Macarrão', 'Salada', 'Farofa', 'Batata', 'Legumes']
                  ).map((nomeItem) => {
                    const selecionado = (porcaoItemNome || (porcaoTipo === 'carne' ? carnesNormaisDoDia[0]?.nome : 'Arroz')) === nomeItem;
                    return (
                      <button
                        key={nomeItem}
                        type="button"
                        onClick={() => setPorcaoItemNome(nomeItem)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                          selecionado
                            ? 'border-amber-600 bg-amber-50/70 text-slate-900 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{nomeItem}</span>
                        {selecionado && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantidade e Observações */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Quantidade de Porções
                  </label>
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs w-32">
                    <button
                      type="button"
                      onClick={() => setPorcaoQtd((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 font-mono font-semibold text-slate-900 text-center flex-1">
                      {porcaoQtd}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPorcaoQtd((q) => q + 1)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Observação da Porção (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ponto da carne, pouco sal..."
                    value={porcaoObs}
                    onChange={(e) => setPorcaoObs(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total da Porção:</span>
                  <span className="text-lg font-bold font-mono text-amber-700">
                    {formatCurrency(precoPorcaoCalculado * porcaoQtd)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAdicionarPorcaoAvulsa}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Porção ao Pedido
                </button>
              </div>
            </div>
          ) : secaoPedido === 'bebidas' ? (
            /* SEÇÃO DE BEBIDAS */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-blue-600" />
                  🥤 Bebidas Geladas & Água Mineral
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {bebidasLista.length} itens disponíveis
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {bebidasLista.map((beb) => {
                  const qtd = qtdProdutosAvulsos[beb.id] || 1;
                  return (
                    <div
                      key={beb.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3 hover:border-amber-400/80 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {beb.nome}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-700 whitespace-nowrap">
                            {formatCurrency(beb.preco)}
                          </span>
                        </div>
                        {beb.descricao && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                            {beb.descricao}
                          </p>
                        )}
                        {beb.estoque !== undefined && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Estoque: {beb.estoque} un.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              setQtdProdutosAvulsos((prev) => ({
                                ...prev,
                                [beb.id]: Math.max(1, qtd - 1),
                              }))
                            }
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 font-mono font-semibold text-slate-900 min-w-[20px] text-center">
                            {qtd}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQtdProdutosAvulsos((prev) => ({
                                ...prev,
                                [beb.id]: qtd + 1,
                              }))
                            }
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAdicionarProdutoAvulso(beb)}
                          className="flex-1 py-1.5 px-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : secaoPedido === 'sobremesas' ? (
            /* SEÇÃO DE SOBREMESAS & SALADAS AVULSAS */
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Cookie className="w-4 h-4 text-pink-600" />
                    🍰 Doces & Sobremesas Artesanais
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {sobremesasLista.length} itens disponíveis
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {sobremesasLista.map((docItem) => {
                    const qtd = qtdProdutosAvulsos[docItem.id] || 1;
                    return (
                      <div
                        key={docItem.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3 hover:border-amber-400/80 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {docItem.nome}
                            </span>
                            <span className="text-xs font-mono font-bold text-pink-700 whitespace-nowrap">
                              {formatCurrency(docItem.preco)}
                            </span>
                          </div>
                          {docItem.descricao && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {docItem.descricao}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setQtdProdutosAvulsos((prev) => ({
                                  ...prev,
                                  [docItem.id]: Math.max(1, qtd - 1),
                                }))
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 py-1 font-mono font-semibold text-slate-900 min-w-[20px] text-center">
                              {qtd}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQtdProdutosAvulsos((prev) => ({
                                  ...prev,
                                  [docItem.id]: qtd + 1,
                                }))
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdicionarProdutoAvulso(docItem)}
                            className="flex-1 py-1.5 px-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {saladasAvulsasLista.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Salad className="w-4 h-4 text-emerald-600" />
                      🥗 Saladas Avulsas & Frescas
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {saladasAvulsasLista.length} opções disponíveis
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {saladasAvulsasLista.map((sal) => {
                      const qtd = qtdProdutosAvulsos[sal.id] || 1;
                      return (
                        <div
                          key={sal.id}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3 hover:border-amber-400/80 transition-all"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {sal.nome}
                              </span>
                              <span className="text-xs font-mono font-bold text-emerald-700 whitespace-nowrap">
                                {formatCurrency(sal.preco)}
                              </span>
                            </div>
                            {sal.descricao && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                                {sal.descricao}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                              <button
                                type="button"
                                onClick={() =>
                                  setQtdProdutosAvulsos((prev) => ({
                                    ...prev,
                                    [sal.id]: Math.max(1, qtd - 1),
                                  }))
                                }
                                className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                              >
                                -
                              </button>
                              <span className="px-2 py-1 font-mono font-semibold text-slate-900 min-w-[20px] text-center">
                                {qtd}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setQtdProdutosAvulsos((prev) => ({
                                    ...prev,
                                    [sal.id]: qtd + 1,
                                  }))
                                }
                                className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAdicionarProdutoAvulso(sal)}
                              className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Adicionar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SEÇÃO DE MONTAGEM DE MARMITA PERSONALIZADA (P, M, G) */
            <>
          {/* 1. Dia da Semana */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              1. Dia do Cardápio Semanal
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DIAS_DA_SEMANA.map((dia) => (
                <button
                  key={dia.key}
                  type="button"
                  onClick={() => {
                    setDiaSemana(dia.key);
                    setCarnesSelecionadasIds([]);
                    setAvisoCarnes('');
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-colors border ${
                    diaSemana === dia.key
                      ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Escolha o Tamanho da Marmita */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-slate-800">
              2. Escolha o Tamanho da Marmita
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  'Pequena',
                  'Média',
                  'Grande',
                ] as const
              ).map((tam) => {
                const precoTam = obterPrecoBaseTamanho(tam);
                const selecionado = tamanho === tam;
                const badge =
                  tam === 'Pequena'
                    ? 'Individual'
                    : tam === 'Média'
                    ? 'Mais Pedida'
                    : 'Caprichada';
                return (
                  <button
                    key={tam}
                    type="button"
                    onClick={() => handleMudarTamanho(tam)}
                    className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                      selecionado
                        ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600 block mb-1">
                        {badge}
                      </span>
                      <div className="text-xs font-bold leading-tight">Marmita {tam}</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-mono tabular-nums font-bold text-amber-700">
                        {formatCurrency(precoTam)}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {tam === 'Pequena'
                          ? '1 Carne Tradicional'
                          : `Até ${limiteCarnesPermitido} Carnes`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Seleção de Carnes (Formato de cards, separado entre Tradicionais e Especiais) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Selecione a Carne ({DIAS_DA_SEMANA.find((d) => d.key === diaSemana)?.nomeCompleto})
                </label>
                <p className="text-[11px] text-slate-500">
                  {tamanho === 'Pequena' || limiteCarnesPermitido === 1
                    ? '1 carne inclusa no valor da marmita.'
                    : `Até ${limiteCarnesPermitido} carnes permitidas hoje (${taxaCarneExtra > 0 ? `+${formatCurrency(taxaCarneExtra)} cada adicional` : 'inclusas'}).`}
                </p>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {carnesSelecionadasIds.length} / {tamanho === 'Pequena' ? '1' : limiteCarnesPermitido} carnes
              </span>
            </div>

            {/* A. Carnes Tradicionais */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                🥩 Carnes Tradicionais do Dia:
              </span>
              <div className="grid sm:grid-cols-2 gap-2">
                {carnesNormaisDoDia.map((carne) => {
                  const marcado = carnesSelecionadasIds.includes(carne.id);
                  return (
                    <button
                      key={carne.id}
                      type="button"
                      onClick={() => toggleCarne(carne)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                        marcado
                          ? 'border-amber-600 bg-amber-50 text-slate-900 font-bold shadow-xs ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            marcado
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'border-slate-300 bg-slate-50'
                          }`}
                        >
                          {marcado && '✓'}
                        </div>
                        <span>{carne.nome}</span>
                      </div>
                      {carne.preco > 0 && (
                        <span className="text-[11px] text-amber-700 font-mono font-bold">
                          +{formatCurrency(carne.preco)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B. Carnes Especiais (Feijoada / Costela) */}
            {carnesEspeciaisDoDia.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    🔥 Carnes Especiais (Feijoada / Costela):
                  </span>
                  {tamanho === 'Pequena' && (
                    <span className="text-[10px] text-red-600 font-semibold">
                      * Indisponível na Pequena (requer Média ou Grande)
                    </span>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {carnesEspeciaisDoDia.map((carne) => {
                    const marcado = carnesSelecionadasIds.includes(carne.id);
                    const desabilitada =
                      tamanho === 'Pequena' || (temEspecial && !marcado);
                    return (
                      <button
                        key={carne.id}
                        type="button"
                        disabled={desabilitada}
                        onClick={() => toggleCarne(carne)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                          desabilitada
                            ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed text-slate-400'
                            : marcado
                            ? 'border-purple-600 bg-purple-50 text-slate-900 font-bold shadow-xs ring-1 ring-purple-500'
                            : 'border-purple-200 hover:border-purple-300 text-slate-800 bg-purple-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                              marcado
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-purple-300 bg-white'
                            }`}
                          >
                            {marcado && '✓'}
                          </div>
                          <span>{carne.nome}</span>
                        </div>
                        <span className="text-[10px] text-purple-700 font-semibold">
                          Especial
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alertas e Avisos de Regras */}
            {avisoCarnes && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{avisoCarnes}</span>
              </div>
            )}

            {qtdCarnesExtras > 0 && taxaCarneExtra > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>{qtdCarnesExtras}x Carne(s) Adicional(is) Selecionada(s):</strong> Adicional de {formatCurrency(adicionalCarnesExtras)} aplicado automaticamente.
                </span>
              </div>
            )}
          </div>

          {/* 5. Acompanhamentos */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              5. Acompanhamentos & Guarnições Diárias (Segunda a Sábado)
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {(acompanhamentosLista.length > 0
                ? acompanhamentosLista.map((a) => a.nome)
                : [
                    'Arroz',
                    'Feijão',
                    'Macarrão',
                    'Salada',
                    'Farofa',
                    'Batata',
                    'Legumes',
                  ]
              ).map((nomeAcomp) => {
                const marcado = acompanhamentosSelecionados.includes(nomeAcomp);
                return (
                  <label
                    key={nomeAcomp}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      marcado
                        ? 'border-amber-600 bg-amber-50/50 text-slate-900 font-medium'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => toggleAcompanhamento(nomeAcomp)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>{nomeAcomp}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 5. Adicionais */}
          {adicionaisLista.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-800">
                5. Adicionais Extras (Opcional)
              </label>
              <div className="grid sm:grid-cols-2 gap-2">
                {adicionaisLista.map((adic) => {
                  const marcado = adicionaisSelecionados.includes(adic.id);
                  return (
                    <label
                      key={adic.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        marcado
                          ? 'border-amber-600 bg-amber-50/50 text-slate-900 font-medium'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => toggleAdicional(adic.id)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>{adic.nome}</span>
                      </span>
                      <span className="font-mono tabular-nums text-amber-700 font-semibold">
                        +{formatCurrency(adic.preco)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Bebida, Quantidade e Observação */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                6. Adicionar Bebida (Opcional)
              </label>
              <select
                value={bebidaId}
                onChange={(e) => setBebidaId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
              >
                <option value="">Sem bebida nesta marmita</option>
                {bebidasLista.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome} (+{formatCurrency(b.preco)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Quantidade
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Observações desta Marmita
            </label>
            <input
              type="text"
              value={observacaoItem}
              onChange={(e) => setObservacaoItem(e.target.value)}
              placeholder="Ex: Sem cebola, feijão separado, bem passado..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <div>
              <div className="text-xs text-slate-500">Valor unitário montado</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(precoUnitarioMarmita)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdicionarAoPedido}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Marmita ao Pedido
            </button>
          </div>
            </>
          )}
        </div>

        {/* Resumo e Fechamento do Pedido (5 colunas) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 font-display border-b border-slate-200 pb-3">
            Resumo do Pedido #{proximoNumeroPedido}
          </h2>

          {carrinho.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              Monte uma marmita ou selecione produtos ao lado para incluir no pedido.
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {carrinho.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        {item.tipo === 'marmita' ? 'Marmita' : 'Produto'}
                      </span>
                      {item.quantidade}x {item.nome}
                    </div>
                    {item.tipo === 'marmita' ? (
                      <>
                        <div className="text-slate-600">
                          <strong>Carnes:</strong> {item.carnes}
                        </div>
                        <div className="text-slate-600">
                          <strong>Acomp:</strong> {item.acompanhamentos}
                        </div>
                        {item.adicionais && (
                          <div className="text-slate-600">
                            <strong>Adicionais:</strong> {item.adicionais}
                          </div>
                        )}
                        {item.bebidas && (
                          <div className="text-slate-600">
                            <strong>Bebida:</strong> {item.bebidas}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-500 text-[11px]">
                        Item avulso adicionado ao pedido
                      </div>
                    )}
                    {item.observacao && (
                      <div className="text-amber-800">
                        <strong>Obs:</strong> {item.observacao}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="font-mono tabular-nums font-bold text-sm text-slate-900">
                      {formatCurrency(item.quantidade * item.valorUnitario)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerItemCarrinho(idx)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleFinalizarPedidoMarmita} className="space-y-4 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  required
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telefone (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Seletor de Modo de Pagamento: Único vs Dividir (Múltiplas Formas) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Forma de Pagamento
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setModoPagamento('unico')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      modoPagamento === 'unico'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Forma Única
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoPagamento('multiplo')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      modoPagamento === 'multiplo'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Múltiplas Formas (Dividir)
                  </button>
                </div>
              </div>

              {modoPagamento === 'unico' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
                    >
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                    </select>
                  </div>

                  {formaPagamento === 'dinheiro' ? (
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        value={trocoPara}
                        onChange={(e) => setTrocoPara(e.target.value)}
                        placeholder="Troco para R$: Ex 50.00"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 flex items-center px-1">
                      Pagamento integral de {formatCurrency(totalCarrinho)}
                    </div>
                  )}
                </div>
              ) : (
                /* Pagamento Dividido / Múltiplas Formas */
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="text-[11px] text-slate-600">
                    Distribua o valor entre dinheiro, cartões e pix (ex: R$ 20 no dinheiro e R$ 2 no cartão):
                  </div>

                  <div className="space-y-2">
                    {/* Dinheiro */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 w-28 shrink-0 flex items-center gap-1">
                        💵 Dinheiro
                      </span>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={valoresMistos.dinheiro}
                          onChange={(e) =>
                            setValoresMistos((prev) => ({ ...prev, dinheiro: e.target.value }))
                          }
                          className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg font-mono bg-white focus:outline-none focus:border-amber-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePreencherRestante('dinheiro')}
                        className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md shrink-0"
                        title="Preencher o restante do pedido neste meio"
                      >
                        Restante
                      </button>
                    </div>

                    {/* Troco para dinheiro no misto */}
                    {parseFloat(valoresMistos.dinheiro) > 0 && (
                      <div className="pl-6 flex items-center gap-2 text-xs text-slate-600">
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">Troco p/ R$:</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 50.00"
                          value={trocoMistoDinheiro}
                          onChange={(e) => setTrocoMistoDinheiro(e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-md font-mono bg-white focus:outline-none focus:border-amber-600"
                        />
                        {parseFloat(trocoMistoDinheiro) > parseFloat(valoresMistos.dinheiro) && (
                          <span className="text-[11px] font-bold font-mono text-emerald-700">
                            Troco: {formatCurrency(parseFloat(trocoMistoDinheiro) - parseFloat(valoresMistos.dinheiro))}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Cartão de Débito */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 w-28 shrink-0 flex items-center gap-1">
                        💳 Cartão Débito
                      </span>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={valoresMistos.cartao_debito}
                          onChange={(e) =>
                            setValoresMistos((prev) => ({ ...prev, cartao_debito: e.target.value }))
                          }
                          className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg font-mono bg-white focus:outline-none focus:border-amber-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePreencherRestante('cartao_debito')}
                        className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md shrink-0"
                      >
                        Restante
                      </button>
                    </div>

                    {/* Cartão de Crédito */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 w-28 shrink-0 flex items-center gap-1">
                        💳 Cartão Crédito
                      </span>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={valoresMistos.cartao_credito}
                          onChange={(e) =>
                            setValoresMistos((prev) => ({ ...prev, cartao_credito: e.target.value }))
                          }
                          className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg font-mono bg-white focus:outline-none focus:border-amber-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePreencherRestante('cartao_credito')}
                        className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md shrink-0"
                      >
                        Restante
                      </button>
                    </div>

                    {/* Pix */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 w-28 shrink-0 flex items-center gap-1">
                        💠 Pix
                      </span>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={valoresMistos.pix}
                          onChange={(e) =>
                            setValoresMistos((prev) => ({ ...prev, pix: e.target.value }))
                          }
                          className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg font-mono bg-white focus:outline-none focus:border-amber-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePreencherRestante('pix')}
                        className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md shrink-0"
                      >
                        Restante
                      </button>
                    </div>
                  </div>

                  {/* Resumo e Validação do Misto */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Total Informado: </span>
                      <strong className="font-mono text-slate-900">{formatCurrency(totalPagoMisto)}</strong>
                    </div>
                    {restanteMisto > 0.01 ? (
                      <span className="text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                        Falta: {formatCurrency(restanteMisto)}
                      </span>
                    ) : restanteMisto < -0.01 ? (
                      <span className="text-red-700 font-semibold bg-red-100 px-2 py-0.5 rounded text-[11px]">
                        Excede: {formatCurrency(Math.abs(restanteMisto))}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        ✓ Valor 100% conferido
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observações Gerais do Pedido
              </label>
              <input
                type="text"
                value={observacaoPedido}
                onChange={(e) => setObservacaoPedido(e.target.value)}
                placeholder="Ex: Retira no balcão às 12h30..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-300">Total do Pedido</span>
              <span className="text-xl font-bold font-mono tabular-nums">
                {formatCurrency(totalCarrinho)}
              </span>
            </div>

            <button
              type="submit"
              disabled={carrinho.length === 0 || finalizando}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {finalizando
                ? 'Gerando Pedido...'
                : `Confirmar Pedido #${proximoNumeroPedido} e Imprimir`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
