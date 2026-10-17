import React, { useState } from 'react';
import {
  X,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Package,
} from 'lucide-react';
import { Produto } from '../types';
import {
  exportarCardapioJSON,
  exportarCardapioCSV,
  exportarCardapioTexto,
  gerarTextoCardapioFormatado,
} from '../utils/cardapioExport';

interface ModalExportarCardapioProps {
  aberto: boolean;
  onFechar: () => void;
  produtos: Produto[];
  nomeRestaurante?: string;
}

export const ModalExportarCardapio: React.FC<ModalExportarCardapioProps> = ({
  aberto,
  onFechar,
  produtos,
  nomeRestaurante = 'RESTAURANTE KERO',
}) => {
  const [copiado, setCopiado] = useState(false);
  const [abaPreview, setAbaPreview] = useState<'opcoes' | 'texto'>('opcoes');

  if (!aberto) return null;

  const totalAtivos = produtos.filter((p) => p.ativo).length;
  const textoFormatado = gerarTextoCardapioFormatado(produtos, nomeRestaurante);

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(textoFormatado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Download className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display">
                Extrair e Exportar Cardápio Salvo
              </h2>
              <p className="text-xs text-slate-400">
                Baixe seu catálogo de {produtos.length} produtos ({totalAtivos} ativos) em arquivos estruturados
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Opções de Exportação */}
          <div className="grid sm:grid-cols-3 gap-3">
            {/* Opção 1: JSON */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-amber-500 hover:bg-amber-50/30 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileJson className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Arquivo JSON
                </h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Backup completo de dados com IDs, categorias, dias da semana e estoque.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportarCardapioJSON(produtos, nomeRestaurante)}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar .JSON
              </button>
            </div>

            {/* Opção 2: CSV / Excel */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Planilha Excel / CSV
                </h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Compatível com Microsoft Excel e Google Sheets para editar em tabelas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportarCardapioCSV(produtos, nomeRestaurante)}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar .CSV
              </button>
            </div>

            {/* Opção 3: Texto Formatado */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-amber-500 hover:bg-amber-50/30 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cardápio em Texto
                </h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Formatado por categorias com emojis, pronto para WhatsApp e redes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportarCardapioTexto(produtos, nomeRestaurante)}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar .TXT
              </button>
            </div>
          </div>

          {/* Pré-visualização do Cardápio em Texto */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-slate-200">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Pré-visualização do Cardápio Formatado para Envio
              </span>
              <button
                type="button"
                onClick={handleCopiarTexto}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiado ? 'Copiado!' : 'Copiar Texto'}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-300">
              {textoFormatado}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
