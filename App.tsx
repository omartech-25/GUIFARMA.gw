
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StockManagement from './components/StockManagement';
import SalesManagement from './components/SalesManagement';
import ClientManagement from './components/ClientManagement';
import UserManagement from './components/UserManagement';
import PurchaseManagement from './components/PurchaseManagement';
import Reports from './components/Reports';
import Login from './components/Login';
import { ViewType, UserRole, Product, Sale, Client, User, Purchase } from './types';
import { MOCK_PRODUCTS, MOCK_SALES, MOCK_USER, MOCK_CLIENTS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [users, setUsers] = useState<User[]>([
    MOCK_USER,
    { id: 'u2', name: 'Mamadú Baldé', email: 'mamadu@medstock.pro', role: UserRole.STOCK_MANAGER },
    { id: 'u3', name: 'Fatu Djalo', email: 'fatu@medstock.pro', role: UserRole.SELLER }
  ]);

  // Verificar sessão ao carregar
  useEffect(() => {
    const session = localStorage.getItem('medstock_session');
    if (session === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    // Simulação da lógica que seria processada pelo login.php
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // Aceita 'admin' ou 'admin123' para facilitar o teste inicial
        const isValid = email.toLowerCase() === 'admin@medstock.pro' && (pass === 'admin' || pass === 'admin123');
        
        if (isValid) {
          localStorage.setItem('medstock_session', 'active');
          setIsAuthenticated(true);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 800);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('medstock_session');
    setIsAuthenticated(false);
    setCurrentView('dashboard'); // Reset view on logout
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  const handleAddSale = (newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);
  };

  const handleAddPurchase = (newPurchase: Purchase) => {
    setPurchases(prev => [newPurchase, ...prev]);
  };

  const handleAddClient = (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  if (!isAuthenticated) {
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
            onUpdateProduct={handleUpdateProduct} 
            onAddProduct={handleAddProduct}
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
            onAddSale={handleAddSale}
            onUpdateProduct={handleUpdateProduct}
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
      default:
        return <div className="p-12 text-center text-slate-400">Em desenvolvimento...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        userRole={MOCK_USER.role} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 min-h-screen p-8 lg:p-12 transition-all">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
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
