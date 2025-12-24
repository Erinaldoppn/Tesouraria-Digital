
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsight = async (transactions: Transaction[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.map(t => 
    `- ${t.data}: ${t.movimento} (${t.tipo}) - R$ ${t.valor.toFixed(2)}`
  ).join('\n');

  const prompt = `
    Como um consultor financeiro especializado em igrejas, analise os seguintes dados financeiros da Igreja 3IPI de Natal:
    
    ${summary}
    
    Por favor, forneça um breve relatório (máximo 2 parágrafos) destacando:
    1. A saúde financeira atual (Saldo entre Entradas e Saídas).
    2. Sugestões de economia ou áreas que precisam de atenção.
    3. Use um tom encorajador e profissional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar um insight no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a inteligência artificial.";
  }
};
