
import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Filter, 
  Plus,
  Calculator,
  Building2,
  Scale,
  ShieldCheck,
  History,
  AlertTriangle,
  Undo2,
  Target,
  X
} from 'lucide-react';
import { formatCurrency } from '../constants';
import { Sale, Purchase, Product, JournalEntry } from '../types';

interface AccountingProps {
  sales: Sale[];
  purchases: Purchase[];
  products: Product[];
  journalEntries: JournalEntry[];
  onAddJournalEntry: (entry: JournalEntry) => void;
}

const Accounting: React.FC<AccountingProps> = ({ sales, purchases, products, journalEntries, onAddJournalEntry }) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'chart' | 'tax' | 'balance' | 'cost_center' | 'regulatory'>('journal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    accountCode: '',
    accountName: '',
    description: '',
    debit: '',
    credit: ''
  });

  const handleManualEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: JournalEntry = {
      id: `manual-${Date.now()}`,
      date: formData.date,
      reference: formData.reference,
      accountCode: formData.accountCode,
      accountName: formData.accountName,
      description: formData.description,
      debit: parseFloat(formData.debit) || 0,
      credit: parseFloat(formData.credit) || 0,
      type: 'Manual',
      createdAt: new Date().toISOString()
    };
    onAddJournalEntry(newEntry);
    setIsModalOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      accountCode: '',
      accountName: '',
      description: '',
      debit: '',
      credit: ''
    });
  };

  // Calculate totals
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalIVA_Collected = sales.reduce((sum, s) => {
    const totalAfterDiscount = s.subtotal - (s.subtotal * (s.discount / 100));
    return sum + (totalAfterDiscount * (s.iva / 100));
  }, 0);
  const totalIVA_Paid = purchases.reduce((sum, p) => {
    // Assuming 18% IVA on purchases for simplicity if not specified
    return sum + (p.total * 0.18); 
  }, 0);

  const netIVA = totalIVA_Collected - totalIVA_Paid;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Contabilidade OHADA</h2>
          <p className="text-slate-500 font-medium">Gestão financeira rigorosa e conformidade fiscal.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm">
            <Download size={18} />
            Exportar FEC
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all text-sm font-bold shadow-lg"
          >
            <Plus size={18} />
            Lançamento Manual
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receita Bruta</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
            <ArrowDownLeft size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Despesas / Compras</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Calculator size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IVA a Pagar (Net)</p>
            <p className={`text-2xl font-black ${netIVA > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatCurrency(Math.abs(netIVA))}
              <span className="text-[10px] ml-1 uppercase">{netIVA > 0 ? 'A Pagar' : 'Crédito'}</span>
            </p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
            <Scale size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400">Resultado Líquido</p>
            <p className="text-2xl font-black text-white">{formatCurrency(totalRevenue - totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'journal', label: 'Diário Geral', icon: BookOpen },
          { id: 'chart', label: 'Plano de Contas', icon: Building2 },
          { id: 'tax', label: 'Impostos / IVA', icon: FileText },
          { id: 'cost_center', label: 'Centros de Custo', icon: Target },
          { id: 'regulatory', label: 'Controlo Regulatório', icon: ShieldCheck },
          { id: 'balance', label: 'Balanço', icon: PieChart },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${
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

      {/* Tab Content */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'journal' && (
          <div className="animate-fadeIn">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Lançamentos Recentes</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900">
                    <option>Todos os Diários</option>
                    <option>Vendas</option>
                    <option>Compras</option>
                    <option>Caixa</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-8 py-4">Data</th>
                    <th className="px-8 py-4">Referência</th>
                    <th className="px-8 py-4">Conta OHADA</th>
                    <th className="px-8 py-4">Descrição</th>
                    <th className="px-8 py-4 text-right">Débito</th>
                    <th className="px-8 py-4 text-right">Crédito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* Journal Entries (Manual + Automatic) */}
                  {journalEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 text-slate-500">{new Date(entry.date).toLocaleDateString('pt')}</td>
                      <td className="px-8 py-4 font-mono text-[10px] font-bold">{entry.reference}</td>
                      <td className="px-8 py-4 font-bold text-slate-700">{entry.accountCode} - {entry.accountName}</td>
                      <td className="px-8 py-4 text-slate-500">{entry.description}</td>
                      <td className="px-8 py-4 text-right font-bold text-emerald-600">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                      <td className="px-8 py-4 text-right font-bold text-red-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="p-8 animate-fadeIn">
            <h3 className="font-bold text-slate-800 mb-6">Plano de Contas (SYSCOHADA)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classe 4: Terceiros</h4>
                <div className="space-y-2">
                  {[
                    { code: '401', name: 'Fornecedores', balance: totalExpenses },
                    { code: '411', name: 'Clientes', balance: totalRevenue },
                    { code: '443', name: 'Estado, IVA Facturado', balance: totalIVA_Collected },
                    { code: '445', name: 'Estado, IVA Recuperável', balance: totalIVA_Paid },
                  ].map(acc => (
                    <div key={acc.code} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-blue-600">{acc.code}</span>
                        <span className="font-bold text-slate-700">{acc.name}</span>
                      </div>
                      <span className="font-black text-slate-900">{formatCurrency(acc.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classe 7: Receitas</h4>
                <div className="space-y-2">
                  {[
                    { code: '701', name: 'Vendas de Mercadorias', balance: totalRevenue },
                    { code: '707', name: 'Produtos Acessórios', balance: 0 },
                  ].map(acc => (
                    <div key={acc.code} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-emerald-600">{acc.code}</span>
                        <span className="font-bold text-slate-700">{acc.name}</span>
                      </div>
                      <span className="font-black text-slate-900">{formatCurrency(acc.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="p-8 animate-fadeIn space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="font-bold text-slate-800">Apuração de IVA</h3>
                <p className="text-xs text-slate-400">Resumo de impostos para declaração mensal.</p>
              </div>
              <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IVA Líquido a Pagar</p>
                <p className="text-2xl font-black">{formatCurrency(netIVA)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-emerald-900 uppercase tracking-tighter">IVA Facturado (Vendas)</h4>
                  <ArrowUpRight className="text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700/60">Base Tributável (18%):</span>
                    <span className="font-bold text-emerald-900">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black text-emerald-900 pt-4 border-t border-emerald-200">
                    <span>Total IVA:</span>
                    <span>{formatCurrency(totalIVA_Collected)}</span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-blue-900 uppercase tracking-tighter">IVA Dedutível (Compras)</h4>
                  <ArrowDownLeft className="text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700/60">Base Tributável (18%):</span>
                    <span className="font-bold text-blue-900">{formatCurrency(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black text-blue-900 pt-4 border-t border-blue-200">
                    <span>Total IVA:</span>
                    <span>{formatCurrency(totalIVA_Paid)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cost_center' && (
          <div className="p-8 animate-fadeIn space-y-6">
            <h3 className="font-bold text-slate-800">Centros de Custo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Armazém Central', code: 'CC-001', budget: 5000000, actual: totalExpenses * 0.7 },
                { name: 'Logística / Entregas', code: 'CC-002', budget: 1000000, actual: totalExpenses * 0.2 },
                { name: 'Administrativo', code: 'CC-003', budget: 500000, actual: totalExpenses * 0.1 },
              ].map(cc => (
                <div key={cc.code} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cc.code}</span>
                    <Target size={16} className="text-slate-300" />
                  </div>
                  <h4 className="font-bold text-slate-800">{cc.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Orçamento:</span>
                      <span className="font-bold">{formatCurrency(cc.budget)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Realizado:</span>
                      <span className="font-bold">{formatCurrency(cc.actual)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cc.actual > cc.budget ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min((cc.actual / cc.budget) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'regulatory' && (
          <div className="p-8 animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Controlo Regulatório Farmacêutico</h3>
                <p className="text-xs text-slate-400">Monitorização de medicamentos controlados e conformidade.</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-amber-100">
                  <AlertTriangle size={16} />
                  Alertas de Validade
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Medicamentos Controlados
                </h4>
                <div className="space-y-2">
                  {products.filter(p => p.isControlled).map(p => (
                    <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase">{p.code}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Psicotrópico</span>
                    </div>
                  ))}
                  {products.filter(p => p.isControlled).length === 0 && (
                    <p className="text-xs text-slate-400 italic">Nenhum medicamento controlado registado.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} className="text-blue-500" />
                  Histórico de Movimentação por Lote
                </h4>
                <div className="space-y-2">
                  {sales.slice(0, 3).map(s => (
                    <div key={s.id} className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{s.invoiceNumber}</span>
                        <span className="text-slate-400">{new Date(s.date).toLocaleDateString('pt')}</span>
                      </div>
                      <p className="text-slate-500">Saída para: {s.clientName}</p>
                      <div className="flex gap-2 pt-1">
                        {s.items.map((item, i) => (
                          <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[9px] font-mono">
                            Lote: {item.batchNumber} ({item.quantity} un)
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-4">
                <h4 className="font-black text-amber-900 uppercase tracking-tighter flex items-center gap-2">
                  <AlertTriangle size={18} />
                  ⚠️ Campos Críticos de Rastreabilidade
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    'Número de lote (Obrigatório)',
                    'Data de validade (Obrigatório)',
                    'Licença do cliente e fornecedor',
                    'IVA correto (SYSCOHADA)',
                    'Rastreabilidade total do produto',
                    'Registo de devoluções'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-amber-800">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="p-12 text-center space-y-4 animate-fadeIn">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <PieChart size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Balanço Patrimonial OHADA</h3>
            <p className="text-slate-500 max-w-md mx-auto">O balanço completo requer o fecho do exercício. Pode visualizar o balancete provisório exportando o ficheiro FEC.</p>
            <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
              Gerar Balancete Provisório
            </button>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-lg font-bold">Novo Lançamento Manual</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualEntrySubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Referência / Doc</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                    placeholder="Ex: REC-001"
                    value={formData.reference}
                    onChange={e => setFormData({...formData, reference: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conta (Código)</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono" 
                    placeholder="Ex: 521"
                    value={formData.accountCode}
                    onChange={e => setFormData({...formData, accountCode: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Conta</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                    placeholder="Ex: Banco BAO"
                    value={formData.accountName}
                    onChange={e => setFormData({...formData, accountName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Lançamento</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                  placeholder="Ex: Pagamento de renda mensal"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Débito (FCFA)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-600" 
                    placeholder="0"
                    value={formData.debit}
                    onChange={e => setFormData({...formData, debit: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crédito (FCFA)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-red-600" 
                    placeholder="0"
                    value={formData.credit}
                    onChange={e => setFormData({...formData, credit: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-4 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all shadow-xl shadow-slate-200"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
