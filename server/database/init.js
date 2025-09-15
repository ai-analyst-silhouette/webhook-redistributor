const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const messages = require('../config/messages');

// Database file path
const DB_PATH = path.join(__dirname, 'webhook_redistributor.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao abrir banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite:', DB_PATH);
  }
});

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // Create redirecionamentos table (new simplified structure)
    const createRedirecionamentosTable = `
      CREATE TABLE IF NOT EXISTS redirecionamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        descricao TEXT,
        urls TEXT NOT NULL,
        ativo BOOLEAN DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createRedirecionamentosTable, (err) => {
      if (err) {
        console.error('Erro ao criar tabela redirecionamentos:', err.message);
        reject(err);
      } else {
        console.log('Tabela redirecionamentos criada ou já existe');
        
        // Create logs_webhook table (new Portuguese version)
        const createLogsTable = `
          CREATE TABLE IF NOT EXISTS logs_webhook (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payload TEXT NOT NULL,
            recebido_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            status INTEGER NOT NULL,
            destinos_enviados INTEGER DEFAULT 0,
            mensagem_erro TEXT,
            slug_redirecionamento TEXT,
            tempo_resposta INTEGER DEFAULT 0
          )
        `;
        
        db.run(createLogsTable, (err) => {
          if (err) {
            console.error('Erro ao criar tabela logs_webhook:', err.message);
            reject(err);
          } else {
            console.log('Tabela logs_webhook criada ou já existe');
            
            // Create usuarios table (new Portuguese version)
            const createUsersTable = `
              CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hash_senha TEXT NOT NULL,
                funcao TEXT DEFAULT 'user',
                ativo BOOLEAN DEFAULT 1,
                ultimo_login DATETIME,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `;
            
            db.run(createUsersTable, (err) => {
              if (err) {
                console.error('Erro ao criar tabela usuarios:', err.message);
                reject(err);
              } else {
                console.log('Tabela usuarios criada ou já existe');
                
                // Create audit_log table for tracking user actions
                const createAuditLogTable = `
                  CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    usuario_id INTEGER NOT NULL,
                    acao TEXT NOT NULL,
                    descricao TEXT,
                    recurso_tipo TEXT,
                    recurso_id INTEGER,
                    ip TEXT,
                    user_agent TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
                  )
                `;
                
                db.run(createAuditLogTable, (err) => {
                  if (err) {
                    console.error('Erro ao criar tabela audit_log:', err.message);
                    reject(err);
                  } else {
                    console.log('Tabela audit_log criada ou já existe');
                    
                    // Migrate data from old tables to new redirecionamentos structure
                    migrateDataToRedirecionamentos().then(() => {
                      resolve();
                    }).catch((migrateErr) => {
                      console.error('Erro na migração de dados:', migrateErr);
                      reject(migrateErr);
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });
};

// Migrate data from old tables to new redirecionamentos structure
const migrateDataToRedirecionamentos = () => {
  return new Promise((resolve, reject) => {
    // Check if old tables exist before trying to migrate
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      if (err) {
        console.error('Erro ao verificar tabela users:', err);
        reject(err);
      } else if (row) {
        // Old users table exists, migrate it
        db.run(`
          INSERT OR IGNORE INTO usuarios (id, nome, email, hash_senha, funcao, ativo, ultimo_login, criado_em)
          SELECT id, name, email, password_hash, role, active, last_login, created_at 
          FROM users
        `, (err) => {
          if (err) {
            console.error('Erro ao migrar dados de users:', err);
            reject(err);
          } else {
            console.log('Dados de users migrados para usuarios');
            migrateWebhookLogs().then(resolve).catch(resolve);
          }
        });
      } else {
        console.log('Tabela users não encontrada, pulando migração');
        migrateWebhookLogs().then(resolve).catch(resolve);
      }
    });
  });
};

// Migrate webhook logs
const migrateWebhookLogs = () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='webhook_logs'", (err, row) => {
      if (err) {
        console.error('Erro ao verificar tabela webhook_logs:', err);
        resolve();
      } else if (row) {
        // Old webhook_logs table exists, migrate it
        db.run(`
          INSERT OR IGNORE INTO logs_webhook (id, payload, recebido_em, status, destinos_enviados, mensagem_erro, slug_redirecionamento, tempo_resposta)
          SELECT id, payload, received_at, status, destinations_sent, error_message, endpoint_slug, response_time 
          FROM webhook_logs
        `, (err) => {
          if (err) {
            console.error('Erro ao migrar dados de webhook_logs:', err);
          } else {
            console.log('Dados de webhook_logs migrados para logs_webhook');
          }
          migrateEndpoints().then(resolve).catch(resolve);
        });
      } else {
        console.log('Tabela webhook_logs não encontrada, pulando migração');
        migrateEndpoints().then(resolve).catch(resolve);
      }
    });
  });
};

// Migrate endpoints
const migrateEndpoints = () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='webhook_endpoints'", (err, row) => {
      if (err) {
        console.error('Erro ao verificar tabela webhook_endpoints:', err);
        resolve();
      } else if (row) {
        migrateEndpointsToRedirecionamentos().then(() => {
          resolve();
        }).catch((migrateErr) => {
          console.error('Erro na migração de endpoints para redirecionamentos:', migrateErr);
          resolve(); // Don't reject, just log the error
        });
      } else {
        console.log('Tabela webhook_endpoints não encontrada, pulando migração');
        resolve();
      }
    });
  });
};

// Migrate endpoints and their destinations to redirecionamentos
const migrateEndpointsToRedirecionamentos = () => {
  return new Promise((resolve, reject) => {
    // Get all endpoints with their destinations
    db.all(`
      SELECT 
        e.id, e.name, e.slug, e.description, e.active, e.created_at,
        GROUP_CONCAT(d.url, '|') as urls
      FROM webhook_endpoints e
      LEFT JOIN destinations d ON e.id = d.webhook_endpoint_id AND d.active = 1
      GROUP BY e.id, e.name, e.slug, e.description, e.active, e.created_at
    `, (err, rows) => {
      if (err) {
        console.error('Erro ao buscar endpoints e destinos:', err);
        reject(err);
      } else {
        console.log(`Encontrados ${rows.length} endpoints para migrar`);
        
        if (rows.length === 0) {
          resolve();
          return;
        }
        
        // Insert each endpoint as a redirecionamento
        let completed = 0;
        rows.forEach((row) => {
          const urls = row.urls ? row.urls.split('|').filter(url => url.trim()) : [];
          const urlsJson = JSON.stringify(urls);
          
          db.run(`
            INSERT OR IGNORE INTO redirecionamentos (id, nome, slug, descricao, urls, ativo, criado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [row.id, row.name, row.slug, row.description, urlsJson, row.active, row.created_at], (err) => {
            if (err) {
              console.error(`Erro ao migrar endpoint ${row.slug}:`, err);
            } else {
              console.log(`Endpoint ${row.slug} migrado para redirecionamento`);
            }
            
            completed++;
            if (completed === rows.length) {
              console.log('Migração de endpoints para redirecionamentos concluída');
              resolve();
            }
          });
        });
      }
    });
  });
};

