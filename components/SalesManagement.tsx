
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Users, Trash2, CheckCircle2, Pill, ReceiptText, X, Filter, TrendingUp, Calendar, CreditCard, ArrowRight, Barcode, AlertTriangle, Printer, Download, Share2, ArrowUpRight, ArrowDownRight, LayoutGrid, List } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  React.useEffect(() => {
    if (initialProductId) {
      const product = products.find(p => p.id === initialProductId);
      if (product) {
        setSearchTerm(product.name);
        setIsPDVOpen(true);
        
        // Find first available batch (FEFO) and add to cart
        const firstBatch = [...product.batches]
          .filter(b => b.quantity > 0 && new Date(b.expiryDate) > new Date())
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
        
        if (firstBatch) {
          addToCart(product, firstBatch, 1);
        }
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
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<{ show: boolean; message: string } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorToast?.show) {
      const timer = setTimeout(() => setErrorToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

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

  const subtotal = Math.round(cart.reduce((sum, item) => sum + item.total, 0));
  const discountAmount = Math.round(subtotal * (discount / 100));
  const totalAfterDiscount = subtotal - discountAmount;
  const ivaAmount = Math.round(totalAfterDiscount * (ivaRate / 100));
  const cartTotal = totalAfterDiscount + ivaAmount;

  const changeAmount = typeof receivedAmount === 'number' ? receivedAmount - cartTotal : 0;

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !viewingSale) return;

    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Fatura_${viewingSale.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setErrorToast({ show: true, message: 'Erro ao gerar o PDF da fatura' });
    }
  };

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
              total: Math.round(quantity * item.unitPrice)
            });
          }
        }
      });
      setCart(newCart);
    }
  };

  const addToCart = (product: Product, batch: Batch, quantity: number = 1) => {
    const existing = cart.find(i => i.productId === product.id && i.batchId === batch.id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > batch.quantity) {
        setErrorToast({ show: true, message: `Quantidade excede o estoque disponível (${batch.quantity} un)` });
        return;
      }
      setCart(cart.map(i => i === existing ? { ...i, quantity: newQty, total: Math.round(newQty * i.unitPrice) } : i));
    } else {
      if (quantity > batch.quantity) {
        setErrorToast({ show: true, message: `Quantidade excede o estoque disponível (${batch.quantity} un)` });
        return;
      }
      setCart([...cart, {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: quantity,
        unitPrice: product.sellingPriceWholesale,
        total: Math.round(product.sellingPriceWholesale * quantity)
      }]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, delta: number | string) => {
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    const batch = product?.batches.find(b => b.id === item.batchId);
    
    if (!batch) return;

    let newQty: number;
    if (typeof delta === 'string') {
      newQty = parseInt(delta) || 0;
    } else {
      newQty = item.quantity + delta;
    }

    if (newQty <= 0) {
      if (typeof delta !== 'string') {
        removeFromCart(index);
      }
      return;
    }

    if (newQty > batch.quantity) {
      newQty = batch.quantity;
      setErrorToast({ show: true, message: `Quantidade máxima atingida para este lote (${batch.quantity} un)` });
    }

    setCart(cart.map((i, idx) => idx === index ? { ...i, quantity: newQty, total: Math.round(newQty * i.unitPrice) } : i));
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
    if (currentUser?.role !== UserRole.ADMIN) {
      setErrorToast({ show: true, message: 'Apenas administradores podem anular vendas.' });
      return;
    }
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
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vendas a Grosso</h2>
            <p className="text-slate-500 font-medium">Gestão de faturamento e fluxo de caixa.</p>
          </div>
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
          <div 
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
          </div>

          <div 
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
          </div>

          <div 
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
          </div>
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
              <div className="text-[10px] text-slate-400 font-bold uppercase mt-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Sincronizado em tempo real
              </div>
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
        <div className="h-64 w-full min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
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

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
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
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingSale(sale);
                          setIsInvoiceOpen(true);
                          setTimeout(() => window.print(), 500);
                        }}
                        className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Imprimir Fatura"
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingSale(sale);
                          setIsInvoiceOpen(true);
                        }}
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Ver Detalhes"
                      >
                        <ReceiptText size={18} />
                      </button>
                    </div>
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
      {isPDVOpen && (
        <div 
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
                {cart.length > 0 && selectedClientId && (
                  <button 
                    onClick={handleFinishSale}
                    className="hidden md:flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
                  >
                    <Printer size={16} />
                    Vender
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (cart.length > 0) {
                      setIsConfirmCloseModalOpen(true);
                    } else {
                      setIsPDVOpen(false);
                      onPDVClose?.();
                    }
                  }} 
                  className="bg-slate-800 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
                  title="Fechar PDV"
                >
                  <X size={24} />
                </button>
              </div>
            </header>

            {/* Modal de Confirmação de Fechamento */}
            {isConfirmCloseModalOpen && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center space-y-6 animate-slideUp">
                  <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Carrinho com Itens</h3>
                    <p className="text-slate-500 mt-2">Você tem {cart.length} itens no carrinho que ainda não foram faturados. Se fechar agora, os dados da venda atual serão perdidos.</p>
                  </div>
                  <div className="flex flex-col gap-3 pt-4">
                    <button 
                      onClick={() => setIsConfirmCloseModalOpen(false)}
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                    >
                      Continuar Venda
                    </button>
                    <button 
                      onClick={() => {
                        setIsConfirmCloseModalOpen(false);
                        setIsPDVOpen(false);
                        setCart([]);
                        onPDVClose?.();
                      }}
                      className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      Descartar e Sair
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Esquerda: Produtos */}
              <div className="w-full lg:w-2/3 p-4 md:p-8 overflow-y-auto space-y-8 bg-slate-50/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="relative flex-1 w-full max-w-2xl">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    <input 
                      type="text" 
                      placeholder="O que você está procurando hoje? (Nome, DCI ou Código)" 
                      className="w-full pl-16 pr-6 py-6 bg-white border-none rounded-[2.5rem] shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg font-medium placeholder:text-slate-300"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-white p-2 rounded-[2rem] shadow-lg shadow-slate-200/50 flex gap-1">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-4 rounded-3xl transition-all ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                        <LayoutGrid size={20} />
                      </button>
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`p-4 rounded-3xl transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                        <List size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                  {products.filter(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.code.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(product => {
                    const totalInStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
                    const isLowStock = totalInStock < product.minStockAlert;
                    
                    if (viewMode === 'list') {
                      return (
                        <div 
                          key={product.id} 
                          className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-6 transition-all hover:shadow-md ${
                            isLowStock ? 'border-red-100 bg-red-50/10' : 'border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                              <Pill className="text-emerald-600" size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-slate-900 truncate uppercase">{product.name}</h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded">{product.code}</span>
                              </div>
                              <p className="text-xs text-slate-500 truncate">{product.genericName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-8">
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estoque</p>
                              <p className={`text-sm font-black ${isLowStock ? 'text-red-500' : 'text-slate-700'}`}>{totalInStock} un</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço</p>
                              <p className="text-sm font-black text-slate-900">{formatCurrency(product.sellingPriceWholesale)}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                min="1"
                                className="w-12 h-10 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={productQuantities[product.id] || 1}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setProductQuantities(prev => ({ ...prev, [product.id]: val }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button 
                                onClick={() => {
                                  const qty = productQuantities[product.id] || 1;
                                  const firstBatch = product.batches
                                    .filter(b => b.quantity > 0 && new Date(b.expiryDate) > new Date())
                                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
                                  if (firstBatch) {
                                    addToCart(product, firstBatch, qty);
                                    setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
                                  } else {
                                    setErrorToast({ show: true, message: 'Produto sem estoque disponível ou vencido' });
                                  }
                                }}
                                className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                              >
                                <Plus size={20} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={product.id} 
                        className={`bg-white rounded-3xl border transition-all hover:shadow-xl group relative p-6 flex flex-col gap-4 ${
                          isLowStock ? 'border-red-100 shadow-red-50' : 'border-slate-100'
                        }`}
                      >
                        {/* Top: Category and Code */}
                        <div className="flex justify-between items-center">
                          <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {product.category}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 tracking-tight">
                            {product.code}
                          </span>
                        </div>

                        {/* Middle: Name and Generic Name */}
                        <div className="space-y-1">
                          <h4 className="font-black text-emerald-900 text-xl leading-tight tracking-tight uppercase group-hover:text-emerald-600 transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-sm font-medium text-slate-500 line-clamp-1">
                            {product.genericName}
                          </p>
                        </div>

                        {/* Price Section with Add Button */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Preço Unitário</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">
                              {formatCurrency(product.sellingPriceWholesale)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qtd</span>
                              <input 
                                type="number" 
                                min="1"
                                className="w-14 h-10 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={productQuantities[product.id] || 1}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setProductQuantities(prev => ({ ...prev, [product.id]: val }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === '+' || e.key === 'Add') {
                                    e.preventDefault();
                                    const qty = productQuantities[product.id] || 1;
                                    const firstBatch = product.batches
                                      .filter(b => b.quantity > 0 && new Date(b.expiryDate) > new Date())
                                      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
                                    if (firstBatch) {
                                      addToCart(product, firstBatch, qty);
                                      setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
                                    } else {
                                      setErrorToast({ show: true, message: 'Produto sem estoque disponível ou vencido' });
                                    }
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            
                            {/* Circular Add Button - Adds the first available batch (FEFO) */}
                            <button 
                              onClick={() => {
                                const qty = productQuantities[product.id] || 1;
                                const firstBatch = product.batches
                                  .filter(b => b.quantity > 0 && new Date(b.expiryDate) > new Date())
                                  .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
                                if (firstBatch) {
                                  addToCart(product, firstBatch, qty);
                                  // Reset quantity after adding
                                  setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
                                } else {
                                  setErrorToast({ show: true, message: 'Produto sem estoque disponível ou vencido' });
                                }
                              }}
                              className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-110 transition-all"
                              title="Adicionar Lote FEFO"
                            >
                              <Plus size={28} strokeWidth={3} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom: Stock and Expiry */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estoque:</span>
                            <span className={`text-[11px] font-black ${isLowStock ? 'text-red-500' : 'text-slate-700'}`}>
                              {totalInStock} un
                            </span>
                          </div>
                          
                          {product.batches.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Val:</span>
                              <span className="text-[11px] font-black text-slate-700">
                                {new Date(Math.min(...product.batches.map(b => new Date(b.expiryDate).getTime()))).toLocaleDateString('pt', { month: '2-digit', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            {/* Direita: Carrinho e Checkout */}
            <div className="w-full lg:w-1/3 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-2xl h-full overflow-hidden">
              {/* Área de Configuração e Itens (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
                <div className="space-y-6">
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

                <div className="space-y-4">
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
                    <div className="flex items-center gap-3">
                      {cart.length > 0 && (
                        <button 
                          onClick={handleFinishSale}
                          disabled={!selectedClientId}
                          className="text-[10px] font-black text-emerald-600 uppercase hover:underline disabled:opacity-30"
                        >
                          Vender Agora
                        </button>
                      )}
                      {cart.length > 0 && (
                        <button onClick={() => setCart([])} className="text-[10px] font-black text-red-500 uppercase hover:underline">Limpar</button>
                      )}
                    </div>
                  </div>
                  
                  {cart.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-4">
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
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                              <button 
                                onClick={() => updateCartQuantity(idx, -1)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-black transition-colors"
                              >-</button>
                              <input 
                                type="number"
                                className="w-12 text-center text-sm font-black text-slate-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={item.quantity}
                                onChange={(e) => updateCartQuantity(idx, e.target.value)}
                              />
                              <button 
                                onClick={() => updateCartQuantity(idx, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-black transition-colors"
                              >+</button>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase">Stock:</p>
                              <p className={`text-[9px] font-black uppercase ${batch && batch.quantity < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {batch?.quantity || 0} un
                              </p>
                            </div>
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
              </div>

              {/* Área de Totais e Ações (Sticky Bottom) */}
              <div className="p-4 md:p-8 border-t border-slate-100 bg-slate-50/50 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
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
                    <p className="text-4xl font-black text-emerald-700 tracking-tighter">
                      {formatCurrency(cartTotal)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-400 uppercase">IVA Incluído ({ivaRate}%)</p>
                    <p className="text-xs font-bold text-emerald-600">Subtotal: {formatCurrency(subtotal)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={handleFinishSale}
                    disabled={!selectedClientId || cart.length === 0}
                    className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-3"
                  >
                    VENDER E IMPRIMIR FATURA
                    <Printer size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal - MODELO OFICIAL */}
      {isInvoiceOpen && viewingSale && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-md"
        >
          <div 
            className="bg-white w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col relative"
          >
            {/* Invoice Content (Matches Image) */}
            <div className="p-12 bg-white text-black font-sans print:p-0">
              <div ref={invoiceRef} className="max-w-[800px] mx-auto border border-gray-200 p-8 print:border-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 border-4 border-black rounded-full flex items-center justify-center">
                      <div className="text-6xl font-bold">+</div>
                    </div>
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter leading-none">GUIFARMA</h2>
                      <p className="text-sm font-bold mt-1">Comércio de Produtos Farmacêuticos</p>
                    </div>
                  </div>
                  <div className="text-right text-[13px] space-y-1 font-medium">
                    <p>Rua Eduardo Mondelane Edifício Mavegro</p>
                    <p>Bissau</p>
                    <p>Contribuinte: 510019285</p>
                    <p>Whatsapp: 002455142629</p>
                    <p>Tel: 955142629 / 965025657</p>
                    <p>Email: guifarma.distribuicao@gmail.com</p>
                  </div>
                </div>

                {/* Invoice Number */}
                <div className="text-center mb-8">
                  <p className="text-sm font-bold uppercase tracking-widest">SÉRIE A FATURA Nº{viewingSale.invoiceNumber}</p>
                  <div className="w-48 h-0.5 bg-black mx-auto mt-1"></div>
                </div>

                {/* Info Table */}
                <div className="grid grid-cols-2 mb-6">
                  <table className="w-full border-collapse border border-black">
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 font-bold text-xs w-1/3">Data:</td>
                        <td className="border border-black p-2 text-xs">{new Date(viewingSale.date).toLocaleDateString('pt')}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 font-bold text-xs">Cliente:</td>
                        <td className="border border-black p-2 text-xs uppercase font-bold">{viewingSale.clientName}</td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="w-full border-collapse border-y border-r border-black">
                    <tbody>
                      <tr>
                        <td className="border-r border-black p-2 font-bold text-xs w-1/2">Método de Pgmto</td>
                        <td className="p-2 text-xs font-bold uppercase">{viewingSale.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black p-2 text-xs" colSpan={2}>&nbsp;</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-black mb-8">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-black p-2 text-[10px] font-bold uppercase">QTD</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase">REF</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase text-left">PRODUTO</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase">LOTE</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase">VLD</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase text-right">PREÇO</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase text-right">TOTAL</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase">NOTAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingSale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-2 text-center text-[11px] font-bold">{item.quantity}</td>
                        <td className="border border-black p-2 text-center text-[10px] font-mono">{item.productCode}</td>
                        <td className="border border-black p-2 text-[11px] font-bold uppercase">{item.productName}</td>
                        <td className="border border-black p-2 text-center text-[10px] font-mono">{item.batchNumber}</td>
                        <td className="border border-black p-2 text-center text-[10px] font-bold">{new Date(item.expiryDate).toLocaleDateString('pt', { month: '2-digit', year: 'numeric' })}</td>
                        <td className="border border-black p-2 text-right text-[11px] font-bold">{formatCurrency(item.unitPrice).replace('FCFA', '').trim()} XOF</td>
                        <td className="border border-black p-2 text-right text-[11px] font-bold">{formatCurrency(item.total).replace('FCFA', '').trim()} XOF</td>
                        <td className="border border-black p-2 text-[10px] text-center italic text-gray-400">n.a</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="border border-black p-2 font-bold text-sm text-center bg-gray-50" colSpan={6}>TOTAL</td>
                      <td className="border border-black p-2 font-bold text-sm text-right bg-gray-50">{formatCurrency(viewingSale.total).replace('FCFA', '').trim()} CFA</td>
                      <td className="border border-black p-2 bg-gray-50"></td>
                    </tr>
                  </tbody>
                </table>

                {/* Payment Type and Footer */}
                <div className="flex justify-between items-start gap-12">
                  <div className="w-1/2">
                    <table className="w-full border-collapse border border-black">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-black p-2 text-[10px] font-bold text-left uppercase">TIPO DE PAGAMENTO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['CAIXA', 'CHEQUE', 'TRANSFERENCIA', 'ORANGE MONEY'].map(type => (
                          <tr key={type}>
                            <td className="border border-black p-2 text-[11px] font-bold flex justify-between items-center">
                              <span>{type}</span>
                              <div className="w-5 h-5 border-2 border-black flex items-center justify-center">
                                {(viewingSale.paymentMethod.toUpperCase() === type || 
                                  (type === 'TRANSFERENCIA' && viewingSale.paymentMethod.toUpperCase() === 'BANK_TRANSFER')) && (
                                  <div className="w-3 h-3 bg-black"></div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="w-1/2 flex flex-col items-end justify-end pt-24">
                    <div className="text-center w-full">
                      <div className="relative inline-block">
                        <div className="border-t-2 border-black px-12 pt-2">
                          <p className="text-xs font-bold uppercase tracking-widest">Carimbo e Assinatura</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code and Authorization URL */}
                <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-start gap-4">
                  <div className="bg-white p-1 border border-gray-200 rounded-lg">
                    <QRCodeSVG 
                      value="https://kontaktu.mef.gw:443/invoice_issuance_authorization/00000049202529" 
                      size={80}
                      level="H"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-gray-500 break-all">
                    https://kontaktu.mef.gw:443/invoice_issuance_authorization/00000049202529
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar (Hidden on Print) */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-8 flex justify-between items-center px-16 print:hidden">
              <div className="flex gap-4">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 group"
                >
                  <Printer size={20} className="group-hover:scale-110 transition-transform" />
                  Imprimir Fatura
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-3 bg-slate-100 text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
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
            </div>
          </div>
        )}

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
                disabled={!creditNoteReason || currentUser?.role !== UserRole.ADMIN}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Anulação
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Supervisor Unlock Modal */}
      {showSupervisorUnlock && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8">
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
          </div>
        </div>
      )}
      {/* Confirmation Modal for Closing PDV with items in cart */}
      {isConfirmCloseModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-slideUp border border-slate-100">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-red-100">
                <AlertTriangle size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Carrinho com Itens</h2>
              <p className="text-slate-500 font-medium text-balance">Existem itens no carrinho que ainda não foram finalizados. Se fechar agora, os dados da venda atual serão perdidos.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total no Carrinho</span>
                <span className="text-lg font-black text-slate-900">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade de Itens</span>
                <span className="text-sm font-bold text-slate-700">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsConfirmCloseModalOpen(false)}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 uppercase text-xs tracking-widest"
              >
                Continuar Venda
              </button>
              <button 
                onClick={() => {
                  setIsConfirmCloseModalOpen(false);
                  setCart([]);
                  setIsPDVOpen(false);
                  onPDVClose?.();
                }}
                className="w-full py-5 bg-slate-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 hover:text-red-700 transition-all uppercase text-xs tracking-widest"
              >
                Abandonar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast?.show && (
        <div className="fixed bottom-8 right-8 z-[300] animate-slideUp">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-red-400">
            <AlertTriangle size={24} />
            <div>
              <p className="font-black text-sm uppercase tracking-tighter">ERRO</p>
              <p className="text-red-50 text-xs">{errorToast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManagement;
