
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
  FileUp,
  MessageSquare,
  ChevronsLeft,
  ChevronsRight
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
    observacoes: '',
  });

  useEffect(() => { loadData(); }, []);
  
  // Resetar para página 1 ao filtrar ou buscar
  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchTerm, filterType, filterMethod, startDate, endDate, itemsPerPage]);

  const loadData = () => { setTransactions([...getTransactions()]); };

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => 
      t.movimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      