// pages/api/file/[...filePath].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import crypto from 'crypto'; // Usar crypto para IDs únicos

const CWD = process.cwd();
console.log(`[API File Init] Current Working Directory (CWD): ${CWD}`);

const UPLOAD_DIR = path.resolve(CWD, 'uploads');
console.log(`[API File Init] Resolved Upload Directory: ${UPLOAD_DIR}`);

if (!fs.existsSync(UPLOAD_DIR)) {
    console.error(`[API File Init] ERRO CRÍTICO: Diretório de uploads NÃO ENCONTRADO na inicialização: ${UPLOAD_DIR}`);
} else {
     console.log(`[API File Init] Diretório de uploads ENCONTRADO na inicialização: ${UPLOAD_DIR}`);
}

export const config = {
    api: {
        bodyParser: false, // Fundamental para formidable
    },
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const { filePath } = req.query;
    const reqId = crypto.randomUUID();
    console.log(`\n[API File ${reqId} - ${req.method}] Start - URL: ${req.url}`);

    if (!filePath || !Array.isArray(filePath) || filePath.length === 0) {
        console.warn(`[API File ${reqId}] Invalid filePath query:`, filePath);
        return res.status(400).json({ error: 'Caminho do arquivo inválido.' });
    }

    // *** Filtro mais robusto para segmentos do path ***
    const safeSegments = filePath
        .map(segment => decodeURIComponent(segment)) // Decodifica segmentos da URL
        .filter(segment => segment && segment !== '..' && !segment.includes('/') && !segment.includes('\\')); // Remove vazios, .. e barras

    if (safeSegments.length === 0) {
         console.error(`[API File ${reqId}] Invalid path after filtering. Original: ${filePath.join('/')}`);
         return res.status(400).json({ error: 'Caminho inválido após filtragem.' });
    }

    const relativePathFromUploads = path.join(...safeSegments);
    const absolutePath = path.resolve(UPLOAD_DIR, relativePathFromUploads);

    console.log(`[API File ${reqId}] Relative Path: ${relativePathFromUploads}`);
    console.log(`[API File ${reqId}] Absolute Path to check: ${absolutePath}`);

    // Security Check
    if (!absolutePath.startsWith(UPLOAD_DIR + path.sep) && absolutePath !== UPLOAD_DIR) {
        console.error(`[API File ${reqId}] FORBIDDEN! Path ${absolutePath} is outside ${UPLOAD_DIR}`);
        return res.status(403).json({ error: 'Acesso proibido.' });
    }
    console.log(`[API File ${reqId}] Security check passed.`);

    try {
        await fs.promises.access(absolutePath, fs.constants.R_OK);
        console.log(`[API File ${reqId}] File exists and is readable: ${absolutePath}`);

        const stats = await fs.promises.stat(absolutePath);
        if (!stats.isFile()) {
             console.warn(`[API File ${reqId}] Not a file: ${absolutePath}`);
             return res.status(404).json({ error: 'Recurso não é um arquivo.' });
        }

        const mimeType = mime.lookup(absolutePath) || 'application/octet-stream';
        const totalSize = stats.size;
        const rangeHeader = req.headers.range;
        const filename = path.basename(absolutePath);
        // Usar encodeURIComponent para nomes de arquivo em headers
        const encodedFilename = encodeURIComponent(filename);

        console.log(`[API File ${reqId}] MimeType: ${mimeType}, Size: ${totalSize}`);

        // Set Common Headers
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        res.setHeader('Accept-Ranges', 'bytes');

        // Content-Disposition logic
        if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
             res.setHeader('Content-Disposition', `inline; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
        } else {
             res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
        }

        // Range Request Handling
        if (rangeHeader && (mimeType.startsWith('video/') || mimeType.startsWith('audio/'))) {
            console.log(`[API File ${reqId}] Handling Range Request: ${rangeHeader}`);
            const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d+)?/);

            if (!rangeMatch) {
                console.warn(`[API File ${reqId}] Invalid Range format: ${rangeHeader}`);
                res.setHeader('Content-Range', `bytes */${totalSize}`);
                return res.status(416).send('Range Not Satisfiable');
            }

            let start = parseInt(rangeMatch[1], 10);
            let end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : totalSize - 1;

            // Clamp ranges to valid boundaries
            start = Math.max(0, start);
            end = Math.min(end, totalSize - 1);

            if (isNaN(start) || isNaN(end) || start > end || start >= totalSize ) {
                console.warn(`[API File ${reqId}] Invalid Range values after clamp: start=${start}, end=${end}, Total Size: ${totalSize}`);
                res.setHeader('Content-Range', `bytes */${totalSize}`);
                return res.status(416).send('Range Not Satisfiable');
            }

            const chunksize = (end - start) + 1;
            console.log(`[API File ${reqId}] Serving Range: bytes ${start}-${end}/${totalSize} (${chunksize} bytes)`);

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Content-Length': chunksize,
                // Other headers already set
            });

            const fileStream = fs.createReadStream(absolutePath, { start, end });
            fileStream.pipe(res);
            fileStream.on('error', (streamErr) => { console.error(`[API File ${reqId}] Stream Range Error:`, streamErr); if (!res.writableEnded) res.end(); });
            fileStream.on('end', () => { console.log(`[API File ${reqId}] Stream Range finished.`); });

        } else {
            // Serve Full File
            console.log(`[API File ${reqId}] Serving Full File`);
            res.setHeader('Content-Length', totalSize.toString());
            res.writeHead(200);

            const fileStream = fs.createReadStream(absolutePath);
            fileStream.pipe(res);
            fileStream.on('error', (streamErr) => { console.error(`[API File ${reqId}] Stream Full Error:`, streamErr); if (!res.writableEnded) res.end(); });
            fileStream.on('end', () => { console.log(`[API File ${reqId}] Stream Full finished.`); });
        }

    } catch (error: any) {
         if (error.code === 'ENOENT') {
            console.error(`[API File ${reqId}] ERROR 404: ENOENT. Path checked: ${absolutePath}`);
            res.status(404).json({ error: 'Arquivo não encontrado.', pathChecked: relativePathFromUploads });
        } else if (error.code === 'EACCES') {
             console.error(`[API File ${reqId}] ERROR 403: EACCES. Path checked: ${absolutePath}`);
             res.status(403).json({ error: 'Permissão negada para acessar o arquivo.', pathChecked: relativePathFromUploads });
        } else {
            // Log o erro específico se não for ENOENT ou EACCES
            console.error(`[API File ${reqId}] SERVER ERROR processing ${absolutePath}:`, error); // Log completo do erro
            if (!res.writableEnded) {
                 res.status(500).json({ error: 'Erro interno do servidor ao acessar arquivo.', details: error.message });
            } else {
                 console.log(`[API File ${reqId}] Response already ended, cannot send 500.`);
            }
        }
    } finally {
         console.log(`[API File ${reqId}] --- Request End ---`);
    }
}