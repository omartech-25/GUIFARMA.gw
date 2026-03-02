
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Users, Trash2, CheckCircle2, Pill, ReceiptText, X, Filter, TrendingUp, Calendar, CreditCard, ArrowRight, Barcode, AlertTriangle, Printer, Download, Share2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, Sale, Client, PaymentMethod, SaleItem, Batch, SaleStatus, CreditNote, User, UserRole } from '../types';
import { formatCurrency } from '../constants';

interface SalesManagementProps {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  creditNotes: CreditNote[];
  initialProductId?: string;
  currentUser: User | null;
  onAddSale: (sale: Sale) => void;
  onUpdateSale: (sale: Sale) => void;
  onUpdateProduct: (product: Product) => void;
  onAddCreditNote: (creditNote: CreditNote) => void;
  onPDVClose?: () => void;
}

const SalesManagement: React.FC<SalesManagementProps> = ({ 
  products, 
  sales, 
  clients, 
  creditNotes, 
  initialProductId,
  currentUser,
  onAddSale, 
  onUpdateSale, 
  onUpdateProduct, 
  onAddCreditNote,
  onPDVClose
}) => {
  const [isPDVOpen, setIsPDVOpen] = useState(!!initialProductId);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (initialProductId) {
      const product = products.find(p => p.id === initialProductId);
      if (product) {
        setSearchTerm(product.name);
        setIsPDVOpen(true);
      }
    }
  }, [initialProductId, products]);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.CASH);
  const [bankName, setBankName] = useState('BAO');
  const [paymentReference, setPaymentReference] = useState('');
  const [observations, setObservations] = useState('');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input when PDV opens
  useEffect(() => {
    if (isPDVOpen && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isPDVOpen]);

  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcodeSearch || p.code === barcodeSearch);
    if (product) {
      // Find first available batch (FEFO)
      const batch = [...product.batches]
        .filter(b => b.quantity > 0 && new Date(b.expiryDate) > new Date())
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
      
      if (batch) {
        addToCart(product, batch);
        setBarcodeSearch('');
      }
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    const total = sales.reduce((sum, s) => sum + s.total, 0);
    const today = new Date().toISOString().split('T')[0];
    const salesToday = sales.filter(s => s.date.startsWith(today));
    const totalToday = salesToday.reduce((sum, s) => sum + s.total, 0);
    const avgTicket = sales.length > 0 ? total / sales.length : 0;

    return { total, totalToday, salesTodayCount: salesToday.length, avgTicket };
  }, [sales]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const daySales = sales.filter(s => s.date.startsWith(date));
      return {
        date: new Date(date).toLocaleDateString('pt', { weekday: 'short' }),
        total: daySales.reduce((sum, s) => sum + s.total, 0)
      };
    });
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.invoiceNumber.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
      s.clientName.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
      s.items.some(item => 
        item.productName.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(listSearchTerm.toLowerCase())
      )
    );
  }, [sales, listSearchTerm]);

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId),
  [clients, selectedClientId]);

  const [discount, setDiscount] = useState(0);
  const [ivaRate, setIvaRate] = useState(18);
  const [receivedAmount, setReceivedAmount] = useState<number | string>('');
  const [showSupervisorUnlock, setShowSupervisorUnlock] = useState(false);
  const [unlockReason, setUnlockReason] = useState<'credit' | 'discount' | 'expiry' | null>(null);

  const isSupervisor = currentUser?.role === UserRole.SUPERVISOR || currentUser?.role === UserRole.ADMIN;

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = subtotal * (discount / 100);
  const totalAfterDiscount = subtotal - discountAmount;
  const ivaAmount = totalAfterDiscount * (ivaRate / 100);
  const cartTotal = totalAfterDiscount + ivaAmount;

  const changeAmount = typeof receivedAmount === 'number' ? receivedAmount - cartTotal : 0;

  const handleLastPurchase = () => {
    if (!selectedClientId) return;
    const lastSale = [...sales]
      .filter(s => s.clientId === selectedClientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    if (lastSale) {
      const newCart: SaleItem[] = [];
      lastSale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          // Find best batch for this product (FEFO)
          const batch = [...product.batches]
            .filter(b => b.quantity > 0 && new Date(b.expiryDate) > new Date())
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
          
          if (batch) {
            const quantity = Math.min(item.quantity, batch.quantity);
            newCart.push({
              ...item,
              batchId: batch.id,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              quantity,
              total: quantity * item.unitPrice
            });
          }
        }
      });
      setCart(newCart);
    }
  };

  const addToCart = (product: Product, batch: Batch) => {
    const existing = cart.find(i => i.productId === product.id && i.batchId === batch.id);
    if (existing) {
      if (existing.quantity >= batch.quantity) return;
      setCart(cart.map(i => i === existing ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
    } else {
      setCart([...cart, {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: 1,
        unitPrice: product.sellingPriceWholesale,
        total: product.sellingPriceWholesale
      }]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, delta: number) => {
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    const batch = product?.batches.find(b => b.id === item.batchId);
    
    if (!batch) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    if (newQty > batch.quantity) return;

    setCart(cart.map((i, idx) => idx === index ? { ...i, quantity: newQty, total: newQty * i.unitPrice } : i));
  };

  const handleFinishSale = () => {
    if (!selectedClientId || cart.length === 0) return;

    const client = clients.find(c => c.id === selectedClientId);
    
    // Bloqueios Automáticos (Sem Parar o Fluxo)
    const warnings: string[] = [];
    if (client && client.balance > client.creditLimit && !isSupervisor) {
      warnings.push(`Cliente ${client.name} ultrapassou o limite de crédito!`);
    }

    const lowStockItems = cart.filter(item => {
      const product = products.find(p => p.id === item.productId);
      const totalStock = product?.batches.reduce((sum, b) => sum + b.quantity, 0) || 0;
      return product && (totalStock - item.quantity) < product.minStockAlert;
    });

    if (lowStockItems.length > 0) {
      warnings.push(`Atenção: ${lowStockItems.length} itens ficarão com estoque baixo.`);
    }

    const nearExpiryItems = cart.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      return expiryDate < threeMonthsFromNow;
    });

    if (nearExpiryItems.length > 0) {
      warnings.push(`Atenção: ${nearExpiryItems.length} itens estão próximos do vencimento.`);
    }

    if (warnings.length > 0 && !isSupervisor && !showSupervisorUnlock) {
      setUnlockReason('credit');
      setShowSupervisorUnlock(true);
      return;
    }

    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + 30);
    
    const newSale: Sale = {
      id: `s-${Date.now()}`,
      invoiceNumber: `GF-${now.getFullYear()}-${(sales.length + 100).toString().padStart(6, '0')}`,
      date: now.toISOString(),
      dueDate: dueDate.toISOString(),
      clientId: selectedClientId,
      clientName: client?.name || 'Cliente Geral',
      clientNif: client?.nif || '',
      clientAddress: client?.address || '',
      technicalResponsible: client?.technicalResponsible || '',
      items: cart,
      subtotal,
      discount,
      taxableBase: totalAfterDiscount,
      iva: ivaRate,
      total: cartTotal,
      paymentMethod,
      bankName: paymentMethod === PaymentMethod.TRANSFER ? bankName : undefined,
      paymentReference: paymentReference || undefined,
      status: SaleStatus.PAID, // Auto-paid for now or pending if credit
      sellerId: 'u1',
      observations: observations || undefined,
      isVatExempt: ivaRate === 0
    };

    // Deduzir estoque agrupando por produto
    const productUpdates = new Map<string, Product>();
    
    cart.forEach(item => {
      const product = productUpdates.get(item.productId) || products.find(p => p.id === item.productId);
      if (product) {
        const updatedBatches = product.batches.map(b => 
          b.id === item.batchId ? { ...b, quantity: b.quantity - item.quantity } : b
        );
        productUpdates.set(item.productId, { ...product, batches: updatedBatches });
      }
    });

    productUpdates.forEach(updatedProduct => {
      onUpdateProduct(updatedProduct);
    });

    onAddSale(newSale);
    setViewingSale(newSale);
    setCart([]);
    setDiscount(0);
    setObservations('');
    setPaymentReference('');
    setIsInvoiceOpen(true);
    setIsPDVOpen(false);
    onPDVClose?.();

    // 1-Click Invoice: Auto-print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleCancelSale = () => {
    if (!viewingSale || !creditNoteReason) return;

    const newCreditNote: CreditNote = {
      id: `cn-${Date.now()}`,
      creditNoteNumber: `NC-${new Date().getFullYear()}-${(creditNotes.length + 1).toString().padStart(3, '0')}`,
      invoiceId: viewingSale.id,
      invoiceNumber: viewingSale.invoiceNumber,
      date: new Date().toISOString(),
      reason: creditNoteReason,
      amount: viewingSale.total
    };

    // Atualizar status da venda
    onUpdateSale({ ...viewingSale, status: SaleStatus.CANCELLED });

    // Devolver estoque
    const productUpdates = new Map<string, Product>();
    viewingSale.items.forEach(item => {
      const product = productUpdates.get(item.productId) || products.find(p => p.id === item.productId);
      if (product) {
        const updatedBatches = product.batches.map(b => 
          b.id === item.batchId ? { ...b, quantity: b.quantity + item.quantity } : b
        );
        productUpdates.set(item.productId, { ...product, batches: updatedBatches });
      }
    });

    productUpdates.forEach(updatedProduct => {
      onUpdateProduct(updatedProduct);
    });

    onAddCreditNote(newCreditNote);
    setIsCreditNoteModalOpen(false);
    setCreditNoteReason('');
    setIsInvoiceOpen(false);
    setViewingSale(null);
  };

  const handleValidateSale = () => {
    if (!viewingSale) return;
    const updatedSale = { ...viewingSale, status: SaleStatus.PAID };
    onUpdateSale(updatedSale);
    setViewingSale(updatedSale);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vendas a Grosso</h2>
          <p className="text-slate-500 font-medium">Gestão de faturamento e fluxo de caixa.</p>
        </div>
        <button 
          onClick={() => setIsPDVOpen(true)}
          className="flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all font-black text-sm uppercase tracking-widest"
        >
          <Plus size={20} />
          Nova Operação
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={80} />
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento Total</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(stats.total)}</p>
              <div className="flex items-center gap-1 text-emerald-600 mt-2">
                <ArrowUpRight size={14} />
                <span className="text-[10px] font-black uppercase">+12.5% vs mês anterior</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Calendar size={80} />
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendas de Hoje</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(stats.totalToday)}</p>
              <p className="text-[10px] text-blue-600 font-black uppercase mt-2">{stats.salesTodayCount} operações realizadas</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShoppingCart size={80} />
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Médio</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(stats.avgTicket)}</p>
              <div className="flex items-center gap-1 text-slate-400 mt-2">
                <span className="text-[10px] font-black uppercase">Média por faturamento</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
                <CreditCard size={28} />
              </div>
              <div className="px-4 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Caixa Aberto</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo em Caixa</p>
              <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(stats.totalToday)}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Sincronizado em tempo real
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tendência de Vendas</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Últimos 7 dias de operação</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-black text-slate-600 uppercase">Faturamento</span>
            </div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: 'none', 
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: '#10b981' }}
                cursor={{ stroke: '#10b981', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#10b981" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar por fatura ou cliente..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
              value={listSearchTerm}
              onChange={e => setListSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Nº Fatura</th>
                <th className="px-8 py-5">Data Operação</th>
                <th className="px-8 py-5">Cliente / Entidade</th>
                <th className="px-8 py-5">Valor Total</th>
                <th className="px-8 py-5">Pagamento</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(sale => (
                <tr 
                  key={sale.id} 
                  onClick={() => {
                    setViewingSale(sale);
                    setIsInvoiceOpen(true);
                  }}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-5 font-mono font-bold text-slate-700">{sale.invoiceNumber}</td>
                  <td className="px-8 py-5 text-sm text-slate-500">{new Date(sale.date).toLocaleDateString('pt')}</td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800">{sale.clientName}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">ID: {sale.clientId}</p>
                  </td>
                  <td className="px-8 py-5 font-black text-emerald-600">{formatCurrency(sale.total)}</td>
                  <td className="px-8 py-5">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{sale.paymentMethod}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      sale.status === SaleStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 
                      sale.status === SaleStatus.PENDING ? 'bg-amber-100 text-amber-600' : 
                      sale.status === SaleStatus.CANCELLED ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingSale(sale);
                        setIsInvoiceOpen(true);
                      }}
                      className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    >
                      <ReceiptText size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search size={40} className="opacity-20" />
                      <p className="font-medium">Nenhuma venda encontrada para os filtros aplicados.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDV Fullscreen Modal */}
      <AnimatePresence>
        {isPDVOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[150] bg-slate-50 flex flex-col"
          >
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center px-8 shadow-2xl">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <ShoppingCart size={20} className="text-white" />
                  </div>
                  <h1 className="text-xl font-black uppercase tracking-tight">Ponto de Venda <span className="text-emerald-400">Grosso</span></h1>
                </div>
                <div className="h-8 w-[1px] bg-slate-700"></div>
                <form onSubmit={handleBarcodeSearch} className="relative group">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    ref={barcodeInputRef}
                    type="text" 
                    placeholder="Bipar código de barras..." 
                    className="bg-slate-800 border-none rounded-xl pl-12 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64 transition-all placeholder:text-slate-600"
                    value={barcodeSearch}
                    onChange={e => setBarcodeSearch(e.target.value)}
                  />
                </form>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operador</p>
                  <p className="text-xs font-bold text-slate-300">Vendedor Principal</p>
                </div>
                <button 
                  onClick={() => {
                    setIsPDVOpen(false);
                    onPDVClose?.();
                  }} 
                  className="bg-slate-800 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
                >
                  <X size={24} />
                </button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* Esquerda: Produtos */}
              <div className="w-2/3 p-8 overflow-y-auto space-y-8 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar medicamento por nome ou DCI..." 
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all">
                      <Filter size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {products.filter(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    p.genericName.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(product => {
                    const totalInStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
                    const isLowStock = totalInStock < product.minStockAlert;
                    
                    return (
                      <motion.div 
                        layout
                        key={product.id} 
                        className={`bg-white p-6 rounded-[2rem] border transition-all hover:shadow-xl group relative overflow-hidden ${
                          isLowStock ? 'border-amber-200' : 'border-slate-100'
                        }`}
                      >
                        {isLowStock && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Estoque Baixo
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-1">
                            <h4 className="font-black text-slate-900 text-lg leading-tight group-hover:text-emerald-600 transition-colors">{product.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.genericName}</p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-tighter">{product.category}</span>
                              <span className="text-[9px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black uppercase tracking-tighter">{product.code}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Preço Unit.</p>
                            <p className="text-xl font-black text-slate-900">{formatCurrency(product.sellingPriceWholesale)}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Lotes Disponíveis (FEFO)</p>
                          {product.batches
                            .filter(b => b.quantity > 0 && new Date(b.expiryDate) > new Date())
                            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                            .map((batch, bIdx) => {
                              const isExpiringSoon = new Date(batch.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                              
                              return (
                                <button 
                                  key={batch.id} 
                                  onClick={() => addToCart(product, batch)}
                                  className={`w-full flex justify-between items-center text-xs p-4 rounded-2xl transition-all group border ${
                                    bIdx === 0 
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-600 hover:text-white hover:border-emerald-600' 
                                      : 'bg-slate-50 border-transparent text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                                  }`}
                                >
                                  <div className="text-left">
                                    <div className="flex items-center gap-2">
                                      <p className="font-black">Lote: {batch.batchNumber}</p>
                                      {bIdx === 0 && <span className="text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded-lg font-black uppercase shadow-sm">FEFO</span>}
                                      {isExpiringSoon && <span className="text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded-lg font-black uppercase shadow-sm">Validade Curta</span>}
                                    </div>
                                    <p className="text-[10px] opacity-60 font-bold mt-1">Val: {new Date(batch.expiryDate).toLocaleDateString('pt', { month: '2-digit', year: 'numeric' })}</p>
                                  </div>
                                  <div className="text-right flex flex-col items-end gap-1">
                                    <p className="font-black text-sm">{batch.quantity} un</p>
                                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-xl group-hover:bg-white/30 transition-colors">
                                      <Plus size={12} className="font-black" />
                                      <span className="text-[9px] font-black uppercase">Adicionar</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            {/* Direita: Carrinho */}
            <div className="w-1/3 bg-white border-l border-slate-200 p-8 flex flex-col shadow-2xl">
              <div className="mb-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Entidade</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                  >
                    <option value="">Selecione o Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  
                  {selectedClient && (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-2 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Limite de Crédito</span>
                        <span className="text-xs font-bold text-emerald-700">{formatCurrency(selectedClient.creditLimit)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Saldo Devedor</span>
                        <span className={`text-xs font-bold ${selectedClient.balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {formatCurrency(selectedClient.balance)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                      Desconto (%)
                      {!isSupervisor && <span className="text-red-500">Bloqueado</span>}
                    </label>
                    <input 
                      type="number" 
                      disabled={!isSupervisor}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      value={discount}
                      onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IVA (%)</label>
                    <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                      value={ivaRate}
                      onChange={e => setIvaRate(parseInt(e.target.value))}
                    >
                      <option value={18}>18% (Padrão)</option>
                      <option value={0}>Isento</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                      className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === PaymentMethod.CASH 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      💵 Dinheiro
                    </button>
                    <button
                      onClick={() => setPaymentMethod(PaymentMethod.TRANSFER)}
                      className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === PaymentMethod.TRANSFER 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      🏦 Transf.
                    </button>
                    <button
                      onClick={() => setPaymentMethod(PaymentMethod.ORANGE_MONEY)}
                      className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === PaymentMethod.ORANGE_MONEY 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      📱 Orange
                    </button>
                    <button
                      onClick={() => setPaymentMethod(PaymentMethod.MTN_MONEY)}
                      className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === PaymentMethod.MTN_MONEY 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      📱 MTN
                    </button>
                  </div>
                </div>

                {paymentMethod === PaymentMethod.CASH && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Recebido</label>
                      <button 
                        onClick={() => setReceivedAmount(cartTotal)}
                        className="text-[9px] font-black text-emerald-600 uppercase hover:underline"
                      >
                        Recebido Exato
                      </button>
                    </div>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-900 text-xl"
                      placeholder="0,00"
                      value={receivedAmount}
                      onChange={e => setReceivedAmount(parseFloat(e.target.value) || '')}
                    />
                    {typeof receivedAmount === 'number' && receivedAmount > 0 && (
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Troco</span>
                        <span className={`text-lg font-black ${changeAmount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatCurrency(changeAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(paymentMethod === PaymentMethod.ORANGE_MONEY || paymentMethod === PaymentMethod.MTN_MONEY || paymentMethod === PaymentMethod.TRANSFER) && (
                  <div className="grid grid-cols-1 gap-4 animate-fadeIn">
                    {paymentMethod === PaymentMethod.TRANSFER && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banco</label>
                        <select 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                          value={bankName}
                          onChange={e => setBankName(e.target.value)}
                        >
                          <option value="BAO">BAO</option>
                          <option value="Ecobank">Ecobank</option>
                          <option value="BDU">BDU</option>
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID da Transação / Referência</label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        placeholder="Ex: TRX-123456789"
                        value={paymentReference}
                        onChange={e => setPaymentReference(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações (Opcional)</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-800 h-20 resize-none"
                    placeholder="Ex: Venda hospitalar, entrega urgente..."
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Itens da Venda ({cart.length})</h3>
                    {selectedClientId && (
                      <button 
                        onClick={handleLastPurchase}
                        className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-all uppercase"
                      >
                        <Plus size={10} />
                        Última Compra
                      </button>
                    )}
                  </div>
                  {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-[10px] font-black text-red-500 uppercase hover:underline">Limpar</button>
                  )}
                </div>
                
                {cart.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
                    <ShoppingCart size={48} className="opacity-20" />
                    <p className="text-sm font-medium">Carrinho vazio</p>
                  </div>
                )}
                
                {cart.map((item, idx) => {
                  const product = products.find(p => p.id === item.productId);
                  const batch = product?.batches.find(b => b.id === item.batchId);
                  const margin = batch ? ((item.unitPrice - batch.purchasePrice) / item.unitPrice) * 100 : 0;
                  
                  return (
                    <div key={`${item.productId}-${item.batchId}`} className="flex flex-col bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4 hover:shadow-md transition-all relative group">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 leading-tight">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Lote: {item.batchNumber}</p>
                            <span className="text-[8px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-black">Margem: {margin.toFixed(1)}%</span>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                            <button 
                              onClick={() => updateCartQuantity(idx, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-black"
                            >-</button>
                            <span className="w-10 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(idx, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-black"
                            >+</button>
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase ml-2">Disponível: {batch?.quantity || 0} un</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold">{formatCurrency(item.unitPrice)} / un</p>
                          <p className="text-lg font-black text-slate-900">{formatCurrency(item.total)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-8 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-red-500">
                      <span>Desconto ({discount}%):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>IVA ({ivaRate}%):</span>
                    <span>{formatCurrency(ivaAmount)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-inner">
                  <div>
                    <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Total Geral a Pagar</p>
                    <p className="text-5xl font-black text-emerald-700 tracking-tighter">{formatCurrency(cartTotal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-400 uppercase">IVA Incluído (18%)</p>
                    <p className="text-xs font-bold text-emerald-600">Subtotal: {formatCurrency(subtotal)}</p>
                  </div>
                </div>
                <button 
                  onClick={handleFinishSale}
                  disabled={!selectedClientId || cart.length === 0}
                  className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-3"
                >
                  FINALIZAR OPERAÇÃO
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Invoice Receipt Modal - MODELO OFICIAL */}
      <AnimatePresence>
        {isInvoiceOpen && viewingSale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col relative"
            >
              {/* Invoice Header (Paper Style) */}
              <div className="p-16 space-y-12">
                <div className="flex justify-between items-start">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-emerald-600/20">G</div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none">GUIFARMA SA</h2>
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em] mt-1">Distribuidora Farmacêutica</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1 font-bold">
                      <p className="text-slate-900">NIF: 500123456</p>
                      <p>Zona Industrial de Bissau, Guiné-Bissau</p>
                      <p>Telefone: +245 955 000 000</p>
                      <p>Email: comercial@guifarma.gw</p>
                    </div>
                  </div>
                  <div className="text-right space-y-4">
                    <div className="bg-slate-900 text-white px-8 py-3 rounded-2xl inline-block shadow-xl">
                      <h1 className="text-xl font-black uppercase tracking-widest">FATURA COMERCIAL</h1>
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">{viewingSale.invoiceNumber}</p>
                      <div className="flex flex-col gap-1 mt-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emissão: <span className="text-slate-900 ml-2">{new Date(viewingSale.date).toLocaleDateString('pt')}</span></p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento: <span className="text-slate-900 ml-2">{new Date(viewingSale.dueDate).toLocaleDateString('pt')}</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16 border-y border-slate-100 py-10">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">DESTINATÁRIO / CLIENTE</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-black text-slate-900 leading-tight">{viewingSale.clientName}</p>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-bold text-slate-700">NIF: {viewingSale.clientNif}</p>
                        <p className="text-xs text-slate-500 font-medium">{viewingSale.clientAddress || 'Endereço não especificado'}</p>
                        <p className="text-xs text-slate-500 font-medium">Responsável Técnico: {viewingSale.technicalResponsible || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">DETALHES DO PAGAMENTO</p>
                    <div className="space-y-2">
                      <p className="text-lg font-black text-slate-900">{viewingSale.paymentMethod}</p>
                      <div className="flex flex-col gap-1">
                        {viewingSale.bankName && <p className="text-xs text-slate-500 font-bold">Banco: {viewingSale.bankName}</p>}
                        {viewingSale.paymentReference && <p className="text-xs text-slate-500 font-mono">Ref: {viewingSale.paymentReference}</p>}
                      </div>
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase mt-4 shadow-sm ${
                        viewingSale.status === SaleStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 
                        viewingSale.status === SaleStatus.CANCELLED ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          viewingSale.status === SaleStatus.PAID ? 'bg-emerald-500' : 
                          viewingSale.status === SaleStatus.CANCELLED ? 'bg-red-500' : 'bg-amber-500'
                        }`}></div>
                        {viewingSale.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">Código</th>
                        <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">Medicamento / DCI</th>
                        <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Lote</th>
                        <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Validade</th>
                        <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Qtd</th>
                        <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Unitário</th>
                        <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingSale.items.map((item, idx) => (
                        <tr key={idx} className="text-xs hover:bg-slate-50/50 transition-colors">
                          <td className="py-5 font-mono font-bold text-slate-400">{item.productCode}</td>
                          <td className="py-5">
                            <p className="font-black text-slate-900">{item.productName}</p>
                          </td>
                          <td className="py-5 text-center font-mono font-bold">{item.batchNumber}</td>
                          <td className="py-5 text-center font-bold text-slate-600">{new Date(item.expiryDate).toLocaleDateString('pt', { month: '2-digit', year: 'numeric' })}</td>
                          <td className="py-5 text-center font-black text-slate-900">{item.quantity}</td>
                          <td className="py-5 text-right font-bold">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-5 text-right font-black text-slate-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-start pt-12 border-t border-slate-100">
                  <div className="max-w-md space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center p-3 shadow-sm">
                        {/* Mock QR Code */}
                        <div className="grid grid-cols-5 gap-1 w-full h-full opacity-60">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">AUTENTICAÇÃO DIGITAL</p>
                        <p className="text-xs font-mono font-black text-slate-900 break-all leading-tight">{Math.random().toString(36).substring(2, 15).toUpperCase()}-{Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
                        <p className="text-[8px] text-slate-400 font-bold">Documento certificado e assinado digitalmente nos termos da lei.</p>
                      </div>
                    </div>
                    {viewingSale.observations && (
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative">
                        <div className="absolute -top-3 left-6 bg-white px-3 py-1 rounded-full border border-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-400">Observações</div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{viewingSale.observations}</p>
                      </div>
                    )}
                    <div className="text-[9px] text-slate-400 space-y-1 font-bold uppercase tracking-widest">
                      <p>Regime de IVA: Normal (18%)</p>
                      <p>Moeda: Franco CFA (XOF)</p>
                      <p>Software Certificado: MEDSTOCK PRO v2.5</p>
                    </div>
                  </div>
                  <div className="w-80 space-y-4">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                      <div className="flex justify-between text-sm text-slate-500 font-bold">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(viewingSale.subtotal)}</span>
                      </div>
                      {viewingSale.discount > 0 && (
                        <div className="flex justify-between text-sm text-red-500 font-bold">
                          <span>Desconto ({viewingSale.discount}%):</span>
                          <span>-{formatCurrency(viewingSale.subtotal * (viewingSale.discount / 100))}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-slate-900 font-black pt-4 border-t border-slate-200">
                        <span>Base Tributável:</span>
                        <span>{formatCurrency(viewingSale.taxableBase)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500 font-bold">
                        <span>IVA (18%):</span>
                        <span>{formatCurrency(viewingSale.total - viewingSale.taxableBase)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-6 border-t-2 border-slate-900">
                        <span className="font-black text-slate-900 text-sm uppercase tracking-widest">Total Geral</span>
                        <span className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(viewingSale.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-24 grid grid-cols-2 gap-32">
                  <div className="border-t-2 border-slate-200 pt-6 text-center space-y-16">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Responsável pela Emissão</p>
                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">ID OPERADOR: {viewingSale.sellerId}</div>
                  </div>
                  <div className="border-t-2 border-slate-200 pt-6 text-center space-y-16">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Carimbo e Assinatura</p>
                    <div className="w-32 h-32 border-4 border-slate-50 rounded-full mx-auto flex items-center justify-center opacity-10 rotate-12">
                      <span className="text-[10px] font-black uppercase text-center leading-tight">GUIFARMA SA<br/>BISSAU<br/>GUINÉ-BISSAU</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-16 space-y-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Obrigado pela sua preferência!</p>
                  <p className="text-[8px] text-slate-300 italic">Este documento não serve de quitação sem o respetivo carimbo de PAGO ou comprovativo de transferência bancária.</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-8 flex justify-between items-center px-16 print:hidden">
                <div className="flex gap-4">
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 group"
                  >
                    <Printer size={20} className="group-hover:scale-110 transition-transform" />
                    Imprimir Fatura
                  </button>
                  <button className="flex items-center gap-3 bg-slate-100 text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                    <Download size={20} />
                    PDF
                  </button>
                  <button className="flex items-center gap-3 bg-slate-100 text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                    <Share2 size={20} />
                    Enviar
                  </button>
                </div>
                <div className="flex gap-4">
                  {viewingSale.status !== SaleStatus.CANCELLED && (
                    <button 
                      onClick={() => setIsCreditNoteModalOpen(true)}
                      className="flex items-center gap-3 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 px-8 py-4 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                      Anular Operação
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setIsInvoiceOpen(false);
                      setViewingSale(null);
                    }} 
                    className="bg-slate-100 text-slate-500 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-slate-900 hover:bg-slate-200 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit Note Modal */}
      {isCreditNoteModalOpen && viewingSale && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-slideUp">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 size={24} />
              <h2 className="text-xl font-black uppercase">Emitir Nota de Crédito</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Você está prestes a anular a fatura <span className="font-bold text-slate-900">{viewingSale.invoiceNumber}</span>. 
              Esta operação é irreversível e gerará um lançamento contabilístico de estorno.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo do Cancelamento</label>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-medium text-slate-800 h-32 resize-none"
                placeholder="Ex: Erro de quantidade, devolução de mercadoria..."
                value={creditNoteReason}
                onChange={e => setCreditNoteReason(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsCreditNoteModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={handleCancelSale}
                disabled={!creditNoteReason}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
              >
                Confirmar Anulação
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Supervisor Unlock Modal */}
      <AnimatePresence>
        {showSupervisorUnlock && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8"
            >
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-100/50">
                <AlertTriangle size={40} />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Autorização Necessária</h2>
                <p className="text-slate-500 font-medium">Esta operação requer a aprovação de um supervisor para prosseguir.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo do Bloqueio</p>
                <div className="flex items-center gap-3 text-slate-700 font-bold">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  {unlockReason === 'credit' ? 'Limite de Crédito Excedido' : 
                   unlockReason === 'discount' ? 'Desconto Acima do Permitido' : 'Produtos Próximos ao Vencimento'}
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setShowSupervisorUnlock(false);
                    handleFinishSale();
                  }}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                >
                  Desbloquear como Supervisor
                </button>
                <button 
                  onClick={() => setShowSupervisorUnlock(false)}
                  className="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar Operação
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesManagement;
