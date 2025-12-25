
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  User as UserIcon, 
  X, 
  Mail, 
  Lock, 
  ShieldAlert,
  Search,
  CheckCircle2
} from 'lucide-react';
import { getUsers, registerUser, deleteUser, getCurrentUser } from '../services/storage';
import { User } from '../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<(User & { password?: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Dados do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // Se não for admin, redireciona para o Dashboard
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name.trim().length < 3) newErrors.name = 'Mínimo 3 caracteres.';
    if (!emailRegex.test(email)) newErrors.email = 'E-mail inválido.';
    if (users.find(u => u.email === email)) newErrors.email = 'E-mail já cadastrado.';
    if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role
    };

    registerUser(newUser);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      loadUsers();
    }, 1500);
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser?.id) {
      alert("Você não pode excluir seu próprio acesso de administrador.");
      return;
    }
    
    if (confirm('Tem certeza que deseja revogar o acesso deste usuário?')) {
      deleteUser(id);
      loadUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Gestão de Usuários</h1>
          <p className="text-blue-700 dark:text-blue-400 font-bold text-sm uppercase tracking-wider">Controle de Acessos 3IPI Natal</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-800 transition-all shadow-xl active:scale-95 border-b-4 border-blue-950 uppercase text-xs tracking-widest"
        >
          <UserPlus size={18} /> Novo Usuário
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou e-mail..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 focus:border-blue-600 transition-all outline-none dark:text-white font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Usuário</th>
                <th className="px-8 py-5">E-mail</th>
                <th className="px-8 py-5 text-center">Nível</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="group hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm text-gray-500 dark:text-slate-400">{u.email}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`
                      inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                      ${u.role === 'admin' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}
                    `}>
                      {u.role === 'admin' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                      {u.role === 'admin' ? 'Administrador' : 'Tesoureiro'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={u.id === currentUser?.id}
                      className={`
                        p-2 rounded-xl transition-all
                        ${u.id === currentUser?.id 
                          ? 'text-gray-200 dark:text-slate-800 cursor-not-allowed' 
                          : 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'}
                      `}
                      title={u.id === currentUser?.id ? "Você não pode excluir seu próprio acesso" : "Remover Usuário"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-blue-900 text-white">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <UserPlus size={24} /> Novo Acesso
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-8 space-y-5">
              {showSuccess ? (
                <div className="py-10 text-center space-y-4 animate-in fade-in duration-500">
                   <div className="inline-flex p-4 bg-green-100 rounded-full text-green-600 mb-2">
                     <CheckCircle2 size={64} strokeWidth={2.5} />
                   </div>
                   <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase">Usuário Criado!</h3>
                   <p className="text-gray-500 dark:text-slate-400 font-bold uppercase text-xs tracking-widest">O acesso foi registrado com sucesso.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-blue-900 dark:text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-blue-600 outline-none transition-all font-medium"
                        placeholder="Ex: João da Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    {errors.name && <p className="text-[10px] text-red-600 font-bold px-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-blue-900 dark:text-slate-400 uppercase tracking-widest px-1">E-mail Administrativo</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-blue-600 outline-none transition-all font-medium"
                        placeholder="email@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-red-600 font-bold px-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-blue-900 dark:text-slate-400 uppercase tracking-widest px-1">Senha de Acesso</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-blue-600 outline-none transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    {errors.password && <p className="text-[10px] text-red-600 font-bold px-1">{errors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-blue-900 dark:text-slate-400 uppercase tracking-widest px-1">Perfil de Acesso</label>
                    <select 
                      className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-blue-600 outline-none font-bold"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                    >
                      <option value="user">Tesoureiro (Leitura/Relatórios)</option>
                      <option value="admin">Administrador (Total)</option>
                    </select>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      type="submit"
                      className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl hover:bg-blue-800 active:scale-95 transition-all shadow-xl border-b-4 border-blue-950 uppercase tracking-widest text-xs"
                    >
                      Registrar Acesso
                    </button>
                    <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      O usuário poderá logar imediatamente após o registro.
                    </p>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Informativo de Segurança */}
      <div className="bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-100 dark:border-yellow-900/30 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-yellow-400 rounded-2xl text-blue-900 shrink-0">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h4 className="font-black text-blue-900 dark:text-yellow-400 uppercase tracking-tight text-sm">Aviso de Segurança Administrativa</h4>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">
            Como Administrador, você é responsável pela gestão das chaves de acesso. Nunca compartilhe suas credenciais. 
            Revogue o acesso de tesoureiros que não fazem mais parte do conselho ou que mudaram de função.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Users;
