
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Pill,
  BookOpen,
  Wallet
} from 'lucide-react';
import { ViewType, UserRole, User } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  user: User;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock', label: 'Estoque', icon: Package, permission: 'registerProducts' },
    { id: 'purchases', label: 'Entradas', icon: Package, permission: 'stockEntry' },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart, permission: 'sales' },
    { id: 'cash', label: 'Caixa', icon: Wallet, permission: 'cashClosing' },
    { id: 'clients', label: 'Clientes', icon: Users, permission: 'registerClients' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, permission: ['reportsRegistration', 'reportsFinancial', 'reportsManagement'] },
    { id: 'accounting', label: 'Contabilidade', icon: BookOpen, permission: ['bankMovements', 'accountTransfers'] },
    { id: 'users', label: 'Usuários', icon: Settings, permission: ['registerUsers', 'systemSettings'] },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 text-white fixed left-0 top-0 flex flex-col shadow-xl z-50">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-emerald-500 p-2 rounded-lg">
          <Pill size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">GUIFARMA <span className="text-emerald-400">SA</span></h1>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-1">
        {menuItems.map((item) => {
          if (item.permission) {
            const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
            const hasPermission = permissions.some(p => user.permissions[p as keyof typeof user.permissions]);
            if (!hasPermission) return null;
          }
          
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 p-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold uppercase">
            {user.name.slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{user.employeeName || user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
