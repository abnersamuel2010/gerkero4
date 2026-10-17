/**
 * Parser inteligente de arquivos e textos de cardápio de restaurante
 * Entende JSON, CSV, TXT e cardápios transcritos ou colados.
 */
import { CategoriaNome, MarmitaTamanhoNome } from '../types';

export interface ItemCardapioExtraido {
  idTemp: string;
  nome: string;
  categoria: CategoriaNome;
  preco: number;
  descricao: string;
  estoque?: number;
  ehEspecial: boolean;
  tamanhosPermitidos: MarmitaTamanhoNome[];
  diasSemana: string[];
  canalVenda: 'ambos' | 'balcao' | 'delivery';
  selecionado: boolean;
  existeNoBanco?: boolean;
}

const CATEGORIAS_VALIDAS: CategoriaNome[] = [
  'Carnes',
  'Carnes Especiais',
  'Acompanhamentos',
  'Marmitas',
  'Bebidas',
  'Porções',
  'Doces e Sobremesas',
  'Saladas Avulsas',
  'Buffet',
  'Adicionais',
  'Outros',
];

/**
 * Normaliza e identifica a categoria mais adequada a partir de palavras-chave
 */
export function inferirCategoria(texto: string, contextoSecao?: string): CategoriaNome {
  const t = texto.toLowerCase();
  const sec = (contextoSecao || '').toLowerCase();

  // Verifica seção primeiro
  if (sec.includes('bebida') || sec.includes('refrigerante') || sec.includes('suco') || sec.includes('cerveja')) {
    return 'Bebidas';
  }
  if (sec.includes('sobremesa') || sec.includes('doce') || sec.includes('torta')) {
    return 'Doces e Sobremesas';
  }
  if (sec.includes('especial') || sec.includes('nobre') || sec.includes('premium')) {
    return 'Carnes Especiais';
  }
  if (sec.includes('carne') || sec.includes('churrasco') || sec.includes('assado') || sec.includes('grelhado')) {
    return 'Carnes';
  }
  if (sec.includes('acomp') || sec.includes('guarni') || sec.includes('arroz') || sec.includes('feijao') || sec.includes('feijão')) {
    return 'Acompanhamentos';
  }
  if (sec.includes('salada')) {
    return 'Saladas Avulsas';
  }
  if (sec.includes('porç') || sec.includes('porc') || sec.includes('petisco')) {
    return 'Porções';
  }
  if (sec.includes('marmita') || sec.includes('combo') || sec.includes('prato feito') || sec.includes('pf')) {
    return 'Marmitas';
  }

  // Verifica palavras-chave no item
  if (
    t.includes('coca') ||
    t.includes('guaraná') ||
    t.includes('guarana') ||
    t.includes('fanta') ||
    t.includes('sprite') ||
    t.includes('suco') ||
    t.includes('cerveja') ||
    t.includes('heineken') ||
    t.includes('amstel') ||
    t.includes('brahma') ||
    t.includes('skol') ||
    t.includes('água') ||
    t.includes('agua') ||
    t.includes('refrigerante') ||
    t.includes('lata') ||
    t.includes('2l') ||
    t.includes('600ml') ||
    t.includes('long neck')
  ) {
    return 'Bebidas';
  }

  if (
    t.includes('pudim') ||
    t.includes('mousse') ||
    t.includes('torta') ||
    t.includes('bolo') ||
    t.includes('doce de leite') ||
    t.includes('sobremesa') ||
    t.includes('brigadeiro') ||
    t.includes('pavê') ||
    t.includes('sorvete')
  ) {
    return 'Doces e Sobremesas';
  }

  if (
    t.includes('batata frita') ||
    t.includes('mandioca frita') ||
    t.includes('polenta') ||
    t.includes('calabresa acebolada') ||
    t.includes('isca de') ||
    t.includes('frango a passarinho') ||
    t.includes('torresmo') ||
    t.includes('porção') ||
    t.includes('porcao')
  ) {
    return 'Porções';
  }

  if (
    t.includes('picanha') ||
    t.includes('costela') ||
    t.includes('cupim') ||
    t.includes('alcatra') ||
    t.includes('maminha') ||
    t.includes('fraldinha') ||
    t.includes('linguiça') ||
    t.includes('linguica') ||
    t.includes('frango assado') ||
    t.includes('filé de frango') ||
    t.includes('sobrecoxa') ||
    t.includes('bife') ||
    t.includes('pernil') ||
    t.includes('lombo') ||
    t.includes('churrasco') ||
    t.includes('carne')
  ) {
    if (t.includes('especial') || t.includes('picanha') || t.includes('cupim')) {
      return 'Carnes Especiais';
    }
    return 'Carnes';
  }

  if (
    t.includes('arroz') ||
    t.includes('feijão') ||
    t.includes('feijao') ||
    t.includes('tropeiro') ||
    t.includes('farofa') ||
    t.includes('mandioca cozida') ||
    t.includes('purê') ||
    t.includes('pure') ||
    t.includes('vinagrete') ||
    t.includes('maionese') ||
    t.includes('salpicão') ||
    t.includes('salpicao') ||
    t.includes('macarrão') ||
    t.includes('legumes')
  ) {
    return 'Acompanhamentos';
  }

  return 'Outros';
}

