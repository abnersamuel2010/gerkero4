import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Shield,
  Lock,
  Unlock,
  Trash2,
  Save,
  History,
  MapPin,
  Plus,
  Check,
  Palette,
  Flame,
  Utensils,
  Crown,
  Zap,
  Soup,
  ChefHat,
  Sparkles,
  Beef,
  Upload,
  Image as ImageIcon,
  Eye,
  Printer,
  Wifi,
  Instagram,
  Facebook,
  PhoneCall,
  Globe,
  Radio,
  AlertCircle,
  Layers,
} from 'lucide-react';
import {
  Usuario,
  UserRole,
  ConfiguracaoRestaurante,
  LogAuditoria,
  RegiaoEntrega,
  ImpressoraTermica,
  SetorImpressao,
  ThermalReceiptData,
} from '../types';
import {
  criarUsuarioPainelAdmin,
  atualizarUsuarioPainelAdmin,
  excluirUsuarioPainelAdmin,
  salvarConfiguracaoRestaurante,
  criarImpressoraTermica,
  atualizarImpressoraTermica,
  excluirImpressoraTermica,
} from '../services/usuariosService';
import {
  criarRegiaoEntrega,
  atualizarRegiaoEntrega,
  excluirRegiaoEntrega,
} from '../services/deliveryService';
import { uploadImagemProduto } from '../services/produtosService';
import { processarImagemParaDataUrl } from '../utils/imagemHelper';
import { IMAGENS_PADRAO } from '../services/firestoreService';
import {
  formatDateTime,
  formatRoleName,
  formatCurrency,
} from '../utils/formatters';

const PALETAS_SUGESTOES = [
  {
    id: 'sabor_artesanal',
    nome: 'Sabor & Tradição',
    desc: 'Tons quentes aconchegantes e detalhes dourados',
    header: '#1c1917',
    headerTexto: '#ffffff',
    aside: '#0c0a09',
    asideTexto: '#f5f5f4',
    body: '#09090b',
    footer: '#0c0a09',
    footerTexto: '#a8a29e',
    sugestoes: '#d97706',
    sugestoesTexto: '#ffffff',
    botoes: '#f59e0b',
    primaria: '#ea580c',
  },
  {
    id: 'gastronomia_vinho',
    nome: 'Gastronomia Nobre & Vinho',
    desc: 'Bordô gastronômico, rubi e acabamento de alto padrão',
    header: '#2a080c',
    headerTexto: '#ffffff',
    aside: '#1a0507',
    asideTexto: '#ffe4e6',
    body: '#0f0305',
    footer: '#140407',
    footerTexto: '#fda4af',
    sugestoes: '#e11d48',
    sugestoesTexto: '#ffffff',
    botoes: '#e11d48',
    primaria: '#e11d48',
  },
  {
    id: 'dark_midnight',
    nome: 'Dark Midnight Moderno',
    desc: 'Azul escuro profundo com detalhes ciano e alta legibilidade',
    header: '#0f172a',
    headerTexto: '#ffffff',
    aside: '#0b0f19',
    asideTexto: '#e2e8f0',
    body: '#020617',
    footer: '#0b0f19',
    footerTexto: '#94a3b8',
    sugestoes: '#2563eb',
    sugestoesTexto: '#ffffff',
    botoes: '#3b82f6',
    primaria: '#3b82f6',
  },
  {
    id: 'verde_gourmet',
    nome: 'Verde Gourmet & Grill',
    desc: 'Esmeralda e oliva para restaurante artesanal e natural',
    header: '#064e3b',
    headerTexto: '#ffffff',
    aside: '#022c22',
    asideTexto: '#d1fae5',
    body: '#021a14',
    footer: '#022c22',
    footerTexto: '#6ee7b7',
    sugestoes: '#10b981',
    sugestoesTexto: '#ffffff',
    botoes: '#059669',
    primaria: '#10b981',
  },
  {
    id: 'ouro_imperial',
    nome: 'Ouro Imperial & Grafite',
    desc: 'Dourado nobre com fundo preto fosco para restaurantes premium',
    header: '#1f1b13',
    headerTexto: '#fef08a',
    aside: '#14110b',
    asideTexto: '#fef9c3',
    body: '#0d0b07',
    footer: '#14110b',
    footerTexto: '#ca8a04',
    sugestoes: '#eab308',
    sugestoesTexto: '#000000',
    botoes: '#eab308',
    primaria: '#eab308',
  },
  {
    id: 'sunset_laranja',
    nome: 'Sunset Laranja Cítrico',
    desc: 'Laranja intenso, acolhedor e vibrante',
    header: '#431407',
    headerTexto: '#ffffff',
    aside: '#270a04',
    asideTexto: '#ffedd5',
    body: '#1a0602',
    footer: '#270a04',
    footerTexto: '#fdba74',
    sugestoes: '#f97316',
    sugestoesTexto: '#ffffff',
    botoes: '#ea580c',
    primaria: '#f97316',
  },
  {
    id: 'ametista_nobre',
    nome: 'Ametista & Gourmet',
    desc: 'Roxo sofisticado para buffet moderno e contemporâneo',
    header: '#2e1065',
    headerTexto: '#ffffff',
    aside: '#1e0845',
    asideTexto: '#f3e8ff',
    body: '#12052b',
    footer: '#1e0845',
    footerTexto: '#d8b4fe',
    sugestoes: '#a855f7',
    sugestoesTexto: '#ffffff',
    botoes: '#7c3aed',
    primaria: '#a855f7',
  },
  {
    id: 'claro_clean',
    nome: 'Claro Clean Gastronômico',
    desc: 'Visual luminoso e claro para quem prefere tema suave diurno',
    header: '#ffffff',
    headerTexto: '#0f172a',
    aside: '#f8fafc',
    asideTexto: '#1e293b',
    body: '#f1f5f9',
    footer: '#e2e8f0',
    footerTexto: '#475569',
    sugestoes: '#d97706',
    sugestoesTexto: '#ffffff',
    botoes: '#ea580c',
    primaria: '#ea580c',
  },
];

interface UsuariosConfigPageProps {
  usuarios: Usuario[];
  config: ConfiguracaoRestaurante;
  logsAuditoria: LogAuditoria[];
  regioes?: RegiaoEntrega[];
  impressoras?: ImpressoraTermica[];
  onPrintReceipt?: (receipt: ThermalReceiptData) => void;
}

