import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, Edit2, Trash2, X, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Customer } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, orders } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nif: '',
    address: '',
    postalCode: '',
    city: '',
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        nif: customer.nif || '',
        address: customer.address,
        postalCode: customer.postalCode || '',
        city: customer.city || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', nif: '', address: '', postalCode: '', city: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer({
        id: uuidv4(),
        ...formData,
        createdAt: new Date().toISOString(),
      });
    }
    handleCloseModal();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Entrada</span>;
      case 'in_progress': return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Em Reparação</span>;
      case 'waiting_parts': return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Orçamentado</span>;
      case 'completed': return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Reparado</span>;
      case 'canceled': return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Cancelado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">Gerencie os clientes da sua assistência.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Contactos</th>
                <th className="px-6 py-3 font-medium">NIF</th>
                <th className="px-6 py-3 font-medium">Localidade</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{customer.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{customer.phone}</div>
                    <div className="text-xs text-slate-500">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4">{customer.nif || '-'}</td>
                  <td className="px-6 py-4">{customer.city || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setHistoryCustomer(customer)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                        title="Ver Histórico"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(customer)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Tem a certeza que deseja eliminar este cliente?')) {
                            deleteCustomer(customer.id);
                          }
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum cliente encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh] my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Nome Completo</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">NIF</label>
                    <input
                      required
                      type="text"
                      value={formData.nif}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
                    <input
                      required
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="910 000 000"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Morada</label>
                  <input
                    required
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Código Postal</label>
                    <input
                      required
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="0000-000"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Localidade</label>
                    <input
                      required
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl my-8 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sticky top-0 bg-white rounded-t-xl z-10 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                Histórico de Reparações: {historyCustomer.name}
              </h2>
              <button onClick={() => setHistoryCustomer(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-x-auto">
              {orders.filter(o => o.customerId === historyCustomer.id).length === 0 ? (
                <p className="text-center text-slate-500 py-8">Nenhuma ordem de reparação encontrada para este cliente.</p>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">OS #</th>
                      <th className="px-4 py-3 font-medium">Equipamento</th>
                      <th className="px-4 py-3 font-medium">Avaria</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Valor Total</th>
                      <th className="px-4 py-3 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders
                      .filter(o => o.customerId === historyCustomer.id)
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{order.id.toUpperCase()}</td>
                          <td className="px-4 py-3">{order.brand} {order.model}</td>
                          <td className="px-4 py-3 truncate max-w-[200px]" title={order.issueDescription}>{order.issueDescription}</td>
                          <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                          <td className="px-4 py-3 font-medium">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(order.totalCost)}</td>
                          <td className="px-4 py-3">{format(new Date(order.createdAt), "dd/MM/yyyy", { locale: pt })}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
