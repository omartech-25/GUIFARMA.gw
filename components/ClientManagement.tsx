
import React, { useState } from 'react';
import { Search, Plus, Users, X, Phone, ShieldCheck, MapPin, CheckCircle2, Save, Trash2 } from 'lucide-react';
import { Client, User, UserRole } from '../types';
import { formatCurrency } from '../constants';

interface ClientManagementProps {
  clients: Client[];
  currentUser?: User | null;
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ 
  clients, 
  currentUser, 
  onAddClient,
  onUpdateClient,
  onDeleteClient
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    technicalResponsible: '',
    type: 'Farmácia' as const,
    contact: '',
    address: '',
    region: 'Bissau',
    creditLimit: '',
    paymentTerm: '30',
    discountTier: 'Normal' as 'Normal' | 'Silver' | 'Gold'
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.contact.includes(searchTerm) ||
    c.nif.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedClient) {
      const updatedClient: Client = {
        ...selectedClient,
        name: formData.name,
        nif: formData.nif,
        technicalResponsible: formData.technicalResponsible,
        type: formData.type,
        contact: formData.contact,
        address: formData.address,
        region: formData.region,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        paymentTerm: parseInt(formData.paymentTerm) || 0,
        discountTier: formData.discountTier
      };
      onUpdateClient(updatedClient);
    } else {
      const newClient: Client = {
        id: `c-${Date.now()}`,
        name: formData.name,
        nif: formData.nif,
        technicalResponsible: formData.technicalResponsible,
        type: formData.type,
        contact: formData.contact,
        address: formData.address,
        region: formData.region,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        balance: 0,
        paymentTerm: parseInt(formData.paymentTerm) || 0,
        discountTier: formData.discountTier
      };
      onAddClient(newClient);
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsModalOpen(false);
      setSelectedClient(null);
    }, 2000);
    
    setFormData({ 
      name: '', 
      nif: '', 
      technicalResponsible: '', 
      type: 'Farmácia', 
      contact: '', 
      address: '', 
      region: 'Bissau',
      creditLimit: '', 
      paymentTerm: '30',
      discountTier: 'Normal'
    });
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      nif: client.nif,
      technicalResponsible: client.technicalResponsible,
      type: client.type,
      contact: client.contact,
      address: client.address,
      region: client.region,
      creditLimit: client.creditLimit.toString(),
      paymentTerm: client.paymentTerm.toString(),
      discountTier: client.discountTier || 'Normal'
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      onDeleteClient(clientToDelete.id);
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-0 animate-fadeIn max-w-6xl mx-auto">
      <div className="bg-[#10B981] text-white py-2 px-6 rounded-t-xl flex justify-between items-center shadow-lg">
        <h1 className="text-sm font-bold uppercase tracking-widest">Cadastro de Clientes</h1>
      </div>

      <div className="bg-white border-x border-slate-200 p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setSelectedClient(null);
              setFormData({ 
                name: '', 
                nif: '', 
                technicalResponsible: '', 
                type: 'Farmácia', 
                contact: '', 
                address: '', 
                region: 'Bissau',
                creditLimit: '', 
                paymentTerm: '30',
                discountTier: 'Normal'
              });
              setIsModalOpen(true);
            }}
            className="bg-amber-500 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 transition-all shadow-md"
          >
            <Plus size={16} />
            Novo
          </button>
        </div>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-amber-500 outline-none text-[10px] font-bold uppercase tracking-wider"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-xl p-8 min-h-[500px] border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Nome / NIF</th>
              <th className="px-6 py-4">Responsável Técnico</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Endereço / Contacto</th>
              <th className="px-6 py-4">Limite / Prazo</th>
              <th className="px-6 py-4">Dívida Atual</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{client.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">NIF: {client.nif}</p>
                  {client.createdBy && (
                    <p className="text-[8px] text-slate-300 font-bold uppercase mt-1">Criado por: {client.createdBy}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">{client.technicalResponsible}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                    client.type === 'Farmácia' ? 'bg-blue-100 text-blue-600' : 
                    client.type === 'Hospital' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {client.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-slate-700">{client.address}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{client.region}</p>
                  <p className="text-xs text-slate-500">{client.contact}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-800">{formatCurrency(client.creditLimit)}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black">{client.paymentTerm} dias</p>
                  {client.discountTier && client.discountTier !== 'Normal' && (
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      client.discountTier === 'Gold' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {client.discountTier} (Tier)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-bold text-red-500">{formatCurrency(client.balance)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold">ATIVO</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(client)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Save size={16} />
                    </button>
                    {currentUser?.role === UserRole.ADMIN && (
                      <button 
                        onClick={() => handleDeleteClick(client)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
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
        {filteredClients.length === 0 && (
          <div className="p-12 text-center text-slate-400">Nenhum cliente encontrado.</div>
        )}
      </div>

      {/* Modal: Cadastro de Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            {showSuccess ? (
              <div className="p-12 text-center space-y-4 animate-fadeIn">
                <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase">Cliente Cadastrado!</h3>
                <p className="text-slate-500">Os dados foram salvos com sucesso no sistema.</p>
              </div>
            ) : (
              <>
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-xl">
                      <Users size={20} />
                    </div>
                    <h3 className="text-lg font-bold">{selectedClient ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}</h3>
                  </div>
                  <button onClick={() => { setIsModalOpen(false); setSelectedClient(null); }} className="hover:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Instituição</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="Ex: Farmácia Popular"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIF (Obrigatório)</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="500..."
                        value={formData.nif}
                        onChange={e => setFormData({...formData, nif: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável Técnico (Farmacêutico)</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                      placeholder="Nome do Farmacêutico"
                      value={formData.technicalResponsible}
                      onChange={e => setFormData({...formData, technicalResponsible: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                      >
                        <option value="Farmácia">Farmácia</option>
                        <option value="Hospital">Hospital</option>
                        <option value="ONG">ONG</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto Telefónico</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="+245 ..."
                        value={formData.contact}
                        onChange={e => setFormData({...formData, contact: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="Bairro, Rua, Cidade"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Região / Província</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        value={formData.region}
                        onChange={e => setFormData({...formData, region: e.target.value})}
                      >
                        <option value="Bissau">Bissau (SAB)</option>
                        <option value="Bafatá">Bafatá</option>
                        <option value="Gabu">Gabu</option>
                        <option value="Oio">Oio (Farim)</option>
                        <option value="Biombo">Biombo (Quinhámel)</option>
                        <option value="Quinara">Quinara (Buba)</option>
                        <option value="Tombali">Tombali (Catió)</option>
                        <option value="Cacheu">Cacheu</option>
                        <option value="Bolama">Bolama/Bijagós</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite de Crédito (FCFA)</label>
                      <input 
                        required 
                        type="number" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-600" 
                        placeholder="500000"
                        value={formData.creditLimit}
                        onChange={e => setFormData({...formData, creditLimit: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tier de Desconto</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        value={formData.discountTier}
                        onChange={e => setFormData({...formData, discountTier: e.target.value as any})}
                      >
                        <option value="Normal">Normal (0%)</option>
                        <option value="Silver">Silver (5%)</option>
                        <option value="Gold">Gold (10%)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo Pagamento (Dias)</label>
                    <input 
                      required 
                      type="number" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" 
                      placeholder="30"
                      value={formData.paymentTerm}
                      onChange={e => setFormData({...formData, paymentTerm: e.target.value})}
                    />
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
                      className="flex-1 py-4 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-xl shadow-emerald-200"
                    >
                      {selectedClient ? 'Atualizar Cliente' : 'Salvar Cliente'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-8 text-center space-y-6">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-600">
                <Trash2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase">Confirmar Exclusão</h3>
                <p className="text-slate-500">
                  Tem certeza que deseja excluir o cliente <span className="font-bold text-slate-900">{clientToDelete?.name}</span>? 
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-4 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all shadow-xl shadow-red-200"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
