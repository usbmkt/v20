// C:\Users\ADM\Desktop\USB MKT PRO V3\pages\api\whatsapp\contacts.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Define a estrutura esperada para um contato
type Contact = {
    jid: string;
    name?: string;      // Nome definido pelo usuário no WhatsApp
    notify?: string;    // Nome push (geralmente o nome que o usuário definiu para si)
    imgUrl?: string;    // URL da foto de perfil (pode expirar ou requerer autenticação)
};

type ResponseData =
    | Contact[]
    | { message: string; error?: string };

// URL da API interna do bot
const BOT_API_URL = `http://localhost:${process.env.WHATSAPP_BOT_API_PORT || 3001}`;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === 'GET') {
        console.log('[API Contacts GET] Recebida solicitação para buscar contatos...');
        try {
            const botResponse = await fetch(`${BOT_API_URL}/contacts`);

            if (!botResponse.ok) {
                let errorMsg = `Erro ao buscar contatos do bot: Status ${botResponse.status}`;
                try {
                    const errorJson = await botResponse.json();
                    errorMsg = errorJson.message || errorMsg;
                } catch (e) {
                    // Ignora erro ao parsear JSON de erro
                }
                console.error(`[API Contacts GET] Falha na comunicação com a API do bot: ${botResponse.status}`);
                // Usar 503 Service Unavailable faz sentido se o bot não respondeu
                return res.status(503).json({ message: 'Serviço do bot indisponível ou falhou ao buscar contatos.', error: errorMsg });
            }

            const contacts: Contact[] = await botResponse.json();
            console.log(`[API Contacts GET] Retornando ${contacts.length} contatos.`);

            res.status(200).json(contacts);

        } catch (error: any) {
            console.error("[API Contacts GET] Erro ao tentar buscar contatos via API interna:", error);
            res.status(500).json({ message: 'Erro interno ao processar solicitação de contatos.', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ message: `Método ${req.method} não permitido` });
    }
}