/**
 * Extrai preço de uma string de texto (ex: "R$ 35,00", "35.50", "Incluso")
 */
function extrairPreco(texto: string, categoria: CategoriaNome): { preco: number; textoLimpo: string } {
  // Se for acompanhamento e não tiver preço explícito, padrão é 0 (incluso na marmita)
  const isAcomp = categoria === 'Acompanhamentos';

  // 1. Procura "incluso" ou "grátis"
  if (/incluso|gratis|grátis|0,00|0.00/i.test(texto)) {
    const textoLimpo = texto.replace(/incluso|gratis|grátis|0,00|0.00/gi, '').trim();
    return { preco: 0, textoLimpo };
  }

  // 2. Procura formato R$ XX,XX ou R$ XX.XX ou R$XX
  const regexRS = /R\$\s*([0-9]+[.,][0-9]{2}|[0-9]+)/i;
  const matchRS = texto.match(regexRS);
  if (matchRS) {
    const preco = parseFloat(matchRS[1].replace(',', '.'));
    const textoLimpo = texto.replace(matchRS[0], '').trim();
    return { preco: isNaN(preco) ? 0 : preco, textoLimpo };
  }

  // 3. Procura valor numérico no final da linha (ex: "- 35,00" ou "35.00")
  const regexFinal = /[-–—:]\s*([0-9]+[.,][0-9]{2})\s*$/;
  const matchFinal = texto.match(regexFinal);
  if (matchFinal) {
    const preco = parseFloat(matchFinal[1].replace(',', '.'));
    const textoLimpo = texto.replace(regexFinal, '').trim();
    return { preco: isNaN(preco) ? 0 : preco, textoLimpo };
  }

  // 4. Procura qualquer padrão de moeda solto no final
  const regexSolto = /([0-9]+[.,][0-9]{2})\s*$/;
  const matchSolto = texto.match(regexSolto);
  if (matchSolto) {
    const preco = parseFloat(matchSolto[1].replace(',', '.'));
    const textoLimpo = texto.replace(regexSolto, '').trim();
    return { preco: isNaN(preco) ? 0 : preco, textoLimpo };
  }

  return { preco: isAcomp ? 0 : 0, textoLimpo: texto };
}

/**
 * 1. Parser Principal: Processa Texto de Cardápio (Copiado de WhatsApp, Flyer ou Arquivo .txt)
 */
