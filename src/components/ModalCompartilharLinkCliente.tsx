import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  Smartphone,
  UtensilsCrossed,
  MessageCircle,
  Download,
  Printer,
  Sparkles,
} from 'lucide-react';

interface ModalCompartilharLinkClienteProps {
  aberto: boolean;
  onClose: () => void;
  nomeRestaurante: string;
  onVerComoCliente?: () => void;
  onVerComoVitrine?: () => void;
}

export const ModalCompartilharLinkCliente: React.FC<
  ModalCompartilharLinkClienteProps
> = ({
  aberto,
  onClose,
  nomeRestaurante,
  onVerComoVitrine,
}) => {
  const [copiado, setCopiado] = useState(false);
  const [mostrarQr, setMostrarQr] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Link único oficial do Cardápio Digital para clientes
  const urlAtual = typeof window !== 'undefined' ? window.location : null;
  const baseUrl = urlAtual
    ? `${urlAtual.origin}${urlAtual.pathname}`
    : 'https://seurestaurante.com.br';
  
  const linkCardapioDigital = `${baseUrl}?portal=cardapio`;

  // Gerar QR Code via biblioteca qrcode offline
  useEffect(() => {
    if (!aberto) return;
    QRCode.toDataURL(linkCardapioDigital, {
      width: 450,
      margin: 2,
      color: {
        dark: '#0f172b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('Erro ao gerar QRCode:', err));
  }, [linkCardapioDigital, aberto]);

  if (!aberto) return null;

  const mensagemWhatsApp = `🍽️ *${nomeRestaurante}* — Cardápio Digital Oficial!\n\nConfira nosso cardápio completo com pratos do dia, marmitas executivas e faça seu pedido online direto pelo celular:\n👉 ${linkCardapioDigital}\n\nAguardamos seu pedido!`;

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkCardapioDigital);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const handleCompartilharWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      mensagemWhatsApp
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleImprimirQrCode = () => {
    const janelaImpressao = window.open('', '_blank');
    if (!janelaImpressao) return;

    janelaImpressao.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Cardápio - ${nomeRestaurante}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
              text-align: center;
              margin: 0;
              padding: 20px;
              color: #0f172b;
            }
            .card {
              max-width: 380px;
              margin: 0 auto;
              border: 3px solid #fea116;
              border-radius: 24px;
              padding: 24px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            h1 {
              font-size: 22px;
              margin: 0 0 6px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .sub {
              font-size: 13px;
              color: #475569;
              margin-bottom: 20px;
            }
            .qr-box {
              background: #fff;
              display: inline-block;
              padding: 12px;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
            }
            img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .cta {
              font-size: 14px;
              font-weight: bold;
              margin-top: 18px;
              color: #0f172b;
            }
            .link-text {
              font-size: 11px;
              color: #64748b;
              word-break: break-all;
              margin-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${nomeRestaurante}</h1>
            <div class="sub">Cardápio Digital & Pedidos Online</div>
            <div class="qr-box">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
            </div>
            <div class="cta">Aponte a câmera do seu celular para abrir o cardápio!</div>
            <div class="link-text">${linkCardapioDigital}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full text-white shadow-2xl overflow-hidden flex flex-col animate-modal">
        {/* Topo do Modal */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Link & QR Code do Cardápio Digital
              </h2>
              <p className="text-xs text-slate-400">
                O cliente escaneia ou clica, vê o cardápio com os produtos e já pede online!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Caixa de Explicação */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-3.5 flex gap-3 text-xs text-amber-200/90 leading-relaxed">
            <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-0.5">
                Cardápio Digital Oficial para Mesas & Clientes
              </p>
              Link unificado com os produtos, fotos, valores de marmitas e carnes do dia.
              Ao acessar, o cliente visualiza todo o cardápio e conta com botão direto para montar e enviar o pedido!
            </div>
          </div>

          {/* Campo com Link Copiável */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Link do Cardápio Digital:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={linkCardapioDigital}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-hidden selection:bg-amber-500/30"
              />
              <button
                type="button"
                onClick={handleCopiarLink}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                  copiado
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                }`}
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCompartilharWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarQr(!mostrarQr)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>{mostrarQr ? 'Ocultar QR Code' : 'Ver QR Code'}</span>
            </button>
          </div>

          {/* Seção QR Code Alta Resolução */}
          {mostrarQr && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-3">
              <div className="text-xs text-slate-300 font-bold flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>QR Code do Cardápio para Mesas, Balcão e Encartes</span>
              </div>

              <div className="inline-block p-3 bg-white rounded-2xl shadow-xl">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code Cardápio"
                    className="w-44 h-44 mx-auto"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-500 text-xs">
                    Gerando QR Code...
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Aponte a câmera do celular para abrir instantaneamente o cardápio e fazer pedidos.
              </p>

              {/* Botões de Download e Impressão do QR Code */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {qrCodeDataUrl && (
                  <a
                    href={qrCodeDataUrl}
                    download={`qrcode-cardapio-${nomeRestaurante.toLowerCase().replace(/\s+/g, '-')}.png`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Baixar Imagem</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleImprimirQrCode}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Display para Mesa</span>
                </button>
              </div>
            </div>
          )}

          {/* Testar / Abrir no seu navegador */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-slate-400">
              Testar no seu navegador:
            </span>
            <div className="flex flex-wrap gap-2">
              <a
                href={linkCardapioDigital}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
              >
                <span>Abrir em Nova Aba</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {onVerComoVitrine && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onVerComoVitrine();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors shadow-xs"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Abrir Cardápio na Tela</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
