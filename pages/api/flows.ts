// pages/api/flows.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
    initializeDatabase,
    getAllFlows as getAllFlowsFromDb,
    getFlowById as getFlowByIdFromDb,
    createFlow as createFlowInDb,
    updateFlow as updateFlowInDb,
    deleteFlow as deleteFlowInDb
} from '@/lib/db';

// Tipos
interface FlowData {
    id: number;
    name: string;
    status: 'active' | 'inactive' | 'draft';
    campaign_id?: string | null;
    elements?: { nodes: any[]; edges: any[] } | null;
    created_at?: string;
    updated_at?: string;
}
type FlowListItem = Omit<FlowData, 'elements'>;
type ResponseData =
    | FlowListItem[]
    | FlowData
    | { message: string; error?: string }
    | { message: string; changes?: number }
    | FlowData;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    try {
        // --- GET: Buscar Fluxos ---
        if (req.method === 'GET') {
            const { id, campaignId } = req.query;

            if (id) {
                // --- GET por ID ---
                const flowId = Array.isArray(id) ? id[0] : id;
                const flowIdNum = parseInt(flowId, 10);
                 if (isNaN(flowIdNum)) {
                    return res.status(400).json({ message: "ID do fluxo inválido." });
                 }
                console.log(`[API Flows GET] Buscando fluxo com ID: ${flowIdNum}`);
                const flow = await getFlowByIdFromDb(flowIdNum);
                if (flow) {
                    if (flow.elements && typeof flow.elements === 'object') {
                        if (!Array.isArray(flow.elements.nodes)) flow.elements.nodes = [];
                        if (!Array.isArray(flow.elements.edges)) flow.elements.edges = [];
                    } else {
                        flow.elements = { nodes: [], edges: [] };
                    }
                    res.status(200).json(flow as FlowData);
                } else {
                    res.status(404).json({ message: `Fluxo com ID ${flowIdNum} não encontrado` });
                }
            } else {
                // --- GET Lista ---
                const campIdValue = Array.isArray(campaignId) ? campaignId[0] : campaignId;
                console.log(`[API Flows GET] Buscando lista com campaignId: ${campIdValue || 'todos'}`);

                // Correção aplicada para lidar com 'all', 'none', ID ou undefined
                let filterValue: string | null | undefined = undefined; // Default busca todos
                if (campIdValue === 'none') {
                    filterValue = null; // Busca fluxos sem campanha
                } else if (campIdValue && campIdValue !== 'all') {
                    filterValue = campIdValue; // Busca por ID de campanha específico
                }

                const flows = await getAllFlowsFromDb(filterValue); // Passa o valor correto

                console.log(`[API Flows GET] Retornando ${flows.length} fluxos.`);
                res.status(200).json(flows as FlowListItem[]);
            }
        }
        // --- POST: Criar Novo Fluxo ---
        else if (req.method === 'POST') {
            const { name, campaign_id } = req.body;
            if (!name || typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ message: "Nome do fluxo é obrigatório." });
            }
            console.log(`[API Flows POST] Criando fluxo: ${name}, Campanha ID: ${campaign_id}`);
            const newFlow = await createFlowInDb(name.trim(), campaign_id || null);
            if (!newFlow) {
                throw new Error("Falha ao criar fluxo ou retornar dados após criação.");
            }
            console.log(`[API Flows POST] Fluxo criado com ID: ${newFlow.id}`);
             if (!newFlow.elements) {
                 newFlow.elements = { nodes: [], edges: [] };
             }
            res.status(201).json(newFlow as FlowData);
        }
        // --- PUT: Atualizar Fluxo Existente ---
        else if (req.method === 'PUT') {
            const { id } = req.query;
            const { name, campaign_id, elements, status } = req.body;

            if (!id) { return res.status(400).json({ message: "ID do fluxo é obrigatório para atualização." }); }
            const flowId = Array.isArray(id) ? id[0] : id;
            const flowIdNum = parseInt(flowId, 10);
            if (isNaN(flowIdNum)) {
               return res.status(400).json({ message: "ID do fluxo inválido." });
            }

            const dataToUpdate: Partial<Omit<FlowData, 'id' | 'created_at' | 'updated_at'>> = {};
            if (name !== undefined) dataToUpdate.name = name.trim();
            if (campaign_id !== undefined) dataToUpdate.campaign_id = campaign_id === 'none' || campaign_id === '' ? null : campaign_id;
            if (elements !== undefined) {
                if (elements === null || (typeof elements === 'object' && Array.isArray(elements.nodes) && Array.isArray(elements.edges))) {
                    dataToUpdate.elements = elements;
                } else {
                    console.warn(`[API Flows PUT] Estrutura de 'elements' inválida recebida para ID ${flowIdNum}. Ignorando atualização de elements.`);
                }
            }
            if (status !== undefined) {
                 if (['active', 'inactive', 'draft'].includes(status)) {
                    dataToUpdate.status = status;
                 } else {
                     return res.status(400).json({ message: `Status inválido: ${status}. Use 'active', 'inactive' ou 'draft'.` });
                 }
            }

            if (Object.keys(dataToUpdate).length === 0) {
                return res.status(400).json({ message: "Nenhum dado válido fornecido para atualização." });
            }
            if (dataToUpdate.name !== undefined && dataToUpdate.name === '') {
                return res.status(400).json({ message: "Nome do fluxo não pode ser vazio." });
            }

            console.log(`[API Flows PUT] Atualizando fluxo ID: ${flowIdNum} com dados:`, Object.keys(dataToUpdate));
            const result = await updateFlowInDb(flowIdNum, dataToUpdate);
            if (result.changes === 0) {
                const exists = await getFlowByIdFromDb(flowIdNum);
                if (exists) {
                    return res.status(200).json({ message: `Nenhuma alteração detectada para o fluxo ${flowIdNum}.`, changes: 0 });
                } else {
                    return res.status(404).json({ message: `Fluxo com ID ${flowIdNum} não encontrado para atualização.` });
                }
            }

             if (dataToUpdate.status === 'active') {
                 try {
                     // Tenta chamar a função de recarga do bot (pode falhar se o bot não estiver no mesmo processo)
                     const { loadFlowFromDb: reloadBotFlow } = require('@/lib/whatsappBot');
                     if (typeof reloadBotFlow === 'function') {
                        await reloadBotFlow();
                        console.log(`[API Flows PUT] Recarregamento do fluxo ativo no bot solicitado após atualização do ID ${flowIdNum}.`);
                     } else {
                         console.warn(`[API Flows PUT] Função loadFlowFromDb não encontrada ou não é uma função em whatsappBot.js.`);
                     }
                 } catch (reloadError: any) {
                     console.error(`[API Flows PUT] Erro ao tentar recarregar fluxo no bot para ID ${flowIdNum}:`, reloadError.message);
                     // Continua a resposta, mas avisa sobre a falha na recarga do bot
                      return res.status(200).json({ message: `Fluxo ${flowIdNum} atualizado, mas houve erro ao recarregar no bot.`, changes: result.changes });
                 }
             }

            res.status(200).json({ message: `Fluxo ${flowIdNum} atualizado com sucesso.`, changes: result.changes });
        }
         // --- DELETE: Deletar Fluxo ---
         else if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) { return res.status(400).json({ message: "ID do fluxo é obrigatório para deletar." }); }
            const flowId = Array.isArray(id) ? id[0] : id;
            const flowIdNum = parseInt(flowId, 10);
            if (isNaN(flowIdNum)) {
               return res.status(400).json({ message: "ID do fluxo inválido." });
            }

            console.log(`[API Flows DELETE] Deletando fluxo ID: ${flowIdNum}`);
            const result = await deleteFlowInDb(flowIdNum);
            if (result.changes === 0) {
                return res.status(404).json({ message: `Fluxo com ID ${flowIdNum} não encontrado para deletar.` });
            }
            res.status(200).json({ message: `Fluxo ${flowIdNum} deletado com sucesso.`, changes: result.changes });
        }
        // --- Método não permitido ---
        else {
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).json({ message: `Método ${req.method} não permitido` });
        }

    } catch (error: any) {
        console.error(`[API Flows ${req.method}] Erro geral:`, error);
        res.status(500).json({ message: error.message || 'Erro interno no servidor ao processar solicitação de fluxos.' });
    }
}