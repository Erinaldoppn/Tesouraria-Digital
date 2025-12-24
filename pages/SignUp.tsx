
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Church, Lock, User as UserIcon, Mail, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { registerUser, getUsers } from '../services/storage';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name.trim().length < 3) {
      newErrors.name = 'O nome deve ter pelo menos 3 caracteres.';
    }

    if (!emailRegex.test(email)) {
      newErrors.email = 'Insira um formato de e-mail válido.';
    } else {
      const users = getUsers();
      if (users.find(u => u.email === email)) {
        newErrors.email = 'Este e-mail já está cadastrado no sistema.';
      }
    }

    if (password.length < 6) {
      newErrors.password = 'A senha deve ter no mínimo 6 caracteres.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    setTimeout(() => {
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role
      };
      
      registerUser(newUser);
      setIsSubmitting(false);
      alert('Conta de Tesouraria criada com sucesso!');
      navigate('/login');
    }, 800);
  };

  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ";
    if (errors[fieldName]) {
      return baseClass + "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-100 text-red-900";
    }
    return baseClass + "border-gray-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 bg-gray-50 text-gray-900";
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border-4 border-white/10">
        <div className="bg-blue-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="inline-flex p-5 bg-yellow-400 rounded-[24px] mb-4 shadow-xl ring-8 ring-blue-700/50">
            <Church className="text-blue-900" size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Novo Cadastro</h1>
          <p className="text-blue-100 font-bold text-sm mt-1 uppercase tracking-widest opacity-80">Tesouraria 3IPI Natal</p>
        </div>
        
        <form onSubmit={handleSignUp} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-blue-900 uppercase tracking-widest px-1">Nome Completo</label>
            <div className="relative">
              <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.name ? 'text-red-400' : 'text-gray-400'}`} size={18} />
              <input type="text" className={getInputClass('name')} placeholder="Ex: João da Silva" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {errors.name && <p className="text-[10px] font-black text-red-600 px-1">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-blue-900 uppercase tracking-widest px-1">Nível de Acesso</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 font-bold text-gray-800 outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
              >
                <option value="user">Tesoureiro (Visualização/Exportação)</option>
                <option value="admin">Administrador (Acesso Total)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-blue-900 uppercase tracking-widest px-1">E-mail Administrativo</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-400'}`} size={18} />
              <input type="email" className={getInputClass('email')} placeholder="tesouraria@3ipi.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-blue-900 uppercase tracking-widest px-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={showPassword ? "text" : "password"} className={getInputClass('password')} placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-blue-900 uppercase tracking-widest px-1">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={showPassword ? "text" : "password"} className={getInputClass('confirmPassword')} placeholder="••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-800 text-white font-black py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-900/20 uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-2">
              {isSubmitting ? 'Processando...' : 'Criar Acesso'}
            </button>
          </div>

          <div className="text-center">
             <Link to="/login" className="text-sm text-gray-400 hover:text-blue-800 font-bold transition-colors">
              Já possui uma conta? <span className="text-blue-800 underline">Fazer login</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
