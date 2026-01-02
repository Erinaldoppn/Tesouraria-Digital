
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Sparkles, RefreshCcw, 
  Church, Lock, PieChart as PieChartIcon,
  BarChart3, Target, AlertCircle
} from 'lucide-react';
import { getTransactions, getCurrentUser } from '../services/storage';
import { getFinancialInsight } from '../services/geminiService';
import { Transaction, FinancialStats } from '../types';
import { COLORS } from '../constants';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    const data = await getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo<FinancialStats>(() => {
    // LOGICA DE SEGREGACAO: 
    // Entradas Gerais (Operacional)
    const income = transactions.filter(t => t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0);
    // Saídas Gerais (Operacional)
    const expense = transactions.filter(t => t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0);
    
    // Entradas de Projeto (Fundo Restrito)
    const pIncome = transactions.filter(t => t.tipo === 'Entrada (Projeto)').reduce((sum, t) => sum + t.valor, 0);
    // Saídas de Projeto (Fundo Restrito)
    const pExpense = transactions.filter(t => t.tipo === 'Saída (Projeto)').reduce((sum, t) => sum + t.valor, 0);

    const monthOrder = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const months = Array.from(new Set(transactions.map(t => t.mes))).sort((a: string, b: string) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    
    const monthlyData = months.map(m => ({
      month: m,
      income: transactions.filter(t => t.mes === m && t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0),
      expense: transactions.filter(t => t.mes === m && t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0),
      projectIncome: transactions.filter(t => t.mes === m && t.tipo === 'Entrada (Projeto)').reduce((sum, t) => sum + t.valor, 0),
      projectExpense: transactions.filter(t => t.mes === m && t.tipo === 'Saída (Projeto)').reduce((sum, t) => sum + t.valor, 0)
    }));

    return { 
      totalIncome: income, 
      totalExpense: expense, 
      balance: income - expense, // SALDO OPERACIONAL (Não inclui projetos)
      projectIncome: pIncome,
      projectExpense: pExpense,
      projectBalance: pIncome - pExpense, // SALDO ISOLADO DE PROJETOS
      monthlyData 
    };
  }, [transactions]);

  const pieData = useMemo(() => [
    { name: 'Caixa Livre', value: Math.max(0, stats.balance), color: COLORS.primaryBlue },
    { name: 'Fundo Projetos', value: Math.max(0, stats.projectBalance), color: '#6366f1' }
  ], [stats]);

  const handleGenerateInsight = async () => {
    if (!isAdmin) return;
    setLoadingInsight(true);
    const insight = await getFinancialInsight(transactions);
    setAiInsight(insight);
    setLoadingInsight(false);
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-900 uppercase text-xs tracking-widest animate-pulse">Sincronizando com o Banco 3IPI...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Dashboard Financeiro</h1>
          <p className="text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em]">Gestão de Ativos 3IPI Natal</p>
        </div>
        <button onClick={loadData} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-100 dark:border-slate-800 text-blue-800 dark:text-blue-400 shadow-sm transition-all active:scale-95">
          <RefreshCcw size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Operacional - SALDO REAL LIVRE */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border-b-4 border-blue-800 transition-all hover:translate-y-[-4px]">
           <div className="flex justify-between items-center mb-2">
             <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Caixa Disponível Livre</p>
             <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg">
               <TrendingUp size={14} />
             </div>
           </div>
           <h3 className="text-xl font-black text-blue-900 dark:text-blue-100">{formatCurrency(stats.balance)}</h3>
           <p className="text-[8px] text-blue-500 font-bold mt-1 uppercase">Dízimos e Ofertas Gerais</p>
        </div>

        {/* Card Projetos - FUNDO TOTALMENTE ISOLADO */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border-b-4 border-indigo-600 transition-all hover:translate-y-[-4px]">
           <div className="flex justify-between items-center mb-2">
             <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Fundo de Projetos</p>
             <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
               <Target size={14} />
             </div>
           </div>
           <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-300">{formatCurrency(stats.projectBalance)}</h3>
           <div className="flex items-center gap-1 mt-1 text-indigo-500">
             <Lock size={8} />
             <p className="text-[8px] font-bold uppercase tracking-tighter">Recurso Restrito e Carimbado</p>
           </div>
        </div>

        <div className="bg-blue-900 dark:bg-slate-800 p-6 rounded-[32px] shadow-xl text-white md:col-span-2 flex justify-between items-center overflow-hidden relative group">
           <div className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition-transform duration-700">
             <Wallet size={120} />
           </div>
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-1">
               <p className="text-[9px] text-blue-300 font-black uppercase tracking-widest">Saldo Real Disponível (Caixa Geral)</p>
               <div title="Os valores de projetos são mantidos em fundo separado e não aparecem neste saldo." className="cursor-help">
                 <AlertCircle size={12} className="text-yellow-400" />
               </div>
             </div>
             <h3 className="text-3xl font-black">{formatCurrency(stats.balance)}</h3>
             <p className="text-[9px] text-blue-200/60 font-medium mt-1">Este saldo reflete apenas o recurso operacional da igreja.</p>
           </div>
        </div>
      </div>

      {/* IA Insight */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-950 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
        {!isAdmin && <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-[2px] z-10 flex items-center justify-center font-black uppercase tracking-widest text-[10px]">Acesso restrito para auditoria</div>}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-400 rounded-xl text-blue-900"><Sparkles size={24} strokeWidth={2.5} /></div>
          <h2 className="text-lg font-black uppercase">Análise de IA (Segregação de Fundos)</h2>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
          {loadingInsight ? (
            <div className="flex items-center gap-3 animate-pulse text-blue-200 uppercase font-black text-xs">
              <RefreshCcw className="animate-spin" /> Auditando fluxo de projetos...
            </div>
          ) : (
            <p className="text-blue-50 text-sm leading-relaxed">
              {aiInsight || "A inteligência artificial analisará se a igreja possui saldo operacional suficiente para as despesas fixas, sem depender dos fundos de projetos."}
            </p>
          )}
        </div>
        {isAdmin && !aiInsight && !loadingInsight && (
          <button onClick={handleGenerateInsight} className="bg-yellow-400 text-blue-900 font-black px-6 py-4 rounded-xl hover:bg-yellow-300 uppercase text-xs tracking-widest shadow-xl shadow-yellow-400/20 active:scale-95 transition-all">
            Analisar Saúde do Caixa
          </button>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-800 h-[400px]">
          <h2 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" /> Comparativo de Fluxos
          </h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', paddingBottom: '20px' }} />
              <Bar name="Dízimos/Ofertas" dataKey="income" fill={COLORS.primaryBlue} radius={[4, 4, 0, 0]} />
              <Bar name="Projetos (Entradas)" dataKey="projectIncome" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-800 h-[400px]">
           <h2 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest flex items-center gap-2">
             <PieChartIcon size={16} className="text-indigo-600" /> Distribuição de Saldos
           </h2>
           <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="40%" innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }} />
              </PieChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
