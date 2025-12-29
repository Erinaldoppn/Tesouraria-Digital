
import { Transaction, User } from '../types';
import { INITIAL_TRANSACTIONS } from '../constants';

/**
 * IMPORTANTE: Atualmente o sistema usa LocalStorage para persistência no navegador.
 * Com a criação do banco de dados 3IPI_database no Vercel via Prisma,
 * as funções abaixo devem ser convertidas para chamadas de API (fetch/axios).
 */

const TRANSACTION_KEY = '3ipi_transactions';
const USERS_KEY = '3ipi_users';
const AUTH_KEY = '3ipi_current_user';

// --- TRANSACTIONS ---

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(TRANSACTION_KEY);
  if (!data) {
    localStorage.setItem(TRANSACTION_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
    return INITIAL_TRANSACTIONS;
  }
  return JSON.parse(data);
};

export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  // Se não tiver ID (novo registro), geramos um aqui (será feito pelo Prisma no futuro)
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
};

export const deleteTransaction = (id: string): void => {
  const transactions = getTransactions();
  const filtered = transactions.filter(t => t.id !== id);
  localStorage.setItem(TRANSACTION_KEY, JSON.stringify(filtered));
};

export const importTransactions = (newTransactions: Transaction[]): void => {
  localStorage.setItem(TRANSACTION_KEY, JSON.stringify(newTransactions));
};

// --- USERS & AUTH ---

export const getUsers = (): (User & { password?: string })[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const registerUser = (user: User & { password?: string }): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const deleteUser = (id: string): void => {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
};

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
