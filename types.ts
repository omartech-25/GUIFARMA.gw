
export enum UserRole {
  ADMIN = 'Administrador',
  STOCK_MANAGER = 'Fiel de Armazém',
  SELLER = 'Vendedor',
  ACCOUNTANT = 'Contabilista',
  SUPERVISOR = 'Supervisor'
}

export interface UserPermissions {
  // CONFIGURAÇÕES DO SISTEMA
  systemSettings: boolean;
  
  // CADASTROS
  registerUsers: boolean;
  registerClients: boolean;
  registerSuppliers: boolean;
  registerProducts: boolean;
  registerBankAccounts: boolean;
  registerCardMachines: boolean;
  
  // CONTROLE DE ESTOQUE
  stockEntry: boolean;
  
  // MENU FINANCEIRO
  cashClosing: boolean;
  receiptsCompensations: boolean;
  registerExpenses: boolean;
  payExpenses: boolean;
  registerSangriaSuprimento: boolean;
  bankMovements: boolean;
  accountTransfers: boolean;
  
  // MENU VENDAS / FERRAMENTAS
  sales: boolean;
  systemTools: boolean;
  
  // RELATÓRIOS
  reportsRegistration: boolean;
  reportsFinancial: boolean;
  reportsManagement: boolean;
}

export interface User {
  id: string;
  name: string;
  employeeName: string;
  role: UserRole;
  email: string;
  password?: string;
  status: 'Ativo' | 'Inativo';
  permissions: UserPermissions;
}

export enum MedicineCategory {
  ANTIBIOTIC = 'Antibiótico',
  ANALGESIC = 'Analgésico',
  ANTIVIRAL = 'Antiviral',
  SUPPLEMENT = 'Suplemento',
  DERMATOLOGY = 'Dermatologia',
  OTHER = 'Outro'
}

export enum PharmaceuticalForm {
  TABLET = 'Comprimido',
  SYRUP = 'Xarope',
  INJECTABLE = 'Injetável',
  OINTMENT = 'Pomada',
  CAPSULE = 'Cápsula'
}

export interface AuditInfo {
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Batch {
  id: string;
  batchNumber: string; // Internal ID
  manufacturerBatchNumber: string; // Manufacturer's batch
  manufacturingDate: string;
  expiryDate: string;
  quantity: number; // in units
  purchasePrice: number; // FCFA
  location: string; // Corredor, Prateleira
  isColdChain: boolean;
}

export interface Product extends AuditInfo {
  id: string;
  code: string;
  barcode?: string;
  name: string; // Commercial Name
  genericName: string; // DCI
  category: MedicineCategory;
  pharmaceuticalForm: PharmaceuticalForm;
  dosage: string;
  batches: Batch[];
  sellingPriceWholesale: number; // Price per unit (FCFA)
  minStockAlert: number;
  maxStockAlert?: number;
  manufacturer: string;
  sanitaryRegistry: string;
  unitsPerBox: number;
  isControlled?: boolean; // For regulatory control
  imageUrl?: string;
}

export enum PaymentMethod {
  CASH = 'Dinheiro',
  TRANSFER = 'Transferência (BAO/Ecobank)',
  ORANGE_MONEY = 'Orange Money',
  MTN_MONEY = 'MTN Money',
  CREDIT = 'Crédito (Fiado)'
}

export enum SaleStatus {
  PENDING = 'Pendente',
  PAID = 'Pago',
  DELIVERED = 'Entregue',
  CANCELLED = 'Cancelada'
}

export interface Client extends AuditInfo {
  id: string;
  name: string;
  nif: string;
  technicalResponsible: string;
  type: 'Farmácia' | 'Hospital' | 'ONG';
  contact: string;
  address: string;
  region: string; // Bissau, Bafatá, Gabu, etc.
  creditLimit: number;
  balance: number;
  paymentTerm: number; // in days
}

export interface SaleItem {
  productId: string;
  productCode: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number; // units
  unitPrice: number;
  total: number;
}

export interface Sale extends AuditInfo {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientId: string;
  clientName: string;
  clientNif: string;
  clientAddress: string;
  technicalResponsible: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // %
  taxableBase: number;
  iva: number; // % (usually 18)
  total: number;
  paymentMethod: PaymentMethod;
  bankName?: string;
  paymentReference?: string;
  status: SaleStatus;
  sellerId: string;
  observations?: string;
  isVatExempt?: boolean;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  batchNumber: string; // Internal
  manufacturerBatchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number; // units
  purchasePrice: number;
  location: string;
  isColdChain: boolean;
  total: number;
}

export interface Purchase extends AuditInfo {
  id: string;
  invoiceNumber: string;
  date: string;
  supplier: string;
  items: PurchaseItem[];
  total: number;
}

export interface JournalEntry extends AuditInfo {
  id: string;
  date: string;
  reference: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  type: 'Venda' | 'Compra' | 'Caixa' | 'Manual';
}

export interface CreditNote extends AuditInfo {
  id: string;
  creditNoteNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  reason: string;
  amount: number;
}

export interface CashMovement extends AuditInfo {
  id: string;
  date: string;
  type: 'Entrada' | 'Saída';
  category: string; // Venda, Pagamento Fornecedor, Despesa Administrativa, etc.
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string; // Invoice number or receipt number
}

export interface CashSession extends AuditInfo {
  id: string;
  userId: string;
  userName: string;
  openingDate: string;
  closingDate?: string;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  status: 'Aberto' | 'Fechado';
}

export enum ActivityType {
  LOGIN = 'Login',
  LOGOUT = 'Logout',
  CREATE = 'Criação',
  UPDATE = 'Atualização',
  DELETE = 'Exclusão',
  SALE = 'Venda',
  PURCHASE = 'Compra',
  STOCK_ADJUSTMENT = 'Ajuste de Estoque',
  CASH_OPEN = 'Abertura de Caixa',
  CASH_CLOSE = 'Fechamento de Caixa',
  CREDIT_NOTE = 'Nota de Crédito'
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  type: ActivityType;
  action: string;
  details?: string;
  targetId?: string;
  targetType?: string;
  ipAddress?: string;
}

export type ViewType = 'dashboard' | 'stock' | 'sales' | 'clients' | 'reports' | 'users' | 'purchases' | 'accounting' | 'cash' | 'logs' | 'profile';
