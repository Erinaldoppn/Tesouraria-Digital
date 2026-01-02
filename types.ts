
export type TransactionType = 'Entrada' | 'Saída' | 'Entrada (Projeto)' | 'Saída (Projeto)';
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
  contribuinte?: string; // Nome de quem fez a contribuição ou recebeu o pagamento
  projeto?: string; // Nome da campanha ou departamento
  comprovante?: string; // Base64 or URL
  observacoes?: string;
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
  projectIncome: number;
  projectExpense: number;
  projectBalance: number;
  monthlyData: { month: string; income: number; expense: number; projectIncome: number; projectExpense: number }[];
}
