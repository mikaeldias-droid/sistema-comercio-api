const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Permite requisições de outras origens (frontend React)
app.use(cors());

// Middleware para interpretar JSON nas requisições
app.use(express.json());

// Rota principal (GET /)
app.get('/', (req, res) => {
  res.send('API Sistema de Comércio rodando');
});

// ==========================================
// ROTAS DE USUÁRIOS
// ==========================================

// Listar usuários (sem o campo senha)
app.get('/api/usuarios', (req, res) => {
  try {
    const usuarios = db.prepare('SELECT id, nome, login, perfil FROM usuarios').all();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Cadastrar usuário
app.post('/api/usuarios', (req, res) => {
  try {
    const { nome, login, senha, perfil } = req.body;

    if (!nome || !login || !senha || !perfil) {
      return res.status(400).json({ error: 'Todos os campos (nome, login, senha, perfil) são obrigatórios' });
    }

    const usuarioExistente = db.prepare('SELECT id FROM usuarios WHERE login = ?').get(login);
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Login já cadastrado' });
    }

    const hash = bcrypt.hashSync(senha, 10);
    const resultado = db.prepare(`
      INSERT INTO usuarios (nome, login, senha, perfil)
      VALUES (?, ?, ?, ?)
    `).run(nome, login, hash, perfil);

    const novoUsuario = db.prepare('SELECT id, nome, login, perfil FROM usuarios WHERE id = ?').get(resultado.lastInsertRowid);
    return res.status(201).json(novoUsuario);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
});

// Editar usuário
app.put('/api/usuarios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nome, login, senha, perfil } = req.body;

    const usuario = db.prepare('SELECT id, nome, login, perfil FROM usuarios WHERE id = ?').get(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!nome || !login || !perfil) {
      return res.status(400).json({ error: 'Campos nome, login e perfil são obrigatórios' });
    }

    const loginOcupado = db.prepare('SELECT id FROM usuarios WHERE login = ? AND id != ?').get(login, id);
    if (loginOcupado) {
      return res.status(400).json({ error: 'Login já utilizado por outro usuário' });
    }

    if (senha) {
      const hash = bcrypt.hashSync(senha, 10);
      db.prepare(`
        UPDATE usuarios
        SET nome = ?, login = ?, senha = ?, perfil = ?
        WHERE id = ?
      `).run(nome, login, hash, perfil, id);
    } else {
      db.prepare(`
        UPDATE usuarios
        SET nome = ?, login = ?, perfil = ?
        WHERE id = ?
      `).run(nome, login, perfil, id);
    }

    const usuarioAtualizado = db.prepare('SELECT id, nome, login, perfil FROM usuarios WHERE id = ?').get(id);
    return res.json(usuarioAtualizado);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Excluir usuário
app.delete('/api/usuarios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    return res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// ==========================================
// PREPARADO PARA FUTURAS ROTAS (Produtos, Estoque)
// ==========================================

// Rota de Produtos (futuro)
app.get('/api/produtos', (req, res) => {
  res.json({ message: 'Rota de Produtos (em breve)' });
});

// Rota de Estoque (futuro)
app.get('/api/estoque', (req, res) => {
  res.json({ message: 'Rota de Estoque (em breve)' });
});

// Inicialização do servidor Express
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
