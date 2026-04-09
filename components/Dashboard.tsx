
import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Users, Package, ShoppingCart, Plus } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Product, Sale, User } from '../types';
import { formatCurrency } from '@/constants';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  currentUser: User | null;
  onNavigate: (view: any) => void;
}

const data = [
  { name: 'Jan', vendas: 4000000 },
  { name: 'Fev', vendas: 3000000 },
  { name: 'Mar', vendas: 2000000 },
  { name: 'Abr', vendas: 2780000 },
  { name: 'Mai', vendas: 1890000 },
  { name: 'Jun', vendas: 2390000 },
  { name: 'Jul', vendas: 3490000 },
];

const Dashboard: React.FC<DashboardProps> = ({ products = [], sales = [], currentUser, onNavigate }) => {
  const totalStockItems = products.reduce((acc, p) => {
    const batches = p.batches || [];
    return acc + batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
  }, 0);

  const lowStockCount = products.filter(p => {
    const batches = p.batches || [];
    const totalQty = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    return totalQty < (p.minStockAlert || 0);
  }).length;

  const expiredCount = products.filter(p => {
    const batches = p.batches || [];
    return batches.some(b => b.expiryDate && new Date(b.expiryDate) < new Date());
  }).length;

  const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Bem-vindo, {currentUser?.employeeName || currentUser?.name || 'Utilizador'}</h2>
          <p className="text-sm text-slate-500">Aqui está o resumo do MedStock Pro hoje.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentUser?.permissions?.sales && (
          <button 
            onClick={() => onNavigate('sales')}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ShoppingCart size={24} />
            </div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Nova Venda</span>
          </button>
        )}
        {currentUser?.permissions?.stockEntry && (
          <button 
            onClick={() => onNavigate('purchases')}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Plus size={24} />
            </div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Entrada Estoque</span>
          </button>
        )}
        <button 
          onClick={() => onNavigate('stock')}
          className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-all">
            <Package size={24} />
          </div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Ver Estoque</span>
        </button>
        {currentUser?.permissions?.systemTools && (
          <button 
            onClick={() => onNavigate('logs')}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group"
          >
            <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all">
              <TrendingUp size={24} className="rotate-180" />
            </div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Reiniciar Mês</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total em Estoque</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalStockItems.toLocaleString()} <span className="text-sm text-slate-400">unids</span></h3>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
            <TrendingUp size={16} className="mr-1" />
            +12% este mês
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Vendas Mensais</p>
              <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
            <TrendingUp size={16} className="mr-1" />
            +8.5% vs mês anterior
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Estoque Crítico</p>
              <h3 className="text-2xl font-bold text-slate-900">{lowStockCount}</h3>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg">
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-amber-600 font-medium">
            Requer atenção imediata
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Lotes Vencidos</p>
              <h3 className="text-2xl font-bold text-red-600">{expiredCount}</h3>
            </div>
            <div className="bg-red-50 p-2 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-red-600 font-medium">
            Bloqueados para venda
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Tendência de Vendas (FCFA)</h3>
          <div className="h-80 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `${val/1000000}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                />
                <Area type="monotone" dataKey="vendas" stroke="#059669" fillOpacity={1} fill="url(#colorVendas)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Categorias Mais Vendidas</h3>
          <div className="h-80 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={[
                { cat: 'Antibióticos', q: 450 },
                { cat: 'Analgésicos', q: 320 },
                { cat: 'Suplementos', q: 180 },
                { cat: 'Dermato', q: 120 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="cat" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="q" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
