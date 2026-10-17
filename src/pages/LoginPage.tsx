import React, { useState } from 'react';
import { LogIn, Mail, Lock, UserPlus, HelpCircle, UtensilsCrossed, Shield, Flame, Sparkles } from 'lucide-react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAnonymously,
} from '../services/authService';
import { UserRole } from '../types';
import { IMAGENS_PADRAO } from '../services/firestoreService';

interface LoginPageProps {
  onAbrirCardapioCliente?: () => void;
  onAbrirVitrineCardapio?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onAbrirCardapioCliente,
  onAbrirVitrineCardapio,
}) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [funcao, setFuncao] = useState<UserRole>('administrador');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarGuiaFirebase, setMostrarGuiaFirebase] = useState(false);

  const handleGoogleLogin = async () => {
    setErro('');
    setCarregando(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Erro ao autenticar com o Google. Verifique a janela popup.'
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setErro('');
    setCarregando(true);
    try {
      await loginAnonymously();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed') || msg.includes('admin-restricted')) {
        setErro(
          'O provedor Anônimo ainda não foi ativado no Firebase Console. Utilize o botão "Entrar com Conta Google" ou veja as instruções abaixo.'
        );
      } else {
        setErro(`Erro ao entrar: ${msg}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (modo === 'login') {
        await loginWithEmail(email, senha);
      } else {
        await registerWithEmail(nome || 'Operador', email, senha, funcao);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed')) {
        setErro(
          'O provedor de E-mail/Senha ainda não foi ativado no Firebase Console. Utilize o botão "Entrar com Conta Google" ou consulte o Guia de Configuração abaixo.'
        );
      } else {
        setErro(`Não foi possível autenticar: ${msg}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid lg:grid-cols-12 selection:bg-amber-600 selection:text-white">
      {/* Coluna Visual Esquerda */}
      <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden bg-slate-950 flex-col justify-between p-12">
        <img
          src={IMAGENS_PADRAO.buffetHero}
          alt="Restaurante KERO"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-radial from-amber-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/30 text-white">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-display block">
              RESTAURANTE KERO
            </span>
            <span className="text-xs text-amber-400 font-mono tracking-wider uppercase">
              Marmitas & Restaurante · Gestão em Tempo Real
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Plataforma Operacional & Delivery</span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white font-display leading-tight">
            Gestão integrada para Marmitaria, Salão, Delivery e Cozinha.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Painel Kanban de entregas, montagem de marmitas por tamanho e carnes, mapa de mesas com comanda digital, balança de buffet por quilo e KDS da cozinha integrados com o Cloud Firestore.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Administrador</span>
            <span aria-hidden="true">·</span>
            <span>Caixa PDV</span>
            <span aria-hidden="true">·</span>
            <span>Garçom / Atendente</span>
            <span aria-hidden="true">·</span>
            <span>Cozinha KDS</span>
            <span aria-hidden="true">·</span>
            <span>Entregadores</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-mono flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Infraestrutura Cloud Firestore & Autenticação Segura</span>
        </div>
      </div>

      {/* Coluna de Login Direita */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-10 bg-slate-50 text-slate-900">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <div className="lg:hidden flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 font-display">
                RESTAURANTE KERO
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              Acesso Operacional
            </h2>
            <p className="text-xs text-slate-600">
              Entre com sua conta Google oficial ou informe suas credenciais de operador.
            </p>
          </div>

          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0" />
                Área de Clientes (Sem necessidade de login)
              </div>
              <p className="text-[11px] text-amber-800">
                Consulte o cardápio oficial ou monte sua marmita delivery:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {onAbrirVitrineCardapio && (
                <button
                  type="button"
                  onClick={onAbrirVitrineCardapio}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Cardápio Vitrine (Restoran)</span>
                </button>
              )}
              {onAbrirCardapioCliente && (
                <button
                  type="button"
                  onClick={onAbrirCardapioCliente}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <span>Fazer Pedido Delivery</span>
                </button>
              )}
            </div>
          </div>

          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 leading-relaxed">
              {erro}
            </div>
          )}

          {/* Botão Principal Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>{carregando ? 'Conectando...' : 'Entrar com Conta Google'}</span>
          </button>

          <button
            type="button"
            onClick={handleAnonymousLogin}
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            Acesso Rápido de Demonstração / Operador Local
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">
              ou acesso por e-mail e senha
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setModo('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                modo === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setModo('cadastro')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                modo === 'cadastro'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cadastrar Operador
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {modo === 'cadastro' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Função no Restaurante
                  </label>
                  <select
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600 bg-white"
                  >
                    <option value="administrador">Administrador</option>
                    <option value="caixa">Caixa</option>
                    <option value="atendente">Atendente / Garçom</option>
                    <option value="cozinha">Cozinha</option>
                    <option value="entregador">Entregador</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operador@restaurante.com.br"
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50 shadow-xs"
            >
              {modo === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Acessar com E-mail</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Operador</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setMostrarGuiaFirebase(!mostrarGuiaFirebase)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Configuração dos Provedores Firebase</span>
            </button>

            {mostrarGuiaFirebase && (
              <div className="mt-2.5 p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <p className="font-bold text-slate-900">
                  Instruções de Autenticação:
                </p>
                <p>
                  1. O login com <strong>Google</strong> está pronto e é a forma recomendada.
                </p>
                <p>
                  2. Para ativar login por <strong>E-mail/Senha</strong>: acesse o <em>Firebase Console</em> → <strong>Authentication</strong> → <strong>Sign-in method</strong> → ative <strong>Email/Password</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
