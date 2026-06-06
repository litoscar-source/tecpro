import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // --- IN MEMORY DATA (No Database) ---
  let customersData: any[] = [];
  let inventoryData: any[] = [];
  let ordersData: any[] = [];
  let appointmentsData: any[] = [];
  let settingsData: any = {
    id: 1,
    companyName: 'TechAssist Pro',
    legalName: 'TechAssist Soluções em TI Lda',
    nif: '123456789',
    phone: '210 000 000',
    email: 'geral@techassist.pt',
    address: 'Avenida da República, 1500',
    city: 'Lisboa',
    postalCode: '1050-191',
    logo: null,
    orderSeries: new Date().getFullYear().toString()
  };

  // --- API ROUTES ---

  // Customers
  app.get('/api/customers', (req, res) => {
    res.json(customersData);
  });

  app.post('/api/customers', (req, res) => {
    customersData.push(req.body);
    res.json({ success: true });
  });

  app.put('/api/customers/:id', (req, res) => {
    const index = customersData.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
      customersData[index] = { ...customersData[index], ...req.body, id: req.params.id };
    }
    res.json({ success: true });
  });

  app.delete('/api/customers/:id', (req, res) => {
    customersData = customersData.filter(c => c.id !== req.params.id);
    res.json({ success: true });
  });

  // Inventory
  app.get('/api/inventory', (req, res) => {
    res.json(inventoryData);
  });

  app.post('/api/inventory', (req, res) => {
    inventoryData.push(req.body);
    res.json({ success: true });
  });

  app.put('/api/inventory/:id', (req, res) => {
    const index = inventoryData.findIndex(i => i.id === req.params.id);
    if (index !== -1) {
      inventoryData[index] = { ...inventoryData[index], ...req.body, id: req.params.id };
    }
    res.json({ success: true });
  });

  app.delete('/api/inventory/:id', (req, res) => {
    inventoryData = inventoryData.filter(i => i.id !== req.params.id);
    res.json({ success: true });
  });

  // Orders
  app.get('/api/orders', (req, res) => {
    res.json(ordersData);
  });

  app.post('/api/orders', (req, res) => {
    ordersData.push(req.body);
    res.json({ success: true });
  });

  app.put('/api/orders/:id', (req, res) => {
    const index = ordersData.findIndex(o => o.id === req.params.id);
    if (index !== -1) {
      ordersData[index] = { ...ordersData[index], ...req.body, id: req.params.id };
    }
    res.json({ success: true });
  });

  app.delete('/api/orders/:id', (req, res) => {
    ordersData = ordersData.filter(o => o.id !== req.params.id);
    res.json({ success: true });
  });

  // Appointments
  app.get('/api/appointments', (req, res) => {
    res.json(appointmentsData);
  });

  app.post('/api/appointments', (req, res) => {
    appointmentsData.push(req.body);
    res.json({ success: true });
  });

  app.put('/api/appointments/:id', (req, res) => {
    const index = appointmentsData.findIndex(a => a.id === req.params.id);
    if (index !== -1) {
      appointmentsData[index] = { ...appointmentsData[index], ...req.body, id: req.params.id };
    }
    res.json({ success: true });
  });

  app.delete('/api/appointments/:id', (req, res) => {
    appointmentsData = appointmentsData.filter(a => a.id !== req.params.id);
    res.json({ success: true });
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    res.json(settingsData);
  });

  app.put('/api/settings', (req, res) => {
    settingsData = { ...settingsData, ...req.body, id: 1 };
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
