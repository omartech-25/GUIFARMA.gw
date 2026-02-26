
import { Product, MedicineCategory, Client, UserRole, User, Sale, PaymentMethod, PharmaceuticalForm, SaleStatus } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'António Silva',
  employeeName: 'António Silva',
  role: UserRole.ADMIN,
  email: 'admin@medstock.pro'
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    code: 'AMX-500',
    name: 'Amoxicilina GUIFARMA',
    genericName: 'Amoxicilina',
    category: MedicineCategory.ANTIBIOTIC,
    pharmaceuticalForm: PharmaceuticalForm.CAPSULE,
    dosage: '500mg',
    sellingPriceWholesale: 4500,
    minStockAlert: 100,
    manufacturer: 'PharmaCura Global',
    sanitaryRegistry: 'MS-GB-2023-001',
    unitsPerBox: 10,
    batches: [
      { 
        id: 'b1', 
        batchNumber: 'INT-23-001', 
        manufacturerBatchNumber: 'LOT23-A1',
        manufacturingDate: '2023-01-01',
        expiryDate: '2025-12-30', 
        quantity: 500, 
        purchasePrice: 3200,
        location: 'Corredor A, Prateleira 1',
        isColdChain: false
      },
      { 
        id: 'b2', 
        batchNumber: 'INT-23-002', 
        manufacturerBatchNumber: 'LOT23-A2',
        manufacturingDate: '2023-02-01',
        expiryDate: '2024-06-15', 
        quantity: 200, 
        purchasePrice: 3100,
        location: 'Corredor A, Prateleira 2',
        isColdChain: false
      }
    ]
  },
  {
    id: 'p2',
    code: 'PAR-750',
    name: 'Paracetamol GUIFARMA',
    genericName: 'Paracetamol',
    category: MedicineCategory.ANALGESIC,
    pharmaceuticalForm: PharmaceuticalForm.TABLET,
    dosage: '750mg',
    sellingPriceWholesale: 1200,
    minStockAlert: 500,
    manufacturer: 'MedLab Central',
    sanitaryRegistry: 'MS-GB-2023-045',
    unitsPerBox: 20,
    batches: [
      { 
        id: 'b3', 
        batchNumber: 'INT-24-001', 
        manufacturerBatchNumber: 'PAR-Z9',
        manufacturingDate: '2023-12-01',
        expiryDate: '2026-01-10', 
        quantity: 1500, 
        purchasePrice: 800,
        location: 'Corredor B, Prateleira 5',
        isColdChain: false
      }
    ]
  },
  {
    id: 'p3',
    code: 'INS-GLA',
    name: 'Insulina Glargina',
    genericName: 'Insulina Glargina',
    category: MedicineCategory.OTHER,
    pharmaceuticalForm: PharmaceuticalForm.INJECTABLE,
    dosage: '100 UI/ml',
    sellingPriceWholesale: 15000,
    minStockAlert: 20,
    manufacturer: 'EuroMed Supplies',
    sanitaryRegistry: 'MS-GB-2023-099',
    unitsPerBox: 5,
    batches: [
      { 
        id: 'b4', 
        batchNumber: 'INT-24-005', 
        manufacturerBatchNumber: 'INS-002',
        manufacturingDate: '2023-10-01',
        expiryDate: '2024-10-20', 
        quantity: 30, 
        purchasePrice: 11000,
        location: 'Área de Frio - Câmara 1',
        isColdChain: true
      }
    ]
  }
];

export const MOCK_CLIENTS: Client[] = [
  { 
    id: 'c1', 
    name: 'Farmácia Esperança', 
    nif: '500123456',
    technicalResponsible: 'Dra. Fatu Djalo',
    type: 'Farmácia', 
    contact: '+245 955 000 111', 
    address: 'Avenida 3 de Agosto, Bissau',
    region: 'Bissau',
    creditLimit: 500000, 
    balance: 120000,
    paymentTerm: 15
  },
  { 
    id: 'c2', 
    name: 'Hospital Regional de Bissau', 
    nif: '500987654',
    technicalResponsible: 'Dr. Mamadu Balde',
    type: 'Hospital', 
    contact: '+245 966 222 333', 
    address: 'Estrada de Bor, Bissau',
    region: 'Bissau',
    creditLimit: 2000000, 
    balance: 450000,
    paymentTerm: 30
  },
  { 
    id: 'c3', 
    name: 'Cruz Vermelha Local', 
    nif: '500555444',
    technicalResponsible: 'Dra. Maria Sani',
    type: 'ONG', 
    contact: '+245 955 888 999', 
    address: 'Rua de Angola, Bissau',
    region: 'Bissau',
    creditLimit: 1000000, 
    balance: 0,
    paymentTerm: 45
  },
  { 
    id: 'c4', 
    name: 'Farmácia Bafatá Central', 
    nif: '500222333',
    technicalResponsible: 'Dr. Umaro Sissoco',
    type: 'Farmácia', 
    contact: '+245 955 111 222', 
    address: 'Centro de Bafatá',
    region: 'Bafatá',
    creditLimit: 300000, 
    balance: 50000,
    paymentTerm: 15
  },
  { 
    id: 'c5', 
    name: 'Clínica de Gabu', 
    nif: '500444555',
    technicalResponsible: 'Dra. Adama Djalo',
    type: 'Hospital', 
    contact: '+245 966 444 555', 
    address: 'Bairro Comercial, Gabu',
    region: 'Gabu',
    creditLimit: 800000, 
    balance: 0,
    paymentTerm: 30
  }
];

export const MOCK_SALES: Sale[] = [
  {
    id: 's1',
    invoiceNumber: 'INV-2024-001',
    date: '2024-03-10T14:30:00Z',
    clientId: 'c1',
    clientName: 'Farmácia Esperança',
    clientNif: '500123456',
    subtotal: 155000,
    discount: 0,
    iva: 18,
    total: 182900,
    paymentMethod: PaymentMethod.CASH,
    status: SaleStatus.PAID,
    sellerId: 'u1',
    items: [
      { productId: 'p1', productName: 'Amoxicilina GUIFARMA', batchId: 'b1', quantity: 20, unitPrice: 4500, total: 90000 },
      { productId: 'p2', productName: 'Paracetamol GUIFARMA', batchId: 'b3', quantity: 50, unitPrice: 1300, total: 65000 }
    ]
  },
  {
    id: 's2',
    invoiceNumber: 'INV-2024-002',
    date: '2024-03-11T10:00:00Z',
    clientId: 'c4',
    clientName: 'Farmácia Bafatá Central',
    clientNif: '500222333',
    subtotal: 45000,
    discount: 5,
    iva: 18,
    total: 50445,
    paymentMethod: PaymentMethod.ORANGE_MONEY,
    status: SaleStatus.PAID,
    sellerId: 'u1',
    items: [
      { productId: 'p1', productName: 'Amoxicilina GUIFARMA', batchId: 'b1', quantity: 10, unitPrice: 4500, total: 45000 }
    ]
  }
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // Closest representation to FCFA
  }).format(value).replace('XOF', 'FCFA');
};
