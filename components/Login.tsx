
import React, { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight, Info, Eye, EyeOff, CheckCircle2, User, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onRegister: (name: string, email: string, pass: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'forgot' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      if (!email || !password) {
        setError('Por favor, preencha todos os campos.');
        return;
      }
      if (!validateEmail(email)) {
        setError('Por favor, insira um email válido.');
        return;
      }

      setIsLoading(true);
      const success = await onLogin(email, password);
      
      if (success) {
        setIsSuccess(true);
        setSuccessMessage('Login feito com sucesso!');
        if (rememberMe) {
          localStorage.setItem('medstock_remember_email', email);
        } else {
          localStorage.removeItem('medstock_remember_email');
        }
      } else {
        setError('Email ou senha incorretos. Tente novamente.');
        setIsLoading(false);
      }
    } else if (mode === 'register') {
      if (!name || !email || !password || !confirmPassword) {
        setError('Por favor, preencha todos os campos.');
        return;
      }
      if (!validateEmail(email)) {
        setError('Por favor, insira um email válido.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      setIsLoading(true);
      const success = await onRegister(name, email, password);
      
      if (success) {
        setIsSuccess(true);
        setSuccessMessage('Conta criada com sucesso!');
        setTimeout(() => {
          setIsSuccess(false);
          setMode('login');
          setIsLoading(false);
          setPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        setError('Erro ao criar conta. Tente outro email.');
        setIsLoading(false);
      }
    } else if (mode === 'forgot') {
      if (!email) {
        setError('Por favor, insira seu email.');
        return;
      }
      if (!validateEmail(email)) {
        setError('Por favor, insira um email válido.');
        return;
      }

      setIsLoading(true);
      // Simulação de recuperação
      setTimeout(() => {
        setIsSuccess(true);
        setSuccessMessage('Link de recuperação enviado!');
        setTimeout(() => {
          setIsSuccess(false);
          setMode('login');
          setIsLoading(false);
        }, 3000);
      }, 1500);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email de Acesso</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
          <input 
            required
            type="email"
            className="w-full pl-12 pr-4 py-4 bg-slate-800/30 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-slate-800/50 transition-all font-medium placeholder:text-slate-600"
            placeholder="exemplo@guifarma.gw"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Palavra-passe</label>
          <button 
            type="button" 
            onClick={() => { setMode('forgot'); setError(null); }}
            className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
          >
            Esqueci minha senha
          </button>
        </div>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
          <input 
            required
            type={showPassword ? "text" : "password"}
            className="w-full pl-12 pr-12 py-4 bg-slate-800/30 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-slate-800/50 transition-all font-medium placeholder:text-slate-600"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-emerald-500 border-emerald-500' : 'border-white/10 bg-slate-800/50 group-hover:border-emerald-500/50'}`}>
            {rememberMe && <CheckCircle2 size={14} className="text-white" />}
          </div>
          <input 
            type="checkbox" 
            className="hidden" 
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Lembrar-me</span>
        </label>
      </div>

      <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl text-blue-400/80 text-[10px] font-medium">
        <span className="mt-0.5 shrink-0"><Info size={14} /></span>
        <p>Acesso Restrito: <b>admin@medstock.pro</b> | Senha: <b>admin123</b></p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-shake">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <>
            ENTRAR NO SISTEMA
            <ArrowRight size={20} />
          </>
        )}
      </button>
      
      <div className="text-center">
        <button 
          type="button" 
          onClick={() => { setMode('register'); setError(null); }}
          className="text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors"
        >
          Não tem uma conta? <span className="text-emerald-500">Criar conta</span>
        </button>
      </div>
    </form>
  );

  const renderRegisterForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
          <input 
            required
            type="text"
            className="w-full pl-12 pr-4 py-3.5 bg-slate-800/30 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-slate-800/50 transition-all font-medium placeholder:text-slate-600"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
          <input 
            required
            type="email"
            className="w-full pl-12 pr-4 py-3.5 bg-slate-800/30 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-slate-800/50 transition-all font-medium placeholder:text-slate-600"
            placeholder="exemplo@guifarma.gw"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
            <input 
              required
              type="password"
              className="w-full pl-10 pr-4 py-3.5 bg-slate-800/30 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-slate-800/50 transition-all font-medium placeholder:text-slate-600"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
            <input 
              required
              type="password"
              className="w-full pl-10 pr-4 py-3.5 bg-slate-800/30 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-slate-800/50 transition-all font-medium placeholder:text-slate-600"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-shake">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <>
            CRIAR MINHA CONTA
            <ArrowRight size={20} />
          </>
        )}
      </button>
      
      <div className="text-center">
        <button 
          type="button" 
          onClick={() => { setMode('login'); setError(null); }}
          className="text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft size={14} /> Já tenho uma conta? <span className="text-emerald-500">Fazer Login</span>
        </button>
      </div>
    </form>
  );

  const renderForgotForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <div className="text-center mb-4">
        <p className="text-slate-400 text-sm">Insira seu email para receber um link de recuperação de senha.</p>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Cadastrado</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
          <input 
            required
            type="email"
            className="w-full pl-12 pr-4 py-4 bg-slate-800/30 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-slate-800/50 transition-all font-medium placeholder:text-slate-600"
            placeholder="exemplo@guifarma.gw"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-shake">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <>
            ENVIAR LINK DE RECUPERAÇÃO
            <ArrowRight size={20} />
          </>
        )}
      </button>
      
      <div className="text-center">
        <button 
          type="button" 
          onClick={() => { setMode('login'); setError(null); }}
          className="text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft size={14} /> Voltar para o <span className="text-emerald-500">Login</span>
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      {/* Background Decorativo - Fixed to prevent movement when typing */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-emerald-500/20 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-500/20 rounded-full blur-[80px] md:blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md animate-slideUp relative z-10 my-auto">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl shadow-black/50">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">GUIFARMA <span className="text-emerald-400">SA</span></h1>
            <p className="text-slate-400 font-medium tracking-wide">
              {mode === 'login' && 'Sistema de Gestão Farmacêutica'}
              {mode === 'register' && 'Crie sua conta profissional'}
              {mode === 'forgot' && 'Recuperação de Acesso'}
            </p>
          </div>

          {isSuccess ? (
            <div className="py-12 text-center space-y-4 animate-fadeIn">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 size={48} className="animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-white">{successMessage}</h2>
              <p className="text-slate-400">
                {mode === 'login' ? 'Redirecionando para o painel...' : 'Aguarde um momento...'}
              </p>
            </div>
          ) : (
            <>
              {mode === 'login' && renderLoginForm()}
              {mode === 'register' && renderRegisterForm()}
              {mode === 'forgot' && renderForgotForm()}
            </>
          )}


        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default Login;
