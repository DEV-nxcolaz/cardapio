// Sabores do Brasil - Updated Script with Alpine.js + Mercado Pago + Shared DB
// Framework: Alpine.js (reatividade), sql.js (SQLite), Mercado Pago Bricks

let db;
const MP_PUBLIC_KEY = 'TEST-YOUR-MP-PUBLIC-KEY-HERE'; // sandbox.mercadopago.com.br > Credenciais

// Global Alpine Store for Cart (PERSISTENTE localStorage)
let savedCart = JSON.parse(localStorage.getItem('saboresCart') || '[]');
document.addEventListener('alpine:init', () => {
    Alpine.store('cart', {
        items: savedCart,
        get total() {
            return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },
        add(item) {
            const existing = this.items.find(i => i.id === item.id);
            if (existing) {
                existing.quantity++;
            } else {
                this.items.push({...item, quantity: 1});
            }
            localStorage.setItem('saboresCart', JSON.stringify(this.items));
            updateNavCartCount();
        },
        remove(id) {
            this.items = this.items.filter(i => i.id !== id);
            localStorage.setItem('saboresCart', JSON.stringify(this.items));
            updateNavCartCount();
        },
        clear() {
            this.items = [];
            localStorage.removeItem('saboresCart');
            updateNavCartCount();
        }
    });
});

// Shared DB Init
async function initDB() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
        
        const response = await fetch('db.sql');
        const sqlContent = await response.text();
        
        db = new SQL.Database();
        db.run(sqlContent);
        console.log('✅ DB carregada (26 itens menu + reservas)');
        return db;
    } catch (error) {
        console.error('DB Error:', error);
        alert('Erro ao carregar banco. Verifique db.sql.');
    }
}

// Menu Functions (index.html)
async function loadMenu(category = 'all') {
    await initDB();
    const itemsContainer = document.getElementById('menu-items');
    let query = 'SELECT * FROM menu_items';
    if (category !== 'all') query += ` WHERE category = '${category}'`;
    
    const items = db.exec(query);
    let html = '';
    
    if (items[0]?.values) {
        items[0].values.forEach(([id, cat, name, desc, price, image]) => {
            html += `
                <div class="menu-item">
                    <img src="${image || getPlaceholderImage(cat)}" alt="${name}" loading="lazy">
                    <h3>${name}</h3>
                    <p>${desc}</p>
                    <div class="price">R$ ${price.toFixed(2).replace('.', ',')}</div>
                    <button class="add-to-cart" data-id="${id}" data-name="${name.replace(/'/g, "\\'")}" data-price="${price}" 
                            onclick="addToCart(${id}, '${name.replace(/'/g, "\\'")}', ${price})">
                        ➕ Adicionar ao Carrinho
                    </button>
                </div>
            `;
        });
    }
    itemsContainer.innerHTML = html;
    
    // Re-setup add to cart listeners (event delegation fix)
    setupAddToCartListeners();
}

function getPlaceholderImage(category) {
    const images = {
        'Entradas': 'https://via.placeholder.com/300x200/F4A261/2C1810?text=Entradas',
        'Pratos Principais': 'https://via.placeholder.com/300x200/FF6B35/2C1810?text=Prato',
        'Sobremesas': 'https://via.placeholder.com/300x200/F4A261/FFFDF5?text=Doce',
        'Bebidas': 'https://via.placeholder.com/300x200/FF6B35/2C1810?text=Bebida'
    };
    return images[category] || 'https://via.placeholder.com/300x200/2C1810/FF6B35';
}

// Reservations Functions (reservas.html)
function loadReservations() {
    const container = document.getElementById('reservations-list') || document.querySelector('.reservations-grid');
    const res = db.exec('SELECT * FROM reservations ORDER BY created_at DESC LIMIT 10');
    
    if (res[0]?.values) {
        let html = '';
        res[0].values.forEach(([id, name, email, phone, date, time, guests]) => {
            html += `
                <div class="reservation-card">
                    <h4>${name}</h4>
                    <p>📅 ${date} ${time} | 👥 ${guests} pessoas</p>
                    <p>📧 ${email}${phone ? ` | 📞 ${phone}` : ''}</p>
                </div>
            `;
        });
        container.innerHTML = html;
    }
}

