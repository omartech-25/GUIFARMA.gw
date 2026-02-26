
import React, { useState } from 'react';
import { BarChart3, Calendar, AlertTriangle, TrendingUp, MapPin, Download, DollarSign } from 'lucide-react';
import { Product, Sale, Client } from '../types';
import { formatCurrency } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  clients: Client[];
}

const Reports: React.FC<ReportsProps> = ({ products, sales, clients }) => {
  const [activeTab, setActiveTab] = useState<'expiry' | 'financial' | 'region' | 'import'>('expiry');

  // 1. Relatório de Validade
  const nearExpiryProducts = products.flatMap(p => 
    p.batches.map(b => ({
      ...b,
      productName: p.name,
      genericName: p.genericName,
      daysLeft: Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))
  ).filter(b => b.daysLeft <= 180 && b.quantity > 0)
   .sort((a, b) => a.daysLeft - b.daysLeft);

  // 2. Ranking por Região
  const salesByRegion = clients.map(client => {
    const clientSales = sales.filter(s => s.clientId === client.id);
    const total = clientSales.reduce((sum, s) => sum + s.total, 0);
    return { region: client.region, total };
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
    const date = new Date(sale.date).toLocaleDateString('pt');
    const existing = acc.find(a => a.date === date);
    if (existing) {
      existing.total += sale.total;
    } else {
      acc.push({ date, total: sale.total });
    }
    return acc;
  }, []).slice(0, 7).reverse();

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Administração e Finanças</h2>
          <p className="text-slate-500">Relatórios estratégicos para a GUIFARMA SA.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all text-sm font-bold">
          <Download size={18} />
          Exportar PDF (OHADA)
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'expiry', label: 'Validade', icon: AlertTriangle },
          { id: 'financial', label: 'Financeiro', icon: TrendingUp },
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

      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-8">Fluxo de Caixa (Últimos 7 Dias)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
