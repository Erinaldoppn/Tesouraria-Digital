
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Sparkles, RefreshCcw, 
  Church, Lock, PieChart as PieChartIcon,
  BarChart3, ReceiptText, Target
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
    setTransactions(getTransactions());
  }, []);

  const stats = useMemo<FinancialStats>(() => {
    // Operacional
    const income = transactions.filter(t => t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0);
    const expense = transactions.filter(t => t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0);
    
    // Projetos
    const pIncome = transactions.filter(t => t.tipo === 'Entrada (Projeto)').reduce((sum, t) => sum + t.valor, 0);
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
      balance: income - expense, 
      projectIncome: pIncome,
      projectExpense: pExpense,
      projectBalance: pIncome - pExpense,
      monthlyData 
    };
  }, [transactions]);

  const topTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [transactions]);

  const pieData = useMemo(() => [
    { name: 'Dízimos/Ofertas', value: stats.totalIncome, color: COLORS.primaryBlue },
    { name: 'Projetos/Eventos', value: stats.projectIncome, color: '#6366f1' }, // Indigo
    { name: 'Saídas Gerais', value: stats.totalExpense, color: COLORS.secondaryYellow }
  ], [stats]);

  const handleGenerateInsight = async () => {
    if (!isAdmin) return;
    setLoadingInsight(true);
    const insight = await getFinancialInsight(transactions);
    setAiInsight(insight);
    setLoadingInsight(false);
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Tesouraria 3IPI Natal</h1>
          <p className="text-blue-700 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider">Gestão Segregada de Fundos</p>
        </div>
        <button onClick={() => setTransactions(getTransactions())} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-100 dark:border-slate-800 text-blue-800 dark:text-blue-400 shadow-sm transition-all active:scale-95">
          <RefreshCcw size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Cartões Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] shadow-sm border-b-4 border-blue-800">
           <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Saldo Operacional</p>
           <h3 className="text-xl font-black text-blue-900 dark:text-blue-100">{formatCurrency(stats.balance)}</h3>
           <p className="text-[8px] text-blue-500 font-bold mt-1 uppercase">Dízimos e Ofertas Gerais</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] shadow-sm border-b-4 border-indigo-600">
           <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Fundo de Projetos</p>
           <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-300">{formatCurrency(stats.projectBalance)}</h3>
           <p className="text-[8px] text-indigo-500 font-bold mt-1 uppercase">Eventos, Campanhas e Departamentos</p>
        </div>
        <div className="bg-blue-900 dark:bg-slate-800 p-5 rounded-[24px] shadow-xl text-white md:col-span-2 flex justify-between items-center overflow-hidden">
           <div>
             <p className="text-[9px] text-blue-300 font-black uppercase tracking-widest">Saldo Total em Caixa</p>
             <h3 className="text-2xl font-black">{formatCurrency(stats.balance + stats.projectBalance)}</h3>
           </div>
           <Wallet size={40} className="opacity-20 -mr-2" />
        </div>
      </div>

      {/* IA Insight */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-950 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
        {!isAdmin && <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-[2px] z-10 flex items-center justify-center font-black uppercase tracking-widest text-[10px]">Acesso restrito</div>}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-400 rounded-xl text-blue-900"><Sparkles size={24} strokeWidth={2.5} /></div>
          <h2 className="text-lg font-black uppercase">Análise de IA</h2>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
          {loadingInsight ? <div className="flex items-center gap-3 animate-pulse text-blue-200 uppercase font-black text-xs"><RefreshCcw className="animate-spin" /> Processando dados...</div> : 
            <p className="text-blue-50 text-sm leading-relaxed">{aiInsight || "Gere uma análise para entender como as campanhas estão afetando o caixa."}</p>}
        </div>
        {isAdmin && !aiInsight && !loadingInsight && (
          <button onClick={handleGenerateInsight} className="bg-yellow-400 text-blue-900 font-black px-6 py-4 rounded-xl hover:bg-yellow-300 uppercase text-xs tracking-widest shadow-xl shadow-yellow-400/20 active:scale-95">Gerar Relatório Inteligente</button>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 h-[400px]">
          <h2 className="text-sm font-black uppercase text-gray-400 mb-6 tracking-widest flex items-center gap-2"><BarChart3 size={16} /> Fluxo por Competência</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px' }} />
              <Legend wrapperStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }} />
              <Bar name="Entradas Gerais" dataKey="income" fill={COLORS.primaryBlue} radius={[4, 4, 0, 0]} />
              <Bar name="Entradas Projetos" dataKey="projectIncome" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar name="Saídas (Total)" dataKey="expense" fill={COLORS.secondaryYellow} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 h-[400px]">
           <h2 className="text-sm font-black uppercase text-gray-400 mb-6 tracking-widest flex items-center gap-2"><PieChartIcon size={16} /> Composição do Caixa</h2>
           <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
