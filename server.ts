import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize SQLite Database
  // Para alojar no Hostinger com MySQL, pode substituir esta ligação pelo mysql2
  const dbNative = new Database(path.join(__dirname, 'database.sqlite'));
  
  const db = {
    exec: async (sql: string) => dbNative.exec(sql),
    get: async (sql: string, params: any[] = []) => dbNative.prepare(sql).get(...params) as any,
    all: async (sql: string, params: any[] = []) => dbNative.prepare(sql).all(...params),
    run: async (sql: string, params: any[] = []) => dbNative.prepare(sql).run(...params)
  };

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      nif TEXT,
      address TEXT NOT NULL,
      postalCode TEXT,
      city TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      deviceType TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      serialNumber TEXT,
      deviceCondition TEXT,
      accessories TEXT,
      isWarranty INTEGER NOT NULL,
      issueDescription TEXT NOT NULL,
      technicianNotes TEXT,
      status TEXT NOT NULL,
      partsUsed TEXT NOT NULL, -- JSON string
      laborCost REAL NOT NULL,
      totalCost REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      completedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      companyName TEXT NOT NULL,
      legalName TEXT NOT NULL,
      nif TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postalCode TEXT NOT NULL,
      logo TEXT,
      orderSeries TEXT NOT NULL
    );
  `);

  // Initialize default settings if not exists
  const settingsCount = await db.get('SELECT COUNT(*) as count FROM settings');
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
