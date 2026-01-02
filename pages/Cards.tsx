
import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Smartphone, 
  Banknote, 
  CalendarDays,
  ArrowRightCircle,
  Clock
} from 'lucide-react';
import { getTransactions } from '../services/storage';
import { MONTHS } from '../constants';
import { Transaction } from '../types';

const Cards: React.FC = () => {
  // Fix: use state for transactions as getTransactions is asynchronous and returns a Promise
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getTransactions();
      setTransactions(data);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStr = MONTHS[now.getMonth()];

    // Filtragem por mês atual
    const monthTransactions = transactions.filter(t => t.mes === currentMonthStr);
    
    const monthIncome = monthTransactions
      .filter(t => t.tipo === 'Entrada')
      .reduce((sum, t) => sum + t.valor, 0);

    const monthExpense = monthTransactions
      .filter(t => t.tipo === 'Saída')
      .reduce((sum, t) => sum + t.valor, 0);

    // Entradas por método no mês atual
    const pixIncome = monthTransactions
      .filter(t => t.tipo === 'Entrada' && t.metodo === 'Pix')
      .reduce((sum, t) => sum + t.valor, 0);

    const cashIncome = monthTransactions
      .filter(t => t.tipo === 'Entrada' && t.metodo === 'Espécie')
      .reduce((sum, t) => sum + t.valor, 0);

    // Saldo Total Acumulado (Para o próximo mês)
    const totalIncome = transactions
      .filter(t => t.tipo === 'Entrada')
      .reduce((sum, t) => sum + t.valor, 0);
    const totalExpense = transactions
      .filter(t => t.tipo === 'Saída')
      .reduce((sum, t) => sum + t.valor, 0);
    const totalBalance = totalIncome - totalExpense;

    return {
      monthIncome,
      monthExpense,
      totalBalance,
      pixIncome,
      cashIncome,
      currentMonthStr
    };
  }, [transactions]);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Resumo de Indicadores</h1>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" />
            <p className="text-blue-700 dark:text-blue-400 font-bold text-sm uppercase tracking-wider">Competência: {stats.currentMonthStr}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card: Entradas do Mês */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border-b-8 border-blue-700 dark:border-blue-600 flex flex-col justify-between transition-all hover:shadow-xl group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp size={32} strokeWidth={2.5} />
            </div>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-full">Mensal</span>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Entradas {stats.currentMonthStr}</p>
            <h2 className="text-3xl font-black text-blue-900 dark:text-blue-100">{formatCurrency(stats.monthIncome)}</h2>
          </div>
        </div>

        {/* Card: Saídas do Mês */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border-b-8 border-yellow-400 dark:border-yellow-500 flex flex-col justify-between transition-all hover:shadow-xl group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingDown size={32} strokeWidth={2.5} />
            </div>
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-full">Mensal</span>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Saídas {stats.currentMonthStr}</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-slate-100">{formatCurrency(stats.monthExpense)}</h2>
          </div>
        </div>

        {/* Card: Saldo Próximo Mês */}
        <div className="bg-blue-900 dark:bg-blue-800 p-8 rounded-[32px] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 text-white group-hover:scale-125 transition-transform duration-700">
            <Wallet size={160} />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-4 bg-white/10 text-yellow-400 rounded-2xl">
              <ArrowRightCircle size={32} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-end">
               <span className="px-3 py-1 bg-yellow-400 text-blue-950 text-[10px] font-black uppercase tracking-widest rounded-full">Disponível</span>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-black text-blue-300 dark:text-blue-200 uppercase tracking-widest mb-1">Para o Próximo Mês</p>
            <h2 className="text-3xl font-black text-white">{formatCurrency(stats.totalBalance)}</h2>
          </div>
        </div>

        {/* Card: PIX (Entradas) */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border-l-8 border-blue-600 dark:border-blue-500 flex items-center gap-6 transition-all hover:shadow-lg">
           <div className="p-5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-[24px]">
             <Smartphone size={36} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Entradas via PIX</p>
             <h3 className="text-2xl font-black text-blue-900 dark:text-blue-100">{formatCurrency(stats.pixIncome)}</h3>
             <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase mt-1">Transferências Digitais</p>
           </div>
        </div>

        {/* Card: Espécie (Entradas) */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border-l-8 border-yellow-400 dark:border-yellow-500 flex items-center gap-6 transition-all hover:shadow-lg">
           <div className="p-5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-[24px]">
             <Banknote size={36} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Entradas em Espécie</p>
             <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100">{formatCurrency(stats.cashIncome)}</h3>
             <p className="text-[9px] font-bold text-yellow-600 dark:text-yellow-500 uppercase mt-1">Dinheiro em Caixa</p>
           </div>
        </div>

        {/* Card Informativo: Total de Operações */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-8 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-6">
           <div className="p-5 bg-white dark:bg-slate-900 text-slate-400 rounded-[24px] shadow-sm">
             <Clock size={36} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume de Operações</p>
             <h3 className="text-2xl font-black text-slate-600 dark:text-slate-300">{transactions.length}</h3>
             <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Lançamentos Processados</p>
           </div>
        </div>
      </div>
      
      {/* Mensagem de Rodapé */}
      <div className="text-center py-6">
         <p className="text-[10px] font-black text-gray-300 dark:text-slate-700 uppercase tracking-[0.3em]">Gestão Financeira • 3IPI Natal • Natal/RN</p>
      </div>
    </div>
  );
};

export default Cards;
