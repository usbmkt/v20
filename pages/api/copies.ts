import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Interface para a entidade Copy (se não existir, crie ou importe de '@/entities/Copy')
interface Copy {
    id: string;
    title: string;
    content: string;
    cta: string;
    target_audience?: string;
    status?: string;
    campaign_id?: string; // Pode ser null ou string
    created_date: string;
    clicks?: number;
    impressions?: number;
    conversions?: number;
}


// Ajuste o caminho conforme necessário para apontar para a raiz do projeto
const dbPath = path.resolve(process.cwd(), 'database.db');
console.log("[API Copies] DB Path:", dbPath); // Log para depuração

// Função para abrir a conexão com o banco de dados de forma segura
let dbPromise: Promise<any> | null = null;
const getDb = () => {
  if (!dbPromise) {
    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database
    }).catch(err => {
       // Alteração: Removido err.code
      console.error(`[API Copies] FALHA ao conectar/criar SQLite em ${dbPath}: ${err.message}`);
      dbPromise = null;
       // Alteração: Removido err.code
      throw new Error(`SQLITE Error: Não foi possível abrir o banco de dados em ${dbPath}. ${err.message}`);
    });
    console.log(`[API Copies] Nova promessa de conexão criada para ${dbPath}.`);
  } else {
     console.log(`[API Copies] Usando promessa de conexão existente para ${dbPath}.`);
  }
  return dbPromise;
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let db;
  try {
    db = await getDb();
    console.log("[API Copies] Conexão DB obtida.");

    switch (req.method) {
      case 'GET':
        try {
          const { campaign_id } = req.query; // Filtrar por campaign_id se fornecido
          let copies: Copy[];
          if (campaign_id) {
            copies = await db.all('SELECT * FROM copies WHERE campaign_id = ?', [campaign_id]);
            console.log(`[API Copies GET] ${copies.length} cópias encontradas para campanha ${campaign_id}.`);
          } else {
            copies = await db.all('SELECT * FROM copies');
            console.log(`[API Copies GET] ${copies.length} cópias encontradas (todas).`);
          }
          res.status(200).json(copies);
        } catch (error: any) {
          console.error('[API Copies GET] Erro ao buscar cópias:', error.message);
          res.status(500).json({ message: 'Erro ao buscar cópias', error: error.message });
        }
        break;

      case 'POST':
        try {
          const { title, content, cta, target_audience, status, campaign_id } = req.body;

          if (!title || !content || !cta) {
            return res.status(400).json({ message: 'Título, Conteúdo e CTA são obrigatórios.' });
          }

          const id = crypto.randomUUID();
          const created_date = new Date().toISOString();
          const defaultStatus = status || 'draft';
          const defaultAudience = target_audience || '';
          const defaultCampaignId = campaign_id || null; // Permitir nulo se não associado

          // Prepare data matching the interface/table structure
          const copyData: Omit<Copy, 'id' | 'created_date'> & { id: string, created_date: string } = {
            id,
            title,
            content,
            cta,
            target_audience: defaultAudience,
            status: defaultStatus,
            campaign_id: defaultCampaignId,
            created_date,
            clicks: 0, // Default values
            impressions: 0,
            conversions: 0,
          };


          await db.run(
            `INSERT INTO copies (id, title, content, cta, target_audience, status, campaign_id, created_date, clicks, impressions, conversions)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                copyData.id, copyData.title, copyData.content, copyData.cta,
                copyData.target_audience, copyData.status, copyData.campaign_id,
                copyData.created_date, copyData.clicks, copyData.impressions, copyData.conversions
            ]
          );

          console.log(`[API Copies POST] Cópia criada: ID ${id}`);
          res.status(201).json(copyData); // Retorna o objeto criado

        } catch (error: any) {
          console.error('[API Copies POST] Erro ao criar cópia:', error.message);
          res.status(500).json({ message: 'Erro ao criar cópia', error: error.message });
        }
        break;

        case 'PUT': // Para atualizar uma cópia existente
            try {
              const { id } = req.query; // Assume que o ID vem na URL: /api/copies?id=xyz
              const { title, content, cta, target_audience, status, campaign_id, clicks, impressions, conversions } = req.body;

              if (!id) {
                return res.status(400).json({ message: 'ID da cópia é obrigatório para atualização.' });
              }

              // Constrói a query dinamicamente (cuidado com SQL Injection se não usar placeholders)
              // É melhor listar os campos explicitamente
              const fieldsToUpdate: string[] = [];
              const params: any[] = [];

              if (title !== undefined) { fieldsToUpdate.push('title = ?'); params.push(title); }
              if (content !== undefined) { fieldsToUpdate.push('content = ?'); params.push(content); }
              if (cta !== undefined) { fieldsToUpdate.push('cta = ?'); params.push(cta); }
              if (target_audience !== undefined) { fieldsToUpdate.push('target_audience = ?'); params.push(target_audience); }
              if (status !== undefined) { fieldsToUpdate.push('status = ?'); params.push(status); }
              if (campaign_id !== undefined) { fieldsToUpdate.push('campaign_id = ?'); params.push(campaign_id); }
              if (clicks !== undefined) { fieldsToUpdate.push('clicks = ?'); params.push(clicks); }
              if (impressions !== undefined) { fieldsToUpdate.push('impressions = ?'); params.push(impressions); }
              if (conversions !== undefined) { fieldsToUpdate.push('conversions = ?'); params.push(conversions); }


              if (fieldsToUpdate.length === 0) {
                return res.status(400).json({ message: 'Nenhum campo fornecido para atualização.' });
              }

              params.push(id); // Adiciona o ID para a cláusula WHERE

              const sql = `UPDATE copies SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

              const result = await db.run(sql, params);

              if (result.changes === 0) {
                  return res.status(404).json({ message: `Cópia com ID ${id} não encontrada.` });
              }

              // Busca a cópia atualizada para retornar
              const updatedCopy = await db.get('SELECT * FROM copies WHERE id = ?', id);

              console.log(`[API Copies PUT] Cópia atualizada: ID ${id}`);
              res.status(200).json(updatedCopy);

            } catch (error: any) {
              console.error(`[API Copies PUT] Erro ao atualizar cópia ${req.query.id}:`, error.message);
              res.status(500).json({ message: 'Erro ao atualizar cópia', error: error.message });
            }
            break;

        case 'DELETE': // Para deletar uma cópia
            try {
                const { id } = req.query; // Assume ID na URL

                if (!id) {
                    return res.status(400).json({ message: 'ID da cópia é obrigatório para exclusão.' });
                }

                const result = await db.run('DELETE FROM copies WHERE id = ?', [id]);

                if (result.changes === 0) {
                    return res.status(404).json({ message: `Cópia com ID ${id} não encontrada.` });
                }

                console.log(`[API Copies DELETE] Cópia excluída: ID ${id}`);
                res.status(200).json({ message: `Cópia ${id} excluída com sucesso.` }); // ou res.status(204).end();

            } catch (error: any) {
                console.error(`[API Copies DELETE] Erro ao excluir cópia ${req.query.id}:`, error.message);
                res.status(500).json({ message: 'Erro ao excluir cópia', error: error.message });
            }
            break;


      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('[API Copies Handler] Erro geral:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
}