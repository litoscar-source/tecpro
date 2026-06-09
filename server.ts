import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // --- DATABASE SETUP (MySQL) ---
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'techassist',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  async function initDB() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id INT PRIMARY KEY,
          companyName VARCHAR(255),
          legalName VARCHAR(255),
          nif VARCHAR(255),
          phone VARCHAR(255),
          email VARCHAR(255),
          address VARCHAR(255),
          city VARCHAR(255),
          postalCode VARCHAR(255),
          logo LONGTEXT,
          orderSeries VARCHAR(255)
        )
      `);

      const [settingsRows] = await pool.query('SELECT * FROM settings WHERE id = 1');
      if ((settingsRows as any[]).length === 0) {
        await pool.query(`
          INSERT INTO settings (id, companyName, legalName, nif, phone, email, address, city, postalCode, orderSeries)
          VALUES (1, 'TechAssist Pro', 'TechAssist Soluções em TI Lda', '123456789', '210 000 000', 'geral@techassist.pt', 'Avenida da República, 1500', 'Lisboa', '1050-191', ?)
        `, [new Date().getFullYear().toString()]);
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(255),
          nif VARCHAR(255),
          address VARCHAR(255),
          postalCode VARCHAR(255),
          city VARCHAR(255),
          createdAt VARCHAR(255)
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS inventory (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          description TEXT,
          brand VARCHAR(255),
          model VARCHAR(255),
          serialNumber VARCHAR(255),
          color VARCHAR(255),
          quantity INT,
          price DECIMAL(10,2),
          cost DECIMAL(10,2),
          createdAt VARCHAR(255)
        )
      `);

      // Attempt to add new columns to inventory if they don't exist
      try {
        await pool.query('ALTER TABLE inventory ADD COLUMN brand VARCHAR(255)');
        await pool.query('ALTER TABLE inventory ADD COLUMN model VARCHAR(255)');
        await pool.query('ALTER TABLE inventory ADD COLUMN serialNumber VARCHAR(255)');
        await pool.query('ALTER TABLE inventory ADD COLUMN color VARCHAR(255)');
      } catch(e) {}

      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(255) PRIMARY KEY,
          customerId VARCHAR(255),
          deviceType VARCHAR(255),
          brand VARCHAR(255),
          model VARCHAR(255),
          serialNumber VARCHAR(255),
          deviceCondition VARCHAR(255),
          accessories VARCHAR(255),
          isWarranty BOOLEAN,
          issueDescription TEXT,
          technicianNotes TEXT,
          status VARCHAR(255),
          partsUsed JSON,
          laborCost DECIMAL(10,2),
          totalCost DECIMAL(10,2),
          partsDiscount DECIMAL(10,2),
          paymentStatus VARCHAR(255),
          paymentMethod VARCHAR(255),
          paymentDate VARCHAR(255),
          createdAt VARCHAR(255),
          updatedAt VARCHAR(255),
          completedAt VARCHAR(255)
        )
      `);

      // Attempt to add new columns to orders if they don't exist
      const orderColumns = [
        'ALTER TABLE orders ADD COLUMN partsDiscount DECIMAL(10,2)',
        'ALTER TABLE orders ADD COLUMN paymentStatus VARCHAR(255)',
        'ALTER TABLE orders ADD COLUMN paymentMethod VARCHAR(255)',
        'ALTER TABLE orders ADD COLUMN paymentDate VARCHAR(255)',
        'ALTER TABLE orders ADD COLUMN orderType VARCHAR(255)',
        'ALTER TABLE orders ADD COLUMN clientQuoteStatus VARCHAR(255)',
        'ALTER TABLE orders ADD COLUMN clientQuoteObservation TEXT',
        'ALTER TABLE orders ADD COLUMN clientQuoteDate VARCHAR(255)',
        'ALTER TABLE orders ADD COLUMN externalSupplier VARCHAR(255)',
        'ALTER TABLE orders ADD COLUMN externalDispatchDate VARCHAR(255)'
      ];

      for (const colQuery of orderColumns) {
        try { await pool.query(colQuery); } catch(e) {}
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS appointments (
          id VARCHAR(255) PRIMARY KEY,
          customerId VARCHAR(255),
          title VARCHAR(255),
          date VARCHAR(255),
          time VARCHAR(255),
          notes TEXT,
          status VARCHAR(255),
          createdAt VARCHAR(255)
        )
      `);
      console.log("Database tables initialized.");
      return { success: true, message: "Tabelas criadas com sucesso." };
    } catch (err: any) {
      console.error("Warning: Database initialization error:", err);
      return { success: false, message: "Erro ao criar tabelas.", error: err.message };
    }
  }

  await initDB();

  // --- API ROUTES ---

  app.get('/api/test-db', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'success', message: 'Conexão à base de dados bem-sucedida! Tudo a funcionar.' });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: 'Erro ao ligar à base de dados.', details: e.message });
    }
  });

  app.get('/api/setup-db', async (req, res) => {
    const result = await initDB();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  });

  // Customers
  app.get('/api/customers', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM customers');
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const { id, name, email, phone, nif, address, postalCode, city, createdAt } = req.body;
      await pool.query(
        'INSERT INTO customers (id, name, email, phone, nif, address, postalCode, city, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, email, phone, nif, address, postalCode, city, createdAt]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const { name, email, phone, nif, address, postalCode, city } = req.body;
      await pool.query(
        'UPDATE customers SET name=?, email=?, phone=?, nif=?, address=?, postalCode=?, city=? WHERE id=?',
        [name, email, phone, nif, address, postalCode, city, req.params.id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM customers WHERE id=?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Inventory
  app.get('/api/inventory', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM inventory');
      const formatted = (rows as any[]).map(r => ({ ...r, quantity: Number(r.quantity), price: Number(r.price), cost: Number(r.cost) }));
      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/inventory', async (req, res) => {
    try {
      const { id, name, description, brand, model, serialNumber, color, quantity, price, cost, createdAt } = req.body;
      await pool.query(
        'INSERT INTO inventory (id, name, description, brand, model, serialNumber, color, quantity, price, cost, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, description, brand, model, serialNumber, color, quantity, price, cost, createdAt]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/inventory/:id', async (req, res) => {
    try {
      const { name, description, brand, model, serialNumber, color, quantity, price, cost } = req.body;
      await pool.query(
        'UPDATE inventory SET name=?, description=?, brand=?, model=?, serialNumber=?, color=?, quantity=?, price=?, cost=? WHERE id=?',
        [name, description, brand, model, serialNumber, color, quantity, price, cost, req.params.id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/inventory/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM inventory WHERE id=?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Orders
  app.get('/api/orders', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM orders');
      const formatted = (rows as any[]).map(r => ({
        ...r,
        isWarranty: !!r.isWarranty,
        laborCost: Number(r.laborCost),
        totalCost: Number(r.totalCost),
        partsDiscount: Number(r.partsDiscount) || 0,
        partsUsed: typeof r.partsUsed === 'string' ? JSON.parse(r.partsUsed) : (r.partsUsed || [])
      }));
      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { id, customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, partsUsed, laborCost, totalCost, partsDiscount, paymentStatus, paymentMethod, paymentDate, createdAt, updatedAt, completedAt, orderType, clientQuoteStatus, clientQuoteObservation, clientQuoteDate, externalSupplier, externalDispatchDate } = req.body;
      await pool.query(
        'INSERT INTO orders (id, customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, partsUsed, laborCost, totalCost, partsDiscount, paymentStatus, paymentMethod, paymentDate, createdAt, updatedAt, completedAt, orderType, clientQuoteStatus, clientQuoteObservation, clientQuoteDate, externalSupplier, externalDispatchDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, JSON.stringify(partsUsed || []), laborCost, totalCost, partsDiscount || 0, paymentStatus || '', paymentMethod || '', paymentDate || '', createdAt, updatedAt, completedAt, orderType || 'repair', clientQuoteStatus || null, clientQuoteObservation || null, clientQuoteDate || null, externalSupplier || null, externalDispatchDate || null]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      const { customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, partsUsed, laborCost, totalCost, partsDiscount, paymentStatus, paymentMethod, paymentDate, updatedAt, completedAt, orderType, clientQuoteStatus, clientQuoteObservation, clientQuoteDate, externalSupplier, externalDispatchDate } = req.body;
      await pool.query(
        'UPDATE orders SET customerId=?, deviceType=?, brand=?, model=?, serialNumber=?, deviceCondition=?, accessories=?, isWarranty=?, issueDescription=?, technicianNotes=?, status=?, partsUsed=?, laborCost=?, totalCost=?, partsDiscount=?, paymentStatus=?, paymentMethod=?, paymentDate=?, updatedAt=?, completedAt=?, orderType=?, clientQuoteStatus=?, clientQuoteObservation=?, clientQuoteDate=?, externalSupplier=?, externalDispatchDate=? WHERE id=?',
        [customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, JSON.stringify(partsUsed || []), laborCost, totalCost, partsDiscount || 0, paymentStatus || '', paymentMethod || '', paymentDate || '', updatedAt, completedAt, orderType || 'repair', clientQuoteStatus || null, clientQuoteObservation || null, clientQuoteDate || null, externalSupplier || null, externalDispatchDate || null, req.params.id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM orders WHERE id=?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Appointments
  app.get('/api/appointments', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM appointments');
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/appointments', async (req, res) => {
    try {
      const { id, customerId, title, date, time, notes, status, createdAt } = req.body;
      await pool.query(
        'INSERT INTO appointments (id, customerId, title, date, time, notes, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, customerId, title, date, time, notes, status, createdAt]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/appointments/:id', async (req, res) => {
    try {
      const { customerId, title, date, time, notes, status } = req.body;
      await pool.query(
        'UPDATE appointments SET customerId=?, title=?, date=?, time=?, notes=?, status=? WHERE id=?',
        [customerId, title, date, time, notes, status, req.params.id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM appointments WHERE id=?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Settings
  app.get('/api/settings', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
      if ((rows as any[]).length > 0) {
        res.json((rows as any[])[0]);
      } else {
        res.json({});
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/settings', async (req, res) => {
    try {
      const { companyName, legalName, nif, phone, email, address, city, postalCode, logo, orderSeries } = req.body;
      await pool.query(
        'UPDATE settings SET companyName=?, legalName=?, nif=?, phone=?, email=?, address=?, city=?, postalCode=?, logo=?, orderSeries=? WHERE id=1',
        [companyName, legalName, nif, phone, email, address, city, postalCode, logo, orderSeries]
      );
      res.json({ success: true, ...req.body, id: 1 });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
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
