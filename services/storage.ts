import { Transaction, User } from '../types';
import { INITIAL_TRANSACTIONS } from '../constants';

/**
 * SERVIÇO DE STORAGE E INTEGRAÇÃO (3IPI NATAL)
 * 
 * Agora que você configurou o DATABASE_URL e DIRECT_URL:
 * 1. Rode `npx prisma db push` no seu terminal local.
 * 2. As tabelas 'User' e 'Transaction' serão criadas no seu banco.
 * 3. Para o site salvar de fato no banco, você precisará criar rotas de API no Vercel.
 */

const TRANSACTION_KEY = '3ipi_transactions';
const AUTH_KEY = '3ipi_current_user';
const USER_KEY = '3ipi_users';

// --- TRANSACTIONS (CRUD) ---

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    // Exemplo de como será a chamada quando você criar a API no Vercel:
    // const response = await fetch('/api/transactions');
    // return await response.json();
    
    const data = localStorage.getItem(TRANSACTION_KEY);
    if (!data) {
      localStorage.setItem(TRANSACTION_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return [];
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    // Exemplo: await fetch('/api/transactions', { method: 'POST', body: JSON.stringify(transaction) });

    const transactions = await getTransactions();
    if (!transaction.id) {
      transaction.id = Date.now().toString();
    }
    
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      transactions[index] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    localStorage.setItem(TRANSACTION_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Erro ao salvar transação:", error);
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const transactions = await getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    localStorage.setItem(TRANSACTION_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
  }
};

export const importTransactions = async (newTransactions: Transaction[]): Promise<void> => {
  localStorage.setItem(TRANSACTION_KEY, JSON.stringify(newTransactions));
};

// --- AUTH & USERS ---

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
};

export const getUsers = (): (User & { password?: string })[] => {
  try {
    const data = localStorage.getItem(USER_KEY);
    if (!data) {
      const defaultUsers = [
        { id: '1', name: 'Admin 3IPI', email: 'admin@3ipi.com', password: 'admin', role: 'admin' }
      ];
      localStorage.setItem(USER_KEY, JSON.stringify(defaultUsers));
      return defaultUsers as (User & { password?: string })[];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
};

export const registerUser = (user: User & { password?: string }): void => {
  try {
    const users = getUsers();
    users.push(user);
    localStorage.setItem(USER_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
  }
};

export const deleteUser = (id: string): void => {
  try {
    const users = getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(USER_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
  }
};
