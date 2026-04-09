
import React, { useState } from 'react';
import { Search, Plus, X, Shield, CheckCircle2, ChevronRight, Save, Trash2, Check, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { User, UserRole, UserPermissions } from '../types';
import { DEFAULT_PERMISSIONS, ROLE_PERMISSIONS } from '../constants';

interface UserManagementProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
}

type UserTab = 'list' | 'details' | 'permissions';

const UserManagement: React.FC<UserManagementProps> = ({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = useState<UserTab>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(users[0] || null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string } | null>(null);
  const [errorToast, setErrorToast] = useState<{ show: boolean; message: string } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isImageUrlModalOpen, setIsImageUrlModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    employeeName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.SELLER,
    status: 'Ativo' as 'Ativo' | 'Inativo',
    avatarUrl: '',
    permissions: ROLE_PERMISSIONS[UserRole.SELLER]
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
        status: selectedUser.status || 'Ativo',
        avatarUrl: selectedUser.avatarUrl || '',
        permissions: selectedUser.permissions || ROLE_PERMISSIONS[selectedUser.role]
      });
    } else {
      setFormData({
        name: '',
        employeeName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: UserRole.SELLER,
        status: 'Ativo',
        avatarUrl: '',
        permissions: ROLE_PERMISSIONS[UserRole.SELLER]
      });
    }
  }, [selectedUser]);

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: ROLE_PERMISSIONS[role]
    }));
  };

  React.useEffect(() => {
    if (successToast?.show) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  React.useEffect(() => {
    if (errorToast?.show) {
      const timer = setTimeout(() => setErrorToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        setErrorToast({ show: true, message: 'A imagem deve ter menos de 1MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorToast({ show: true, message: 'As senhas não coincidem!' });
      return;
    }

    if (selectedUser) {
      const updatedUser: User = {
        ...selectedUser,
        name: formData.name,
        employeeName: formData.employeeName,
        email: formData.email,
        password: formData.password || selectedUser.password,
        role: formData.role,
        status: formData.status,
        avatarUrl: formData.avatarUrl,
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
        password: formData.password,
        role: formData.role,
        status: formData.status,
        avatarUrl: formData.avatarUrl,
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
    if (currentUser?.role !== UserRole.ADMIN) {
      setErrorToast({ show: true, message: 'Apenas administradores podem excluir usuários.' });
      return;
    }
    if (selectedUser && onDeleteUser) {
      setUserToDelete(selectedUser);
      setIsDeleteConfirmOpen(true);
    }
  };

  const confirmDelete = () => {
    if (userToDelete && onDeleteUser) {
      // Proteger usuários mestres do sistema
      const masterUserIds = ['u1', 'u2', 'u3', 'u4'];
      if (masterUserIds.includes(userToDelete.id)) {
        setErrorToast({ show: true, message: 'Usuários mestres do sistema não podem ser excluídos.' });
        setIsDeleteConfirmOpen(false);
        return;
      }

      onDeleteUser(userToDelete.id);
      setSelectedUser(users[0] || null);
      setSuccessToast({ show: true, message: 'Usuário excluído com sucesso!' });
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 1024 * 1024) {
          setErrorToast({ show: true, message: 'A imagem deve ter menos de 1MB.' });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const saveImageUrl = () => {
    setFormData({ ...formData, imageUrl: imageUrlInput });
    setIsImageUrlModalOpen(false);
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
        { key: 'viewStock', label: 'Ver Estoque' },
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
        </div>

        {/* Toolbar */}
        <div className="bg-white border-x border-slate-200 p-4 flex flex-wrap gap-4 items-center shadow-sm">
          <div className="flex gap-2">
            <button 
              onClick={handleNew}
              className="bg-amber-500 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 transition-all shadow-md"
            >
              <Plus size={16} />
              Novo
            </button>
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="bg-amber-500 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 transition-all shadow-md"
            >
              <Search size={16} />
              Localizar
            </button>
          </div>
          
          {/* Search Bar in Toolbar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-amber-500 outline-none text-[10px] font-bold uppercase tracking-wider"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleSave()}
              className="bg-amber-500 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 transition-all shadow-md"
            >
              <Save size={16} />
              Salvar
            </button>
            {currentUser?.role === UserRole.ADMIN && (
              <button 
                onClick={handleDelete}
                disabled={!selectedUser}
                className="bg-slate-200 text-slate-600 px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-300 transition-all shadow-md disabled:opacity-50"
              >
                <Trash2 size={16} />
                Excluir
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-x border-slate-200 flex overflow-x-auto">
          {[
            { id: 'list', label: 'Lista de Usuários' },
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
          {activeTab === 'list' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="pb-4 px-4">Usuário</th>
                      <th className="pb-4 px-4">Login</th>
                      <th className="pb-4 px-4">Cargo</th>
                      <th className="pb-4 px-4">Email</th>
                      <th className="pb-4 px-4">Status</th>
                      <th className="pb-4 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img 
                                src={user.avatarUrl} 
                                alt="Avatar" 
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-slate-900">{user.employeeName || user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-500">{user.name}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500">{user.email}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${user.status === 'Ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {user.status || 'Ativo'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setActiveTab('details');
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <ChevronRight size={18} />
                            </button>
                            {currentUser?.role === UserRole.ADMIN && (
                              <button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  handleDelete();
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-300 italic">Nenhum usuário encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                    onChange={e => handleRoleChange(e.target.value as UserRole)}
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
                  <label className="col-span-4 text-[11px] font-bold text-slate-500 uppercase text-right pr-4">Status da Conta:</label>
                  <div className="col-span-8 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, status: 'Ativo'})}
                      className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${formData.status === 'Ativo' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      ATIVO
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, status: 'Inativo'})}
                      className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${formData.status === 'Inativo' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      INATIVO
                    </button>
                  </div>
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
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Usuário" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
            </div>
          )}
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

      {/* Error Toast */}
      {errorToast?.show && (
        <div className="fixed bottom-8 right-8 z-[300] animate-slideUp">
          <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-red-400">
            <AlertTriangle size={24} />
            <div>
              <p className="font-black text-sm uppercase tracking-tighter">ERRO</p>
              <p className="text-red-50 text-xs">{errorToast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slideUp">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Excluir Usuário</h3>
            <p className="text-slate-500 text-center mb-8">
              Tem certeza que deseja excluir o usuário <span className="font-bold text-slate-800">{userToDelete.employeeName}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image URL Modal */}
      {isImageUrlModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slideUp">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ImageIcon size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Foto do Usuário</h3>
            <p className="text-slate-500 text-center mb-6 text-sm">
              Insira a URL da foto para o usuário <span className="font-bold text-slate-800">{formData.employeeName || 'Novo Usuário'}</span>.
            </p>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-8"
              placeholder="https://exemplo.com/foto.jpg"
              value={imageUrlInput}
              onChange={e => setImageUrlInput(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsImageUrlModalOpen(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={saveImageUrl}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
