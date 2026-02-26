
import React, { useState, useMemo } from 'react';
import { Search, Plus, ShoppingCart, Users, Trash2, CheckCircle2, Pill, ReceiptText, X, Filter, TrendingUp, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { Product, Sale, Client, PaymentMethod, SaleItem, Batch, SaleStatus } from '../types';
import { formatCurrency } from '../constants';

interface SalesManagementProps {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  onAddSale: (sale: Sale) => void;
  onUpdateProduct: (product: Product) => void;
}

const SalesManagement: React.FC<SalesManagementProps> = ({ products, sales, clients, onAddSale, onUpdateProduct }) => {
  const [isPDVOpen, setIsPDVOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.CASH);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // Stats calculations
  const stats = useMemo(() => {
    const total = sales.reduce((sum, s) => sum + s.total, 0);
    const today = new Date().toISOString().split('T')[0];
    const salesToday = sales.filter(s => s.date.startsWith(today));
    const totalToday = salesToday.reduce((sum, s) => sum + s.total, 0);
    const avgTicket = sales.length > 0 ? total / sales.length : 0;

    return { total, totalToday, salesTodayCount: salesToday.length, avgTicket };
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.invoiceNumber.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
      s.clientName.toLowerCase().includes(listSearchTerm.toLowerCase())
    );
  }, [sales, listSearchTerm]);

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId),
  [clients, selectedClientId]);

  const [discount, setDiscount] = useState(0);
  const [ivaRate, setIvaRate] = useState(18);

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = subtotal * (discount / 100);
  const totalAfterDiscount = subtotal - discountAmount;
  const ivaAmount = totalAfterDiscount * (ivaRate / 100);
  const cartTotal = totalAfterDiscount + ivaAmount;

  const addToCart = (product: Product, batch: Batch) => {
    const existing = cart.find(i => i.productId === product.id && i.batchId === batch.id);
    if (existing) {
      if (existing.quantity >= batch.quantity) return;
      setCart(cart.map(i => i === existing ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        batchId: batch.id,
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
    
    const newSale: Sale = {
      id: `s-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${sales.length + 100}`,
      date: new Date().toISOString(),
      clientId: selectedClientId,
      clientName: client?.name || 'Cliente Geral',
      clientNif: client?.nif || '',
      items: cart,
      subtotal,
      discount,
      iva: ivaRate,
      total: cartTotal,
      paymentMethod,
      status: SaleStatus.PAID,
      sellerId: 'u1'
    };

    // Deduzir estoque
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const updatedBatches = product.batches.map(b => 
          b.id === item.batchId ? { ...b, quantity: b.quantity - item.quantity } : b
        );
        onUpdateProduct({ ...product, batches: updatedBatches });
      }
    });

    onAddSale(newSale);
    setViewingSale(newSale);
    setCart([]);
    setDiscount(0);
    setIsInvoiceOpen(true);
    setIsPDVOpen(false);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Acumulado</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.total)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vendas Hoje</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalToday)}</p>
            <p className="text-[10px] text-blue-600 font-bold uppercase">{stats.salesTodayCount} operações</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ticket Médio</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.avgTicket)}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status do Caixa</p>
            <p className="text-2xl font-black text-white">ABERTO</p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase">Sincronizado com MySQL</p>
          </div>
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
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
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
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => {
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
      {isPDVOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-50 flex flex-col animate-fadeIn">
          <header className="bg-slate-900 text-white p-4 flex justify-between items-center px-8">
            <div className="flex items-center gap-3">
              <ShoppingCart size={24} className="text-emerald-400" />
              <h1 className="text-xl font-bold">Nova Operação de Venda</h1>
            </div>
            <button onClick={() => setIsPDVOpen(false)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700"><X size={24} /></button>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Esquerda: Produtos */}
            <div className="w-2/3 p-8 overflow-y-auto space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Pesquisar medicamento no estoque..." 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => {
                  const totalInStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
                  return (
                    <div key={product.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:border-emerald-200 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-800 leading-tight">{product.name}</h4>
                          <div className="flex gap-2">
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{product.category}</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{product.code}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estoque</p>
                          <p className={`text-sm font-black ${totalInStock < product.minStockAlert ? 'text-amber-500' : 'text-slate-900'}`}>{totalInStock} un</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {product.batches
                          .filter(b => b.quantity > 0 && new Date(b.expiryDate) > new Date())
                          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                          .map((batch, bIdx) => (
                          <button 
                            key={batch.id} 
                            onClick={() => addToCart(product, batch)}
                            className={`w-full flex justify-between items-center text-xs p-3 rounded-2xl transition-all group border ${
                              bIdx === 0 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-600 hover:text-white' 
                                : 'bg-slate-50 border-transparent text-slate-700 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <p className="font-bold">Lote: {batch.batchNumber}</p>
                                {bIdx === 0 && <span className="text-[8px] bg-emerald-600 text-white px-1 rounded font-black uppercase">FEFO</span>}
                              </div>
                              <p className="text-[10px] opacity-60 font-medium">Val: {new Date(batch.expiryDate).toLocaleDateString('pt')}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <p className="font-black">{batch.quantity} un</p>
                              <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-lg group-hover:bg-white/30">
                                <Plus size={10} className="font-black" />
                                <span className="text-[9px] font-black uppercase">Adicionar</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desconto (%)</label>
                    <input 
                      type="number" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(PaymentMethod).map(m => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${
                          paymentMethod === m 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Itens da Venda ({cart.length})</h3>
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
                
                {cart.map((item, idx) => (
                  <div key={`${item.productId}-${item.batchId}`} className="flex flex-col bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{item.productName}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">Lote: {item.batchId.split('-')[0]} • {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
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
                      <p className="text-lg font-black text-slate-900">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
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
                <div className="flex justify-between items-end">
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total a Pagar</p>
                  <p className="text-4xl font-black text-emerald-600 tracking-tighter">{formatCurrency(cartTotal)}</p>
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
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {isInvoiceOpen && viewingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none shadow-2xl flex flex-col animate-slideUp">
            {/* Invoice Header (Paper Style) */}
            <div className="p-12 space-y-12">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-xl">M</div>
                    <h2 className="text-2xl font-black tracking-tighter text-slate-900">MEDSTOCK PRO</h2>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1 font-medium">
                    <p>Avenida Combatentes da Liberdade da Pátria</p>
                    <p>Bissau, Guiné-Bissau</p>
                    <p>Tel: +245 955 000 000</p>
                    <p>NIF: 500123456</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h1 className="text-4xl font-black text-slate-200 uppercase tracking-widest">FATURA</h1>
                  <p className="font-mono font-bold text-slate-900">{viewingSale.invoiceNumber}</p>
                  <p className="text-xs text-slate-500">{new Date(viewingSale.date).toLocaleDateString('pt', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 border-t border-slate-100 pt-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturado a:</p>
                  <p className="text-lg font-bold text-slate-900">{viewingSale.clientName}</p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>NIF: {viewingSale.clientNif}</p>
                    <p>Guiné-Bissau</p>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método de Pagamento:</p>
                  <p className="text-sm font-bold text-slate-900">{viewingSale.paymentMethod}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Vendedor:</p>
                  <p className="text-sm font-medium text-slate-600">ID: {viewingSale.sellerId}</p>
                </div>
              </div>

              <div className="space-y-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900">
                      <th className="py-3 text-[10px] font-black text-slate-900 uppercase">Descrição</th>
                      <th className="py-3 text-[10px] font-black text-slate-900 uppercase text-center">Qtd</th>
                      <th className="py-3 text-[10px] font-black text-slate-900 uppercase text-right">Preço Unit.</th>
                      <th className="py-3 text-[10px] font-black text-slate-900 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingSale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-4">
                          <p className="font-bold text-slate-800">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Lote: {item.batchId}</p>
                        </td>
                        <td className="py-4 text-center font-medium">{item.quantity}</td>
                        <td className="py-4 text-right font-medium">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-8">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(viewingSale.subtotal)}</span>
                  </div>
                  {viewingSale.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Desconto ({viewingSale.discount}%):</span>
                      <span>-{formatCurrency(viewingSale.subtotal * (viewingSale.discount / 100))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>IVA ({viewingSale.iva}%):</span>
                    <span>{formatCurrency((viewingSale.subtotal - (viewingSale.subtotal * (viewingSale.discount / 100))) * (viewingSale.iva / 100))}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
                    <span className="font-black text-slate-900">TOTAL:</span>
                    <span className="text-xl font-black text-emerald-600">{formatCurrency(viewingSale.total)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-20 grid grid-cols-2 gap-20">
                <div className="border-t border-slate-300 pt-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Assinatura do Cliente</p>
                </div>
                <div className="border-t border-slate-300 pt-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pelo MedStock Pro</p>
                </div>
              </div>

              <div className="text-center pt-12">
                <p className="text-[10px] text-slate-400 italic">Obrigado pela sua preferência. Esta fatura serve como comprovativo de venda a grosso.</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center px-12">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors"
              >
                <ReceiptText size={20} />
                Imprimir Fatura (PDF)
              </button>
              <button 
                onClick={() => {
                  setIsInvoiceOpen(false);
                  setViewingSale(null);
                }} 
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManagement;
