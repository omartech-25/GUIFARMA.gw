
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
  Wallet,
  Activity,
  ReceiptText,
  User as UserIcon,
  X
} from 'lucide-react';
import { ViewType, UserRole, User } from '../types';
import { ROLE_PERMISSIONS, DEFAULT_PERMISSIONS } from '../constants';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  user: User | null;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout, isOpen, onClose }) => {
  if (!user) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock', label: 'Estoque', icon: Package, permission: 'viewStock' },
    { id: 'purchases', label: 'Entrada de Estoque', icon: Package, permission: 'stockEntry' },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart, permission: 'sales' },
    { id: 'cash', label: 'Caixa', icon: Wallet, permission: 'cashClosing' },
    { id: 'clients', label: 'Clientes', icon: Users, permission: 'registerClients' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, permission: ['reportsRegistration', 'reportsFinancial', 'reportsManagement'] },
    { id: 'accounting', label: 'Contabilidade', icon: BookOpen, permission: ['bankMovements', 'accountTransfers'] },
    { id: 'users', label: 'Usuários', icon: Settings, permission: ['registerUsers', 'systemSettings'] },
    { id: 'logs', label: 'Logs', icon: Activity, permission: 'systemSettings' },
    { id: 'profile', label: 'Meu Perfil', icon: UserIcon },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden print:hidden"
          onClick={onClose}
        ></div>
      )}

      <div className={`w-64 h-screen bg-slate-900 text-white fixed left-0 top-0 flex flex-col shadow-xl z-[70] transition-transform duration-300 lg:translate-x-0 print:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <Pill size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">GUIFARMA <span className="text-emerald-400">SA</span></h1>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.permission) {
              const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
              const userPermissions = user.permissions || ROLE_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS;
              const hasPermission = permissions.some(p => userPermissions[p as keyof typeof userPermissions]);
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
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold uppercase">
                {user.name.slice(0, 2)}
              </div>
            )}
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
    </>
  );
};

export default Sidebar;
