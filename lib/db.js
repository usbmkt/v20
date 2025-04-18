// lib/db.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const crypto = require('crypto');

let db = null;

// Função exportada para obter/abrir a conexão
async function initializeDatabase() {
    // Retorna a instância existente se já estiver conectada e aberta
    if (db?.open) { // Usa optional chaining e verifica a propriedade 'open'
        // console.log('Reutilizando conexão SQLite existente.');
        return db;
    }
    try {
        console.log('Abrindo nova conexão SQLite...');
        const newDbInstance = await open({ filename: './database.db', driver: sqlite3.Database });
        console.log('Conectado SQLite.');
        await initializeDatabaseStructure(newDbInstance);
        db = newDbInstance; // Armazena a nova instância
        return db;
    } catch (err) {
        console.error('Erro CRÍTICO ao abrir/inicializar DB:', err.message);
        db = null; // Reseta em caso de erro
        throw err;
    }
}


// Função interna para verificar se coluna existe
async function columnExists(dbInstance, tableName, columnName) {
    try {
        const tableCheck = await dbInstance.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName]);
        if (!tableCheck) return false; // Tabela não existe
        const columns = await dbInstance.all(`PRAGMA table_info(${tableName})`);
        return columns.some(col => col.name === columnName);
    } catch (error) {
        console.error(`Erro ao verificar coluna ${tableName}.${columnName}:`, error);
        return false; // Assume que não existe em caso de erro
    }
}

// Função interna para inicializar/migrar estrutura
async function initializeDatabaseStructure(dbInstance) {
    if (!dbInstance) {
        console.error("initializeDatabaseStructure chamada com dbInstance nulo.");
        return;
    }
    console.log("Verificando/Criando estrutura DB...");
    await dbInstance.exec(`PRAGMA foreign_keys = ON;`);

    // Users
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
          login_count INTEGER DEFAULT 0, last_login_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`);
    if (!await columnExists(dbInstance, 'users', 'login_count')) { await dbInstance.exec("ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0").catch(e => console.warn("Warn add login_count:", e.message)); }
    if (!await columnExists(dbInstance, 'users', 'last_login_at')) { await dbInstance.exec("ALTER TABLE users ADD COLUMN last_login_at DATETIME").catch(e => console.warn("Warn add last_login_at:", e.message)); }

    // Campaigns
    await dbInstance.exec(`
     CREATE TABLE IF NOT EXISTS campaigns (
       id TEXT PRIMARY KEY, name TEXT NOT NULL, platform TEXT, objective TEXT, budget REAL, daily_budget REAL,
       duration INTEGER, revenue REAL, leads INTEGER, clicks INTEGER, sales INTEGER, industry TEXT,
       targetAudience TEXT, segmentation TEXT, adFormat TEXT, avgTicket REAL, purchaseFrequency REAL, customerLifespan INTEGER,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
     );`);
    if (!await columnExists(dbInstance, 'campaigns', 'avgTicket')) { await dbInstance.exec("ALTER TABLE campaigns ADD COLUMN avgTicket REAL").catch(e => console.warn("Warn add avgTicket:", e.message)); }
    if (!await columnExists(dbInstance, 'campaigns', 'purchaseFrequency')) { await dbInstance.exec("ALTER TABLE campaigns ADD COLUMN purchaseFrequency REAL").catch(e => console.warn("Warn add purchaseFrequency:", e.message)); }
    if (!await columnExists(dbInstance, 'campaigns', 'customerLifespan')) { await dbInstance.exec("ALTER TABLE campaigns ADD COLUMN customerLifespan INTEGER").catch(e => console.warn("Warn add customerLifespan:", e.message)); }

    // Alerts
    await dbInstance.exec(`
     CREATE TABLE IF NOT EXISTS alerts (
       id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, message TEXT NOT NULL, metric TEXT,
       value REAL, threshold REAL, created_date TEXT, read INTEGER DEFAULT 0,
       campaignId TEXT, FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE SET NULL
     );`);
    if (!await columnExists(dbInstance, 'alerts', 'campaignId')) { await dbInstance.exec("ALTER TABLE alerts ADD COLUMN campaignId TEXT REFERENCES campaigns(id) ON DELETE SET NULL").catch(e => console.warn("Warn add campaignId alerts:", e.message)); }

    // Copies
    await dbInstance.exec(`
     CREATE TABLE IF NOT EXISTS copies (
       id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, cta TEXT NOT NULL, target_audience TEXT,
       status TEXT, campaign_id TEXT, created_date TEXT, clicks INTEGER DEFAULT 0, impressions INTEGER DEFAULT 0,
       conversions INTEGER DEFAULT 0, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
     );`);

    // Flows
    await dbInstance.exec(`
     CREATE TABLE IF NOT EXISTS flows (
       id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, campaign_id TEXT,
       status TEXT DEFAULT 'inactive' CHECK(status IN ('active', 'inactive', 'draft')), elements TEXT,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
     );`);
    if (!await columnExists(dbInstance, 'flows', 'campaign_id')) { await dbInstance.exec('ALTER TABLE flows ADD COLUMN campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL').catch(e => console.warn("Warn add campaign_id flows:", e.message)); }
    if (!await columnExists(dbInstance, 'flows', 'status')) { await dbInstance.exec("ALTER TABLE flows ADD COLUMN status TEXT DEFAULT 'inactive' CHECK(status IN ('active', 'inactive', 'draft'))").catch(e => console.warn("Warn add status flows:", e.message)); }

    // Creatives - Definição Final Garantida
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS creatives (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        campaign_id TEXT,
        type TEXT NOT NULL CHECK(type IN ('image', 'video', 'headline', 'body', 'cta')),
        content TEXT NOT NULL DEFAULT '', -- Garante que não seja NULL
        comments TEXT, -- Permite NULL
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'archived')),
        platform TEXT,
        format TEXT,
        publish_date DATETIME,
        originalFilename TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
      );`);
    console.log("Tabela 'creatives' verificada.");
    // Adiciona colunas se faltarem (sem alterar as existentes)
    if (!await columnExists(dbInstance, 'creatives', 'content')) { await dbInstance.exec("ALTER TABLE creatives ADD COLUMN content TEXT NOT NULL DEFAULT ''").catch(e => console.warn("Warn add content creatives:", e.message)); }
    if (!await columnExists(dbInstance, 'creatives', 'comments')) { await dbInstance.exec("ALTER TABLE creatives ADD COLUMN comments TEXT").catch(e => console.warn("Warn add comments creatives:", e.message)); }
    if (!await columnExists(dbInstance, 'creatives', 'publish_date')) { await dbInstance.exec("ALTER TABLE creatives ADD COLUMN publish_date DATETIME").catch(e => console.warn("Warn add publish_date creatives:", e.message)); }
    if (!await columnExists(dbInstance, 'creatives', 'originalFilename')) { await dbInstance.exec("ALTER TABLE creatives ADD COLUMN originalFilename TEXT").catch(e => console.warn("Warn add originalFilename creatives:", e.message)); }

   // Triggers
   await dbInstance.exec(`CREATE TRIGGER IF NOT EXISTS update_flow_updated_at AFTER UPDATE ON flows FOR EACH ROW BEGIN UPDATE flows SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;`);
   await dbInstance.exec(`CREATE TRIGGER IF NOT EXISTS update_campaign_updated_at AFTER UPDATE ON campaigns FOR EACH ROW BEGIN UPDATE campaigns SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;`);
   await dbInstance.exec(`CREATE TRIGGER IF NOT EXISTS update_copy_updated_at AFTER UPDATE ON copies FOR EACH ROW BEGIN UPDATE copies SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;`);
   await dbInstance.exec(`CREATE TRIGGER IF NOT EXISTS update_creative_updated_at AFTER UPDATE ON creatives FOR EACH ROW BEGIN UPDATE creatives SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id; END;`);
   console.log("Triggers verificados/criados.");
   console.log("Estrutura DB verificada/criada com sucesso.");
}

