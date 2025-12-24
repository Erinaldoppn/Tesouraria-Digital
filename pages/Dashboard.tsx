
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Sparkles, RefreshCcw, 
  Church, ArrowUpCircle, ArrowDownCircle, Calendar,
  ArrowRight
} from 'lucide-react';
import { getTransactions } from '../services/storage';
import { getFinancialInsight } from '../services/geminiService';
import { Transaction, FinancialStats } from '../types';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const data = getTransactions();
    setTransactions(data);
  }, []);

  // Otimização: Cálculo memorizado das estatísticas
  const stats = useMemo<FinancialStats>(() => {
    const income = transactions
      .filter(t => t.tipo === 'Entrada')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const expense = transactions
      .filter(t => t.tipo === 'Saída')
      .reduce((sum, t) => sum + t.valor, 0);
    
    // Agrupamento mensal simplificado
    const months = [...new Set(transactions.map(t => t.mes))];
    const monthlyData = months.map(m => {
      const mIncome = transactions
        .filter(t => t.mes === m && t.tipo === 'Entrada')
        .reduce((sum, t) => sum + t.valor, 0);
      
      const mExpense = transactions
        .filter(t => t.mes === m && t.tipo === 'Saída')
        .reduce((sum, t) => sum + t.valor, 0);
      
      return { month: m, income: mIncome, expense: mExpense };
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      monthlyData
    };
  }, [transactions]);

  // Cálculo dos 5 maiores lançamentos dos últimos 30 dias
  const topTransactions = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return transactions
      .filter(t => new Date(t.data) >= thirtyDaysAgo)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [transactions]);

  // Otimização: Dados do gráfico de pizza memorizados
  const pieData = useMemo(() => [
    { name: 'Entradas', value: stats.totalIncome, color: '#1E40AF' },
    { name: 'Saídas', value: stats.totalExpense, color: '#FBBF24' }
  ], [stats.totalIncome, stats.totalExpense]);

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const insight = await getFinancialInsight(transactions);
    setAiInsight(insight);
    setLoadingInsight(false);
  };

  const handleRefresh = () => {
    const data = getTransactions();
    setTransactions(data);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Financeiro</h1>
          <p className="text-gray-500">Visão geral da Igreja 3IPI Natal</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors active:rotate-180 duration-500"
          title="Atualizar dados"
        >
          <RefreshCcw size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="text-blue-800" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Entradas</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.totalIncome)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-yellow-400">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <TrendingDown className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Saídas</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.totalExpense)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-blue-900 p-6 rounded-2xl shadow-md text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-800 rounded-xl">
              <Wallet className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-blue-200 font-medium">Saldo Atual</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(stats.balance)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Maiores Lançamentos */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 bg-yellow-400 rounded-full"></div>
            <h2 className="text-lg font-black text-blue-900 uppercase tracking-tight">Maiores Lançamentos (30 dias)</h2>
          </div>
          <span className="text-[10px] font-black bg-blue-50 text-blue-800 px-3 py-1 rounded-full uppercase tracking-widest">Top 5 Valores</span>
        </div>

        {topTransactions.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {topTransactions.map((t, index) => (
              <div 
                key={t.id} 
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 hover:bg-blue-50/50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${t.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.tipo === 'Entrada' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 line-clamp-1">{t.movimento}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">
                        <Calendar size={12} /> {new Date(t.data).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{t.metodo}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className={`text-base font-black ${t.tipo === 'Entrada' ? 'text-blue-800' : 'text-red-700'}`}>
                      {formatCurrency(t.valor)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.tipo}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-blue-800 group-hover:translate-x-1 transition-all">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhuma movimentação relevante nos últimos 30 dias</p>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-6 text-gray-800">Fluxo Mensal</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="income" name="Entrada" fill="#1E40AF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Saída" fill="#FBBF24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-6 text-gray-800">Composição Financeira</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-yellow-400" />
              <h2 className="text-xl font-bold">Relatório Pastor de IA</h2>
            </div>
            <p className="text-blue-100 mb-4 leading-relaxed">
              {aiInsight || "Gere um resumo automático das movimentações financeiras para auxiliar na tomada de decisões da igreja."}
            </p>
            {!aiInsight && (
              <button 
                onClick={handleGenerateInsight}
                disabled={loadingInsight}
                className="bg-yellow-400 text-blue-900 font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 transition-all disabled:opacity-50 active:scale-95"
              >
                {loadingInsight ? "Analisando..." : "Gerar Insight Agora"}
              </button>
            )}
            {aiInsight && (
               <button 
                onClick={handleGenerateInsight}
                disabled={loadingInsight}
                className="text-xs text-blue-300 underline mt-2 hover:text-white transition-colors"
              >
                Atualizar análise
              </button>
            )}
          </div>
          <div className="hidden md:block">
             <div className="w-24 h-24 bg-blue-700/50 rounded-full flex items-center justify-center border-4 border-yellow-400/20">
                <Church className="text-yellow-400 opacity-50" size={48} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
