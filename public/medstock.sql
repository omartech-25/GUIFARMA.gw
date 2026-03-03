
-- ==========================================================
-- MedStock Pro - Base de Dados SQL (MySQL/MariaDB)
-- Versão: 1.0.0
-- Descrição: Sistema de gestão de stock grossista para Guiné-Bissau
-- ==========================================================

CREATE DATABASE IF NOT EXISTS medstock_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medstock_db;

-- 1. TABELA DE USUÁRIOS (CONTROLE DE ACESSOS)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Administrador', 'Gestor de Estoque', 'Vendedor', 'Contabilista', 'Supervisor') DEFAULT 'Vendedor',
    avatar_url VARCHAR(255),
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. TABELA DE FORNECEDORES
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    nif VARCHAR(20) UNIQUE,
    contact_name VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. TABELA DE CLIENTES (FARMÁCIAS / HOSPITAIS)
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type ENUM('Farmácia', 'Hospital', 'ONG') DEFAULT 'Farmácia',
    nif VARCHAR(20) UNIQUE,
    contact_phone VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    credit_limit DECIMAL(15, 2) DEFAULT 0.00,
    current_balance DECIMAL(15, 2) DEFAULT 0.00, -- Dívida atual
    status ENUM('Ativo', 'Bloqueado') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. TABELA DE PRODUTOS (MEDICAMENTOS)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category ENUM('Antibiótico', 'Analgésico', 'Antiviral', 'Suplemento', 'Dermatologia', 'Outro') NOT NULL,
    supplier_id INT,
    selling_price_wholesale DECIMAL(15, 2) NOT NULL, -- Preço por unidade
    min_stock_alert INT DEFAULT 100,
    units_per_box INT DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. TABELA DE LOTES (ESTOQUE REAL)
CREATE TABLE IF NOT EXISTS batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    initial_quantity INT NOT NULL,
    current_quantity INT NOT NULL,
    purchase_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX (expiry_date),
    INDEX (batch_number)
) ENGINE=InnoDB;

-- 6. TABELA DE VENDAS (CABEÇALHO)
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    client_id INT NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    net_amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('Dinheiro', 'Transferência', 'Crédito (Fiado)') NOT NULL,
    seller_id INT NOT NULL,
    status ENUM('Concluída', 'Cancelada', 'Pendente') DEFAULT 'Concluída',
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
) ENGINE=InnoDB;

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
