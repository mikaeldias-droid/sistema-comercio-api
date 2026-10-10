const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'comercio.db'));
db.pragma('journal_mode = WAL');

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    categoria TEXT,
    preco REAL NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    observacao TEXT
  );

  CREATE TABLE IF NOT EXISTS estoque (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    minima INTEGER NOT NULL DEFAULT 0,
    observacao TEXT
  );
`);

// Insere administrador inicial se a tabela usuarios estiver vazia
const countUsuarios = db.prepare('SELECT COUNT(*) as total FROM usuarios').get();
if (countUsuarios.total === 0) {
  const hash = bcrypt.hashSync('123456', 10);
  db.prepare(`
    INSERT INTO usuarios (nome, login, senha, perfil)
    VALUES (?, ?, ?, ?)
  `).run('Administrador', 'admin', hash, 'Administrador');
}

module.exports = db;
