
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, ChevronRight, Package, Calendar, ShoppingCart, X, CheckCircle2, ThermometerSnowflake, MapPin, Save, Trash2, Image as ImageIcon, Calculator, History, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { Product, Batch, MedicineCategory, PharmaceuticalForm, Sale, Purchase } from '../types';
import { formatCurrency } from '../constants';

interface StockManagementProps {
  products: Product[];
  sales?: Sale[];
  purchases?: Purchase[];
  onUpdateProduct?: (updatedProduct: Product) => void;
  onAddProduct?: (newProduct: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onStartSale?: (productId: string) => void;
  onAddPurchase?: (purchase: Purchase) => void;
}

type StockTab = 'inventory' | 'details' | 'sales' | 'sales_history' | 'purchases' | 'purchases_history';

const StockManagement: React.FC<StockManagementProps> = ({ 
  products, 
  sales = [], 
  purchases = [], 
  onUpdateProduct, 
  onAddProduct, 
  onDeleteProduct,
  onStartSale,
  onAddPurchase
}) => {
  const [activeTab, setActiveTab] = useState<StockTab>('inventory');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    genericName: '',
    dosage: '',
    manufacturer: '',
    sanitaryRegistry: '',
    cost: '',
    price: '',
    unit: 'UN',
    stock: '0',
    category: MedicineCategory.OTHER,
    barcode: '',
    location: '',
    minStock: '10',
    maxStock: '100',
    imageUrl: ''
  });

  const [purchaseFormData, setPurchaseFormData] = useState({
    invoiceNumber: '',
    supplier: '',
    batchNumber: '',
    manufacturerBatchNumber: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
    location: '',
    isColdChain: false
  });

  useEffect(() => {
    if (selectedProduct) {
      const totalStock = selectedProduct.batches.reduce((sum, b) => sum + b.quantity, 0);
      const avgCost = selectedProduct.batches.length > 0 
        ? selectedProduct.batches.reduce((sum, b) => sum + b.purchasePrice, 0) / selectedProduct.batches.length 
        : 0;

      setFormData({
        code: selectedProduct.code,
        name: selectedProduct.name,
        genericName: selectedProduct.genericName || '',
        dosage: selectedProduct.dosage || '',
        manufacturer: selectedProduct.manufacturer || '',
        sanitaryRegistry: selectedProduct.sanitaryRegistry || '',
        cost: avgCost.toString(),
        price: selectedProduct.sellingPriceWholesale.toString(),
        unit: selectedProduct.pharmaceuticalForm,
        stock: totalStock.toString(),
        category: selectedProduct.category,
        barcode: selectedProduct.barcode || '',
        location: selectedProduct.batches[0]?.location || '',
        minStock: selectedProduct.minStockAlert.toString(),
        maxStock: selectedProduct.maxStockAlert?.toString() || '100',
        imageUrl: selectedProduct.imageUrl || ''
      });
    } else {
      setFormData({
        code: '',
        name: '',
        genericName: '',
        dosage: '',
        manufacturer: '',
        sanitaryRegistry: '',
        cost: '',
        price: '',
        unit: 'UN',
        stock: '0',
        category: MedicineCategory.OTHER,
        barcode: '',
        location: '',
        minStock: '10',
        maxStock: '100',
        imageUrl: ''
      });
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (successToast?.show) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProduct && !onAddProduct) return;

    const productData: Partial<Product> = {
      code: formData.code,
      name: formData.name,
      genericName: formData.genericName,
      dosage: formData.dosage,
      manufacturer: formData.manufacturer,
      sanitaryRegistry: formData.sanitaryRegistry,
      barcode: formData.barcode,
      category: formData.category,
      pharmaceuticalForm: formData.unit as PharmaceuticalForm,
      sellingPriceWholesale: parseFloat(formData.price),
      minStockAlert: parseInt(formData.minStock),
      maxStockAlert: parseInt(formData.maxStock),
      imageUrl: formData.imageUrl
    };

    if (selectedProduct) {
      onUpdateProduct?.({ ...selectedProduct, ...productData } as Product);
      setSuccessToast({ show: true, message: 'Produto atualizado com sucesso!' });
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        ...productData,
        batches: [],
        unitsPerBox: 1,
      } as Product;
      onAddProduct?.(newProduct);
      setSelectedProduct(newProduct);
      setSuccessToast({ show: true, message: 'Novo produto cadastrado!' });
    }
  };

  const handleNew = () => {
    setSelectedProduct(null);
    setActiveTab('details');
  };

  const handleDelete = () => {
    if (selectedProduct && onDeleteProduct) {
      if (window.confirm(`Tem certeza que deseja excluir o produto ${selectedProduct.name}?`)) {
        onDeleteProduct(selectedProduct.id);
        setSelectedProduct(products[0] || null);
        setSuccessToast({ show: true, message: 'Produto excluído com sucesso!' });
      }
    }
  };

  const productSales = useMemo(() => {
    if (!selectedProduct) return [];
    return sales.filter(s => s.items.some(item => item.productId === selectedProduct.id));
  }, [selectedProduct, sales]);

  const productPurchases = useMemo(() => {
    if (!selectedProduct) return [];
    return purchases.filter(p => p.items.some(item => item.productId === selectedProduct.id));
  }, [selectedProduct, purchases]);

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !onUpdateProduct) return;

    const quantity = parseInt(purchaseFormData.quantity);
    const purchasePrice = parseFloat(purchaseFormData.purchasePrice);

    const newBatch: Batch = {
      id: `b-${Date.now()}`,
      batchNumber: purchaseFormData.batchNumber || `LOT-${Date.now().toString().slice(-6)}`,
      manufacturerBatchNumber: purchaseFormData.manufacturerBatchNumber,
      manufacturingDate: purchaseFormData.manufacturingDate,
      expiryDate: purchaseFormData.expiryDate,
      quantity: quantity,
      purchasePrice: purchasePrice,
      location: purchaseFormData.location || formData.location,
      isColdChain: purchaseFormData.isColdChain
    };

    const updatedProduct = {
      ...selectedProduct,
      batches: [...selectedProduct.batches, newBatch]
    };

    onUpdateProduct(updatedProduct);

    // Also register the purchase globally if handler exists
    if (onAddPurchase) {
      const newPurchase: Purchase = {
        id: `pur-${Date.now()}`,
        invoiceNumber: purchaseFormData.invoiceNumber,
        date: new Date().toISOString(),
        supplier: purchaseFormData.supplier,
        total: quantity * purchasePrice,
        items: [{
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          batchNumber: newBatch.batchNumber,
          manufacturerBatchNumber: newBatch.manufacturerBatchNumber,
          manufacturingDate: newBatch.manufacturingDate,
          expiryDate: newBatch.expiryDate,
          quantity: quantity,
          purchasePrice: purchasePrice,
          location: newBatch.location,
          isColdChain: newBatch.isColdChain,
          total: quantity * purchasePrice
        }]
      };
      onAddPurchase(newPurchase);
    }

    setSuccessToast({ show: true, message: 'Entrada de estoque registrada!' });
    setPurchaseFormData({
      invoiceNumber: '',
      supplier: '',
      batchNumber: '',
      manufacturerBatchNumber: '',
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
      location: '',
      isColdChain: false
    });
    setActiveTab('purchases_history');
  };

  const handleImageUpload = () => {
    const url = window.prompt('Insira a URL da imagem do produto:');
    if (url) {
      setFormData({ ...formData, imageUrl: url });
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-8 animate-fadeIn">
      {/* Header with Title */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-[#9333EA] text-white py-2 px-6 rounded-t-xl flex justify-between items-center shadow-lg">
          <h1 className="text-sm font-bold uppercase tracking-widest">Produtos</h1>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-x border-slate-200 flex overflow-x-auto">
          {[
            { id: 'inventory', label: 'Inventário Geral' },
            { id: 'details', label: 'Dados do Produto' },
            { id: 'sales', label: 'Vendas' },
            { id: 'sales_history', label: 'Histórico de Vendas' },
            { id: 'purchases', label: 'Compras' },
            { id: 'purchases_history', label: 'Histórico de Compras' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as StockTab)}
              className={`px-6 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border-r border-slate-100 transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 border-b-2 border-b-[#9333EA]' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-xl p-4 md:p-8 min-h-[600px]">
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar no inventário..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase">Produtos em Alerta: {products.filter(p => p.batches.reduce((sum, b) => sum + b.quantity, 0) < p.minStockAlert).length}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredProducts.map(product => {
                  const totalStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
                  const isLowStock = totalStock < product.minStockAlert;
                  
                  return (
                    <div key={product.id} className={`bg-white rounded-3xl border transition-all overflow-hidden ${isLowStock ? 'border-amber-200 shadow-amber-50' : 'border-slate-100 shadow-sm'}`}>
                      <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${isLowStock ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'}`}>
                            {product.code.slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{product.name}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.genericName} • {product.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Venda</p>
                            <p className="text-sm font-black text-emerald-600">{formatCurrency(product.sellingPriceWholesale)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estoque Total</p>
                            <p className={`text-sm font-black ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>{totalStock} un</p>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedProduct(product);
                              setActiveTab('details');
                            }}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {product.batches.length > 0 ? (
                          product.batches
                            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                            .map((batch) => {
                              const isExpired = new Date(batch.expiryDate) < new Date();
                              const isExpiringSoon = new Date(batch.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                              
                              return (
                                <div key={batch.id} className={`p-4 rounded-2xl border transition-all ${
                                  isExpired ? 'bg-red-50 border-red-100' : 
                                  isExpiringSoon ? 'bg-amber-50 border-amber-100' : 
                                  'bg-white border-slate-100'
                                }`}>
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lote</p>
                                      <p className="text-xs font-bold text-slate-900">{batch.batchNumber}</p>
                                    </div>
                                    {batch.isColdChain && (
                                      <div className="text-blue-500">
                                        <ThermometerSnowflake size={14} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase">Validade:</span>
                                      <span className={`text-[10px] font-black ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-700'}`}>
                                        {new Date(batch.expiryDate).toLocaleDateString('pt')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase">Quantidade:</span>
                                      <span className="text-[10px] font-black text-slate-900">{batch.quantity} un</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase">Local:</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">{batch.location || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div className="col-span-full py-4 text-center text-slate-400 text-xs italic">
                            Nenhum lote registrado para este produto.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left Side: Form Fields */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                  <label className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Código:</label>
                  <input 
                    type="text" 
                    className="w-full md:col-span-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Código"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                  />
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                  <label className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Nome Genérico:</label>
                  <input 
                    type="text" 
                    className="w-full md:col-span-9 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="DCI (Ex: Paracetamol)"
                    value={formData.genericName}
                    onChange={e => setFormData({...formData, genericName: e.target.value})}
                  />
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                  <label className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Dosagem:</label>
                  <input 
                    type="text" 
                    className="w-full md:col-span-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Ex: 500mg"
                    value={formData.dosage}
                    onChange={e => setFormData({...formData, dosage: e.target.value})}
                  />
                  <label className="md:col-span-2 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Reg. Sanit.:</label>
                  <input 
                    type="text" 
                    className="w-full md:col-span-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Registro"
                    value={formData.sanitaryRegistry}
                    onChange={e => setFormData({...formData, sanitaryRegistry: e.target.value})}
                  />
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                  <label className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Fabricante:</label>
                  <input 
                    type="text" 
                    className="w-full md:col-span-9 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Laboratório / Fabricante"
                    value={formData.manufacturer}
                    onChange={e => setFormData({...formData, manufacturer: e.target.value})}
                  />
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                  <label className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Custo:</label>
                  <div className="w-full md:col-span-4 relative">
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                      placeholder="Custo"
                      value={formData.cost}
                      onChange={e => setFormData({...formData, cost: e.target.value})}
                    />
                    <button type="button" className="absolute right-[-40px] top-1/2 -translate-y-1/2 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-amber-600 transition-all">
                      <Calculator size={14} />
                    </button>
                  </div>
                  <label className="md:col-span-2 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Preço:</label>
                  <input 
                    type="text" 
                    className="w-full md:col-span-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Preço"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                  <label className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Unidade:</label>
                  <select 
                    className="w-full md:col-span-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium appearance-none"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="UN">UNIDADE</option>
                    <option value="CX">CAIXA</option>
                    <option value="FR">FRASCO</option>
                  </select>
                  <label className="md:col-span-2 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Estoque:</label>
                  <input 
                    disabled
                    type="text" 
                    className="w-full md:col-span-3 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm font-bold text-slate-500"
                    placeholder="Estoque"
                    value={formData.stock}
                  />
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                  <label className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Categoria:</label>
                  <select 
                    className="w-full md:col-span-9 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium appearance-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as MedicineCategory})}
                  >
                    {Object.values(MedicineCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                  <label className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Cód.Barras:</label>
                  <input 
                    type="text" 
                    className="w-full md:col-span-9 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Código de barras"
                    value={formData.barcode}
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                  />
                </div>

                <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                  <label className="md:col-span-3 text-[11px] font-bold text-slate-500 uppercase md:text-right md:pr-4">Localização:</label>
                  <input 
                    type="text" 
                    className="w-full md:col-span-9 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Localização do estoque"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-[11px] font-bold text-slate-500 uppercase text-right pr-4">Estoque Mínimo:</label>
                  <input 
                    type="text" 
                    className="col-span-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Estoque mínimo"
                    value={formData.minStock}
                    onChange={e => setFormData({...formData, minStock: e.target.value})}
                  />
                  <label className="col-span-3 text-[11px] font-bold text-slate-500 uppercase text-right pr-4">Est. Máximo:</label>
                  <input 
                    type="text" 
                    className="col-span-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                    placeholder="Estoque máximo"
                    value={formData.maxStock}
                    onChange={e => setFormData({...formData, maxStock: e.target.value})}
                  />
                </div>
              </div>

              {/* Right Side: Image Placeholder */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
                <div className="w-full aspect-square max-w-[350px] bg-slate-100 rounded-3xl border-4 border-slate-200 flex flex-col items-center justify-center text-slate-300 relative overflow-hidden group">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Produto" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <>
                      <ImageIcon size={120} className="opacity-20" />
                      <p className="text-2xl font-black uppercase tracking-tighter opacity-20 text-center px-8">Produto Sem Imagem</p>
                    </>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={handleImageUpload}
                  className="px-8 py-2 bg-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                >
                  Selecione a Foto
                </button>
              </div>
            </form>
          )}

          {activeTab === 'sales' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <History size={64} className="opacity-20" />
              <p className="font-bold uppercase tracking-widest text-sm">Módulo de Vendas Diretas</p>
              <button 
                onClick={() => selectedProduct && onStartSale?.(selectedProduct.id)}
                className="bg-emerald-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg hover:bg-emerald-700 transition-all"
              >
                Ir para PDV
              </button>
            </div>
          )}

          {activeTab === 'sales_history' && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2">Histórico de Movimentação de Saída</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="pb-4">Data</th>
                      <th className="pb-4">Fatura</th>
                      <th className="pb-4">Cliente</th>
                      <th className="pb-4 text-right">Qtd</th>
                      <th className="pb-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {productSales.map(sale => {
                      const item = sale.items.find(i => i.productId === selectedProduct?.id);
                      return (
                        <tr key={sale.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-3">{new Date(sale.date).toLocaleDateString('pt')}</td>
                          <td className="py-3 font-mono font-bold">{sale.invoiceNumber}</td>
                          <td className="py-3">{sale.clientName}</td>
                          <td className="py-3 text-right font-bold">{item?.quantity}</td>
                          <td className="py-3 text-right font-black text-emerald-600">{formatCurrency(item?.total || 0)}</td>
                        </tr>
                      );
                    })}
                    {productSales.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-300 font-medium italic">Nenhuma venda registrada para este produto.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Registrar Entrada de Lote</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                  <Package size={14} />
                  <span>{selectedProduct?.name}</span>
                </div>
              </div>

              <form onSubmit={handlePurchaseSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase">Nº Fatura:</label>
                    <input 
                      required
                      type="text" 
                      className="col-span-8 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      value={purchaseFormData.invoiceNumber}
                      onChange={e => setPurchaseFormData({...purchaseFormData, invoiceNumber: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase">Fornecedor:</label>
                    <input 
                      required
                      type="text" 
                      className="col-span-8 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      value={purchaseFormData.supplier}
                      onChange={e => setPurchaseFormData({...purchaseFormData, supplier: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase">Lote Fabr.:</label>
                    <input 
                      required
                      type="text" 
                      className="col-span-8 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      value={purchaseFormData.manufacturerBatchNumber}
                      onChange={e => setPurchaseFormData({...purchaseFormData, manufacturerBatchNumber: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase">Validade:</label>
                    <input 
                      required
                      type="date" 
                      className="col-span-8 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      value={purchaseFormData.expiryDate}
                      onChange={e => setPurchaseFormData({...purchaseFormData, expiryDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase">Quantidade:</label>
                    <input 
                      required
                      type="number" 
                      className="col-span-8 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                      value={purchaseFormData.quantity}
                      onChange={e => setPurchaseFormData({...purchaseFormData, quantity: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase">Preço Compra:</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="col-span-8 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-500 font-bold text-emerald-600"
                      value={purchaseFormData.purchasePrice}
                      onChange={e => setPurchaseFormData({...purchaseFormData, purchasePrice: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase">Localização:</label>
                    <input 
                      type="text" 
                      className="col-span-8 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: Corredor A, Prateleira 2"
                      value={purchaseFormData.location}
                      onChange={e => setPurchaseFormData({...purchaseFormData, location: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase">Cadeia Frio:</label>
                    <div className="col-span-8 flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        checked={purchaseFormData.isColdChain}
                        onChange={e => setPurchaseFormData({...purchaseFormData, isColdChain: e.target.checked})}
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Requer Refrigeração</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end pt-6">
                  <button 
                    type="submit"
                    className="bg-[#9333EA] text-white px-12 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Confirmar Entrada
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'purchases_history' && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2">Histórico de Movimentação de Entrada</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="pb-4">Data</th>
                      <th className="pb-4">Fatura</th>
                      <th className="pb-4">Fornecedor</th>
                      <th className="pb-4">Lote</th>
                      <th className="pb-4 text-right">Qtd</th>
                      <th className="pb-4 text-right">Preço Unit.</th>
                      <th className="pb-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {productPurchases.map(purchase => {
                      const item = purchase.items.find(i => i.productId === selectedProduct?.id);
                      return (
                        <tr key={purchase.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-3">{new Date(purchase.date).toLocaleDateString('pt')}</td>
                          <td className="py-3 font-mono font-bold">{purchase.invoiceNumber}</td>
                          <td className="py-3">{purchase.supplier}</td>
                          <td className="py-3 font-mono text-xs">{item?.manufacturerBatchNumber}</td>
                          <td className="py-3 text-right font-bold">{item?.quantity}</td>
                          <td className="py-3 text-right">{formatCurrency(item?.purchasePrice || 0)}</td>
                          <td className="py-3 text-right font-black text-purple-600">{formatCurrency(item?.total || 0)}</td>
                        </tr>
                      );
                    })}
                    {productPurchases.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-slate-300 font-medium italic">Nenhuma compra registrada para este produto.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-[#F9FAFB] border-x border-b border-slate-200 rounded-b-xl p-6 flex flex-wrap gap-4 items-center justify-between shadow-inner">
          <div className="flex gap-4">
            <button 
              onClick={handleNew}
              className="flex items-center gap-3 bg-amber-500 text-white px-8 py-3 rounded-2xl shadow-lg hover:bg-amber-600 transition-all font-black text-xs uppercase tracking-widest"
            >
              <Plus size={18} />
              Novo
            </button>
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-3 bg-amber-500 text-white px-8 py-3 rounded-2xl shadow-lg hover:bg-amber-600 transition-all font-black text-xs uppercase tracking-widest"
            >
              <Search size={18} />
              Localizar
            </button>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleSave}
              className="flex items-center gap-3 bg-amber-500 text-white px-12 py-3 rounded-2xl shadow-lg hover:bg-amber-600 transition-all font-black text-xs uppercase tracking-widest"
            >
              <Save size={18} />
              Salvar
            </button>
            <button 
              onClick={handleDelete}
              disabled={!selectedProduct}
              className="flex items-center gap-3 bg-slate-300 text-slate-500 px-8 py-3 rounded-2xl shadow-lg hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:hover:bg-slate-300 disabled:hover:text-slate-500"
            >
              <Trash2 size={18} />
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Search Modal (LOCALIZAR) */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-slideUp">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-sm">Localizar Produto</h3>
              <button onClick={() => setIsSearchModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome, código ou categoria..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto space-y-2">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsSearchModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-purple-200 hover:bg-purple-50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-black text-xs">
                        {product.code.slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{product.category} • {product.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{product.batches.reduce((sum, b) => sum + b.quantity, 0)} un</p>
                      <p className="text-[10px] font-bold text-emerald-600">{formatCurrency(product.sellingPriceWholesale)}</p>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="py-20 text-center text-slate-400 italic">Nenhum produto encontrado.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast?.show && (
        <div className="fixed bottom-8 right-8 z-[300] animate-slideUp">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-emerald-400">
            <CheckCircle2 size={24} />
            <div>
              <p className="font-black text-sm uppercase tracking-tighter">SUCESSO</p>
              <p className="text-emerald-50 text-xs">{successToast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
