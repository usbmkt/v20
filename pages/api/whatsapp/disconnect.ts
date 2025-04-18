// pages/api/whatsapp/disconnect.ts
import type { NextApiRequest, NextApiResponse } from 'next';
// *** NENHUMA IMPORTAÇÃO DE '@/lib/whatsappBot' AQUI ***

type ResponseData = {
  message: string;
};

const BOT_API_URL = `http://localhost:${process.env.WHATSAPP_BOT_API_PORT || 3001}`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { message: string; error?: string }>
) {
  if (req.method === 'POST') {
    console.log('[API Disconnect] Recebida solicitação para desconectar via API interna...');
    try {
       const botResponse = await fetch(`${BOT_API_URL}/disconnect`, { method: 'POST' });

       if (!botResponse.ok) {
         let errorMsg = `Erro ao solicitar desconexão ao bot: Status ${botResponse.status}`;
         try { const errorJson = await botResponse.json(); errorMsg = errorJson.message || errorMsg; } catch (e) {}
         console.error(`[API Disconnect] Falha na comunicação com a API do bot: ${botResponse.status}`);
         throw new Error(errorMsg);
       }

       const data = await botResponse.json();
       console.log('[API Disconnect] Resposta recebida do bot:', data.message);

      res.status(botResponse.status).json({ message: data.message }); // Repassa status e mensagem do bot

    } catch (error: any) {
      console.error("[API Disconnect] Erro ao tentar desconectar via API interna:", error);
      res.status(503).json({ message: 'Erro ao comunicar com o serviço WhatsApp para desconectar', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}