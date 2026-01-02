
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Church, Lock, User as UserIcon, HelpCircle, X, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { getUsers, setCurrentUser } from '../services/storage';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const users = await getUsers();
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        const { password, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        navigate('/');
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setError('Erro ao conectar com o banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full pl-10 pr-12 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium bg-gray-50 text-gray-900";

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border-4 border-white/10">
        <div className="bg-blue-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="inline-flex p-5 bg-yellow-400 rounded-[24px] mb-4 shadow-xl ring-8 ring-blue-700/50">
            <Church className="text-blue-900" size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">3IPI Natal</h1>
          <p className="text-blue-100 font-bold text-sm mt-1 uppercase tracking-widest opacity-80">Tesouraria Digital</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border-2 border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <ShieldAlert size={20} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-black text-blue-900 uppercase tracking-widest px-1">E-mail de Acesso</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                className={inputClass}
                placeholder="admin@3ipi.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-blue-900 uppercase tracking-widest px-1 flex justify-between">
              Senha
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-blue-600 hover:text-blue-800 hover:underline lowercase font-bold transition-all"
              >
                Esqueci minha senha?
              </button>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                className={inputClass}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-800 text-white font-black py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-900/20 uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-3 disabled:opacity-50 border-b-4 border-blue-950"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Autenticando...
                </>
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link 
              to="/signup" 
              className="text-sm text-gray-400 hover:text-blue-800 font-bold transition-colors inline-flex items-center gap-1 group"
            >
              Não possui cadastro? <span className="text-blue-800 underline group-hover:no-underline">Solicite Acesso</span>
            </Link>
          </div>
        </form>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border-4 border-yellow-400 animate-in zoom-in duration-300">
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 bg-blue-100 rounded-full text-blue-800 mb-2">
                <HelpCircle size={48} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight">Recuperar Conta</h2>
              <div className="space-y-3 text-gray-600 font-medium leading-relaxed">
                <p>Por questões de segurança administrativa da <strong>3IPI Natal</strong>, as senhas são gerenciadas pela Secretaria.</p>
                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200 text-yellow-800 text-sm font-bold">
                  Favor entrar em contato com o Administrador Master do sistema ou com o Conselho da Igreja para redefinir suas credenciais.
                </div>
              </div>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="w-full py-4 bg-blue-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 transition-all shadow-lg border-b-4 border-blue-950"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
