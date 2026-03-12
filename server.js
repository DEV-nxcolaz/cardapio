const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');

// === SETUP MP - SUBSTITUA pelas SUAS ===
mercadopago.configure({
  access_token: 'SEU_ACCESS_TOKEN_PRODUCAO_AQUI',  // app.mercadopago.com.br > Produção
});

// App
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // serve HTML/CSS/JS

// POST /create_preference - cria checkout MP com entrega
app.post('/create_preference', async (req, res) => {
  try {
    const { items, endereco } = req.body; // cart + endereço
    
    const preference = {
      items: items.map(i => ({
        title: i.name,
        unit_price: Number(i.price * 100),
        quantity: i.quantity,
        currency_id: 'BRL'
      })),
      payer: {
        name: endereco.nome,
        email: endereco.email,
        identification: { type: 'CPF', number: endereco.cpf }
      },
      shipments: {
        receiver_address: {
          zip_code: endereco.cep.replace(/\D/g, ''),
          street_name: endereco.rua,
          street_number: endereco.numero,
          neighborhood: endereco.bairro
        }
      },
      back_urls: {
        success: 'http://localhost:3000/success.html',
        failure: 'http://localhost:3000/carrinho.html',
        pending: 'http://localhost:3000/carrinho.html'
      },
      notification_url: 'https://seu-dominio.com/webhook', // seu webhook
      auto_return: 'approved'
    };

    const response = await mercadopago.preferences.create(preference);
    console.log('✅ Preference criada:', response.body.id);
    
    res.json({ id: response.body.id });
  } catch (error) {
    console.error('MP Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook MP (confirma pagamento)
app.post('/webhook', (req, res) => {
  console.log('🔔 MP Webhook:', req.body);
  // Salvar pedido banco, enviar email etc.
  res.sendStatus(200);
});

// Success page serve
app.get('/success.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><title>Sucesso!</title></head>
    <body style="font-family:Arial;text-align:center;padding:50px;background:#2C1810;color:white;">
      <h1>✅ Pedido Confirmado!</h1>
      <p>Seu pagamento MP foi aprovado. Preparamos sua entrega.</p>
      <a href="index.html" style="color:#FF6B35;">← Novo Pedido</a>
    </body></html>
  `);
});

app.listen(3000, () => {
  console.log('🚀 Backend rodando http://localhost:3000');
  console.log('📋 Teste: POST http://localhost:3000/create_preference');
  console.log('🔧 SUBSTITUA access_token linha 7 pelas suas MP PRODUÇÃO!');
});

