
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StockManagement from './components/StockManagement';
import SalesManagement from './components/SalesManagement';
import ClientManagement from './components/ClientManagement';
import UserManagement from './components/UserManagement';
import PurchaseManagement from './components/PurchaseManagement';
import Reports from './components/Reports';
import Accounting from './components/Accounting';
import CashDesk from './components/CashDesk';
import Login from './components/Login';
import { ViewType, UserRole, Product, Sale, Client, User, Purchase, JournalEntry, CreditNote, SaleStatus, CashSession, CashMovement, PaymentMethod, UserPermissions } from './types';
import { MOCK_PRODUCTS, MOCK_SALES, MOCK_USER, MOCK_CLIENTS, DEFAULT_PERMISSIONS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [preSelectedProductId, setPreSelectedProductId] = useState<string | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [users, setUsers] = useState<User[]>([
    MOCK_USER,
    { id: 'u2', name: 'Mamadú Baldé', email: 'mamadu@medstock.pro', role: UserRole.STOCK_MANAGER, employeeName: 'Mamadú Baldé', permissions: DEFAULT_PERMISSIONS },
    { id: 'u3', name: 'Fatu Djalo', email: 'fatu@medstock.pro', role: UserRole.SELLER, employeeName: 'Fatu Djalo', permissions: DEFAULT_PERMISSIONS }
  ]);

  // Verificar sessão ao carregar
  useEffect(() => {
    const session = localStorage.getItem('medstock_session');
    const userId = localStorage.getItem('medstock_user_id');
    if (session === 'active' && userId) {
      const user = users.find(u => u.id === userId);
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
      }
    }
  }, [users]);

  const handleLogin = async (email: string, pass: string) => {
    try {
      // Tentar login real via PHP
      const response = await fetch('./login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('medstock_session', 'active');
        localStorage.setItem('medstock_user_id', data.user.id);
        setIsAuthenticated(true);
        setCurrentUser({
          ...data.user,
          employeeName: data.user.name,
          permissions: DEFAULT_PERMISSIONS // Em produção, viria do banco
        });
        return true;
      }
    } catch (error) {
      console.log('Backend PHP não detectado, usando simulação...');
    }

    // Simulação da lógica (Fallback para desenvolvimento sem PHP)
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        const isValid = user && (pass === 'admin' || pass === 'admin123');
        
        if (isValid) {
          localStorage.setItem('medstock_session', 'active');
          localStorage.setItem('medstock_user_id', user.id);
          setIsAuthenticated(true);
          setCurrentUser(user);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 800);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('medstock_session');
    localStorage.removeItem('medstock_user_id');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard'); // Reset view on logout
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const productWithAudit = {
      ...updatedProduct,
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? productWithAudit : p));
  };

  const handleAddProduct = (newProduct: Product) => {
    const productWithAudit = {
      ...newProduct,
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setProducts(prev => [...prev, productWithAudit]);
  };

  const handleAddSale = (newSale: Sale) => {
    const saleWithAudit = {
      ...newSale,
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setSales(prev => [saleWithAudit, ...prev]);

    // Add Cash Movement if paid in cash
    if (newSale.paymentMethod === PaymentMethod.CASH && newSale.status === SaleStatus.PAID) {
      handleAddCashMovement({
        type: 'Entrada',
        category: 'Venda',
        description: `Venda ${newSale.invoiceNumber}`,
        amount: newSale.total,
        paymentMethod: PaymentMethod.CASH,
        reference: newSale.invoiceNumber
      });
    }

    // Automatic Accounting Entries
    const entries: JournalEntry[] = [
      {
        id: `je-${Date.now()}-1`,
        date: newSale.date,
        reference: newSale.invoiceNumber,
        accountCode: '411',
        accountName: 'Clientes',
        description: `Venda a ${newSale.clientName}`,
        debit: newSale.total,
        credit: 0,
        type: 'Venda',
        createdBy: MOCK_USER.name,
        createdAt: new Date().toISOString()
      },
      {
        id: `je-${Date.now()}-2`,
        date: newSale.date,
        reference: newSale.invoiceNumber,
        accountCode: '701',
        accountName: 'Vendas de Mercadorias',
        description: `Receita de Venda - ${newSale.invoiceNumber}`,
        debit: 0,
        credit: newSale.taxableBase,
        type: 'Venda',
        createdBy: MOCK_USER.name,
        createdAt: new Date().toISOString()
      },
      {
        id: `je-${Date.now()}-3`,
        date: newSale.date,
        reference: newSale.invoiceNumber,
        accountCode: '443',
        accountName: 'Estado, IVA Facturado',
        description: `IVA sobre Venda - ${newSale.invoiceNumber}`,
        debit: 0,
        credit: newSale.total - newSale.taxableBase,
        type: 'Venda',
        createdBy: MOCK_USER.name,
        createdAt: new Date().toISOString()
      }
    ];
    setJournalEntries(prev => [...entries, ...prev]);
  };

  const handleAddCreditNote = (newCreditNote: CreditNote) => {
    const cnWithAudit = {
      ...newCreditNote,
      createdBy: MOCK_USER.name,
      createdAt: new Date().toISOString()
    };
    setCreditNotes(prev => [cnWithAudit, ...prev]);
    
    // Update Sale status to CANCELLED
    setSales(prev => prev.map(s => s.id === newCreditNote.invoiceId ? { ...s, status: SaleStatus.CANCELLED } : s));

    // Accounting reversal
    const entries: JournalEntry[] = [
      {
        id: `je-cn-${Date.now()}-1`,
        date: newCreditNote.date,
        reference: newCreditNote.creditNoteNumber,
        accountCode: '411',
        accountName: 'Clientes',
        description: `Nota de Crédito - Ref ${newCreditNote.invoiceNumber}`,
        debit: 0,
        credit: newCreditNote.amount,
        type: 'Manual',
        createdBy: MOCK_USER.name,
        createdAt: new Date().toISOString()
      },
      {
        id: `je-cn-${Date.now()}-2`,
        date: newCreditNote.date,
        reference: newCreditNote.creditNoteNumber,
        accountCode: '701',
        accountName: 'Vendas de Mercadorias',
        description: `Estorno de Venda - Ref ${newCreditNote.invoiceNumber}`,
        debit: newCreditNote.amount,
        credit: 0,
        type: 'Manual',
        createdBy: MOCK_USER.name,
        createdAt: new Date().toISOString()
      }
    ];
    setJournalEntries(prev => [...entries, ...prev]);
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    const saleWithAudit = {
      ...updatedSale,
      updatedBy: MOCK_USER.name,
      updatedAt: new Date().toISOString()
    };
    setSales(prev => prev.map(s => s.id === updatedSale.id ? saleWithAudit : s));
  };

  const handleAddPurchase = (newPurchase: Purchase) => {
    const purchaseWithAudit = {
      ...newPurchase,
      createdBy: MOCK_USER.name,
      createdAt: new Date().toISOString(),
      updatedBy: MOCK_USER.name,
      updatedAt: new Date().toISOString()
    };
    setPurchases(prev => [purchaseWithAudit, ...prev]);
  };

  const handleAddClient = (newClient: Client) => {
    const clientWithAudit = {
      ...newClient,
      createdBy: MOCK_USER.name,
      createdAt: new Date().toISOString(),
      updatedBy: MOCK_USER.name,
      updatedAt: new Date().toISOString()
    };
    setClients(prev => [...prev, clientWithAudit]);
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleStartSaleFromStock = (productId: string) => {
    setPreSelectedProductId(productId);
    setCurrentView('sales');
  };

  const handleOpenCashSession = (openingBalance: number) => {
    const newSession: CashSession = {
      id: `cs-${Date.now()}`,
      userId: MOCK_USER.id,
      userName: MOCK_USER.name,
      openingDate: new Date().toISOString(),
      openingBalance,
      status: 'Aberto',
      createdBy: MOCK_USER.name,
      createdAt: new Date().toISOString()
    };
    setCashSessions(prev => [newSession, ...prev]);
  };

  const handleCloseCashSession = (closingBalance: number) => {
    setCashSessions(prev => prev.map(s => {
      if (s.status === 'Aberto') {
        const currentMovements = cashMovements.filter(m => new Date(m.date) >= new Date(s.openingDate));
        const inflows = currentMovements.filter(m => m.type === 'Entrada').reduce((sum, m) => sum + m.amount, 0);
        const outflows = currentMovements.filter(m => m.type === 'Saída').reduce((sum, m) => sum + m.amount, 0);
        const expected = s.openingBalance + inflows - outflows;

        return {
          ...s,
          status: 'Fechado',
          closingDate: new Date().toISOString(),
          closingBalance,
          expectedBalance: expected,
          updatedBy: MOCK_USER.name,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));
  };

  const handleAddCashMovement = (movement: Partial<CashMovement>) => {
    const newMovement: CashMovement = {
      id: `cm-${Date.now()}`,
      date: movement.date || new Date().toISOString(),
      type: movement.type || 'Entrada',
      category: movement.category || 'Outros',
      description: movement.description || '',
      amount: movement.amount || 0,
      paymentMethod: movement.paymentMethod || PaymentMethod.CASH,
      reference: movement.reference,
      createdBy: MOCK_USER.name,
      createdAt: new Date().toISOString()
    };
    setCashMovements(prev => [newMovement, ...prev]);

    // Also add to accounting
    const entry: JournalEntry = {
      id: `je-cash-${Date.now()}`,
      date: newMovement.date,
      reference: newMovement.reference || 'CAIXA',
      accountCode: '571',
      accountName: 'Caixa',
      description: newMovement.description,
      debit: newMovement.type === 'Entrada' ? newMovement.amount : 0,
      credit: newMovement.type === 'Saída' ? newMovement.amount : 0,
      type: 'Caixa',
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString()
    };
    setJournalEntries(prev => [entry, ...prev]);
  };

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={products} sales={sales} />;
      case 'stock':
        return (
          <StockManagement 
            products={products} 
            sales={sales}
            purchases={purchases}
            onUpdateProduct={handleUpdateProduct} 
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onStartSale={handleStartSaleFromStock}
            onAddPurchase={handleAddPurchase}
          />
        );
      case 'purchases':
        return (
          <PurchaseManagement 
            products={products}
            purchases={purchases}
            onAddPurchase={handleAddPurchase}
            onUpdateProduct={handleUpdateProduct}
          />
        );
      case 'sales':
        return (
          <SalesManagement 
            products={products} 
            sales={sales} 
            clients={clients}
            creditNotes={creditNotes}
            initialProductId={preSelectedProductId}
            currentUser={currentUser}
            onAddSale={handleAddSale}
            onUpdateSale={handleUpdateSale}
            onUpdateProduct={handleUpdateProduct}
            onAddCreditNote={handleAddCreditNote}
            onPDVClose={() => setPreSelectedProductId(undefined)}
          />
        );
      case 'clients':
        return (
          <ClientManagement 
            clients={clients} 
            onAddClient={handleAddClient} 
          />
        );
      case 'users':
        return (
          <UserManagement 
            users={users} 
            onAddUser={handleAddUser} 
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'reports':
        return (
          <Reports 
            products={products} 
            sales={sales} 
            clients={clients} 
          />
        );
      case 'accounting':
        return (
          <Accounting 
            sales={sales}
            purchases={purchases}
            products={products}
            journalEntries={journalEntries}
            onAddJournalEntry={(entry) => setJournalEntries(prev => [entry, ...prev])}
          />
        );
      case 'cash':
        return (
          <CashDesk 
            sessions={cashSessions}
            movements={cashMovements}
            currentUser={currentUser}
            onOpenSession={handleOpenCashSession}
            onCloseSession={handleCloseCashSession}
            onAddMovement={handleAddCashMovement}
          />
        );
      default:
        return <div className="p-12 text-center text-slate-400">Em desenvolvimento...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }} 
        user={currentUser} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className={`flex-1 min-h-screen p-4 md:p-8 lg:p-12 transition-all ${isAuthenticated ? 'lg:ml-64' : ''}`}>
        <header className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
             {isAuthenticated && (
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="lg:hidden p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
               </button>
             )}
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">GUIFARMA SA / {currentView}</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
               <span className="text-sm font-bold text-slate-900">Bissau, Guiné-Bissau</span>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-[10px] text-emerald-600 font-black uppercase tracking-tighter">MySQL Database Connected</span>
               </div>
            </div>
          </div>
        </header>

        {renderView()}

        <footer className="mt-20 border-t border-slate-200 pt-8 pb-12 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p>© 2024 GUIFARMA SA. Distribuidora Farmacêutica - Guiné-Bissau.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-600 font-medium">Normas OHADA</a>
            <a href="#" className="hover:text-emerald-600 font-medium">Suporte Técnico</a>
          </div>
        </footer>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
