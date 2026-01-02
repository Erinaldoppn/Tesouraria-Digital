
import { Transaction, User } from '../types';
import { supabase } from '../lib/supabase';

const AUTH_KEY = '3ipi_current_user';

// --- TRANSAÇÕES (SUPABASE) ---

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('data', { ascending: false });

  if (error) {
    console.error("Erro ao buscar transações no Supabase:", error);
    return [];
  }
  return data || [];
};

export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  // Se não houver ID, o Supabase pode gerar um (UUID), mas mantemos a lógica de compatibilidade
  const payload = { ...transaction };
  if (!payload.id) {
    delete payload.id; // Deixa o banco gerar se for novo
  }

  const { error } = await supabase
    .from('transactions')
    .upsert(payload);

  if (error) {
    console.error("Erro ao salvar transação no Supabase:", error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao excluir transação no Supabase:", error);
    throw error;
  }
};

export const importTransactions = async (newTransactions: Transaction[]): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .insert(newTransactions);

  if (error) {
    console.error("Erro na importação em massa:", error);
    throw error;
  }
};

// --- AUTH & USUÁRIOS (SUPABASE) ---

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

export const getUsers = async (): Promise<(User & { password?: string })[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error("Erro ao buscar usuários no Supabase:", error);
    return [];
  }
  return data || [];
};

export const registerUser = async (user: User & { password?: string }): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .insert([user]);

  if (error) {
    console.error("Erro ao registrar usuário no Supabase:", error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao excluir usuário no Supabase:", error);
    throw error;
  }
};
