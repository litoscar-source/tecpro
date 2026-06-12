import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, Calendar as CalendarIcon, Clock, User, FileText, CheckCircle, XCircle, X } from 'lucide-react';
import { Appointment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function Agenda() {
  const { appointments, customers, addAppointment, updateAppointment, deleteAppointment, addCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    nif: '',
    address: '',
    postalCode: '',
    city: ''
  });

  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    date: '',
    time: '',
    notes: '',
    status: 'scheduled' as const,
  });

  const filteredAppointments = appointments.filter((appointment) => {
    const customer = customers.find((c) => c.id === appointment.customerId);
    const searchString = `${appointment.title} ${customer?.name || ''} ${appointment.date}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const handleCreateQuickCustomer = () => {
    if (!newCustomerData.name) {
      alert("O nome do cliente é obrigatório.");
      return;
    }
    const newId = uuidv4();
    addCustomer({
      id: newId,
      ...newCustomerData,
      createdAt: new Date().toISOString()
    });
    setFormData({ ...formData, customerId: newId });
    setShowNewCustomerForm(false);
    setNewCustomerData({
      name: '',
      phone: '',
      email: '',
      nif: '',
      address: '',
      postalCode: '',
      city: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAppointment) {
      await updateAppointment(editingAppointment.id, formData);
    } else {
      await addAppointment({
        id: uuidv4(),
        ...formData,
        createdAt: new Date().toISOString(),
      });
    }
    closeModal();
  };

  const openModal = (appointment?: Appointment) => {
    setShowNewCustomerForm(false);
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        customerId: appointment.customerId,
        title: appointment.title,
        date: appointment.date,
        time: appointment.time,
        notes: appointment.notes,
        status: appointment.status,
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        customerId: customers[0]?.id || '',
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        notes: '',
        status: 'scheduled',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-200"><Clock className="h-3 w-3" /> Agendado</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200"><CheckCircle className="h-3 w-3" /> Concluído</span>;
      case 'canceled':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 border border-red-200"><XCircle className="h-3 w-3" /> Cancelado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agenda de Marcações</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Marcação
        </button>
      </div>

      <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por título, cliente ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full rounded-lg bg-white p-8 text-center border border-slate-200">
            <p className="text-slate-500">Nenhuma marcação encontrada.</p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => {
            const customer = customers.find((c) => c.id === appointment.customerId);
            return (
              <div
                key={appointment.id}
                className="flex flex-col rounded-lg bg-white p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openModal(appointment)}
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{appointment.title}</h3>
                  {getStatusBadge(appointment.status)}
                </div>
                
                <div className="space-y-2 mt-2 text-sm text-slate-600 flex-1">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    <span>{new Date(appointment.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{appointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="line-clamp-1">{customer?.name || 'Cliente Desconhecido'}</span>
                  </div>
                  {appointment.notes && (
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                      <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2 text-xs">{appointment.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh] my-auto">
            <div className="border-b border-slate-200 p-6 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">
                {editingAppointment ? 'Editar Marcação' : 'Nova Marcação'}
              </h2>
            </div>

            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Ex: Instalação de software"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700">Cliente</label>
                      {!showNewCustomerForm && (
                        <button
                          type="button"
                          onClick={() => { setShowNewCustomerForm(true); setFormData({ ...formData, customerId: '' }); }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Novo Cliente
                        </button>
                      )}
                    </div>
                    {!showNewCustomerForm ? (
                      <select
                        required
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                        className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="" disabled>Selecione um cliente</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} - {c.phone} {c.nif && `(NIF: ${c.nif})`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-bold text-blue-900">Novo Cliente</h4>
                          <button
                            type="button"
                            onClick={() => setShowNewCustomerForm(false)}
                            className="text-slate-500 hover:text-slate-700 bg-white p-1 rounded-md shadow-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-700">Nome <span className="text-red-500">*</span></label>
                            <input
                              required={showNewCustomerForm}
                              type="text"
                              value={newCustomerData.name}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Telefone</label>
                            <input
                              type="tel"
                              value={newCustomerData.phone}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
                            <input
                              type="email"
                              value={newCustomerData.email}
                              onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={handleCreateQuickCustomer}
                            className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                          >
                            Guardar e Selecionar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Data</label>
                      <input
                        required
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Hora</label>
                      <input
                        required
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="scheduled">Agendado</option>
                      <option value="completed">Concluído</option>
                      <option value="canceled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Notas Adicionais</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 shrink-0">
                  {editingAppointment && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Tem a certeza que deseja eliminar esta marcação?')) {
                          deleteAppointment(editingAppointment.id);
                          closeModal();
                        }
                      }}
                      className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none mr-auto"
                    >
                      Eliminar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  >
                    {editingAppointment ? 'Guardar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
