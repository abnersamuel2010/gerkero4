import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  FileJson,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Sparkles,
  Package,
  Layers,
  Edit2,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';
import { Produto, CategoriaNome, MarmitaTamanhoNome } from '../types';
import {
  ItemCardapioExtraido,
  extrairProdutosDeArquivoOuTexto,
  parseTextoCardapio,
} from '../utils/cardapioParser';
import { criarProduto, atualizarProduto } from '../services/produtosService';
import { formatCurrency } from '../utils/formatters';

interface ModalImportarCardapioProps {
  aberto: boolean;
  onFechar: () => void;
  produtosAtuais: Produto[];
  onSucesso: () => void;
}

const CATEGORIAS_OPCOES: CategoriaNome[] = [
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

const EXEMPLO_CARDAPIO = `*** CARDÁPIO DO RESTAURANTE & MARMITAS ***

[CARNES SELECIONADAS]
- Alcatra ao Alho - R$ 34,00
- Costela Bovina no Bafo - R$ 32,00 (especial)
- Cupim Recheado com Queijo - R$ 34,00
- Frango com Quiabo - R$ 24,00
- Linguiça Toscana Artesanal - R$ 22,00
- Filé de Frango Grelhado - R$ 22,00

[ACOMPANHAMENTOS]
- Arroz Branco Tradicional
- Feijão Carioca Caseiro
- Feijão Tropeiro Mineiro
- Farofa Crocante de Bacon
- Salada de Maionese de Batata
- Mandioca na Manteiga de Garrafa

[BEBIDAS GELADAS]
- Coca-Cola Lata 350ml - R$ 6,00
- Coca-Cola 2 Litros - R$ 14,00
- Guaraná Antarctica Lata - R$ 6,00
- Suco Natural de Laranja 500ml - R$ 9,00
- Cerveja Heineken Long Neck - R$ 11,00
- Água Mineral sem Gás 500ml - R$ 4,50

[SOBREMESAS]
- Pudim de Leite Condensado Caseiro - R$ 8,00
- Mousse de Maracujá Cremoso - R$ 7,50`;

export const ModalImportarCardapio: React.FC<ModalImportarCardapioProps> = ({
  aberto,
  onFechar,
  produtosAtuais,
  onSucesso,
}) => {
  const [etapa, setEtapa] = useState<'upload' | 'revisao'>('upload');
  const [textoCardapio, setTextoCardapio] = useState('');
  const [nomeArquivoCarregado, setNomeArquivoCarregado] = useState('');
  const [itensExtraidos, setItensExtraidos] = useState<ItemCardapioExtraido[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [salvando, setSalvando] = useState(false);
  const [progressoSalvamento, setProgressoSalvamento] = useState({ atual: 0, total: 0 });
  const [erro, setErro] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');

  if (!aberto) return null;

  // Processa arquivo ou texto
  const handleProcessarTexto = (conteudo: string, nomeArquivo?: string) => {
    try {
      setErro('');
      if (!conteudo.trim()) {
        setErro('Por favor, envie um arquivo ou cole o texto do cardápio.');
        return;
      }

      const extraidos = extrairProdutosDeArquivoOuTexto(conteudo, nomeArquivo);
      if (extraidos.length === 0) {
        setErro('Nenhum produto foi identificado no texto ou arquivo fornecido. Verifique o formato.');
        return;
      }

      // Cruza com os produtos atuais no banco para indicar se já existe
      const nomesExistentes = new Set(
        produtosAtuais.map((p) => p.nome.trim().toLowerCase())
      );

      const marcados = extraidos.map((item) => ({
        ...item,
        existeNoBanco: nomesExistentes.has(item.nome.trim().toLowerCase()),
      }));

      setItensExtraidos(marcados);
      setEtapa('revisao');
    } catch (err: any) {
      console.error('Erro ao processar cardápio:', err);
      setErro(err?.message || 'Falha ao interpretar o arquivo.');
    }
  };

  const handleUploadArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNomeArquivoCarregado(file.name);
    const reader = new FileReader();

    // Se for texto, CSV ou JSON
    reader.onload = (event) => {
      const conteudo = event.target?.result as string;
      setTextoCardapio(conteudo);
      handleProcessarTexto(conteudo, file.name);
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleCarregarExemplo = () => {
    setTextoCardapio(EXEMPLO_CARDAPIO);
    setNomeArquivoCarregado('exemplo_cardapio_brasa.txt');
    handleProcessarTexto(EXEMPLO_CARDAPIO, 'exemplo.txt');
  };

  const handleAlternarSelecionado = (idTemp: string) => {
    setItensExtraidos((prev) =>
      prev.map((item) =>
        item.idTemp === idTemp ? { ...item, selecionado: !item.selecionado } : item
      )
    );
  };

  const handleSelecionarTodos = (selecionar: boolean) => {
    setItensExtraidos((prev) =>
      prev.map((item) => ({ ...item, selecionado: selecionar }))
    );
  };

  const handleAtualizarItem = (
    idTemp: string,
    campo: keyof ItemCardapioExtraido,
    valor: any
  ) => {
    setItensExtraidos((prev) =>
      prev.map((item) => {
        if (item.idTemp !== idTemp) return item;
        const atualizado = { ...item, [campo]: valor };
        // Se mudou de categoria e não for carne/acompanhamento, limpa tamanhosPermitidos
        if (campo === 'categoria') {
          const cat = valor as CategoriaNome;
          if (cat !== 'Carnes' && cat !== 'Carnes Especiais' && cat !== 'Acompanhamentos') {
            atualizado.tamanhosPermitidos = [];
          } else if (atualizado.tamanhosPermitidos.length === 0) {
            atualizado.tamanhosPermitidos = ['Pequena', 'Média', 'Grande'];
          }
        }
        return atualizado;
      })
    );
  };

  const handleRemoverItem = (idTemp: string) => {
    setItensExtraidos((prev) => prev.filter((item) => item.idTemp !== idTemp));
  };

  // Salvar itens selecionados no Firebase Firestore
  const handleSalvarNoCardapio = async () => {
    const selecionados = itensExtraidos.filter((i) => i.selecionado);
    if (selecionados.length === 0) {
      setErro('Selecione pelo menos um produto para salvar.');
      return;
    }

    setSalvando(true);
    setErro('');
    setProgressoSalvamento({ atual: 0, total: selecionados.length });

    try {
      let salvos = 0;
      for (const item of selecionados) {
        // Verifica se já existe um produto com exatamente este nome no banco
        const existente = produtosAtuais.find(
          (p) => p.nome.trim().toLowerCase() === item.nome.trim().toLowerCase()
        );

        const dadosProduto = {
          nome: item.nome.trim(),
          categoria: item.categoria,
          descricao: item.descricao || 'Item do cardápio',
          preco: item.preco,
          disponivel: true,
          ativo: true,
          estoque: item.estoque,
          diasSemana: item.diasSemana,
          ehEspecial: item.ehEspecial,
          tamanhosPermitidos:
            item.categoria === 'Carnes' ||
            item.categoria === 'Carnes Especiais' ||
            item.categoria === 'Acompanhamentos'
              ? item.tamanhosPermitidos
              : undefined,
          canalVenda: item.canalVenda,
        };

        if (existente) {
          await atualizarProduto(existente.id, dadosProduto);
        } else {
          await criarProduto(dadosProduto);
        }

        salvos++;
        setProgressoSalvamento({ atual: salvos, total: selecionados.length });
      }

      setSucessoMsg(
        `Sucesso! ${salvos} produtos foram importados e salvos no cardápio.`
      );
      setTimeout(() => {
        onSucesso();
        onFechar();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao salvar produtos importados:', err);
      setErro(err?.message || 'Erro ao persistir produtos no banco de dados.');
    } finally {
      setSalvando(false);
    }
  };

  const itensFiltrados = itensExtraidos.filter(
    (item) => filtroCategoria === 'Todas' || item.categoria === filtroCategoria
  );

  const totalSelecionados = itensExtraidos.filter((i) => i.selecionado).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header do Modal */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-display">
                  Importar & Entender Cardápio do Restaurante
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase">
                  Reconhecimento Inteligente
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Envie arquivos (JSON, CSV, TXT) ou cole cardápios do WhatsApp para cadastrar produtos automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagens de Sucesso ou Erro */}
        {sucessoMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {erro && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* ETAPA 1: Upload ou Colar Texto */}
        {etapa === 'upload' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Opção A: Upload de Arquivo */}
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 bg-slate-50/70 hover:bg-amber-50/20 transition-all flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Enviar Arquivo com Produtos
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Suporta arquivos <strong>.JSON, .CSV, .TXT</strong>
                  </p>
                </div>

                <label className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all active:scale-95 inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Escolher Arquivo do Computador</span>
                  <input
                    type="file"
                    accept=".json,.csv,.txt,text/plain,application/json"
                    onChange={handleUploadArquivo}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Opção B: Carregar Exemplo Demonstrativo */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Testar com Cardápio Demonstrativo
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Veja como o leitor inteligente reconhece carnes na brasa, acompanhamentos, refrigerantes e sobremesas
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCarregarExemplo}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Carregar Cardápio Exemplo</span>
                </button>
              </div>
            </div>

            {/* Ou Colar Texto Diretamente */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Ou Cole Diretamente o Texto do Cardápio Aqui:
                </label>
                <span className="text-[11px] text-slate-500">
                  Funciona com cardápios do WhatsApp, Facebook, Word ou Instagram
                </span>
              </div>

              <textarea
                rows={9}
                value={textoCardapio}
                onChange={(e) => setTextoCardapio(e.target.value)}
                placeholder="Exemplo:&#10;CARNES:&#10;Alcatra ao Molho - R$ 34,00&#10;Costela no Bafo - R$ 32,00&#10;&#10;ACOMPANHAMENTOS:&#10;Arroz Branco&#10;Feijão Tropeiro&#10;&#10;BEBIDAS:&#10;Coca-Cola Lata - R$ 6,00"
                className="w-full p-4 border border-slate-300 rounded-2xl text-xs font-mono focus:outline-hidden focus:border-amber-600 bg-slate-50 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ETAPA 2: Revisão Interativa & Edição dos Produtos Extraídos */}
        {etapa === 'revisao' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Barra de Resumo e Filtros */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {itensExtraidos.length}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {itensExtraidos.length} Produtos Reconhecidos com Sucesso
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {totalSelecionados} selecionados para gravação · Revise nomes, categorias e preços abaixo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelecionarTodos(true)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={() => handleSelecionarTodos(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  Desmarcar
                </button>
                <button
                  type="button"
                  onClick={() => setEtapa('upload')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  Carregar Outro
                </button>
              </div>
            </div>

            {/* Filtros de Categoria */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-semibold px-1 shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filtrar:
              </span>
              {['Todas', ...CATEGORIAS_OPCOES].map((cat) => {
                const count =
                  cat === 'Todas'
                    ? itensExtraidos.length
                    : itensExtraidos.filter((i) => i.categoria === cat).length;
                if (cat !== 'Todas' && count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setFiltroCategoria(cat)}
                    className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      filtroCategoria === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Tabela de Produtos Extraídos */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-10 text-center">Sel.</th>
                      <th className="p-3">Nome do Produto</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3 w-28">Preço (R$)</th>
                      <th className="p-3">Descrição / Detalhes</th>
                      <th className="p-3 w-16 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {itensFiltrados.map((item) => (
                      <tr
                        key={item.idTemp}
                        className={`hover:bg-slate-50 transition-colors ${
                          !item.selecionado ? 'opacity-40 bg-slate-50/50' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selecionado}
                            onChange={() => handleAlternarSelecionado(item.idTemp)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.nome}
                            onChange={(e) =>
                              handleAtualizarItem(item.idTemp, 'nome', e.target.value)
                            }
                            className="w-full font-bold text-slate-900 border border-transparent hover:border-slate-300 focus:border-amber-600 rounded px-2 py-1 text-xs bg-transparent focus:bg-white"
                          />
                          {item.existeNoBanco && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              Já existe (irá atualizar)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <select
                            value={item.categoria}
                            onChange={(e) =>
                              handleAtualizarItem(
                                item.idTemp,
                                'categoria',
                                e.target.value as CategoriaNome
                              )
                            }
                            className="border border-slate-200 rounded px-2 py-1 text-xs bg-white text-slate-800 font-semibold focus:border-amber-600"
                          >
                            {CATEGORIAS_OPCOES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.preco}
                            onChange={(e) =>
                              handleAtualizarItem(
                                item.idTemp,
                                'preco',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900 focus:border-amber-600 bg-white"
                          />
                        </td>
                        <td className="p-3 text-slate-500">
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) =>
                              handleAtualizarItem(item.idTemp, 'descricao', e.target.value)
                            }
                            className="w-full text-xs text-slate-600 border border-transparent hover:border-slate-300 focus:border-amber-600 rounded px-2 py-1 bg-transparent focus:bg-white truncate"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoverItem(item.idTemp)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remover este item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer com Ações */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {etapa === 'upload' ? (
              <span>Envie arquivos ou clique no botão demonstrativo para começar.</span>
            ) : (
              <span>
                {totalSelecionados} produtos selecionados para gravação definitiva no cardápio.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            {etapa === 'upload' ? (
              <button
                type="button"
                onClick={() => handleProcessarTexto(textoCardapio, nomeArquivoCarregado)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <span>Processar & Revisar Cardápio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSalvarNoCardapio}
                disabled={salvando || totalSelecionados === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {salvando
                  ? `Salvando (${progressoSalvamento.atual}/${progressoSalvamento.total})...`
                  : `Salvar ${totalSelecionados} Produtos no Cardápio`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
