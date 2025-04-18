// pages/api/alerts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database/main.db');

// Função para conectar ao banco de dados
const connectDb = () => {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error('Erro ao conectar ao SQLite:', err.message);
      throw err; // Lança o erro para ser capturado pelo try/catch
    }
    console.log('Conectado ao SQLite.');
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let db: sqlite3.Database | null = null;
  try {
    db = connectDb();

    if (req.method === 'GET') {
      // Busca todos os alertas ordenados por timestamp decrescente
      db.all(`
        SELECT a.*, c.name as campaignName
        FROM alerts a
        LEFT JOIN campaigns c ON a.campaignId = c.id
        ORDER BY a.timestamp DESC
      `, [], (err, rows) => {
        if (err) {
          console.error('Erro ao buscar alertas:', err.message);
          return res.status(500).json({ error: 'Erro ao buscar alertas' });
        }
        res.status(200).json(rows);
      });

    } else if (req.method === 'POST') {
      const { message, type, campaignId } = req.body;
      if (!message || !type) {
        return res.status(400).json({ error: 'Mensagem e tipo são obrigatórios' });
      }
      // Insere um novo alerta
      db.run(`INSERT INTO alerts (message, type, campaignId, timestamp, read) VALUES (?, ?, ?, datetime('now'), ?)`,
        [message, type, campaignId || null, false], function (err) {
          if (err) {
            console.error('Erro ao criar alerta:', err.message);
            return res.status(500).json({ error: 'Erro ao criar alerta' });
          }
          // Retorna o alerta criado com o ID
          res.status(201).json({ id: this.lastID, message, type, campaignId, timestamp: new Date().toISOString(), read: false });
        });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erro na API de alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Erro ao fechar conexão SQLite:', err.message);
        }
      });
    }
  }
}