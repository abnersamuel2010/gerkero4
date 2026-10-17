import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  Flame,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
  Copy,
  Check,
  Motorbike,
  ChefHat,
  MessageCircle,
  LogIn,
  AlertCircle,
  Package,
  Calendar,
  AlertTriangle,
  Facebook,
  Instagram,
  BookOpen,
  Beef,
} from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase/config';
import { CarrosselHorizontal } from '../components/CarrosselHorizontal';
import {
  Produto,
  RegiaoEntrega,
  ConfiguracaoRestaurante,
  FormaPagamento,
  Pedido,
  PedidoStatus,
  MarmitaTamanhoNome,
} from '../types';
import {
  criarPedidoCompleto,
  NovoItemPedidoInput,
} from '../services/pedidosService';
import { subscribeDocument } from '../services/firestoreService';
import { formatCurrency, formatTimeOnly } from '../utils/formatters';
import { IMAGENS_PADRAO } from '../services/firestoreService';
import { DIAS_DA_SEMANA, getDiaHojeKey } from '../data/cardapioOficial';
import { atualizarFavicon } from '../utils/favicon';

// Helper para obter a imagem de qualquer produto (usando imagemUrl do cadastro ou imagem padrão temática)
export const getImagemProduto = (prod: Produto): string => {
  if (prod.imagemUrl && prod.imagemUrl.trim().length > 0) {
    return prod.imagemUrl;
  }
  const nomeLower = prod.nome.toLowerCase();
  const catLower = (prod.categoria || '').toLowerCase();

  if (catLower.includes('carne')) {
    if (nomeLower.includes('frango')) return IMAGENS_PADRAO.marmitaFrango;
    if (nomeLower.includes('churrasco')) return IMAGENS_PADRAO.porcaoChurrasco;
    return IMAGENS_PADRAO.carnesGrelhadas;
  }
  if (catLower.includes('salada') || nomeLower.includes('salada')) {
    return IMAGENS_PADRAO.saladaFresca;
  }
  if (
    catLower.includes('bebida') ||
    nomeLower.includes('coca') ||
    nomeLower.includes('refri') ||
    nomeLower.includes('água') ||
    nomeLower.includes('agua') ||
    nomeLower.includes('tubaína') ||
    nomeLower.includes('tubaina') ||
    nomeLower.includes('suco')
  ) {
    return IMAGENS_PADRAO.bebidasGeladas;
  }
  if (catLower.includes('porç') || catLower.includes('porco')) {
    return IMAGENS_PADRAO.porcaoChurrasco;
  }
  if (catLower.includes('marmita')) {
    if (nomeLower.includes('frango')) return IMAGENS_PADRAO.marmitaFrango;
    return IMAGENS_PADRAO.marmitaPicanha;
  }
  return IMAGENS_PADRAO.carnesGrelhadas;
};

interface PortalClienteDeliveryProps {
  produtos: Produto[];
  regioes: RegiaoEntrega[];
  config: ConfiguracaoRestaurante;
  pedidos: Pedido[];
  onIrParaLogin?: () => void;
  onVerVitrineCardapio?: () => void;
}

