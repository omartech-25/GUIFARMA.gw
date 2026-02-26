
export enum UserRole {
  ADMIN = 'Administrador',
  STOCK_MANAGER = 'Fiel de Armazém',
  SELLER = 'Vendedor',
  ACCOUNTANT = 'Contabilista',
  SUPERVISOR = 'Supervisor'
}

export interface User {
  id: string;
  name: string;
  employeeName: string;
  role: UserRole;
  email: string;
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

export interface Product {
  id: string;
  code: string;
  name: string; // Commercial Name
  genericName: string; // DCI
  category: MedicineCategory;
  pharmaceuticalForm: PharmaceuticalForm;
  dosage: string;
  batches: Batch[];
  sellingPriceWholesale: number; // Price per unit (FCFA)
  minStockAlert: number;
  manufacturer: string;
  sanitaryRegistry: string;
  unitsPerBox: number;
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
  DELIVERED = 'Entregue'
}

export interface Client {
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
  productName: string;
  batchId: string;
  quantity: number; // units
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  clientId: string;
  clientName: string;
  clientNif: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // %
  iva: number; // % (usually 18)
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  sellerId: string;
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

export interface Purchase {
  id: string;
  invoiceNumber: string;
  date: string;
  supplier: string;
  items: PurchaseItem[];
  total: number;
}

export type ViewType = 'dashboard' | 'stock' | 'sales' | 'clients' | 'reports' | 'users' | 'purchases';
