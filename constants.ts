
import { Transaction } from './types';

export const COLORS = {
  primaryBlue: '#1E40AF', // blue-800
  secondaryYellow: '#FBBF24', // yellow-400
  accentBlue: '#3B82F6', // blue-500
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    movimento: 'Dizímos e Ofertas - Culto Manhã',
    tipo: 'Entrada',
    valor: 1500.00,
    metodo: 'Pix',
    data: '2024-03-01',
    mes: 'Março',
    responsavel: 'Tesouraria',
  },
  {
    id: '2',
    movimento: 'Pagamento Energia Elétrica',
    tipo: 'Saída',
    valor: 450.30,
    metodo: 'Pix',
    data: '2024-03-05',
    mes: 'Março',
    responsavel: 'Administração',
  },
  {
    id: '3',
    movimento: 'Oferta Especial Missões',
    tipo: 'Entrada',
    valor: 800.00,
    metodo: 'Espécie',
    data: '2024-03-10',
    mes: 'Março',
    responsavel: 'Tesouraria',
  }
];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
