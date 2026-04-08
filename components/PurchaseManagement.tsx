
import React, { useState, useRef } from 'react';
import { Search, Plus, ShoppingCart, Trash2, CheckCircle2, ReceiptText, X, Package, Calendar, Download, Printer, Edit } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Product, Purchase, PurchaseItem, Batch, PharmaceuticalForm, User, UserRole } from '../types';
import { formatCurrency } from '../constants';
import { QRCodeSVG } from 'qrcode.react';

interface PurchaseManagementProps {
  products: Product[];
  purchases: Purchase[];
  currentUser: User | null;
  onAddPurchase: (purchase: Purchase) => void;
  onUpdatePurchase: (purchase: Purchase) => void;
  onDeletePurchase: (purchaseId: string) => void;
  onClearHistory: () => void;
  onUpdateProduct: (product: Product) => void;
}

const PurchaseManagement: React.FC<PurchaseManagementProps> = ({ products, purchases, currentUser, onAddPurchase, onUpdatePurchase, onDeletePurchase, onClearHistory, onUpdateProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const cartTotal = Math.round(cart.reduce((sum, item) => sum + item.total, 0));

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !viewingPurchase) return;

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
      pdf.save(`Entrada_${viewingPurchase.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const addToCart = (product: Product) => {
    const newItem: PurchaseItem = {
      productId: product.id,
      productName: product.name,
      batchNumber: `INT-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random() * 1000)}`,
      manufacturerBatchNumber: '',
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      quantity: 1,
      purchasePrice: 0,
      location: 'Armazém Geral',
      isColdChain: product.pharmaceuticalForm === PharmaceuticalForm.INJECTABLE,
      total: 0
    };
    setCart([...cart, newItem]);
  };

  const updateCartItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newCart = [...cart];
    const item = { ...newCart[index], [field]: value };
    
    if (field === 'quantity' || field === 'purchasePrice') {
      item.total = Math.round((item.quantity || 0) * (item.purchasePrice || 0));
    }
    
    newCart[index] = item;
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleFinishPurchase = () => {
    if (!supplier || !invoiceNumber || cart.length === 0) return;

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      invoiceNumber,
      date,
      supplier,
      items: cart,
      total: cartTotal
    };

    // Atualizar estoque (adicionar novos lotes)
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const newBatch: Batch = {
          id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          batchNumber: item.batchNumber,
          manufacturerBatchNumber: item.manufacturerBatchNumber,
          manufacturingDate: item.manufacturingDate,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          location: item.location,
          isColdChain: item.isColdChain
        };
        onUpdateProduct({ 
          ...product, 
          batches: [...product.batches, newBatch]
        });
      }
    });

    onAddPurchase(newPurchase);
    setViewingPurchase(newPurchase);
    setIsInvoiceViewOpen(true);
    setIsModalOpen(false);
    setCart([]);
    setInvoiceNumber('');
    setSupplier('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Entrada de Mercadoria</h2>
          <p className="text-slate-500">Registe faturas de compra e entrada de novos lotes.</p>
        </div>
        <div className="flex gap-4">
          {currentUser?.role === UserRole.ADMIN && (
            <button 
              onClick={() => setIsClearConfirmOpen(true)}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl border border-red-100 hover:bg-red-100 transition-all font-bold text-sm"
            >
              <Trash2 size={20} />
              Limpar Histórico
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all font-bold"
          >
            <Plus size={20} />
            Nova Fatura de Compra
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Fatura</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Fornecedor</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Itens</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhuma fatura de compra registada.</td>
              </tr>
            )}
            {purchases.map(purchase => (
              <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-700">{purchase.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{new Date(purchase.date).toLocaleDateString('pt')}</td>
                <td className="px-6 py-4 font-medium text-slate-800">{purchase.supplier}</td>
                <td className="px-6 py-4 font-bold text-blue-600">{formatCurrency(purchase.total)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{purchase.items.length} produtos</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setViewingPurchase(purchase);
                        setIsInvoiceViewOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Visualizar Fatura"
                    >
                      <ReceiptText size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingPurchase(purchase);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Editar Fatura"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setPurchaseToDelete(purchase);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar Fatura"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-50 flex flex-col animate-fadeIn">
          <header className="bg-slate-900 text-white p-4 flex justify-between items-center px-8">
            <div className="flex items-center gap-3">
              <Package size={24} className="text-blue-400" />
              <h1 className="text-xl font-bold">Registo de Fatura de Compra</h1>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700"><X size={24} /></button>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Esquerda: Seleção de Produtos */}
            <div className="w-1/3 p-8 overflow-y-auto border-r border-slate-200 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Pesquisar produto..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                  <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full text-left p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.code} • {product.category}</p>
                      </div>
                      <Plus size={18} className="text-slate-300 group-hover:text-blue-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Direita: Dados da Fatura e Itens */}
            <div className="flex-1 bg-white p-8 flex flex-col overflow-hidden">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº da Fatura Fornecedor</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: FAT-2024-001"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nome do Fornecedor"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data da Fatura</label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white border-b-2 border-slate-100">
                    <tr>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase">Produto</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase">Lote Fab.</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase">Validade</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase w-20">Qtd</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase w-28">Preço Custo</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase">Localização</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase text-right">Total</th>
                      <th className="py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 italic">Adicione produtos da lista à esquerda.</td>
                      </tr>
                    )}
                    {cart.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-4 pr-4">
                          <p className="text-sm font-bold text-slate-800">{item.productName}</p>
                          <p className="text-[9px] text-slate-400 font-mono uppercase">ID: {item.batchNumber}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <input 
                            type="text" 
                            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Lote Fab."
                            value={item.manufacturerBatchNumber}
                            onChange={e => updateCartItem(idx, 'manufacturerBatchNumber', e.target.value)}
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <input 
                            type="date" 
                            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                            value={item.expiryDate}
                            onChange={e => updateCartItem(idx, 'expiryDate', e.target.value)}
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => updateCartItem(idx, 'quantity', Math.max(0, item.quantity - 1))}
                              className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                            >-</button>
                            <input 
                              type="number" 
                              className="w-16 p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-center font-bold"
                              value={item.quantity}
                              onChange={e => updateCartItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === '+' || e.key === 'Add') {
                                  e.preventDefault();
                                  handleFinishPurchase();
                                }
                              }}
                            />
                            <button 
                              onClick={() => updateCartItem(idx, 'quantity', item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                            >+</button>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <input 
                            type="number" 
                            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                            value={item.purchasePrice}
                            onChange={e => updateCartItem(idx, 'purchasePrice', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <input 
                            type="text" 
                            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Local"
                            value={item.location}
                            onChange={e => updateCartItem(idx, 'location', e.target.value)}
                          />
                        </td>
                        <td className="py-4 text-right font-bold text-slate-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="py-4 text-right">
                          <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total da Fatura</p>
                  <p className="text-3xl font-black text-blue-600">{formatCurrency(cartTotal)}</p>
                </div>
                <button 
                  onClick={handleFinishPurchase}
                  disabled={!supplier || !invoiceNumber || cart.length === 0}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  FINALIZAR ENTRADA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice View Modal */}
      {isInvoiceViewOpen && viewingPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col relative invoice-modal-content">
            {/* Invoice Content (Matches Sales Invoice) */}
            <div className="p-12 bg-white text-black font-sans print:p-4">
              <div ref={invoiceRef} className="max-w-[800px] mx-auto border-2 border-black p-8 invoice-print">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 border-[6px] border-black rounded-full flex items-center justify-center mb-2 relative">
                      <div className="w-14 h-5 bg-black absolute"></div>
                      <div className="w-5 h-14 bg-black absolute"></div>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight leading-none">GUIFARMA</h1>
                    <p className="text-[11px] font-bold mt-1">Comércio de Produtos Farmacêuticos</p>
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
                
                <div className="flex justify-center mb-8">
                  <div className="text-center">
                    <h2 className="text-xl font-bold uppercase tracking-wider border-b-2 border-black inline-block pb-1">
                      ENTRADA DE MERCADORIA N°{viewingPurchase.invoiceNumber}
                    </h2>
                  </div>
                </div>

                {/* Info Table */}
                <div className="mb-6">
                  <table className="w-full border-collapse border border-black">
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 font-bold text-xs w-[15%]">Data:</td>
                        <td className="border border-black p-2 text-xs w-[35%]">{new Date(viewingPurchase.date).toLocaleDateString('pt')}</td>
                        <td className="border border-black p-2 font-bold text-xs w-[25%] align-middle" rowSpan={2}>Documento:</td>
                        <td className="border border-black p-2 font-bold text-xs uppercase w-[25%] align-middle" rowSpan={2}>
                          FATURA DE COMPRA
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 font-bold text-xs">Fornecedor:</td>
                        <td className="border border-black p-2 text-xs uppercase font-bold">{viewingPurchase.supplier}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-black mb-8">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-black p-2 text-[10px] font-bold uppercase w-[8%]">QTD</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase text-left w-[40%]">PRODUTO</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase w-[15%]">LOTE</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase w-[12%]">VLD</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase text-right w-[12%]">PREÇO</th>
                      <th className="border border-black p-2 text-[10px] font-bold uppercase text-right w-[13%]">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingPurchase.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-2 text-center text-[11px] font-bold">{item.quantity}</td>
                        <td className="border border-black p-2 text-[11px] font-bold uppercase">{item.productName}</td>
                        <td className="border border-black p-2 text-center text-[10px] font-mono">{item.batchNumber}</td>
                        <td className="border border-black p-2 text-center text-[10px] font-bold">{new Date(item.expiryDate).toLocaleDateString('pt', { month: '2-digit', year: 'numeric' })}</td>
                        <td className="border border-black p-2 text-right text-[11px] font-bold whitespace-nowrap">
                          {formatCurrency(item.purchasePrice)}
                        </td>
                        <td className="border border-black p-2 text-right text-[11px] font-bold whitespace-nowrap">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="border border-black p-2 font-bold text-sm text-center bg-gray-50" colSpan={5}>TOTAL COMPRA</td>
                      <td className="border border-black p-2 font-bold text-sm text-right bg-gray-50 whitespace-nowrap">
                        {formatCurrency(viewingPurchase.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer Signature */}
                <div className="flex justify-end pt-24">
                  <div className="text-center w-1/2">
                    <div className="relative inline-block">
                      <div className="border-t-2 border-black px-12 pt-2">
                        <p className="text-xs font-bold uppercase tracking-widest">Carimbo e Assinatura</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code and Authorization URL */}
                <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-start gap-4">
                  <div className="bg-white p-1 border border-gray-200 rounded-lg">
                    <QRCodeSVG 
                      value={`https://guifarma.app/purchase/${viewingPurchase.invoiceNumber}`} 
                      size={80}
                      level="H"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-gray-500 break-all">
                    https://guifarma.app/purchase/{viewingPurchase.invoiceNumber}
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
              </div>
              <button 
                onClick={() => {
                  setIsInvoiceViewOpen(false);
                  setViewingPurchase(null);
                }} 
                className="bg-slate-100 text-slate-500 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-slate-900 hover:bg-slate-200 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Purchase Modal */}
      {isEditModalOpen && editingPurchase && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Editar Compra {editingPurchase.invoiceNumber}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Fatura</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  value={editingPurchase.invoiceNumber}
                  onChange={e => setEditingPurchase({ ...editingPurchase, invoiceNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  value={editingPurchase.supplier}
                  onChange={e => setEditingPurchase({ ...editingPurchase, supplier: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
                <input 
                  type="date" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  value={editingPurchase.date.split('T')[0]}
                  onChange={e => setEditingPurchase({ ...editingPurchase, date: new Date(e.target.value).toISOString() })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onUpdatePurchase(editingPurchase);
                  setIsEditModalOpen(false);
                }}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Purchase Confirmation Modal */}
      {isDeleteConfirmOpen && purchaseToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Eliminar Compra</h3>
              <p className="text-slate-500 mt-2">Tem certeza que deseja eliminar a compra <strong>{purchaseToDelete.invoiceNumber}</strong>? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => {
                  onDeletePurchase(purchaseToDelete.id);
                  setIsDeleteConfirmOpen(false);
                }}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
              >
                Eliminar Definitivamente
              </button>
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Limpar Histórico</h3>
              <p className="text-slate-500 mt-2">Tem certeza que deseja eliminar <strong>todas</strong> as faturas de entrada de mercadoria? Esta ação é irreversível.</p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => {
                  onClearHistory();
                  setIsClearConfirmOpen(false);
                }}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
              >
                Sim, Limpar Tudo
              </button>
              <button 
                onClick={() => setIsClearConfirmOpen(false)}
                className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseManagement;