// --- CRUD Campaigns, Flows, Users (Mantidos) ---
async function getCampaignsForSelect() { const dbConn = await initializeDatabase(); try { return await dbConn.all('SELECT id, name FROM campaigns ORDER BY name ASC'); } catch (error) { console.error("Erro buscar campanhas select:", error); return []; } }
async function getAllFlows(campaignIdFilter = null) { const dbConn = await initializeDatabase(); let query = 'SELECT id, name, status, campaign_id, updated_at FROM flows'; const params = []; if (campaignIdFilter !== null && campaignIdFilter !== undefined) { if (campaignIdFilter === 'none') { query += ' WHERE campaign_id IS NULL'; } else { query += ' WHERE campaign_id = ?'; params.push(campaignIdFilter); } } query += ' ORDER BY updated_at DESC, name ASC'; try { return await dbConn.all(query, params); } catch (error) { console.error("Erro buscar fluxos:", error); return []; } }
async function getFlowById(id) { const dbConn = await initializeDatabase(); if (id === null || id === undefined) { return null; } try { const row = await dbConn.get('SELECT * FROM flows WHERE id = ?', [id]); if (!row) return null; let parsedElements = null; try { parsedElements = row.elements ? JSON.parse(row.elements) : { nodes: [], edges: [] }; if (!Array.isArray(parsedElements?.nodes)) parsedElements.nodes = []; if (!Array.isArray(parsedElements?.edges)) parsedElements.edges = []; } catch (e) { console.error(`Erro parse elements flow ${id}:`, e); parsedElements = { nodes: [], edges: [] }; } return { ...row, elements: parsedElements }; } catch (error) { console.error(`Erro buscar fluxo ${id}:`, error); return null; } }
async function getActiveFlow() { const dbConn = await initializeDatabase(); try { const row = await dbConn.get("SELECT * FROM flows WHERE status = 'active' LIMIT 1"); if (!row) return null; let parsedElements = null; try { parsedElements = row.elements ? JSON.parse(row.elements) : { nodes: [], edges: [] }; if (!Array.isArray(parsedElements?.nodes)) parsedElements.nodes = []; if (!Array.isArray(parsedElements?.edges)) parsedElements.edges = []; } catch (e) { console.error(`Erro parse elements flow ativo ${row?.id}:`, e); parsedElements = { nodes: [], edges: [] }; } return { ...row, elements: parsedElements }; } catch (error) { console.error("Erro buscar fluxo ativo:", error); return null; } }
async function createFlow(name, campaign_id = null) { const dbConn = await initializeDatabase(); const elementsJson = JSON.stringify({ nodes: [], edges: [] }); const status = 'draft'; try { const result = await dbConn.run( 'INSERT INTO flows (name, campaign_id, elements, status, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [name, campaign_id, elementsJson, status] ); if (!result || result.lastID === undefined) { throw new Error("Falha criar fluxo."); } return getFlowById(result.lastID); } catch (error) { console.error("Erro criar fluxo:", error); throw error; } }
async function updateFlow(id, data) { const dbConn = await initializeDatabase(); const fields = []; const values = []; Object.keys(data).forEach(key => { if (key === 'id') return; if (key === 'elements' && data[key] !== undefined) { fields.push('elements = ?'); let elementsValue = data[key]; try { elementsValue = (elementsValue && typeof elementsValue === 'object') ? JSON.stringify(elementsValue) : JSON.stringify({ nodes: [], edges: [] }); } catch { elementsValue = JSON.stringify({ nodes: [], edges: [] }); } values.push(elementsValue); } else if (data[key] !== undefined) { if (key === 'campaign_id' && (data[key] === 'none' || data[key] === '')) { fields.push('campaign_id = ?'); values.push(null); } else { fields.push(`${key} = ?`); values.push(data[key]); } } }); if (fields.length === 0) { return { changes: 0 }; } values.push(id); const query = `UPDATE flows SET ${fields.join(', ')} WHERE id = ?`; try { if (data.status === 'active') { await dbConn.run("UPDATE flows SET status = 'inactive' WHERE status = 'active' AND id != ?", [id]); } const result = await dbConn.run(query, values); return { changes: result.changes ?? 0 }; } catch (error) { console.error(`Erro atualizar fluxo ${id}:`, error); throw error; } }
async function deleteFlow(id) { const dbConn = await initializeDatabase(); try { const result = await dbConn.run('DELETE FROM flows WHERE id = ?', [id]); return { changes: result.changes ?? 0 }; } catch (error) { console.error(`Erro deletar fluxo ${id}:`, error); throw error; } }
async function findUserByUsername(username) { const dbConn = await initializeDatabase(); try { return await dbConn.get('SELECT id, username, password_hash, login_count, last_login_at FROM users WHERE username = ?', [username]); } catch (error) { console.error(`Erro buscar user ${username}:`, error); throw error; } }
async function createUser(username, passwordHash) { const dbConn = await initializeDatabase(); try { const result = await dbConn.run( 'INSERT INTO users (username, password_hash, login_count, created_at) VALUES (?, ?, 0, CURRENT_TIMESTAMP)', [username, passwordHash] ); if (!result || result.lastID === undefined) { throw new Error("Falha criar user."); } const newUser = await dbConn.get('SELECT id, username, created_at FROM users WHERE id = ?', result.lastID); return newUser; } catch (error) { console.error(`Erro criar user ${username}:`, error); throw error; } }
async function updateUserLoginInfo(userId) { const dbConn = await initializeDatabase(); try { const result = await dbConn.run( 'UPDATE users SET login_count = login_count + 1, last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [userId] ); return { changes: result.changes ?? 0 }; } catch (error) { console.error(`Erro update login info user ${userId}:`, error); return { changes: 0, error: error }; } }

// --- Funções CRUD para Creatives (REVISADAS) ---
async function getAllCreatives(campaignIdFilter = null) {
    const dbConn = await initializeDatabase();
    // *** GARANTIDO: content e comments estão no SELECT ***
    let query = 'SELECT id, name, type, status, campaign_id, publish_date, updated_at, originalFilename, content, comments FROM creatives';
    const params = [];
    if (campaignIdFilter !== null && campaignIdFilter !== undefined) {
        if (campaignIdFilter === 'none') { query += ' WHERE campaign_id IS NULL'; }
        else { query += ' WHERE campaign_id = ?'; params.push(campaignIdFilter); }
    }
    query += ' ORDER BY created_at DESC, name ASC'; // Ordem por criação primeiro
    try {
        const results = await dbConn.all(query, params);
        // console.log(`[DB getAllCreatives] Retornou ${results.length}.`);
        return results;
    } catch (error) { console.error("Erro buscar criativos:", error); return []; }
}

async function getCreativeById(id) {
    const dbConn = await initializeDatabase(); if (!id) return null;
    try {
        // Seleciona todas as colunas explicitamente para clareza
        return await dbConn.get('SELECT id, name, campaign_id, type, content, comments, status, platform, format, publish_date, originalFilename, created_at, updated_at FROM creatives WHERE id = ?', [id]);
    } catch (error) { console.error(`Erro buscar criativo ${id}:`, error); return null; }
}

async function createCreative(data) {
    const dbConn = await initializeDatabase(); const id = crypto.randomUUID();
    const { name, campaign_id, type, content, comments, status, platform, format, publish_date, originalFilename } = data;
    const platformStr = Array.isArray(platform) ? JSON.stringify(platform) : platform;
    const formatStr = Array.isArray(format) ? JSON.stringify(format) : format;
    const sql = `INSERT INTO creatives (id, name, campaign_id, type, content, comments, status, platform, format, publish_date, originalFilename, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
    // Garante que 'content' seja string e 'comments' seja null se vazio/undefined
    const params = [id, name, campaign_id || null, type, content || '', comments || null, status || 'draft', platformStr || null, formatStr || null, publish_date || null, originalFilename || null];
    try {
        console.log('[DB createCreative] SQL:', sql);
        console.log('[DB createCreative] Params:', params);
        const result = await dbConn.run(sql, params);
        if (!result || result.changes === 0) { throw new Error("Falha ao criar criativo (DB: sem alterações)."); }
        console.log(`[DB createCreative] Criado com sucesso, ID: ${id}`);
        const created = await getCreativeById(id);
        if(!created) throw new Error("Falha ao buscar criativo recém-criado.");
        return created;
    } catch (error) { console.error("Erro criar criativo:", error); throw error; }
}

async function updateCreative(id, data) {
    const dbConn = await initializeDatabase(); const fields = []; const values = [];
    const allowedColumns = ['name', 'campaign_id', 'type', 'content', 'comments', 'status', 'platform', 'format', 'publish_date', 'originalFilename'];
    Object.keys(data).forEach(key => {
        if (allowedColumns.includes(key) && data[key] !== undefined) {
            let valueToSave = data[key];
            if (key === 'platform' && Array.isArray(valueToSave)) { valueToSave = JSON.stringify(valueToSave); }
            else if (key === 'campaign_id' && (valueToSave === 'none' || valueToSave === '' || valueToSave === null)) { valueToSave = null; }
            else if (key === 'publish_date' && (valueToSave === '' || valueToSave === null)) { valueToSave = null; }
            else if (key === 'publish_date' && valueToSave !== null) { try { valueToSave = new Date(valueToSave).toISOString().split('.')[0]+"Z"; } catch (dateError) { valueToSave = null; } }
            // Garante que comments seja NULL se for string vazia
            else if (key === 'comments' && valueToSave === '') { valueToSave = null; }

            fields.push(`${key} = ?`);
            values.push(valueToSave);
        } else if (!allowedColumns.includes(key) && key !== 'id') {
            console.warn(`[DB Update Creative] Campo ignorado: ${key}`);
        }
    });
    if (fields.length === 0) { return { changes: 0 }; }
    values.push(id);
    const query = `UPDATE creatives SET ${fields.join(', ')} WHERE id = ?`;
    console.log("[DB Update Creative] Query:", query);
    console.log("[DB Update Creative] Values:", values);
    try {
        const result = await dbConn.run(query, values);
        console.log(`[DB Update Creative] ID ${id}. Changes: ${result.changes ?? 0}`);
        return { changes: result.changes ?? 0 };
    } catch (error) { console.error(`Erro atualizar criativo ${id}:`, error); throw error; }
}

async function deleteCreative(id) { const dbConn = await initializeDatabase(); try { const result = await dbConn.run('DELETE FROM creatives WHERE id = ?', [id]); console.log(`[DB Delete Creative] ID ${id}. Changes: ${result.changes ?? 0}`); return { changes: result.changes ?? 0 }; } catch (error) { console.error(`Erro deletar criativo ${id}:`, error); throw error; } }

// --- Exportações ---
module.exports = { initializeDatabase, getAllFlows, getFlowById, getActiveFlow, createFlow, updateFlow, deleteFlow, getCampaignsForSelect, findUserByUsername, createUser, updateUserLoginInfo, getAllCreatives, getCreativeById, createCreative, updateCreative, deleteCreative };