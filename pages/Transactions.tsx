
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Filter, Download, Upload, Trash2, Edit3, 
  FileText, X, Save, Image as ImageIcon,
  CheckCircle2, Hash, RotateCcw, FileSpreadsheet,
  ChevronLeft, ChevronRight, ListOrdered, AlertTriangle,
  Calculator, ArrowUpRight, ArrowDownRight, PieChart, Printer
} from 'lucide-react';
import { 
  getTransactions, 
  saveTransaction, 
  deleteTransaction,
  importTransactions
} from '../services/storage';
import { Transaction, PaymentMethod, TransactionType } from '../types';
import { MONTHS } from '../constants';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de filtro
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterMethod, setFilterMethod] = useState<string>('Todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingComprovante, setViewingComprovante] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  
  // Estado para exclusão
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    movimento: '',
    tipo: 'Entrada',
    valor: 0,
    metodo: 'Pix',
    data: new Date().toISOString().split('T')[0],
    mes: MONTHS[new Date().getMonth()],
    responsavel: '',
    comprovante: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Resetar para a primeira página quando houver busca ou filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterMethod, startDate, endDate]);

  const loadData = () => {
    const data = getTransactions();
    setTransactions([...data]);
  };

  // Filtragem dos dados (Memoized para performance)
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => 
      t.movimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toString().includes(searchTerm)
    );

    if (filterType !== 'Todos') result = result.filter(t => t.tipo === filterType);
    if (filterMethod !== 'Todos') result = result.filter(t => t.metodo === filterMethod);
    if (startDate) result = result.filter(t => t.data >= startDate);
    if (endDate) result = result.filter(t => t.data <= endDate);

    return result;
  }, [transactions, searchTerm, filterType, filterMethod, startDate, endDate]);

  // Cálculo de Relatório Consolidado Mensal
  const monthlyConsolidated = useMemo(() => {
    const groups: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      if (!groups[t.mes]) {
        groups[t.mes] = { income: 0, expense: 0 };
      }
      if (t.tipo === 'Entrada') {
        groups[t.mes].income += t.valor;
      } else {
        groups[t.mes].expense += t.valor;
      }
    });

    // Ordenar baseado na ordem dos meses em MONTHS
    return Object.entries(groups)
      .sort((a, b) => MONTHS.indexOf(a[0]) - MONTHS.indexOf(b[0]))
      .map(([month, totals]) => ({
        month,
        ...totals,
        balance: totals.income - totals.expense
      }));
  }, [transactions]);

  // Cálculo de Paginação
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  
  // Ajuste automático caso a página atual se torne inválida (após exclusão)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handleOpenModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({ ...transaction });
    } else {
      const lastId = transactions.length > 0 
        ? Math.max(...transactions.map(t => parseInt(t.id) || 0)) 
        : 0;
      const nextId = (lastId + 1).toString();

      setEditingTransaction(null);
      setFormData({
        id: nextId,
        movimento: '',
        tipo: 'Entrada',
        valor: 0,
        metodo: 'Pix',
        data: new Date().toISOString().split('T')[0],
        mes: MONTHS[new Date().getMonth()],
        responsavel: '',
        comprovante: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, comprovante: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newEntries: Transaction[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].includes(';') ? lines[i].split(';') : lines[i].split(',');
        
        if (columns.length >= 7) {
          const valorLimpo = columns[3].replace('R$', '').replace('"', '').replace('.', '').replace(',', '.').trim();
          newEntries.push({
            id: (Date.now() + i).toString(),
            movimento: columns[1].replace(/"/g, ''),
            tipo: columns[2] as TransactionType,
            valor: parseFloat(valorLimpo) || 0,
            metodo: columns[4] as PaymentMethod,
            data: columns[5],
            mes: columns[6],
            responsavel: columns[7]?.replace(/"/g, '').trim() || 'Importado',
            comprovante: ''
          });
        }
      }

      if (newEntries.length > 0) {
        const currentData = getTransactions();
        importTransactions([...currentData, ...newEntries]);
        loadData();
        alert(`${newEntries.length} lançamentos importados com sucesso!`);
      } else {
        alert("Nenhum dado válido encontrado no CSV.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.movimento || formData.valor === undefined || !formData.responsavel) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const newTransaction: Transaction = {
      ...formData as Transaction,
      valor: Number(formData.valor)
    };
    
    saveTransaction(newTransaction);
    loadData();
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsModalOpen(false);
    }, 1200);
  };

  const openDeleteConfirmation = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      loadData();
      setTransactionToDelete(null);
    }
  };

  const clearFilters = () => {
    setFilterType('Todos');
    setFilterMethod('Todos');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportToCSV = () => {
    const headers = ['Id', 'Movimento', 'Tipo', 'Valor', 'Método', 'Data', 'Mês', 'Responsável'];
    const rows = filteredTransactions.map(t => [
      t.id,
      `"${t.movimento.replace(/"/g, '""')}"`,
      t.tipo,
      t.valor.toFixed(2).replace('.', ','),
      t.metodo,
      t.data,
      t.mes,
      `"${t.responsavel.replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_3ipi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalIn = filteredTransactions.filter(t => t.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
    const totalOut = filteredTransactions.filter(t => t.tipo === 'Saída').reduce((acc, curr) => acc + curr.valor, 0);
    const balance = totalIn - totalOut;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Financeiro - 3IPI Natal</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 4px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
          .header h1 { color: #1e40af; margin: 0; text-transform: uppercase; font-size: 24px; }
          .header p { color: #666; margin: 5px 0 0; font-weight: bold; }
          
          .info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 12px; }
          .filters { background: #f3f4f6; padding: 15px; rounded: 10px; flex: 1; margin-right: 20px; }
          .filters h3 { margin: 0 0 10px; font-size: 10px; color: #1e40af; text-transform: uppercase; }
          
          .summary { background: #1e40af; color: white; padding: 15px; border-radius: 10px; min-width: 200px; }
          .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .summary-item.total { border-top: 1px solid rgba(255,255,255,0.3); padding-top: 5px; margin-top: 5px; font-weight: bold; }

          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
          th { background: #1e40af; color: white; padding: 10px; text-align: left; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .val-in { color: #15803d; font-weight: bold; }
          .val-out { color: #b91c1c; font-weight: bold; }
          
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Igreja 3IPI de Natal</h1>
          <p>Relatório Financeiro de Tesouraria</p>
        </div>

        <div class="info">
          <div class="filters">
            <h3>Filtros Aplicados</h3>
            <div><strong>Tipo:</strong> ${filterType}</div>
            <div><strong>Método:</strong> ${filterMethod}</div>
            <div><strong>Período:</strong> ${startDate || 'Início'} até ${endDate || 'Hoje'}</div>
            <div><strong>Busca:</strong> ${searchTerm || 'Nenhuma'}</div>
          </div>
          <div class="summary">
            <div class="summary-item"><span>Entradas:</span> <span>${formatCurrency(totalIn)}</span></div>
            <div class="summary-item"><span>Saídas:</span> <span>${formatCurrency(totalOut)}</span></div>
            <div class="summary-item total"><span>Saldo:</span> <span>${formatCurrency(balance)}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Método</th>
              <th>Valor</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map(t => `
              <tr>
                <td>#${t.id}</td>
                <td>${new Date(t.data).toLocaleDateString('pt-BR')}</td>
                <td>${t.movimento}</td>
                <td>${t.tipo}</td>
                <td>${t.metodo}</td>
                <td class="${t.tipo === 'Entrada' ? 'val-in' : 'val-out'}">${formatCurrency(t.valor)}</td>
                <td>${t.responsavel}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; font-size: 10px; text-align: right; color: #999;">
          Relatório gerado em: ${new Date().toLocaleString('pt-BR')}
        </div>

        <script>
          window.onload = function() { 
            window.print();
            window.onafterprint = function() { window.close(); }
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lançamentos Financeiros</h1>
          <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider">3IPI Natal - Gestão de Tesouraria</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => handleOpenModal()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-800 text-white px-5 py-3.5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl active:scale-95 border-b-4 border-blue-950"
          >
            <Plus size={20} strokeWidth={3} />
            ADICIONAR
          </button>
          
          <button 
            onClick={() => setShowMonthlyReport(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-yellow-400 text-blue-900 px-5 py-3.5 rounded-2xl font-black hover:bg-yellow-300 transition-all shadow-xl active:scale-95 border-b-4 border-yellow-600"
          >
            <Calculator size={20} strokeWidth={3} />
            CONSOLIDADO
          </button>

          <div className="flex gap-2">
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 bg-white border-2 border-blue-100 rounded-2xl text-blue-800 hover:bg-blue-50 shadow-md transition-all active:scale-95 flex items-center gap-2"
              title="Importar CSV"
            >
              <FileSpreadsheet size={24} />
              <span className="hidden lg:block font-bold text-xs uppercase">Importar</span>
            </button>

            <button 
              onClick={exportToPDF}
              disabled={filteredTransactions.length === 0}
              className="p-3.5 bg-white border-2 border-blue-100 rounded-2xl text-blue-800 hover:bg-blue-50 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center gap-2"
              title="Gerar Relatório PDF"
            >
              <Printer size={24} />
              <span className="hidden lg:block font-bold text-xs uppercase">Relatório</span>
            </button>

            <button 
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
              className="p-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-700 hover:bg-gray-50 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center gap-2"
              title="Exportar CSV"
            >
              <Download size={24} />
              <span className="hidden lg:block font-bold text-xs uppercase">CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar por descrição, ID ou responsável..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-0 outline-none transition-all text-gray-900 font-bold placeholder-gray-400 bg-gray-50/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={`flex items-center gap-2 px-8 py-4 font-black rounded-2xl transition-all w-full md:w-auto justify-center ${isFilterVisible ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Filter size={20} />
            {isFilterVisible ? 'OCULTAR FILTROS' : 'FILTROS AVANÇADOS'}
          </button>
        </div>

        {isFilterVisible && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest px-1">Tipo</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none font-bold text-gray-800 bg-gray-50">
                <option value="Todos">Todos os Tipos</option>
                <option value="Entrada">Entradas (+)</option>
                <option value="Saída">Saídas (-)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest px-1">Método</label>
              <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none font-bold text-gray-800 bg-gray-50">
                <option value="Todos">Todos os Meios</option>
                <option value="Pix">Pix</option>
                <option value="Espécie">Espécie</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest px-1">De (Data Inicial)</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none font-bold text-gray-800 bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest px-1">Até (Data Final)</label>
              <div className="flex gap-2">
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none font-bold text-gray-800 bg-gray-50" />
                <button onClick={clearFilters} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Limpar Filtros"><RotateCcw size={20} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest">ID / Período</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest">Descrição do Movimento</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest">Tipo / Pagamento</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-right">Valor Líquido</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-center">Docs</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.length > 0 ? paginatedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">#{t.id}</span>
                      <div className="text-sm text-gray-900 font-bold">{new Date(t.data).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-base font-bold text-gray-900 truncate">{t.movimento}</div>
                    <div className="text-[11px] text-blue-600 font-black uppercase tracking-tighter">{t.responsavel} • {t.mes}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <span className={`w-fit px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${t.tipo === 'Entrada' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {t.tipo}
                      </span>
                      <span className="text-[11px] text-gray-500 font-black uppercase">{t.metodo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={`text-base font-black ${t.tipo === 'Entrada' ? 'text-blue-800' : 'text-red-700'}`}>
                      {formatCurrency(t.valor)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {t.comprovante ? (
                      <button 
                        onClick={() => setViewingComprovante(t.comprovante || null)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                        title="Ver Comprovante"
                      >
                        <ImageIcon size={20} />
                      </button>
                    ) : (
                      <span className="text-gray-300 font-light">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleOpenModal(t)} className="p-2.5 bg-gray-100 text-blue-800 rounded-xl hover:bg-blue-800 hover:text-white transition-all shadow-sm" title="Editar Registro"><Edit3 size={18} /></button>
                      <button onClick={() => openDeleteConfirmation(t)} className="p-2.5 bg-gray-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Excluir Registro"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-gray-300">
                      <FileText size={64} strokeWidth={1} />
                      <p className="font-black uppercase tracking-widest text-gray-400">Nenhum lançamento encontrado com esses filtros</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO UI */}
        {filteredTransactions.length > 0 && (
          <div className="px-6 py-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Exibir <span className="text-blue-900">{itemsPerPage}</span> de {filteredTransactions.length} registros
              </div>
              <div className="flex items-center gap-2">
                <ListOrdered size={14} className="text-blue-800" />
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border-2 border-gray-100 rounded-lg px-2 py-1 text-xs font-black text-blue-900 focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-blue-500 hover:text-blue-800 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-400 transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-xl font-black text-sm transition-all shadow-sm ${currentPage === pageNum ? 'bg-blue-800 text-white scale-110 shadow-blue-200' : 'bg-white text-gray-500 border-2 border-gray-100 hover:border-blue-200 hover:text-blue-800'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-blue-500 hover:text-blue-800 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-400 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL RELATÓRIO MENSAL CONSOLIDADO */}
      {showMonthlyReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-blue-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden border-4 border-white">
             <div className="bg-blue-900 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-400 rounded-2xl text-blue-900">
                    <PieChart size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Consolidado Mensal</h2>
                    <p className="text-blue-300 text-xs font-bold uppercase tracking-widest">Resumo Geral por Competência</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMonthlyReport(false)}
                  className="p-2 bg-blue-800 hover:bg-red-600 rounded-2xl transition-all shadow-lg"
                >
                  <X size={28} />
                </button>
             </div>

             <div className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 p-5 rounded-3xl border-2 border-blue-100">
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-1">Média de Receitas</span>
                    <span className="text-xl font-black text-blue-800">
                      {formatCurrency(monthlyConsolidated.reduce((acc, curr) => acc + curr.income, 0) / (monthlyConsolidated.length || 1))}
                    </span>
                  </div>
                  <div className="bg-red-50 p-5 rounded-3xl border-2 border-red-100">
                    <span className="text-[10px] font-black text-red-900 uppercase tracking-widest block mb-1">Média de Despesas</span>
                    <span className="text-xl font-black text-red-700">
                      {formatCurrency(monthlyConsolidated.reduce((acc, curr) => acc + curr.expense, 0) / (monthlyConsolidated.length || 1))}
                    </span>
                  </div>
                  <div className="bg-yellow-50 p-5 rounded-3xl border-2 border-yellow-100">
                    <span className="text-[10px] font-black text-yellow-900 uppercase tracking-widest block mb-1">Meses Ativos</span>
                    <span className="text-xl font-black text-blue-900">{monthlyConsolidated.length}</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b-2 border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-500 tracking-widest">Competência</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase text-green-600 tracking-widest text-right">Entradas</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase text-red-600 tracking-widest text-right">Saídas</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase text-blue-900 tracking-widest text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {monthlyConsolidated.length > 0 ? monthlyConsolidated.map((m) => (
                        <tr key={m.month} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-black text-gray-900 uppercase">{m.month}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-green-700">{formatCurrency(m.income)}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-red-700">{formatCurrency(m.expense)}</td>
                          <td className={`px-6 py-4 text-right font-black ${m.balance >= 0 ? 'text-blue-800' : 'text-red-900'}`}>
                            <div className="flex items-center justify-end gap-2">
                              {formatCurrency(m.balance)}
                              {m.balance >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-bold">Nenhum dado consolidado disponível.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>

             <div className="p-8 bg-gray-50 border-t-2 border-gray-100 flex justify-end">
                <button 
                  onClick={() => setShowMonthlyReport(false)}
                  className="px-8 py-3 bg-blue-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20"
                >
                  Fechar Relatório
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-blue-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border-4 border-red-100">
            <div className="bg-red-600 p-6 text-white flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Atenção: Exclusão</h2>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-gray-600 font-bold leading-relaxed">
                  Tem certeza que deseja excluir este lançamento permanentemente?
                </p>
                
                <div className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</span>
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">#ID {transactionToDelete.id}</span>
                  </div>
                  <p className="text-gray-900 font-black text-lg">{transactionToDelete.movimento}</p>
                  
                  <div className="pt-2 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Valor</span>
                      <span className={`text-xl font-black ${transactionToDelete.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transactionToDelete.valor)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Data</span>
                      <span className="text-sm font-bold text-gray-700">{new Date(transactionToDelete.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setTransactionToDelete(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 uppercase tracking-widest text-xs border-b-4 border-red-800 active:translate-y-1 active:border-b-0"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE COMPROVANTE */}
      {viewingComprovante && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-blue-950/90 backdrop-blur-xl p-4 md:p-10"
          onClick={() => setViewingComprovante(null)}
        >
          <div className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center gap-4">
            <div className="w-full flex justify-between items-center text-white mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400 rounded-xl text-blue-900">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest">Documento Digital</h3>
                  <p className="text-xs text-blue-300 font-bold">Comprovante de Lançamento 3IPI</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingComprovante(null)}
                className="p-3 bg-white/10 hover:bg-red-600 rounded-full transition-all group"
              >
                <X size={32} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div 
              className="relative flex-1 w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border-8 border-white/10 flex items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={viewingComprovante} 
                alt="Comprovante" 
                className="max-w-full max-h-full object-contain rounded-[30px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-lg overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-auto border-4 border-white">
            {showSuccess ? (
              <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-200">
                  <CheckCircle2 size={56} strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Sucesso Total!</h2>
                  <p className="text-gray-500 font-bold mt-2">Dados processados e salvos no sistema.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-blue-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                      <FileText size={28} className="text-yellow-400" />
                      {editingTransaction ? 'EDITAR LANÇAMENTO' : 'NOVO REGISTRO'}
                    </h2>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-3 py-1 bg-yellow-400 text-blue-900 rounded-full text-xs font-black flex items-center gap-1 shadow-sm">
                        <Hash size={12} strokeWidth={3} />
                        ID SISTEMA: {formData.id}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="relative z-10 p-2 bg-blue-800 hover:bg-red-600 rounded-2xl transition-all shadow-lg group">
                    <X size={32} className="group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>DESCRIÇÃO DO MOVIMENTO *</label>
                    <input type="text" className="w-full px-6 py-5 rounded-[20px] border-4 border-gray-100 focus:border-blue-600 focus:bg-white outline-none transition-all text-gray-900 font-black text-lg placeholder-gray-300 bg-gray-50/50" value={formData.movimento} onChange={(e) => setFormData({...formData, movimento: e.target.value})} placeholder="Ex: DIZIMOS E OFERTAS - DOMINGO" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>FLUXO DE CAIXA *</label>
                    <div className="flex p-1.5 bg-gray-100 rounded-2xl gap-2">
                      <button type="button" onClick={() => setFormData({...formData, tipo: 'Entrada'})} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all tracking-widest border-2 ${formData.tipo === 'Entrada' ? 'bg-green-600 border-green-700 text-white shadow-xl' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}>ENTRADA (+)</button>
                      <button type="button" onClick={() => setFormData({...formData, tipo: 'Saída'})} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all tracking-widest border-2 ${formData.tipo === 'Saída' ? 'bg-red-600 border-red-700 text-white shadow-xl' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}>SAÍDA (-)</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>VALOR MONETÁRIO *</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-blue-800 text-xl">R$</span>
                      <input type="number" step="0.01" className="w-full pl-16 pr-6 py-5 rounded-[20px] border-4 border-gray-100 focus:border-blue-600 outline-none transition-all text-blue-900 font-black text-2xl bg-gray-50/50" value={formData.valor} onChange={(e) => setFormData({...formData, valor: parseFloat(e.target.value) || 0})} required />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>MEIO DE PAGAMENTO</label>
                    <select className="w-full px-6 py-4 rounded-2xl border-4 border-gray-100 focus:border-blue-600 outline-none transition-all text-gray-900 font-black bg-gray-50/50 cursor-pointer appearance-none" value={formData.metodo} onChange={(e) => setFormData({...formData, metodo: e.target.value as PaymentMethod})}>
                      <option value="Pix">PIX - IMEDIATO</option>
                      <option value="Espécie">ESPÉCIE - DINHEIRO</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>DATA DA OPERAÇÃO *</label>
                    <input type="date" className="w-full px-6 py-4 rounded-2xl border-4 border-gray-100 focus:border-blue-600 outline-none transition-all text-gray-900 font-black bg-gray-50/50" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>COMPETÊNCIA (MÊS)</label>
                    <select className="w-full px-6 py-4 rounded-2xl border-4 border-gray-100 focus:border-blue-600 outline-none transition-all text-gray-900 font-black bg-gray-50/50 cursor-pointer appearance-none" value={formData.mes} onChange={(e) => setFormData({...formData, mes: e.target.value})}>
                      {MONTHS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>RESPONSÁVEL *</label>
                    <input type="text" className="w-full px-6 py-4 rounded-2xl border-4 border-gray-100 focus:border-blue-600 outline-none transition-all text-gray-900 font-black bg-gray-50/50 uppercase placeholder-gray-300" value={formData.responsavel} onChange={(e) => setFormData({...formData, responsavel: e.target.value})} placeholder="NOME DO TESOUREIRO" required />
                  </div>
                  <div className="md:col-span-2 space-y-3 mt-4">
                    <label className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>ANEXO DE COMPROVANTE (JPG/PNG)</label>
                    <div className="flex items-center gap-6">
                      <label className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-blue-100 rounded-[30px] p-8 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group relative overflow-hidden">
                        <Upload className="text-blue-400 group-hover:text-blue-600 mb-3 transition-colors" size={36} strokeWidth={3} />
                        <span className="text-xs font-black text-blue-900 uppercase tracking-widest">{formData.comprovante ? 'SUBSTITUIR DOCUMENTO' : 'CLIQUE PARA ANEXAR'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                      {formData.comprovante && (
                        <div className="relative group/img w-32 h-32 rounded-[30px] overflow-hidden border-4 border-blue-100 shadow-xl ring-8 ring-blue-50">
                          <img src={formData.comprovante} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setFormData({...formData, comprovante: ''})} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <X size={32} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 mt-12 flex gap-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-2xl border-4 border-gray-100 font-black text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all uppercase tracking-widest active:scale-95">DESCARTAR</button>
                    <button type="submit" className="flex-[2] py-5 rounded-2xl bg-blue-900 text-white font-black uppercase tracking-[0.2em] hover:bg-blue-800 shadow-2xl shadow-blue-900/40 transition-all flex items-center justify-center gap-4 active:scale-95 border-b-8 border-blue-950">
                      <Save size={24} className="text-yellow-400" strokeWidth={3} />
                      {editingTransaction ? 'ATUALIZAR DADOS' : 'FINALIZAR REGISTRO'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
