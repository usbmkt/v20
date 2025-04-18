// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { initializeDatabase, findUserByUsername, updateUserLoginInfo } from '@/lib/db';

type LoginResponse = {
    token: string;
    message: string;
} | {
    message: string;
    error?: string;
}

// Busca a chave secreta do ambiente. Crash do servidor se não definida é intencional aqui.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("\n\nFATAL ERROR: JWT_SECRET is not defined in environment variables.\n" +
                  "Please add JWT_SECRET='your-strong-secret-key' to your .env.local file.\n" +
                  "Generate a strong key using a tool like `openssl rand -base64 32`.\n\n");
    process.exit(1); // Impede o servidor de iniciar sem a chave
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // Token expira em 1 hora por padrão

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }

  const { username, password } = req.body;

  // Validações básicas
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
  }
   if (typeof username !== 'string' || typeof password !== 'string') {
       return res.status(400).json({ message: 'Tipo inválido para usuário ou senha.' });
   }

  try {
    await initializeDatabase(); // Garante conexão com o DB

    // Busca usuário pelo username
    const user = await findUserByUsername(username);
    if (!user) {
      console.warn(`[API Login] Usuário não encontrado: ${username}`);
      // Resposta genérica para evitar enumeração de usuários
      return res.status(401).json({ message: 'Usuário ou senha inválidos.' }); // Unauthorized
    }

    // Compara a senha fornecida com o hash armazenado
    console.log(`[API Login] Verificando senha para usuário: ${username}`);
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.warn(`[API Login] Senha inválida para usuário: ${username}`);
      return res.status(401).json({ message: 'Usuário ou senha inválidos.' }); // Unauthorized
    }

    // Senha válida! Atualiza informações de login (login_count, last_login_at)
    // Faz isso de forma assíncrona (não espera completar para gerar o token)
    updateUserLoginInfo(user.id).catch(updateError => {
        // Loga o erro, mas não impede o login
        console.error(`[API Login] Falha assíncrona ao atualizar info de login para user ID ${user.id}:`, updateError);
    });

    // Gera o Token JWT
    const payload = {
      userId: user.id,
      username: user.username,
      // Adicione outros dados NÃO SENSÍVEIS se necessário (ex: roles/permissions)
      // iss: 'sua-aplicacao', // Issuer (opcional)
      // aud: 'seu-publico',   // Audience (opcional)
    };
    console.log(`[API Login] Gerando token JWT para usuário: ${username} (ID: ${user.id}) com expiração em ${JWT_EXPIRES_IN}`);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log(`[API Login] Usuário '${username}' (ID: ${user.id}) autenticado com sucesso. Login Count (antes): ${user.login_count}`);

    // Retorna sucesso com o token
    return res.status(200).json({ token: token, message: 'Login bem-sucedido!' });

  } catch (error: any) {
    console.error('[API Login] Erro:', error);
    return res.status(500).json({ message: 'Erro interno durante o login.', error: error.message });
  }
}