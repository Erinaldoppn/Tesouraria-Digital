
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Filter, Download, Upload, Trash2, Edit3, 
  FileText, X, Save, Image as ImageIcon,
  CheckCircle2, Hash, RotateCcw, FileSpreadsheet,
  ChevronLeft, ChevronRight, ListOrdered, AlertTriangle,
  Calculator, ArrowUpRight, ArrowDownRight, PieChart, Printer,
  Eye,
  Lock,
  Paperclip,
  FileUp
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterMethod, setFilterMethod] = useState<string>('Todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
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
    comprovante: '',
  });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType, filterMethod, startDate, endDate]);

  const loadData = () => { setTransactions([...getTransactions()]); };

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

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handleOpenModal = (transaction?: Transaction) => {
    if (!isAdmin) return;
    setActiveTab('dados');
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({ ...transaction });
    } else {
      const lastId = transactions.length > 0 ? Math.max(...transactions.map(t => parseInt(t.id) || 0)) : 0;
      setEditingTransaction(null);
      setFormData({
        id: (lastId + 1).toString(),
        movimento: '',
        tipo: 'Entrada',
        valor: 0,
        metodo: 'Pix',
        data: new Date().toISOString().split('T')[0],
        mes: MONTHS[new Date().getMonth()],
        responsavel: user?.name || '',
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

        // Pula cabeçalho se houver
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length >= 5) {
            newItems.push({
              id: (nextId++).toString(),
              movimento: cols[0]?.trim(),
              tipo: (cols[1]?.trim() as TransactionType) || 'Entrada',
              valor: parseFloat(cols[2]?.trim()) || 0,
              metodo: (cols[3]?.trim() as PaymentMethod) || 'Pix',
              data: cols[4]?.trim() || new Date().toISOString().split('T')[0],
              mes: cols[5]?.trim() || MONTHS[new Date().getMonth()],
              responsavel: cols[6]?.trim() || 'Importado',
              comprovante: ''
            });
          }
        }
        
        if (newItems.length > 0) {
          importTransactions([...existing, ...newItems]);
          loadData();
          alert(`${newItems.length} registros importados com sucesso!`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    saveTransaction({ ...formData as Transaction, valor: Number(formData.valor) });
    loadData();
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setIsModalOpen(false); }, 1200);
  };

  const handleConfirmDelete = () => {
    if (isAdmin && transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      loadData();
      setTransactionToDelete(null);
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6 pb-20 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Lançamentos Financeiros</h1>
          <p className="text-blue-700 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider transition-colors">3IPI Natal - Tesouraria</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {isAdmin && (
            <>
              <button 
                onClick={() => csvInputRef.current?.click()} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-slate-800 text-blue-800 dark:text-blue-400 px-5 py-3.5 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-md active:scale-95"
              >
                <FileUp size={20} /> <span className="text-xs uppercase">Importar CSV</span>
              </button>
              <input 
                type="file" 
                ref={csvInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleImportCSV} 
              />
            </>
          )}

          {isAdmin ? (
            <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-800 text-white px-5 py-3.5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl active:scale-95 border-b-4 border-blue-950">
              <Plus size={20} strokeWidth={3} /> ADICIONAR
            </button>
          ) : (
            <div className="bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 px-5 py-3.5 rounded-2xl flex items-center gap-2 border-2 border-gray-200 dark:border-slate-700 transition-colors">
              <Lock size={16} /> <span className="text-xs font-black uppercase">Leitura Apenas</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-blue-900 dark:bg-slate-800 text-white transition-colors">
              <tr>
                <th className="px-6 py-5 text-[11px] font-black uppercase">ID / Data</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase">Descrição</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase text-center">Docs</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase text-right">Valor</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
              {paginatedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-all border-l-4 border-l-transparent hover:border-l-blue-800">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-[10px]">#{t.id}</span>
                      <span className="text-sm font-bold text-gray-700 dark:text-slate-300 transition-colors">{formatDateBR(t.data)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 dark:text-slate-100 transition-colors">{t.movimento}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.tipo} • {t.metodo}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {t.comprovante ? (
                      <button 
                        onClick={() => setViewingComprovante(t.comprovante || null)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg hover:scale-110 transition-transform"
                        title="Ver Comprovante"
                      >
                        <Paperclip size={18} />
                      </button>
                    ) : (
                      <span className="text-gray-300 dark:text-slate-700">—</span>
                    )}
                  </td>
                  <td className={`px-6 py-5 text-right font-black ${t.tipo === 'Entrada' ? 'text-blue-700 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(t.valor)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-3">
                      {isAdmin ? (
                        <>
                          <Edit3 size={18} className="text-blue-800 dark:text-blue-400 cursor-pointer hover:scale-110" onClick={() => handleOpenModal(t)} />
                          <Trash2 size={18} className="text-red-600 dark:text-red-400 cursor-pointer hover:scale-110" onClick={() => setTransactionToDelete(t)} />
                        </>
                      ) : (
                        <Eye size={18} className="text-gray-400 cursor-pointer" onClick={() => {
                          setEditingTransaction(t);
                          setFormData({...t});
                          setIsModalOpen(true);
                        }} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl transition-colors flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase dark:text-white">
                {isAdmin ? (editingTransaction ? 'Editar' : 'Novo') : 'Visualizar'} Lançamento
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-50 dark:bg-slate-950 px-8">
              <button 
                onClick={() => setActiveTab('dados')}
                className={`px-6 py-4 font-black text-xs uppercase tracking-widest border-b-4 transition-all ${activeTab === 'dados' ? 'border-blue-800 text-blue-800 dark:text-blue-400' : 'border-transparent text-gray-400'}`}
              >
                Informações Gerais
              </button>
              <button 
                onClick={() => setActiveTab('comprovante')}
                className={`px-6 py-4 font-black text-xs uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeTab === 'comprovante' ? 'border-blue-800 text-blue-800 dark:text-blue-400' : 'border-transparent text-gray-400'}`}
              >
                Comprovante {formData.comprovante && <CheckCircle2 size={14} className="text-green-500" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'dados' ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-900 dark:text-slate-400 uppercase tracking-widest px-1">Descrição do Movimento</label>
                      <input disabled={!isAdmin} type="text" className="w-full p-4 border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-2xl focus:border-blue-600 transition-all outline-none" value={formData.movimento} onChange={(e) => setFormData({...formData, movimento: e.target.value})} required />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-900 dark:text-slate-400 uppercase tracking-widest px-1">Tipo de Fluxo</label>
                        <select disabled={!isAdmin} className="w-full p-4 border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-2xl focus:border-blue-600 outline-none" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value as TransactionType})}>
                          <option value="Entrada">Entrada (Dízimo/Oferta)</option>
                          <option value="Saída">Saída (Despesa)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-900 dark:text-slate-400 uppercase tracking-widest px-1">Método</label>
                        <select disabled={!isAdmin} className="w-full p-4 border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-2xl focus:border-blue-600 outline-none" value={formData.metodo} onChange={(e) => setFormData({...formData, metodo: e.target.value as PaymentMethod})}>
                          <option value="Pix">PIX</option>
                          <option value="Espécie">Espécie (Dinheiro)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-900 dark:text-slate-400 uppercase tracking-widest px-1">Valor (R$)</label>
                        <input disabled={!isAdmin} type="number" step="0.01" className="w-full p-4 border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-2xl focus:border-blue-600 transition-all outline-none" value={formData.valor} onChange={(e) => setFormData({...formData, valor: Number(e.target.value)})} required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-900 dark:text-slate-400 uppercase tracking-widest px-1">Data</label>
                        <input disabled={!isAdmin} type="date" className="w-full p-4 border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-2xl focus:border-blue-600 transition-all outline-none" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="border-4 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-gray-50 dark:bg-slate-950/50">
                      {formData.comprovante ? (
                        <div className="relative group w-full">
                          <img 
                            src={formData.comprovante} 
                            alt="Preview" 
                            className="max-h-80 mx-auto rounded-xl shadow-lg border-2 border-white dark:border-slate-800 object-contain"
                          />
                          {isAdmin && (
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, comprovante: ''})}
                              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-all"
                            >
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
                            <p className="font-black text-blue-900 dark:text-white uppercase tracking-tight">Anexar Comprovante</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">Clique abaixo para selecionar uma foto ou print do recibo</p>
                          </div>
                          {isAdmin && (
                            <button 
                              type="button" 
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
                            >
                              Selecionar Arquivo
                            </button>
                          )}
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 bg-gray-100 dark:bg-slate-800 dark:text-slate-400 rounded-2xl font-bold uppercase text-xs">Fechar</button>
                  {isAdmin && (
                    <button type="submit" className="flex-1 p-4 bg-blue-900 text-white rounded-2xl font-black uppercase text-xs border-b-4 border-blue-950 shadow-xl shadow-blue-900/20 active:scale-95">
                      {editingTransaction ? 'Salvar Alterações' : 'Confirmar Lançamento'}
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
        <div className="fixed inset-0 z-[400] bg-black/95 flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setViewingComprovante(null)}
            className="absolute top-8 right-8 text-white p-4 hover:bg-white/10 rounded-full transition-all"
          >
            <X size={32} />
          </button>
          <img 
            src={viewingComprovante} 
            className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg"
            alt="Comprovante"
          />
          <div className="mt-8">
             <button 
               onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingComprovante;
                  link.download = `comprovante-3ipi-${Date.now()}.png`;
                  link.click();
               }}
               className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm flex items-center gap-3 shadow-xl"
             >
               <Download size={20} /> Baixar Arquivo
             </button>
          </div>
        </div>
      )}

      {/* Modal Confirmação Deletar */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] max-w-sm w-full text-center transition-colors">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 mx-auto rounded-full flex items-center justify-center mb-4">
               <AlertTriangle size={40} />
            </div>
            <h2 className="font-black mb-2 uppercase dark:text-white">Confirmar Exclusão?</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Esta ação não pode ser desfeita. O lançamento será removido permanentemente.</p>
            <div className="flex gap-4">
              <button onClick={() => setTransactionToDelete(null)} className="flex-1 p-3 bg-gray-100 dark:bg-slate-800 dark:text-slate-400 rounded-xl font-bold">Voltar</button>
              <button onClick={handleConfirmDelete} className="flex-1 p-3 bg-red-600 text-white rounded-xl font-black">EXCLUIR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
