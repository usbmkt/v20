// pages/api/whatsapp/connect.ts
import type { NextApiRequest, NextApiResponse } from 'next';
// *** NENHUMA IMPORTAÇÃO DE '@/lib/whatsappBot' AQUI ***

type ResponseData = {
  message: string;
  status?: string;
};

const BOT_API_URL = `http://localhost:${process.env.WHATSAPP_BOT_API_PORT || 3001}`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { message: string; error?: string }>
) {
  if (req.method === 'POST') {
    console.log('[API Connect] Recebida solicitação para iniciar conexão via API interna...');
    try {
      const botResponse = await fetch(`${BOT_API_URL}/connect`, { method: 'POST' });

       if (!botResponse.ok) {
         let errorMsg = `Erro ao solicitar conexão ao bot: Status ${botResponse.status}`;
         try { const errorJson = await botResponse.json(); errorMsg = errorJson.message || errorMsg; } catch (e) {}
         console.error(`[API Connect] Falha na comunicação com a API do bot: ${botResponse.status}`);
         throw new Error(errorMsg);
       }

      const data = await botResponse.json();
      console.log('[API Connect] Resposta recebida do bot:', data.message);

      const status = botResponse.status === 200 ? 200 : 202; // 200 se já estava conectado/conectando, 202 se iniciou agora
      res.status(status).json({ message: data.message, status: data.status });

    } catch (error: any) {
      console.error("[API Connect] Erro ao tentar iniciar conexão via API interna:", error);
       res.status(503).json({ message: 'Erro ao comunicar com o serviço WhatsApp para iniciar conexão', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}