export const UsuariosConfigPage: React.FC<UsuariosConfigPageProps> = ({
  usuarios,
  config,
  logsAuditoria,
  regioes = [],
  impressoras = [],
  onPrintReceipt,
}) => {
  const [aba, setAba] = useState<
    'usuarios' | 'configuracoes' | 'temas_cores' | 'taxas_ruas' | 'impressoras' | 'auditoria'
  >('usuarios');

  // Gerenciamento de Taxas por Rua / Bairro
  const [nomeRua, setNomeRua] = useState('');
  const [taxaRua, setTaxaRua] = useState('8.00');
  const [tempoEstimado, setTempoEstimado] = useState('35');
  const [salvandoRua, setSalvandoRua] = useState(false);
  const [buscaRua, setBuscaRua] = useState('');

  // Novo Usuário
  const [nomeUsr, setNomeUsr] = useState('');
  const [emailUsr, setEmailUsr] = useState('');
  const [funcaoUsr, setFuncaoUsr] = useState<UserRole>('atendente');
  const [permissoesUsr, setPermissoesUsr] = useState('');

  // Personalização Visual (Logo, Banner, Fundo, Cores, Botões & Ícones)
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(
    config.bannerUrl || IMAGENS_PADRAO.porcaoChurrasco
  );
  const [iconeCustomUrl, setIconeCustomUrl] = useState(config.iconeCustomUrl || '');
  const [tipoIcone, setTipoIcone] = useState<'vetor' | 'imagem'>(
    config.iconeCustomUrl ? 'imagem' : 'vetor'
  );
  const [corPrimaria, setCorPrimaria] = useState(config.corPrimaria || '#e11d48');
  const [corTemaNome, setCorTemaNome] = useState(config.corTemaNome || 'vermelho_kero');
  const [corFundo, setCorFundo] = useState(config.corBody || config.corFundo || '#0b0f19');
  const [corFundoNome, setCorFundoNome] = useState(config.corFundoNome || 'escuro_slate');
  const [corBotoes, setCorBotoes] = useState(config.corBotoes || '#f59e0b');
  
  // Cores de todas as partes do site (Header, Aside, Body, Footer e Sugestões)
  const [corHeader, setCorHeader] = useState(config.corHeader || '#18120c');
  const [corHeaderTexto, setCorHeaderTexto] = useState(config.corHeaderTexto || '#ffffff');
  const [corAside, setCorAside] = useState(config.corAside || '#0f172a');
  const [corAsideTexto, setCorAsideTexto] = useState(config.corAsideTexto || '#ffffff');
  const [corBody, setCorBody] = useState(config.corBody || config.corFundo || '#0b0f19');
  const [corFooter, setCorFooter] = useState(config.corFooter || '#0b0f19');
  const [corFooterTexto, setCorFooterTexto] = useState(config.corFooterTexto || '#94a3b8');
  const [corSugestoes, setCorSugestoes] = useState(config.corSugestoes || '#d97706');
  const [corSugestoesTexto, setCorSugestoesTexto] = useState(config.corSugestoesTexto || '#ffffff');

  const [iconeTema, setIconeTema] = useState(config.iconeTema || 'flame');
  const [salvandoTema, setSalvandoTema] = useState(false);
  const [mensagemTemaSucesso, setMensagemTemaSucesso] = useState('');
  const [erroTema, setErroTema] = useState('');
  const [uploadandoLogo, setUploadandoLogo] = useState(false);
  const [uploadandoBanner, setUploadandoBanner] = useState(false);
  const [uploadandoIcone, setUploadandoIcone] = useState(false);

  // Gerenciamento de Impressoras Térmicas IP por Setor
  const [nomeImpressora, setNomeImpressora] = useState('');
  const [ipImpressora, setIpImpressora] = useState('');
  const [portaImpressora, setPortaImpressora] = useState('9100');
  const [setorImpressora, setSetorImpressora] = useState<SetorImpressao>('cozinha');
  const [larguraBobina, setLarguraBobina] = useState<'80mm' | '58mm'>('80mm');
  const [modeloImpressora, setModeloImpressora] = useState('EPSON ESC/POS');
  const [salvandoImpressora, setSalvandoImpressora] = useState(false);
  const [msgImpressoraSucesso, setMsgImpressoraSucesso] = useState('');
  const [impressoraTestadaId, setImpressoraTestadaId] = useState<string | null>(null);

  // Configurações do Restaurante e Preços
  const [nomeRest, setNomeRest] = useState(config.nomeRestaurante || 'RESTAURANTE KERO');
  const [telRest, setTelRest] = useState(config.telefoneRestaurante || '');
  const [endRest, setEndRest] = useState(config.enderecoRestaurante || '');
  const [cepRest, setCepRest] = useState(config.cep || '');
  const [cnpjRest, setCnpjRest] = useState(config.cnpj || '');
  const [instagramRest, setInstagramRest] = useState(config.instagram || '');
  const [facebookRest, setFacebookRest] = useState(config.facebook || '');
  const [whatsappRest, setWhatsappRest] = useState(config.whatsapp || '');
  const [precoP, setPrecoP] = useState(String(config.precoMarmitaP || 16));
  const [precoM, setPrecoM] = useState(String(config.precoMarmitaM || 20));
  const [precoG, setPrecoG] = useState(String(config.precoMarmitaG || 25));
  const [precoAlmocoInteira, setPrecoAlmocoInteira] = useState(
    String(config.precoAlmocoInteira || 30)
  );
  const [precoAlmocoMeia, setPrecoAlmocoMeia] = useState(
    String(config.precoAlmocoMeia || 20)
  );
  const [precoPorcaoCarne, setPrecoPorcaoCarne] = useState(
    String(config.precoPorcaoCarne || 22)
  );
  const [precoPorcaoAcomp, setPrecoPorcaoAcomp] = useState(
    String(config.precoPorcaoAcompanhamento || 12)
  );
  const [buffetAdulto, setBuffetAdulto] = useState(
    String(config.precoBuffetAdulto || 30)
  );
  const [buffetCrianca, setBuffetCrianca] = useState(
    String(config.precoBuffetCrianca || 20)
  );
  const [buffetKilo, setBuffetKilo] = useState(
    String(config.precoBuffetKilo || 69.9)
  );
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erroConfig, setErroConfig] = useState('');

  // Regras de Carnes por Marmita (Flexível para o Cliente e Gerenciador)
  const [quantidadeCarnesPadrao, setQuantidadeCarnesPadrao] = useState(
    config.quantidadeCarnesPadrao !== undefined ? config.quantidadeCarnesPadrao : 1
  );
  const [permitirMaisDeUmaCarne, setPermitirMaisDeUmaCarne] = useState(
    Boolean(config.permitirMaisDeUmaCarne)
  );
  const [limiteCarnesMarmita, setLimiteCarnesMarmita] = useState(
    config.limiteCarnesMarmita || 1
  );
  const [diasPermiteDuasCarnes, setDiasPermiteDuasCarnes] = useState<string[]>(
    config.diasPermiteDuasCarnes || []
  );
  const [valorAdicionalSegundaCarne, setValorAdicionalSegundaCarne] = useState(
    String(
      config.valorAdicionalSegundaCarne !== undefined
        ? config.valorAdicionalSegundaCarne
        : 2
    )
  );

  // Sincroniza os dados com a configuração vinda do banco ou cache
  useEffect(() => {
    if (config) {
      if (config.nomeRestaurante) setNomeRest(config.nomeRestaurante);
      if (config.telefoneRestaurante !== undefined) setTelRest(config.telefoneRestaurante || '');
      if (config.enderecoRestaurante !== undefined) setEndRest(config.enderecoRestaurante || '');
      if (config.cep !== undefined) setCepRest(config.cep || '');
      if (config.cnpj !== undefined) setCnpjRest(config.cnpj || '');
      if (config.instagram !== undefined) setInstagramRest(config.instagram || '');
      if (config.facebook !== undefined) setFacebookRest(config.facebook || '');
      if (config.whatsapp !== undefined) setWhatsappRest(config.whatsapp || '');
      if (config.precoMarmitaP !== undefined) setPrecoP(String(config.precoMarmitaP));
      if (config.precoMarmitaM !== undefined) setPrecoM(String(config.precoMarmitaM));
      if (config.precoMarmitaG !== undefined) setPrecoG(String(config.precoMarmitaG));
      if (config.precoAlmocoInteira !== undefined) setPrecoAlmocoInteira(String(config.precoAlmocoInteira));
      if (config.precoAlmocoMeia !== undefined) setPrecoAlmocoMeia(String(config.precoAlmocoMeia));
      if (config.precoPorcaoCarne !== undefined) setPrecoPorcaoCarne(String(config.precoPorcaoCarne));
      if (config.precoPorcaoAcompanhamento !== undefined) setPrecoPorcaoAcomp(String(config.precoPorcaoAcompanhamento));
      if (config.precoBuffetAdulto !== undefined) setBuffetAdulto(String(config.precoBuffetAdulto));
      if (config.precoBuffetCrianca !== undefined) setBuffetCrianca(String(config.precoBuffetCrianca));
      if (config.precoBuffetKilo !== undefined) setBuffetKilo(String(config.precoBuffetKilo));

      if (config.quantidadeCarnesPadrao !== undefined) setQuantidadeCarnesPadrao(config.quantidadeCarnesPadrao);
      if (config.permitirMaisDeUmaCarne !== undefined) setPermitirMaisDeUmaCarne(config.permitirMaisDeUmaCarne);
      if (config.limiteCarnesMarmita !== undefined) setLimiteCarnesMarmita(config.limiteCarnesMarmita);
      if (config.diasPermiteDuasCarnes !== undefined) setDiasPermiteDuasCarnes(config.diasPermiteDuasCarnes);
      if (config.valorAdicionalSegundaCarne !== undefined) setValorAdicionalSegundaCarne(String(config.valorAdicionalSegundaCarne));

      if (config.logoUrl !== undefined) setLogoUrl(config.logoUrl || '');
      if (config.bannerUrl !== undefined) setBannerUrl(config.bannerUrl || '');
      if (config.corPrimaria) setCorPrimaria(config.corPrimaria);
      if (config.corTemaNome) setCorTemaNome(config.corTemaNome);
      if (config.corFundo || config.corBody) {
        setCorFundo(config.corBody || config.corFundo || '#0b0f19');
        setCorBody(config.corBody || config.corFundo || '#0b0f19');
      }
      if (config.corFundoNome) setCorFundoNome(config.corFundoNome);
      if (config.corBotoes) setCorBotoes(config.corBotoes);
      if (config.corHeader) setCorHeader(config.corHeader);
      if (config.corHeaderTexto) setCorHeaderTexto(config.corHeaderTexto);
      if (config.corAside) setCorAside(config.corAside);
      if (config.corAsideTexto) setCorAsideTexto(config.corAsideTexto);
      if (config.corFooter) setCorFooter(config.corFooter);
      if (config.corFooterTexto) setCorFooterTexto(config.corFooterTexto);
      if (config.corSugestoes) setCorSugestoes(config.corSugestoes);
      if (config.corSugestoesTexto) setCorSugestoesTexto(config.corSugestoesTexto);
      if (config.iconeTema) setIconeTema(config.iconeTema);
      if (config.iconeCustomUrl !== undefined) {
        setIconeCustomUrl(config.iconeCustomUrl || '');
        if (config.iconeCustomUrl) setTipoIcone('imagem');
      }
    }
  }, [config]);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadandoLogo(true);
    setErroTema('');
    setErroConfig('');
    try {
      // 1. Converte instantaneamente para Data URL otimizada para preview e gravação garantida
      const dataUrl = await processarImagemParaDataUrl(file, 600, 0.9);
      setLogoUrl(dataUrl);

      // 2. Tenta fazer upload no Firebase Storage em segundo plano (se disponível)
      uploadImagemProduto(file)
        .then((remoteUrl) => {
          if (remoteUrl && remoteUrl.startsWith('http')) {
            setLogoUrl(remoteUrl);
          }
        })
        .catch((err) => {
          console.warn('Utilizando Data URL local otimizada para a logo:', err);
        });
    } catch (err: any) {
      console.error('Erro no processamento da logo:', err);
      setErroTema('Não foi possível carregar a imagem. Tente uma imagem PNG, JPG ou WebP.');
    } finally {
      setUploadandoLogo(false);
      e.target.value = '';
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadandoBanner(true);
    setErroTema('');
    try {
      const dataUrl = await processarImagemParaDataUrl(file, 1400, 0.86);
      setBannerUrl(dataUrl);

      uploadImagemProduto(file)
        .then((remoteUrl) => {
          if (remoteUrl && remoteUrl.startsWith('http')) {
            setBannerUrl(remoteUrl);
          }
        })
        .catch((err) => {
          console.warn('Utilizando Data URL local otimizada para o banner:', err);
        });
    } catch (err: any) {
      console.error('Erro no upload do banner:', err);
      setErroTema('Erro ao carregar o arquivo do banner. Tente outro formato de imagem.');
    } finally {
      setUploadandoBanner(false);
      e.target.value = '';
    }
  };

  const handleUploadIcone = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadandoIcone(true);
    setErroTema('');
    try {
      const dataUrl = await processarImagemParaDataUrl(file, 300, 0.9);
      setIconeCustomUrl(dataUrl);
      setTipoIcone('imagem');

      uploadImagemProduto(file)
        .then((remoteUrl) => {
          if (remoteUrl && remoteUrl.startsWith('http')) {
            setIconeCustomUrl(remoteUrl);
          }
        })
        .catch((err) => {
          console.warn('Utilizando Data URL local para o ícone:', err);
        });
    } catch (err: any) {
      console.error('Erro no upload do ícone:', err);
      setErroTema('Erro ao carregar ícone.');
    } finally {
      setUploadandoIcone(false);
      e.target.value = '';
    }
  };

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeUsr.trim() || !emailUsr.trim()) return;
    await criarUsuarioPainelAdmin({
      nome: nomeUsr,
      email: emailUsr,
      funcao: funcaoUsr,
      permissoes: permissoesUsr.trim() || undefined,
    });
    setNomeUsr('');
    setEmailUsr('');
    setPermissoesUsr('');
  };

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoConfig(true);
    setMensagemSucesso('');
    setErroConfig('');
    try {
      await salvarConfiguracaoRestaurante({
        nomeRestaurante: nomeRest,
        telefoneRestaurante: telRest,
        enderecoRestaurante: endRest,
        cep: cepRest,
        cnpj: cnpjRest,
        instagram: instagramRest,
        facebook: facebookRest,
        whatsapp: whatsappRest,
        precoMarmitaP: parseFloat(precoP.replace(',', '.')) || 16,
        precoMarmitaM: parseFloat(precoM.replace(',', '.')) || 20,
        precoMarmitaG: parseFloat(precoG.replace(',', '.')) || 25,
        precoAlmocoInteira: parseFloat(precoAlmocoInteira.replace(',', '.')) || 30,
        precoAlmocoMeia: parseFloat(precoAlmocoMeia.replace(',', '.')) || 20,
        precoPorcaoCarne: parseFloat(precoPorcaoCarne.replace(',', '.')) || 22,
        precoPorcaoAcompanhamento: parseFloat(precoPorcaoAcomp.replace(',', '.')) || 12,
        precoBuffetAdulto: parseFloat(buffetAdulto.replace(',', '.')) || 44.9,
        precoBuffetCrianca: parseFloat(buffetCrianca.replace(',', '.')) || 24.9,
        precoBuffetKilo: parseFloat(buffetKilo.replace(',', '.')) || 69.9,
        logoUrl,
        bannerUrl,
        corPrimaria,
        corTemaNome,
        corFundo: corBody || corFundo,
        corFundoNome,
        corBotoes,
        corHeader,
        corHeaderTexto,
        corAside,
        corAsideTexto,
        corBody,
        corFooter,
        corFooterTexto,
        corSugestoes,
        corSugestoesTexto,
        iconeTema,
        iconeCustomUrl: tipoIcone === 'imagem' ? iconeCustomUrl : '',
        quantidadeCarnesPadrao: Number(quantidadeCarnesPadrao) || 1,
        permitirMaisDeUmaCarne,
        limiteCarnesMarmita: Number(limiteCarnesMarmita) || 1,
        diasPermiteDuasCarnes,
        valorAdicionalSegundaCarne: parseFloat(valorAdicionalSegundaCarne.replace(',', '.')) || 0,
      });
      setMensagemSucesso(
        'Configurações, preços, regras de carnes na marmita salvos com sucesso!'
      );
    } catch (err: any) {
      console.error('Erro ao salvar configuração:', err);
      setErroConfig(err?.message || 'Erro ao salvar configurações no servidor.');
    } finally {
      setSalvandoConfig(false);
    }
  };

  const handleSalvarTema = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoTema(true);
    setMensagemTemaSucesso('');
    setErroTema('');
    try {
      await salvarConfiguracaoRestaurante({
        nomeRestaurante: nomeRest,
        telefoneRestaurante: telRest,
        enderecoRestaurante: endRest,
        cep: cepRest,
        cnpj: cnpjRest,
        instagram: instagramRest,
        facebook: facebookRest,
        whatsapp: whatsappRest,
        precoMarmitaP: parseFloat(precoP.replace(',', '.')) || 16,
        precoMarmitaM: parseFloat(precoM.replace(',', '.')) || 20,
        precoMarmitaG: parseFloat(precoG.replace(',', '.')) || 25,
        precoAlmocoInteira: parseFloat(precoAlmocoInteira.replace(',', '.')) || 30,
        precoAlmocoMeia: parseFloat(precoAlmocoMeia.replace(',', '.')) || 20,
        precoPorcaoCarne: parseFloat(precoPorcaoCarne.replace(',', '.')) || 22,
        precoPorcaoAcompanhamento: parseFloat(precoPorcaoAcomp.replace(',', '.')) || 12,
        precoBuffetAdulto: parseFloat(buffetAdulto.replace(',', '.')) || 44.9,
        precoBuffetCrianca: parseFloat(buffetCrianca.replace(',', '.')) || 24.9,
        precoBuffetKilo: parseFloat(buffetKilo.replace(',', '.')) || 69.9,
        logoUrl,
        bannerUrl,
        corPrimaria,
        corTemaNome,
        corFundo: corBody || corFundo,
        corFundoNome,
        corBotoes,
        corHeader,
        corHeaderTexto,
        corAside,
        corAsideTexto,
        corBody,
        corFooter,
        corFooterTexto,
        corSugestoes,
        corSugestoesTexto,
        iconeTema,
        iconeCustomUrl: tipoIcone === 'imagem' ? iconeCustomUrl : '',
        quantidadeCarnesPadrao: Number(quantidadeCarnesPadrao) || 1,
        permitirMaisDeUmaCarne,
        limiteCarnesMarmita: Number(limiteCarnesMarmita) || 1,
        diasPermiteDuasCarnes,
        valorAdicionalSegundaCarne: parseFloat(valorAdicionalSegundaCarne.replace(',', '.')) || 0,
      });

      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--cor-primaria', corPrimaria);
        document.documentElement.style.setProperty('--cor-fundo', corBody || corFundo);
        document.documentElement.style.setProperty('--cor-body', corBody || corFundo);
        document.documentElement.style.setProperty('--cor-botoes', corBotoes);
        document.documentElement.style.setProperty('--cor-header', corHeader);
        document.documentElement.style.setProperty('--cor-header-texto', corHeaderTexto);
        document.documentElement.style.setProperty('--cor-aside', corAside);
        document.documentElement.style.setProperty('--cor-aside-texto', corAsideTexto);
        document.documentElement.style.setProperty('--cor-footer', corFooter);
        document.documentElement.style.setProperty('--cor-footer-texto', corFooterTexto);
        document.documentElement.style.setProperty('--cor-sugestoes', corSugestoes);
        document.documentElement.style.setProperty('--cor-sugestoes-texto', corSugestoesTexto);
        
        const favicon = logoUrl || iconeCustomUrl;
        import('../utils/favicon').then(({ atualizarFavicon }) => {
          atualizarFavicon(favicon);
        });
      }

      setMensagemTemaSucesso(
        'Cores e identidade visual salvas e aplicadas com sucesso!'
      );
    } catch (err: any) {
      console.error('Erro ao salvar tema:', err);
      setErroTema(err?.message || 'Erro ao salvar identidade visual no servidor.');
    } finally {
      setSalvandoTema(false);
    }
  };

  // Funções para Impressoras Térmicas IP
  const handleCriarImpressora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeImpressora.trim() || !ipImpressora.trim()) return;
    setSalvandoImpressora(true);
    setMsgImpressoraSucesso('');
    try {
      await criarImpressoraTermica({
        nome: nomeImpressora.trim(),
        ip: ipImpressora.trim(),
        porta: Number(portaImpressora) || 9100,
        setor: setorImpressora,
        larguraBobina,
        modelo: modeloImpressora,
        ativo: true,
      });
      setNomeImpressora('');
      setIpImpressora('');
      setPortaImpressora('9100');
      setMsgImpressoraSucesso('Impressora térmica IP cadastrada com sucesso!');
    } catch (err) {
      console.error('Erro ao cadastrar impressora térmica:', err);
    } finally {
      setSalvandoImpressora(false);
    }
  };

  const handleToggleImpressoraAtivo = async (imp: ImpressoraTermica) => {
    try {
      await atualizarImpressoraTermica(imp.id, { ativo: !imp.ativo });
    } catch (err) {
      console.error('Erro ao alternar status da impressora:', err);
    }
  };

  const handleExcluirImpressora = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a impressora "${nome}"?`)) return;
    try {
      await excluirImpressoraTermica(id);
    } catch (err) {
      console.error('Erro ao excluir impressora:', err);
    }
  };

  const handleTestarImpressora = (imp: ImpressoraTermica) => {
    setImpressoraTestadaId(imp.id);
    setTimeout(() => {
      setImpressoraTestadaId(null);
    }, 4000);
  };

  const handleTestarImpressaoChrome = () => {
    const ticketTeste: ThermalReceiptData = {
      titulo: 'CUPOM DE TESTE (BEMATECH MP-4200)',
      subtitulo: 'Impressão Direta pelo Google Chrome',
      numeroDocumento: 'TICKET #0001-TESTE',
      dataHora: formatDateTime(new Date().toISOString()),
      clienteOuMesa: 'Balcão / Teste de Impressão',
      linhas: [
        { qtd: 1, descricao: 'Marmita Grande - Churrasco Completo', valor: 25.0 },
        { qtd: 1, descricao: 'Refrigerante Lata 350ml', valor: 6.0 },
        { qtd: 1, descricao: 'Sobremesa Pudim Tradicional', valor: 7.0 },
      ],
      subtotal: 38.0,
      total: 38.0,
      formaPagamento: 'Dinheiro (R$ 50,00)',
      troco: 'Troco: R$ 12,00',
      observacoesGerais: 'Bobina de 80mm - Impressão via Google Chrome. Bematech MP-4200 conectada via USB.',
      rodape: 'Tudo certo! Sua impressora Bematech MP-4200 está funcionando perfeitamente.',
    };

    if (onPrintReceipt) {
      onPrintReceipt(ticketTeste);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Usuários, Permissões & Configurações
          </h1>
          <p className="text-sm text-slate-600">
            Controle administrativo de funcionários, identidade visual (cores/ícones), preços e auditoria
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            onClick={() => setAba('usuarios')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'usuarios'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Usuários & Permissões ({usuarios.length})
          </button>
          <button
            onClick={() => setAba('configuracoes')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'configuracoes'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preços & Dados
          </button>
          <button
            onClick={() => setAba('temas_cores')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              aba === 'temas_cores'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-600" />
            Cores & Ícones
          </button>
          <button
            onClick={() => setAba('impressoras')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              aba === 'impressoras'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            Impressoras (Chrome / Bematech MP-4200)
          </button>
          <button
            onClick={() => setAba('taxas_ruas')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'taxas_ruas'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Taxas por Rua / Bairro ({regioes.length})
          </button>
          <button
            onClick={() => setAba('auditoria')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'auditoria'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auditoria ({logsAuditoria.length})
          </button>
        </div>
      </div>

      {aba === 'usuarios' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Cadastrar Usuário */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-600" />
              Criar Usuário / Funcionário
            </h2>
            <form onSubmit={handleCriarUsuario} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nomeUsr}
                  onChange={(e) => setNomeUsr(e.target.value)}
                  placeholder="Ex: Ana Paula (Caixa)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  required
                  value={emailUsr}
                  onChange={(e) => setEmailUsr(e.target.value)}
                  placeholder="ana@restaurante.com.br"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Função / Perfil de Acesso *
                </label>
                <select
                  value={funcaoUsr}
                  onChange={(e) => setFuncaoUsr(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="administrador">
                    Administrador (Acesso completo)
                  </option>
                  <option value="caixa">
                    Caixa (Caixa, vendas e fechamento)
                  </option>
                  <option value="atendente">
                    Atendente/Garçom (Mesas, comandas e pedidos)
                  </option>
                  <option value="cozinha">
                    Cozinha (Somente pedidos da cozinha KDS)
                  </option>
                  <option value="entregador">
                    Entregador (Entregas atribuídas)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Permissões Específicas (Opcional)
                </label>
                <input
                  type="text"
                  value={permissoesUsr}
                  onChange={(e) => setPermissoesUsr(e.target.value)}
                  placeholder="Deixe vazio para usar padrão da função"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Cadastrar Usuário
              </button>
            </form>
          </div>

          {/* Lista de Usuários */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Funcionários Cadastrados e Controle de Bloqueio
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Nome / E-mail</th>
                    <th className="py-3 px-4">Alterar Função</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {u.nome}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={u.funcao}
                          onChange={(e) =>
                            atualizarUsuarioPainelAdmin(u, {
                              funcao: e.target.value as UserRole,
                            })
                          }
                          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="administrador">
                            {formatRoleName('administrador')}
                          </option>
                          <option value="caixa">
                            {formatRoleName('caixa')}
                          </option>
                          <option value="atendente">
                            {formatRoleName('atendente')}
                          </option>
                          <option value="cozinha">
                            {formatRoleName('cozinha')}
                          </option>
                          <option value="entregador">
                            {formatRoleName('entregador')}
                          </option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-xs font-medium">
                        {u.bloqueado ? (
                          <span className="text-red-600">Bloqueado</span>
                        ) : (
                          <span className="text-emerald-700">Ativo</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() =>
                              atualizarUsuarioPainelAdmin(u, {
                                bloqueado: !u.bloqueado,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50"
                          >
                            {u.bloqueado ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                Desbloquear
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                Bloquear
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => excluirUsuarioPainelAdmin(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600"
                            title="Remover usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {aba === 'configuracoes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl space-y-6">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Preços de Marmitas, Buffet & Dados do Restaurante
          </h2>

          {mensagemSucesso && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {erroConfig && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erroConfig}</span>
            </div>
          )}

          <form onSubmit={handleSalvarConfig} className="space-y-5">
            {/* Imagem da Logo do Restaurante */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  Imagem da Logo do Restaurante
                </label>
                <span className="text-[11px] text-slate-500">
                  Exibida no cabeçalho do Delivery, barra superior e cupons
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Preview Box */}
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group cursor-pointer hover:border-amber-500 transition-colors">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-1 text-slate-400 group-hover:text-amber-600">
                      <Utensils className="w-6 h-6 mx-auto mb-0.5" />
                      <span className="text-[9px] font-bold block">Carregar</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLogo}
                    className="hidden"
                  />
                </label>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://... ou clique em Carregar Imagem"
                      className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadandoLogo ? 'Processando...' : 'Carregar Imagem'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadLogo}
                        className="hidden"
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-2.5 py-2 border border-slate-300 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg text-xs transition-colors shrink-0"
                        title="Remover logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Selecione um arquivo de imagem do seu computador ou celular (PNG, JPG, SVG, WebP) ou digite um link direto.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Restaurante
                </label>
                <input
                  type="text"
                  required
                  value={nomeRest}
                  onChange={(e) => setNomeRest(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={cnpjRest}
                  onChange={(e) => setCnpjRest(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telefone / WhatsApp Principal
                </label>
                <input
                  type="text"
                  value={telRest}
                  onChange={(e) => setTelRest(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CEP do Restaurante
                </label>
                <input
                  type="text"
                  value={cepRest}
                  onChange={(e) => setCepRest(e.target.value)}
                  placeholder="00000-000"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Endereço Completo (Exibido no Cupom)
                </label>
                <input
                  type="text"
                  value={endRest}
                  onChange={(e) => setEndRest(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-2">
                Redes Sociais do Restaurante (Aparecem no Site do Cliente & Rodapé)
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={instagramRest}
                    onChange={(e) => setInstagramRest(e.target.value)}
                    placeholder="@restaurantekero"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={facebookRest}
                    onChange={(e) => setFacebookRest(e.target.value)}
                    placeholder="facebook.com/restaurantekero"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp Delivery
                  </label>
                  <input
                    type="text"
                    value={whatsappRest}
                    onChange={(e) => setWhatsappRest(e.target.value)}
                    placeholder="11999999999"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-3">
                Tabela de Preços das Marmitas (Configurável pelo Administrador)
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Marmita Pequena (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoP}
                    onChange={(e) => setPrecoP(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Marmita Média (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoM}
                    onChange={(e) => setPrecoM(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Marmita Grande (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoG}
                    onChange={(e) => setPrecoG(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Tabela de Preços do Almoço / Refeição (Inteira e Meia) */}
            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5 font-display">
                <Utensils className="w-4 h-4 text-amber-600" />
                Preços de Almoço / Refeição (Opção Inteira ou Meia)
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Valores para clientes que escolhem almoçar diretamente: Inteira (refeição completa) ou Meia (porção menor).
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Almoço Inteira (R$) - Padrão R$ 30,00
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoAlmocoInteira}
                    onChange={(e) => setPrecoAlmocoInteira(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Almoço Meia (R$) - Padrão R$ 20,00
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoAlmocoMeia}
                    onChange={(e) => setPrecoAlmocoMeia(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Tabela de Preços de Porções Avulsas (em Marmita Separada) */}
            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5 font-display">
                <Layers className="w-4 h-4 text-amber-600" />
                Preços de Porções Avulsas (Enviadas em Marmita Separada)
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Defina os preços para clientes que pedem porção extra avulsa em marmita separada (carne do dia ou acompanhamentos, que são mais baratos).
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Porção de Carne Avulsa (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoPorcaoCarne}
                    onChange={(e) => setPrecoPorcaoCarne(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Cliente escolhe a carne do dia e vai em marmita separada.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Porção de Acompanhamento (R$) - Mais Barato
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoPorcaoAcomp}
                    onChange={(e) => setPrecoPorcaoAcomp(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Arroz, feijão tropeiro, saladas, fritas, etc. em marmita separada.
                  </span>
                </div>
              </div>
            </div>

            {/* Regras de Quantidade de Carnes na Marmita (Cliente e Gerenciador) */}
            <div className="pt-4 border-t border-slate-200 space-y-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200/70">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                    <Beef className="w-4 h-4 text-amber-600" />
                    Regra de Quantidade de Carnes na Marmita (Cliente & Gerenciador)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Defina quantas carnes os clientes e o gerenciador podem selecionar na marmita e em quais dias da semana isso é permitido.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade Padrão de Carnes Permitidas
                  </label>
                  <select
                    value={quantidadeCarnesPadrao}
                    onChange={(e) => setQuantidadeCarnesPadrao(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-amber-600 font-medium"
                  >
                    <option value={1}>1 Carne por Marmita (Padrão e Recomendado)</option>
                    <option value={2}>2 Carnes por Marmita</option>
                    <option value={3}>3 Carnes por Marmita</option>
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Limite padrão aplicado aos pedidos de marmita.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Permitir mais carnes em dias específicos?
                  </label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={permitirMaisDeUmaCarne}
                        onChange={(e) => setPermitirMaisDeUmaCarne(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                      />
                      <span>Habilitar carnes adicionais</span>
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Quando desmarcado, fica restrito à quantidade padrão (ex: 1 carne).
                  </span>
                </div>
              </div>

              {permitirMaisDeUmaCarne && (
                <div className="space-y-3 pt-3 border-t border-amber-200/60 bg-white/70 p-3.5 rounded-lg border border-amber-100">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Limite Máximo nos Dias Permitidos
                      </label>
                      <select
                        value={limiteCarnesMarmita}
                        onChange={(e) => setLimiteCarnesMarmita(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value={2}>Até 2 Carnes</option>
                        <option value={3}>Até 3 Carnes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Valor Adicional para Carne Extra (R$)
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={valorAdicionalSegundaCarne}
                        onChange={(e) => setValorAdicionalSegundaCarne(e.target.value)}
                        placeholder="Ex: 2.00 (deixe 0 para inclusa)"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Dias da semana em que é permitido colocar mais carnes:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'segunda', label: 'Segunda' },
                        { key: 'terca', label: 'Terça' },
                        { key: 'quarta', label: 'Quarta' },
                        { key: 'quinta', label: 'Quinta' },
                        { key: 'sexta', label: 'Sexta' },
                        { key: 'sabado', label: 'Sábado' },
                      ].map((dia) => {
                        const ativo = diasPermiteDuasCarnes.includes(dia.key);
                        return (
                          <button
                            key={dia.key}
                            type="button"
                            onClick={() => {
                              if (ativo) {
                                setDiasPermiteDuasCarnes((prev) => prev.filter((d) => d !== dia.key));
                              } else {
                                setDiasPermiteDuasCarnes((prev) => [...prev, dia.key]);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all ${
                              ativo
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {dia.label}
                          </button>
                        );
                      })}
                      <span className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 text-center cursor-not-allowed">
                        Domingo (Fechado)
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDiasPermiteDuasCarnes([
                            'segunda',
                            'terca',
                            'quarta',
                            'quinta',
                            'sexta',
                            'sabado',
                          ])
                        }
                        className="text-[10px] text-amber-700 hover:underline font-semibold"
                      >
                        Selecionar Seg a Sáb
                      </button>
                      <span className="text-[10px] text-slate-400">·</span>
                      <button
                        type="button"
                        onClick={() => setDiasPermiteDuasCarnes(['sabado'])}
                        className="text-[10px] text-amber-700 hover:underline font-semibold"
                      >
                        Apenas Sábado
                      </button>
                      <span className="text-[10px] text-slate-400">·</span>
                      <button
                        type="button"
                        onClick={() => setDiasPermiteDuasCarnes([])}
                        className="text-[10px] text-slate-500 hover:underline"
                      >
                        Limpar Seleção
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800">
                  Tabela de Preços do Buffet Livre
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Não trabalhamos com almoço por quilo
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Buffet Livre Adulto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={buffetAdulto}
                    onChange={(e) => setBuffetAdulto(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Coma à vontade no salão (adulto).
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Buffet Infantil (Crianças até 6 anos - Meia) (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={buffetCrianca}
                    onChange={(e) => setBuffetCrianca(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    Regra oficial: Crianças até 6 anos pagam meia.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={salvandoConfig}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {salvandoConfig
                ? 'Salvando no Firestore...'
                : 'Salvar Alterações de Preços e Configurações'}
            </button>
          </form>
        </div>
      )}

      {/* ABA DE IDENTIDADE VISUAL: CORES, LOGO, BANNER, FUNDO E ÍCONES */}
      {aba === 'temas_cores' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSalvarTema}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-8"
          >
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-600" />
                  Identidade Visual, Logo, Banner, Cores e Ícones do Site
                </h2>
                <p className="text-xs text-slate-500">
                  Personalize a imagem da logo, o banner de apresentação, a cor de fundo, as cores principais e os botões que aparecem para os clientes e no painel interno.
                </p>
              </div>

              {mensagemTemaSucesso && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{mensagemTemaSucesso}</span>
                </div>
              )}

              {erroTema && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{erroTema}</span>
                </div>
              )}
            </div>

            {/* SEÇÃO A: LOGO DO RESTAURANTE & ÍCONE DA BARRA (FAVICON) */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  1. Imagem da Logo do Restaurante & Ícone da Barra Superior / Aba do Navegador
                </label>
                <p className="text-xs text-slate-500">
                  Faça o upload do arquivo de imagem da logo do restaurante ou insira o link direto. Ela será exibida no cabeçalho do site e pode ser usada como ícone oficial da aba.
                </p>
              </div>

              <div className="grid sm:grid-cols-12 gap-4 items-start">
                {/* Preview da Logo */}
                <div className="sm:col-span-4 p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center space-y-2">
                  <label
                    className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden border-2 shadow-md relative cursor-pointer group hover:opacity-90 transition-all"
                    style={{ backgroundColor: corFundo, borderColor: corPrimaria }}
                    title="Clique para escolher uma imagem do seu dispositivo"
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo do Restaurante"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-white">
                        <Utensils className="w-8 h-8 mx-auto opacity-70 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] uppercase font-bold block mt-1">Carregar Logo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                      Alterar
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs font-semibold text-slate-800">
                    {nomeRest || 'Logo Atual'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Aparece no topo do Delivery e do Painel
                  </span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium pt-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover Logo
                    </button>
                  )}
                </div>

                {/* Controles de Upload e URL da Logo */}
                <div className="sm:col-span-8 space-y-3">
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://... URL da logo (PNG, JPG, SVG)"
                      className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600 bg-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 shadow-xs">
                      <Upload className="w-4 h-4" />
                      {uploadandoLogo ? 'Processando Imagem...' : 'Carregar Imagem'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadLogo}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-xs text-slate-500">
                    Formatos aceitos: <strong>PNG, JPG, JPEG, WEBP e SVG</strong>. A imagem é otimizada e salva permanentemente no sistema.
                  </p>

                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
                    <span>
                      Deseja usar esta logo como o <strong>ícone da barra do site / favicon</strong>?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!logoUrl) {
                          alert('Por favor, carregue a imagem da logo primeiro.');
                          return;
                        }
                        setIconeCustomUrl(logoUrl);
                        setTipoIcone('imagem');
                        const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
                        if (link) link.href = logoUrl;
                        alert('Logo definida como o ícone principal e favicon da barra do site!');
                      }}
                      className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 text-xs shrink-0 shadow-xs"
                    >
                      Usar Logo na Barra
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO B: BANNER DO RESTAURANTE (PARTE QUE APARECE PARA O CLIENTE) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  2. Banner do Restaurante (Vitrine Superior que Aparece para o Cliente)
                </label>
                <p className="text-xs text-slate-500">
                  Configure o banner ilustrativo de capa do restaurante com seus pratos, churrasco ou identidade. O cliente vê esta imagem logo ao abrir o site.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://... URL do Banner do Restaurante"
                    className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0">
                    <Upload className="w-4 h-4" />
                    {uploadandoBanner ? 'Enviando...' : 'Carregar Banner'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadBanner}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Pré-visualização do Banner Panorâmico */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md h-40 sm:h-52 w-full bg-slate-900">
                  <img
                    src={bannerUrl || IMAGENS_PADRAO.porcaoChurrasco}
                    alt="Banner do Restaurante"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Pré-visualização do Banner do Cliente
                    </span>
                    <h3 className="text-lg sm:text-2xl font-extrabold font-display">
                      {nomeRest || 'RESTAURANTE KERO'}
                    </h3>
                    <p className="text-xs text-slate-200 max-w-lg line-clamp-1">
                      Marmitas Tradicionais, Carnes Especiais & Self-Service — Faça seu pedido online!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: SUGESTÕES DE PALETAS COMPLETAS DE CORES (APLICAÇÃO EM 1 CLIQUE) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    3. Sugestões de Paletas Completas de Cores (Aplicação em 1 Clique)
                  </label>
                  <p className="text-xs text-slate-500">
                    Escolha uma das sugestões profissionais prontas para aplicar harmonia de cores no Header, Aside, Body, Footer e Sugestões.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PALETAS_SUGESTOES.map((paleta) => {
                  const estaAtiva =
                    corHeader.toLowerCase() === paleta.header.toLowerCase() &&
                    corBody.toLowerCase() === paleta.body.toLowerCase();
                  return (
                    <button
                      key={paleta.id}
                      type="button"
                      onClick={() => {
                        setCorHeader(paleta.header);
                        setCorHeaderTexto(paleta.headerTexto);
                        setCorAside(paleta.aside);
                        setCorAsideTexto(paleta.asideTexto);
                        setCorBody(paleta.body);
                        setCorFundo(paleta.body);
                        setCorFooter(paleta.footer);
                        setCorFooterTexto(paleta.footerTexto);
                        setCorSugestoes(paleta.sugestoes);
                        setCorSugestoesTexto(paleta.sugestoesTexto);
                        setCorBotoes(paleta.botoes);
                        setCorPrimaria(paleta.primaria);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3 ${
                        estaAtiva
                          ? 'border-amber-500 shadow-md ring-2 ring-amber-500/30 bg-amber-50/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {paleta.nome}
                          </span>
                          {estaAtiva && (
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {paleta.desc}
                        </p>
                      </div>

                      {/* Amostras de Cores da Paleta */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                            style={{ backgroundColor: paleta.header }}
                            title="Header"
                          />
                          <span
                            className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                            style={{ backgroundColor: paleta.aside }}
                            title="Aside / Barra lateral"
                          />
                          <span
                            className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                            style={{ backgroundColor: paleta.body }}
                            title="Body / Fundo"
                          />
                          <span
                            className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                            style={{ backgroundColor: paleta.footer }}
                            title="Footer / Rodapé"
                          />
                          <span
                            className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                            style={{ backgroundColor: paleta.sugestoes }}
                            title="Sugestões"
                          />
                          <span
                            className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                            style={{ backgroundColor: paleta.botoes }}
                            title="Botões"
                          />
                        </div>
                        <span className="text-[10px] text-amber-700 font-semibold block">
                          Aplicar todas as cores
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO 4: SELETOR DE COR DE TUDO NO SITE (HEADER, ASIDE, BODY, FOOTER E SUGESTÕES) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-600" />
                  4. Selecionar Cor de Tudo no Site (Header, Aside, Body, Footer e Sugestões)
                </label>
                <p className="text-xs text-slate-500">
                  Ajuste a cor exata de cada área estrutural do site para celular, computador e painel administrativo.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. HEADER */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      🏛️ Header (Cabeçalho do Site)
                    </span>
                    <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: corHeader }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Barra superior com a logo, nome do restaurante e navegação.
                  </p>
                  
                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor do Fundo:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corHeader}
                          onChange={(e) => setCorHeader(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corHeader}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor do Texto:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corHeaderTexto}
                          onChange={(e) => setCorHeaderTexto(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corHeaderTexto}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. ASIDE (BARRA LATERAL / MENU) */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      📂 Aside (Menu / Barra Lateral)
                    </span>
                    <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: corAside }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Menu lateral de módulos no painel interno e seletor de categorias.
                  </p>

                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor do Fundo:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corAside}
                          onChange={(e) => setCorAside(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corAside}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor do Texto:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corAsideTexto}
                          onChange={(e) => setCorAsideTexto(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corAsideTexto}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. BODY (FUNDO GERAL DO SITE) */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      🖥️ Body (Fundo da Página Inteira)
                    </span>
                    <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: corBody }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Plano de fundo principal onde os pratos e opções são exibidos.
                  </p>

                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor do Fundo:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corBody}
                          onChange={(e) => {
                            setCorBody(e.target.value);
                            setCorFundo(e.target.value);
                          }}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corBody}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. FOOTER (RODAPÉ DO SITE) */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      🔻 Footer (Rodapé do Site)
                    </span>
                    <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: corFooter }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Área inferior com dados de contato, endereço, CEP e redes sociais.
                  </p>

                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor do Fundo:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corFooter}
                          onChange={(e) => setCorFooter(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corFooter}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor do Texto:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corFooterTexto}
                          onChange={(e) => setCorFooterTexto(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corFooterTexto}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. SUGESTÕES (CARROSSEL E CARDS DE SUGESTÕES) */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      💡 Sugestões (Carrossel & Destaques)
                    </span>
                    <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: corSugestoes }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Cor dos blocos de sugestões especiais de bebidas, doces e acompanhamentos.
                  </p>

                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor de Destaque:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corSugestoes}
                          onChange={(e) => setCorSugestoes(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corSugestoes}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor do Título:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corSugestoesTexto}
                          onChange={(e) => setCorSugestoesTexto(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corSugestoesTexto}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. BOTÕES DE AÇÃO & SACORA */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      🔘 Botões de Ação & Compra
                    </span>
                    <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: corBotoes }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Botão de Adicionar à Sacola, Finalizar Pedido e ações primárias.
                  </p>

                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">Cor do Botão:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={corBotoes}
                          onChange={(e) => setCorBotoes(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                          {corBotoes}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full py-1.5 rounded-lg text-xs font-bold text-slate-950 shadow-xs"
                      style={{ backgroundColor: corBotoes }}
                    >
                      Exemplo: Adicionar à Sacola
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 5: ÍCONE TEMÁTICO DO RESTAURANTE */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-900">
                  5. Ícone Temático do Restaurante
                </label>
                <p className="text-xs text-slate-500">
                  Este ícone é exibido nos destaques e na barra lateral quando nenhuma logo com imagem for carregada.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'flame', label: 'Cozinha & Sabor', icon: Flame, desc: 'Preparo & tempero artesanal' },
                  { id: 'beef', label: 'Carnes Selecionadas', icon: Beef, desc: 'Especialista em carnes saborosas' },
                  { id: 'utensils', label: 'Talheres & Salão', icon: Utensils, desc: 'Restaurante & buffet' },
                  { id: 'crown', label: 'Coroa Kero', icon: Crown, desc: 'Qualidade nobre' },
                  { id: 'zap', label: 'Raio Rápido', icon: Zap, desc: 'Entrega ágil e express' },
                  { id: 'soup', label: 'Marmita Quente', icon: Soup, desc: 'Almoço caseiro' },
                  { id: 'chef-hat', label: 'Chapéu de Chef', icon: ChefHat, desc: 'Culinária artesanal' },
                  { id: 'sparkles', label: 'Estrela Kero', icon: Sparkles, desc: 'Destaque e sabor' },
                ].map((item) => {
                  const IconComp = item.icon;
                  const selecionado = iconeTema === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIconeTema(item.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        selecionado
                          ? 'border-slate-900 shadow-md ring-2 ring-slate-900/20 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: `${corPrimaria}20`,
                            color: corPrimaria,
                          }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      {selecionado && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO 6: PRÉ-VISUALIZAÇÃO AO VIVO DO SITE COMPLETO */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-900">
                6. Pré-visualização ao Vivo do Site Completo (Header, Aside, Body, Sugestões, Botões e Footer)
              </label>

              <div
                className="rounded-3xl border border-slate-800 overflow-hidden shadow-2xl transition-all flex flex-col"
                style={{ backgroundColor: corBody }}
              >
                {/* Header Simulado */}
                <header
                  className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between transition-colors"
                  style={{
                    backgroundColor: corHeader,
                    color: corHeaderTexto,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md overflow-hidden border border-white/20"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo Simulado"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Flame className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold font-display leading-tight" style={{ color: corHeaderTexto }}>
                        {nomeRest || 'RESTAURANTE KERO'}
                      </h4>
                      <p className="text-[10px] opacity-75">
                        {endRest || 'Rua Gastronômica'} {cepRest ? `· CEP ${cepRest}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 shadow-md transition-transform"
                      style={{ backgroundColor: corBotoes }}
                    >
                      Sacola (R$ 0,00)
                    </button>
                  </div>
                </header>

                {/* Conteúdo com Aside e Body */}
                <div className="flex flex-1 min-h-[160px]">
                  {/* Aside Simulado */}
                  <aside
                    className="w-48 p-3 border-r border-white/10 space-y-1.5 shrink-0 hidden sm:block transition-colors text-xs"
                    style={{
                      backgroundColor: corAside,
                      color: corAsideTexto,
                    }}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-60 px-2 py-1">
                      Categorias
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg font-bold text-white shadow-xs" style={{ backgroundColor: corPrimaria }}>
                      🍱 Marmitas & Carnes
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg opacity-80 hover:opacity-100">
                      🥤 Bebidas Geladas
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg opacity-80 hover:opacity-100">
                      🍰 Sobremesas
                    </div>
                  </aside>

                  {/* Body Simulado */}
                  <div className="p-4 sm:p-5 flex-1 space-y-4 text-white">
                    {/* Bloco de Sugestões Simulado */}
                    <div
                      className="p-4 rounded-2xl border-2 space-y-2 transition-all shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${corSugestoes}25 0%, rgba(15, 23, 42, 0.9) 100%)`,
                        borderColor: corSugestoes,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5"
                          style={{ color: corSugestoesTexto }}
                        >
                          <Sparkles className="w-3.5 h-3.5" style={{ color: corSugestoes }} />
                          Sugestões Especiais do Chefe
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10">
                          Mais Pedidos
                        </span>
                      </div>
                      <p className="text-[11px] text-white/80">
                        Que tal adicionar Coca-Cola trincando de gelada e Pudim caseiro à sua marmita?
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/70 pt-2 border-t border-white/10">
                      <span>Header: <strong className="font-mono text-white">{corHeader}</strong></span>
                      <span>Aside: <strong className="font-mono text-white">{corAside}</strong></span>
                      <span>Body: <strong className="font-mono text-white">{corBody}</strong></span>
                      <span>Footer: <strong className="font-mono text-white">{corFooter}</strong></span>
                      <span>Sugestões: <strong className="font-mono text-white">{corSugestoes}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Footer Simulado */}
                <footer
                  className="px-5 py-3 border-t border-white/10 text-center text-xs transition-colors"
                  style={{
                    backgroundColor: corFooter,
                    color: corFooterTexto,
                  }}
                >
                  <p className="font-bold text-[11px]">
                    {nomeRest || 'RESTAURANTE KERO'} — Marmitas Tradicionais & Delivery
                  </p>
                  <p className="text-[10px] opacity-75 mt-0.5">
                    {endRest || 'Rua Gastronômica'} {telRest ? `· ${telRest}` : ''}
                  </p>
                </footer>
              </div>
            </div>

            {mensagemTemaSucesso && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{mensagemTemaSucesso}</span>
              </div>
            )}

            {erroTema && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{erroTema}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Todas as alterações de cores, logo e banner são gravadas e mantidas de forma permanente.
              </span>

              <button
                type="submit"
                disabled={salvandoTema}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-slate-950 text-sm font-extrabold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0"
                style={{ backgroundColor: corBotoes }}
              >
                <Save className="w-4 h-4" />
                {salvandoTema ? 'Salvando...' : 'Salvar Identidade Visual Completa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ABA DE GERENCIAMENTO DE IMPRESSORAS (CHROME / BEMATECH MP-4200 & REDE) */}
      {aba === 'impressoras' && (
        <div className="space-y-6">
          {/* Card Principal: Sistema Nativo do Google Chrome (Ideal para Bematech MP-4200 TH e USB) */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/40 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 font-display">
                      Impressão Direta pelo Google Chrome
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Recomendado para Bematech MP-4200
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Sem necessidade de IP / Rede
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Sua impressora <strong>Bematech MP-4200</strong> funciona diretamente pelo sistema de impressão do Google Chrome! Você <strong>não precisa saber o IP nem configurar portas</strong>. Qualquer impressora instalada no Windows ou conectada no cabo USB aparece na lista de impressão.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestarImpressaoChrome}
                className="inline-flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Testar Impressão na Bematech MP-4200</span>
              </button>
            </div>

            {/* Como Funciona na Prática */}
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-black">1</span>
                  Conecte no USB
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Conecte a Bematech MP-4200 no computador via cabo USB. O Windows reconhece a impressora normalmente.
                </p>
              </div>

              <div className="bg-white border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-black">2</span>
                  Janela do Chrome
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Ao confirmar qualquer venda no caixa ou clicar em <strong>"Testar Impressão"</strong>, a janela nativa do Chrome abre com a lista de impressoras conectadas.
                </p>
              </div>

              <div className="bg-white border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-black">3</span>
                  Selecione Bematech MP-4200
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Em <strong>Destino</strong> selecione a Bematech MP-4200. Papel: <strong>80mm</strong>, Margens: <strong>Nenhuma</strong>. O Chrome memoriza para sempre!
                </p>
              </div>
            </div>
          </div>

          {/* Card Secundário: Cadastro Opcional de Impressoras de Rede IP */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-blue-600" />
                Configuração Opcional: Impressoras de Rede Local via IP
              </h2>
              <p className="text-xs text-slate-500">
                Apenas para restaurantes que utilizam impressoras conectadas diretamente ao roteador via cabo de rede Ethernet (Wi-Fi). Se sua impressora for USB (como a Bematech MP-4200), utilize o sistema do Chrome acima.
              </p>
            </div>

            {msgImpressoraSucesso && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{msgImpressoraSucesso}</span>
              </div>
            )}

            <form onSubmit={handleCriarImpressora} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome / Identificação da Impressora *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeImpressora}
                    onChange={(e) => setNomeImpressora(e.target.value)}
                    placeholder="Ex: Epson Cozinha Quente"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-blue-600" />
                    Endereço IP na Rede Local *
                  </label>
                  <input
                    type="text"
                    required
                    value={ipImpressora}
                    onChange={(e) => setIpImpressora(e.target.value)}
                    placeholder="Ex: 192.168.1.200"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Porta TCP (Padrão 9100)
                  </label>
                  <input
                    type="number"
                    value={portaImpressora}
                    onChange={(e) => setPortaImpressora(e.target.value)}
                    placeholder="9100"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Setor de Impressão (Destino dos Pedidos) *
                  </label>
                  <select
                    value={setorImpressora}
                    onChange={(e) => setSetorImpressora(e.target.value as SetorImpressao)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="cozinha">🍳 Cozinha KDS (Marmitas & Pratos Quentes)</option>
                    <option value="caixa">💵 Caixa & Balcão (Cupons Fiscais & Vendas)</option>
                    <option value="bar">🍹 Bar & Bebidas (Comandas de Bebidas)</option>
                    <option value="todos">🌐 Todos os Setores (Geral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Largura da Bobina Térmica
                  </label>
                  <select
                    value={larguraBobina}
                    onChange={(e) => setLarguraBobina(e.target.value as '80mm' | '58mm')}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="80mm">80 mm (Padrão Comercial 48 colunas)</option>
                    <option value="58mm">58 mm (Compacta 32 colunas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Modelo / Fabricante
                  </label>
                  <input
                    type="text"
                    value={modeloImpressora}
                    onChange={(e) => setModeloImpressora(e.target.value)}
                    placeholder="Ex: Epson TM-T20X / Bematech MP-4200"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={salvandoImpressora}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {salvandoImpressora ? 'Cadastrando...' : 'Cadastrar Impressora Térmica'}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Impressoras Cadastradas */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                Impressoras Térmicas Configuradas ({impressoras.length})
              </h3>
              <span className="text-xs text-slate-500">
                As impressões de cada setor são direcionadas automaticamente para o IP cadastrado
              </span>
            </div>

            {impressoras.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Printer className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium text-slate-700">
                  Nenhuma impressora térmica IP cadastrada ainda.
                </p>
                <p className="text-xs text-slate-500">
                  Preencha o formulário acima para cadastrar a impressora da Cozinha, do Caixa ou do Bar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {impressoras.map((imp) => {
                  const estaTestando = impressoraTestadaId === imp.id;
                  return (
                    <div
                      key={imp.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {imp.nome}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              imp.setor === 'cozinha'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : imp.setor === 'caixa'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : imp.setor === 'bar'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            Setor: {imp.setor}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            Bobina {imp.larguraBobina || '80mm'}
                          </span>
                          {imp.ativo ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Ativa
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">
                              Inativa
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Wifi className="w-3.5 h-3.5 text-blue-600" />
                            {imp.ip}:{imp.porta || 9100}
                          </span>
                          <span>·</span>
                          <span>{imp.modelo || 'ESC/POS'}</span>
                        </div>

                        {estaTestando && (
                          <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-bounce">
                            <Check className="w-4 h-4 text-emerald-600" />
                            Comando ESC/POS enviado para {imp.ip}:{imp.porta} — Comunicação e guilhotina OK!
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTestarImpressora(imp)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                          title="Enviar comando de teste para a impressora IP"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Testar Impressão
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleImpressoraAtivo(imp)}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                            imp.ativo
                              ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {imp.ativo ? 'Desativar' : 'Ativar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExcluirImpressora(imp.id, imp.nome)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir impressora"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {aba === 'taxas_ruas' && (
        <div className="space-y-6">
          {/* Card de Cadastro de Nova Rua */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                Cadastrar Taxa de Entrega por Rua ou Bairro
              </h2>
              <p className="text-xs text-slate-500">
                Defina o valor exato da taxa de entrega de acordo com a rua do cliente. O cliente poderá selecionar ou digitar a rua e a taxa será cobrada automaticamente no pedido de delivery.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!nomeRua.trim()) return;
                setSalvandoRua(true);
                try {
                  const valor = parseFloat(taxaRua.replace(',', '.')) || 0;
                  const tempo = parseInt(tempoEstimado, 10) || 30;
                  await criarRegiaoEntrega({
                    nome: nomeRua.trim(),
                    taxa: valor,
                    tempoEstimadoMin: tempo,
                    ativo: true,
                  });
                  setNomeRua('');
                  setTaxaRua('8.00');
                  setTempoEstimado('35');
                } finally {
                  setSalvandoRua(false);
                }
              }}
              className="grid sm:grid-cols-12 gap-3 items-end"
            >
              <div className="sm:col-span-5 space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Nome da Rua / Avenida / Bairro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rua das Palmeiras, Centro, Av. Brasil..."
                  value={nomeRua}
                  onChange={(e) => setNomeRua(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Valor da Taxa (R$) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  placeholder="8.00"
                  value={taxaRua}
                  onChange={(e) => setTaxaRua(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Tempo Estimado (min)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  placeholder="35"
                  value={tempoEstimado}
                  onChange={(e) => setTempoEstimado(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={salvandoRua || !nomeRua.trim()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {salvandoRua ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Ruas e Taxas Cadastradas */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ruas e Regiões Cadastradas ({regioes.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Taxas ativas serão sugeridas ao cliente durante o pedido de delivery
                </p>
              </div>

              <input
                type="text"
                placeholder="Filtrar por nome da rua..."
                value={buscaRua}
                onChange={(e) => setBuscaRua(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg max-w-xs focus:outline-hidden focus:border-amber-600"
              />
            </div>

            {regioes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                <p>Nenhuma rua cadastrada ainda. Adicione ruas acima para configurar as taxas de entrega.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Rua / Bairro / Região</th>
                      <th className="py-3 px-4">Valor da Taxa</th>
                      <th className="py-3 px-4">Tempo de Entrega</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {regioes
                      .filter((r) =>
                        !buscaRua.trim() ||
                        r.nome.toLowerCase().includes(buscaRua.toLowerCase())
                      )
                      .map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {reg.nome}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-700 text-sm">
                            {formatCurrency(reg.taxa)}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            ~{reg.tempoEstimadoMin || 35} minutos
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                atualizarRegiaoEntrega(reg.id, { ativo: !reg.ativo })
                              }
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                                reg.ativo
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {reg.ativo ? 'Ativa no Delivery' : 'Inativa'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Deseja realmente excluir a taxa da rua "${reg.nome}"?`
                                  )
                                ) {
                                  excluirRegiaoEntrega(reg.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir taxa desta rua"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {aba === 'auditoria' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Registro de Operações Críticas (Auditoria de Segurança)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-4">Detalhes</th>
                  <th className="py-3 px-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {[...logsAuditoria]
                  .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
                  .slice(0, 50)
                  .map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.criadoEm)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {log.acao}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {log.detalhes}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {log.usuarioNome}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
