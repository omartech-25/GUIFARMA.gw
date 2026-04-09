
import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Calendar,
  User as UserIcon,
  Activity,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { ActivityLog, ActivityType, UserRole, User } from '../types';

interface LogManagementProps {
  logs: ActivityLog[];
  currentUser: User | null;
  onClearLogs: (thresholdDate: string) => Promise<void>;
  isSyncing: boolean;
}

const LogManagement: React.FC<LogManagementProps> = ({ logs = [], currentUser, onClearLogs, isSyncing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearThreshold, setClearThreshold] = useState('30'); // days

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || log.type === typeFilter;
      const matchesRole = roleFilter === 'all' || log.userRole === roleFilter;

      return matchesSearch && matchesType && matchesRole;
    });
  }, [logs, searchTerm, typeFilter, roleFilter]);

  const handleClearMonth = async () => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    const thresholdDate = date.toISOString();
    
    if (window.confirm('Deseja realmente limpar todos os logs anteriores ao início deste mês?')) {
      try {
        await onClearLogs(thresholdDate);
      } catch (error) {
        console.error('Erro ao limpar logs do mês:', error);
      }
    }
  };

  const handleClear = async () => {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(clearThreshold));
    const thresholdDate = date.toISOString();
    
    try {
      await onClearLogs(thresholdDate);
      setIsClearModalOpen(false);
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
    }
  };

  const getLogIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.LOGIN: return <CheckCircle2 className="text-emerald-500" size={16} />;
      case ActivityType.LOGOUT: return <XCircle className="text-slate-400" size={16} />;
      case ActivityType.CREATE: return <Activity className="text-blue-500" size={16} />;
      case ActivityType.UPDATE: return <RefreshCw className="text-amber-500" size={16} />;
      case ActivityType.DELETE: return <Trash2 className="text-red-500" size={16} />;
      case ActivityType.SALE: return <CheckCircle2 className="text-emerald-600" size={16} />;
      default: return <Activity className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Histórico do Sistema</h2>
          <p className="text-slate-500 font-medium">Monitorização de todas as atividades e auditoria.</p>
        </div>
        <div className="flex gap-3">
          {currentUser?.permissions?.systemTools && (
            <button 
              onClick={handleClearMonth}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm"
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              Reiniciar Mês
            </button>
          )}
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm">
            <Download size={18} />
            Exportar CSV
          </button>
          {currentUser?.role === UserRole.ADMIN && (
            <button 
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-all text-sm font-bold border border-red-100"
            >
              <Trash2 size={18} />
              Reiniciar Atividades
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Pesquisar atividades..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm appearance-none"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Todos os Tipos</option>
            {Object.values(ActivityType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm appearance-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos os Cargos</option>
            {Object.values(UserRole).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 px-4">
          <p className="text-xs font-bold text-slate-500">
            Mostrando <span className="text-slate-900">{filteredLogs.length}</span> de <span className="text-slate-900">{logs.length}</span> registos
          </p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-8 py-4">Data e Hora</th>
                <th className="px-8 py-4">Utilizador</th>
                <th className="px-8 py-4">Tipo</th>
                <th className="px-8 py-4">Ação</th>
                <th className="px-8 py-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-300" />
                      <span className="text-slate-500 font-medium">
                        {new Date(log.timestamp).toLocaleString('pt')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black text-[10px]">
                        {log.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{log.userName}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{log.userRole}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      {getLogIcon(log.type)}
                      <span className="font-bold text-slate-700">{log.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 font-medium text-slate-600">{log.action}</td>
                  <td className="px-8 py-4">
                    <p className="text-xs text-slate-400 max-w-xs truncate" title={log.details}>
                      {log.details || '-'}
                    </p>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <History size={32} />
                      </div>
                      <p className="font-bold">Nenhum registo encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear Logs Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Reiniciar Atividades?</h3>
                <p className="text-slate-500 font-medium mt-2">
                  Esta ação irá remover os registos de atividade antigos para libertar espaço e manter o sistema rápido.
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">
                  Manter registos dos últimos:
                </label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-slate-700"
                  value={clearThreshold}
                  onChange={(e) => setClearThreshold(e.target.value)}
                >
                  <option value="0">Limpar Tudo (Reiniciar Sistema)</option>
                  <option value="1">Manter apenas hoje</option>
                  <option value="7">Manter última semana</option>
                  <option value="30">Manter último mês (Recomendado)</option>
                  <option value="90">Manter últimos 3 meses</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsClearModalOpen(false)}
                  className="flex-1 py-4 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleClear}
                  disabled={isSyncing}
                  className="flex-1 py-4 font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  Confirmar Limpeza
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogManagement;
