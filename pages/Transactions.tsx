
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Trash2, Edit3, X, Image as ImageIcon,
  CheckCircle2, Printer, Eye, Paperclip, FileUp, Target, Download, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, User as UserIcon, Calendar,
  RotateCw, ZoomIn, ZoomOut, Maximize2, FileText as FilePdfIcon
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
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const [filterType, setFilterType] = useState<string>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingComprovante, setViewingComprovante] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'comprovante'>('dados');

  // Viewer state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [formData, setFormData] = useState<Partial<Transaction>>({
    movimento: '',
    tipo: 'Entrada',
    valor: 0,
    metodo: 'Pix',
    data: new Date().toISOString().split('T')[0],
    mes: MONTHS[new Date().getMonth()],
    responsavel: '',
    contribuinte: '',
    projeto: '',
    comprovante: '',
    observacoes: '',
  });

  const loadData = async () => {
    setLoading(true);
    const data = await getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => 
      t.movimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.projeto && t.projeto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.contribuinte && t.contribuinte.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (filterType !== 'Todos') result = result.filter(t => t.tipo === filterType);
    return result.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transactions, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const handleOpenModal = (transaction?: Transaction) => {
    setActiveTab('dados');
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({ ...transaction });
    } else {
      setEditingTransaction(null);
      setFormData({
        id: '',
        movimento: '',
        tipo: 'Entrada',
        valor: 0,
        metodo: 'Pix',
        data: new Date().toISOString().split('T')[0],
        mes: MONTHS[new Date().getMonth()],
        responsavel: user?.name || '',
        contribuinte: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    const selectedDate = new Date(formData.data + 'T12:00:00');
    const updatedMes = MONTHS[selectedDate.getMonth()];

    await saveTransaction({ 
      ...formData as Transaction, 
      valor: Number(formData.valor),
      mes: updatedMes 
    });
    
    await loadData();
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setIsModalOpen(false); }, 1000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este lançamento permanentemente?')) {
      await deleteTransaction(id);
      await loadData();
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isPdf = (data: string | undefined) => data?.startsWith('data:application/pdf');

  const handleCloseViewer = () => {
    setViewingComprovante(null);
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Lançamentos Financeiros</h1>
          <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Controle de Tesouraria 3IPI Natal</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => window.print()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Printer size={16} /> Relatório PDF
          </button>
          
          {isAdmin && (
            <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-blue-800 transition-all border-b-4 border-blue-950 active:scale-95">
              <Plus size={18} /> Novo Lançamento
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 print:hidden">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por descrição, projeto ou contribuinte..." 
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
          <option value="Entrada (Projeto)">Entradas de Projetos</option>
          <option value="Saída">Despesas Operacionais</option>
          <option value="Saída (Projeto)">Despesas de Projetos</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center animate-pulse font-black text-blue-900 uppercase text-xs tracking-widest">Carregando registros...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Data / Movimento</th>
                  <th className="px-6 py-4">Categoria / Contribuinte</th>
                  <th className="px-6 py-4 text-center">Doc</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {paginatedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-all duration-300 group">
                    <td className="px-6 py-4">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black mb-0.5">{new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{t.movimento}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${t.tipo.includes('Projeto') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {t.tipo}
                        </span>
                        {(t.contribuinte || t.projeto) && (
                          <div className="flex flex-col gap-0.5">
                            {t.contribuinte && (
                              <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                <UserIcon size={10} className="text-gray-400" /> {t.contribuinte}
                              </p>
                            )}
                            {t.projeto && (
                              <p className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                                <Target size={10} className="text-indigo-500" /> {t.projeto}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {t.comprovante ? (
                        <button onClick={() => setViewingComprovante(t.comprovante || null)} className={`p-1.5 rounded-lg hover:scale-110 transition-transform shadow-sm ${isPdf(t.comprovante) ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                          {isPdf(t.comprovante) ? <FilePdfIcon size={16} strokeWidth={2.5} /> : <Paperclip size={16} strokeWidth={2.5} />}
                        </button>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={`px-6 py-4 text-right font-black text-sm ${t.tipo.includes('Entrada') ? 'text-blue-700 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.tipo.includes('Entrada') ? '+' : '-'} {formatCurrency(t.valor)}
                    </td>
                    <td className="px-6 py-4 text-center print:hidden">
                      <div className="flex justify-center items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {isAdmin ? (
                          <>
                            <button onClick={() => handleOpenModal(t)} className="p-2 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm border border-gray-100 transition-all"><Edit3 size={16} /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-2 text-red-500 dark:text-red-400 bg-white dark:bg-slate-800 hover:bg-red-600 hover:text-white rounded-xl shadow-sm border border-gray-100 transition-all"><Trash2 size={16} /></button>
                          </>
                        ) : (
                          <button onClick={() => handleOpenModal(t)} className="p-2 text-slate-500 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm border border-gray-100 transition-all"><Eye size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 print:hidden">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Página {currentPage} de {totalPages}</p>
          <p className="text-[9px] font-bold text-blue-600 uppercase">Total de {filteredTransactions.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 disabled:opacity-30 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"><ChevronsLeft size={16} /></button>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 disabled:opacity-30 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"><ChevronLeft size={16} /></button>
          <div className="flex gap-1">
             {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
               let pageNum;
               if (totalPages <= 5) pageNum = i + 1;
               else if (currentPage <= 3) pageNum = i + 1;
               else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
               else pageNum = currentPage - 2 + i;
               return (
                 <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-blue-900 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800'}`}>{pageNum}</button>
               );
             })}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 disabled:opacity-30 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"><ChevronRight size={16} /></button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 disabled:opacity-30 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"><ChevronsRight size={16} /></button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-blue-900 text-white">
              <h2 className="text-xl font-black uppercase tracking-tight">{editingTransaction ? 'Editar' : 'Novo'} Lançamento</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <div className="flex bg-gray-50 dark:bg-slate-950 px-6">
              <button onClick={() => setActiveTab('dados')} className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest border-b-4 ${activeTab === 'dados' ? 'border-blue-800 text-blue-800' : 'border-transparent text-gray-400'}`}>Informações Gerais</button>
              <button onClick={() => setActiveTab('comprovante')} className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest border-b-4 ${activeTab === 'comprovante' ? 'border-blue-800 text-blue-800' : 'border-transparent text-gray-400'}`}>Anexar Comprovante</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'dados' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-full space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição do Movimento</label>
                      <input disabled={!isAdmin} type="text" placeholder="Ex: Oferta Culto de Domingo" className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-bold text-sm" value={formData.movimento} onChange={(e) => setFormData({...formData, movimento: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest">Nome do Contribuinte / Favorecido</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input disabled={!isAdmin} type="text" placeholder="Nome do Membro ou Visitante" className="w-full pl-10 pr-3 py-3 bg-blue-50/30 dark:bg-slate-950 dark:border-slate-800 border-2 border-blue-50 dark:border-slate-800 rounded-xl font-bold text-sm" value={formData.contribuinte} onChange={(e) => setFormData({...formData, contribuinte: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data do Lançamento</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input disabled={!isAdmin} type="date" className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-bold text-sm" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Fluxo</label>
                      <select disabled={!isAdmin} className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-bold text-xs" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value as TransactionType})}>
                        <option value="Entrada">Dízimos / Ofertas Gerais</option>
                        <option value="Entrada (Projeto)">Entrada Projeto / Evento</option>
                        <option value="Saída">Despesa Operacional</option>
                        <option value="Saída (Projeto)">Despesa Projeto / Evento</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor (R$)</label>
                      <input disabled={!isAdmin} type="number" step="0.01" className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-black text-lg" value={formData.valor} onChange={(e) => setFormData({...formData, valor: Number(e.target.value)})} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Forma de Pagamento</label>
                      <select disabled={!isAdmin} className="w-full p-3 bg-gray-50 dark:bg-slate-950 dark:border-slate-800 border-2 border-gray-100 rounded-xl font-bold text-xs" value={formData.metodo} onChange={(e) => setFormData({...formData, metodo: e.target.value as PaymentMethod})}>
                        <option value="Pix">Pix</option>
                        <option value="Espécie">Dinheiro (Espécie)</option>
                      </select>
                    </div>
                    {formData.tipo?.includes('Projeto') && (
                      <div className="col-span-full space-y-1">
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Identificação do Projeto</label>
                        <div className="relative">
                          <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={16} />
                          <input type="text" placeholder="Ex: Reforma do Teto" className="w-full pl-10 pr-3 py-3 bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 rounded-xl font-bold text-sm" value={formData.projeto} onChange={(e) => setFormData({...formData, projeto: e.target.value})} required />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-4 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-gray-50 dark:bg-slate-950 min-h-[300px]">
                    {formData.comprovante ? (
                      <div className="relative group w-full max-w-md mx-auto">
                        {isPdf(formData.comprovante) ? (
                          <div className="flex flex-col items-center gap-4 bg-red-50 dark:bg-red-900/10 p-8 rounded-2xl border-2 border-red-100 dark:border-red-900/20">
                            <FilePdfIcon size={64} className="text-red-600" />
                            <p className="font-black text-red-700 dark:text-red-400 uppercase text-xs">Arquivo PDF anexado</p>
                          </div>
                        ) : (
                          <img src={formData.comprovante} className="max-h-64 mx-auto rounded-xl shadow-lg border-4 border-white dark:border-slate-800" />
                        )}
                        {isAdmin && (
                          <button type="button" onClick={() => setFormData({...formData, comprovante: ''})} className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={48} className="text-gray-300 dark:text-slate-800" />
                        <p className="font-black text-gray-400 uppercase tracking-tight text-xs">Selecione uma imagem ou PDF do comprovante</p>
                        {isAdmin && <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-yellow-400 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all">Selecionar Arquivo</button>}
                      </>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                  </div>
                )}
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 bg-gray-100 dark:bg-slate-800 dark:text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                  {isAdmin && (
                    <button type="submit" className="flex-1 p-4 bg-blue-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl border-b-4 border-blue-950 active:scale-95 transition-all">
                      {showSuccess ? (
                        <span className="flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Gravado!</span>
                      ) : (
                        editingTransaction ? 'Salvar Alterações' : 'Confirmar Lançamento'
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewingComprovante && (
        <div className="fixed inset-0 z-[400] bg-slate-950/98 flex flex-col items-center justify-center p-4">
          {/* Header do Viewer */}
          <div className="fixed top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-[410] bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCloseViewer}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-white font-black uppercase text-xs tracking-widest hidden md:block">Visualizador de Comprovante</h3>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
              <button 
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                className="p-2 text-white hover:bg-white/10 rounded-xl" title="Diminuir Zoom"
              >
                <ZoomOut size={20} />
              </button>
              <span className="text-white text-[10px] font-black w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                className="p-2 text-white hover:bg-white/10 rounded-xl" title="Aumentar Zoom"
              >
                <ZoomIn size={20} />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
              <button 
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-2 text-white hover:bg-white/10 rounded-xl" title="Rotacionar"
              >
                <RotateCw size={20} />
              </button>
              <button 
                onClick={() => { setZoom(1); setRotation(0); }}
                className="p-2 text-white hover:bg-white/10 rounded-xl" title="Resetar Visualização"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>

          {/* Área de Visualização */}
          <div className="w-full h-full flex items-center justify-center overflow-auto p-12">
            <div 
              className="transition-all duration-300 ease-out shadow-2xl relative"
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              {isPdf(viewingComprovante) ? (
                <iframe 
                  src={viewingComprovante} 
                  className="w-[90vw] md:w-[70vw] h-[80vh] rounded-lg bg-white"
                  title="Visualizador de PDF"
                />
              ) : (
                <img 
                  src={viewingComprovante} 
                  className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg border-4 border-white/10" 
                  alt="Comprovante"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
