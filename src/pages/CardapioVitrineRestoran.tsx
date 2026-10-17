import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  UtensilsCrossed,
  Flame,
  Beef,
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Share2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ChefHat,
  Star,
  ArrowRight,
  Search,
  ExternalLink,
  Download,
  Info,
  Calendar,
  Layers,
  Soup,
  Coffee,
  X,
  ChevronDown,
} from 'lucide-react';
import { Produto, ConfiguracaoRestaurante } from '../types';
import { obterImagemProduto } from '../utils/imagemHelper';
import { formatCurrency } from '../utils/formatters';
import { getDiaHojeKey } from '../data/cardapioOficial';

interface CardapioVitrineRestoranProps {
  produtos: Produto[];
  config: ConfiguracaoRestaurante;
  onIrParaPedido: (produtoInicial?: Produto) => void;
  onVoltarPainel?: () => void;
  ehAdmin?: boolean;
}

export const CardapioVitrineRestoran: React.FC<CardapioVitrineRestoranProps> = ({
  produtos,
  config,
  onIrParaPedido,
  onVoltarPainel,
  ehAdmin = false,
}) => {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('destaques');
  const [busca, setBusca] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState<string>(getDiaHojeKey());
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [modalQrAberto, setModalQrAberto] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Cores dinâmicas definidas pelo restaurante
  const corPrimaria = config.corPrimaria || '#fea116';
  const corFundo = config.corBody || config.corFundo || '#0f172b';
  const corBotoes = config.corBotoes || '#fea116';
  const nomeRest = config.nomeRestaurante || 'RESTAURANTE KERO';
  const bannerHero = config.bannerUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80';

  const urlAtual = typeof window !== 'undefined' ? window.location : null;
  const baseUrl = urlAtual
    ? `${urlAtual.origin}${urlAtual.pathname}`
    : 'https://seurestaurante.com.br';
  const linkVitrineCardapio = `${baseUrl}?portal=cardapio`;
  const linkPortalPedidos = `${baseUrl}?portal=cliente`;

  // Gera o QR Code em alta resolução com a biblioteca instalada
  useEffect(() => {
    QRCode.toDataURL(linkVitrineCardapio, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('Erro ao gerar QRCode:', err));
  }, [linkVitrineCardapio]);

  const handleCopiarLink = async (urlParaCopiar: string) => {
    try {
      await navigator.clipboard.writeText(urlParaCopiar);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2500);
    } catch {
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2500);
    }
  };

  const handleCompartilharWhatsApp = () => {
    const texto = `🍽️ *${nomeRest}* — Cardápio Oficial!\n\nConfira nosso cardápio completo com carnes selecionadas, marmitas caseiras e pratos do dia:\n👉 ${linkVitrineCardapio}\n\nFaça seu pedido online ou retire no balcão!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const diaHojeNome = useMemo(() => {
    const diaNum = new Date().getDay();
    if (diaNum === 0) {
      return 'Domingo (Fechado - Não trabalhamos aos domingos)';
    }
    const map: Record<string, string> = {
      segunda: 'Segunda-feira',
      terca: 'Terça-feira',
      quarta: 'Quarta-feira',
      quinta: 'Quinta-feira',
      sexta: 'Sexta-feira',
      sabado: 'Sábado',
    };
    return map[diaSelecionado] || 'Hoje';
  }, [diaSelecionado]);

  // Filtra produtos ativos e visíveis no cardápio
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      if (p.ativo === false) return false;

      // Filtro de texto da busca
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const nomeMatch = p.nome.toLowerCase().includes(termo);
        const descMatch = (p.descricao || '').toLowerCase().includes(termo);
        const catMatch = p.categoria.toLowerCase().includes(termo);
        if (!nomeMatch && !descMatch && !catMatch) return false;
      }

      // Filtro por dia da semana se for carne
      if (p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais') {
        if (p.diasSemana && p.diasSemana.length > 0) {
          if (!p.diasSemana.includes(diaSelecionado)) {
            // Se estiver filtrando especificamente carnes ou busca, respeita o dia
            if (categoriaAtiva === 'carnes' || categoriaAtiva === 'destaques') {
              return false;
            }
          }
        }
      }

      // Filtro por categoria
      if (categoriaAtiva === 'destaques') {
        return (
          p.disponivel !== false &&
          (p.categoria === 'Marmitas' ||
            p.categoria === 'Carnes' ||
            p.categoria === 'Carnes Especiais' ||
            p.ehEspecial ||
            p.nome.toLowerCase().includes('marmita') ||
            p.nome.toLowerCase().includes('costela') ||
            p.nome.toLowerCase().includes('frango') ||
            p.nome.toLowerCase().includes('coca'))
        );
      }

      if (categoriaAtiva === 'carnes') {
        return p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais';
      }

      if (categoriaAtiva === 'marmitas') {
        return p.categoria === 'Marmitas';
      }

      if (categoriaAtiva === 'acompanhamentos') {
        return p.categoria === 'Acompanhamentos';
      }

      if (categoriaAtiva === 'bebidas') {
        return p.categoria === 'Bebidas';
      }

      if (categoriaAtiva === 'doces') {
        return p.categoria === 'Doces e Sobremesas';
      }

      if (categoriaAtiva === 'saladas') {
        return p.categoria === 'Saladas Avulsas' || p.categoria === 'Porções';
      }

      return true; // 'todos'
    });
  }, [produtos, categoriaAtiva, busca, diaSelecionado]);

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950"
      style={{ backgroundColor: corFundo }}
    >
      {/* 1. TOPO DA PÁGINA / NAVBAR RESTORAN */}
      <nav className="sticky top-0 z-40 bg-[#0f172b]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo e Nome do Restaurante com o ícone do Restoran */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0 border-2"
              style={{ backgroundColor: corPrimaria, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt={nomeRest}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="w-6 h-6 text-slate-950 font-bold" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black font-display tracking-tight text-white uppercase">
                  {nomeRest}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cardápio Aberto
                </span>
              </div>
              <p className="text-xs text-amber-400/90 font-medium hidden sm:block">
                Carnes Selecionadas, Marmitas Caseiras & Buffet Livre
              </p>
            </div>
          </div>

          {/* Ações da Barra Superior */}
          <div className="flex items-center gap-2.5">
            {/* Botão de QR Code / Compartilhar */}
            <button
              type="button"
              onClick={() => setModalQrAberto(true)}
              className="p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all flex items-center gap-2 shadow-xs"
              title="Escaneie o QR Code ou Compartilhe o Cardápio"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">QR Code / Compartilhar</span>
            </button>

            {/* Link principal para fazer o pedido online */}
            <button
              type="button"
              onClick={() => onIrParaPedido()}
              className="px-4 sm:px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-slate-950 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25 flex items-center gap-2"
              style={{ backgroundColor: corBotoes }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>FAZER PEDIDO ONLINE</span>
            </button>

            {/* Se for funcionário ou admin */}
            {onVoltarPainel && (
              <button
                type="button"
                onClick={onVoltarPainel}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Acessar o Painel Interno de Gestão"
              >
                Painel
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION ESTILO RESTORAN */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f172b] via-[#111c35] to-[#0f172b] py-16 sm:py-24 border-b border-slate-800">
        {/* Glow de fundo */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: corPrimaria }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Lado Esquerdo: Textos e Chamada para Ação */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider uppercase">
                <ChefHat className="w-4 h-4" />
                <span>Tradição & Sabor Caseiro</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white font-display tracking-tight leading-[1.15]">
                Aprecie Nossas Deliciosas{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                  Carnes & Marmitas
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Bem-vindo ao <strong>{nomeRest}</strong>! Confira nosso cardápio completo
                com carnes selecionadas e bem temperadas, guarnições caseiras fresquinhas,
                marmitex executivas quentinhas e bebidas geladas.
              </p>

              {/* Botões de Ação do Hero */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => onIrParaPedido()}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-slate-950 font-black text-sm sm:text-base transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 cursor-pointer"
                  style={{ backgroundColor: corBotoes }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>PEDIR PELO DELIVERY AGORA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#cardapio"
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                  <span>Explorar Pratos</span>
                </a>
              </div>

              {/* Destaques em Badges */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 text-left">
                <div className="space-y-0.5">
                  <div className="text-lg sm:text-xl font-bold font-mono text-amber-400">
                    Sabor Caseiro
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Preparo Diário Fresco
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-lg sm:text-xl font-bold font-mono text-amber-400">
                    30-45min
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Entrega Rápida
                  </div>
                </div>
              </div>
            </div>

            {/* Lado Direito: Prato Giratório / Foto Destaque Restoran */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="relative w-72 h-72 sm:w-96 sm:h-96">
                {/* Círculo com efeito de brilho */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-spin-slow p-3"
                  style={{ animationDuration: '30s' }}
                />

                {/* Imagem do Prato Central */}
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl relative group">
                  <img
                    src={bannerHero}
                    alt="Prato Especial do Restaurante"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Badge Flutuante 1: Preço da Marmita */}
                <div className="absolute -bottom-2 -left-2 sm:bottom-4 sm:left-0 bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3 animate-bounce-gentle">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                    🍱
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Marmita Completa a partir de
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">
                      {formatCurrency(config.precoMarmitaP || 16)}
                    </span>
                  </div>
                </div>

                {/* Badge Flutuante 2: Carnes & Pratos do Dia */}
                <div className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-2.5">
                  <ChefHat className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Carnes & Pratos do Dia
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. QUADRO DE SERVIÇOS & DIFERENCIAIS (ESTILO RESTORAN) */}
      <section className="py-12 bg-[#0c1322] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-display">
                Cozinha Tradicional
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Carnes selecionadas bem temperadas e cozidas no ponto com sabor caseiro autêntico.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-display">
                Marmitas & Self-Service
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Refeições completas nos tamanhos P, M e G ou buffet livre com mais de 20 opções quentes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-display">
                Entrega Expressa
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Embalagens térmicas seladas para o seu almoço chegar quentinho e saboroso onde você estiver.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-display">
                Pedidos Online Ágeis
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monte sua marmita pelo celular em poucos toques sem fila e acompanhe a rota do motoboy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DO CARDÁPIO PRINCIPAL (O RESTORAN FOOD MENU) */}
      <section id="cardapio" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Cabeçalho do Cardápio Restoran */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
            <span className="w-8 h-0.5 bg-amber-400" />
            <span>Cardápio & Preços Oficiais</span>
            <span className="w-8 h-0.5 bg-amber-400" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-display">
            Nossos Pratos Mais Populares & Sabores de Hoje
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Valores atualizados em tempo real. Veja os itens disponíveis hoje e clique em qualquer produto para fazer seu pedido online!
          </p>
        </div>

        {/* DESTAQUE DE TAMANHOS DE MARMITAS MAIS ACIMA */}
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold mb-2">
                <Soup className="w-3.5 h-3.5" />
                <span>Nossas Marmitas Tradicionais</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                Escolha o Tamanho da sua Marmita
              </h3>
              <p className="text-xs text-slate-300">
                Acompanha arroz soltinho, feijão temperado, guarnições fresquinhas e carnes preparadas no ponto!
              </p>
            </div>
            <button
              type="button"
              onClick={() => onIrParaPedido()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all self-start md:self-auto shrink-0"
              style={{ backgroundColor: corBotoes }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Montar pelo Delivery</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Marmita P */}
            <div
              onClick={() => onIrParaPedido({ nome: 'Marmita Pequena', preco: config.precoMarmitaP || 16 } as any)}
              className="bg-slate-950/90 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                    Tamanho P
                  </span>
                  <span className="text-lg font-black font-mono text-white">
                    {formatCurrency(config.precoMarmitaP || 16)}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  Marmita Pequena
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Refeição individual na medida certa. 1 carne do dia + acompanhamentos à vontade.
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Pedir Tamanho P</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Marmita M */}
            <div
              onClick={() => onIrParaPedido({ nome: 'Marmita Média', preco: config.precoMarmitaM || 20 } as any)}
              className="bg-slate-950/90 border-2 border-amber-500/60 hover:border-amber-400 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer relative shadow-xl shadow-amber-500/10 sm:scale-[1.02]"
            >
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                Mais Pedida
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                    Tamanho M
                  </span>
                  <span className="text-xl font-black font-mono text-amber-400">
                    {formatCurrency(config.precoMarmitaM || 20)}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  Marmita Média
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tamanho ideal para a maioria das pessoas. Até 2 carnes do dia + acompanhamentos completos.
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Pedir Tamanho M</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Marmita G */}
            <div
              onClick={() => onIrParaPedido({ nome: 'Marmita Grande', preco: config.precoMarmitaG || 25 } as any)}
              className="bg-slate-950/90 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                    Tamanho G
                  </span>
                  <span className="text-lg font-black font-mono text-white">
                    {formatCurrency(config.precoMarmitaG || 25)}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  Marmita Grande
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Marmita reforçada para quem tem fome de verdade. Até 2 carnes do dia + guarnições caprichadas.
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Pedir Tamanho G</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="space-y-4">
          {/* Seletor de Dia da Semana para Carnes */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Cardápio de Carnes do Dia:</span>
              <span className="font-bold text-amber-400">{diaHojeNome}</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'segunda', label: 'Seg' },
                { id: 'terca', label: 'Ter' },
                { id: 'quarta', label: 'Qua' },
                { id: 'quinta', label: 'Qui' },
                { id: 'sexta', label: 'Sex' },
                { id: 'sabado', label: 'Sáb' },
              ].map((dia) => (
                <button
                  key={dia.id}
                  type="button"
                  onClick={() => setDiaSelecionado(dia.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all shrink-0 ${
                    diaSelecionado === dia.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
              <span className="text-[11px] text-rose-400 font-semibold px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40 whitespace-nowrap">
                Dom: Fechado
              </span>
            </div>
          </div>

          {/* Categorias Restoran com Ícones */}
          <div className="flex items-center justify-center gap-2 flex-wrap pb-2 border-b border-slate-800">
            {[
              { id: 'destaques', label: 'Mais Pedidos', icon: Star },
              { id: 'carnes', label: '🥩 Carnes Selecionadas', icon: Beef },
              { id: 'marmitas', label: '🍱 Marmitas Executivas', icon: Soup },
              { id: 'acompanhamentos', label: '🍚 Guarnições', icon: UtensilsCrossed },
              { id: 'bebidas', label: '🥤 Bebidas Geladas', icon: Coffee },
              { id: 'doces', label: '🍰 Sobremesas', icon: Sparkles },
              { id: 'saladas', label: '🥗 Saladas & Porções', icon: Layers },
              { id: 'todos', label: '🍽️ Ver Todos', icon: UtensilsCrossed },
            ].map((cat) => {
              const IconComp = cat.icon;
              const ativa = categoriaAtiva === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    ativa
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar pelo nome ou corte (ex: frango, feijoada, pudim)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* GRADE DE PRATOS EM 2 COLUNAS (LAYOUT CLÁSSICO RESTORAN) */}
        {produtosFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">
              Nenhum prato encontrado com esses filtros
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tente selecionar outro dia da semana ou limpar a busca para visualizar mais opções.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategoriaAtiva('todos');
                setBusca('');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
            >
              Ver Todo o Cardápio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {produtosFiltrados.map((item) => {
              const foto = obterImagemProduto(item);
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/40 transition-all flex gap-4 sm:gap-5 group hover:shadow-xl hover:shadow-amber-500/5"
                >
                  {/* Imagem Circular do Prato (Restoran Signature) */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0 border-2 border-slate-700 group-hover:border-amber-500 transition-colors shadow-md relative">
                    <img
                      src={foto}
                      alt={item.nome}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Detalhes do Prato com Linha Pontilhada e Preço */}
                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      {/* Título com linha pontilhada até o preço */}
                      <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-slate-700/80 pb-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors font-display line-clamp-1">
                          {item.nome}
                        </h3>
                        {item.categoria === 'Carnes' ||
                        item.categoria === 'Carnes Especiais' ||
                        item.categoria === 'Acompanhamentos' ||
                        item.preco === 0 ? (
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md shrink-0">
                            {item.ehEspecial ? 'Opção Especial' : 'Inclusa na Marmita'}
                          </span>
                        ) : (
                          <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono shrink-0">
                            {formatCurrency(item.preco)}
                          </span>
                        )}
                      </div>

                      {/* Descrição dos Ingredientes */}
                      <p className="text-xs text-slate-400 italic line-clamp-2 mt-1 leading-snug">
                        {item.descricao || 'Preparado com ingredientes frescos, tempero exclusivo da casa e carinho especial.'}
                      </p>
                    </div>

                    {/* Badges e Botão de Pedir */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {item.categoria}
                        </span>

                        {item.ehEspecial && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Especial
                          </span>
                        )}

                        {item.disponivel === false && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Esgotado
                          </span>
                        )}
                      </div>

                      {/* Botão de Pedir Este Prato */}
                      <button
                        type="button"
                        onClick={() => onIrParaPedido(item)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs transition-colors shrink-0 border border-amber-500/30"
                        title="Montar pedido com este prato"
                      >
                        <span>Pedir</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. BANNER DESTACADO PARA FAZER O PEDIDO (CTA CLARA REQUISITADA) */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl p-6 sm:p-10 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pronto para saborear?</span>
              </div>
              <h3 className="text-xl sm:text-3xl font-black text-white font-display">
                Faça seu Pedido Online Agora Mesmo!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Monte sua marmita personalizada com arroz, feijão, carnes na brasa e guarnições
                do dia, adicione bebidas geladas ou peça porções completas com entrega quentinha ou retirada no balcão.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onIrParaPedido()}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-slate-950 font-black text-sm sm:text-base transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2.5"
                style={{ backgroundColor: corBotoes }}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>MONTAR MEU PEDIDO AGORA</span>
              </button>

              <button
                type="button"
                onClick={handleCompartilharWhatsApp}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Pedir no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6. INFORMAÇÕES DO BUFFET & REFEIÇÕES POR PESSOA (SE HOUVER) */}
        {(config.precoBuffetAdulto || config.precoAlmocoInteira) && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white font-display">
                Almoço no Salão & Buffet Livre Self-Service
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              {config.precoBuffetAdulto && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400 block font-medium">Buffet Livre Adulto</span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {formatCurrency(config.precoBuffetAdulto)}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Coma à vontade no salão</span>
                </div>
              )}

              {config.precoBuffetCrianca && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400 block font-medium">Buffet Infantil (até 6 anos - Meia)</span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {formatCurrency(config.precoBuffetCrianca)}
                  </span>
                  <span className="text-[11px] text-emerald-400 block font-semibold">Crianças até 6 anos pagam meia</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 7. RODAPÉ ESTILO RESTORAN COM CONTATOS, MAPA E HORÁRIOS */}
      <footer className="mt-auto bg-[#0a0f1d] border-t border-slate-800/80 pt-12 pb-24 sm:pb-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Coluna 1: Sobre */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider font-display">
                {nomeRest}
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Referência em carnes selecionadas, marmitas caseiras e almoço de qualidade com tempero artesanal.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalQrAberto(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Ver QR Code</span>
                </button>
              </div>
            </div>

            {/* Coluna 2: Contato */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider font-display">
                Contato & Pedidos
              </h4>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{config.enderecoRestaurante || 'Endereço gastronômico'}</span>
                </p>
                {config.telefoneRestaurante && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{config.telefoneRestaurante}</span>
                  </p>
                )}
                {config.whatsapp && (
                  <p className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>WhatsApp: {config.whatsapp}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Coluna 3: Horários de Atendimento */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider font-display">
                Horário de Funcionamento
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Segunda a Sábado:</span>
                  <span className="text-white font-bold font-mono">11h00 - 15h00</span>
                </div>
                <div className="flex justify-between text-rose-400 font-semibold">
                  <span>Domingo:</span>
                  <span className="font-mono">Fechado</span>
                </div>
                <p className="text-[11px] text-amber-400 pt-1">
                  Delivery ativo de segunda a sábado no horário de almoço!
                </p>
              </div>
            </div>

            {/* Coluna 4: Link de Pedidos */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider font-display">
                Fazer Pedido
              </h4>
              <p className="leading-relaxed">
                Clique abaixo para ir direto à tela onde você escolhe os tamanhos e monta sua marmita:
              </p>
              <button
                type="button"
                onClick={() => onIrParaPedido()}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                style={{ backgroundColor: corBotoes }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>IR PARA TELA DE PEDIDOS</span>
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>
              © {new Date().getFullYear()} {nomeRest}. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalQrAberto(true)}
                className="hover:text-amber-400 transition-colors"
              >
                QR Code para Mesas
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onIrParaPedido()}
                className="hover:text-amber-400 transition-colors"
              >
                Portal de Pedidos
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 8. BARRA FIXA INFERIOR NO MOBILE PARA NUNCA PERDER O BOTÃO DE PEDIDO */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md z-40 sm:hidden flex items-center justify-between gap-3 shadow-2xl">
        <div className="text-left">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">
            Gostou do cardápio?
          </span>
          <span className="text-xs font-bold text-white">
            Peça agora mesmo!
          </span>
        </div>

        <button
          type="button"
          onClick={() => onIrParaPedido()}
          className="px-5 py-2.5 rounded-xl text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg"
          style={{ backgroundColor: corBotoes }}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>FAZER PEDIDO</span>
        </button>
      </div>

      {/* MODAL DE QR CODE & COMPARTILHAMENTO DO CARDÁPIO */}
      {modalQrAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full text-white shadow-2xl overflow-hidden flex flex-col animate-modal">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    QR Code do Cardápio Vitrine
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ideal para colocar nas mesas e panfletos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalQrAberto(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code do Cardápio"
                    className="w-52 h-52 mx-auto"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                    Gerando QR Code...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{nomeRest}</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Aponte a câmera do celular para abrir este cardápio digital imediatamente sem precisar instalar nada!
                </p>
              </div>

              {/* Botões do Modal */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopiarLink(linkVitrineCardapio)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    linkCopiado
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {linkCopiado ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Link Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Link do Cardápio</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCompartilharWhatsApp}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>

                {qrCodeDataUrl && (
                  <a
                    href={qrCodeDataUrl}
                    download={`qrcode-cardapio-${nomeRest.toLowerCase().replace(/\s+/g, '-')}.png`}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Imagem do QR Code para Imprimir</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