async function handleReservation(e) {
    e.preventDefault();
    const form = e.target;
    
    const formData = {
        name: form.querySelector('#res-name').value,
        email: form.querySelector('#res-email').value,
        phone: form.querySelector('#res-phone').value,
        date: form.querySelector('#res-date').value,
        time: form.querySelector('#res-time').value,
        guests: parseInt(form.querySelector('#res-guests').value)
    };
    
    // Availability check
    const booked = db.exec(`SELECT COALESCE(SUM(guests), 0) as total FROM reservations WHERE date='${formData.date}' AND time='${formData.time}'`)[0]?.values[0][0] || 0;
    
    if (booked + formData.guests > 20) {
        return alert('❌ Capacidade máxima atingida! Escolha outro horário.');
    }
    
    // Insert
    db.run('INSERT INTO reservations (name, email, phone, date, time, guests) VALUES (?, ?, ?, ?, ?, ?)', 
        [formData.name, formData.email, formData.phone, formData.date, formData.time, formData.guests]);
    
    loadReservations();
    form.reset();
    form.querySelector('button').disabled = false;
    alert('✅ Reserva confirmada com sucesso!');
}

// Mercado Pago Checkout (index.html)
function initMercadoPago() {
    const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
    return mp;
}

async function startMercadoPago() {
    const mp = initMercadoPago();
    const totalCents = Math.round(Alpine.store('cart').total * 100);
    
    // Mock preference_id (real: POST /create_preference backend)
    const preference = {
        id: 'mock-preference-id-' + Date.now(),
        items: Alpine.store('cart').items.map(item => ({
            title: item.name,
            unit_price: Math.round(item.price * 100),
            quantity: item.quantity
        })),
        total_amount: totalCents / 100,
        payer: { email: 'teste@teste.com' }
    };
    
    // Demo button (real app usa mp.checkout({ preference }))
    const modal = document.createElement('div');
    modal.className = 'mp-modal';
    modal.innerHTML = `
        <div class="mp-modal-content">
            <span class="mp-close">&times;</span>
            <h3>🛒 Pedido Confirmado</h3>
            <p>Total: R$ ${Alpine.store('cart').total.toFixed(2).replace('.', ',')}</p>
            <pre>${JSON.stringify(preference, null, 2)}</pre>
            <button onclick="Alpine.store('cart').clear(); this.parentElement.parentElement.remove(); alert('✅ Checkout MP demo concluído!');">
                Confirmar Pagamento (Demo)
            </button>
            <small>Use sua <strong>MP_PUBLIC_KEY</strong> real para checkout completo.</small>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    modal.querySelector('.mp-close').onclick = () => modal.remove();
}

// Add to Cart Function (fix for dynamic buttons)
function addToCart(id, name, price) {
    Alpine.store('cart').add({id, name, price});
    console.log('Item adicionado:', name);
    event.target.textContent = `✅ Adicionado!`;
    setTimeout(() => event.target.textContent = '➕ Adicionar ao Carrinho', 2000);
}

// Event Listeners
function setupListeners() {
    // Navbar mobile
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.onclick = () => navLinks.classList.toggle('active');
    }
    
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelector('.category-btn.active')?.classList.remove('active');
            e.target.classList.add('active');
            loadMenu(e.target.dataset.category);
        };
    });
    
    // Reservation form (if present)
    const resForm = document.getElementById('reservation-form');
    if (resForm) {
        resForm.onsubmit = handleReservation;
    }
}

function setupAddToCartListeners() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.onclick = function(e) {
            addToCart(parseInt(this.dataset.id), this.dataset.name, parseFloat(this.dataset.price));
        };
    });
}

// Update nav cart count
function updateNavCartCount() {
    const count = Alpine.store('cart').items.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-teaser-count, #nav-cart-count').forEach(span => {
        span.textContent = count;
    });
}

// Page-specific init
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    document.addEventListener('alpine:init', () => {
        Alpine.effect(() => {
            updateNavCartCount();
        });
    });
    window.addEventListener('load', () => {
        initDB().then(() => {
            loadMenu();
            setupListeners();
            updateNavCartCount();
        });
    });
}

if (window.location.pathname.includes('reservas.html')) {
    window.addEventListener('load', () => {
        initDB().then(() => {
            loadReservations();
            setupListeners();
        });
    });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
});
