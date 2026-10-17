import React from 'react';
import {
  Share2,
  Flame,
  UtensilsCrossed,
  Beef,
  Crown,
  Zap,
  Soup,
  ChefHat,
  Sparkles,
  ShoppingBag,
  Database,
} from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface TopBarProps {
  nomeRestaurante: string;
  corPrimaria?: string;
  iconeTema?: string;
  logoUrl?: string;
  corHeader?: string;
  corHeaderTexto?: string;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenBancoModal: () => void;
  onOpenLinkClienteModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  nomeRestaurante,
  corPrimaria = '#ea580c',
  iconeTema = 'flame',
  logoUrl,
  corHeader,
  corHeaderTexto,
  activeTab,
  onSelectTab,
  onOpenBancoModal,
  onOpenLinkClienteModal,
}) => {
  const renderIcone = () => {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={nomeRestaurante}
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }
    const props = { className: 'w-4 h-4 text-white' };
    switch (iconeTema) {
      case 'beef':
        return <Beef {...props} />;
      case 'utensils':
        return <UtensilsCrossed {...props} />;
      case 'crown':
        return <Crown {...props} />;
      case 'zap':
        return <Zap {...props} />;
      case 'soup':
        return <Soup {...props} />;
      case 'chef-hat':
        return <ChefHat {...props} />;
      case 'sparkles':
        return <Sparkles {...props} />;
      default:
        return <Flame {...props} />;
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-6 px-5 lg:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-colors"
      style={{
        backgroundColor: corHeader || undefined,
        color: corHeaderTexto || undefined,
      }}
    >
      {/* Zone 1: Restaurant icon and brand name */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-xs shrink-0 transition-transform hover:scale-105"
          style={{ backgroundColor: corPrimaria }}
        >
          {renderIcone()}
        </div>
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('dashboard');
          }}
          className="text-base font-bold tracking-tight text-slate-900 font-display whitespace-nowrap truncate max-w-[240px] hover:text-amber-700 transition-colors"
        >
          {nomeRestaurante || 'RESTAURANTE KERO'}
        </a>
      </div>

      {/* Zone 2: 5 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`py-1 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard'
              ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600 font-bold'
              : ''
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => onSelectTab('marmitas')}
          className={`py-1 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'marmitas'
              ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600 font-bold'
              : ''
          }`}
        >
          Marmitas
        </button>
        <button
          onClick={() => onSelectTab('delivery_painel')}
          className={`py-1 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'delivery_painel'
              ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600 font-bold'
              : ''
          }`}
        >
          Kanban Delivery
        </button>
        <button
          onClick={() => onSelectTab('mesas')}
          className={`py-1 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'mesas'
              ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600 font-bold'
              : ''
          }`}
        >
          Mapa de Mesas
        </button>
        <button
          onClick={() => onSelectTab('cozinha')}
          className={`py-1 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'cozinha'
              ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600 font-bold'
              : ''
          }`}
        >
          Cozinha KDS
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenLinkClienteModal && (
          <button
            type="button"
            onClick={onOpenLinkClienteModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            title="Copiar e compartilhar link de pedidos com clientes via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Link do Cliente</span>
          </button>
        )}
        <button
          onClick={onOpenBancoModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title="Inicializar e verificar banco Cloud Firestore"
        >
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Banco Real</span>
        </button>
        <button
          onClick={() => onSelectTab('delivery_cliente')}
          style={{ backgroundColor: corPrimaria }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-95 shadow-xs transition-transform active:scale-95 whitespace-nowrap shrink-0"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>App Delivery</span>
        </button>
      </div>
    </header>
  );
};
