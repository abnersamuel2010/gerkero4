import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Columns3,
  ClipboardList,
  Grid,
  Receipt,
  ChefHat,
  Wallet,
  BookOpen,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Flame,
  Beef,
  Crown,
  Zap,
  Soup,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Usuario, UserRole } from '../types';
import { formatRoleName } from '../utils/formatters';

export type NavigationTab =
  | 'dashboard'
  | 'marmitas'
  | 'delivery_cliente'
  | 'delivery_painel'
  | 'pedidos'
  | 'mesas'
  | 'comandas'
  | 'cozinha'
  | 'caixa'
  | 'cardapio'
  | 'clientes_entregadores'
  | 'relatorios'
  | 'usuarios_config';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  usuarioAtual: Usuario;
  roleSimulada: UserRole;
  onChangeRoleSimulada: (role: UserRole) => void;
  onLogout: () => void;
  kdsCount: number;
  deliveryNovosCount: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  corPrimaria?: string;
  iconeTema?: string;
  nomeRestaurante?: string;
  logoUrl?: string;
  corAside?: string;
  corAsideTexto?: string;
}

interface MenuItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  rolesPermitidas: UserRole[];
  contador?: number;
  grupo: 'operacao' | 'salao' | 'gestao' | 'sistema';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  usuarioAtual,
  roleSimulada,
  onChangeRoleSimulada,
  onLogout,
  kdsCount,
  deliveryNovosCount,
  mobileOpen,
  setMobileOpen,
  corPrimaria = '#ea580c',
  iconeTema = 'flame',
  nomeRestaurante = 'RESTAURANTE KERO',
  logoUrl,
  corAside,
  corAsideTexto,
}) => {
  const renderIcone = () => {
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

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      rolesPermitidas: ['administrador', 'caixa'],
      grupo: 'operacao',
    },
    {
      id: 'marmitas',
      label: 'Venda de Marmitas',
      icon: UtensilsCrossed,
      rolesPermitidas: ['administrador', 'atendente', 'caixa'],
      grupo: 'operacao',
    },
    {
      id: 'delivery_cliente',
      label: 'Delivery (Cliente iFood)',
      icon: ShoppingBag,
      rolesPermitidas: ['administrador', 'atendente', 'caixa', 'entregador'],
      grupo: 'operacao',
    },
    {
      id: 'delivery_painel',
      label: 'Kanban Delivery',
      icon: Columns3,
      rolesPermitidas: ['administrador', 'atendente', 'caixa', 'entregador'],
      contador: deliveryNovosCount,
      grupo: 'operacao',
    },
    {
      id: 'pedidos',
      label: 'Histórico de Pedidos',
      icon: ClipboardList,
      rolesPermitidas: ['administrador', 'atendente', 'caixa'],
      grupo: 'operacao',
    },
    {
      id: 'mesas',
      label: 'Mapa de Mesas',
      icon: Grid,
      rolesPermitidas: ['administrador', 'atendente', 'caixa'],
      grupo: 'salao',
    },
    {
      id: 'comandas',
      label: 'Comandas & Buffet',
      icon: Receipt,
      rolesPermitidas: ['administrador', 'atendente', 'caixa'],
      grupo: 'salao',
    },
    {
      id: 'cozinha',
      label: 'Cozinha (KDS)',
      icon: ChefHat,
      rolesPermitidas: ['administrador', 'cozinha', 'atendente'],
      contador: kdsCount,
      grupo: 'salao',
    },
    {
      id: 'caixa',
      label: 'Caixa (PDV)',
      icon: Wallet,
      rolesPermitidas: ['administrador', 'caixa'],
      grupo: 'gestao',
    },
    {
      id: 'cardapio',
      label: 'Cardápio & Preços',
      icon: BookOpen,
      rolesPermitidas: ['administrador', 'atendente'],
      grupo: 'gestao',
    },
    {
      id: 'clientes_entregadores',
      label: 'Clientes & Entregadores',
      icon: Truck,
      rolesPermitidas: ['administrador', 'atendente', 'entregador'],
      grupo: 'gestao',
    },
    {
      id: 'relatorios',
      label: 'Relatórios Financeiros',
      icon: BarChart3,
      rolesPermitidas: ['administrador', 'caixa'],
      grupo: 'gestao',
    },
    {
      id: 'usuarios_config',
      label: 'Configurações & Equipe',
      icon: Settings,
      rolesPermitidas: ['administrador'],
      grupo: 'sistema',
    },
  ];

  const itensVisiveis = menuItems.filter((item) =>
    item.rolesPermitidas.includes(roleSimulada)
  );

  const operacaoItems = itensVisiveis.filter((i) => i.grupo === 'operacao');
  const salaoItems = itensVisiveis.filter((i) => i.grupo === 'salao');
  const gestaoItems = itensVisiveis.filter((i) => i.grupo === 'gestao');
  const sistemaItems = itensVisiveis.filter((i) => i.grupo === 'sistema');

  const renderGroup = (title: string, items: MenuItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1 mb-4">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          {title}
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileOpen(false);
              }}
              style={active ? { backgroundColor: corPrimaria } : undefined}
              className={`w-full group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                active
                  ? 'text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.contador !== undefined && item.contador > 0 && (
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.contador}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const sidebarContent = (
    <aside
      className="flex flex-col h-full bg-slate-950 text-slate-200 w-64 shrink-0 border-r border-slate-800/80 select-none transition-colors"
      style={{
        backgroundColor: corAside || undefined,
        color: corAsideTexto || undefined,
      }}
    >
      {/* Brand Header no topo do Sidebar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs overflow-hidden"
          style={{ backgroundColor: corPrimaria }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={nomeRestaurante} className="w-full h-full object-cover" />
          ) : (
            renderIcone()
          )}
        </div>
        <div className="truncate flex-1">
          <div className="text-xs font-bold text-white uppercase tracking-wider truncate font-display">
            {nomeRestaurante}
          </div>
          <div className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
            <span>Marmitas & Restaurante</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Tempo Real</span>
          </div>
        </div>
      </div>

      {/* Perfil do Operador e Simulador de Perfil RBAC */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
              {usuarioAtual.nome ? usuarioAtual.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {usuarioAtual.nome}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {usuarioAtual.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" /> Perfil RBAC Ativo
            </span>
            <span className="text-amber-400/90 font-mono text-[9px]">Simulação</span>
          </div>
          <select
            value={roleSimulada}
            onChange={(e) => onChangeRoleSimulada(e.target.value as UserRole)}
            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="administrador">Administrador (Acesso Total)</option>
            <option value="caixa">Caixa (Vendas e Fechamento)</option>
            <option value="atendente">Atendente / Garçom (Mesas/Pedidos)</option>
            <option value="cozinha">Cozinha (Somente KDS)</option>
            <option value="entregador">Entregador (Minhas Entregas)</option>
          </select>
        </div>
      </div>

      {/* Menu de Navegação agrupado */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {renderGroup('Vendas & Delivery', operacaoItems)}
        {renderGroup('Salão & Produção', salaoItems)}
        {renderGroup('Gestão Financeira', gestaoItems)}
        {renderGroup('Administração', sistemaItems)}
      </nav>

      {/* Rodapé do Menu */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate text-[11px] font-medium text-slate-300">
          {formatRoleName(roleSimulada)}
        </span>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Botão Mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-40 p-3 bg-amber-600 text-white rounded-full shadow-lg border border-amber-500 hover:bg-amber-500 transition-colors"
        aria-label="Abrir Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:block h-[calc(100vh-53px)] sticky top-[53px]">
        {sidebarContent}
      </aside>

      {/* Drawer Mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
