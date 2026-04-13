
import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
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
  X,
  Printer,
  Edit,
  Trash2
} from 'lucide-react';
import { formatCurrency } from '@/constants';
import { Sale, Purchase, Product, JournalEntry, User, UserRole, CostCenter } from '../types';

interface AccountingProps {
  sales: Sale[];
  purchases: Purchase[];
  products: Product[];
  journalEntries: JournalEntry[];
  costCenters: CostCenter[];
  currentUser?: User | null;
  onAddJournalEntry: (entry: JournalEntry) => void;
  onUpdateJournalEntry: (entry: JournalEntry) => void;
  onDeleteJournalEntry: (id: string) => void;
  onClearJournalEntries?: () => void;
  onAddCostCenter: (cc: CostCenter) => void;
  onUpdateCostCenter: (cc: CostCenter) => void;
  onDeleteCostCenter: (id: string) => void;
  onClearCostCenters: () => void;
}

const Accounting: React.FC<AccountingProps> = ({ 
  sales = [], 
  purchases = [], 
  products = [], 
  journalEntries = [], 
  costCenters = [],
  currentUser,
  onAddJournalEntry,
  onUpdateJournalEntry,
  onDeleteJournalEntry,
  onClearJournalEntries,
  onAddCostCenter,
  onUpdateCostCenter,
  onDeleteCostCenter,
  onClearCostCenters
}) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'chart' | 'tax' | 'balance' | 'cost_center' | 'regulatory' | 'expenses'>('journal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isCCModalOpen, setIsCCModalOpen] = useState(false);
  const [isCCClearConfirmOpen, setIsCCClearConfirmOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editingCC, setEditingCC] = useState<CostCenter | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [journalFilter, setJournalFilter] = useState<string>('Todos os Diários');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    accountCode: '',
    accountName: '',
    description: '',
    debit: '',
    credit: ''
  });

  const handleOpenModal = (entry?: JournalEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        date: entry.date.split('T')[0],
        reference: entry.reference,
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        description: entry.description,
        debit: entry.debit.toString(),
        credit: entry.credit.toString()
      });
    } else {
      setEditingEntry(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        accountCode: '',
        accountName: '',
        description: '',
        debit: '',
        credit: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleManualEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      const updatedEntry: JournalEntry = {
        ...editingEntry,
        date: formData.date,
        reference: formData.reference,
        accountCode: formData.accountCode,
        accountName: formData.accountName,
        description: formData.description,
        debit: parseFloat(formData.debit) || 0,
        credit: parseFloat(formData.credit) || 0,
        updatedAt: new Date().toISOString()
      };
      onUpdateJournalEntry(updatedEntry);
    } else {
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
    }
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handlePrintEntry = (entry: JournalEntry) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Lançamento Contabilístico - ${entry.reference}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #334155; }
            .header { display: flex; justify-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; }
            .info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { margin-bottom: 10px; }
            .label { font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase; }
            .value { font-size: 16px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .text-right { text-align: right; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; pt: 20px; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">GUIFARMA SA</div>
              <div style="font-size: 12px; font-weight: bold;">Lançamento Contabilístico</div>
            </div>
            <div style="text-align: right">
              <div class="value">${entry.reference}</div>
              <div class="label">Referência</div>
            </div>
          </div>
          
          <div class="info">
            <div class="info-item">
              <div class="label">Data do Lançamento</div>
              <div class="value">${new Date(entry.date).toLocaleDateString('pt')}</div>
            </div>
            <div class="info-item">
              <div class="label">Tipo</div>
              <div class="value">${entry.type}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Conta OHADA</th>
                <th>Descrição</th>
                <th class="text-right">Débito</th>
                <th class="text-right">Crédito</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${entry.accountCode}</strong> - ${entry.accountName}</td>
                <td>${entry.description}</td>
                <td class="text-right font-bold">${entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                <td class="text-right font-bold">${entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Documento gerado em ${new Date().toLocaleString('pt')} por GUIFARMA Sistema de Gestão.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Calculate totals
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalExpenses = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
  const totalIVA_Collected = sales.reduce((sum, s) => {
    const subtotal = s.subtotal || 0;
    const discount = s.discount || 0;
    const iva = s.iva || 0;
    const totalAfterDiscount = subtotal - (subtotal * (discount / 100));
    return sum + (totalAfterDiscount * (iva / 100));
  }, 0);
  const totalIVA_Paid = purchases.reduce((sum, p) => {
    // Assuming 19% IVA on purchases for simplicity if not specified
    return sum + ((p.total || 0) * 0.19); 
  }, 0);

  const netIVA = totalIVA_Collected - totalIVA_Paid;

  const filteredJournalEntries = useMemo(() => {
    if (journalFilter === 'Todos os Diários') return journalEntries;
    return journalEntries.filter(entry => entry.type === journalFilter);
  }, [journalEntries, journalFilter]);

  const expensesBySupplier = useMemo(() => {
    const supplierMap: Record<string, number> = {};
    purchases.forEach(p => {
      const supplierName = p.supplier || 'Desconhecido';
      supplierMap[supplierName] = (supplierMap[supplierName] || 0) + (p.total || 0);
    });
    return Object.entries(supplierMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [purchases]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Contabilidade OHADA</h2>
          <p className="text-slate-500 font-medium">Gestão financeira rigorosa e conformidade fiscal.</p>
        </div>
        <div className="flex gap-3">
          {currentUser?.role === UserRole.ADMIN && (
            <button 
              onClick={() => setIsClearConfirmOpen(true)}
              className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl hover:bg-red-100 transition-all text-sm font-bold shadow-sm"
            >
              <Trash2 size={18} />
              Limpar Diário
            </button>
          )}
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm">
            <Download size={18} />
            Exportar FEC
          </button>
          <button 
            onClick={() => handleOpenModal()}
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
          { id: 'expenses', label: 'Despesas / Fornecedores', icon: ArrowDownLeft },
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
                  <select 
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900"
                    value={journalFilter}
                    onChange={(e) => setJournalFilter(e.target.value)}
                  >
                    <option value="Todos os Diários">Todos os Diários</option>
                    <option value="Venda">Vendas</option>
                    <option value="Compra">Compras</option>
                    <option value="Caixa">Caixa</option>
                    <option value="Manual">Manual</option>
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
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* Journal Entries (Manual + Automatic) */}
                  {filteredJournalEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 text-slate-500">{new Date(entry.date).toLocaleDateString('pt')}</td>
                      <td className="px-8 py-4 font-mono text-[10px] font-bold">{entry.reference}</td>
                      <td className="px-8 py-4 font-bold text-slate-700">{entry.accountCode} - {entry.accountName}</td>
                      <td className="px-8 py-4 text-slate-500">{entry.description}</td>
                      <td className="px-8 py-4 text-right font-bold text-emerald-600">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                      <td className="px-8 py-4 text-right font-bold text-red-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handlePrintEntry(entry)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Imprimir Lançamento"
                          >
                            <Printer size={16} />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(entry)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Editar Lançamento"
                          >
                            <Edit size={16} />
                          </button>
                          {currentUser?.role === UserRole.ADMIN && (
                            <button 
                              onClick={() => {
                                setEntryToDelete(entry);
                                setIsDeleteConfirmOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar Lançamento"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
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
                    <span className="text-emerald-700/60">Base Tributável (19%):</span>
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
                    <span className="text-blue-700/60">Base Tributável (19%):</span>
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
          <div className="p-8 animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Centros de Custo</h3>
                <p className="text-xs text-slate-400">Distribuição orçamental por departamento.</p>
              </div>
              <div className="flex gap-3">
                {currentUser?.role === UserRole.ADMIN && (
                  <button 
                    onClick={() => setIsCCClearConfirmOpen(true)}
                    className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl hover:bg-red-100 transition-all text-sm font-bold shadow-sm"
                  >
                    <Trash2 size={18} />
                    Limpar Todos
                  </button>
                )}
                <button 
                  onClick={() => {
                    setEditingCC(null);
                    setIsCCModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all text-sm font-bold shadow-sm"
                >
                  <Plus size={18} />
                  Novo Centro de Custo
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {costCenters.map(cc => {
                const actual = purchases.reduce((sum, p) => sum + p.total, 0) * (cc.code === 'CC-001' ? 0.7 : cc.code === 'CC-002' ? 0.2 : 0.1); // Placeholder logic
                const percentage = Math.min((actual / cc.budget) * 100, 100);
                
                return (
                  <div key={cc.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingCC(cc);
                          setIsCCModalOpen(true);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => onDeleteCostCenter(cc.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cc.code}</span>
                      <Target className="text-slate-200" size={20} />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-6">{cc.name}</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase">Orçamento:</span>
                        <span className="text-slate-900 font-black">{formatCurrency(cc.budget)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase">Realizado:</span>
                        <span className="text-slate-900 font-black">{formatCurrency(actual)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {costCenters.length === 0 && (
                <div className="col-span-3 py-12 text-center text-slate-400 italic bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  Nenhum centro de custo cadastrado.
                </div>
              )}
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

        {activeTab === 'expenses' && (
          <div className="p-8 animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Despesas por Fornecedor</h3>
                <p className="text-xs text-slate-400">Visualização do total de compras acumulado por cada fornecedor.</p>
              </div>
              <div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl border border-red-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total em Compras</p>
                <p className="text-2xl font-black">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>

            <div className="h-[400px] w-full min-h-[400px] bg-slate-50 p-6 rounded-[32px] border border-slate-100">
              {expensesBySupplier.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart
                    data={expensesBySupplier}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      type="number" 
                      hide 
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '16px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Total Gasto']}
                    />
                    <Bar 
                      dataKey="total" 
                      radius={[0, 8, 8, 0]} 
                      barSize={32}
                    >
                      {expensesBySupplier.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0f172a' : '#334155'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <ArrowDownLeft size={32} />
                  </div>
                  <p className="font-bold">Nenhuma compra registada para análise.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {expensesBySupplier.slice(0, 4).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      0{index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Fornecedor</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">{formatCurrency(item.total)}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">
                      {((item.total / totalExpenses) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="p-8 animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Balancete de Verificação (Provisório)</h3>
                <p className="text-xs text-slate-400">Resumo de saldos por conta OHADA até à data atual.</p>
              </div>
              <button 
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  
                  const trialBalance = Object.values(journalEntries.reduce((acc: any, entry) => {
                    if (!acc[entry.accountCode]) {
                      acc[entry.accountCode] = { 
                        code: entry.accountCode, 
                        name: entry.accountName, 
                        debit: 0, 
                        credit: 0 
                      };
                    }
                    acc[entry.accountCode].debit += entry.debit;
                    acc[entry.accountCode].credit += entry.credit;
                    return acc;
                  }, {}));

                  const html = `
                    <html>
                      <head>
                        <title>Balancete Provisório - GUIFARMA SA</title>
                        <style>
                          body { font-family: sans-serif; padding: 40px; color: #1e293b; }
                          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                          h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                          th { background: #f8fafc; text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; }
                          td { padding: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
                          .text-right { text-align: right; }
                          .font-bold { font-weight: bold; }
                          .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>GUIFARMA SA</h1>
                          <p>Balancete de Verificação Provisório</p>
                          <p>Data: ${new Date().toLocaleDateString('pt')}</p>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>Conta</th>
                              <th>Descrição</th>
                              <th class="text-right">Débito</th>
                              <th class="text-right">Crédito</th>
                              <th class="text-right">Saldo Devedor</th>
                              <th class="text-right">Saldo Credor</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${trialBalance.map((acc: any) => {
                              const balance = acc.debit - acc.credit;
                              return `
                                <tr>
                                  <td class="font-bold">${acc.code}</td>
                                  <td>${acc.name}</td>
                                  <td class="text-right">${formatCurrency(acc.debit)}</td>
                                  <td class="text-right">${formatCurrency(acc.credit)}</td>
                                  <td class="text-right font-bold text-emerald-600">${balance > 0 ? formatCurrency(balance) : '-'}</td>
                                  <td class="text-right font-bold text-red-600">${balance < 0 ? formatCurrency(Math.abs(balance)) : '-'}</td>
                                </tr>
                              `;
                            }).join('')}
                          </tbody>
                        </table>
                        <div class="footer">Documento gerado automaticamente pelo sistema MedStock Pro.</div>
                        <script>window.print();</script>
                      </body>
                    </html>
                  `;
                  printWindow.document.write(html);
                  printWindow.document.close();
                }}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
              >
                <Printer size={18} />
                Imprimir Balancete
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-3xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-8 py-4">Conta</th>
                    <th className="px-8 py-4">Descrição</th>
                    <th className="px-8 py-4 text-right">Débito</th>
                    <th className="px-8 py-4 text-right">Crédito</th>
                    <th className="px-8 py-4 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Object.values(journalEntries.reduce((acc: any, entry) => {
                    if (!acc[entry.accountCode]) {
                      acc[entry.accountCode] = { 
                        code: entry.accountCode, 
                        name: entry.accountName, 
                        debit: 0, 
                        credit: 0 
                      };
                    }
                    acc[entry.accountCode].debit += entry.debit;
                    acc[entry.accountCode].credit += entry.credit;
                    return acc;
                  }, {})).map((acc: any) => {
                    const balance = acc.debit - acc.credit;
                    return (
                      <tr key={acc.code} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 font-mono font-bold text-blue-600">{acc.code}</td>
                        <td className="px-8 py-4 font-bold text-slate-700">{acc.name}</td>
                        <td className="px-8 py-4 text-right text-emerald-600 font-medium">{formatCurrency(acc.debit)}</td>
                        <td className="px-8 py-4 text-right text-red-600 font-medium">{formatCurrency(acc.credit)}</td>
                        <td className={`px-8 py-4 text-right font-black ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {formatCurrency(balance)}
                        </td>
                      </tr>
                    );
                  })}
                  {journalEntries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">
                        Nenhum lançamento contabilístico para gerar o balancete.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                <h3 className="text-lg font-bold">
                  {editingEntry ? 'Editar Lançamento' : 'Novo Lançamento Manual'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingEntry(null);
                }} 
                className="hover:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualEntrySubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-sm"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Referência</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: DOC-2024-001"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-sm"
                    value={formData.reference}
                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código Conta</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: 521"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-sm"
                    value={formData.accountCode}
                    onChange={e => setFormData({ ...formData, accountCode: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Conta</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Bancos"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-sm"
                    value={formData.accountName}
                    onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</label>
                <input 
                  type="text" 
                  required
                  placeholder="Descreva a operação..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-sm"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Débito</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-700 text-sm"
                    value={formData.debit}
                    onChange={e => setFormData({ ...formData, debit: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Crédito</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="w-full p-3 bg-red-50 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-red-700 text-sm"
                    value={formData.credit}
                    onChange={e => setFormData({ ...formData, credit: e.target.value })}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg mt-4"
              >
                {editingEntry ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && entryToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center space-y-6 animate-slideUp">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-red-100/50">
              <Trash2 size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Eliminar Lançamento</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Tem certeza que deseja eliminar o lançamento <span className="font-bold text-slate-900">{entryToDelete.reference}</span>? 
                Esta ação é irreversível e pode afetar os balanços contabilísticos.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  onDeleteJournalEntry(entryToDelete.id);
                  setIsDeleteConfirmOpen(false);
                  setEntryToDelete(null);
                }}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
              >
                Sim, Eliminar Definitivamente
              </button>
              <button 
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setEntryToDelete(null);
                }}
                className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-8 text-center space-y-6">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-600">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase">Limpar Diário Geral</h3>
                <p className="text-slate-500">
                  Tem certeza que deseja remover <span className="font-bold text-red-600">TODOS</span> os lançamentos contabilísticos? 
                  Esta ação é irreversível e afetará os relatórios financeiros.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="flex-1 py-4 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    onClearJournalEntries?.();
                    setIsClearConfirmOpen(false);
                  }}
                  className="flex-1 py-4 font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all shadow-xl shadow-red-200"
                >
                  Confirmar Limpeza
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cost Center Modal */}
      {isCCModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {editingCC ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
              </h3>
              <button onClick={() => setIsCCModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const cc: CostCenter = {
                id: editingCC?.id || `cc-${Date.now()}`,
                name: formData.get('name') as string,
                code: formData.get('code') as string,
                budget: Number(formData.get('budget')),
              };
              if (editingCC) onUpdateCostCenter(cc);
              else onAddCostCenter(cc);
              setIsCCModalOpen(false);
            }} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código</label>
                  <input 
                    name="code"
                    defaultValue={editingCC?.code}
                    required
                    placeholder="Ex: CC-001"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orçamento (FCFA)</label>
                  <input 
                    name="budget"
                    type="number"
                    defaultValue={editingCC?.budget}
                    required
                    placeholder="0"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome do Departamento</label>
                <input 
                  name="name"
                  defaultValue={editingCC?.name}
                  required
                  placeholder="Ex: Logística"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-900 font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                {editingCC ? 'Salvar Alterações' : 'Criar Centro de Custo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CC Clear Confirmation Modal */}
      {isCCClearConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-8 text-center space-y-6">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-600">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase">Limpar Centros de Custo</h3>
                <p className="text-slate-500">
                  Tem certeza que deseja remover <span className="font-bold text-red-600">TODOS</span> os centros de custo?
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsCCClearConfirmOpen(false)}
                  className="flex-1 py-4 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    onClearCostCenters?.('all');
                    setIsCCClearConfirmOpen(false);
                  }}
                  className="flex-1 py-4 font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all shadow-xl shadow-red-200"
                >
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

export default Accounting;
