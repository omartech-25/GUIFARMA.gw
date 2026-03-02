
import React, { useState } from 'react';
import { Search, Plus, X, Shield, CheckCircle2, ChevronRight, Save, Trash2, Check } from 'lucide-react';
import { User, UserRole, UserPermissions } from '../types';
import { DEFAULT_PERMISSIONS } from '../constants';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
}

type UserTab = 'details' | 'permissions';

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = useState<UserTab>('details');
  const [selectedUser, setSelectedUser] = useState<User | null>(users[0] || null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    employeeName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.SELLER,
    imageUrl: '',
    permissions: DEFAULT_PERMISSIONS
  });

  React.useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name,
        employeeName: selectedUser.employeeName,
        email: selectedUser.email,
        password: '',
        confirmPassword: '',
        role: selectedUser.role,
        imageUrl: '', // Placeholder
        permissions: selectedUser.permissions || DEFAULT_PERMISSIONS
      });
    } else {
      setFormData({
        name: '',
        employeeName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: UserRole.SELLER,
        imageUrl: '',
        permissions: DEFAULT_PERMISSIONS
      });
    }
  }, [selectedUser]);

  React.useEffect(() => {
    if (successToast?.show) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    if (selectedUser) {
      const updatedUser: User = {
        ...selectedUser,
        name: formData.name,
        employeeName: formData.employeeName,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions
      };
      onUpdateUser(updatedUser);
      setSuccessToast({ show: true, message: 'Usuário atualizado com sucesso!' });
    } else {
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: formData.name,
        employeeName: formData.employeeName,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions
      };
      onAddUser(newUser);
      setSelectedUser(newUser);
      setSuccessToast({ show: true, message: 'Novo usuário criado!' });
    }
  };

  const handleNew = () => {
    setSelectedUser(null);
    setActiveTab('details');
  };

  const handleDelete = () => {
    if (selectedUser && onDeleteUser) {
      if (window.confirm(`Tem certeza que deseja excluir o usuário ${selectedUser.employeeName}?`)) {
        onDeleteUser(selectedUser.id);
        setSelectedUser(users[0] || null);
        setSuccessToast({ show: true, message: 'Usuário excluído com sucesso!' });
      }
    }
  };

  const handleImageUpload = () => {
    const url = window.prompt('Insira a URL da foto do usuário:');
    if (url) {
      setFormData({ ...formData, imageUrl: url });
    }
  };

  const handlePermissionChange = (key: keyof UserPermissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const permissionGroups = [
    {
      title: 'CONFIGURAÇÕES DO SISTEMA',
      permissions: [
        { key: 'systemSettings', label: 'Menu de Configurações' }
      ]
    },
    {
      title: 'CADASTROS',
      permissions: [
        { key: 'registerUsers', label: 'Usuários / Funcionários' },
        { key: 'registerClients', label: 'Clientes' },
        { key: 'registerSuppliers', label: 'Fornecedores' },
        { key: 'registerProducts', label: 'Produtos' },
        { key: 'registerBankAccounts', label: 'Contas Bancárias' },
        { key: 'registerCardMachines', label: 'Máquinas de Cartão' }
      ]
    },
    {
      title: 'CONTROLE DE ESTOQUE',
      permissions: [
        { key: 'stockEntry', label: 'Entrada de Estoque' }
      ]
    },
    {
      title: 'MENU FINANCEIRO',
      permissions: [
        { key: 'cashClosing', label: 'Fechamento de Caixa' },
        { key: 'receiptsCompensations', label: 'Recebimentos / Compensações' },
        { key: 'registerExpenses', label: 'Cadastrar Despesas' },
        { key: 'payExpenses', label: 'Pagar Despesas' },
        { key: 'registerSangriaSuprimento', label: 'Registrar Sangria / Suprimento' },
        { key: 'bankMovements', label: 'Movimentações Bancárias' },
        { key: 'accountTransfers', label: 'Transferência entre Contas' }
      ]
    },
    {
      title: 'MENU VENDAS / FERRAMENTAS',
      permissions: [
        { key: 'sales', label: 'Vendas' },
        { key: 'systemTools', label: 'Ferramentas do Sistema' }
      ]
    },
    {
      title: 'RELATÓRIOS',
      permissions: [
        { key: 'reportsRegistration', label: 'Relatórios Cadastrais' },
        { key: 'reportsFinancial', label: 'Relatórios Financeiros' },
        { key: 'reportsManagement', label: 'Relatórios Gerenciais' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto mb-6">
        {/* Header */}
        <div className="bg-[#C05A5A] text-white py-2 px-6 rounded-t-xl flex justify-between items-center shadow-lg">
          <h1 className="text-sm font-bold uppercase tracking-widest">Usuários</h1>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-x border-slate-200 flex overflow-x-auto">
          {[
            { id: 'details', label: 'Dados Gerais' },
            { id: 'permissions', label: 'Permissões de Acesso' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as UserTab)}
              className={`px-6 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border-r border-slate-100 transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 border-b-2 border-b-[#C05A5A]' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-xl p-8 min-h-[500px]">
          {activeTab === 'details' && (
            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase text-right pr-4">Nome Completo do Usuário:</label>
                  <input 
                    required
                    type="text" 
                    className="col-span-8 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium"
                    placeholder="Digite o nome completo do usuário."
                    value={formData.employeeName}
                    onChange={e => setFormData({...formData, employeeName: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase text-right pr-4">Cargo na Empresa:</label>
                  <select 
                    className="col-span-8 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium appearance-none"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  >
                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase text-right pr-4">Login:</label>
                  <input 
                    required
                    type="text" 
                    className="col-span-8 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium"
                    placeholder="Informe o login para acesso ao sistema"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase text-right pr-4">Senha:</label>
                  <input 
                    type="password" 
                    className="col-span-8 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium"
                    placeholder="********************"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase text-right pr-4">Confirme a Senha:</label>
                  <input 
                    type="password" 
                    className="col-span-8 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium"
                    placeholder="********************"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-4">
                <div className="w-full aspect-square max-w-[250px] bg-slate-100 rounded-3xl border-4 border-slate-200 flex flex-col items-center justify-center text-slate-300 relative overflow-hidden group">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Usuário" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center opacity-20">
                      <div className="w-32 h-32 rounded-full bg-slate-400 mb-4"></div>
                      <p className="text-xs font-black uppercase tracking-widest text-center">Sem Foto</p>
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={handleImageUpload}
                  className="bg-amber-500 text-white px-8 py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-amber-600 transition-all"
                >
                  Selecione a Foto
                </button>
              </div>
            </form>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {permissionGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] flex-1 bg-slate-200"></div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{group.title}</h3>
                      <div className="h-[1px] flex-1 bg-slate-200"></div>
                    </div>
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 space-y-2">
                      {group.permissions.map((perm) => (
                        <button
                          key={perm.key}
                          type="button"
                          onClick={() => handlePermissionChange(perm.key as keyof UserPermissions)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-all group"
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            formData.permissions[perm.key as keyof UserPermissions] 
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' 
                              : 'bg-white border border-slate-200 text-transparent'
                          }`}>
                            <Check size={14} strokeWidth={4} />
                          </div>
                          <span className={`text-xs font-bold transition-colors ${
                            formData.permissions[perm.key as keyof UserPermissions] ? 'text-slate-900' : 'text-slate-400'
                          }`}>
                            {perm.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-4 bg-amber-500 text-white px-16 py-5 rounded-full shadow-2xl hover:bg-amber-600 transition-all font-black text-sm uppercase tracking-widest group"
                >
                  <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Save size={24} />
                  </div>
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-[#F9FAFB] border-x border-b border-slate-200 rounded-b-xl p-6 flex flex-wrap gap-4 items-center justify-between shadow-inner">
          <div className="flex gap-4">
            <button 
              onClick={handleNew}
              className="flex items-center gap-3 bg-amber-500 text-white px-8 py-3 rounded-full shadow-lg hover:bg-amber-600 transition-all font-black text-xs uppercase tracking-widest"
            >
              <Plus size={18} />
              Novo
            </button>
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-3 bg-amber-500 text-white px-8 py-3 rounded-full shadow-lg hover:bg-amber-600 transition-all font-black text-xs uppercase tracking-widest"
            >
              <Search size={18} />
              Localizar
            </button>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleSave}
              className="flex items-center gap-3 bg-amber-500 text-white px-12 py-3 rounded-full shadow-lg hover:bg-amber-600 transition-all font-black text-xs uppercase tracking-widest"
            >
              <Save size={18} />
              Salvar
            </button>
            <button 
              onClick={handleDelete}
              disabled={!selectedUser}
              className="flex items-center gap-3 bg-slate-300 text-slate-500 px-8 py-3 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:hover:bg-slate-300 disabled:hover:text-slate-500"
            >
              <Trash2 size={18} />
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-slideUp">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-sm">Localizar Usuário</h3>
              <button onClick={() => setIsSearchModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome ou login..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto space-y-2">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setIsSearchModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">{user.employeeName}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{user.role} • {user.name}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
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

export default UserManagement;
