
import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History, 
  Lock, 
  Unlock, 
  Plus, 
  Search, 
  Filter, 
  Download,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { CashSession, CashMovement, PaymentMethod, User } from '../types';
import { formatCurrency } from '../constants';

interface CashDeskProps {
  sessions: CashSession[];
  movements: CashMovement[];
  currentUser: User;
  onOpenSession: (openingBalance: number) => void;
  onCloseSession: (closingBalance: number) => void;
  onAddMovement: (movement: Partial<CashMovement>) => void;
}

const CashDesk: React.FC<CashDeskProps> = ({ 
  sessions, 
  movements, 
  currentUser, 
  onOpenSession, 
  onCloseSession, 
  onAddMovement 
}) => {
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState('');
  const [closingBalanceInput, setClosingBalanceInput] = useState('');
  const [movementForm, setMovementForm] = useState({
    type: 'Entrada' as 'Entrada' | 'Saída',
    category: 'Venda',
    description: '',
    amount: '',
    paymentMethod: PaymentMethod.CASH
  });

  const activeSession = useMemo(() => 
    sessions.find(s => s.status === 'Aberto'), 
  [sessions]);

  const currentMovements = useMemo(() => {
    if (!activeSession) return [];
    return movements.filter(m => new Date(m.date) >= new Date(activeSession.openingDate));
  }, [movements, activeSession]);

  const stats = useMemo(() => {
    const opening = activeSession?.openingBalance || 0;
    const inflows = currentMovements.filter(m => m.type === 'Entrada').reduce((sum, m) => sum + m.amount, 0);
    const outflows = currentMovements.filter(m => m.type === 'Saída').reduce((sum, m) => sum + m.amount, 0);
    const expected = opening + inflows - outflows;

    return { opening, inflows, outflows, expected };
  }, [activeSession, currentMovements]);

  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenSession(parseFloat(openingBalanceInput) || 0);
    setIsOpeningModalOpen(false);
    setOpeningBalanceInput('');
  };

  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseSession(parseFloat(closingBalanceInput) || 0);
    setIsClosingModalOpen(false);
    setClosingBalanceInput('');
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMovement({
      type: movementForm.type,
      category: movementForm.category,
      description: movementForm.description,
      amount: parseFloat(movementForm.amount) || 0,
      paymentMethod: movementForm.paymentMethod,
      date: new Date().toISOString()
    });
    setIsMovementModalOpen(false);
    setMovementForm({
      type: 'Entrada',
      category: 'Venda',
      description: '',
      amount: '',
      paymentMethod: PaymentMethod.CASH
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Caixa</h2>
          <p className="text-slate-500 font-medium">Controlo de fluxo financeiro diário e fecho de contas.</p>
        </div>
        <div className="flex gap-4">
          {!activeSession ? (
            <button 
              onClick={() => setIsOpeningModalOpen(true)}
              className="flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all font-black text-sm uppercase tracking-widest"
            >
              <Unlock size={20} />
              Abrir Caixa
            </button>
          ) : (
            <>
              <button 
                onClick={() => setIsMovementModalOpen(true)}
                className="flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all font-black text-sm uppercase tracking-widest"
              >
                <Plus size={20} />
                Lançamento
              </button>
              <button 
                onClick={() => setIsClosingModalOpen(true)}
                className="flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 hover:-translate-y-0.5 transition-all font-black text-sm uppercase tracking-widest"
              >
                <Lock size={20} />
                Fechar Caixa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saldo de Abertura</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.opening)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <ArrowUpCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Entradas</p>
            <p className="text-2xl font-black text-emerald-600">+{formatCurrency(stats.inflows)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
            <ArrowDownCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Saídas</p>
            <p className="text-2xl font-black text-red-600">-{formatCurrency(stats.outflows)}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saldo Esperado</p>
            <p className="text-2xl font-black text-white">{formatCurrency(stats.expected)}</p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase">Em tempo real</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Movimentos Recentes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Movimentações da Sessão</h3>
            <div className="flex gap-2">
              <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600"><Filter size={18} /></button>
              <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600"><Download size={18} /></button>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Hora</th>
                  <th className="px-8 py-5">Tipo</th>
                  <th className="px-8 py-5">Categoria</th>
                  <th className="px-8 py-5">Descrição</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle size={40} className="opacity-20" />
                        <p className="font-medium">Nenhum lançamento nesta sessão.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentMovements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-xs text-slate-500">{new Date(m.date).toLocaleTimeString('pt')}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          m.type === 'Entrada' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{m.category}</span>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-700">{m.description}</td>
                      <td className={`px-8 py-5 text-right font-black ${m.type === 'Entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.type === 'Entrada' ? '+' : '-'}{formatCurrency(m.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Histórico de Sessões */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Histórico de Fechos</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
            {sessions.filter(s => s.status === 'Fechado').slice(0, 5).map(session => (
              <div key={session.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{new Date(session.openingDate).toLocaleDateString('pt')}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Operador: {session.userName}</p>
                  </div>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Fechado</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Saldo Esperado</p>
                    <p className="text-xs font-bold text-slate-700">{formatCurrency(session.expectedBalance || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Saldo Real</p>
                    <p className="text-xs font-bold text-slate-900">{formatCurrency(session.closingBalance || 0)}</p>
                  </div>
                </div>
                {session.closingBalance !== undefined && session.expectedBalance !== undefined && (
                  <div className={`text-[10px] font-black uppercase text-center p-1 rounded-lg ${
                    session.closingBalance === session.expectedBalance ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {session.closingBalance === session.expectedBalance ? 'Caixa Certo' : 
                     session.closingBalance > session.expectedBalance ? `Sobra: ${formatCurrency(session.closingBalance - session.expectedBalance)}` : 
                     `Quebra: ${formatCurrency(session.expectedBalance - session.closingBalance)}`}
                  </div>
                )}
              </div>
            ))}
            {sessions.filter(s => s.status === 'Fechado').length === 0 && (
              <div className="py-10 text-center text-slate-400">
                <History size={32} className="mx-auto opacity-20 mb-2" />
                <p className="text-sm font-medium">Nenhum histórico disponível.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isOpeningModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleOpenSession} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-slideUp">
            <div className="flex items-center gap-3 text-emerald-600">
              <Unlock size={24} />
              <h2 className="text-xl font-black uppercase">Abertura de Caixa</h2>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Inicial em Dinheiro (FCFA)</label>
              <input 
                type="number" 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-2xl text-slate-900"
                placeholder="0.00"
                value={openingBalanceInput}
                onChange={e => setOpeningBalanceInput(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setIsOpeningModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Confirmar Abertura
              </button>
            </div>
          </form>
        </div>
      )}

      {isClosingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCloseSession} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-slideUp">
            <div className="flex items-center gap-3 text-red-600">
              <Lock size={24} />
              <h2 className="text-xl font-black uppercase">Fecho de Caixa</h2>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Saldo Esperado</span>
                <span className="text-lg font-black text-slate-900">{formatCurrency(stats.expected)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Real em Dinheiro (Contagem Física)</label>
              <input 
                type="number" 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-black text-2xl text-slate-900"
                placeholder="0.00"
                value={closingBalanceInput}
                onChange={e => setClosingBalanceInput(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setIsClosingModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Voltar
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Confirmar Fecho
              </button>
            </div>
          </form>
        </div>
      )}

      {isMovementModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleAddMovement} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-slideUp">
            <div className="flex items-center gap-3 text-slate-900">
              <Plus size={24} />
              <h2 className="text-xl font-black uppercase">Novo Lançamento</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 outline-none font-bold"
                  value={movementForm.type}
                  onChange={e => setMovementForm({...movementForm, type: e.target.value as any})}
                >
                  <option value="Entrada">Entrada (+)</option>
                  <option value="Saída">Saída (-)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 outline-none font-bold"
                  value={movementForm.category}
                  onChange={e => setMovementForm({...movementForm, category: e.target.value})}
                >
                  <option value="Venda">Venda</option>
                  <option value="Pagamento Fornecedor">Pagamento Fornecedor</option>
                  <option value="Despesa Administrativa">Despesa Administrativa</option>
                  <option value="Sangria">Sangria</option>
                  <option value="Suprimento">Suprimento</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</label>
              <input 
                type="text" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 outline-none font-medium"
                placeholder="Ex: Pagamento de luz, Venda manual..."
                value={movementForm.description}
                onChange={e => setMovementForm({...movementForm, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor (FCFA)</label>
              <input 
                type="number" 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 outline-none font-black text-xl"
                placeholder="0.00"
                value={movementForm.amount}
                onChange={e => setMovementForm({...movementForm, amount: e.target.value})}
              />
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setIsMovementModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                Confirmar Lançamento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CashDesk;
