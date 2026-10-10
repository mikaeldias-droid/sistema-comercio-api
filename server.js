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
// AUTENTICAÇÃO (LOGIN)
// ==========================================

// Autenticar usuário
app.post('/api/login', (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ error: 'Login e senha são obrigatórios' });
    }

    const usuario = db.prepare('SELECT id, nome, login, senha, perfil FROM usuarios WHERE login = ?').get(login);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    return res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao autenticar usuário' });
  }
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
// ROTAS DE PRODUTOS (CRUD)
// ==========================================

// Listar todos os produtos
app.get('/api/produtos', (req, res) => {
  try {
    const produtos = db.prepare('SELECT id, nome, categoria, preco, estoque, observacao FROM produtos').all();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Buscar produto por ID
app.get('/api/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const produto = db.prepare('SELECT id, nome, categoria, preco, estoque, observacao FROM produtos WHERE id = ?').get(id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    return res.json(produto);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// Cadastrar produto
app.post('/api/produtos', (req, res) => {
  try {
    let { nome, categoria, preco, estoque, observacao } = req.body;

    if (!nome || preco === undefined || preco === null || preco === '') {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    const precoNum = typeof preco === 'string' ? parseFloat(preco.replace(',', '.')) : Number(preco);
    if (isNaN(precoNum) || precoNum < 0) {
      return res.status(400).json({ error: 'Preço inválido' });
    }

    const estoqueNum = (estoque !== undefined && estoque !== null && estoque !== '' && !isNaN(estoque))
      ? parseInt(estoque, 10)
      : 0;

    const resultado = db.prepare(`
      INSERT INTO produtos (nome, categoria, preco, estoque, observacao)
      VALUES (?, ?, ?, ?, ?)
    `).run(nome, categoria || '', precoNum, estoqueNum, observacao || '');

    const novoProduto = db.prepare('SELECT id, nome, categoria, preco, estoque, observacao FROM produtos WHERE id = ?').get(resultado.lastInsertRowid);
    return res.status(201).json(novoProduto);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
});

// Editar produto
app.put('/api/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const produto = db.prepare('SELECT id, nome, categoria, preco, estoque, observacao FROM produtos WHERE id = ?').get(id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    let { nome, categoria, preco, estoque, observacao } = req.body;

    if (!nome || preco === undefined || preco === null || preco === '') {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    const precoNum = typeof preco === 'string' ? parseFloat(preco.replace(',', '.')) : Number(preco);
    if (isNaN(precoNum) || precoNum < 0) {
      return res.status(400).json({ error: 'Preço inválido' });
    }

    const estoqueNum = (estoque !== undefined && estoque !== null && estoque !== '' && !isNaN(estoque))
      ? parseInt(estoque, 10)
      : 0;

    db.prepare(`
      UPDATE produtos
      SET nome = ?, categoria = ?, preco = ?, estoque = ?, observacao = ?
      WHERE id = ?
    `).run(nome, categoria || '', precoNum, estoqueNum, observacao || '', id);

    const produtoAtualizado = db.prepare('SELECT id, nome, categoria, preco, estoque, observacao FROM produtos WHERE id = ?').get(id);
    return res.json(produtoAtualizado);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Excluir produto
app.delete('/api/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const produto = db.prepare('SELECT id, nome, categoria, preco, estoque, observacao FROM produtos WHERE id = ?').get(id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    db.prepare('DELETE FROM produtos WHERE id = ?').run(id);
    return res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

// ==========================================
// ROTAS DE CONTROLE DE ESTOQUE
// ==========================================

// Listar itens de estoque (com campo "situacao")
app.get('/api/estoque', (req, res) => {
  try {
    const itens = db.prepare('SELECT id, produto, quantidade, minima, observacao FROM estoque').all();
    const formatados = itens.map((item) => ({
      ...item,
      situacao: item.quantidade <= item.minima ? 'Estoque baixo' : 'Disponível',
    }));
    return res.json(formatados);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar estoque' });
  }
});

// Cadastrar item no estoque
app.post('/api/estoque', (req, res) => {
  try {
    const { produto, quantidade, minima, observacao } = req.body;

    if (!produto || quantidade === undefined || quantidade === null || isNaN(quantidade)) {
      return res.status(400).json({ error: 'Produto e quantidade são obrigatórios' });
    }

    const quantNum = parseInt(quantidade, 10);
    const minNum = minima !== undefined && minima !== null && !isNaN(minima) ? parseInt(minima, 10) : 0;

    const resultado = db.prepare(`
      INSERT INTO estoque (produto, quantidade, minima, observacao)
      VALUES (?, ?, ?, ?)
    `).run(produto, quantNum, minNum, observacao || '');

    const novoItem = db.prepare('SELECT id, produto, quantidade, minima, observacao FROM estoque WHERE id = ?').get(resultado.lastInsertRowid);
    return res.status(201).json({
      ...novoItem,
      situacao: novoItem.quantidade <= novoItem.minima ? 'Estoque baixo' : 'Disponível',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cadastrar item de estoque' });
  }
});

// Atualizar item/quantidade no estoque
app.put('/api/estoque/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT id, produto, quantidade, minima, observacao FROM estoque WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }

    const { produto, quantidade, minima, observacao } = req.body;

    if (quantidade === undefined || quantidade === null || isNaN(quantidade)) {
      return res.status(400).json({ error: 'Quantidade é obrigatória' });
    }

    const quantNum = parseInt(quantidade, 10);
    const minNum = minima !== undefined && minima !== null && !isNaN(minima) ? parseInt(minima, 10) : item.minima;
    const prodNome = (produto && produto.trim()) ? produto : item.produto;
    const obs = observacao !== undefined ? observacao : item.observacao;

    db.prepare(`
      UPDATE estoque
      SET produto = ?, quantidade = ?, minima = ?, observacao = ?
      WHERE id = ?
    `).run(prodNome, quantNum, minNum, obs, id);

    const atualizado = db.prepare('SELECT id, produto, quantidade, minima, observacao FROM estoque WHERE id = ?').get(id);
    return res.json({
      ...atualizado,
      situacao: atualizado.quantidade <= atualizado.minima ? 'Estoque baixo' : 'Disponível',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar item de estoque' });
  }
});

// Excluir item de estoque
app.delete('/api/estoque/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT id, produto, quantidade, minima, observacao FROM estoque WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }

    db.prepare('DELETE FROM estoque WHERE id = ?').run(id);
    return res.json({ message: 'Item de estoque excluído com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir item de estoque' });
  }
});

// Inicialização do servidor Express
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
