
import React, { useState } from 'react';
import { User, Lock, Save, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileProps {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    employeeName: user.employeeName || user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    // Validação básica
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setNotification({ type: 'error', message: 'As novas senhas não coincidem!' });
        return;
      }
      if (formData.newPassword.length < 6) {
        setNotification({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.' });
        return;
      }
    }

    const updatedUser: UserType = {
      ...user,
      employeeName: formData.employeeName,
      email: formData.email,
      avatarUrl: formData.avatarUrl,
      password: formData.newPassword || user.password
    };

    onUpdateUser(updatedUser);
    setNotification({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        setNotification({ type: 'error', message: 'A imagem deve ter menos de 1MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">MEU <span className="text-emerald-500">PERFIL</span></h1>
        <p className="text-slate-500 font-medium">Gerencie suas informações pessoais e segurança</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card de Informações */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
            <div className="relative group mx-auto mb-4 w-24 h-24">
              {formData.avatarUrl ? (
                <img 
                  src={formData.avatarUrl} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-black">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-[10px] font-bold uppercase">Mudar</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user.employeeName || user.name}</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">{user.role}</p>
            
            <div className="space-y-3 text-left">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status da Conta</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-slate-700">{user.status}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail de Acesso</p>
                <p className="text-sm font-bold text-slate-700 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de Edição */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            {notification && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 animate-fadeIn ${
                notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-bold">{notification.message}</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <User size={18} className="text-emerald-500" />
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm font-medium transition-all"
                    value={formData.employeeName}
                    onChange={e => setFormData({...formData, employeeName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">E-mail</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm font-medium transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Lock size={18} className="text-emerald-500" />
                  Segurança (Alterar Senha)
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-1"
                >
                  {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPasswords ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Nova Senha</label>
                  <input 
                    type={showPasswords ? "text" : "password"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm font-medium transition-all"
                    placeholder="Deixe em branco para manter"
                    value={formData.newPassword}
                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Confirmar Nova Senha</label>
                  <input 
                    type={showPasswords ? "text" : "password"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm font-medium transition-all"
                    placeholder="Repita a nova senha"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic">
                * Se você alterar sua senha, precisará usá-la no próximo login.
              </p>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Save size={18} />
                SALVAR ALTERAÇÕES NO PERFIL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
