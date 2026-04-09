
import React, { useState, useRef } from 'react';
import { BarChart3, Calendar, AlertTriangle, TrendingUp, MapPin, Download, DollarSign, Package, CheckCircle2, List, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Product, Sale, Client, MedicineCategory, User } from '../types';
import { formatCurrency } from '@/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  users: User[];
}

const Reports: React.FC<ReportsProps> = ({ products = [], sales = [], clients = [], users = [] }) => {
  const [activeTab, setActiveTab] = useState<'expiry' | 'financial' | 'region' | 'import' | 'lowStock' | 'detailedSales' | 'userPerformance'>('expiry');
  const [lowStockCategory, setLowStockCategory] = useState<string>('all');
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const element = reportRef.current;
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
      pdf.save(`Relatorio_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  // 1. Relatório de Validade
  const nearExpiryProducts = products.flatMap(p => {
    const batches = p.batches || [];
    return batches.map(b => ({
      ...b,
      productName: p.name,
      genericName: p.genericName,
      daysLeft: b.expiryDate ? Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 9999
    }));
  }).filter(b => b.daysLeft <= 180 && (b.quantity || 0) > 0)
   .sort((a, b) => a.daysLeft - b.daysLeft);

  // 2. Ranking por Região
  const salesByRegion = clients.map(client => {
    const clientSales = sales.filter(s => s.clientId === client.id);
    const total = clientSales.reduce((sum, s) => sum + (s.total || 0), 0);
    return { region: client.region || 'N/A', total };
  }).reduce((acc: any[], curr) => {
    const existing = acc.find(a => a.region === curr.region);
    if (existing) {
      existing.total += curr.total;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, []).sort((a, b) => b.total - a.total);

  // 3. Fluxo de Caixa (Simplificado)
  const dailyCashFlow = sales.reduce((acc: any[], sale) => {
    const date = sale.date ? new Date(sale.date).toLocaleDateString('pt') : 'N/A';
    const existing = acc.find(a => a.date === date);
    if (existing) {
      existing.total += (sale.total || 0);
    } else {
      acc.push({ date, total: (sale.total || 0) });
    }
    return acc;
  }, []).slice(0, 7).reverse();

  // 4. Relatório de Stock Baixo
  const lowStockProducts = products.map(p => {
    const batches = p.batches || [];
    const currentStock = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    return {
      ...p,
      currentStock,
      criticalLevel: currentStock / (p.minStockAlert || 1)
    };
  })
  .filter(p => p.currentStock < (p.minStockAlert || 0))
  .filter(p => lowStockCategory === 'all' || p.category === lowStockCategory)
  .sort((a, b) => a.criticalLevel - b.criticalLevel);

  // 5. Desempenho por Usuário
  const salesByUser = users.map(user => {
    const userSales = sales.filter(s => s.sellerId === user.id);
    const totalAmount = userSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const salesCount = userSales.length;
    return { 
      name: user.employeeName || user.name, 
      totalAmount, 
      salesCount,
      role: user.role
    };
  }).filter(u => u.salesCount > 0 || u.role === 'Vendedor' || u.role === 'Administrador')
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div ref={reportRef} className="space-y-8 animate-fadeIn bg-white p-12 rounded-3xl">
      {/* Header for PDF Export */}
      <div className="hidden print:flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 border-4 border-black rounded-full flex items-center justify-center">
            <div className="text-6xl font-bold text-black">+</div>
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter leading-none text-black">GUIFARMA</h2>
            <p className="text-sm font-bold mt-1 text-black">Comércio de Produtos Farmacêuticos</p>
          </div>
        </div>
        <div className="text-right text-[13px] space-y-1 font-medium text-black">
          <p>Rua Eduardo Mondelane Edifício Mavegro</p>
          <p>Bissau</p>
          <p>Contribuinte: 510019285</p>
          <p>Whatsapp: 002455142629</p>
          <p>Tel: 955142629 / 965025657</p>
          <p>Email: guifarma.distribuicao@gmail.com</p>
        </div>
      </div>

      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Administração e Finanças</h2>
          <p className="text-slate-500">Relatórios estratégicos para a GUIFARMA SA.</p>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all text-sm font-bold"
        >
          <Download size={18} />
          Exportar PDF (OHADA)
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'expiry', label: 'Validade', icon: AlertTriangle },
          { id: 'lowStock', label: 'Stock Baixo', icon: Package },
          { id: 'financial', label: 'Financeiro', icon: TrendingUp },
          { id: 'detailedSales', label: 'Vendas Detalhadas', icon: List },
          { id: 'userPerformance', label: 'Desempenho', icon: Users },
          { id: 'region', label: 'Regiões', icon: MapPin },
          { id: 'import', label: 'Importação', icon: DollarSign },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-tighter transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'expiry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Produtos Próximos do Vencimento (180 dias)</h3>
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Crítico</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Medicamento</th>
                    <th className="px-6 py-4">Lote</th>
                    <th className="px-6 py-4">Validade</th>
                    <th className="px-6 py-4">Dias Restantes</th>
                    <th className="px-6 py-4">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nearExpiryProducts.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{item.productName}</p>
                        <p className="text-[10px] text-slate-400">{item.genericName}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{item.batchNumber}</td>
                      <td className="px-6 py-4 font-medium">{new Date(item.expiryDate).toLocaleDateString('pt')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                          item.daysLeft < 90 ? 'bg-red-100 text-red-600' : 
                          item.daysLeft < 180 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {item.daysLeft < 0 ? 'VENCIDO' : `${item.daysLeft} DIAS`}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{item.quantity} un</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <h3 className="font-bold text-slate-800">Resumo de Perdas</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor em Risco</p>
              <p className="text-3xl font-black text-slate-900">{formatCurrency(nearExpiryProducts.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0))}</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Lotes Críticos (&lt; 3 meses)</span>
                <span className="font-bold text-red-500">{nearExpiryProducts.filter(i => i.daysLeft < 90).length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Lotes em Alerta (3-6 meses)</span>
                <span className="font-bold text-amber-500">{nearExpiryProducts.filter(i => i.daysLeft >= 90 && i.daysLeft < 180).length}</span>
              </div>
            </div>
            <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
              Gerar Guia de Recolha
            </button>
          </div>
        </div>
      )}

      {activeTab === 'lowStock' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800">Produtos com Stock Abaixo do Mínimo</h3>
              <p className="text-xs text-slate-400">Ordenados por nível de criticidade (mais urgente primeiro).</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar Categoria:</label>
              <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                value={lowStockCategory}
                onChange={(e) => setLowStockCategory(e.target.value)}
              >
                <option value="all">Todas as Categorias</option>
                {Object.values(MedicineCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-8 py-4">Medicamento</th>
                    <th className="px-8 py-4">Código</th>
                    <th className="px-8 py-4">Categoria</th>
                    <th className="px-8 py-4 text-center">Stock Atual</th>
                    <th className="px-8 py-4 text-center">Mínimo Alerta</th>
                    <th className="px-8 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lowStockProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <p className="font-bold text-slate-800">{product.name}</p>
                        <p className="text-[10px] text-slate-400">{product.genericName}</p>
                      </td>
                      <td className="px-8 py-4 font-mono text-xs">{product.code}</td>
                      <td className="px-8 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center font-black text-red-600">
                        {product.currentStock} un
                      </td>
                      <td className="px-8 py-4 text-center font-bold text-slate-400">
                        {product.minStockAlert} un
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          product.criticalLevel < 0.2 ? 'bg-red-600 text-white animate-pulse' : 
                          product.criticalLevel < 0.5 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {product.criticalLevel < 0.2 ? 'Crítico' : 
                           product.criticalLevel < 0.5 ? 'Muito Baixo' : 'Baixo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {lowStockProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="text-emerald-500" size={40} />
                          <p className="font-medium">Excelente! Todos os produtos estão com stock adequado.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-8">Fluxo de Caixa (Últimos 7 Dias)</h3>
            <div className="h-[300px] w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={dailyCashFlow}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-8">Distribuição de Receita</h3>
            <div className="h-[300px] w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={salesByRegion}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="region"
                  >
                    {salesByRegion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'detailedSales' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-slate-50">
            <h3 className="font-bold text-slate-800">Relatório Detalhado de Vendas</h3>
            <p className="text-xs text-slate-400">Listagem completa de transações por item.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">Fatura</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3">Validade</th>
                  <th className="px-4 py-3 text-center">Qtd</th>
                  <th className="px-4 py-3 text-right">Preço Un.</th>
                  <th className="px-4 py-3 text-center">Desc.</th>
                  <th className="px-4 py-3 text-center">IVA</th>
                  <th className="px-4 py-3 text-right">Total Item</th>
                  <th className="px-4 py-3">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sales.flatMap(sale => 
                  sale.items.map((item, idx) => (
                    <tr key={`${sale.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{sale.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(sale.date).toLocaleDateString('pt')}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{sale.clientName}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{item.productCode}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{item.productName}</td>
                      <td className="px-4 py-3 font-mono text-slate-400 uppercase">{item.batchNumber}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(item.expiryDate).toLocaleDateString('pt', { month: '2-digit', year: 'numeric' })}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-center text-red-500 font-bold">{sale.discount}%</td>
                      <td className="px-4 py-3 text-center text-blue-500 font-bold">{sale.iva}%</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                          {sale.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'userPerformance' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Ranking de Vendas por Usuário</h3>
                <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Performance</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Vendedor</th>
                      <th className="px-6 py-4">Cargo</th>
                      <th className="px-6 py-4 text-center">Qtd. Vendas</th>
                      <th className="px-6 py-4 text-right">Total Acumulado</th>
                      <th className="px-6 py-4 text-right">% do Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salesByUser.map((user, idx) => {
                      const totalSalesSum = salesByUser.reduce((sum, u) => sum + u.totalAmount, 0);
                      const percentage = totalSalesSum > 0 ? (user.totalAmount / totalSalesSum) * 100 : 0;
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs ${
                                idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {idx + 1}
                              </div>
                              <span className="font-bold text-slate-800">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{user.role}</td>
                          <td className="px-6 py-4 text-center font-medium">{user.salesCount}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(user.totalAmount)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">{percentage.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <h3 className="font-bold text-slate-800">Resumo de Vendas</h3>
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Geral de Vendas</p>
                <p className="text-3xl font-black text-emerald-900">
                  {formatCurrency(salesByUser.reduce((sum, u) => sum + u.totalAmount, 0))}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Média por Vendedor</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(salesByUser.length > 0 ? salesByUser.reduce((sum, u) => sum + u.totalAmount, 0) / salesByUser.length : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total de Transações</span>
                  <span className="font-bold text-slate-900">
                    {salesByUser.reduce((sum, u) => sum + u.salesCount, 0)}
                  </span>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Distribuição de Volume</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByUser}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="totalAmount"
                        nameKey="name"
                      >
                        {salesByUser.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-8">Comparativo de Vendas (Valor vs Quantidade)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByUser}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalAmount" name="Valor Total" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="salesCount" name="Qtd. Vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'region' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h3 className="font-bold text-slate-800">Ranking de Vendas por Região (Guiné-Bissau)</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salesByRegion.map((reg, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reg.region}</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(reg.total)}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${
                  idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : 'bg-slate-300'
                }`}>
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800">Custos de Importação (Porto de Bissau / Alfândega)</h3>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700">
              Anexar Nova Despesa
            </button>
          </div>
          <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
            <DollarSign className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-medium">Módulo de custos de importação em integração com o sistema aduaneiro.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
