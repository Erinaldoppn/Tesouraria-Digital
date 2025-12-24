
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Sparkles, RefreshCcw, 
  Church, ArrowUpCircle, ArrowDownCircle, Calendar,
  ArrowRight,
  Lock,
  PieChart as PieChartIcon,
  BarChart3,
  ReceiptText
} from 'lucide-react';
import { getTransactions, getCurrentUser } from '../services/storage';
import { getFinancialInsight } from '../services/geminiService';
import { Transaction, FinancialStats } from '../types';
import { COLORS } from '../constants';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const data = getTransactions();
    setTransactions(data);
  }, []);

  const stats = useMemo<FinancialStats>(() => {
    const income = transactions.filter(t => t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0);
    const expense = transactions.filter(t => t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0);
    
    const monthOrder = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const months = Array.from(new Set(transactions.map(t => t.mes))).sort((a: string, b: string) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    
    const monthlyData = months.map(m => ({
      name: m,
      Entradas: transactions.filter(t => t.mes === m && t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0),
      Saídas: transactions.filter(t => t.mes === m && t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0)
    }));

    return { totalIncome: income, totalExpense: expense, balance: income - expense, monthlyData };
  }, [transactions]);

  const topTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [transactions]);

  const pieData = useMemo(() => [
    { name: 'Entradas', value: stats.totalIncome, color: COLORS.primaryBlue },
    { name: 'Saídas', value: stats.totalExpense, color: COLORS.secondaryYellow }
  ], [stats.totalIncome, stats.totalExpense]);

  const handleGenerateInsight = async () => {
    if (!isAdmin) return;
    setLoadingInsight(true);
    const insight = await getFinancialInsight(transactions);
    setAiInsight(insight);
    setLoadingInsight(false);
  };

  const handleRefresh = () => setTransactions(getTransactions());
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Painel de Controle Financeiro</h1>
          <p className="text-blue-700 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider">Igreja 3IPI Natal</p>
        </div>
        <button 
          onClick={handleRefresh} 
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-100 dark:border-slate-800 shadow-sm hover:bg-blue-50 dark:hover:bg-slate-800 transition-all active:scale-95 text-blue-800 dark:text-blue-400"
          title="Atualizar Dados"
        >
          <RefreshCcw size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Cartões de Resumo Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border-b-4 border-blue-800 dark:border-blue-600 flex items-center gap-5 transition-colors">
           <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-2xl">
             <TrendingUp size={28} />
           </div>
           <div>
             <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest">Total Entradas</p>
             <h3 className="text-2xl font-black text-blue-900 dark:text-blue-100">{formatCurrency(stats.totalIncome)}</h3>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border-b-4 border-yellow-400 dark:border-yellow-500 flex items-center gap-5 transition-colors">
           <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-2xl">
             <TrendingDown size={28} />
           </div>
           <div>
             <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest">Total Saídas</p>
             <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100">{formatCurrency(stats.totalExpense)}</h3>
           </div>
        </div>
        <div className="bg-blue-900 dark:bg-blue-800 p-6 rounded-[24px] shadow-xl text-white flex items-center gap-5 relative overflow-hidden transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={80} />
           </div>
           <div className="p-4 bg-white/10 rounded-2xl relative z-10">
             <Wallet size={28} className="text-yellow-400" />
           </div>
           <div className="relative z-10">
             <p className="text-[10px] text-blue-300 dark:text-blue-200 font-black uppercase tracking-widest">Saldo em Caixa</p>
             <h3 className="text-2xl font-black text-white">{formatCurrency(stats.balance)}</h3>
           </div>
        </div>
      </div>

      {/* Insights da IA (Exclusivo para Admins) */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-950 dark:from-slate-800 dark:to-slate-950 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden transition-all">
        {!isAdmin && (
          <div className="absolute inset-0 bg-blue-950/60 dark:bg-slate-950/70 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-yellow-400 rounded-2xl text-blue-900 shadow-xl">
              <Lock size={24} strokeWidth={3} />
            </div>
            <span className="font-black uppercase tracking-widest text-[10px] text-white">Relatório restrito à Administração</span>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative z-0">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-400 rounded-xl">
                <Sparkles size={24} className="text-blue-900" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Análise do Pastor de IA</h2>
            </div>
            
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              {loadingInsight ? (
                <div className="flex items-center gap-4 py-4">
                  <div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                  <p className="font-bold text-blue-200 animate-pulse uppercase tracking-widest text-xs">Consultando inteligência financeira...</p>
                </div>
              ) : (
                <p className="text-blue-50 dark:text-slate-300 leading-relaxed font-medium">
                  {aiInsight || "Clique no botão ao lado para gerar uma análise profunda das movimentações do mês atual e receber sugestões pastorais para a tesouraria."}
                </p>
              )}
            </div>
          </div>
          
          {isAdmin && !aiInsight && !loadingInsight && (
            <button 
              onClick={handleGenerateInsight} 
              className="w-full md:w-auto self-center bg-yellow-400 text-blue-900 font-black px-8 py-5 rounded-2xl hover:bg-yellow-300 transition-all shadow-xl shadow-yellow-400/20 active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3 border-b-4 border-yellow-600"
            >
              <Sparkles size={18} />
              Gerar Relatório Inteligente
            </button>
          )}
        </div>
      </div>

      {/* Seção de Gráficos Analíticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-[400px] transition-colors">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Fluxo Mensal</h2>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.1 }} contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} formatter={(value: number) => [formatCurrency(value), '']} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                <Bar dataKey="Entradas" fill={COLORS.primaryBlue} radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="Saídas" fill={COLORS.secondaryYellow} radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-[400px] transition-colors">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
              <PieChartIcon size={20} />
            </div>
            <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Distribuição</h2>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} formatter={(value: number) => [formatCurrency(value), '']} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Maiores Movimentações */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg">
                <ReceiptText size={20} />
             </div>
             <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Lançamentos de Maior Valor</h2>
          </div>
        </div>
        
        <div className="space-y-3">
          {topTransactions.length > 0 ? topTransactions.map(t => (
            <div key={t.id} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent hover:border-blue-100 dark:hover:border-blue-900 transition-all group">
               <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs ${t.tipo === 'Entrada' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'}`}>
                   #{t.id}
                 </div>
                 <div>
                   <p className="font-black text-gray-900 dark:text-white leading-none mb-1 uppercase tracking-tight transition-colors">{t.movimento}</p>
                   <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">{t.data} • {t.metodo}</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className={`text-lg font-black ${t.tipo === 'Entrada' ? 'text-blue-800 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                   {t.tipo === 'Entrada' ? '+' : '-'} {formatCurrency(t.valor)}
                 </p>
               </div>
            </div>
          )) : (
            <div className="py-10 text-center text-gray-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs transition-colors">Nenhuma movimentação registrada.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
