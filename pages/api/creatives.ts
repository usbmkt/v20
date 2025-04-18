// pages/api/creatives.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
    initializeDatabase,
    getAllCreatives,
    getCreativeById,
    createCreative,
    updateCreative,
    deleteCreative
} from '@/lib/db'; // Funções revisadas

interface Creative {
    id: string; name: string; campaign_id?: string | null; type: string;
    content: string; comments?: string | null; status?: string; platform?: string | string[]; format?: string; publish_date?: string | null; created_at?: string; updated_at?: string; originalFilename?: string;
}
type ResponseData = Creative[] | Creative | { message: string; error?: string } | { message: string, changes?: number };

const safeJsonParse = (str: string | string[] | undefined | null): string[] => { if (Array.isArray(str)) return str; if (typeof str !== 'string' || !str.trim()) return []; try { const parsed = JSON.parse(str); return Array.isArray(parsed) ? parsed : []; } catch (e) { if (str.includes(',')) { return str.split(',').map(s => s.trim()).filter(Boolean); } return []; } };

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    try {
        await initializeDatabase();

        switch (req.method) {
            case 'GET':
                const { id: getId, campaignId: getCampaignId } = req.query;
                if (getId) { /* ... (como antes, busca por ID já inclui comments) ... */ const creativeId = Array.isArray(getId) ? getId[0] : getId; const creative = await getCreativeById(creativeId); if (creative) { creative.platform = safeJsonParse(creative.platform); creative.content = typeof creative.content === 'string' ? creative.content : ''; creative.comments = creative.comments ?? null; res.status(200).json(creative as Creative); } else { res.status(404).json({ message: `Criativo ID ${creativeId} não encontrado.` }); } }
                else { /* ... (busca lista, já inclui comments) ... */ const campFilter = Array.isArray(getCampaignId) ? getCampaignId[0] : getCampaignId; const creatives = await getAllCreatives(campFilter || null); const parsedCreatives = creatives.map((c: any) => ({ ...c, content: typeof c.content === 'string' ? c.content : '', comments: c.comments ?? null, platform: safeJsonParse(c.platform), })); res.status(200).json(parsedCreatives as Creative[]); }
                break;

            case 'POST':
                 // *** Validação MAIS FORTE e tratamento de erro ***
                 const { name: postName, type: postType, content: postContent, ...restPostData } = req.body;
                 if (!postName || !postType || (postContent === undefined || postContent === null)) {
                     return res.status(400).json({ message: 'Nome, Tipo e Conteúdo são obrigatórios.' });
                 }
                 if (typeof postName !== 'string' || postName.trim() === '') {
                      return res.status(400).json({ message: 'Nome inválido.' });
                 }
                  if (typeof postType !== 'string' || !['image', 'video', 'headline', 'body', 'cta'].includes(postType)) {
                       return res.status(400).json({ message: 'Tipo inválido.' });
                  }
                 if (typeof postContent !== 'string') { // Content DEVE ser string (path ou texto)
                      return res.status(400).json({ message: 'Conteúdo inválido (deve ser string).' });
                 }

                 // Prepara dados, garantindo NULL para comments se não vier
                 const newCreativeData = {
                     ...restPostData, // Inclui campaign_id, status, platform, etc.
                     name: postName,
                     type: postType,
                     content: postContent,
                     comments: restPostData.comments || null // Garante null se vazio/undefined
                 };

                 console.log(`[API Creatives POST] Criando: ${postName}`);
                 const newCreative = await createCreative(newCreativeData); // DB salva comments
                 if (!newCreative) { // Verifica se o DB retornou o objeto criado
                     throw new Error("Falha ao criar criativo: DB não retornou o objeto.");
                 }
                 newCreative.platform = safeJsonParse(newCreative.platform);
                 newCreative.content = typeof newCreative.content === 'string' ? newCreative.content : '';
                 newCreative.comments = newCreative.comments ?? null;
                 res.status(201).json(newCreative as Creative);
                 break;

            case 'PUT':
                // *** (Lógica PUT mantida, já tratava comments) ***
                 const { id: updateIdQuery } = req.query; if (!updateIdQuery) { return res.status(400).json({ message: 'ID obrigatório na URL.' }); } const creativeIdToUpdate = Array.isArray(updateIdQuery) ? updateIdQuery[0] : updateIdQuery; const updateData = { ...req.body }; delete updateData.id; delete updateData.created_at; delete updateData.updated_at; if (updateData.comments !== undefined && updateData.comments === '') { updateData.comments = null; } else if (updateData.comments === undefined) { delete updateData.comments; } if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'Nenhum dado para atualizar.' }); } if (updateData.name !== undefined && (typeof updateData.name !== 'string' || updateData.name.trim() === '')) { return res.status(400).json({ message: 'Nome não pode ser vazio.' }); } if (updateData.type !== undefined && !['image', 'video', 'headline', 'body', 'cta'].includes(updateData.type)) { return res.status(400).json({ message: 'Tipo inválido.' }); } if (updateData.content !== undefined && (typeof updateData.content !== 'string' || updateData.content.trim() === '')) { if (!['image', 'video'].includes(updateData.type)) { return res.status(400).json({ message: 'Conteúdo texto não pode ser vazio.' }); } } console.log(`[API Creatives PUT] Atualizando ID: ${creativeIdToUpdate}`); const updateResult = await updateCreative(creativeIdToUpdate, updateData); if (updateResult.changes === 0) { const exists = await getCreativeById(creativeIdToUpdate); if (!exists) { return res.status(404).json({ message: `ID ${creativeIdToUpdate} não encontrado.` }); } return res.status(200).json({ message: 'Nenhuma alteração.', changes: 0 }); } const updatedCreative = await getCreativeById(creativeIdToUpdate); if (!updatedCreative) { throw new Error("Falha buscar após update."); } updatedCreative.platform = safeJsonParse(updatedCreative.platform); updatedCreative.content = typeof updatedCreative.content === 'string' ? updatedCreative.content : ''; updatedCreative.comments = updatedCreative.comments ?? null; res.status(200).json(updatedCreative as Creative);
                 break;

            case 'DELETE':
                 /* ... (como antes) ... */
                const { id: deleteIdQuery } = req.query; if (!deleteIdQuery) { return res.status(400).json({ message: 'ID obrigatório.' }); } const creativeIdToDelete = Array.isArray(deleteIdQuery) ? deleteIdQuery[0] : deleteIdQuery; console.log(`[API Creatives DELETE] Excluindo ID: ${creativeIdToDelete}`); const deleteResult = await deleteCreative(creativeIdToDelete); if (deleteResult.changes === 0) { return res.status(404).json({ message: `ID ${creativeIdToDelete} não encontrado.` }); } res.status(200).json({ message: `Criativo ${creativeIdToDelete} excluído.` });
                break;


            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                res.status(405).json({ message: `Método ${req.method} não permitido` });
        }
    } catch (error: any) {
        console.error(`[API Creatives ${req?.method || 'Unknown Method'}] Erro geral:`, error);
        res.status(500).json({ message: 'Erro interno no servidor ao processar criativos.', error: error.message });
    }
}