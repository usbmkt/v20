// pages/api/whatsapp/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
    status: string;
    qrCodeString?: string | null;
};

const BOT_API_URL = `http://localhost:${process.env.WHATSAPP_BOT_API_PORT || 3001}`;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | { message: string; error?: string }>
) {
    if (req.method === 'GET') {
        try {
            const botResponse = await fetch(`${BOT_API_URL}/status`);
            if (!botResponse.ok) {
                const errorMsg = `Erro ao buscar status do bot: Status ${botResponse.status}`;
                console.error(`[API Status] Falha na comunicação: ${botResponse.status}`);
                throw new Error(errorMsg);
            }

            const botData = await botResponse.json();
            res.status(200).json({
                status: botData.status,
                qrCodeString: botData.qrCode // Passa a string completa do QR
            });
        } catch (error: any) {
            console.error("[API Status] Erro ao obter status:", error);
            res.status(503).json({ message: 'Erro ao comunicar com o serviço WhatsApp', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ message: `Método ${req.method} não permitido` });
    }
}