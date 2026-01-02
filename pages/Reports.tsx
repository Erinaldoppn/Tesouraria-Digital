
import React, { useMemo, useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Filter, 
  Church, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { getTransactions } from '../services/storage';
import { MONTHS } from '../constants';
import { Transaction } from '../types';

const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const load = async () => {
      const data = await getTransactions();
      setTransactions(data);
    };
    load();
  }, []);

  const reportData = useMemo(() => {
    const filtered = transactions.filter(t => 
      t.mes === selectedMonth && 
      new Date(t.data).getFullYear().toString() === selectedYear
    );

    const generalIncome = filtered.filter(t => t.tipo === 'Entrada').reduce((s, t) => s + t.valor, 0);
    const generalExpense = filtered.filter(t => t.tipo === 'Saída').reduce((s, t) => s + t.valor, 0);
    const projectIncome = filtered.filter(t => t.tipo === 'Entrada (Projeto)').reduce((s, t) => s + t.valor, 0);
    const projectExpense = filtered.filter(t => t.tipo === 'Saída (Projeto)').reduce((s, t) => s + t.valor, 0);

    // Agrupamento por projeto
    const projects = Array.from(new Set(filtered.filter(t => t.projeto).map(t => t.projeto)));
    const projectSummary = projects.map(p => ({
      name: p,
      income: filtered.filter(t => t.projeto === p && t.tipo === 'Entrada (Projeto)').reduce((s, t) => s + t.valor, 0),
      expense: filtered.filter(t => t.projeto === p && t.tipo === 'Saída (Projeto)').reduce((s, t) => s + t.valor, 0),
    }));

    return {
      filtered,
      generalIncome,
      generalExpense,
      projectIncome,
      projectExpense,
      totalBalance: (generalIncome + projectIncome) - (generalExpense + projectExpense),
      projectSummary
    };
  }, [transactions, selectedMonth, selectedYear]);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Filtros e Ações */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Relatório Formal</h1>
          <p className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mt-1">Prestação de Contas Mensal</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1 border border-gray-100 dark:border-slate-800 shadow-sm">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent px-4 py-2 font-bold text-xs uppercase outline-none"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent px-4 py-2 font-bold text-xs uppercase border-l dark:border-slate-800 outline-none"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="bg-blue-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-blue-800 transition-all border-b-4 border-blue-950 active:scale-95"
          >
            <Printer size={18} /> Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Documento do Relatório (Otimizado para Print) */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-800 p-8 md:p-12 print:shadow-none print:border-none print:p-0">
        
        {/* Cabeçalho do Documento */}
        <div className="flex justify-between items-start border-b-4 border-blue-900 pb-8 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-yellow-400 rounded-3xl text-blue-900 shadow-lg">
              <Church size={40} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-900 dark:text-white uppercase tracking-tighter">Igreja 3IPI Natal</h2>
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">3ª Igreja Presbiteriana Independente de Natal</p>
              <p className="text-[10px] text-gray-400 font-medium">CNPJ: 00.000.000/0001-00</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl inline-block mb-2">
              <p className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest">Mês de Competência</p>
              <p className="text-lg font-black text-blue-900 dark:text-white">{selectedMonth} / {selectedYear}</p>
            </div>
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400 mb-4">
              <TrendingUp size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Resumo de Entradas</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
                <span className="text-sm font-bold text-gray-600 dark:text-slate-400 uppercase">Dízimos e Ofertas (Geral)</span>
                <span className="font-black text-blue-700 dark:text-blue-400">{formatCurrency(reportData.generalIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
                <span className="text-sm font-bold text-gray-600 dark:text-slate-400 uppercase">Entradas de Projetos</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(reportData.projectIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-blue-50/50 dark:bg-blue-900/10 px-4 rounded-xl">
                <span className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest">Receita Total</span>
                <span className="text-lg font-black text-blue-900 dark:text-blue-100">{formatCurrency(reportData.generalIncome + reportData.projectIncome)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
              <TrendingDown size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm">Resumo de Saídas</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                <span className="text-sm font-bold text-gray-600 dark:text-slate-400 uppercase">Despesas Operacionais</span>
                <span className="font-black text-red-600 dark:text-red-400">{formatCurrency(reportData.generalExpense)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                <span className="text-sm font-bold text-gray-600 dark:text-slate-400 uppercase">Despesas de Projetos</span>
                <span className="font-black text-red-600 dark:text-red-400">{formatCurrency(reportData.projectExpense)}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-red-50/50 dark:bg-red-900/10 px-4 rounded-xl">
                <span className="text-xs font-black text-red-900 dark:text-red-300 uppercase tracking-widest">Despesa Total</span>
                <span className="text-lg font-black text-red-900 dark:text-red-100">{formatCurrency(reportData.generalExpense + reportData.projectExpense)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhamento de Projetos */}
        {reportData.projectSummary.length > 0 && (
          <div className="mb-12">
            <div className="bg-indigo-900 text-white p-6 rounded-3xl mb-6 flex justify-between items-center">
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm">Fundo de Projetos e Eventos</h3>
                <p className="text-[10px] text-indigo-300 font-bold uppercase mt-1">Recursos com destinação específica</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-indigo-300">Saldo Isento</p>
                <p className="text-xl font-black">{formatCurrency(reportData.projectIncome - reportData.projectExpense)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.projectSummary.map(proj => (
                <div key={proj.name} className="border-2 border-gray-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-blue-900 dark:text-white uppercase text-xs">{proj.name}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${proj.income >= proj.expense ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {proj.income >= proj.expense ? 'Superavitário' : 'Déficit'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>Entradas: {formatCurrency(proj.income)}</span>
                    <span>Saídas: {formatCurrency(proj.expense)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (proj.expense / proj.income) * 100 || 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auditoria / Assinaturas */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 px-10">
          <div className="text-center border-t-2 border-gray-200 dark:border-slate-700 pt-4">
            <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Tesouraria 3IPI</p>
            <div className="h-10"></div>
            <p className="text-[8px] text-gray-400 font-bold">Assinatura do Tesoureiro</p>
          </div>
          <div className="text-center border-t-2 border-gray-200 dark:border-slate-700 pt-4">
            <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Secretaria do Conselho</p>
            <div className="h-10"></div>
            <p className="text-[8px] text-gray-400 font-bold">Assinatura do Secretário</p>
          </div>
          <div className="text-center border-t-2 border-gray-200 dark:border-slate-700 pt-4">
            <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Ministério Pastoral</p>
            <div className="h-10"></div>
            <p className="text-[8px] text-gray-400 font-bold">Assinatura do Pastor</p>
          </div>
        </div>

        {/* Rodapé Final */}
        <div className="mt-20 text-center space-y-2 opacity-50">
          <div className="flex justify-center items-center gap-2 text-blue-900 dark:text-white">
            <Info size={14} />
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">Documento gerado eletronicamente em {new Date().toLocaleString('pt-BR')}</p>
          </div>
          <p className="text-[8px] font-bold text-gray-400 uppercase">O saldo operacional de {formatCurrency(reportData.generalIncome - reportData.generalExpense)} não considera os fundos de projetos.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
