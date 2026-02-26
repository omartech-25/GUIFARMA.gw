
import React, { useState } from 'react';
import { Search, Plus, UserPlus, X, Mail, Shield, CheckCircle2, UserCheck, MoreVertical, Lock } from 'lucide-react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    employeeName: '',
    email: '',
    password: '',
    role: UserRole.SELLER
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updatedUser: User = {
        ...editingUser,
        name: formData.name,
        employeeName: formData.employeeName,
        email: formData.email,
        role: formData.role
      };
      onUpdateUser(updatedUser);
    } else {
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: formData.name,
        employeeName: formData.employeeName,
        email: formData.email,
        role: formData.role
      };
      onAddUser(newUser);
    }
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsModalOpen(false);
      setEditingUser(null);
    }, 2000);
    setFormData({ name: '', employeeName: '', email: '', password: '', role: UserRole.SELLER });
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      employeeName: user.employeeName || '',
      email: user.email,
      password: '', // Don't show password
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleNewUserClick = () => {
    setEditingUser(null);
    setFormData({ name: '', employeeName: '', email: '', password: '', role: UserRole.SELLER });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header com Botão Proeminente ao lado do título */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Controle de Acessos</h2>
            <p className="text-slate-500 font-medium">Equipa e permissões de segurança.</p>
          </div>
          
          <button 
            onClick={handleNewUserClick}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200 font-black text-sm uppercase tracking-widest group"
          >
            <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou email..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-5">
              <button className="text-slate-300 hover:text-slate-600 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100 font-black text-xl">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-800 truncate text-lg">{user.employeeName || user.name}</h3>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                  <Mail size={12} />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Nível de Acesso</span>
                <span className={`px-3 py-1 rounded-full font-black uppercase text-[9px] tracking-tighter ${
                  user.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : 
                  user.role === UserRole.STOCK_MANAGER ? 'bg-emerald-100 text-emerald-600' : 
                  'bg-blue-100 text-blue-600'
                }`}>
                  {user.role}
                </span>
              </div>
              
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Acesso Ativo
                </div>
                <button 
                  onClick={() => handleEditClick(user)}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 tracking-widest uppercase"
                >
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Cadastro de Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            {showSuccess ? (
              <div className="p-16 text-center space-y-6 animate-fadeIn">
                <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4 shadow-inner">
                  <CheckCircle2 size={56} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Utilizador Criado!</h3>
                <p className="text-slate-500 font-medium">As credenciais de acesso foram ativadas com sucesso.</p>
              </div>
            ) : (
              <>
                <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
                      {editingUser ? <UserCheck size={24} /> : <UserPlus size={24} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">
                        {editingUser ? 'Editar Perfil' : 'Novo Colaborador'}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {editingUser ? `A alterar dados de ${editingUser.name}` : 'Preencha os dados de acesso corporativo.'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="hover:bg-slate-800 p-3 rounded-2xl text-slate-400 hover:text-white transition-all">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Usuário</label>
                      <input 
                        required 
                        type="text" 
                        autoFocus
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700" 
                        placeholder="Ex: joao.santos"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Funcionário</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700" 
                        placeholder="Ex: João Ferreira Santos"
                        value={formData.employeeName}
                        onChange={e => setFormData({...formData, employeeName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required 
                        type="email" 
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700" 
                        placeholder="usuario@medstock.pro"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          required 
                          type="password" 
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                          placeholder="********"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Função</label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select 
                          required
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-slate-700"
                          value={formData.role}
                          onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                        >
                          {Object.values(UserRole).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="flex-1 py-4 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-4 font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-xl shadow-blue-200 uppercase tracking-widest text-sm"
                    >
                      {editingUser ? 'Salvar Alterações' : 'Criar Acesso'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      {/* Logs de Atividade */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800">Logs de Atividade</h3>
            <p className="text-xs text-slate-400">Registo de alterações críticas no sistema.</p>
          </div>
          <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Ver Tudo</button>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { user: 'Admin', action: 'Alterou preço do Paracetamol', time: 'Há 5 min', type: 'PREÇO' },
            { user: 'Mamadú Baldé', action: 'Entrada de stock: Lote GF-2026-01', time: 'Há 2 horas', type: 'STOCK' },
            { user: 'Fatu Djalo', action: 'Venda realizada: INV-2026-105', time: 'Há 3 horas', type: 'VENDA' },
          ].map((log, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  log.type === 'PREÇO' ? 'bg-amber-500' : log.type === 'STOCK' ? 'bg-blue-500' : 'bg-emerald-500'
                }`}></div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{log.action}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{log.user} • {log.time}</p>
                </div>
              </div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{log.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
