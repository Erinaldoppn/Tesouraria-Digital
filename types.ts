
export type TransactionType = 'Entrada' | 'Saída';
export type PaymentMethod = 'Pix' | 'Espécie';

export interface Transaction {
  id: string;
  movimento: string;
  tipo: TransactionType;
  valor: number;
  metodo: PaymentMethod;
  data: string;
  mes: string;
  responsavel: string;
  comprovante?: string; // Base64 or URL
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyData: { month: string; income: number; expense: number }[];
}
