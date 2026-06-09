const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("import mysql from 'mysql2/promise';", "import sqlite3 from 'sqlite3';\nimport { open } from 'sqlite';");

const setupBlock = `  const dbHostEnv = process.env.DB_HOST || 'localhost';
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
  });`;

code = code.replace(setupBlock, `  // --- DATABASE SETUP (SQLite) ---
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });`);

code = code.replace(/const \[([a-zA-Z0-9_]+)\]\s*=\s*await pool\.query\((.*?)\);/g, "const $1 = await db.all($2);");
code = code.replace(/await pool\.query\(/g, "await db.run(");

// SQLite doesn't support LONGTEXT or JSON types directly, but TEXT works.
code = code.replace(/LONGTEXT/g, "TEXT");
code = code.replace(/JSON/g, "TEXT");

fs.writeFileSync('server.ts', code);
