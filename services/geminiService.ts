
import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

export const getSmartStockInsights = async (products: Product[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const simplifiedData = products.map(p => ({
    name: p.name,
    totalStock: p.batches.reduce((sum, b) => sum + b.quantity, 0),
    minAlert: p.minStockAlert,
    batches: p.batches.map(b => ({
      expiry: b.expiryDate,
      qty: b.quantity
    }))
  }));

  const prompt = `Analise os seguintes dados de estoque de medicamentos de um distribuidor grossista na Guiné-Bissau/África Ocidental.
  
  Dados: ${JSON.stringify(simplifiedData)}
  
  Por favor, identifique:
  1. Quais produtos estão criticamente baixos.
  2. Quais lotes expiram em menos de 3 meses.
  3. Sugestões de ações rápidas para o gestor.
  
  Responda em Português de forma profissional e concisa.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao obter insights do Gemini:", error);
    return "Não foi possível gerar insights inteligentes no momento.";
  }
};
