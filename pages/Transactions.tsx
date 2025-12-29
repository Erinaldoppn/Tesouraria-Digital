
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Trash2, Edit3, X, Image as ImageIcon,
  CheckCircle2, FileSpreadsheet,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle,
  Printer, Eye, Lock, Paperclip, FileUp, MessageSquare, Target, Download
} from 'lucide-react';
import { 
  getTransactions, 
  saveTransaction, 
  deleteTransaction,
  importTransactions,
  getCurrentUser
} from '../services/storage';
import { Transaction, PaymentMethod, TransactionType } from '../types';
import { MONTHS } from '../constants';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const [filterType, setFilterType] = useState<string>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingComprovante, setViewingComprovante] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'dados' | 'comprovante'>('dados');

  const [formData, setFormData] = useState<Partial<Transaction>>({
    movimento: '',
    tipo: 'Entrada',
    valor: 0,
    metodo: 'Pix',
    data: new Date().toISOString().split('T')[0],
    mes: MONTHS[new Date().getMonth()],
    responsavel: '',
    projeto: '',
    comprovante: '',
    observacoes: '',
  });

  useEffect(() => { loadData(); }, []);
  
  const loadData = () => { setTransactions([...getTransactions()]); };

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => 
      t.movimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.projeto && t.projeto.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (filterType !== 'Todos') result = result.filter(t => t.tipo === filterType);
    return result.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transactions, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenModal = (transaction?: Transaction) => {
    if (!isAdmin && transaction) {
      setEditingTransaction(transaction);
      setFormData({ ...transaction });
      setIsModalOpen(true);
      return;
    }
    if (!isAdmin) return;
    
    setActiveTab('dados');
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({ ...transaction });
    } else {
      setEditingTransaction(null);
      setFormData({
        id: (transactions.length + 1).toString(),
        movimento: '',
        tipo: 'Entrada',
        valor: 0,
        metodo: 'Pix',
        data: new Date().toISOString().split('T')[0],
        mes: MONTHS[new Date().getMonth()],
        responsavel: user?.name || '',
        projeto: '',
        comprovante: '',
        observacoes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, comprovante: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const newItems: Transaction[] = [];
        const existing = getTransactions();
        let nextId = existing.length > 0 ? Math.max(...existing.map(t => parseInt(t.id) || 0)) + 1 : 1;

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/[;,]/);
          if (cols.length >= 5) {
            newItems.push({
              id: (nextId++).toString(),
              movimento: cols[0]?.trim() || '',
              tipo: (cols[1]?.trim() as TransactionType) || 'Entrada',
              valor: parseFloat(cols[2]?.replace(',', '.')) || 0,
              metodo: (cols[3]?.trim() as PaymentMethod) || 'Pix',
              data: cols[4]?.trim() || new Date().toISOString().split('T')[0],
              mes: MONTHS[new Date().getMonth()],
              responsavel: 'Importado',
              projeto: cols[5]?.trim() || '',
              comprovante: ''
            });
          }
        }
        if (newItems.length > 0) {
          importTransactions([...existing, ...newItems]);
          loadData();
          alert(`${newItems.length} registros importados!`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    saveTransaction({ ...formData as Transaction, valor: Number(formData.valor) });
    loadData();
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setIsModalOpen(false); }, 1000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este lançamento permanentemente?')) {
      deleteTransaction(id);
      loadData();
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Lançamentos Financeiros</h1>
          <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Controle de Tesouraria 3IPI Natal</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Printer size={16} /> Relatório PDF
          </button>
          
          {isAdmin && (
            <>
              <button 
                onClick={() => csvInputRef.current?.click()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-slate-800 text-blue-800 dark:text-blue-400 px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-blue-50 transition-all shadow-sm active:scale-95"
              >
                <FileUp size={16} /> Importar CSV
              </button>
              <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
              
              <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-blue-800 transition-all border-b-4 border-blue-950 active:scale-95">
                <Plus size={18} /> Novo Lançamento
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print:block text-center border-b-2 border-blue-900 pb-6 mb-8">
        <h2 className="text-2xl font-black uppercase text-blue-900">Igreja 3IPI Natal</h2>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Relatório Analítico de Movimentação Financeira</p>
        <p className="text-[10px] text-gray-400 mt-2">Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
      </div>

      {/* Busca e Filtro */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 print:hidden">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar descrição ou projeto..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-gray-50 dark:bg-slate-950 dark:text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase outline-none border-2 border-transparent focus:border-blue-500"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="Todos">Todas as Categorias</option>
          <option value="Entrada">Dízimos/Ofertas Gerais</option>
          <option value="Entrada (Projeto)">Entradas Especiais (Projetos)</option>
          <option value="Saída">Despesas Operacionais</option>
          <option value="Saída (Projeto)">Despesas de Projetos</option>
        </select>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Data / Movimento</th>
                <th className="px-6 py-4">Categoria / Projeto</th>
                <th className="px-6 py-4 text-center">Doc</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {paginatedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-all duration-300 group">
                  <td className="px-6 py-4">
                    <p className="text-[10px] text-gray-400 font-black mb-0.5">{new Date(t.data).toLocaleDateString('pt-BR')}</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{t.movimento}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${t.tipo.includes('Projeto') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {t.tipo}
                      </span>
                      {t.projeto && (
                        <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                          <Target size={10} className="text-indigo-500" /> {t.projeto}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {t.comprovante ? (
                      <button 
                        onClick={() => setViewingComprovante(t.comprovante || null)}
                        className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:scale-110 transition-transform shadow-sm"
                        title="Ver Documento"
                      >
                        <Paperclip size={16} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <span className="text-gray-300 dark:text-slate-700 font-bold">—</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-right font-black text-sm ${t.tipo.includes('Entrada') ? 'text-blue-700 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.tipo.includes('Entrada') ? '+' : '-'} {formatCurrency(t.valor)}
                  </td>
                  <td className="px-6 py-4 text-center print:hidden">
                    <div className="flex justify-center items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                      {isAdmin ? (
                        <>
                          <button 
                            onClick={() => handleOpenModal(t)} 
                            className="p-2.5 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
                            title="Editar Lançamento"
                          >
                            <Edit3 size={18} strokeWidth={2.5} />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)} 
                            className="p-2.5 text-red-500 dark:text-red-400 bg-white dark:bg-slate-800 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
                            title="Excluir Lançamento"
                          >
                            <Trash2 size={18} strokeWidth={2.5} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleOpenModal(t)} 
                          className="p-2.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
                          title="Visualizar Detalhes"
                        >
                          <Eye size={18} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum lançamento encontrado para a busca.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      <div className="flex justify-between items-center px-4 print:hidden">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Página {currentPage} de {totalPages}</p>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <ChevronLeft size={16} strokeWidth={3} />
          </button>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Modal Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-blue-900 text-white">
              <h2 className="text-xl font-black uppercase tracking-tight">{editingTransaction ? 'Editar' : 'Novo'} Lançamento</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
            
            <div className="flex bg-gray-50 dark:bg-slate-950 px-6">
              <button 
                onClick={() => setActiveTab('dados')}
                className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest border-b-4 transition-all ${activeTab === 'dados' ? 'border-blue-800 text-blue-800 dark:text-blue-400' : 'border-transparent text-gray-400'}`}
              >
                Informações
              </button>
              <button 
                onClick={() => setActiveTab('comprovante')}
                className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeTab === 'comprovante' ? 'border-blue-800 text-blue-800 dark:text-blue-400' : 'border-transparent text-gray-400'}`}
              >
                Documento {formData.comprovante && <CheckCircle2 size={12} className="text-green-500" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'dados' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <div className="col-span-full space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição / Movimento</label>
                      <input disabled={!isAdmin} type="text" className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-bold text-sm dark:text-white outline-none focus:border-blue-500" value={formData.movimento} onChange={(e) => setFormData({...formData, movimento: e.target.value})} required />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Fluxo</label>
                      <select disabled={!isAdmin} className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-bold text-xs dark:text-white outline-none focus:border-blue-500" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value as TransactionType})}>
                        <option value="Entrada">Dízimos / Ofertas Gerais</option>
                        <option value="Entrada (Projeto)">Entrada Projeto / Evento</option>
                        <option value="Saída">Despesa Operacional</option>
                        <option value="Saída (Projeto)">Despesa Projeto / Evento</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Método</label>
                      <select disabled={!isAdmin} className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-bold text-xs dark:text-white outline-none focus:border-blue-500" value={formData.metodo} onChange={(e) => setFormData({...formData, metodo: e.target.value as PaymentMethod})}>
                        <option value="Pix">PIX</option>
                        <option value="Espécie">Espécie</option>
                      </select>
                    </div>

                    {formData.tipo?.includes('Projeto') && (
                      <div className="col-span-full space-y-1 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1"><Target size={12} /> Identificação do Projeto/Campanha</label>
                        <input type="text" placeholder="Ex: Feijoada de Missões, Reforma, etc." className="w-full p-3 bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl font-bold text-sm dark:text-white outline-none focus:border-indigo-500" value={formData.projeto} onChange={(e) => setFormData({...formData, projeto: e.target.value})} required />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor (R$)</label>
                      <input disabled={!isAdmin} type="number" step="0.01" className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-black text-lg dark:text-white outline-none focus:border-blue-500" value={formData.valor} onChange={(e) => setFormData({...formData, valor: Number(e.target.value)})} required />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</label>
                      <input disabled={!isAdmin} type="date" className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-bold text-sm dark:text-white outline-none focus:border-blue-500" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required />
                    </div>

                    <div className="col-span-full space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações (Opcional)</label>
                      <textarea disabled={!isAdmin} className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-medium text-sm dark:text-white outline-none focus:border-blue-500 resize-none" rows={2} value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="border-4 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-gray-50 dark:bg-slate-950/50">
                      {formData.comprovante ? (
                        <div className="relative group w-full">
                          <img src={formData.comprovante} alt="Preview" className="max-h-64 mx-auto rounded-xl shadow-lg border-2 border-white dark:border-slate-800 object-contain" />
                          {isAdmin && (
                            <button type="button" onClick={() => setFormData({...formData, comprovante: ''})} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-all">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full">
                            <ImageIcon size={48} />
                          </div>
                          <div>
                            <p className="font-black text-blue-900 dark:text-white uppercase tracking-tight">Anexar Comprovante / NF</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">Imagens JPG, PNG até 5MB</p>
                          </div>
                          {isAdmin && (
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-yellow-400 text-blue-900 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-yellow-300 transition-all">Selecionar Arquivo</button>
                          )}
                        </>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 bg-gray-100 dark:bg-slate-800 dark:text-slate-400 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-colors">Fechar</button>
                  {isAdmin && (
                    <button type="submit" className="flex-1 p-3 bg-blue-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest border-b-4 border-blue-950 shadow-xl active:scale-95 transition-all">
                      {showSuccess ? 'Gravado com Sucesso!' : 'Salvar Lançamento'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Visualização de Comprovante em Tela Cheia */}
      {viewingComprovante && (
        <div className="fixed inset-0 z-[400] bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <button onClick={() => setViewingComprovante(null)} className="absolute top-6 right-6 text-white p-3 hover:bg-white/10 rounded-full transition-all hover:rotate-90 duration-300"><X size={32} /></button>
          <img src={viewingComprovante} className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg animate-in zoom-in duration-300" alt="Documento" />
          <div className="mt-8 flex gap-4">
             <button 
               onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingComprovante;
                  link.download = `3IPI-DOC-${Date.now()}.png`;
                  link.click();
               }}
               className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-3 shadow-xl hover:bg-blue-500 transition-all active:scale-95"
             >
               <Download size={20} /> Baixar Original
             </button>
          </div>
        </div>
      )}

      {/* Rodapé de Impressão */}
      <div className="hidden print:block mt-20 pt-10 border-t border-gray-200">
         <div className="grid grid-cols-2 gap-20">
            <div className="text-center">
               <div className="border-t-2 border-gray-400 mt-10 pt-2">
                  <p className="text-[10px] font-black uppercase text-gray-600">Tesouraria 3IPI Natal</p>
               </div>
            </div>
            <div className="text-center">
               <div className="border-t-2 border-gray-400 mt-10 pt-2">
                  <p className="text-[10px] font-black uppercase text-gray-600">Conselho da Igreja</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Transactions;
