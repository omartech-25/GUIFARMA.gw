
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, ChevronRight, Package, Calendar, ShoppingCart, X, CheckCircle2, ThermometerSnowflake, MapPin } from 'lucide-react';
import { Product, Batch, MedicineCategory, PharmaceuticalForm } from '../types';
import { formatCurrency } from '../constants';

interface StockManagementProps {
  products: Product[];
  onUpdateProduct?: (updatedProduct: Product) => void;
  onAddProduct?: (newProduct: Product) => void;
}

const StockManagement: React.FC<StockManagementProps> = ({ products, onUpdateProduct, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string } | null>(null);

  const [purchaseFormData, setPurchaseFormData] = useState({
    batchNumber: '',
    manufacturerBatchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
    location: '',
    isColdChain: false
  });

  const [productFormData, setProductFormData] = useState({
    name: '',
    genericName: '',
    code: '',
    category: MedicineCategory.OTHER,
    pharmaceuticalForm: PharmaceuticalForm.TABLET,
    dosage: '',
    sellingPriceWholesale: '',
    minStockAlert: '100',
    manufacturer: '',
    sanitaryRegistry: '',
    unitsPerBox: '10'
  });

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

  const handleOpenPurchase = (product: Product) => {
    setSelectedProduct(product);
    setPurchaseFormData({
      batchNumber: `INT-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      manufacturerBatchNumber: '',
      manufacturingDate: '',
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
      location: '',
      isColdChain: false
    });
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !onUpdateProduct) return;

    const newBatch: Batch = {
      id: `b-${Date.now()}`,
      batchNumber: purchaseFormData.batchNumber,
      manufacturerBatchNumber: purchaseFormData.manufacturerBatchNumber,
      manufacturingDate: purchaseFormData.manufacturingDate,
      expiryDate: purchaseFormData.expiryDate,
      quantity: parseInt(purchaseFormData.quantity),
      purchasePrice: parseFloat(purchaseFormData.purchasePrice),
      location: purchaseFormData.location,
      isColdChain: purchaseFormData.isColdChain
    };

    const updatedProduct: Product = {
      ...selectedProduct,
      batches: [...selectedProduct.batches, newBatch]
    };

    onUpdateProduct(updatedProduct);
    setSuccessToast({ show: true, message: `Lote ${purchaseFormData.batchNumber} adicionado!` });
    setIsPurchaseModalOpen(false);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddProduct) return;

    const newProduct: Product = {
      id: `p-${Date.now()}`,
      name: productFormData.name,
      genericName: productFormData.genericName,
      code: productFormData.code,
      category: productFormData.category,
      pharmaceuticalForm: productFormData.pharmaceuticalForm,
      dosage: productFormData.dosage,
      sellingPriceWholesale: parseFloat(productFormData.sellingPriceWholesale),
      minStockAlert: parseInt(productFormData.minStockAlert),
      manufacturer: productFormData.manufacturer,
      sanitaryRegistry: productFormData.sanitaryRegistry,
      unitsPerBox: parseInt(productFormData.unitsPerBox),
      batches: []
    };

    onAddProduct(newProduct);
    setSuccessToast({ show: true, message: `Produto ${productFormData.name} cadastrado!` });
    setIsNewProductModalOpen(false);
    setProductFormData({
      name: '',
      genericName: '',
      code: '',
      category: MedicineCategory.OTHER,
      pharmaceuticalForm: PharmaceuticalForm.TABLET,
      dosage: '',
      sellingPriceWholesale: '',
      minStockAlert: '100',
      manufacturer: '',
      sanitaryRegistry: '',
      unitsPerBox: '10'
    });
  };

  const getExpiryStatus = (date: string) => {
    const expiry = new Date(date);
    const now = new Date();
    
    const threeMonths = new Date(now);
    threeMonths.setMonth(now.getMonth() + 3);
    
    const sixMonths = new Date(now);
    sixMonths.setMonth(now.getMonth() + 6);

    if (expiry < now) return 'expired';
    if (expiry < threeMonths) return 'red';
    if (expiry < sixMonths) return 'yellow';
    return 'green';
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {successToast?.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-bounceIn">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-emerald-400">
            <CheckCircle2 size={24} />
            <div>
              <p className="font-black text-sm uppercase tracking-tighter">SUCESSO</p>
              <p className="text-emerald-50 text-xs">{successToast.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Catálogo e Armazém</h2>
          <p className="text-slate-500">Controle rigoroso de lotes, validades e rastreabilidade OHADA.</p>
        </div>
        <button 
          onClick={() => setIsNewProductModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-emerald-700 transition-all font-bold"
        >
          <Plus size={20} />
          Novo Medicamento
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome comercial, genérico ou código..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredProducts.map(product => {
          const totalQty = product.batches.reduce((sum, b) => sum + b.quantity, 0);
          const isLowStock = totalQty < product.minStockAlert;
          
          return (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:border-emerald-100 transition-all group">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex gap-5">
                    <div className={`p-4 rounded-2xl ${isLowStock ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} w-16 h-16 flex items-center justify-center shrink-0`}>
                      <Package size={32} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h3>
                        <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded uppercase tracking-widest text-slate-500">{product.code}</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-600">{product.genericName} <span className="text-slate-400 font-normal">• {product.dosage}</span></p>
                      <div className="flex gap-2 pt-1">
                        <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase">{product.pharmaceuticalForm}</span>
                        <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full uppercase">{product.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center flex-1">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Estoque Total</p>
                      <p className={`text-xl font-black ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>{totalQty} <span className="text-xs font-normal text-slate-400">un</span></p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Preço Grossista</p>
                      <p className="text-xl font-black text-slate-900">{formatCurrency(product.sellingPriceWholesale)}</p>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Fabricante</p>
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{product.manufacturer}</p>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => handleOpenPurchase(product)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                      >
                        <ShoppingCart size={16} />
                        Entrada
                      </button>
                    </div>
                  </div>
                </div>

                {product.batches.length > 0 && (
                  <div className="mt-8 border-t border-slate-50 pt-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            <th className="pb-3">ID Interno</th>
                            <th className="pb-3">Lote Fabricante</th>
                            <th className="pb-3">Validade</th>
                            <th className="pb-3">Localização</th>
                            <th className="pb-3 text-right pr-6">Qtd</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {product.batches.map(batch => {
                            const status = getExpiryStatus(batch.expiryDate);
                            return (
                              <tr key={batch.id} className="border-t border-slate-50 group/row hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 font-mono font-bold text-slate-600">{batch.batchNumber}</td>
                                <td className="py-3 font-medium text-slate-500">{batch.manufacturerBatchNumber}</td>
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-300" />
                                    <span className="font-bold text-slate-700">{new Date(batch.expiryDate).toLocaleDateString('pt')}</span>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-2 text-slate-500">
                                    <MapPin size={14} />
                                    <span className="text-xs">{batch.location}</span>
                                    {batch.isColdChain && <ThermometerSnowflake size={14} className="text-blue-500" />}
                                  </div>
                                </td>
                                <td className="py-3 font-black text-right pr-6 text-slate-900">{batch.quantity}</td>
                                <td className="py-3">
                                  {status === 'expired' ? (
                                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Vencido</span>
                                  ) : status === 'red' ? (
                                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">&lt; 3 Meses</span>
                                  ) : status === 'yellow' ? (
                                    <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">3-6 Meses</span>
                                  ) : (
                                    <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">&gt; 6 Meses</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Novo Produto */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slideUp">
            <div className="bg-emerald-600 p-8 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Package size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Cadastro de Medicamento</h3>
                  <p className="text-emerald-100 text-xs font-medium">Preencha os dados técnicos obrigatórios</p>
                </div>
              </div>
              <button onClick={() => setIsNewProductModalOpen(false)} className="hover:bg-emerald-700 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Comercial</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="Ex: Paracetamol GUIFARMA" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Genérico (DCI)</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="Ex: Paracetamol" value={productFormData.genericName} onChange={e => setProductFormData({...productFormData, genericName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código SKU</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold" placeholder="Ex: PAR-750" value={productFormData.code} onChange={e => setProductFormData({...productFormData, code: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dosagem</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="Ex: 500mg, 10ml" value={productFormData.dosage} onChange={e => setProductFormData({...productFormData, dosage: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={productFormData.category} onChange={e => setProductFormData({...productFormData, category: e.target.value as MedicineCategory})}>
                    {Object.values(MedicineCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma Farmacêutica</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={productFormData.pharmaceuticalForm} onChange={e => setProductFormData({...productFormData, pharmaceuticalForm: e.target.value as PharmaceuticalForm})}>
                    {Object.values(PharmaceuticalForm).map(form => <option key={form} value={form}>{form}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fabricante / Laboratório</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="Origem do produto" value={productFormData.manufacturer} onChange={e => setProductFormData({...productFormData, manufacturer: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registro Sanitário (GB)</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="Nº de Autorização" value={productFormData.sanitaryRegistry} onChange={e => setProductFormData({...productFormData, sanitaryRegistry: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Venda Grosso (FCFA)</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-lg text-emerald-600" placeholder="0" value={productFormData.sellingPriceWholesale} onChange={e => setProductFormData({...productFormData, sellingPriceWholesale: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades por Caixa</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={productFormData.unitsPerBox} onChange={e => setProductFormData({...productFormData, unitsPerBox: e.target.value})} />
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsNewProductModalOpen(false)} className="flex-1 py-4 font-black text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-4 font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs">Salvar Medicamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Entrada de Lote */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-slideUp">
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2 rounded-xl">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Entrada de Lote</h3>
                  <p className="text-slate-400 text-xs font-medium">Rastreabilidade e controle de validade</p>
                </div>
              </div>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePurchaseSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Interno (Auto)</label>
                  <input disabled type="text" className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl font-mono font-bold text-slate-500" value={purchaseFormData.batchNumber} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lote do Fabricante</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="Ex: LOT-XYZ" value={purchaseFormData.manufacturerBatchNumber} onChange={e => setPurchaseFormData({...purchaseFormData, manufacturerBatchNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Fabrico</label>
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={purchaseFormData.manufacturingDate} onChange={e => setPurchaseFormData({...purchaseFormData, manufacturingDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Expiração</label>
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={purchaseFormData.expiryDate} onChange={e => setPurchaseFormData({...purchaseFormData, expiryDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade (Unids)</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg" value={purchaseFormData.quantity} onChange={e => setPurchaseFormData({...purchaseFormData, quantity: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Unit. (FCFA)</label>
                  <input required type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg text-blue-600" value={purchaseFormData.purchasePrice} onChange={e => setPurchaseFormData({...purchaseFormData, purchasePrice: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="Ex: Corredor A1" value={purchaseFormData.location} onChange={e => setPurchaseFormData({...purchaseFormData, location: e.target.value})} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="coldChain" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={purchaseFormData.isColdChain} onChange={e => setPurchaseFormData({...purchaseFormData, isColdChain: e.target.checked})} />
                  <label htmlFor="coldChain" className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    Cadeia de Frio
                    <ThermometerSnowflake size={16} className="text-blue-500" />
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full py-4 font-black text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs">Confirmar Entrada de Stock</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounceIn {
          0% { transform: translate(-50%, -100%); opacity: 0; }
          60% { transform: translate(-50%, 10%); opacity: 1; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-bounceIn { animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default StockManagement;
