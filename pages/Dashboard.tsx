
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Sparkles, RefreshCcw, 
  Church, ArrowUpCircle, ArrowDownCircle, Calendar,
  ArrowRight,
  Lock
} from 'lucide-react';
import { getTransactions, getCurrentUser } from '../services/storage';
import { getFinancialInsight } from '../services/geminiService';
import { Transaction, FinancialStats } from '../types';

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
    const months = [...new Set(transactions.map(t => t.mes))];
    const monthlyData = months.map(m => ({
      month: m,
      income: transactions.filter(t => t.mes === m && t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0),
      expense: transactions.filter(t => t.mes === m && t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0)
    }));
    return { totalIncome: income, totalExpense: expense, balance: income - expense, monthlyData };
  }, [transactions]);

  const topTransactions = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return transactions.filter(t => new Date(t.data) >= thirtyDaysAgo).sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [transactions]);

  const pieData = useMemo(() => [
    { name: 'Entradas', value: stats.totalIncome, color: '#1E40AF' },
    { name: 'Saídas', value: stats.totalExpense, color: '#FBBF24' }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Financeiro</h1>
          <p className="text-gray-500">Visão geral da Igreja 3IPI Natal</p>
        </div>
        <button onClick={handleRefresh} className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50">
          <RefreshCcw size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-800">
           <p className="text-sm text-gray-500 font-medium">Total Entradas</p>
           <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalIncome)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-yellow-400">
           <p className="text-sm text-gray-500 font-medium">Total Saídas</p>
           <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalExpense)}</h3>
        </div>
        <div className="bg-blue-900 p-6 rounded-2xl shadow-md text-white">
           <p className="text-sm text-blue-200 font-medium">Saldo Atual</p>
           <h3 className="text-2xl font-bold">{formatCurrency(stats.balance)}</h3>
        </div>
      </div>

      {/* AI Section (Admin only) */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        {!isAdmin && <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center gap-2">
          <Lock size={20} className="text-yellow-400" />
          <span className="font-black uppercase tracking-widest text-xs text-white">Acesso restrito à Administração</span>
        </div>}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-yellow-400" />
              <h2 className="text-xl font-bold">Relatório Pastor de IA</h2>
            </div>
            <p className="text-blue-100 mb-4 leading-relaxed">
              {aiInsight || "Análise automática das movimentações para auxílio na tomada de decisões ministeriais."}
            </p>
            {isAdmin && !aiInsight && (
              <button onClick={handleGenerateInsight} disabled={loadingInsight} className="bg-yellow-400 text-blue-900 font-bold px-6 py-2 rounded-lg">
                {loadingInsight ? "Analisando..." : "Gerar Insight Agora"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Charts & Table (Acessível a todos para visualização) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h2 className="text-lg font-bold mb-6 text-gray-800">Maiores Lançamentos (30 dias)</h2>
        <div className="space-y-3">
          {topTransactions.map(t => (
            <div key={t.id} className="flex justify-between p-4 bg-gray-50 rounded-xl border border-transparent hover:border-blue-100 transition-all">
               <div className="font-bold">{t.movimento}</div>
               <div className={`font-black ${t.tipo === 'Entrada' ? 'text-blue-800' : 'text-red-700'}`}>{formatCurrency(t.valor)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
