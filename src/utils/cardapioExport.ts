/**
 * Utilitários para extrair e exportar produtos e cardápios salvos
 */
import { Produto } from '../types';

/**
 * Dispara o download de um arquivo gerado no navegador
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 1. Exporta os produtos como arquivo JSON estruturado
 */
export function exportarCardapioJSON(produtos: Produto[], nomeRestaurante: string = 'restaurante'): void {
  const data = {
    restaurante: nomeRestaurante,
    exportadoEm: new Date().toISOString(),
    totalProdutos: produtos.length,
    produtos: produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      preco: p.preco,
      descricao: p.descricao,
      disponivel: p.disponivel,
      ativo: p.ativo,
      estoque: p.estoque,
      diasSemana: p.diasSemana,
      ehEspecial: p.ehEspecial,
      exigeSegundaCarne: p.exigeSegundaCarne,
      tamanhosPermitidos: p.tamanhosPermitidos,
      canalVenda: p.canalVenda,
      imagemUrl: p.imagemUrl,
    })),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const dataHoje = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `cardapio-${nomeRestaurante.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${dataHoje}.json`);
}

/**
 * 2. Exporta os produtos como CSV compatível com Excel e Google Planilhas
 */
export function exportarCardapioCSV(produtos: Produto[], nomeRestaurante: string = 'restaurante'): void {
  const cabecalhos = [
    'Nome',
    'Categoria',
    'Preco',
    'Descricao',
    'Estoque',
    'Disponivel',
    'CanalVenda',
    'DiasSemana',
    'TamanhosPermitidos',
  ];

  const escapeCSV = (val: unknown): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const linhas = produtos.map((p) => [
    escapeCSV(p.nome),
    escapeCSV(p.categoria),
    escapeCSV(p.preco.toFixed(2)),
    escapeCSV(p.descricao || ''),
    escapeCSV(p.estoque !== undefined ? p.estoque : ''),
    escapeCSV(p.disponivel ? 'Sim' : 'Não'),
    escapeCSV(p.canalVenda || 'ambos'),
    escapeCSV(p.diasSemana ? p.diasSemana.join(',') : ''),
    escapeCSV(p.tamanhosPermitidos ? p.tamanhosPermitidos.join(',') : ''),
  ]);

  // UTF-8 BOM (\uFEFF) para garantir acentuação correta no Excel
  const csvContent = '\uFEFF' + [cabecalhos.join(';'), ...linhas.map((l) => l.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dataHoje = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `cardapio-${nomeRestaurante.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${dataHoje}.csv`);
}

/**
 * 3. Gera texto formatado para envio no WhatsApp ou impressão rápida
 */
export function gerarTextoCardapioFormatado(produtos: Produto[], nomeRestaurante: string = 'Restaurante'): string {
  const produtosPorCategoria: Record<string, Produto[]> = {};
  produtos.forEach((p) => {
    if (!p.ativo) return;
    const cat = p.categoria || 'Outros';
    if (!produtosPorCategoria[cat]) produtosPorCategoria[cat] = [];
    produtosPorCategoria[cat].push(p);
  });

  let texto = `*CARDÁPIO OFICIAL — ${nomeRestaurante.toUpperCase()}*\n`;
  texto += `🕒 Atualizado em: ${new Date().toLocaleDateString('pt-BR')}\n`;
  texto += `-------------------------------------------\n\n`;

  const ordemCategorias = [
    'Carnes',
    'Carnes Especiais',
    'Acompanhamentos',
    'Marmitas',
    'Porções',
    'Bebidas',
    'Doces e Sobremesas',
    'Saladas Avulsas',
    'Buffet',
  ];

  const todasCategorias = Array.from(new Set([...ordemCategorias, ...Object.keys(produtosPorCategoria)]));

  todasCategorias.forEach((cat) => {
    const itens = produtosPorCategoria[cat];
    if (!itens || itens.length === 0) return;

    texto += `*🍱 ${cat.toUpperCase()}*\n`;
    itens.forEach((item) => {
      const precoTxt = item.preco === 0 ? 'Incluso' : `R$ ${item.preco.toFixed(2)}`;
      texto += `• *${item.nome}* — ${precoTxt}\n`;
      if (item.descricao && item.descricao.trim()) {
        texto += `   _${item.descricao.trim()}_\n`;
      }
    });
    texto += `\n`;
  });

  texto += `-------------------------------------------\n`;
  texto += `🛵 Faça seu pedido pelo nosso Delivery Online!\n`;

  return texto;
}

/**
 * Dispara o download do texto formatado
 */
export function exportarCardapioTexto(produtos: Produto[], nomeRestaurante: string = 'restaurante'): void {
  const texto = gerarTextoCardapioFormatado(produtos, nomeRestaurante);
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const dataHoje = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `cardapio-${nomeRestaurante.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${dataHoje}.txt`);
}
