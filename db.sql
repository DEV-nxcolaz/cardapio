-- SQLite Schema for Sabores do Brasil Restaurant
-- Run in sql.js client-side

CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    guests INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Real Brazilian menu items EXPANDED (26 itens com IMAGENS Unsplash)
INSERT OR IGNORE INTO menu_items (category, name, description, price, image) VALUES
('Entradas', 'Coxinha de Frango', 'Pastel frito recheado com frango desfiado e catupiry', 12.90, 'https://images.unsplash.com/photo-1579586140626-fdf1c4e38144?w=300&h=200&fit=crop'),
('Entradas', 'Bolinho de Queijo', 'Bolinhos crocantes de queijo coalho', 14.50, 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop'),
('Entradas', 'Pastel de Carne', 'Pastel frito com carne moída temperada', 11.00, 'https://images.unsplash.com/photo-1589924563982-0a187ab9252f?w=300&h=200&fit=crop'),
('Entradas', 'Dadinho de Tapioca', 'Quadradinhos de queijo com tapioca crocante', 13.90, 'dadinho.jpg'),
('Entradas', 'Esfirra de Carne', 'Esfirra aberta com carne e requeijão', 15.50, 'esfirra.jpg'),
('Entradas', 'Risole de Palmito', 'Risole cremoso com palmito do coração', 10.90, 'risole.jpg'),

('Pratos Principais', 'Feijoada Completa', 'Feijoada tradicional com carnes, arroz, farofa, couve e laranja', 45.90, 'feijoada.jpg'),
('Pratos Principais', 'Picanha à Brasileira', 'Picanha grelhada na chapa com arroz, feijão e batata frita', 52.00, 'picanha.jpg'),
('Pratos Principais', 'Bobó de Camarão', 'Camarões no creme de mandioca com dendê', 48.90, 'bobo.jpg'),
('Pratos Principais', 'Parmegiana de Frango', 'Filé de frango empanado com molho de tomate e queijo', 38.50, 'parmegiana.jpg'),
('Pratos Principais', 'Moorish Moqueca', 'Peixe com leite de coco, pimentão e coentro', 49.90, 'moqueca.jpg'),
('Pratos Principais', 'Fraldinha Acebolada', 'Fraldinha grelhada com cebola e arroz', 44.90, 'fraldinha.jpg'),
('Pratos Principais', 'Strogonoff de Filé', 'Strogonoff cremoso com batata palha', 42.00, 'strogonoff.jpg'),
('Pratos Principais', 'Bacalhau à Gomes de Sá', 'Bacalhau desfiado com batata, cebola e azeitona', 68.90, 'bacalhau.jpg'),

('Sobremesas', 'Brigadeiro Gourmet', 'Brigadeiro com granulado e toque de licor', 8.90, 'brigadeiro.jpg'),
('Sobremesas', 'Pudim de Leite', 'Pudim cremoso com calda de caramelo', 12.00, 'pudim.jpg'),
('Sobremesas', 'Romeu e Julieta', 'Doce de leite com goiabada cascão', 9.50, 'romeu.jpg'),
('Sobremesas', 'Torta de Limão', 'Torta com creme de limão e suspiro', 14.90, 'torta.jpg'),
('Sobremesas', 'Açaí na Tigela', 'Açaí cremoso com granola e banana', 16.90, 'acai.jpg'),

('Bebidas', 'Cerveja Brahma 600ml', 'Cerveja gelada', 8.50, 'brahma.jpg'),
('Bebidas', 'Suco de Laranja Natural', 'Suco fresco de laranja', 7.90, 'suco.jpg'),
('Bebidas', 'Caipirinha Tradicional', 'Cachaça com limão e açúcar', 18.00, 'caipirinha.jpg'),
('Bebidas', 'Cerveja Skol 600ml', 'Cerveja premium gelada', 9.50, 'skol.jpg'),
('Bebidas', 'Agua de Côco Natural', 'Água de coco gelada direto da fruta', 6.90, 'coco.jpg'),
('Bebidas', 'Sucos Tropicais Mix', 'Mix de abacaxi, manga e maracujá', 9.90, 'sucos.jpg');

-- Sample reservations (for testing availability)
INSERT OR IGNORE INTO reservations (name, email, phone, date, time, guests) VALUES
('João Silva', 'joao@email.com', '11999999999', '2024-10-15', '19:00', 4);
