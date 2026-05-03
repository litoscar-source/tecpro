import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  let connection: any;
  try {
    connection = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'test',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    // Testar conexão
    await connection.query('SELECT 1');
    console.log('Conectado à base de dados MySQL com sucesso.');
  } catch (error) {
    console.error('Falha ao conectar à base de dados MySQL. Verifique as credenciais no arquivo .env.');
    console.error(error);
    // Não saímos com process.exit(1) para deixar a aplicação rodar e ser visualizada, mesmo com API a falhar
  }

  const db = {
    exec: async (sql: string) => {
      if (!connection) return;
      const statements = sql.split(';').filter((s: string) => s.trim().length > 0);
      for (const stmt of statements) {
        await connection.query(stmt);
      }
    },
    get: async (sql: string, params: any[] = []) => {
      if (!connection) return null;
      const [rows] = await connection.execute(sql, params) as any[];
      return rows[0];
    },
    all: async (sql: string, params: any[] = []) => {
      if (!connection) return [];
      const [rows] = await connection.execute(sql, params);
      return rows;
    },
    run: async (sql: string, params: any[] = []) => {
      if (!connection) return null;
      const [result] = await connection.execute(sql, params);
      return result;
    }
  };

  // Create tables (MySQL syntax)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NOT NULL,
      nif VARCHAR(255),
      address TEXT NOT NULL,
      postalCode VARCHAR(255),
      city VARCHAR(255),
      createdAt VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      quantity INT NOT NULL,
      price DOUBLE NOT NULL,
      cost DOUBLE NOT NULL,
      createdAt VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(255) PRIMARY KEY,
      customerId VARCHAR(255) NOT NULL,
      deviceType VARCHAR(255) NOT NULL,
      brand VARCHAR(255) NOT NULL,
      model VARCHAR(255) NOT NULL,
      serialNumber VARCHAR(255),
      deviceCondition TEXT,
      accessories TEXT,
      isWarranty BOOLEAN NOT NULL,
      issueDescription TEXT NOT NULL,
      technicianNotes TEXT,
      status VARCHAR(255) NOT NULL,
      partsUsed TEXT NOT NULL,
      laborCost DOUBLE NOT NULL,
      totalCost DOUBLE NOT NULL,
      createdAt VARCHAR(255) NOT NULL,
      updatedAt VARCHAR(255) NOT NULL,
      completedAt VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY,
      companyName VARCHAR(255) NOT NULL,
      legalName VARCHAR(255) NOT NULL,
      nif VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(255) NOT NULL,
      postalCode VARCHAR(255) NOT NULL,
      logo LONGTEXT,
      orderSeries VARCHAR(255) NOT NULL
    );
  `);

  // Initialize default settings if not exists
  const settingsCount: any = await db.get('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    await db.run(`
      INSERT INTO settings (id, companyName, legalName, nif, phone, email, address, city, postalCode, orderSeries)
      VALUES (1, 'TechAssist Pro', 'TechAssist Soluções em TI Lda', '123456789', '210 000 000', 'geral@techassist.pt', 'Avenida da República, 1500', 'Lisboa', '1050-191', ?)
    `, [new Date().getFullYear().toString()]);
  }

  // --- API ROUTES ---

  // Customers
  app.get('/api/customers', async (req, res) => {
    const customers = await db.all('SELECT * FROM customers');
    res.json(customers);
  });

  app.post('/api/customers', async (req, res) => {
    const { id, name, email, phone, nif, address, postalCode, city, createdAt } = req.body;
    await db.run(
      'INSERT INTO customers (id, name, email, phone, nif, address, postalCode, city, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, phone, nif, address, postalCode, city, createdAt]
    );
    res.json({ success: true });
  });

  app.put('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, nif, address, postalCode, city } = req.body;
    await db.run(
      'UPDATE customers SET name = ?, email = ?, phone = ?, nif = ?, address = ?, postalCode = ?, city = ? WHERE id = ?',
      [name, email, phone, nif, address, postalCode, city, id]
    );
    res.json({ success: true });
  });

  app.delete('/api/customers/:id', async (req, res) => {
    await db.run('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Inventory
  app.get('/api/inventory', async (req, res) => {
    const inventory = await db.all('SELECT * FROM inventory');
    res.json(inventory);
  });

  app.post('/api/inventory', async (req, res) => {
    const { id, name, description, quantity, price, cost, createdAt } = req.body;
    await db.run(
      'INSERT INTO inventory (id, name, description, quantity, price, cost, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, quantity, price, cost, createdAt]
    );
    res.json({ success: true });
  });

  app.put('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, quantity, price, cost } = req.body;
    await db.run(
      'UPDATE inventory SET name = ?, description = ?, quantity = ?, price = ?, cost = ? WHERE id = ?',
      [name, description, quantity, price, cost, id]
    );
    res.json({ success: true });
  });

  app.delete('/api/inventory/:id', async (req, res) => {
    await db.run('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Orders
  app.get('/api/orders', async (req, res) => {
    const orders = await db.all('SELECT * FROM orders');
    // Parse partsUsed JSON
    const parsedOrders = orders.map(o => ({
      ...o,
      isWarranty: Boolean(o.isWarranty),
      partsUsed: JSON.parse(o.partsUsed)
    }));
    res.json(parsedOrders);
  });

  app.post('/api/orders', async (req, res) => {
    const { id, customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, partsUsed, laborCost, totalCost, createdAt, updatedAt, completedAt } = req.body;
    await db.run(
      'INSERT INTO orders (id, customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, partsUsed, laborCost, totalCost, createdAt, updatedAt, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty ? 1 : 0, issueDescription, technicianNotes, status, JSON.stringify(partsUsed), laborCost, totalCost, createdAt, updatedAt, completedAt]
    );
    res.json({ success: true });
  });

  app.put('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, partsUsed, laborCost, totalCost, updatedAt, completedAt } = req.body;
    await db.run(
      'UPDATE orders SET customerId = ?, deviceType = ?, brand = ?, model = ?, serialNumber = ?, deviceCondition = ?, accessories = ?, isWarranty = ?, issueDescription = ?, technicianNotes = ?, status = ?, partsUsed = ?, laborCost = ?, totalCost = ?, updatedAt = ?, completedAt = ? WHERE id = ?',
      [customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty ? 1 : 0, issueDescription, technicianNotes, status, JSON.stringify(partsUsed), laborCost, totalCost, updatedAt, completedAt, id]
    );
    res.json({ success: true });
  });

  app.delete('/api/orders/:id', async (req, res) => {
    await db.run('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Settings
  app.get('/api/settings', async (req, res) => {
    const settings = await db.get('SELECT * FROM settings WHERE id = 1');
    res.json(settings);
  });

  app.put('/api/settings', async (req, res) => {
    const { companyName, legalName, nif, phone, email, address, city, postalCode, logo, orderSeries } = req.body;
    await db.run(
      'UPDATE settings SET companyName = ?, legalName = ?, nif = ?, phone = ?, email = ?, address = ?, city = ?, postalCode = ?, logo = ?, orderSeries = ? WHERE id = 1',
      [companyName, legalName, nif, phone, email, address, city, postalCode, logo, orderSeries]
    );
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