// Initialize default data (default redirecionamento and admin user)
const initializeDefaultData = () => {
  return new Promise((resolve, reject) => {
    // Check if default redirecionamento already exists
    db.get('SELECT id FROM redirecionamentos WHERE slug = ?', ['default'], (err, row) => {
      if (err) {
        console.error('Erro ao verificar redirecionamento padrão:', err.message);
        reject(err);
      } else if (!row) {
        // Create default redirecionamento with example URLs
        const defaultUrls = [
          'https://httpbin.org/post',
          'https://webhook.silhouetteexperts.com.br/webhook/teste-kommo'
        ];
        
        db.run(
          'INSERT INTO redirecionamentos (nome, slug, descricao, urls) VALUES (?, ?, ?, ?)',
          ['Padrão', 'default', 'Redirecionamento padrão para webhooks gerais', JSON.stringify(defaultUrls)],
          function(err) {
            if (err) {
              console.error('Erro ao criar redirecionamento padrão:', err.message);
              reject(err);
            } else {
              console.log('Redirecionamento padrão criado com ID:', this.lastID);
              // After creating redirecionamento, check for admin user
              checkAndCreateAdminUser(resolve, reject);
            }
          }
        );
      } else {
        console.log('Redirecionamento padrão já existe');
        // Check for admin user even if redirecionamento exists
        checkAndCreateAdminUser(resolve, reject);
      }
    });
  });
};

// Check and create admin user if it doesn't exist
const checkAndCreateAdminUser = (resolve, reject) => {
  const bcrypt = require('bcryptjs');
  
  db.get('SELECT id FROM usuarios WHERE email = ?', ['admin@webhook.local'], (err, row) => {
    if (err) {
      console.error('Erro ao verificar usuário admin:', err.message);
      reject(err);
    } else if (!row) {
      // Create admin user in Portuguese table
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        'INSERT INTO usuarios (nome, email, hash_senha, funcao) VALUES (?, ?, ?, ?)',
        ['Administrador', 'admin@webhook.local', hashedPassword, 'admin'],
        function(err) {
          if (err) {
            console.error('Erro ao criar usuário admin:', err.message);
            reject(err);
          } else {
            console.log('Usuário admin criado com ID:', this.lastID);
            resolve();
          }
        }
      );
    } else {
      console.log('Usuário admin já existe');
      resolve();
    }
  });
};

// Initialize database
const initializeDatabase = async () => {
  try {
    console.log('Iniciando inicialização do banco de dados...');
    await initDatabase();
    console.log('Tabelas criadas com sucesso');
    await initializeDefaultData();
    console.log('Dados padrão inicializados com sucesso');
    console.log('Inicialização do banco de dados concluída com sucesso');
  } catch (error) {
    console.error('Falha na inicialização do banco de dados:', error);
    throw error;
  }
};

// Close database connection
const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar banco de dados:', err.message);
        reject(err);
      } else {
        console.log('Conexão com banco de dados fechada');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  initializeDatabase,
  closeDatabase
};