-- ==========================================================
-- GUIFARMA SA - SCRIPT DE CORREÇÃO DA BASE DE DADOS
-- Execute este script no SQL Editor do seu Supabase
-- ==========================================================

-- 1. CORREÇÃO DA TABELA PRODUCTS
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS generic_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pharmaceutical_form TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dosage TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_alert INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sanitary_registry TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_controlled BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_history JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS batches JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. CORREÇÃO DA TABELA SALES
ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS change DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. CRIAÇÃO DA TABELA PURCHASES (Se não existir)
CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    supplier_id TEXT,
    supplier_name TEXT,
    total DECIMAL(15, 2) NOT NULL,
    items JSONB DEFAULT '[]',
    status TEXT DEFAULT 'Recebido',
    created_by TEXT,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRIAÇÃO DA TABELA JOURNAL_ENTRIES
CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT NOW(),
    reference TEXT,
    account_code TEXT,
    account_name TEXT,
    description TEXT,
    debit DECIMAL(15, 2) DEFAULT 0.00,
    credit DECIMAL(15, 2) DEFAULT 0.00,
    type TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRIAÇÃO DA TABELA CASH_SESSIONS
CREATE TABLE IF NOT EXISTS cash_sessions (
    id TEXT PRIMARY KEY,
    opening_date TIMESTAMPTZ DEFAULT NOW(),
    closing_date TIMESTAMPTZ,
    opening_balance DECIMAL(15, 2) DEFAULT 0.00,
    closing_balance DECIMAL(15, 2) DEFAULT 0.00,
    total_sales DECIMAL(15, 2) DEFAULT 0.00,
    total_movements DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'Aberta',
    opened_by TEXT,
    closed_by TEXT
);

-- 6. CRIAÇÃO DA TABELA CASH_MOVEMENTS
CREATE TABLE IF NOT EXISTS cash_movements (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES cash_sessions(id),
    date TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL, -- 'Entrada' ou 'Saída'
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    category TEXT,
    payment_method TEXT,
    performed_by TEXT
);

-- 7. CRIAÇÃO DA TABELA ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    user_name TEXT,
    action TEXT,
    details TEXT,
    resource_id TEXT,
    resource_type TEXT,
    ip_address TEXT
);

-- 8. CRIAÇÃO DA TABELA CREDIT_NOTES
CREATE TABLE IF NOT EXISTS credit_notes (
    id TEXT PRIMARY KEY,
    number TEXT UNIQUE NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    sale_id TEXT,
    client_id TEXT,
    client_name TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    reason TEXT,
    items JSONB DEFAULT '[]',
    status TEXT DEFAULT 'Emitida',
    created_by TEXT
);

-- 9. CORREÇÃO DA TABELA CLIENTS
ALTER TABLE clients ADD COLUMN IF NOT EXISTS discount_tier TEXT DEFAULT 'Normal';
