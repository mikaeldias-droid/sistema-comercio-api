const express = require('express');
const cors = require('cors');
const app = express();

// Permite requisições de outras origens (ex: frontend React)
app.use(cors());
const PORT = process.env.PORT || 3000;

// Middleware para interpretar JSON nas requisições
app.use(express.json());

// Rota principal (GET /)
app.get('/', (req, res) => {
  res.send('API Sistema de Comércio rodando');
});

// ==========================================
// PREPARADO PARA FUTURAS ROTAS (Usuários, Produtos, Estoque)
// ==========================================

// Rota de Usuários (futuro)
app.get('/api/usuarios', (req, res) => {
  res.json({ message: 'Rota de Usuários (em breve)' });
});

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