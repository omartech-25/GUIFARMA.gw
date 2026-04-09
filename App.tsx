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
import LogManagement from './components/LogManagement';
import Profile from './components/Profile';
import { ViewType, UserRole, Product, Sale, Client, User, Purchase, JournalEntry, CreditNote, SaleStatus, CashSession, CashMovement, PaymentMethod, UserPermissions, ActivityLog, ActivityType } from './types';
import { MOCK_PRODUCTS, MOCK_SALES, MOCK_USER, MOCK_CLIENTS, DEFAULT_PERMISSIONS, ROLE_PERMISSIONS, formatCurrency } from '@/constants';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  console.log('App rendering...');
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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Notification timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Prevent data loss on tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSyncing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSyncing]);

  // Carregar dados do Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [
          dbUsers,
          dbProducts,
          dbSales,
          dbClients,
          dbPurchases,
          dbJournalEntries,
          dbCreditNotes,
          dbCashSessions,
          dbCashMovements,
          dbActivityLogs
        ] = await Promise.all([
          dataService.getUsers().catch(() => []),
          dataService.getProducts().catch(() => []),
          dataService.getSales().catch(() => []),
          dataService.getClients().catch(() => []),
          dataService.getPurchases().catch(() => []),
          dataService.getJournalEntries().catch(() => []),
          dataService.getCreditNotes().catch(() => []),
          dataService.getCashSessions().catch(() => []),
          dataService.getCashMovements().catch(() => []),
          dataService.getActivityLogs().catch(() => [])
        ]);

        // Garantir usuários padrão
        const defaultUsers: User[] = [
          MOCK_USER,
          { id: 'u2', name: 'Mamadú Baldé', email: 'mamadu@medstock.pro', password: 'admin', role: UserRole.STOCK_MANAGER, employeeName: 'Mamadú Baldé', status: 'Ativo', permissions: ROLE_PERMISSIONS[UserRole.STOCK_MANAGER] },
          { id: 'u3', name: 'Fatu Djalo', email: 'fatu@medstock.pro', password: 'admin', role: UserRole.SELLER, employeeName: 'Fatu Djalo', status: 'Ativo', permissions: ROLE_PERMISSIONS[UserRole.SELLER] },
          { id: 'u4', name: 'UMARO GANHA BALDE', email: 'az965125324@gmail.com', password: 'admin', role: UserRole.ADMIN, employeeName: 'UMARO GANHA BALDE', status: 'Ativo', permissions: ROLE_PERMISSIONS[UserRole.ADMIN] }
        ];

        const mergedUsers = dbUsers.map(u => ({
          ...u,
          permissions: u.permissions || ROLE_PERMISSIONS[u.role] || DEFAULT_PERMISSIONS,
          status: u.status || 'Ativo'
        }));
        
        defaultUsers.forEach(defUser => {
          if (!mergedUsers.find(u => u.email.toLowerCase() === defUser.email.toLowerCase())) {
            mergedUsers.push(defUser);
            dataService.saveUser(defUser).catch(console.error);
          }
        });

        setUsers(mergedUsers);
        setProducts(dbProducts.length > 0 ? dbProducts : []);
        setSales(dbSales.length > 0 ? dbSales : []);
        setClients(dbClients.length > 0 ? dbClients : []);
        setPurchases(dbPurchases.length > 0 ? dbPurchases : []);
        setJournalEntries(dbJournalEntries.length > 0 ? dbJournalEntries : []);
        setCreditNotes(dbCreditNotes.length > 0 ? dbCreditNotes : []);
        setCashSessions(dbCashSessions.length > 0 ? dbCashSessions : []);
        setCashMovements(dbCashMovements.length > 0 ? dbCashMovements : []);
        setActivityLogs(dbActivityLogs.length > 0 ? dbActivityLogs : []);

      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
        setNotification({ type: 'error', message: 'Erro ao conectar com o banco de dados. Verifique sua conexão.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
        const loggedInUser = {
          ...data.user,
          employeeName: data.user.name,
          permissions: ROLE_PERMISSIONS[data.user.role as UserRole] || DEFAULT_PERMISSIONS
        };
        setIsAuthenticated(true);
        setCurrentUser(loggedInUser);
        
        // Log activity after setting currentUser
        const loginLog: ActivityLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: loggedInUser.id,
          userName: loggedInUser.name,
          userRole: loggedInUser.role,
          type: ActivityType.LOGIN,
          action: `Usuário ${loggedInUser.name} entrou no sistema`,
          targetId: loggedInUser.id,
          targetType: 'User'
        };
        setActivityLogs(prev => {
          const updated = [loginLog, ...prev];
          dataService.saveActivityLog(loginLog).catch(console.error);
          return updated;
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
        
        // Se o usuário tiver uma senha salva, valida contra ela. Caso contrário, usa o padrão 'admin' ou 'admin123'
        const isValid = user && (user.password ? pass === user.password : (pass === 'admin' || pass === 'admin123'));
        
        if (isValid) {
          if (user.status === 'Inativo') {
            setNotification({ type: 'error', message: 'Sua conta está aguardando aprovação do administrador.' });
            resolve(false);
            return;
          }
          localStorage.setItem('medstock_session', 'active');
          localStorage.setItem('medstock_user_id', user.id);
          setIsAuthenticated(true);
          setCurrentUser(user);
          
          const loginLog: ActivityLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            type: ActivityType.LOGIN,
            action: `Usuário ${user.name} entrou no sistema (Simulação)`,
            targetId: user.id,
            targetType: 'User'
          };
          setActivityLogs(prev => {
            const updated = [loginLog, ...prev];
            dataService.saveActivityLog(loginLog).catch(console.error);
            return updated;
          });
          
          resolve(true);
        } else {
          resolve(false);
        }
      }, 800);
    });
  };

  const handleRegister = async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsSyncing(true);
      
      // Verificar se o email já existe no estado local ou no banco de dados
      const existingInLocal = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingInLocal) {
        return { success: false, error: 'Este email já está cadastrado.' };
      }

      const existingInDB = await dataService.checkEmailExists(email);
      if (existingInDB) {
        return { success: false, error: 'Este email já está em uso. Tente outro.' };
      }

      const newUser: User = {
        id: Date.now().toString(), // Usar apenas números para ser mais compatível com colunas INT
        name: name.split(' ')[0], // Login name
        employeeName: name,
        email: email,
        password: pass,
        role: UserRole.SELLER, // Default role for self-registered users
        status: 'Inativo', // Aguardando aprovação
        permissions: ROLE_PERMISSIONS[UserRole.SELLER]
      };

      await dataService.saveUser(newUser);
      setUsers(prev => [...prev, newUser]);
      
      // Log activity
      const registerLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: newUser.id,
        userName: newUser.name,
        userRole: newUser.role,
        type: ActivityType.CREATE,
        action: `Novo usuário ${newUser.name} se registrou no sistema`,
        targetId: newUser.id,
        targetType: 'User'
      };
      dataService.saveActivityLog(registerLog).catch(console.error);
      
      setNotification({ type: 'success', message: 'Conta criada! Aguarde a aprovação do administrador.' });
      return { success: true };
    } catch (error: any) {
      console.error('Erro detalhado ao registrar usuário:', error);
      
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      // Se for erro de duplicidade no Supabase (23505 é o código do Postgres para unique violation)
      if (error.code === '23505' || (error.message && error.message.includes('unique constraint'))) {
        errorMessage = 'Este email já está em uso. Tente outro.';
      } else if (error.message && error.message.includes('column "permissions" of relation "users" does not exist')) {
        errorMessage = 'Erro de esquema no banco de dados. Contate o suporte.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      logActivity(ActivityType.LOGOUT, `Usuário ${currentUser.name} saiu do sistema`, undefined, currentUser.id, 'User');
    }
    localStorage.removeItem('medstock_session');
    localStorage.removeItem('medstock_user_id');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard'); // Reset view on logout
  };

  const logActivity = async (type: ActivityType, action: string, details?: string, targetId?: string, targetType?: string) => {
    if (!currentUser) return;
    
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      type,
      action,
      details,
      targetId,
      targetType
    };
    
    setActivityLogs(prev => [newLog, ...prev]);
    
    try {
      setIsSyncing(true);
      await dataService.saveActivityLog(newLog);
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const productWithAudit = {
      ...updatedProduct,
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? productWithAudit : p));
    
    try {
      setIsSyncing(true);
      await dataService.saveProduct(productWithAudit);
      logActivity(ActivityType.UPDATE, `Produto ${updatedProduct.name} atualizado`, `Estoque total: ${updatedProduct.batches.reduce((s, b) => s + b.quantity, 0)}`, updatedProduct.id, 'Product');
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao salvar alteração no produto.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    const productWithAudit = {
      ...newProduct,
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setProducts(prev => [...prev, productWithAudit]);
    
    try {
      setIsSyncing(true);
      await dataService.saveProduct(productWithAudit);
      logActivity(ActivityType.CREATE, `Novo produto cadastrado: ${newProduct.name}`, `Código: ${newProduct.code}`, newProduct.id, 'Product');
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao cadastrar novo produto.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddSale = async (newSale: Sale) => {
    const saleWithAudit = {
      ...newSale,
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setSales(prev => [saleWithAudit, ...prev]);
    
    try {
      setIsSyncing(true);
      await dataService.saveSale(saleWithAudit);
      logActivity(ActivityType.SALE, `Venda realizada: ${newSale.invoiceNumber}`, `Total: ${formatCurrency(newSale.total)} para ${newSale.clientName}`, newSale.id, 'Sale');

      // Add Cash Movement if paid in cash
      if (newSale.paymentMethod === PaymentMethod.CASH && newSale.status === SaleStatus.PAID) {
        await handleAddCashMovement({
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
          createdBy: currentUser?.name || 'Sistema',
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
          createdBy: currentUser?.name || 'Sistema',
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
          createdBy: currentUser?.name || 'Sistema',
          createdAt: new Date().toISOString()
        }
      ];
      
      setJournalEntries(prev => [...entries, ...prev]);
      await Promise.all(entries.map(entry => dataService.saveJournalEntry(entry)));
      
      setNotification({ type: 'success', message: 'Venda salva com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      setNotification({ type: 'error', message: 'Erro ao salvar a venda no banco de dados.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddCreditNote = async (newCreditNote: CreditNote) => {
    const cnWithAudit = {
      ...newCreditNote,
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString()
    };
    setCreditNotes(prev => [cnWithAudit, ...prev]);
    
    try {
      setIsSyncing(true);
      await dataService.saveCreditNote(cnWithAudit);
      
      // Update Sale status to CANCELLED
      setSales(prev => {
        const updated = prev.map(s => s.id === newCreditNote.invoiceId ? { ...s, status: SaleStatus.CANCELLED } : s);
        const cancelledSale = updated.find(s => s.id === newCreditNote.invoiceId);
        if (cancelledSale) dataService.saveSale(cancelledSale).catch(console.error);
        return updated;
      });
      
      logActivity(ActivityType.CREDIT_NOTE, `Nota de crédito emitida: ${newCreditNote.creditNoteNumber}`, `Motivo: ${newCreditNote.reason}. Valor: ${formatCurrency(newCreditNote.amount)}`, newCreditNote.id, 'CreditNote');

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
          createdBy: currentUser?.name || 'Sistema',
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
          createdBy: currentUser?.name || 'Sistema',
          createdAt: new Date().toISOString()
        }
      ];
      
      setJournalEntries(prev => [...entries, ...prev]);
      await Promise.all(entries.map(entry => dataService.saveJournalEntry(entry)));
      
      setNotification({ type: 'success', message: 'Nota de crédito emitida e processada.' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao processar nota de crédito.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    const saleWithAudit = {
      ...updatedSale,
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setSales(prev => prev.map(s => s.id === updatedSale.id ? saleWithAudit : s));
    dataService.saveSale(saleWithAudit).catch(console.error);
    logActivity(ActivityType.UPDATE, `Venda ${updatedSale.invoiceNumber} editada`, `Total: ${formatCurrency(updatedSale.total)}`, updatedSale.id, 'Sale');
  };

  const handleDeleteSale = async (saleId: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      setNotification({ type: 'error', message: 'Apenas administradores podem excluir vendas.' });
      return;
    }
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    setSales(prev => prev.filter(s => s.id !== saleId));
    try {
      setIsSyncing(true);
      await dataService.deleteSale(saleId);
      logActivity(ActivityType.DELETE, `Venda ${saleToDelete.invoiceNumber} excluída`, `Valor: ${formatCurrency(saleToDelete.total)}`, saleId, 'Sale');
      setNotification({ type: 'success', message: 'Venda excluída com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      setNotification({ type: 'error', message: 'Erro ao excluir a venda no banco de dados.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddPurchase = async (newPurchase: Purchase) => {
    const purchaseWithAudit = {
      ...newPurchase,
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setPurchases(prev => [purchaseWithAudit, ...prev]);
    try {
      setIsSyncing(true);
      await dataService.savePurchase(purchaseWithAudit);
      logActivity(ActivityType.PURCHASE, `Nova compra registada: ${newPurchase.invoiceNumber}`, `Fornecedor: ${newPurchase.supplier}. Total: ${formatCurrency(newPurchase.total)}`, newPurchase.id, 'Purchase');
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao registar compra.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdatePurchase = async (updatedPurchase: Purchase) => {
    const purchaseWithAudit = {
      ...updatedPurchase,
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setPurchases(prev => prev.map(p => p.id === updatedPurchase.id ? purchaseWithAudit : p));
    try {
      setIsSyncing(true);
      await dataService.savePurchase(purchaseWithAudit);
      logActivity(ActivityType.UPDATE, `Compra ${updatedPurchase.invoiceNumber} editada`, `Fornecedor: ${updatedPurchase.supplier}. Total: ${formatCurrency(updatedPurchase.total)}`, updatedPurchase.id, 'Purchase');
      setNotification({ type: 'success', message: 'Compra atualizada com sucesso.' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao atualizar compra.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      setNotification({ type: 'error', message: 'Apenas administradores podem excluir compras.' });
      return;
    }
    const purchaseToDelete = purchases.find(p => p.id === purchaseId);
    if (!purchaseToDelete) return;

    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    try {
      setIsSyncing(true);
      await dataService.deletePurchase(purchaseId);
      logActivity(ActivityType.DELETE, `Compra ${purchaseToDelete.invoiceNumber} excluída`, `Fornecedor: ${purchaseToDelete.supplier}`, purchaseId, 'Purchase');
      setNotification({ type: 'success', message: 'Compra excluída com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir compra:', error);
      setNotification({ type: 'error', message: 'Erro ao excluir a compra no banco de dados.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddClient = async (newClient: Client) => {
    const clientWithAudit = {
      ...newClient,
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Sistema',
      updatedAt: new Date().toISOString()
    };
    setClients(prev => [...prev, clientWithAudit]);
    try {
      setIsSyncing(true);
      await dataService.saveClient(clientWithAudit);
      logActivity(ActivityType.CREATE, `Novo cliente cadastrado: ${newClient.name}`, `NIF: ${newClient.nif}`, newClient.id, 'Client');
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao cadastrar cliente.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    dataService.saveUser(newUser).catch(console.error);
    logActivity(ActivityType.CREATE, `Novo usuário criado: ${newUser.name}`, `Cargo: ${newUser.role}`, newUser.id, 'User');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && updatedUser.id === currentUser.id) {
      setCurrentUser(updatedUser);
    }
    dataService.saveUser(updatedUser).catch(console.error);
    logActivity(ActivityType.UPDATE, `Usuário ${updatedUser.name} atualizado`, `Cargo: ${updatedUser.role}`, updatedUser.id, 'User');
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      setNotification({ type: 'error', message: 'Apenas administradores podem excluir usuários.' });
      return;
    }
    // Proteger usuários mestres
    const masterUserIds = ['u1', 'u2', 'u3', 'u4'];
    if (masterUserIds.includes(userId)) {
      setNotification({ type: 'error', message: 'Este usuário é um administrador mestre e não pode ser excluído.' });
      return;
    }

    const userToDelete = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    try {
      setIsSyncing(true);
      await dataService.deleteUser(userId);
      if (userToDelete) {
        logActivity(ActivityType.DELETE, `Usuário ${userToDelete.name} excluído`, undefined, userId, 'User');
      }
      setNotification({ type: 'success', message: 'Usuário removido com sucesso.' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao excluir usuário.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      setNotification({ type: 'error', message: 'Apenas administradores podem excluir produtos.' });
      return;
    }
    const productToDelete = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    
    try {
      setIsSyncing(true);
      await dataService.deleteProduct(productId);
      if (productToDelete) {
        logActivity(ActivityType.DELETE, `Produto ${productToDelete.name} excluído`, `Código: ${productToDelete.code}`, productId, 'Product');
      }
      setNotification({ type: 'success', message: 'Produto removido com sucesso.' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao excluir produto.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartSaleFromStock = (productId: string) => {
    setPreSelectedProductId(productId);
    setCurrentView('sales');
  };

  const handleAddJournalEntry = (entry: JournalEntry) => {
    setJournalEntries(prev => [entry, ...prev]);
    dataService.saveJournalEntry(entry).catch(console.error);
  };

  const handleUpdateJournalEntry = (entry: JournalEntry) => {
    setJournalEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
    dataService.saveJournalEntry(entry).catch(console.error);
  };

  const handleDeleteJournalEntry = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      setNotification({ type: 'error', message: 'Apenas administradores podem excluir lançamentos contábeis.' });
      return;
    }
    setJournalEntries(prev => prev.filter(e => e.id !== id));
    dataService.deleteJournalEntry(id).catch(console.error);
  };

  const handleOpenCashSession = (openingBalance: number) => {
    const newSession: CashSession = {
      id: `cs-${Date.now()}`,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      openingDate: new Date().toISOString(),
      openingBalance,
      status: 'Aberto',
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString()
    };
    setCashSessions(prev => [newSession, ...prev]);
    dataService.saveCashSession(newSession).catch(console.error);
    logActivity(ActivityType.CASH_OPEN, `Caixa aberto`, `Saldo inicial: ${formatCurrency(openingBalance)}`, newSession.id, 'CashSession');
  };

  const handleCloseCashSession = (closingBalance: number) => {
    let closedSessionId = '';
    setCashSessions(prev => prev.map(s => {
      if (s.status === 'Aberto') {
        closedSessionId = s.id;
        const currentMovements = cashMovements.filter(m => new Date(m.date) >= new Date(s.openingDate));
        const inflows = currentMovements.filter(m => m.type === 'Entrada').reduce((sum, m) => sum + m.amount, 0);
        const outflows = currentMovements.filter(m => m.type === 'Saída').reduce((sum, m) => sum + m.amount, 0);
        const expected = s.openingBalance + inflows - outflows;

        const updatedSession: CashSession = {
          ...s,
          status: 'Fechado',
          closingDate: new Date().toISOString(),
          closingBalance,
          expectedBalance: expected,
          updatedBy: currentUser?.name || 'Sistema',
          updatedAt: new Date().toISOString()
        };
        dataService.saveCashSession(updatedSession).catch(console.error);
        return updatedSession;
      }
      return s;
    }));
    if (closedSessionId) {
      logActivity(ActivityType.CASH_CLOSE, `Caixa fechado`, `Saldo final: ${formatCurrency(closingBalance)}`, closedSessionId, 'CashSession');
    }
  };

  const handleAddCashMovement = async (movement: Partial<CashMovement>) => {
    const newMovement: CashMovement = {
      id: `cm-${Date.now()}`,
      date: movement.date || new Date().toISOString(),
      type: movement.type || 'Entrada',
      category: movement.category || 'Outros',
      description: movement.description || '',
      amount: movement.amount || 0,
      paymentMethod: movement.paymentMethod || PaymentMethod.CASH,
      reference: movement.reference,
      createdBy: currentUser?.name || 'Sistema',
      createdAt: new Date().toISOString()
    };
    setCashMovements(prev => [newMovement, ...prev]);
    
    try {
      setIsSyncing(true);
      await dataService.saveCashMovement(newMovement);

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
      await dataService.saveJournalEntry(entry);
    } catch (error) {
      console.error('Erro ao salvar movimento de caixa:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearPurchases = async () => {
    if (currentUser?.role !== UserRole.ADMIN) {
      setNotification({ type: 'error', message: 'Apenas administradores podem limpar o histórico.' });
      return;
    }
    try {
      setIsSyncing(true);
      await dataService.clearPurchases();
      setPurchases([]);
      logActivity(ActivityType.DELETE, 'Histórico de compras limpo', 'Todas as faturas de compra foram removidas', 'all', 'Purchase');
      setNotification({ type: 'success', message: 'Histórico de compras limpo com sucesso.' });
    } catch (error) {
      console.error('Erro ao limpar histórico de compras:', error);
      setNotification({ type: 'error', message: 'Erro ao limpar histórico de compras.' });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleClearCashHistory = async () => {
    if (currentUser?.role !== UserRole.ADMIN) {
      setNotification({ type: 'error', message: 'Apenas administradores podem limpar o histórico.' });
      return;
    }
    try {
      setIsSyncing(true);
      await dataService.clearCashMovements();
      await dataService.clearCashSessions();
      setCashMovements([]);
      setCashSessions([]);
      logActivity(ActivityType.DELETE, 'Histórico de caixa limpo', 'Todos os movimentos e sessões foram removidos', 'all', 'Cash');
      setNotification({ type: 'success', message: 'Histórico de caixa limpo com sucesso.' });
    } catch (error) {
      console.error('Erro ao limpar histórico de caixa:', error);
      setNotification({ type: 'error', message: 'Erro ao limpar histórico de caixa.' });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-sm">Conectando ao Supabase...</p>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const renderView = () => {
    // Check permissions for the current view
    const viewPermissions: Record<string, keyof UserPermissions | (keyof UserPermissions)[]> = {
      'stock': 'registerProducts',
      'purchases': 'stockEntry',
      'sales': 'sales',
      'quick-invoice': 'sales',
      'cash': 'cashClosing',
      'clients': 'registerClients',
      'reports': ['reportsRegistration', 'reportsFinancial', 'reportsManagement'],
      'accounting': ['bankMovements', 'accountTransfers'],
      'users': ['registerUsers', 'systemSettings']
    };

    const requiredPerm = viewPermissions[currentView];
    if (requiredPerm) {
      const perms = Array.isArray(requiredPerm) ? requiredPerm : [requiredPerm];
      const userPermissions = currentUser.permissions || ROLE_PERMISSIONS[currentUser.role] || DEFAULT_PERMISSIONS;
      const hasPermission = perms.some(p => userPermissions[p as keyof typeof userPermissions]);
      if (!hasPermission) {
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 space-y-4">
            <div className="bg-red-50 p-6 rounded-full text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Acesso Negado</h3>
            <p className="text-sm max-w-xs text-center">Você não tem permissão para acessar esta área do sistema. Entre em contato com o administrador.</p>
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              Voltar ao Início
            </button>
          </div>
        );
      }
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={products} sales={sales} currentUser={currentUser} onNavigate={setCurrentView} />;
      case 'stock':
        return (
          <StockManagement 
            products={products} 
            sales={sales}
            purchases={purchases}
            currentUser={currentUser}
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
            currentUser={currentUser}
            onAddPurchase={handleAddPurchase}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
            onClearHistory={handleClearPurchases}
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
            onDeleteSale={handleDeleteSale}
            onUpdateProduct={handleUpdateProduct}
            onAddCreditNote={handleAddCreditNote}
            onPDVClose={() => setPreSelectedProductId(undefined)}
          />
        );
      case 'clients':
        return (
          <ClientManagement 
            clients={clients} 
            currentUser={currentUser}
            onAddClient={handleAddClient} 
          />
        );
      case 'users':
        return (
          <UserManagement 
            users={users} 
            currentUser={currentUser}
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
            currentUser={currentUser}
            onAddJournalEntry={handleAddJournalEntry}
            onUpdateJournalEntry={handleUpdateJournalEntry}
            onDeleteJournalEntry={handleDeleteJournalEntry}
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
            onClearHistory={handleClearCashHistory}
          />
        );
      case 'logs':
        return (
          <LogManagement 
            logs={activityLogs} 
            currentUser={currentUser}
            onClearLogs={async (thresholdDate) => {
              if (currentUser?.role !== UserRole.ADMIN) {
                setNotification({ type: 'error', message: 'Apenas administradores podem limpar os logs.' });
                return;
              }
              try {
                setIsSyncing(true);
                await dataService.clearOldLogs(thresholdDate);
                setActivityLogs(prev => prev.filter(log => new Date(log.timestamp) >= new Date(thresholdDate)));
                logActivity(ActivityType.DELETE, `Limpeza de logs realizada`, `Logs anteriores a ${new Date(thresholdDate).toLocaleDateString()} foram removidos`, currentUser?.id, 'System');
                setNotification({ type: 'success', message: 'Logs limpos com sucesso.' });
              } catch (error) {
                setNotification({ type: 'error', message: 'Erro ao limpar logs.' });
              } finally {
                setIsSyncing(false);
              }
            }} 
            isSyncing={isSyncing}
          />
        );
      case 'profile':
        return (
          <Profile 
            user={currentUser} 
            onUpdateUser={handleUpdateUser} 
          />
        );
      default:
        return <Dashboard products={products} sales={sales} clients={clients} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
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
      
      <main className={`flex-1 h-full overflow-y-auto p-4 md:p-8 lg:p-12 transition-all ${isAuthenticated ? 'lg:ml-64' : ''}`}>
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
                 <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                 <span className={`text-[10px] ${isSyncing ? 'text-amber-600' : 'text-emerald-600'} font-black uppercase tracking-tighter`}>
                   {isSyncing ? 'Sincronizando...' : 'Supabase Database Connected'}
                 </span>
               </div>
            </div>
          </div>
        </header>

        {notification && (
          <div className={`fixed top-4 right-4 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slideUp ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            )}
            <p className="font-bold text-sm">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        )}

        {renderView()}

        <footer className="mt-20 border-t border-slate-200 pt-8 pb-12 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p>© 2024 GUIFARMA SA. Distribuidora Farmacêutica - Guiné-Bissau.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-600 font-medium">Normas OHADA</a>
            <a href="#" className="hover:text-emerald-600 font-medium">Suporte Técnico +245 955628989</a>
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
