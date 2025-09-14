const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'webhook_redistributor.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database:', DB_PATH);
  }
});

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // Create webhook_endpoints table first
    const createEndpointsTable = `
      CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createEndpointsTable, (err) => {
      if (err) {
        console.error('Error creating webhook_endpoints table:', err.message);
        reject(err);
      } else {
        console.log('Webhook endpoints table created or already exists');
        
        // Create destinations table with webhook_endpoint_id reference
        const createDestinationsTable = `
          CREATE TABLE IF NOT EXISTS destinations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            webhook_endpoint_id INTEGER,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (webhook_endpoint_id) REFERENCES webhook_endpoints (id)
          )
        `;

        db.run(createDestinationsTable, (err) => {
          if (err) {
            console.error('Error creating destinations table:', err.message);
            reject(err);
          } else {
            console.log('Destinations table created or already exists');
            
            // Create webhook_logs table
            const createLogsTable = `
              CREATE TABLE IF NOT EXISTS webhook_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload TEXT NOT NULL,
                received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status INTEGER NOT NULL,
                destinations_sent INTEGER DEFAULT 0,
                error_message TEXT,
                endpoint_slug TEXT,
                response_time INTEGER DEFAULT 0
              )
            `;
            
            db.run(createLogsTable, (err) => {
              if (err) {
                console.error('Error creating webhook_logs table:', err.message);
                reject(err);
              } else {
                console.log('Webhook logs table created or already exists');
                resolve();
              }
            });
          }
        });
      }
    });
  });
};

// Initialize default data (default endpoint)
const initializeDefaultData = () => {
  return new Promise((resolve, reject) => {
    // Check if default endpoint already exists
    db.get('SELECT id FROM webhook_endpoints WHERE slug = ?', ['default'], (err, row) => {
      if (err) {
        console.error('Error checking for default endpoint:', err.message);
        reject(err);
      } else if (!row) {
        // Create default endpoint
        db.run(
          'INSERT INTO webhook_endpoints (name, slug, description) VALUES (?, ?, ?)',
          ['Padrão', 'default', 'Endpoint padrão para webhooks gerais'],
          function(err) {
            if (err) {
              console.error('Error creating default endpoint:', err.message);
              reject(err);
            } else {
              console.log('Default endpoint created with ID:', this.lastID);
              resolve();
            }
          }
        );
      } else {
        console.log('Default endpoint already exists');
        resolve();
      }
    });
  });
};

// Initialize database
const initializeDatabase = async () => {
  try {
    await initDatabase();
    await initializeDefaultData();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Close database connection
const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed');
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