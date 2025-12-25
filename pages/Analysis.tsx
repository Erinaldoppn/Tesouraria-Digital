
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LabelList, Legend
} from 'recharts';
import { 
  Printer, 
  ArrowDownUp, 
  CalendarDays, 
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  LineChart as LineChartIcon
} from 'lucide-react';
import { getTransactions } from '../services/storage';
import { MONTHS, COLORS } from '../constants';

const Analysis: React.FC = () => {
  const transactions = getTransactions();
  const currentMonthStr = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Dados para o Ranking do Mês Atual
  const monthlyData = useMemo(() => {
    return transactions
      .filter(t => t.mes === currentMonthStr && new Date(t.data).getFullYear() === currentYear)
      .sort((a, b) => a.valor - b.valor);
  }, [transactions, currentMonthStr, currentYear]);

  // Dados para o Gráfico Comparativo Anual
  const annualEvolutionData = useMemo(() => {
    return MONTHS.map(month => {
      const monthTransactions = transactions.filter(t => 
        t.mes === month && new Date(t.data).getFullYear() === currentYear
      );
      
      const entradas = monthTransactions
        .filter(t => t.tipo === 'Entrada')
        .reduce((sum, t) => sum + t.valor, 0);
        
      const saidas = monthTransactions
        .filter(t => t.tipo === 'Saída')
        .reduce((sum, t) => sum + t.valor, 0);

      return {
        name: month.substring(0, 3), // Abreviação Jan, Fev...
        fullName: month,
        Entradas: entradas,
        Saídas: saidas
      };
    });
  }, [transactions, currentYear]);

  const incomes = useMemo(() => monthlyData.filter(t => t.tipo === 'Entrada'), [monthlyData]);
  const expenses = useMemo(() => monthlyData.filter(t => t.tipo === 'Saída'), [monthlyData]);

  const stats = useMemo(() => {
    const incomeTotal = incomes.reduce((s, t) => s + t.valor, 0);
    const expenseTotal = expenses.reduce((s, t) => s + t.valor, 0);
    return { incomeTotal, expenseTotal, balance: incomeTotal - expenseTotal };
  }, [incomes, expenses]);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Análise de Valores</h1>
          <div className="flex items-center gap-2 mt-1">
            <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" />
            <p className="text-blue-700 dark:text-blue-400 font-bold text-sm uppercase tracking-wider">
              Relatório de {currentMonthStr} / {currentYear}
            </p>
          </div>
        </div>
        
        <button 
          type="button"
          onClick={handlePrint}
          className="print:hidden flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-800 transition-all shadow-xl active:scale-95 border-b-4 border-blue-950 uppercase text-xs tracking-widest"
        >
          <Printer size={18} /> Exportar PDF / Imprimir
        </button>
      </div>

      {/* Grid de Resumo do Mês */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entradas ({currentMonthStr})</p>
          <p className="text-xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(stats.incomeTotal)}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saídas ({currentMonthStr})</p>
          <p className="text-xl font-black text-red-600 dark:text-red-400">{formatCurrency(stats.expenseTotal)}</p>
        </div>
        <div className="p-4 bg-blue-900 text-white rounded-2xl">
          <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Saldo do Mês</p>
          <p className="text-xl font-black">{formatCurrency(stats.balance)}</p>
        </div>
      </div>

      {/* Gráfico de Evolução Anual */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 transition-colors print:shadow-none print:border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg">
            <LineChartIcon size={20} />
          </div>
          <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Evolução Anual (Entradas vs Saídas)</h2>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualEvolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                tickFormatter={(value) => `R$ ${value}`} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc', opacity: 0.1 }} 
                contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', padding: '12px' }} 
                formatter={(value: number) => [formatCurrency(value), '']} 
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
              <Bar dataKey="Entradas" fill="#1E40AF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saídas" fill="#FBBF24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Ranking do Mês */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 transition-colors print:shadow-none print:border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg">
            <ArrowDownUp size={20} />
          </div>
          <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Ranking Mensal (Menor p/ Maior)</h2>
        </div>
        
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyData} 
              layout="vertical" 
              margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="movimento" 
                type="category" 
                width={150} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc' }}
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
              />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={20}>
                {monthlyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.tipo === 'Entrada' ? '#1E40AF' : '#FBBF24'} 
                  />
                ))}
                <LabelList 
                  dataKey="valor" 
                  position="right" 
                  formatter={(v: number) => formatCurrency(v)}
                  style={{ fill: '#64748b', fontSize: '10px', fontWeight: 'bold' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Listagem Detalhada */}
      <div className="space-y-6 print:space-y-12">
        {/* Entradas */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-8 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Detalhamento: Entradas</h2>
            </div>
            <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-4 py-1.5 rounded-full uppercase tracking-widest">
              Total: {formatCurrency(stats.incomeTotal)}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-4">Descrição</th>
                  <th className="px-8 py-4">Data</th>
                  <th className="px-8 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {incomes.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-blue-300" />
                        <span className="font-bold text-gray-900 dark:text-white">{t.movimento}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{formatDateBR(t.data)}</span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-blue-800 dark:text-blue-400">
                      {formatCurrency(t.valor)}
                    </td>
                  </tr>
                ))}
                {incomes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-10 text-center text-gray-300 dark:text-slate-700 font-black uppercase tracking-widest text-xs">
                      Nenhuma entrada este mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-8 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
                <TrendingDown size={20} />
              </div>
              <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Detalhamento: Saídas</h2>
            </div>
            <span className="text-[10px] font-black bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 px-4 py-1.5 rounded-full uppercase tracking-widest">
              Total: {formatCurrency(stats.expenseTotal)}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-4">Descrição</th>
                  <th className="px-8 py-4">Data</th>
                  <th className="px-8 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {expenses.map((t) => (
                  <tr key={t.id} className="hover:bg-yellow-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-yellow-400" />
                        <span className="font-bold text-gray-900 dark:text-white">{t.movimento}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{formatDateBR(t.data)}</span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-red-600 dark:text-red-400">
                      {formatCurrency(t.valor)}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-10 text-center text-gray-300 dark:text-slate-700 font-black uppercase tracking-widest text-xs">
                      Nenhuma saída este mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assinaturas para o PDF */}
      <div className="hidden print:grid grid-cols-2 gap-20 mt-20 px-10">
        <div className="text-center border-t-2 border-slate-300 pt-4">
          <p className="text-[10px] font-black uppercase text-slate-500">Tesouraria 3IPI</p>
          <p className="text-[8px] text-slate-400 mt-1">Conferido em: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="text-center border-t-2 border-slate-300 pt-4">
          <p className="text-[10px] font-black uppercase text-slate-500">Conselho da Igreja</p>
          <p className="text-[8px] text-slate-400 mt-1">Aprovação de Contas</p>
        </div>
      </div>

      {/* Rodapé de Documento */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 text-center py-4 border-t border-gray-100">
         <p className="text-[8px] text-gray-400 uppercase tracking-widest">3IPI Natal - Relatório Gerencial Gerado via Tesouraria Digital</p>
      </div>
    </div>
  );
};

export default Analysis;
