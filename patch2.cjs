const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("import sqlite3 from 'sqlite3';\nimport { open } from 'sqlite';", "import mysql from 'mysql2/promise';");

const setupBlock = `  // --- DATABASE SETUP (SQLite) ---
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });`;

code = code.replace(setupBlock, `  const dbHostEnv = process.env.DB_HOST || 'localhost';
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
  });`);

code = code.replace(/const ([a-zA-Z0-9_]+) = await db\.all\((.*?)\);/g, "const [$1] = await pool.query($2);");
code = code.replace(/await db\.run\(/g, "await pool.query(");
code = code.replace(/const rows = await pool\.query\(/g, "const [rows] = await pool.query(");

fs.writeFileSync('server.ts', code);
