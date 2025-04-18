// pages/api/ltv.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Estrutura esperada pelo frontend
interface LtvInputs { avgTicket: number; purchaseFrequency: number; customerLifespan: number; }
interface LtvData { inputs: LtvInputs; result: number; }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LtvData | { message: string }>
) {
  if (req.method === 'GET') {
    try {
      const { startDate, endDate, campaignId } = req.query;
      console.log(`[API /api/ltv] GET Req:`, { startDate, endDate, campaignId });

      // --- LÓGICA MOCK ---
      const isAll = !campaignId || campaignId === 'all';
      const factor = isAll ? 1 : 0.7 + Math.random()*0.6;

      const avgTicket = (isAll ? 150 : 50 + Math.random()*100) * factor;
      const purchaseFrequency = (isAll ? 1.8 : 1 + Math.random() * 1.5) * factor;
      const customerLifespan = Math.floor(isAll ? 18 : 6 + Math.random() * 24);

      const ltvResult = avgTicket * purchaseFrequency * customerLifespan;

      const mockData: LtvData = {
        inputs: {
          avgTicket: parseFloat(avgTicket.toFixed(2)),
          purchaseFrequency: parseFloat(purchaseFrequency.toFixed(1)),
          customerLifespan: customerLifespan,
        },
        result: parseFloat(ltvResult.toFixed(2)),
      };
      // --- FIM MOCK ---

      res.status(200).json(mockData);

    } catch (error: any) {
      console.error("[API /api/ltv] Erro:", error);
      res.status(500).json({ message: `Erro Interno: ${error.message || 'Erro'}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Método ${req.method} Não Permitido` });
  }
}