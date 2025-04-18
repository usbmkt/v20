// pages/api/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { initializeDatabase, findUserByUsername, createUser } from '@/lib/db'; // Funções do db.js

const SALT_ROUNDS = 10; // Fator de custo para o hashing (10 é um bom valor padrão)

type RegisterResponse = {
    message: string;
    error?: string; // Inclui campo de erro para detalhes no servidor
    user?: { id: number; username: string; created_at: string }; // Retorna dados não sensíveis do usuário criado
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }

  const { username, password } = req.body;

  // Validações básicas de entrada
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
  }
  if (typeof username !== 'string' || typeof password !== 'string') {
     return res.status(400).json({ message: 'Tipo inválido para usuário ou senha.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres.' });
  }
  if (username.length < 3) {
    return res.status(400).json({ message: 'Usuário deve ter pelo menos 3 caracteres.' });
  }
  // Validação de caracteres permitidos no username
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
       return res.status(400).json({ message: 'Nome de usuário pode conter apenas letras, números e underscore (_).' });
   }

  try {
    await initializeDatabase(); // Garante que a conexão e a tabela existam

    // Verifica se usuário já existe
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      console.warn(`[API Register] Tentativa de registrar usuário já existente: ${username}`);
      return res.status(409).json({ message: 'Nome de usuário já existe.' }); // 409 Conflict
    }

    // Cria o hash da senha
    console.log(`[API Register] Gerando hash para senha do usuário: ${username}`);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Cria o usuário no banco de dados
    const newUser = await createUser(username, passwordHash);
    console.log(`[API Register] Usuário '${username}' criado com ID: ${newUser.id}`);

    // Retorna sucesso com dados básicos do usuário (sem hash!)
    return res.status(201).json({ message: 'Usuário criado com sucesso!', user: newUser });

  } catch (error: any) {
    console.error('[API Register] Erro:', error);
    // Evita expor detalhes internos do DB no erro final
    const clientMessage = error.message?.includes('UNIQUE constraint failed: users.username')
      ? 'Nome de usuário já existe.' // Mensagem mais amigável para erro de constraint
      : 'Erro interno ao registrar usuário.';
    return res.status(500).json({ message: clientMessage, error: error.message }); // Loga o erro original no servidor
  }
}