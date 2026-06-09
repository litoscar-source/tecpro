import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-phonelab-123';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const dbHostEnv = process.env.DB_HOST || 'localhost';
  let dbHost = dbHostEnv;
  let dbPort = parseInt(process.env.DB_PORT || '3306');

  if (dbHostEnv.includes(':')) {
    const parts = dbHostEnv.split(':');
    dbHost = parts[0];
    dbPort = parseInt(parts[1]);
  }

  // --- DATABASE SETUP (MySQL) ---
  const pool = mysql.createPool({
    host: dbHost,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'techassist',
    port: dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  async function initDB() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE,
          password VARCHAR(255),
          twoFactorSecret VARCHAR(255),
          isTwoFactorEnabled BOOLEAN DEFAULT FALSE,
          createdAt VARCHAR(255)
        )
      `);
      
      const [userRows] = await pool.query('SELECT * FROM users');
      if ((userRows as any[]).length === 0) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(`
          INSERT INTO users (id, email, password, isTwoFactorEnabled, createdAt)
          VALUES (?, ?, ?, FALSE, ?)
        `, ['admin-1', 'admin@phonelab.pt', hashedPassword, new Date().toISOString()]);
      }

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
          logo TEXT,
          orderSeries VARCHAR(255)
        )
      `);

      const [settingsRows] = await pool.query('SELECT * FROM settings WHERE id = 1');
      if ((settingsRows as any[]).length === 0) {
        await pool.query(`
          INSERT INTO settings (id, companyName, legalName, nif, phone, email, address, city, postalCode, orderSeries)
          VALUES (1, 'PhoneLab Repair', 'PhoneLab Repair Lda', '123456789', '910 000 000', 'geral@phonelab.pt', 'Rua Principal, 1', 'Lisboa', '1000-001', ?)
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
          partsUsed TEXT,
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
      try {
        await pool.query('ALTER TABLE orders ADD COLUMN partsDiscount DECIMAL(10,2)');
        await pool.query('ALTER TABLE orders ADD COLUMN paymentStatus VARCHAR(255)');
        await pool.query('ALTER TABLE orders ADD COLUMN paymentMethod VARCHAR(255)');
        await pool.query('ALTER TABLE orders ADD COLUMN paymentDate VARCHAR(255)');
      } catch(e) {}

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

  // Auth
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, token } = req.body;
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      const users = rows as any[];
      
      if (users.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }
      
      const user = users[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      if (user.isTwoFactorEnabled) {
        if (!token) {
          return res.status(401).json({ error: 'Token 2FA obrigatório.', require2FA: true });
        }
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token
        });
        if (!verified) {
          return res.status(401).json({ error: 'Token 2FA inválido.' });
        }
      }

      const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token: jwtToken, user: { id: user.id, email: user.email } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/auth/setup-2fa', async (req, res) => {
    try {
      // In a real app we would verify the JWT here. 
      // For this prototype, we'll just allow it if user provides email.
      const { email } = req.body;
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      const users = rows as any[];
      if (users.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = users[0];

      const secret = speakeasy.generateSecret({ name: `PhoneLab (${email})` });
      
      await pool.query('UPDATE users SET twoFactorSecret = ? WHERE email = ?', [secret.base32, email]);

      qrcode.toDataURL(secret.otpauth_url!, (err, data_url) => {
        if (err) return res.status(500).json({ error: 'Error generating QR Code' });
        res.json({ secret: secret.base32, qrCode: data_url });
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/auth/verify-2fa', async (req, res) => {
    try {
      const { email, token } = req.body;
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      const users = rows as any[];
      if (users.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = users[0];

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
      });

      if (verified) {
        await pool.query('UPDATE users SET isTwoFactorEnabled = TRUE WHERE email = ?', [email]);
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid token' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

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
        partsUsed: typeof r.partsUsed === 'string' ? TEXT.parse(r.partsUsed) : (r.partsUsed || [])
      }));
      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { id, customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, partsUsed, laborCost, totalCost, partsDiscount, paymentStatus, paymentMethod, paymentDate, createdAt, updatedAt, completedAt } = req.body;
      await pool.query(
        'INSERT INTO orders (id, customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, partsUsed, laborCost, totalCost, partsDiscount, paymentStatus, paymentMethod, paymentDate, createdAt, updatedAt, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, TEXT.stringify(partsUsed || []), laborCost, totalCost, partsDiscount || 0, paymentStatus || '', paymentMethod || '', paymentDate || '', createdAt, updatedAt, completedAt]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      const { customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, partsUsed, laborCost, totalCost, partsDiscount, paymentStatus, paymentMethod, paymentDate, updatedAt, completedAt } = req.body;
      await pool.query(
        'UPDATE orders SET customerId=?, deviceType=?, brand=?, model=?, serialNumber=?, deviceCondition=?, accessories=?, isWarranty=?, issueDescription=?, technicianNotes=?, status=?, partsUsed=?, laborCost=?, totalCost=?, partsDiscount=?, paymentStatus=?, paymentMethod=?, paymentDate=?, updatedAt=?, completedAt=? WHERE id=?',
        [customerId, deviceType, brand, model, serialNumber, deviceCondition, accessories, isWarranty, issueDescription, technicianNotes, status, TEXT.stringify(partsUsed || []), laborCost, totalCost, partsDiscount || 0, paymentStatus || '', paymentMethod || '', paymentDate || '', updatedAt, completedAt, req.params.id]
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
