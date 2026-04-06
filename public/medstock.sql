
-- ==========================================================
-- MedStock Pro - Base de Dados PostgreSQL (Supabase)
-- Versão: 1.1.0
-- Descrição: Sistema de gestão de stock grossista para Guiné-Bissau
-- ==========================================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Vendedor',
    status TEXT DEFAULT 'Ativo',
    employee_name TEXT,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE FORNECEDORES
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nif TEXT UNIQUE,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Farmácia',
    nif TEXT UNIQUE,
    contact_phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    credit_limit DECIMAL(15, 2) DEFAULT 0.00,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    supplier_id TEXT REFERENCES suppliers(id),
    selling_price_wholesale DECIMAL(15, 2) NOT NULL,
    min_stock_alert INT DEFAULT 100,
    units_per_box INT DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE LOTES
CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    initial_quantity INT NOT NULL,
    current_quantity INT NOT NULL,
    purchase_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE VENDAS
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    client_id TEXT REFERENCES clients(id),
    total DECIMAL(15, 2) NOT NULL,
    discount DECIMAL(15, 2) DEFAULT 0.00,
    taxable_base DECIMAL(15, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    seller_id TEXT REFERENCES users(id),
    status TEXT DEFAULT 'Pago'
);

-- 7. TABELA DE ITENS DA VENDA
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    batch_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (batch_id) REFERENCES batches(id)
) ENGINE=InnoDB;

-- ==========================================================
-- DADOS INICIAIS (SEED)
-- ==========================================================

-- Admin Padrão (Senha: admin123)
-- Nota: Em produção, usar password_hash() do PHP
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Administrador Master', 'admin@medstock.pro', '$2y$10$8W3x5.gC7E2D1.r6u2f4.eQGvW5mFkS3TzX.N2L3p4K5J6I7H8G9', 'Administrador');

-- Fornecedor Inicial
INSERT INTO suppliers (name, contact_name, phone, email) 
VALUES ('PharmaCura Global', 'Carlos Mendes', '+245 955 111 222', 'vendas@pharmacura.com');

-- Cliente Inicial
INSERT INTO clients (name, type, contact_phone, credit_limit) 
VALUES ('Farmácia Esperança Bissau', 'Farmácia', '+245 966 000 001', 500000.00);

-- Trigger para atualizar estoque ao vender (Opcional, mas recomendado para consistência SQL)
DELIMITER //
CREATE TRIGGER after_sale_item_insert
AFTER INSERT ON sale_items
FOR EACH ROW
BEGIN
    UPDATE batches 
    SET current_quantity = current_quantity - NEW.quantity 
    WHERE id = NEW.batch_id;
END;
//
DELIMITER ;
