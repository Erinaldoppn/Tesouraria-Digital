
import { Transaction, User } from '../types';
import { supabase } from '../lib/supabase';

const AUTH_KEY = '3ipi_current_user';

// --- AJUDANTE DE ERROS ---
const handleSupabaseError = (error: any, context: string) => {
  console.error(`[Supabase Error] Contexto: ${context}`, error);
  if (error.code === '42501') {
    console.error("ERRO DE RLS: Você precisa configurar as políticas (Policies) no painel do Supabase para permitir acesso a esta tabela.");
  }
  return error;
};

// --- TRANSAÇÕES (SUPABASE) ---

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('data', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, "getTransactions");
    return [];
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    const payload = { ...transaction };
    if (!payload.id || payload.id === '') {
      // @ts-ignore
      delete payload.id; 
    }

    const { error } = await supabase
      .from('transactions')
      .upsert(payload);

    if (error) throw error;
  } catch (error) {
    throw handleSupabaseError(error, "saveTransaction");
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    throw handleSupabaseError(error, "deleteTransaction");
  }
};

export const importTransactions = async (newTransactions: Transaction[]): Promise<void> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert(newTransactions);

    if (error) throw error;
  } catch (error) {
    throw handleSupabaseError(error, "importTransactions");
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
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, "getUsers");
    return [];
  }
};

export const registerUser = async (user: User & { password?: string }): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .insert([user]);

    if (error) throw error;
  } catch (error) {
    throw handleSupabaseError(error, "registerUser");
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    throw handleSupabaseError(error, "deleteUser");
  }
};
