// C:\Users\ADM\Desktop\USB MKT PRO V3\pages\api\whatsapp/send.ts
import { NextApiRequest, NextApiResponse } from 'next';
// Importa a função de envio SE o bot rodar no mesmo processo.
// Se rodar separado, esta importação NÃO funcionará diretamente.
// Você precisaria de uma camada de comunicação (ex: API interna no bot).
// import { sendWhatsAppMessage } from '../../../lib/whatsappBot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { number, message } = req.body;

    if (!number || !message) {
      return res.status(400).json({ success: false, error: 'Número e mensagem são obrigatórios.' });
    }

    // Formata o número para o padrão JID do WhatsApp (ex: 5521999998888@s.whatsapp.net)
    // Remove caracteres não numéricos e adiciona o sufixo
    const jid = `${number.replace(/\D/g, '')}@s.whatsapp.net`;

    try {
      // --- PONTO DE ATENÇÃO ---
      // Chamar sendWhatsAppMessage diretamente só funciona se o bot
      // estiver rodando no *mesmo processo* do servidor Next.js.
      // Isso geralmente NÃO é recomendado para o Baileys.
      // A linha abaixo é um EXEMPLO de como seria, mas provavelmente falhará
      // se o bot rodar com "node lib/whatsappBot.js".

      // await sendWhatsAppMessage(jid, { text: message });

      // Simulação de sucesso para fins de exemplo da API
      console.log(`API /send: Simulado envio para ${jid}: "${message}"`);
      console.warn("AVISO: A API /send atualmente apenas simula o envio. O bot precisa rodar separadamente e a comunicação inter-processos não está implementada aqui.");

      res.status(200).json({ success: true, message: 'Envio simulado com sucesso (ver console do bot para resposta real se Typebot estiver ativo).' });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro no endpoint /api/whatsapp/send:', errorMessage);
      // Use 500 para erro interno, 503 talvez se for falha de comunicação com o bot
      res.status(500).json({ success: false, error: 'Falha ao processar envio: ' + errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}