export function parseTextoCardapio(conteudo: string): ItemCardapioExtraido[] {
  const linhas = conteudo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const resultado: ItemCardapioExtraido[] = [];
  let secaoAtual: string = '';

  linhas.forEach((linha, idx) => {
    // Ignora linhas puramente decorativas (ex: "====", "-------", "***")
    if (/^[=*\-_~#]{3,}$/.test(linha)) return;

    // Detecta cabeçalhos de seção (ex: "[CARNES]", "*CARNES NA BRASA*", "CARNES:", "== BEBIDAS ==")
    const ehCabecalhoSecao =
      /^[\[{<*(#=~-]*\s*(carnes|churrasco|assados|acompanhamentos|guarnições|guarnicoes|bebidas|refrigerantes|sucos|sobremesas|doces|marmitas|porções|porcoes|saladas|buffet)\b/i.test(
        linha
      ) ||
      (linha.endsWith(':') && linha.length < 35);

    if (ehCabecalhoSecao) {
      secaoAtual = linha.replace(/^[\[{<*#=~_\-:]+|[\]}>*#=~_\-:]+$/g, '').trim();
      return;
    }

    // Limpa marcadores de lista no início (ex: "-", "*", "•", "1.", "1)")
    let linhaLimpa = linha.replace(/^([0-9]+[.)\-]|[-*•·▪>])\s*/, '').trim();
    if (!linhaLimpa) return;

    // Infere categoria baseada no nome e na seção
    const categoria = inferirCategoria(linhaLimpa, secaoAtual);

    // Extrai preço
    const { preco, textoLimpo } = extrairPreco(linhaLimpa, categoria);

    // Separa nome e descrição (ex: "Picanha na Brasa - Acompanha farofa e vinagrete")
    let nome = textoLimpo.replace(/[-–—]\s*$/, '').trim();
    let descricao = '';

    if (nome.includes(' - ')) {
      const partes = nome.split(' - ');
      nome = partes[0].trim();
      descricao = partes.slice(1).join(' - ').trim();
    } else if (nome.includes(' – ')) {
      const partes = nome.split(' – ');
      nome = partes[0].trim();
      descricao = partes.slice(1).join(' – ').trim();
    } else if (/\((.*?)\)/.test(nome)) {
      const matchParenteses = nome.match(/\((.*?)\)/);
      if (matchParenteses) {
        descricao = matchParenteses[1].trim();
        nome = nome.replace(/\(.*?\)/, '').trim();
      }
    }

    // Se o nome ficou vazio, ignora
    if (!nome || nome.length < 2) return;

    // Detecta se é especial
    const ehEspecial =
      categoria === 'Carnes Especiais' ||
      /especial|nobre|picanha|cupim|costela|salmão|bacalhau/i.test(nome);

    const tamanhosPermitidos: MarmitaTamanhoNome[] =
      categoria === 'Carnes' || categoria === 'Carnes Especiais' || categoria === 'Acompanhamentos'
        ? ehEspecial
          ? ['Média', 'Grande']
          : ['Pequena', 'Média', 'Grande']
        : [];

    resultado.push({
      idTemp: `import_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      nome,
      categoria,
      preco,
      descricao: descricao || (categoria === 'Acompanhamentos' ? 'Acompanhamento fresquinho' : 'Preparado na hora'),
      ehEspecial,
      tamanhosPermitidos,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      canalVenda: 'ambos',
      selecionado: true,
    });
  });

  return resultado;
}

/**
 * 2. Parser para arquivos CSV
 */
export function parseCSVCardapio(conteudo: string): ItemCardapioExtraido[] {
  const linhas = conteudo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (linhas.length === 0) return [];

  // Detecta delimitador (, ou ; ou tab)
  const primeiraLinha = linhas[0];
  const delimitador = primeiraLinha.includes(';') ? ';' : primeiraLinha.includes('\t') ? '\t' : ',';

  const cabecalhos = primeiraLinha.split(delimitador).map((c) => c.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const idxNome = cabecalhos.findIndex((c) => c.includes('nome') || c.includes('produto') || c.includes('item'));
  const idxCat = cabecalhos.findIndex((c) => c.includes('cat') || c.includes('categoria') || c.includes('tipo'));
  const idxPreco = cabecalhos.findIndex((c) => c.includes('preco') || c.includes('preço') || c.includes('valor'));
  const idxDesc = cabecalhos.findIndex((c) => c.includes('desc') || c.includes('detalhe') || c.includes('ingrediente'));
  const idxEstoque = cabecalhos.findIndex((c) => c.includes('estoque') || c.includes('qtd') || c.includes('quantidade'));

  // Se não encontrar cabeçalhos claros, tenta como texto livre
  if (idxNome === -1 && idxPreco === -1) {
    return parseTextoCardapio(conteudo);
  }

  const resultado: ItemCardapioExtraido[] = [];

  for (let i = 1; i < linhas.length; i++) {
    const colunas = linhas[i].split(delimitador).map((c) => c.replace(/^["']|["']$/g, '').trim());
    if (colunas.length === 0 || !colunas[0]) continue;

    const nome = colunas[idxNome >= 0 ? idxNome : 0] || '';
    if (!nome) continue;

    const catBruta = idxCat >= 0 ? colunas[idxCat] : '';
    let categoria: CategoriaNome = inferirCategoria(nome, catBruta);
    const catEncontrada = CATEGORIAS_VALIDAS.find((c) => c.toLowerCase() === catBruta.toLowerCase());
    if (catEncontrada) categoria = catEncontrada;

    const precoStr = idxPreco >= 0 ? colunas[idxPreco] : '0';
    const preco = parseFloat(precoStr.replace('R$', '').replace(',', '.').trim()) || 0;

    const descricao = idxDesc >= 0 ? colunas[idxDesc] || '' : '';
    const estoqueStr = idxEstoque >= 0 ? colunas[idxEstoque] : '';
    const estoque = estoqueStr ? parseInt(estoqueStr, 10) : undefined;

    const ehEspecial = categoria === 'Carnes Especiais' || /especial/i.test(nome);
    const tamanhosPermitidos: MarmitaTamanhoNome[] =
      categoria === 'Carnes' || categoria === 'Carnes Especiais' || categoria === 'Acompanhamentos'
        ? ehEspecial
          ? ['Média', 'Grande']
          : ['Pequena', 'Média', 'Grande']
        : [];

    resultado.push({
      idTemp: `import_csv_${Date.now()}_${i}`,
      nome,
      categoria,
      preco: Math.max(0, preco),
      descricao: descricao || 'Item cadastrado via importação',
      estoque: isNaN(estoque as number) ? undefined : estoque,
      ehEspecial,
      tamanhosPermitidos,
      diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
      canalVenda: 'ambos',
      selecionado: true,
    });
  }

  return resultado;
}

/**
 * 3. Parser para arquivos JSON
 */
export function parseJSONCardapio(conteudo: string): ItemCardapioExtraido[] {
  try {
    const parsed = JSON.parse(conteudo);
    const lista = Array.isArray(parsed) ? parsed : Array.isArray(parsed.produtos) ? parsed.produtos : [];

    return lista.map((p: any, idx: number) => {
      const nome = String(p.nome || p.name || 'Produto Sem Nome').trim();
      let categoria: CategoriaNome = inferirCategoria(nome, p.categoria || p.category);
      const catEncontrada = CATEGORIAS_VALIDAS.find(
        (c) => c.toLowerCase() === String(p.categoria || '').toLowerCase()
      );
      if (catEncontrada) categoria = catEncontrada;

      const preco = Math.max(0, Number(p.preco || p.price || 0));
      const ehEspecial = Boolean(p.ehEspecial || categoria === 'Carnes Especiais');

      const tamanhosPermitidos: MarmitaTamanhoNome[] =
        categoria === 'Carnes' || categoria === 'Carnes Especiais' || categoria === 'Acompanhamentos'
          ? Array.isArray(p.tamanhosPermitidos) && p.tamanhosPermitidos.length > 0
            ? p.tamanhosPermitidos
            : ehEspecial
            ? ['Média', 'Grande']
            : ['Pequena', 'Média', 'Grande']
          : [];

      return {
        idTemp: `import_json_${Date.now()}_${idx}`,
        nome,
        categoria,
        preco,
        descricao: String(p.descricao || p.description || 'Item importado').trim(),
        estoque: p.estoque !== undefined ? Number(p.estoque) : undefined,
        ehEspecial,
        tamanhosPermitidos,
        diasSemana: Array.isArray(p.diasSemana) ? p.diasSemana : ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
        canalVenda: p.canalVenda || 'ambos',
        selecionado: true,
      };
    });
  } catch (err) {
    console.warn('Falha no parse de JSON estruturado, tentando como texto livre:', err);
    return parseTextoCardapio(conteudo);
  }
}

/**
 * Roteador de importação que detecta o formato do arquivo ou conteúdo
 */
export function extrairProdutosDeArquivoOuTexto(conteudo: string, nomeArquivo?: string): ItemCardapioExtraido[] {
  const trimConteudo = conteudo.trim();
  const ext = (nomeArquivo || '').toLowerCase();

  if (ext.endsWith('.json') || (trimConteudo.startsWith('{') && trimConteudo.endsWith('}')) || (trimConteudo.startsWith('[') && trimConteudo.endsWith(']'))) {
    return parseJSONCardapio(trimConteudo);
  }

  if (ext.endsWith('.csv') || trimConteudo.includes(';') || (trimConteudo.split('\n')[0].includes(',') && trimConteudo.split('\n')[0].includes('preco'))) {
    return parseCSVCardapio(trimConteudo);
  }

  return parseTextoCardapio(trimConteudo);
}
