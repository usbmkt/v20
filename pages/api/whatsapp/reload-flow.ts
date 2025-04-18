// pages/api/whatsapp/reload-flow.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios'; // Precisa do axios

type ResponseData = {
  message: string;
  error?: string; // Adicionado para erros
};

// *** CORREÇÃO: URL aponta para o Flow Controller Python ***
const FLOW_CONTROLLER_API_URL = process.env.FLOW_CONTROLLER_URL || 'http://localhost:5000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'POST') {
    console.log('[API Reload Flow] Recebida solicitação para recarregar fluxo via Flow Controller...');
    try {
      // *** CORREÇÃO: Chama o endpoint /reload_flow do Python ***
      const controllerResponse = await axios.post(`${FLOW_CONTROLLER_API_URL}/reload_flow`);

      if (controllerResponse.status !== 200) {
        let errorMsg = `Erro ao solicitar recarga de fluxo ao controller: Status ${controllerResponse.status}`;
        try { errorMsg = controllerResponse.data?.message || controllerResponse.data?.error || errorMsg; } catch (e) {}
        console.error(`[API Reload Flow] Falha na comunicação com o Flow Controller: ${controllerResponse.status}`);
        throw new Error(errorMsg);
      }

      const data = controllerResponse.data;
      console.log('[API Reload Flow] Resposta recebida do controller:', data.message);

      res.status(200).json({ message: data.message || 'Solicitação de recarga enviada ao controller.' });

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Erro desconhecido';
      console.error("[API Reload Flow] Erro ao tentar recarregar fluxo via Flow Controller:", errorMsg);
      res.status(503).json({ message: 'Erro ao comunicar com o serviço de fluxo para recarregar', error: errorMsg });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}