export const PortalClienteDelivery: React.FC<PortalClienteDeliveryProps> = ({
  produtos,
  regioes,
  config,
  pedidos,
  onIrParaLogin,
  onVerVitrineCardapio,
}) => {
  // Filtros e busca (destaques como home inicial)
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('destaques');

  // Sacola de Compras
  const [sacola, setSacola] = useState<NovoItemPedidoInput[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  // Montagem interativa de Marmita (formato de seleção unificada sem Carne 2 separada)
  const [modalMarmitaAberto, setModalMarmitaAberto] = useState(false);
  const [tamMarmita, setTamMarmita] = useState<'Pequena' | 'Média' | 'Grande'>('Média');
  const [filtroSugeridosMarmita, setFiltroSugeridosMarmita] = useState<
    'todos' | 'bebidas' | 'sobremesas' | 'porcoes'
  >('todos');
  const [carnesEscolhidasIds, setCarnesEscolhidasIds] = useState<string[]>([]);
  const [avisoCarnesMarmita, setAvisoCarnesMarmita] = useState<string>('');
  const [acompEscolhidos, setAcompEscolhidos] = useState<string[]>([
    'Arroz',
    'Feijão',
    'Farofa',
  ]);
  const [obsMarmita, setObsMarmita] = useState('');

  // Modal de Personalização de Porção (escolher carne do dia OU acompanhamento)
  const [modalPorcaoAberto, setModalPorcaoAberto] = useState(false);
  const [porcaoSelecionada, setPorcaoSelecionada] = useState<Produto | null>(null);
  const [tipoItemPorcao, setTipoItemPorcao] = useState<'carne' | 'acompanhamento'>('carne');
  const [itemPorcaoEscolhido, setItemPorcaoEscolhido] = useState<string>('');
  const [obsPorcao, setObsPorcao] = useState<string>('');

  // Formulário de Checkout / Entrega
  const [etapaCheckout, setEtapaCheckout] = useState<'sacola' | 'dados' | 'pagamento'>('sacola');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [ruaNumero, setRuaNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [complemento, setComplemento] = useState('');
  const [regiaoSelecionadaId, setRegiaoSelecionadaId] = useState<string>('');
  const [formaPag, setFormaPag] = useState<FormaPagamento>('pix');
  const [precisaTrocoPara, setPrecisaTrocoPara] = useState('');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);

  // Acompanhamento do Pedido
  const [pedidoAtivoId, setPedidoAtivoId] = useState<string | null>(() => {
    return localStorage.getItem('ultimoPedidoDeliveryId') || null;
  });
  const [pedidoAtivo, setPedidoAtivo] = useState<Pedido | null>(null);

  // Regiões ativas
  const regioesAtivas = useMemo(() => regioes.filter((r) => r.ativo), [regioes]);
  useEffect(() => {
    if (!regiaoSelecionadaId && regioesAtivas.length > 0) {
      setRegiaoSelecionadaId(regioesAtivas[0].id);
    }
  }, [regioesAtivas, regiaoSelecionadaId]);

  // Carregar dados do pedido ativo em tempo real
  useEffect(() => {
    if (!pedidoAtivoId) {
      setPedidoAtivo(null);
      return;
    }
    const unsub = subscribeDocument<Pedido>('pedidos', pedidoAtivoId, (ped) => {
      if (ped) {
        setPedidoAtivo(ped);
      }
    });
    return () => unsub();
  }, [pedidoAtivoId]);

  // Categorização de produtos (ocultar buffet completamente do delivery)
  const produtosDisponiveis = useMemo(
    () =>
      produtos.filter(
        (p) =>
          p.ativo &&
          p.disponivel &&
          p.categoria !== 'Buffet' &&
          !p.nome.toLowerCase().includes('buffet') &&
          !p.nome.toLowerCase().includes('bf livre')
      ),
    [produtos]
  );

  const carnesDisponiveis = useMemo(
    () => produtosDisponiveis.filter((p) => p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais'),
    [produtosDisponiveis]
  );

  const diaHojeKey = getDiaHojeKey();
  const diaHojeInfo = useMemo(
    () => DIAS_DA_SEMANA.find((d) => d.key === diaHojeKey),
    [diaHojeKey]
  );

  // Carnes de hoje: carnes disponíveis e ativas no cardápio para o dia atual (ou disponíveis todos os dias)
  const carnesDoDia = useMemo(() => {
    return carnesDisponiveis.filter((c) => {
      if (!c.diasSemana || c.diasSemana.length === 0) return true;
      return c.diasSemana.includes(diaHojeKey);
    });
  }, [carnesDisponiveis, diaHojeKey]);

  const acompanhamentosDisponiveis = useMemo(
    () => produtosDisponiveis.filter((p) => p.categoria === 'Acompanhamentos'),
    [produtosDisponiveis]
  );

  // Filtragem no cardápio: apenas carnes do dia de hoje aparecem para o cliente
  const produtosFiltrados = useMemo(() => {
    return produtosDisponiveis.filter((p) => {
      if (p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais') {
        if (p.diasSemana && p.diasSemana.length > 0 && !p.diasSemana.includes(diaHojeKey)) {
          return false;
        }
      }

      const matchBusca =
        !busca.trim() ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busca.toLowerCase());

      const matchCat =
        categoriaAtiva === 'todos' ||
        (categoriaAtiva === 'marmitas' && p.categoria === 'Marmitas') ||
        (categoriaAtiva === 'produtos' &&
          (p.categoria === 'Bebidas' ||
            p.categoria === 'Doces e Sobremesas' ||
            p.categoria === 'Saladas Avulsas' ||
            p.categoria === 'Porções' ||
            p.categoria === 'Outros')) ||
        (categoriaAtiva === 'carnes' && (p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais')) ||
        (categoriaAtiva === 'bebidas' && p.categoria === 'Bebidas') ||
        (categoriaAtiva === 'porcoes' && p.categoria === 'Porções') ||
        (categoriaAtiva === 'doces' && p.categoria === 'Doces e Sobremesas') ||
        (categoriaAtiva === 'saladas' && p.categoria === 'Saladas Avulsas') ||
        (categoriaAtiva === 'acompanhamentos' && p.categoria === 'Acompanhamentos') ||
        (categoriaAtiva === 'outros' && (p.categoria === 'Outros' || p.categoria === 'Adicionais'));

      return matchBusca && matchCat;
    });
  }, [produtosDisponiveis, busca, categoriaAtiva, diaHojeKey]);

  // Preço base da marmita personalizada para entrega
  const precoBaseMarmita =
    tamMarmita === 'Pequena'
      ? Number(config.precoMarmitaP) || 16
      : tamMarmita === 'Média'
      ? Number(config.precoMarmitaM) || 20
      : Number(config.precoMarmitaG) || 25;

  // Limites e regras de carnes dinâmicas vindas das configurações do restaurante
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

  const carnesSelecionadasObjs = useMemo(() => {
    return carnesEscolhidasIds
      .map((id) => carnesDisponiveis.find((c) => c.id === id))
      .filter(Boolean) as Produto[];
  }, [carnesEscolhidasIds, carnesDisponiveis]);

  const temCarneEspecial = useMemo(() => {
    return carnesSelecionadasObjs.some((c) => c.ehEspecial || c.exigeSegundaCarne);
  }, [carnesSelecionadasObjs]);

  const qtdCarnesExtras = Math.max(0, carnesSelecionadasObjs.length - 1);
  const adicionalCarnesExtras = qtdCarnesExtras * taxaCarneExtra;

  const valorExtrasCarnes = useMemo(() => {
    return (
      carnesSelecionadasObjs.reduce((acc, c) => acc + (c.preco || 0), 0) +
      adicionalCarnesExtras
    );
  }, [carnesSelecionadasObjs, adicionalCarnesExtras]);

  const precoTotalMarmita = precoBaseMarmita + valorExtrasCarnes;

  // Produtos sugeridos para o carrossel de upselling dentro da montagem
  const produtosSugeridos = useMemo(() => {
    return produtosDisponiveis.filter(
      (p) =>
        p.categoria === 'Bebidas' ||
        p.categoria === 'Doces e Sobremesas' ||
        p.categoria === 'Porções' ||
        p.categoria === 'Adicionais'
    );
  }, [produtosDisponiveis]);

  // Carnes divididas para a montagem da marmita (exclusivamente carnes do dia de hoje)
  const carnesNormaisModal = useMemo(
    () => carnesDoDia.filter((c) => !c.ehEspecial && !c.exigeSegundaCarne),
    [carnesDoDia]
  );
  const carnesEspeciaisModal = useMemo(
    () => carnesDoDia.filter((c) => c.ehEspecial || c.exigeSegundaCarne),
    [carnesDoDia]
  );

  // Produtos sugeridos filtrados por aba para facilitar a escolha rápida
  const produtosSugeridosFiltrados = useMemo(() => {
    if (filtroSugeridosMarmita === 'todos') return produtosSugeridos;
    if (filtroSugeridosMarmita === 'bebidas') {
      return produtosSugeridos.filter((p) => p.categoria === 'Bebidas');
    }
    if (filtroSugeridosMarmita === 'sobremesas') {
      return produtosSugeridos.filter((p) => p.categoria === 'Doces e Sobremesas');
    }
    if (filtroSugeridosMarmita === 'porcoes') {
      return produtosSugeridos.filter(
        (p) => p.categoria === 'Porções' || p.categoria === 'Adicionais'
      );
    }
    return produtosSugeridos;
  }, [produtosSugeridos, filtroSugeridosMarmita]);

  // Cálculos da Sacola
  const regiaoObj =
    regioesAtivas.find((r) => r.id === regiaoSelecionadaId) || regioesAtivas[0];
  const taxaEntrega = regiaoObj ? regiaoObj.taxa : 0;
  const subtotalSacola = sacola.reduce(
    (acc, item) => acc + item.quantidade * item.valorUnitario,
    0
  );
  const totalSacola = subtotalSacola + (sacola.length > 0 ? taxaEntrega : 0);
  const totalItens = sacola.reduce((acc, i) => acc + i.quantidade, 0);

  // Adicionar produto comum à sacola
  const handleAdicionarProduto = (prod: Produto) => {
    setSacola((prev) => {
      const idx = prev.findIndex(
        (i) => i.nome === prod.nome && i.tipo === 'produto'
      );
      if (idx >= 0) {
        const novo = [...prev];
        novo[idx] = { ...novo[idx], quantidade: novo[idx].quantidade + 1 };
        return novo;
      }
      return [
        ...prev,
        {
          tipo: prod.categoria === 'Marmitas' ? 'marmita' : 'produto',
          nome: prod.nome,
          quantidade: 1,
          valorUnitario: prod.preco,
        },
      ];
    });
  };

  const handleAlterarQtdSacola = (index: number, delta: number) => {
    setSacola((prev) => {
      const novo = [...prev];
      const novaQtd = novo[index].quantidade + delta;
      if (novaQtd <= 0) {
        return novo.filter((_, i) => i !== index);
      }
      novo[index] = { ...novo[index], quantidade: novaQtd };
      return novo;
    });
  };

  const handleRemoverItemSacola = (index: number) => {
    setSacola((prev) => prev.filter((_, i) => i !== index));
  };

  // Alterar tamanho da marmita com regras de carne
  const handleMudarTamMarmita = (novoTam: 'Pequena' | 'Média' | 'Grande') => {
    setTamMarmita(novoTam);
    setAvisoCarnesMarmita('');
    if (novoTam === 'Pequena') {
      // Pequena só aceita 1 carne normal
      setCarnesEscolhidasIds((prev) => {
        const normais = prev.filter((id) => {
          const c = carnesDisponiveis.find((item) => item.id === id);
          return c && !c.ehEspecial && !c.exigeSegundaCarne;
        });
        return normais.slice(0, 1);
      });
    }
  };

  // Selecionar carne da marmita (formato de cards/seleção)
  const toggleCarneCliente = (carne: Produto) => {
    setAvisoCarnesMarmita('');
    const jaSelecionada = carnesEscolhidasIds.includes(carne.id);

    if (jaSelecionada) {
      setCarnesEscolhidasIds((prev) => prev.filter((id) => id !== carne.id));
      return;
    }

    const ehEstaEspecial = Boolean(carne.ehEspecial || carne.exigeSegundaCarne);

    // 1. Marmita Pequena: apenas 1 carne normal
    if (tamMarmita === 'Pequena') {
      if (ehEstaEspecial) {
        alert('Carnes especiais só podem ser escolhidas na Marmita Média ou Grande.');
        return;
      }
      if (carnesEscolhidasIds.length >= 1) {
        alert('A Marmita Pequena permite apenas 1 carne normal.');
        return;
      }
      setCarnesEscolhidasIds([carne.id]);
      return;
    }

    // 2. Limite configurado de carnes (se tem especial ou está selecionando especial, OBRIGATORIAMENTE permite ao menos 2 carnes pois carne especial não vai sozinha)
    const limiteEfetivo = temCarneEspecial || ehEstaEspecial
      ? Math.max(limiteCarnesPermitido, 2)
      : limiteCarnesPermitido;

    if (carnesEscolhidasIds.length >= limiteEfetivo) {
      alert(
        limiteEfetivo === 1
          ? 'No momento, é permitida apenas 1 carne por marmita conforme o cardápio de hoje.'
          : `Limite atingido! É permitido escolher no máximo ${limiteEfetivo} carnes por marmita.`
      );
      return;
    }

    // 3. Regra: Não se pode colocar duas carnes especiais na mesma marmita
    const jaTemEspecial = carnesEscolhidasIds.some((id) => {
      const c = carnesDisponiveis.find((item) => item.id === id);
      return Boolean(c?.ehEspecial || c?.exigeSegundaCarne);
    });

    if (ehEstaEspecial && jaTemEspecial) {
      alert('Não é permitido colocar duas carnes especiais na mesma marmita! A carne especial obrigatoriamente tem que acompanhar outra carne normal.');
      return;
    }

    // 4. Se está adicionando carne especial, avisa que precisa de carne normal
    if (ehEstaEspecial) {
      setAvisoCarnesMarmita('⚠️ Carne Especial selecionada: Obrigatoriamente selecione também 1 carne tradicional para acompanhar (a carne especial não pode ir sozinha).');
    } else if (taxaCarneExtra > 0 && carnesEscolhidasIds.length >= 1) {
      setAvisoCarnesMarmita(`Aviso: Adicional de ${formatCurrency(taxaCarneExtra)} aplicado para carne adicional.`);
    }

    setCarnesEscolhidasIds((prev) => [...prev, carne.id]);
  };

  // Abrir modal de marmita já com a carne escolhida
  const handleMontarComCarne = (carne: Produto) => {
    const ehEspecial = Boolean(carne.ehEspecial || carne.exigeSegundaCarne);
    if (ehEspecial && tamMarmita === 'Pequena') {
      setTamMarmita('Média');
    }
    setCarnesEscolhidasIds([carne.id]);
    if (ehEspecial) {
      setAvisoCarnesMarmita('⚠️ Carne Especial selecionada: Obrigatoriamente selecione também 1 carne normal para acompanhar (não vai sozinha).');
    } else {
      setAvisoCarnesMarmita('');
    }
    setModalMarmitaAberto(true);
  };

  // Adicionar marmita montada à sacola
  const handleAdicionarMarmita = () => {
    if (carnesEscolhidasIds.length === 0) {
      alert('Por favor, selecione pelo menos uma carne para a sua marmita.');
      return;
    }

    const carnesNormais = carnesSelecionadasObjs.filter((c) => !c.ehEspecial && !c.exigeSegundaCarne);
    const carnesEspeciais = carnesSelecionadasObjs.filter((c) => c.ehEspecial || c.exigeSegundaCarne);

    // REGRA OBRIGATÓRIA: Carne especial tem que acompanhar outra carne normal, não tem a opção de ir sozinha!
    if (carnesEspeciais.length > 0 && carnesNormais.length === 0) {
      alert('A carne especial obrigatoriamente tem que acompanhar outra carne normal! Não tem a opção dela ir sozinha. Por favor, selecione também uma carne tradicional.');
      return;
    }

    const carnesNomes = carnesSelecionadasObjs.map((c) => c.nome).join(' + ');

    const detalheCarnes = qtdCarnesExtras > 0 && taxaCarneExtra > 0
      ? ` (+${formatCurrency(adicionalCarnesExtras)} ${qtdCarnesExtras}x carne extra)`
      : temCarneEspecial
      ? ' (Carne Especial + Tradicional)'
      : '';

    const prefixoNome = `Marmita ${tamMarmita}`;

    setSacola((prev) => [
      ...prev,
      {
        tipo: 'marmita',
        nome: `${prefixoNome} (${carnesNomes || 'Carne do Dia'}${detalheCarnes})`,
        tamanhoMarmita: tamMarmita,
        carnes: carnesNomes || 'Carne do Dia Selecionada',
        acompanhamentos:
          acompEscolhidos.length > 0
            ? acompEscolhidos.join(', ')
            : 'Arroz, Feijão e Farofa',
        quantidade: 1,
        valorUnitario: Number(precoTotalMarmita.toFixed(2)),
        observacao: obsMarmita.trim() || undefined,
      },
    ]);
    setModalMarmitaAberto(false);
    setCarnesEscolhidasIds([]);
    setAvisoCarnesMarmita('');
    setObsMarmita('');
    setCarrinhoAberto(true);
  };

  // Abrir modal de personalização da porção (escolher carne ou acompanhamento)
  const handleAbrirModalPorcao = (prod: Produto, preSelecionarItem?: string) => {
    setPorcaoSelecionada(prod);
    setTipoItemPorcao('carne');
    setItemPorcaoEscolhido(preSelecionarItem || carnesDoDia[0]?.nome || 'Carne do Dia');
    setObsPorcao('');
    setModalPorcaoAberto(true);
  };

  // Confirmar porção na sacola
  const handleConfirmarPorcao = () => {
    if (!porcaoSelecionada) return;
    if (!itemPorcaoEscolhido) {
      alert('Por favor, selecione qual carne ou acompanhamento deseja na porção.');
      return;
    }

    const precoFinalPorcao =
      tipoItemPorcao === 'carne'
        ? Number(config.precoPorcaoCarne) || Number(porcaoSelecionada.preco) || 22
        : Number(config.precoPorcaoAcompanhamento) || 12;

    setSacola((prev) => [
      ...prev,
      {
        tipo: 'produto',
        nome: `Porção Avulsa (${tipoItemPorcao === 'carne' ? 'Carne' : 'Acompanhamento'}: ${itemPorcaoEscolhido})`,
        quantidade: 1,
        valorUnitario: precoFinalPorcao,
        observacao: obsPorcao.trim() || undefined,
      },
    ]);
    setModalPorcaoAberto(false);
    setCarrinhoAberto(true);
  };

  // Confirmar Pedido de Entrega
  const handleEnviarPedidoFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sacola.length === 0) return;
    if (!nomeCliente.trim() || !telefoneCliente.trim() || !ruaNumero.trim()) {
      alert('Por favor, preencha seu nome, telefone e endereço completo para entrega.');
      return;
    }

    setEnviandoPedido(true);
    try {
      // Garantir autenticação anônima se cliente não estiver autenticado
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.warn('Login anônimo para pedido delivery:', authErr);
        }
      }

      const proximoNumero =
        pedidos.length > 0
          ? Math.max(...pedidos.map((p) => p.numero || 100)) + 1
          : 101;

      const trocoVal =
        formaPag === 'dinheiro'
          ? parseFloat(precisaTrocoPara.replace(',', '.')) || 0
          : 0;

      const enderecoFormatado = `${ruaNumero.trim()}${
        bairro.trim() ? `, ${bairro.trim()}` : ''
      }${complemento.trim() ? ` (${complemento.trim()})` : ''}`;

      const novoPedidoId = await criarPedidoCompleto({
        numero: proximoNumero,
        origem: 'delivery',
        clienteNome: nomeCliente.trim(),
        clienteTelefone: telefoneCliente.trim(),
        enderecoEntrega: enderecoFormatado,
        regiaoId: regiaoObj?.id,
        regiaoNome: regiaoObj?.nome,
        taxaEntrega,
        formaPagamento: formaPag,
        trocoPara: trocoVal > 0 ? trocoVal : undefined,
        observacoes: observacaoGeral.trim() || undefined,
        itens: sacola,
        enviarParaCozinha: true,
        registrarCliente: true,
      });

      // Salvar no estado e localStorage para rastreamento
      setPedidoAtivoId(novoPedidoId);
      localStorage.setItem('ultimoPedidoDeliveryId', novoPedidoId);
      setSacola([]);
      setCarrinhoAberto(false);
      setEtapaCheckout('sacola');
    } catch (err) {
      console.error('Erro ao enviar pedido de entrega:', err);
      alert('Ocorreu um erro ao enviar seu pedido. Por favor, tente novamente ou entre em contato pelo telefone.');
    } finally {
      setEnviandoPedido(false);
    }
  };

  const handleCopiarChavePix = () => {
    const chave = config.cnpj || '42.189.301/0001-90';
    navigator.clipboard.writeText(chave);
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2000);
  };

  const handleEnviarMsgWhatsApp = (pedido: Pedido) => {
    const tel = (config.telefoneRestaurante || '').replace(/\D/g, '') || '11999999999';
    const texto = `Olá *${config.nomeRestaurante}*! Acabei de fazer o *Pedido #${pedido.numero}* pelo Cardápio Delivery Online.\n\n📍 *Endereço:* ${pedido.enderecoEntrega || 'A combinar'}\n💰 *Total:* ${formatCurrency(pedido.total)} (${formaPag})\n🍽️ *Itens:* ${pedido.resumoItens || 'Marmita'}\n\nPoderiam confirmar o recebimento? Obrigado!`;
    const url = `https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    atualizarFavicon(config.logoUrl || config.iconeCustomUrl);
    if (config.nomeRestaurante) {
      document.title = `${config.nomeRestaurante} — Cardápio & Delivery Online`;
    }
  }, [config.logoUrl, config.iconeCustomUrl, config.nomeRestaurante]);

  const corFundoEfetiva = config.corBody || config.corFundo || '#020617';
  const corBotoesEfetiva = config.corBotoes || '#f59e0b';
  const corPrimariaEfetiva = config.corPrimaria || '#e11d48';
  const corHeaderEfetiva = config.corHeader || '#0f172a';
  const corHeaderTextoEfetiva = config.corHeaderTexto || '#ffffff';
  const corFooterEfetiva = config.corFooter || '#020617';
  const corFooterTextoEfetiva = config.corFooterTexto || '#94a3b8';
  const corSugestoesEfetiva = config.corSugestoes || '#d97706';

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors"
      style={{ backgroundColor: corFundoEfetiva }}
    >
      {/* Barra de Notificação Superior */}
      <div
        className="px-4 py-2 text-center text-xs font-semibold text-slate-950 flex items-center justify-center gap-2 shadow-xs"
        style={{ backgroundColor: corBotoesEfetiva }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Cardápio Oficial Delivery — Faça seu pedido online com entrega rápida e quentinha!</span>
      </div>

      {/* Header Principal do Restaurante */}
      <header
        className="border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md shadow-lg transition-colors"
        style={{
          backgroundColor: corHeaderEfetiva ? `${corHeaderEfetiva}f0` : undefined,
          color: corHeaderTextoEfetiva || undefined,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Logo e Nome */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0 border border-white/20"
                  style={{ backgroundColor: corPrimariaEfetiva }}
                >
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt={config.nomeRestaurante || 'Logo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UtensilsCrossed className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">
                      {config.nomeRestaurante || 'RESTAURANTE KERO'}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aberto
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" /> 30-45 min
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {config.enderecoRestaurante || 'Entrega em domicílio'}
                      {config.cep ? ` (${config.cep})` : ''}
                    </span>
                  </p>
                </div>
              </div>

              {/* Botão da Sacola para mobile */}
              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setEtapaCheckout('sacola');
                    setCarrinhoAberto(true);
                  }}
                  className="relative p-2.5 rounded-xl text-slate-950 font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                  style={{ backgroundColor: corBotoesEfetiva }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalItens > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-950 text-white font-mono">
                      {totalItens}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Barra de Pesquisa Integrada no Header */}
            <div className="flex-1 max-w-xl mx-auto w-full">
              <div className="relative">
                <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar carnes do dia, saladas, bebidas, marmitas..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    if (e.target.value.trim().length > 0 && categoriaAtiva === 'destaques') {
                      setCategoriaAtiva('todos');
                    }
                  }}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all shadow-inner"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Ações do Header: Cardápio Vitrine, Pedido Ativo, Sacola e Login */}
            <div className="hidden md:flex items-center gap-2.5">
              {onVerVitrineCardapio && (
                <button
                  type="button"
                  onClick={onVerVitrineCardapio}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-amber-400 text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                  title="Ver o Cardápio Vitrine Completo com Fotos e Pratos do Dia"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Cardápio Vitrine</span>
                </button>
              )}

              {pedidoAtivo && (
                <button
                  type="button"
                  onClick={() => setCarrinhoAberto(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
                >
                  <Motorbike className="w-4 h-4 text-amber-400" />
                  Pedido #{pedidoAtivo.numero}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEtapaCheckout('sacola');
                  setCarrinhoAberto(true);
                }}
                className="relative px-4 py-2.5 rounded-xl text-slate-950 font-extrabold transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center gap-2.5"
                style={{ backgroundColor: corBotoesEfetiva }}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="text-xs font-extrabold">Sacola</span>
                {totalItens > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-white font-mono font-bold">
                    {totalItens} · {formatCurrency(subtotalSacola)}
                  </span>
                )}
              </button>

              {onIrParaLogin && (
                <button
                  type="button"
                  onClick={onIrParaLogin}
                  title="Acesso de Funcionários"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Subheader: Opções de Seleção de Categorias no Topo */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-none border-t border-slate-800/80 mt-2.5">
            {[
              { id: 'destaques', label: '🏠 Destaques de Hoje' },
              { id: 'produtos', label: '🛍️ Produtos (Bebidas, Doces & Saladas)' },
              { id: 'todos', label: '🍽️ Cardápio Completo' },
              { id: 'marmitas', label: '🍱 Marmitas Tradicionais' },
              { id: 'carnes', label: '🥩 Carnes de Hoje' },
              { id: 'saladas', label: '🥗 Saladas Frescas' },
              { id: 'bebidas', label: '🥤 Bebidas & Água' },
              { id: 'doces', label: '🍬 Doces & Sobremesas' },
              { id: 'porcoes', label: '🍲 Porções' },
              { id: 'acompanhamentos', label: '🍚 Guarnições' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoriaAtiva(cat.id);
                  if (cat.id === 'destaques') setBusca('');
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all shrink-0 ${
                  categoriaAtiva === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal — Ocupando mais espaço da tela */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Banner de Pedido em Andamento (Se houver) */}
        {pedidoAtivo && pedidoAtivo.status !== 'entregue' && pedidoAtivo.status !== 'cancelado' && (
          <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Pedido em Andamento: #{pedidoAtivo.numero}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {pedidoAtivo.status === 'novo' && 'Pedido recebido! Aguardando confirmação'}
                {pedidoAtivo.status === 'em_preparo' && 'Na cozinha! Sua marmita está sendo montada'}
                {pedidoAtivo.status === 'pronto' && 'Pedido pronto! Aguardando motoboy'}
                {pedidoAtivo.status === 'saiu_para_entrega' && `A caminho! Motoboy ${pedidoAtivo.entregadorNome || 'RESTAURANTE KERO'}`}
              </h3>
              <p className="text-xs text-slate-300">
                Endereço: {pedidoAtivo.enderecoEntrega} · Total: {formatCurrency(pedidoAtivo.total)}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleEnviarMsgWhatsApp(pedidoAtivo)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp do Restaurante
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('ultimoPedidoDeliveryId');
                  setPedidoAtivoId(null);
                  setPedidoAtivo(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline px-2 py-1"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* MODO HOME / DESTAQUES DE HOJE: Vitrine Visual Grande com Fotos Individuais */}
        {categoriaAtiva === 'destaques' && !busca.trim() && (
          <div className="space-y-10">
            {/* ÁREA DE SELEÇÃO RÁPIDA DO PEDIDO: O que você deseja pedir hoje? */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white font-display">
                      O que você quer colocar no pedido hoje?
                    </h3>
                    <p className="text-xs text-slate-400">
                      Selecione se deseja almoçar (Inteira ou Meia), pedir apenas bebidas geladas, porção avulsa ou doces:
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Opção 1: Marmitas Tradicionais (P, M, G) */}
                <div className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-md hover:shadow-amber-500/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🍱</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Mais Pedida
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      Marmita Completa (P, M, G)
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Monte sua marmita personalizada para entrega com carnes selecionadas, arroz, feijão e guarnições fresquinhas.
                    </p>
                    <div className="text-[11px] text-amber-400 font-mono font-bold pt-1">
                      P: {formatCurrency(config.precoMarmitaP || 16)} · M: {formatCurrency(config.precoMarmitaM || 20)} · G: {formatCurrency(config.precoMarmitaG || 25)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-3 mt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setTamMarmita('Pequena');
                        setCarnesEscolhidasIds([]);
                        setAvisoCarnesMarmita('');
                        setModalMarmitaAberto(true);
                      }}
                      className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs text-center border border-slate-700 transition-all active:scale-95"
                    >
                      P ({formatCurrency(config.precoMarmitaP || 16)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTamMarmita('Média');
                        setCarnesEscolhidasIds([]);
                        setAvisoCarnesMarmita('');
                        setModalMarmitaAberto(true);
                      }}
                      className="py-2 px-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs text-center shadow-xs transition-all active:scale-95"
                    >
                      M ({formatCurrency(config.precoMarmitaM || 20)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTamMarmita('Grande');
                        setCarnesEscolhidasIds([]);
                        setAvisoCarnesMarmita('');
                        setModalMarmitaAberto(true);
                      }}
                      className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs text-center border border-slate-700 transition-all active:scale-95"
                    >
                      G ({formatCurrency(config.precoMarmitaG || 25)})
                    </button>
                  </div>
                </div>

                {/* Opção 2: Pedir Apenas Bebidas */}
                <div className="bg-slate-950/80 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-md hover:shadow-sky-500/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🥤</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Bebidas Trincando
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                      Pedir só Bebida
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Refrigerantes lata e 2L, sucos naturais e água mineral gelada sem precisar montar marmita.
                    </p>
                    <div className="text-[11px] text-sky-400 font-mono font-bold pt-1">
                      A partir de R$ 5,00
                    </div>
                  </div>
                  <div className="pt-3 mt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoriaAtiva('bebidas');
                        setBusca('');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Escolher Bebidas
                    </button>
                  </div>
                </div>

                {/* Opção 3: Porção Avulsa (Marmita Separada) */}
                <div className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-md hover:shadow-emerald-500/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🍲</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Marmita Separada
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Porção Avulsa
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Quer carne reforçada ou acompanhamento avulso? Enviado em marmita individual lacrada.
                    </p>
                    <div className="text-[11px] text-emerald-400 font-mono font-bold pt-1">
                      Carne {formatCurrency(config.precoPorcaoCarne || 22)} · Acomp {formatCurrency(config.precoPorcaoAcompanhamento || 12)}
                    </div>
                  </div>
                  <div className="pt-3 mt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        const prodPorcaoExemplo = produtosDisponiveis.find((p) => p.categoria === 'Porções') || {
                          id: 'porcao_avulsa_temp',
                          nome: 'Porção Avulsa',
                          categoria: 'Porções' as const,
                          descricao: 'Porção avulsa enviada em marmita separada.',
                          preco: config.precoPorcaoCarne || 22,
                          disponivel: true,
                          ativo: true,
                          criadoEm: new Date().toISOString(),
                        };
                        handleAbrirModalPorcao(prodPorcaoExemplo);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Pedir Porção Avulsa
                    </button>
                  </div>
                </div>

                {/* Opção 4: Produtos & Doces */}
                <div className="bg-slate-950/80 border border-slate-800 hover:border-pink-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-md hover:shadow-pink-500/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🍰</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        Sobremesas & Outros
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">
                      Doces & Saladas
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Pudim de leite condensado caseiro, doces, trufas e saladas frescas avulsas.
                    </p>
                    <div className="text-[11px] text-pink-400 font-mono font-bold pt-1">
                      Sobremesas Artesanais
                    </div>
                  </div>
                  <div className="pt-3 mt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoriaAtiva('produtos');
                        setBusca('');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      Ver Sobremesas & Doces
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Cardápio / Montar Marmita Banner Especial */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-white/10">
              {/* Imagem de Fundo do Banner Configurado */}
              <div className="absolute inset-0 z-0">
                <img
                  src={config.bannerUrl || IMAGENS_PADRAO.porcaoChurrasco}
                  alt={config.nomeRestaurante || 'Banner do Restaurante'}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40"
                  style={{ backdropFilter: 'blur(2px)' }}
                />
              </div>

              <div className="relative z-10 max-w-2xl space-y-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-xs font-bold border border-white/10"
                  style={{ color: corBotoesEfetiva }}
                >
                  <UtensilsCrossed className="w-4 h-4" /> Especialidade {config.nomeRestaurante || 'RESTAURANTE KERO'}
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight text-white drop-shadow-md">
                  Marmitas Tradicionais & Carnes do Dia
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl drop-shadow-sm">
                  Escolha o tamanho (Pequena, Média ou Grande), carnes selecionadas e preparadas com sabor caseiro hoje ({DIAS_DA_SEMANA.find((d) => d.key === diaHojeKey)?.nomeCompleto}),
                  arroz soltinho, feijão especial e acompanhamentos fresquinhos.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalMarmitaAberto(true)}
                    className="px-6 py-3.5 rounded-xl text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95 border border-white/20"
                    style={{ backgroundColor: corBotoesEfetiva }}
                  >
                    <Plus className="w-4 h-4" />
                    Montar Minha Marmita (A partir de {formatCurrency(config.precoMarmitaP || 16)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoriaAtiva('todos')}
                    className="px-4 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-colors border border-white/10"
                  >
                    Ver Cardápio Completo
                  </button>
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: MARMITAS TRADICIONAIS COM MÁXIMO DESTAQUE NO TOPO */}
            <CarrosselHorizontal
              icone={<UtensilsCrossed className="w-6 h-6 text-amber-400" />}
              titulo="Escolha o Tamanho da sua Marmita"
              subtitulo="Tamanhos Pequena, Média e Grande para satisfazer todo tipo de fome com muito sabor e fartura."
            >
              {[
                {
                  tam: 'Pequena' as const,
                  preco: config.precoMarmitaP || 16,
                  regras: '1 Carne Normal Inclusa · Não aceita carnes especiais',
                  desc: 'Marmita individual perfeita para uma refeição leve e nutritiva.',
                  img: IMAGENS_PADRAO.marmitaFrango,
                },
                {
                  tam: 'Média' as const,
                  preco: config.precoMarmitaM || 20,
                  regras:
                    limiteCarnesPermitido === 1
                      ? '1 Carne Normal Inclusa · Aceita Carne Especial'
                      : `Até ${limiteCarnesPermitido} Carnes inclusas no tamanho`,
                  desc: 'Nosso tamanho mais pedido, equilibrado e super bem servido.',
                  img: IMAGENS_PADRAO.carnesGrelhadas,
                },
                {
                  tam: 'Grande' as const,
                  preco: config.precoMarmitaG || 25,
                  regras:
                    limiteCarnesPermitido === 1
                      ? '1 Carne Normal Inclusa · Aceita Carne Especial'
                      : `Até ${limiteCarnesPermitido} Carnes inclusas no tamanho`,
                  desc: 'Marmita caprichada para quem tem fome de verdade na hora do almoço.',
                  img: IMAGENS_PADRAO.porcaoChurrasco,
                },
              ].map((item) => (
                <div
                  key={item.tam}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[320px] flex-shrink-0 snap-start bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-amber-500/50 hover:shadow-xl transition-all"
                >
                  <div>
                    <div className="h-44 bg-slate-950 relative overflow-hidden">
                      <img
                        src={item.img}
                        alt={`Marmita ${item.tam}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[11px] font-bold text-amber-400 border border-amber-500/30">
                        Marmita {item.tam}
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                        Marmita {item.tam}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                      <div className="p-2 rounded-lg bg-slate-950 text-[11px] text-amber-300/90 font-medium border border-slate-800">
                        {item.regras}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 space-y-3">
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-xs text-slate-400">A partir de:</span>
                      <span className="text-lg font-mono font-extrabold text-amber-400">
                        {formatCurrency(item.preco)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTamMarmita(item.tam);
                        setCarnesEscolhidasIds([]);
                        setAvisoCarnesMarmita('');
                        setModalMarmitaAberto(true);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      Montar Marmita {item.tam}
                    </button>
                  </div>
                </div>
              ))}
            </CarrosselHorizontal>

            {/* SEÇÃO 2: CARNES SELECIONADAS DE HOJE */}
            {carnesDoDia.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm">
                Consulte os cortes e carnes do dia com a nossa equipe.
              </div>
            ) : (
              <CarrosselHorizontal
                icone={<Beef className="w-6 h-6 text-amber-400" />}
                titulo={`Carnes Selecionadas de Hoje (${DIAS_DA_SEMANA.find((d) => d.key === diaHojeKey)?.nomeCompleto})`}
                subtitulo={
                  limiteCarnesPermitido === 1
                    ? 'Carnes saborosas preparadas no ponto certo hoje. Inclusas na montagem da sua marmita.'
                    : `Carnes saborosas preparadas no ponto certo hoje. Permitido até ${limiteCarnesPermitido} carnes na marmita.`
                }
                badge={
                  <span className="px-3.5 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold whitespace-nowrap">
                    Escala de {DIAS_DA_SEMANA.find((d) => d.key === diaHojeKey)?.label}
                  </span>
                }
              >
                {carnesDoDia.map((carne) => {
                  const imgCarne = getImagemProduto(carne);
                  return (
                    <div
                      key={carne.id}
                      className="min-w-[270px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 snap-start bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-amber-500/50 hover:shadow-xl hover:shadow-black/60 transition-all"
                    >
                      <div>
                        {/* Imagem Grande em Destaque */}
                        <div className="h-48 sm:h-52 bg-slate-950 relative overflow-hidden">
                          <img
                            src={imgCarne}
                            alt={carne.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                          <div className="absolute top-3 left-3 flex flex-col gap-1">
                            <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[11px] font-bold text-amber-400 flex items-center gap-1 border border-amber-500/30">
                              <ChefHat className="w-3.5 h-3.5" /> Carne do Dia
                            </span>
                            {carne.ehEspecial && (
                              <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 backdrop-blur-xs text-[11px] font-bold text-purple-300 border border-purple-500/40">
                                Opção Especial
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                            {carne.nome}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {carne.descricao || 'Carne selecionada preparada no ponto com tempero artesanal da casa.'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 space-y-3">
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                          <span className="text-slate-400">Opção de Marmita:</span>
                          <span className="font-semibold text-emerald-400">
                            {carne.ehEspecial ? 'Opção Especial' : 'Inclusa na Marmita'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMontarComCarne(carne)}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                        >
                          <UtensilsCrossed className="w-4 h-4" />
                          Montar Marmita com esta Carne
                        </button>
                      </div>
                    </div>
                  );
                })}
              </CarrosselHorizontal>
            )}

            {/* SEÇÃO 2: SALADAS FRESCAS & LEVES (Carrossel Horizontal com Setas Laterais) */}
            <CarrosselHorizontal
              icone={<Sparkles className="w-6 h-6 text-emerald-400" />}
              titulo="Saladas Frescas & Leves"
              subtitulo="Mix de folhas higienizadas, legumes frescos e azeite especial para o seu almoço."
              badge={
                <span className="px-3.5 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold whitespace-nowrap">
                  100% Fresco do Dia
                </span>
              }
            >
              {produtosDisponiveis
                .filter((p) => p.categoria === 'Saladas Avulsas' || p.nome.toLowerCase().includes('salada'))
                .map((salada) => {
                  const imgSalada = getImagemProduto(salada);
                  return (
                    <div
                      key={salada.id}
                      className="min-w-[240px] sm:min-w-[270px] max-w-[270px] flex-shrink-0 snap-start bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-black/60 transition-all"
                    >
                      <div>
                        <div className="h-44 sm:h-48 bg-slate-950 relative overflow-hidden">
                          <img
                            src={imgSalada}
                            alt={salada.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[11px] font-bold text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                            <Sparkles className="w-3.5 h-3.5" /> Salada Fresca
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {salada.nome}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {salada.descricao || 'Mix de folhas verdes, tomate italiano, pepino crocante e tempero caseiro.'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 space-y-3">
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-xs text-slate-400">Preço:</span>
                          <span className="text-base font-mono font-extrabold text-amber-400">
                            {formatCurrency(salada.preco)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdicionarProduto(salada)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar à Sacola
                        </button>
                      </div>
                    </div>
                  );
                })}
            </CarrosselHorizontal>

            {/* SEÇÃO 3: BEBIDAS GELADAS & ÁGUA MINERAL (Carrossel Horizontal com Setas Laterais) */}
            <CarrosselHorizontal
              icone={<Package className="w-6 h-6 text-sky-400" />}
              titulo="Bebidas Geladas & Água Mineral"
              subtitulo="Água sem gás, água com gás, refrigerantes em lata e garrafa trincando de gelados."
              badge={
                <span className="px-3.5 py-1.5 bg-sky-500/15 text-sky-300 border border-sky-500/30 rounded-full text-xs font-bold whitespace-nowrap">
                  Bebidas Trincando
                </span>
              }
            >
              {produtosDisponiveis
                .filter((p) => p.categoria === 'Bebidas')
                .map((bebida) => {
                  const imgBebida = getImagemProduto(bebida);
                  const semEstoque = bebida.estoque !== undefined && bebida.estoque <= 0;
                  return (
                    <div
                      key={bebida.id}
                      className={`min-w-[220px] sm:min-w-[250px] max-w-[250px] flex-shrink-0 snap-start bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                        semEstoque
                          ? 'border-red-950/40 opacity-60'
                          : 'border-slate-800 hover:border-sky-500/50 hover:shadow-xl hover:shadow-black/60'
                      }`}
                    >
                      <div>
                        <div className="h-44 sm:h-48 bg-slate-950 relative overflow-hidden">
                          <img
                            src={imgBebida}
                            alt={bebida.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[11px] font-bold text-sky-400 flex items-center gap-1 border border-sky-500/30">
                              <Package className="w-3.5 h-3.5" /> Gelada
                            </span>
                            {bebida.estoque !== undefined && (
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                                  bebida.estoque > 0
                                    ? 'bg-slate-900/90 text-slate-300 border-slate-700'
                                    : 'bg-red-950/90 text-red-300 border-red-800'
                                }`}
                              >
                                {bebida.estoque > 0 ? `${bebida.estoque} un` : 'Esgotado'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                            {bebida.nome}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {bebida.descricao || 'Bebida bem gelada pronta para entrega.'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 space-y-3">
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-xs text-slate-400">Preço:</span>
                          <span className="text-base font-mono font-extrabold text-amber-400">
                            {formatCurrency(bebida.preco)}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={semEstoque}
                          onClick={() => handleAdicionarProduto(bebida)}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          {semEstoque ? 'Esgotado' : 'Pedir Bebida'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </CarrosselHorizontal>

          </div>
        )}

        {/* MODO CARDÁPIO COMPLETO OU RESULTADOS DE BUSCA */}
        {(categoriaAtiva !== 'destaques' || busca.trim().length > 0) && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg sm:text-2xl font-extrabold text-white font-display flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                  {busca.trim()
                    ? `Resultados para "${busca}"`
                    : categoriaAtiva === 'produtos'
                    ? 'Produtos (Bebidas, Sobremesas & Saladas Avulsas)'
                    : categoriaAtiva === 'todos'
                    ? 'Cardápio Completo'
                    : categoriaAtiva === 'marmitas'
                    ? 'Marmitas na Brasa'
                    : categoriaAtiva === 'carnes'
                    ? 'Carnes de Hoje'
                    : categoriaAtiva === 'saladas'
                    ? 'Saladas Frescas'
                    : categoriaAtiva === 'bebidas'
                    ? 'Bebidas & Água'
                    : categoriaAtiva === 'porcoes'
                    ? 'Porções'
                    : categoriaAtiva === 'doces'
                    ? 'Doces & Sobremesas'
                    : 'Cardápio'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  {produtosFiltrados.length} itens encontrados para entrega imediata
                </p>
              </div>

              {busca && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca('');
                    setCategoriaAtiva('destaques');
                  }}
                  className="text-xs text-amber-400 hover:underline self-start sm:self-auto"
                >
                  Voltar aos Destaques
                </button>
              )}
            </div>

            {produtosFiltrados.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-base font-bold text-slate-300">
                  Nenhum prato encontrado com os termos pesquisados.
                </p>
                <p className="text-xs text-slate-400">
                  Experimente buscar por "marmita", "feijoada", "coca", "salada" ou "água".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBusca('');
                    setCategoriaAtiva('destaques');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-colors"
                >
                  Ver Destaques de Hoje
                </button>
              </div>
            ) : categoriaAtiva === 'produtos' && !busca.trim() ? (
              /* EXIBIÇÃO DE PRODUTOS EM TÓPICOS DIFERENTES (Bebidas, Doces & Sobremesas, Saladas Avulsas) */
              <div className="space-y-10">
                {/* Tópico 1: Bebidas Geladas & Água */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                        🥤
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          Bebidas Geladas & Água Mineral
                        </h4>
                        <p className="text-xs text-slate-400">
                          Refrigerantes de lata e 2L, sucos naturais e água para acompanhar sua refeição
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-blue-300 border border-slate-700">
                      {produtosFiltrados.filter((p) => p.categoria === 'Bebidas').length} itens
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {produtosFiltrados
                      .filter((p) => p.categoria === 'Bebidas')
                      .map((prod) => {
                        const imgProd = getImagemProduto(prod);
                        const esgotado = prod.estoque !== undefined && prod.estoque <= 0;
                        return (
                          <div
                            key={prod.id}
                            className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                              esgotado
                                ? 'border-red-950/40 opacity-70'
                                : 'border-slate-800/80 hover:border-amber-500/50 hover:shadow-xl hover:shadow-black/50'
                            }`}
                          >
                            <div>
                              <div className="w-full h-44 bg-slate-950 relative overflow-hidden">
                                <img
                                  src={imgProd}
                                  alt={prod.nome}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-blue-300 border border-white/10">
                                  Bebida Gelada
                                </span>
                              </div>
                              <div className="p-4 space-y-2">
                                <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                                  {prod.nome}
                                </h4>
                                {prod.descricao && (
                                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                    {prod.descricao}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="p-4 pt-0 space-y-3">
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Preço:</span>
                                <span className="text-base font-extrabold text-amber-400 font-mono">
                                  {formatCurrency(prod.preco)}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={esgotado}
                                onClick={() => handleAdicionarProduto(prod)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                                  esgotado
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                {esgotado ? 'Esgotado' : 'Adicionar à Sacola'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Tópico 2: Doces & Sobremesas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                        🍰
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          Doces & Sobremesas Artesanais
                        </h4>
                        <p className="text-xs text-slate-400">
                          Pudins caseiros, doces em canudo, trufas e paçocas fresquinhas
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-pink-300 border border-slate-700">
                      {
                        produtosFiltrados.filter(
                          (p) =>
                            p.categoria === 'Doces e Sobremesas' ||
                            p.nome.toLowerCase().includes('doce') ||
                            p.nome.toLowerCase().includes('pudim') ||
                            p.nome.toLowerCase().includes('trufa') ||
                            p.nome.toLowerCase().includes('paçoca') ||
                            p.nome.toLowerCase().includes('canudo')
                        ).length
                      }{' '}
                      itens
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {produtosFiltrados
                      .filter(
                        (p) =>
                          p.categoria === 'Doces e Sobremesas' ||
                          p.nome.toLowerCase().includes('doce') ||
                          p.nome.toLowerCase().includes('pudim') ||
                          p.nome.toLowerCase().includes('trufa') ||
                          p.nome.toLowerCase().includes('paçoca') ||
                          p.nome.toLowerCase().includes('canudo')
                      )
                      .map((prod) => {
                        const imgProd = getImagemProduto(prod);
                        const esgotado = prod.estoque !== undefined && prod.estoque <= 0;
                        return (
                          <div
                            key={prod.id}
                            className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                              esgotado
                                ? 'border-red-950/40 opacity-70'
                                : 'border-slate-800/80 hover:border-pink-500/50 hover:shadow-xl hover:shadow-black/50'
                            }`}
                          >
                            <div>
                              <div className="w-full h-44 bg-slate-950 relative overflow-hidden">
                                <img
                                  src={imgProd}
                                  alt={prod.nome}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-pink-300 border border-white/10">
                                  Sobremesa
                                </span>
                              </div>
                              <div className="p-4 space-y-2">
                                <h4 className="text-base font-bold text-white group-hover:text-pink-400 transition-colors">
                                  {prod.nome}
                                </h4>
                                {prod.descricao && (
                                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                    {prod.descricao}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="p-4 pt-0 space-y-3">
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Preço:</span>
                                <span className="text-base font-extrabold text-pink-400 font-mono">
                                  {formatCurrency(prod.preco)}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={esgotado}
                                onClick={() => handleAdicionarProduto(prod)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                                  esgotado
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-pink-600 hover:bg-pink-700 text-white'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                {esgotado ? 'Esgotado' : 'Adicionar à Sacola'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Tópico 3: Saladas Avulsas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        🥗
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          Saladas Avulsas & Frescas
                        </h4>
                        <p className="text-xs text-slate-400">
                          Saladas coloridas, vinagrete tradicional e folhas frescas temperadas
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                      {
                        produtosFiltrados.filter(
                          (p) =>
                            p.categoria === 'Saladas Avulsas' ||
                            p.nome.toLowerCase().includes('salada')
                        ).length
                      }{' '}
                      opções
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {produtosFiltrados
                      .filter(
                        (p) =>
                          p.categoria === 'Saladas Avulsas' ||
                          p.nome.toLowerCase().includes('salada')
                      )
                      .map((prod) => {
                        const imgProd = getImagemProduto(prod);
                        const esgotado = prod.estoque !== undefined && prod.estoque <= 0;
                        return (
                          <div
                            key={prod.id}
                            className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                              esgotado
                                ? 'border-red-950/40 opacity-70'
                                : 'border-slate-800/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-black/50'
                            }`}
                          >
                            <div>
                              <div className="w-full h-44 bg-slate-950 relative overflow-hidden">
                                <img
                                  src={imgProd}
                                  alt={prod.nome}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-emerald-300 border border-white/10">
                                  Salada Fresca
                                </span>
                              </div>
                              <div className="p-4 space-y-2">
                                <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                                  {prod.nome}
                                </h4>
                                {prod.descricao && (
                                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                    {prod.descricao}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="p-4 pt-0 space-y-3">
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Preço:</span>
                                <span className="text-base font-extrabold text-emerald-400 font-mono">
                                  {formatCurrency(prod.preco)}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={esgotado}
                                onClick={() => handleAdicionarProduto(prod)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                                  esgotado
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                {esgotado ? 'Esgotado' : 'Adicionar à Sacola'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {produtosFiltrados.map((prod) => {
                  const imgProd = getImagemProduto(prod);
                  const esgotado = prod.estoque !== undefined && prod.estoque <= 0;
                  return (
                    <div
                      key={prod.id}
                      className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all ${
                        esgotado
                          ? 'border-red-950/40 opacity-70'
                          : 'border-slate-800/80 hover:border-amber-500/50 hover:shadow-xl hover:shadow-black/50'
                      }`}
                    >
                      <div>
                        {/* Imagem do Produto */}
                        <div className="w-full h-44 bg-slate-950 relative overflow-hidden">
                          <img
                            src={imgProd}
                            alt={prod.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-amber-300 border border-white/10">
                            {prod.categoria}
                          </span>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                            {prod.nome}
                          </h4>

                          {/* Badges de Estoque, Dias da Semana e Especial */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {prod.estoque !== undefined && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                  prod.estoque > 0
                                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                                    : 'bg-red-950 text-red-300 border-red-800'
                                }`}
                              >
                                <Package className="w-3 h-3 text-amber-400" />
                                {prod.estoque > 0 ? `${prod.estoque} un` : 'Esgotado'}
                              </span>
                            )}
                            {prod.ehEspecial && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                                Especial {prod.preco > 0 ? `(+${formatCurrency(prod.preco)})` : ''}
                              </span>
                            )}
                            {prod.exigeSegundaCarne && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                                Carne Mista (exige 2ª carne)
                              </span>
                            )}
                            {prod.diasSemana && prod.diasSemana.length > 0 && prod.diasSemana.length < 6 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800 text-[10px]">
                                <Calendar className="w-3 h-3 text-blue-400" />
                                {prod.diasSemana.map((d) => d.slice(0, 3)).join(', ')}
                              </span>
                            )}
                          </div>

                          {prod.descricao && (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {prod.descricao}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-0 space-y-3">
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-xs text-slate-400">Preço:</span>
                          <span className="text-base font-extrabold text-amber-400 font-mono">
                            {prod.preco === 0 ? 'Incluso na Marmita' : formatCurrency(prod.preco)}
                          </span>
                        </div>

                        {prod.categoria === 'Marmitas' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (prod.nome.includes('Pequena')) setTamMarmita('Pequena');
                              else if (prod.nome.includes('Grande')) setTamMarmita('Grande');
                              else setTamMarmita('Média');
                              setModalMarmitaAberto(true);
                            }}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Flame className="w-4 h-4" />
                            Montar Marmita
                          </button>
                        ) : prod.categoria === 'Porções' ? (
                          <button
                            type="button"
                            disabled={esgotado}
                            onClick={() => handleAbrirModalPorcao(prod)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Escolher Porção
                          </button>
                        ) : prod.categoria === 'Carnes' || prod.categoria === 'Carnes Especiais' ? (
                          <button
                            type="button"
                            onClick={() => handleMontarComCarne(prod)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Flame className="w-4 h-4" />
                            Montar Marmita com esta Carne
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={esgotado}
                            onClick={() => handleAdicionarProduto(prod)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                              esgotado
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            {esgotado ? 'Esgotado' : 'Adicionar à Sacola'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Botão Flutuante da Sacola (Mobile & Desktop) */}
      {totalItens > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom duration-200">
          <button
            type="button"
            onClick={() => {
              setEtapaCheckout('sacola');
              setCarrinhoAberto(true);
            }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 p-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-sm transition-transform active:scale-98 border border-amber-400/50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-mono text-xs">
                {totalItens}
              </div>
              <span>Ver Sacola Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-base">{formatCurrency(totalSacola)}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Tela Completa da Sacola & Checkout (Responsivo Celular, Tablet e PC) */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto animate-in fade-in">
          {/* Header Superior da Sacola com botão de voltar e passos */}
          <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCarrinhoAberto(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Continuar Comprando</span>
              </button>
              <div className="hidden sm:block h-4 w-px bg-slate-700" />
              <div className="hidden sm:flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-white font-display">
                  {config.nomeRestaurante || 'Churrascaria & Marmitaria'}
                </span>
              </div>
            </div>

            {/* Stepper / Indicador de Etapas */}
            <div className="flex items-center gap-1 sm:gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEtapaCheckout('sacola')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all ${
                  etapaCheckout === 'sacola'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                1. Sacola ({totalItens})
              </button>
              <span className="text-slate-600">→</span>
              <button
                type="button"
                disabled={sacola.length === 0}
                onClick={() => setEtapaCheckout('dados')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all ${
                  etapaCheckout === 'dados'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40'
                }`}
              >
                2. Entrega
              </button>
              <span className="text-slate-600">→</span>
              <button
                type="button"
                disabled={sacola.length === 0 || !nomeCliente.trim() || !telefoneCliente.trim() || !ruaNumero.trim()}
                onClick={() => setEtapaCheckout('pagamento')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all ${
                  etapaCheckout === 'pagamento'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40'
                }`}
              >
                3. Pagamento
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCarrinhoAberto(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar sacola"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Conteúdo da Sacola em Tela Cheia (Página Inteira Organizada para Celular e PC) */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-36">
            {sacola.length === 0 ? (
              <div className="text-center py-20 space-y-4 max-w-md mx-auto">
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto text-amber-400 shadow-xl">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white font-display">Sua sacola está vazia</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Adicione marmitas tradicionais, carnes selecionadas, bebidas geladas ou sobremesas para fazer seu pedido de entrega.
                </p>
                <button
                  type="button"
                  onClick={() => setCarrinhoAberto(false)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all"
                >
                  Ver Cardápio Completo
                </button>
              </div>
            ) : (
              <div className="lg:grid lg:grid-cols-12 gap-8 items-start">
                {/* Coluna Esquerda: Itens ou Formulários da Etapa (7 colunas no PC) */}
                <div className="lg:col-span-7 space-y-6">
                  {etapaCheckout === 'sacola' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <h4 className="text-base font-bold text-white flex items-center gap-2 font-display">
                            <ShoppingBag className="w-5 h-5 text-amber-400" />
                            Itens Selecionados ({totalItens})
                          </h4>
                          <p className="text-xs text-slate-400">
                            Revise os itens da sua marmita e adicione complementos
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCarrinhoAberto(false)}
                          className="text-xs text-amber-400 hover:underline font-semibold"
                        >
                          + Adicionar mais itens
                        </button>
                      </div>

                      {/* Lista de Itens com cards espaçosos */}
                      <div className="space-y-3">
                        {sacola.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700 shadow-sm"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-sm font-bold text-white font-display">
                                  {item.nome}
                                </h5>
                                {item.tamanhoMarmita && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {item.tamanhoMarmita}
                                  </span>
                                )}
                              </div>
                              {item.carnes && (
                                <p className="text-xs text-amber-300 font-medium">
                                  🥩 Carnes: {item.carnes}
                                </p>
                              )}
                              {item.acompanhamentos && (
                                <p className="text-xs text-slate-400">
                                  🍚 Acomp: {item.acompanhamentos}
                                </p>
                              )}
                              {item.adicionais && (
                                <p className="text-xs text-slate-400">
                                  ➕ Adic: {item.adicionais}
                                </p>
                              )}
                              {item.observacao && (
                                <p className="text-[11px] text-slate-400 italic">
                                  📝 Obs: {item.observacao}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                              <span className="text-base font-bold text-amber-400 font-mono">
                                {formatCurrency(item.valorUnitario * item.quantidade)}
                              </span>

                              <div className="flex items-center gap-2 bg-slate-950 rounded-xl p-1 border border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => handleAlterarQtdSacola(idx, -1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                  aria-label="Diminuir quantidade"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-mono font-bold px-2">
                                  {item.quantidade}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAlterarQtdSacola(idx, 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                  aria-label="Aumentar quantidade"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoverItemSacola(idx)}
                                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Remover item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Região de Entrega Prévia */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-2">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-400" />
                          Selecione o Bairro / Região da Entrega para calcular o frete:
                        </label>
                        <select
                          value={regiaoSelecionadaId}
                          onChange={(e) => setRegiaoSelecionadaId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                        >
                          {regioesAtivas.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nome} (+{formatCurrency(r.taxa)} de taxa · ~{r.tempoEstimadoMin || 35} min)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Carrossel de Sugestões de Acompanhamentos na Sacola (Destaque Ampliado) */}
                      {produtosSugeridos.length > 0 && (
                        <div className="pt-5 border-t border-slate-800 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 font-display">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Que tal Adicionar à sua Sacola? Sugestões para Você:
                              </span>
                              <p className="text-xs text-slate-300 mt-0.5">
                                Bebidas bem geladas trincando e sobremesas deliciosas para acompanhar sua refeição!
                              </p>
                            </div>
                          </div>
                          <CarrosselHorizontal className="space-y-1">
                            {produtosSugeridos.map((prod) => {
                              const img = getImagemProduto(prod);
                              const itemNaSacola = sacola.find((i) => i.nome === prod.nome && i.tipo === 'produto');
                              const qtdNaSacola = itemNaSacola ? itemNaSacola.quantidade : 0;
                              return (
                                <div
                                  key={prod.id}
                                  className="min-w-[200px] sm:min-w-[220px] max-w-[220px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-amber-500/60 transition-all flex-shrink-0 snap-start shadow-md hover:shadow-amber-500/10"
                                >
                                  <div>
                                    <div className="h-32 bg-slate-900 relative overflow-hidden">
                                      <img
                                        src={img}
                                        alt={prod.nome}
                                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                                      />
                                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-black/85 text-amber-400 border border-amber-500/30">
                                        {prod.categoria}
                                      </span>
                                    </div>
                                    <div className="p-3.5 space-y-1">
                                      <h6 className="text-xs sm:text-sm font-bold text-white truncate" title={prod.nome}>
                                        {prod.nome}
                                      </h6>
                                      <div className="text-xs sm:text-sm font-mono font-extrabold text-amber-400">
                                        {formatCurrency(prod.preco)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-3.5 pt-0">
                                    <button
                                      type="button"
                                      onClick={() => handleAdicionarProduto(prod)}
                                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                        qtdNaSacola > 0
                                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md font-extrabold active:scale-95'
                                      }`}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      {qtdNaSacola > 0 ? `Adicionado (${qtdNaSacola}x)` : 'Adicionar'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </CarrosselHorizontal>
                        </div>
                      )}
                    </div>
                  )}

                  {etapaCheckout === 'dados' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                      <div className="border-b border-slate-800 pb-3">
                        <h4 className="text-base font-bold text-white flex items-center gap-2 font-display">
                          <MapPin className="w-5 h-5 text-amber-400" />
                          Dados de Entrega & Contato
                        </h4>
                        <p className="text-xs text-slate-400">
                          Preencha seu endereço para o motoboy levar seu pedido quentinho
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-300">
                            Seu Nome Completo *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Carlos Eduardo"
                            value={nomeCliente}
                            onChange={(e) => setNomeCliente(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-300">
                            WhatsApp / Telefone com DDD *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="(11) 98765-4321"
                            value={telefoneCliente}
                            onChange={(e) => setTelefoneCliente(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500"
                          />
                          <p className="text-[10px] text-slate-400">
                            Usado para confirmação do pedido e contato do motoboy na entrega.
                          </p>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              Bairro / Região (Taxa de Entrega):
                            </span>
                            {taxaEntrega > 0 && (
                              <span className="text-amber-400 font-mono font-bold">
                                Taxa: {formatCurrency(taxaEntrega)}
                              </span>
                            )}
                          </label>
                          {regioesAtivas.length > 0 && (
                            <select
                              value={regiaoSelecionadaId}
                              onChange={(e) => {
                                setRegiaoSelecionadaId(e.target.value);
                                const reg = regioesAtivas.find((r) => r.id === e.target.value);
                                if (reg && !bairro) {
                                  setBairro(reg.nome);
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500"
                            >
                              {regioesAtivas.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.nome} — Taxa: {formatCurrency(r.taxa)} (~{r.tempoEstimadoMin || 35} min)
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-300">
                            Rua e Número da Residência *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Rua das Palmeiras, 150"
                            value={ruaNumero}
                            onChange={(e) => setRuaNumero(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300">
                            Bairro
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Centro"
                            value={bairro}
                            onChange={(e) => setBairro(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300">
                            Complemento / Apto / Bloco
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Bloco B, Apto 402"
                            value={complemento}
                            onChange={(e) => setComplemento(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-300">
                            Ponto de Referência ou Observações de Entrega (Opcional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ex: Casa com portão preto, interfone 12, deixar na portaria..."
                            value={observacaoGeral}
                            onChange={(e) => setObservacaoGeral(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {etapaCheckout === 'pagamento' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                      <div className="border-b border-slate-800 pb-3">
                        <h4 className="text-base font-bold text-white flex items-center gap-2 font-display">
                          <CreditCard className="w-5 h-5 text-amber-400" />
                          Forma de Pagamento
                        </h4>
                        <p className="text-xs text-slate-400">
                          Escolha como deseja pagar ao receber ou finalizar o pedido
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {[
                          {
                            id: 'pix',
                            label: 'PIX (Aprovação Instantânea)',
                            icon: QrCode,
                            desc: 'Chave CNPJ com código Copia e Cola',
                          },
                          {
                            id: 'cartao_credito',
                            label: 'Cartão na Entrega (Maquininha)',
                            icon: CreditCard,
                            desc: 'Débito ou Crédito levado pelo motoboy',
                          },
                          {
                            id: 'dinheiro',
                            label: 'Dinheiro na Entrega',
                            icon: Banknote,
                            desc: 'Pagamento em espécie com opção de troco',
                          },
                        ].map((item) => {
                          const Icon = item.icon;
                          const ativo = formaPag === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setFormaPag(item.id as FormaPagamento)}
                              className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                                ativo
                                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-md ring-1 ring-amber-500/50'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <Icon
                                className={`w-5 h-5 shrink-0 mt-0.5 ${
                                  ativo ? 'text-amber-400' : 'text-slate-500'
                                }`}
                              />
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-white">
                                  {item.label}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {item.desc}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {formaPag === 'pix' && (
                        <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300">
                              Chave PIX do Restaurante:
                            </span>
                            <button
                              type="button"
                              onClick={handleCopiarChavePix}
                              className="flex items-center gap-1 text-xs text-amber-400 hover:underline font-bold"
                            >
                              {pixCopiado ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  Copiado com sucesso!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copiar Chave PIX
                                </>
                              )}
                            </button>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl text-xs sm:text-sm font-mono text-slate-200 break-all select-all border border-slate-800">
                            {config.cnpj || '42.189.301/0001-90'}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Após enviar o pedido, você poderá anexar o comprovante na conversa do WhatsApp.
                          </p>
                        </div>
                      )}

                      {formaPag === 'dinheiro' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                          <label className="text-xs font-semibold text-slate-300">
                            Precisa de troco para quanto? (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 50,00 ou 100,00"
                            value={precisaTrocoPara}
                            onChange={(e) => setPrecisaTrocoPara(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500"
                          />
                        </div>
                      )}

                      {/* Resumo do Endereço de Entrega */}
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1.5 text-xs text-slate-300">
                        <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-400" />
                          Confirmar Destino da Entrega:
                        </div>
                        <p className="text-slate-200 font-bold">{nomeCliente}</p>
                        <p className="text-slate-400">
                          {ruaNumero}{bairro ? `, ${bairro}` : ''}{complemento ? ` (${complemento})` : ''}
                        </p>
                        <p className="text-slate-400">Telefone: {telefoneCliente}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Coluna Direita: Resumo Financeiro Fixo (5 colunas no PC) */}
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                    <h4 className="text-base font-bold text-white font-display border-b border-slate-800 pb-3">
                      Resumo da Sua Compra
                    </h4>

                    {/* Resumo compacto dos itens */}
                    <div className="space-y-2 max-h-48 overflow-y-auto text-xs pr-1 divide-y divide-slate-800/60">
                      {sacola.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5">
                          <span className="text-slate-300 truncate max-w-[220px]">
                            {it.quantidade}x {it.nome}
                          </span>
                          <span className="font-mono text-slate-200 font-bold shrink-0">
                            {formatCurrency(it.valorUnitario * it.quantidade)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span>Subtotal dos Produtos</span>
                        <span className="font-mono text-slate-200 font-semibold">
                          {formatCurrency(subtotalSacola)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Entrega ({regiaoObj?.nome || 'Região'})</span>
                        <span className="font-mono text-slate-200 font-semibold">
                          {taxaEntrega > 0 ? formatCurrency(taxaEntrega) : 'Grátis'}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                        <span>Total a Pagar</span>
                        <span className="font-mono text-amber-400 text-lg">
                          {formatCurrency(totalSacola)}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação por Etapa */}
                    {etapaCheckout === 'sacola' && (
                      <button
                        type="button"
                        onClick={() => setEtapaCheckout('dados')}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all active:scale-98"
                      >
                        <span>Continuar para Entrega</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {etapaCheckout === 'dados' && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled={!nomeCliente.trim() || !telefoneCliente.trim() || !ruaNumero.trim()}
                          onClick={() => setEtapaCheckout('pagamento')}
                          className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all active:scale-98"
                        >
                          <span>Avançar para Pagamento</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEtapaCheckout('sacola')}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Voltar para Sacola
                        </button>
                      </div>
                    )}

                    {etapaCheckout === 'pagamento' && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled={enviandoPedido}
                          onClick={handleEnviarPedidoFinal}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all active:scale-98"
                        >
                          {enviandoPedido ? (
                            <span>Enviando seu Pedido...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Enviar Pedido ({formatCurrency(totalSacola)})</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEtapaCheckout('dados')}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Voltar para Endereço
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Barra Inferior Fixa Mobile na Sacola para agilizar checkout no celular */}
            {sacola.length > 0 && (
              <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 shadow-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">
                      {etapaCheckout === 'sacola'
                        ? `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`
                        : etapaCheckout === 'dados'
                        ? 'Total com Frete'
                        : 'Total a Pagar'}
                    </span>
                    <span className="text-base font-extrabold text-amber-400 font-mono">
                      {formatCurrency(totalSacola)}
                    </span>
                  </div>

                  {etapaCheckout === 'sacola' && (
                    <button
                      type="button"
                      onClick={() => setEtapaCheckout('dados')}
                      className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                    >
                      <span>Avançar p/ Entrega</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {etapaCheckout === 'dados' && (
                    <button
                      type="button"
                      disabled={!nomeCliente.trim() || !telefoneCliente.trim() || !ruaNumero.trim()}
                      onClick={() => setEtapaCheckout('pagamento')}
                      className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                    >
                      <span>Ir p/ Pagamento</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {etapaCheckout === 'pagamento' && (
                    <button
                      type="button"
                      disabled={enviandoPedido}
                      onClick={handleEnviarPedidoFinal}
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                    >
                      {enviandoPedido ? (
                        <span>Enviando...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Finalizar Pedido</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </footer>
            )}
          </div>
        </div>
      )}

      {/* Modal Interativo para Montar Marmita */}
      {/* TELA COMPLETA: Montar Marmita Personalizada (Responsivo Celular e PC) */}
      {modalMarmitaAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto animate-in fade-in">
          {/* Topo / Header Fixo da Montagem */}
          <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalMarmitaAberto(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Voltar ao Cardápio</span>
              </button>
              <div className="hidden sm:block h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-display text-white leading-tight">
                    Montar Marmita Personalizada
                  </h3>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    Carnes selecionadas bem temperadas, guarnições fresquinhas e complementos
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Valor da Marmita:</span>
                <span className="text-base font-extrabold text-amber-400 font-mono">
                  {formatCurrency(precoTotalMarmita)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalMarmitaAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Fechar tela de montagem"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Corpo com Grid Amplo de 2 Colunas no Desktop em Página Inteira */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-36">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
              {/* Coluna Esquerda: Todos os Passos da Marmita (8 colunas no PC) */}
              <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                {/* 1. Escolha de Tamanho da Marmita */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <label className="text-sm sm:text-base font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 font-display">
                        🍱 1. Escolha o Tamanho da Marmita:
                      </label>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Defina o tamanho ideal para sua fome. Todas acompanham arroz, feijão e guarnições fresquinhas
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-amber-300 border border-slate-700 self-start sm:self-center">
                      Preço fixo com guarnições inclusas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                    {[
                      {
                        tam: 'Pequena' as const,
                        preco: Number(config.precoMarmitaP) || 16,
                        badge: 'Individual',
                        desc: '1 Carne Tradicional inclusa · Não aceita carnes especiais',
                        destaque: false,
                      },
                      {
                        tam: 'Média' as const,
                        preco: Number(config.precoMarmitaM) || 20,
                        badge: 'Mais Pedida ⭐',
                        desc:
                          limiteCarnesPermitido === 1
                            ? '1 Carne Inclusa · Aceita Carne Especial'
                            : `Até ${limiteCarnesPermitido} Carnes Inclusas · Aceita Carne Especial`,
                        destaque: true,
                      },
                      {
                        tam: 'Grande' as const,
                        preco: Number(config.precoMarmitaG) || 25,
                        badge: 'Caprichada 🔥',
                        desc:
                          limiteCarnesPermitido === 1
                            ? '1 Carne Inclusa · Aceita Carne Especial'
                            : `Até ${limiteCarnesPermitido} Carnes Inclusas · Aceita Carne Especial`,
                        destaque: false,
                      },
                    ].map((t) => (
                      <button
                        key={t.tam}
                        type="button"
                        onClick={() => handleMudarTamMarmita(t.tam)}
                        className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
                          tamMarmita === t.tam
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-2xl ring-2 ring-amber-500/50 scale-101'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                              {t.badge}
                            </span>
                            {tamMarmita === t.tam && (
                              <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="text-lg font-bold text-white font-display">Marmita {t.tam}</div>
                          <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">{t.desc}</div>
                        </div>
                        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">A partir de:</span>
                          <div className="text-xl font-mono font-extrabold text-amber-400">
                            {formatCurrency(t.preco)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Seleção de Carne do Dia (Sem seletor semanal para o cliente) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm sm:text-base font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 font-display">
                          🥩 2. Carnes Selecionadas de Hoje:
                        </label>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {diaHojeInfo?.nomeCompleto || 'Hoje'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {tamMarmita === 'Pequena' || limiteCarnesPermitido === 1
                          ? '1 carne tradicional inclusa no valor da marmita.'
                          : `Até ${limiteCarnesPermitido} carnes inclusas no valor da sua marmita.`}
                      </p>
                    </div>
                    <span className="text-xs font-bold font-mono px-3.5 py-1.5 rounded-xl bg-slate-950 text-amber-400 border border-slate-800 shrink-0 self-start sm:self-center shadow-inner">
                      {carnesEscolhidasIds.length} / {tamMarmita === 'Pequena' ? '1' : limiteCarnesPermitido} carnes
                    </span>
                  </div>

                  {/* A. Carnes Tradicionais de Hoje */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
                      <ChefHat className="w-4 h-4 text-amber-400" />
                      Carnes Tradicionais de Hoje:
                    </span>
                    {carnesNormaisModal.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                        Nenhuma carne tradicional cadastrada para a escala de hoje. Consulte nossa equipe!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {carnesNormaisModal.map((carne) => {
                          const marcado = carnesEscolhidasIds.includes(carne.id);
                          return (
                            <button
                              key={carne.id}
                              type="button"
                              onClick={() => toggleCarneCliente(carne)}
                              className={`flex items-center justify-between p-4 rounded-2xl border text-left text-xs transition-all ${
                                marcado
                                  ? 'bg-amber-500/15 border-amber-500 text-white font-bold shadow-lg ring-1 ring-amber-500/50'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs ${
                                    marcado
                                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-xs'
                                      : 'border-slate-700 bg-slate-900 text-transparent'
                                  }`}
                                >
                                  ✓
                                </div>
                                <span className="font-semibold text-sm text-white">{carne.nome}</span>
                              </div>
                              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                Opção Inclusa
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* B. Carnes Especiais de Hoje (Feijoada, Costela, etc.) */}
                  {carnesEspeciaisModal.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wide">
                          ⭐ Carnes Especiais de Hoje ({diaHojeInfo?.label}):
                        </span>
                        {tamMarmita === 'Pequena' ? (
                          <span className="text-[11px] text-red-400 font-semibold bg-red-950/40 px-2.5 py-0.5 rounded-lg border border-red-800/40">
                            * Indisponível na Pequena (requer Média ou Grande)
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-300 font-semibold bg-amber-950/40 px-2.5 py-0.5 rounded-lg border border-amber-800/40">
                            Obrigatório acompanhar 1 Carne Tradicional
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {carnesEspeciaisModal.map((carne) => {
                          const marcado = carnesEscolhidasIds.includes(carne.id);
                          const jaTemOutraEspecial = temCarneEspecial && !marcado;
                          const desabilitada = tamMarmita === 'Pequena' || jaTemOutraEspecial;
                          return (
                            <button
                              key={carne.id}
                              type="button"
                              disabled={desabilitada}
                              onClick={() => toggleCarneCliente(carne)}
                              className={`flex items-center justify-between p-4 rounded-2xl border text-left text-xs transition-all ${
                                desabilitada
                                  ? 'opacity-40 bg-slate-950 border-slate-800/60 cursor-not-allowed text-slate-500'
                                  : marcado
                                  ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-bold shadow-lg ring-1 ring-purple-500/50'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs ${
                                    marcado
                                      ? 'bg-purple-500 border-purple-500 text-white font-bold shadow-xs'
                                      : 'border-slate-700 bg-slate-900 text-transparent'
                                  }`}
                                >
                                  ✓
                                </div>
                                <span className="font-semibold text-sm text-white">{carne.nome}</span>
                              </div>
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                Especial
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Avisos dinâmicos da seleção */}
                  {avisoCarnesMarmita && (
                    <div className="p-4 bg-amber-950/50 border border-amber-500/50 rounded-2xl text-xs text-amber-200 flex items-center gap-2.5 animate-in fade-in shadow-md">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>{avisoCarnesMarmita}</span>
                    </div>
                  )}

                  {qtdCarnesExtras > 0 && taxaCarneExtra > 0 && (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-center gap-2.5">
                      <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>
                        <strong>{qtdCarnesExtras}x Carne Adicional Selecionada:</strong> Adicional de {formatCurrency(adicionalCarnesExtras)} aplicado no total da marmita.
                      </span>
                    </div>
                  )}

                  {temCarneEspecial && carnesEscolhidasIds.length === 1 && (
                    <div className="p-4 bg-amber-950/70 border border-amber-500/70 rounded-2xl text-xs text-amber-200 flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Regra Obrigatória:</strong> A carne especial selecionada <u>obrigatoriamente tem que acompanhar outra carne tradicional</u> (não vai sozinha). Por favor, selecione também uma das carnes normais acima.
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Acompanhamentos & Guarnições Diárias */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3">
                    <label className="text-sm sm:text-base font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 font-display">
                      🍚 3. Acompanhamentos & Guarnições Diárias:
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Já inclusos no valor da marmita. Marque as guarnições que você deseja colocar:
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {[
                      'Arroz',
                      'Feijão',
                      'Macarrão',
                      'Salada',
                      'Farofa',
                      'Batata',
                      'Legumes',
                    ].map((nomeAcomp) => {
                      const marcado = acompEscolhidos.includes(nomeAcomp);
                      return (
                        <label
                          key={nomeAcomp}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs sm:text-sm cursor-pointer transition-all ${
                            marcado
                              ? 'bg-amber-500/15 border-amber-500 text-white font-bold shadow-md ring-1 ring-amber-500/30'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAcompEscolhidos((prev) => [...prev, nomeAcomp]);
                              } else {
                                setAcompEscolhidos((prev) =>
                                  prev.filter((n) => n !== nomeAcomp)
                                );
                              }
                            }}
                            className="rounded-lg text-amber-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                          />
                          <span className="truncate">{nomeAcomp}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Observações da Marmita */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-3 shadow-xl">
                  <label className="text-sm sm:text-base font-bold text-slate-200 flex items-center gap-2">
                    📝 4. Observações para a sua Marmita (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sem cebola na salada, feijão separado, farofa por cima, bem passada..."
                    value={obsMarmita}
                    onChange={(e) => setObsMarmita(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                  />
                </div>

                {/* 5. CARROSSEL DE SUGESTÕES DE ACOMPANHAMENTOS (MUITO MAIS APARENTE & COMPLETO) */}
                {produtosSugeridos.length > 0 && (
                  <div
                    className="border-2 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${corSugestoesEfetiva}25 0%, #0f172a 50%, #020617 100%)`,
                      borderColor: corSugestoesEfetiva || '#f59e0b',
                      boxShadow: `0 12px 36px -10px ${corSugestoesEfetiva}35`,
                    }}
                  >
                    {/* Header Destaque com visual convidativo */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/25 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                          </span>
                          <span className="text-base sm:text-xl font-extrabold uppercase tracking-wide text-amber-400 font-display">
                            Que tal Acompanhar sua Marmita? Sugestões para Você:
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed">
                          Turbine sua refeição! Adicione bebidas geladas trincando, porções crocantes e doces caseiros deliciosos com apenas 1 clique:
                        </p>
                      </div>

                      {/* Filtros rápidos por categoria para o cliente achar na hora */}
                      <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center shrink-0">
                        {[
                          { id: 'todos', label: 'Todos' },
                          { id: 'bebidas', label: '🥤 Bebidas' },
                          { id: 'sobremesas', label: '🍮 Sobremesas' },
                          { id: 'porcoes', label: '🍟 Porções' },
                        ].map((filtro) => (
                          <button
                            key={filtro.id}
                            type="button"
                            onClick={() => setFiltroSugeridosMarmita(filtro.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              filtroSugeridosMarmita === filtro.id
                                ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
                                : 'bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            {filtro.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Carrossel Horizontal Amplo com Cards Maiores e Atraentes */}
                    <CarrosselHorizontal className="space-y-1">
                      {produtosSugeridosFiltrados.map((prod) => {
                        const imgProd = getImagemProduto(prod);
                        const itemNaSacola = sacola.find(
                          (i) => i.nome === prod.nome && i.tipo === 'produto'
                        );
                        const qtdNaSacola = itemNaSacola ? itemNaSacola.quantidade : 0;

                        return (
                          <div
                            key={prod.id}
                            className="min-w-[210px] sm:min-w-[240px] max-w-[240px] bg-slate-950 border border-slate-800 hover:border-amber-500/70 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all shrink-0 snap-start shadow-xl hover:shadow-amber-500/10"
                          >
                            <div>
                              <div className="h-32 sm:h-36 bg-slate-900 relative overflow-hidden">
                                <img
                                  src={imgProd}
                                  alt={prod.nome}
                                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-black/85 text-amber-300 border border-amber-500/30">
                                  {prod.categoria}
                                </span>
                              </div>
                              <div className="p-3.5 space-y-1">
                                <h5 className="text-xs sm:text-sm font-bold text-white truncate" title={prod.nome}>
                                  {prod.nome}
                                </h5>
                                <div className="text-sm font-mono font-extrabold text-amber-400">
                                  {formatCurrency(prod.preco)}
                                </div>
                              </div>
                            </div>

                            <div className="p-3.5 pt-0">
                              <button
                                type="button"
                                onClick={() => handleAdicionarProduto(prod)}
                                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                                  qtdNaSacola > 0
                                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-xs'
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md font-extrabold'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                {qtdNaSacola > 0 ? `Adicionado (${qtdNaSacola}x)` : 'Adicionar à Sacola'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </CarrosselHorizontal>
                  </div>
                )}
              </div>

              {/* Coluna Direita: Resumo Fixo / Lateral da Marmita no Desktop (4 colunas no PC) */}
              <div className="lg:col-span-4 hidden lg:block sticky top-24 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
                  <h4 className="text-base font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    Resumo da sua Marmita
                  </h4>

                  <div className="space-y-3.5 text-xs text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Tamanho Escolhido:</span>
                      <span className="font-bold text-white text-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                        Marmita {tamMarmita}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Cardápio do Dia:</span>
                      <span className="font-semibold text-amber-300">
                        Hoje ({diaHojeInfo?.label || 'Hoje'})
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-slate-400 block font-semibold">
                        Carnes Selecionadas ({carnesEscolhidasIds.length}):
                      </span>
                      {carnesEscolhidasIds.length === 0 ? (
                        <span className="text-slate-500 italic block">Nenhuma carne selecionada ainda</span>
                      ) : (
                        <div className="space-y-1 pl-1">
                          {carnesEscolhidasIds.map((cId) => {
                            const carne = carnesDoDia.find((c) => c.id === cId);
                            return (
                              <div key={cId} className="text-amber-300 font-semibold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>{carne?.nome || 'Carne'}</span>
                                {carne?.ehEspecial && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                                    Especial
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <span className="text-slate-400 block font-semibold">Guarnições ({acompEscolhidos.length}):</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {acompEscolhidos.length > 0 ? acompEscolhidos.join(', ') : 'Nenhuma guarnição selecionada'}
                      </p>
                    </div>

                    {obsMarmita && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-slate-400 block font-semibold">Observações:</span>
                        <p className="text-slate-300 italic text-[11px]">{obsMarmita}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <span className="text-xs text-slate-400 block">Total Desta Marmita:</span>
                    <span className="text-3xl font-mono font-extrabold text-amber-400 block mt-1">
                      {formatCurrency(precoTotalMarmita)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAdicionarMarmita}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/20 active:scale-98 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Adicionar à Sacola (+ {formatCurrency(precoTotalMarmita)})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Barra Fixa Inferior (Mobile e Desktop) */}
          <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 sm:px-8 py-3.5 shadow-2xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block">
                  Marmita {tamMarmita} ({carnesEscolhidasIds.length} {carnesEscolhidasIds.length === 1 ? 'carne' : 'carnes'})
                </span>
                <span className="text-lg sm:text-2xl font-extrabold text-amber-400 font-mono">
                  {formatCurrency(precoTotalMarmita)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAdicionarMarmita}
                className="px-6 sm:px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar à Sacola</span>
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* Modal Interativo para Escolher Carne ou Acompanhamento na Porção */}
      {modalPorcaoAberto && porcaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col text-white shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display">
                    {porcaoSelecionada.nome}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escolha se deseja uma Carne do Dia ou um Acompanhamento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPorcaoAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Opção: Carne do Dia OU Acompanhamento */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  1. O que você deseja nesta porção?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoItemPorcao('carne');
                      setItemPorcaoEscolhido(carnesDoDia[0]?.nome || '');
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      tipoItemPorcao === 'carne'
                        ? 'bg-amber-500/15 border-amber-500 text-white font-bold shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">🥩 Carne do Dia</div>
                    <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                      {formatCurrency(Number(config.precoPorcaoCarne) || 22)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Marmita separada de carne</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoItemPorcao('acompanhamento');
                      setItemPorcaoEscolhido('Arroz');
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      tipoItemPorcao === 'acompanhamento'
                        ? 'bg-amber-500/15 border-amber-500 text-white font-bold shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">🍚 Acompanhamento</div>
                    <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                      {formatCurrency(Number(config.precoPorcaoAcompanhamento) || 12)}
                    </div>
                    <div className="text-[10px] text-emerald-300/80 mt-0.5">Mais barato · Em marmita separada</div>
                  </button>
                </div>
              </div>

              {/* Lista se escolheu Carne */}
              {tipoItemPorcao === 'carne' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    2. Escolha a Carne ({DIAS_DA_SEMANA.find((d) => d.key === diaHojeKey)?.nomeCompleto}):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {carnesDoDia.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setItemPorcaoEscolhido(c.nome)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          itemPorcaoEscolhido === c.nome
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-semibold">{c.nome}</span>
                        {itemPorcaoEscolhido === c.nome && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista se escolheu Acompanhamento */}
              {tipoItemPorcao === 'acompanhamento' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    2. Escolha o Acompanhamento:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'Arroz',
                      'Feijão',
                      'Macarrão',
                      'Salada',
                      'Farofa',
                      'Batata',
                      'Legumes',
                    ].map((acomp) => (
                      <button
                        key={acomp}
                        type="button"
                        onClick={() => setItemPorcaoEscolhido(acomp)}
                        className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                          itemPorcaoEscolhido === acomp
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {acomp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações da Porção */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Observações para a Porção (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ponto da carne bem passado, pouco sal..."
                  value={obsPorcao}
                  onChange={(e) => setObsPorcao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Total da Porção (Marmita Separada):</span>
                <span className="text-lg font-extrabold text-amber-400 font-mono">
                  {formatCurrency(
                    tipoItemPorcao === 'carne'
                      ? Number(config.precoPorcaoCarne) || Number(porcaoSelecionada.preco) || 22
                      : Number(config.precoPorcaoAcompanhamento) || 12
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmarPorcao}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Adicionar à Sacola
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé do Portal com Endereço, CEP e Redes Sociais */}
      <footer
        className="mt-auto border-t border-slate-800/80 py-8 text-center text-xs transition-colors"
        style={{
          backgroundColor: corFooterEfetiva || undefined,
          color: corFooterTextoEfetiva || undefined,
        }}
      >
        <div className="max-w-5xl mx-auto px-4 space-y-3">
          <p
            className="font-bold text-sm"
            style={{ color: corFooterTextoEfetiva ? undefined : '#cbd5e1' }}
          >
            {config.nomeRestaurante || 'RESTAURANTE KERO'} — Marmitas Tradicionais & Delivery Oficial
          </p>
          <p className="text-slate-400">
            {config.enderecoRestaurante || 'Atendimento Delivery'}
            {config.cep ? ` · CEP ${config.cep}` : ''}
            {config.telefoneRestaurante ? ` · Contato: ${config.telefoneRestaurante}` : ''}
            {' · '}
            <span className="text-amber-400 font-medium">Segunda a Sábado (11h às 15h)</span>
            {' · '}
            <span className="text-rose-400 font-semibold">Domingos: Fechado</span>
          </p>

          {/* Links para Redes Sociais */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-900">
            {config.instagram && (
              <a
                href={
                  config.instagram.startsWith('http')
                    ? config.instagram
                    : `https://instagram.com/${config.instagram.replace('@', '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 transition-colors font-medium text-xs"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>{config.instagram.startsWith('@') ? config.instagram : `@${config.instagram}`}</span>
              </a>
            )}

            {config.facebook && (
              <a
                href={
                  config.facebook.startsWith('http')
                    ? config.facebook
                    : `https://facebook.com/${config.facebook}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors font-medium text-xs"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
            )}

            {(config.whatsapp || config.telefoneRestaurante) && (
              <button
                type="button"
                onClick={() => {
                  const tel = (config.whatsapp || config.telefoneRestaurante || '').replace(/\D/g, '');
                  if (tel) {
                    window.open(`https://api.whatsapp.com/send?phone=55${tel}`, '_blank');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors font-medium text-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: {config.whatsapp || config.telefoneRestaurante}</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-600 pt-2">
            Sistema de Autoatendimento Delivery · CNPJ: {config.cnpj || '00.000.000/0001-00'} · Pedidos em Tempo Real
          </p>
        </div>
      </footer>
    </div>
  );
};
