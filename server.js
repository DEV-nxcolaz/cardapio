const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');

// Vercel serverless - NO app.listen()
// App
const app = express();
app.use(cors());
app.use(express.json());
// Static files via vercel.json
app.use(express.static('public')); // fallback if needed

// Global error handler (Vercel logs)
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Adapt for Vercel API routes: /api/create_preference
app.post('/api/create_preference', async (req, res) => {
  try {
    const { items, endereco } = req.body;
    
    mercadopago.configure({
      access_token: process.env.MP_ACCESS_TOKEN || 'TEST-8a5774b9-828b-4bb9-a09f-5e86594b6cd5'
    });

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:3000`;

    const preference = {
      items: items.map(i => ({
        title: i.name,
        unit_price: Number(i.price * 100),
        quantity: i.quantity,
        currency_id: 'BRL'
      })),
      payer: {
        name: endereco.nome || 'Cliente',
        email: endereco.email || 'no-reply@sabores.com',
        identification: { type: 'CPF', number: endereco.cpf || '12345678901' }
      },
      shipments: {
        receiver_address: {
          zip_code: endereco.cep?.replace(/\D/g, '') || '01001000',
          street_name: endereco.rua || 'Rua Exemplo',
          street_number: endereco.numero || '123',
          neighborhood: endereco.bairro || 'Centro'
        }
      },
      back_urls: {
        success: `${baseUrl}/finalizar-completo.html`,
        failure: `${baseUrl}/carrinho.html`,
        pending: `${baseUrl}/carrinho.html`
      },
      notification_url: `${baseUrl}/api/webhook`,
      auto_return: 'approved'
    };

    const response = await mercadopago.preferences.create(preference);
    console.log('✅ Preference ID:', response.body.id);
    
    res.json({ id: response.body.id, init_point: response.body.init_point });
  } catch (error) {
    console.error('❌ MP Error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ✅ Clean webhook (Vercel /api/ only)
app.post('/api/webhook', (req, res) => {
  console.log('🔔 MP Webhook:', req.body);
  // TODO: save order to DB, send email
  res.status(200).json({ received: true });
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

// Serverless export
module.exports = app;

