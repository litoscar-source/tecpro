import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, Edit2, Trash2, X, Eye, Printer, Tag } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ServiceOrder, OrderStatus, Customer } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { PrintDocument } from '../components/PrintDocument';
import { PrintLabelModal } from '../components/PrintLabelModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function Orders() {
  const { orders, customers, inventory, settings, addOrder, updateOrder, deleteOrder, updateCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerFormData, setCustomerFormData] = useState<Partial<Customer>>({});

  const [showHistoryModal, setShowHistoryModal] = useState<'customer' | 'device' | null>(null);

  const [printData, setPrintData] = useState<{ order: ServiceOrder, type: 'entrada' | 'saida' | 'orcamento' } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [labelOrder, setLabelOrder] = useState<ServiceOrder | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    orderType: 'repair' as 'repair' | 'service',
    deviceType: '',
    brand: '',
    model: '',
    serialNumber: '',
    deviceCondition: '',
    accessories: '',
    isWarranty: false,
    issueDescription: '',
    technicianNotes: '',
    status: 'entrada' as OrderStatus,
    externalSupplier: '',
    externalDispatchDate: '',
    partsUsed: [] as { partId: string; quantity: number }[],
    laborCost: 0,
    partsDiscount: 0,
    paymentStatus: 'pendente',
    paymentMethod: '',
    paymentDate: '',
  });

  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  const pastCustomerOrders = formData.customerId 
    ? orders.filter(o => o.customerId === formData.customerId && o.id !== editingOrder?.id)
    : [];

  const pastDeviceOrders = formData.serialNumber && formData.serialNumber.trim() !== ''
    ? orders.filter(o => o.serialNumber === formData.serialNumber && o.id !== editingOrder?.id)
    : [];

  const handleEditCustomer = () => {
    const c = customers.find(c => c.id === formData.customerId);
    if (c) {
      setCustomerFormData(c);
      setIsEditingCustomer(true);
    }
  };

  const handleSaveCustomer = () => {
    if (formData.customerId && customerFormData) {
      updateCustomer(formData.customerId, customerFormData);
      setIsEditingCustomer(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const customer = customers.find(c => c.id === o.customerId);
    const searchStr = `${o.id} ${customer?.name} ${o.brand} ${o.model} ${o.serialNumber}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (order?: ServiceOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customerId: order.customerId,
        orderType: order.orderType || 'repair',
        deviceType: order.deviceType,
        brand: order.brand,
        model: order.model,
        serialNumber: order.serialNumber,
        deviceCondition: order.deviceCondition || '',
        accessories: order.accessories || '',
        isWarranty: order.isWarranty || false,
        issueDescription: order.issueDescription,
        technicianNotes: order.technicianNotes,
        status: order.status,
        externalSupplier: order.externalSupplier || '',
        externalDispatchDate: order.externalDispatchDate || '',
        partsUsed: order.partsUsed || [],
        laborCost: order.laborCost || 0,
        partsDiscount: order.partsDiscount || 0,
        paymentStatus: order.paymentStatus || 'pendente',
        paymentMethod: order.paymentMethod || '',
        paymentDate: order.paymentDate || '',
      });
      setSendWhatsApp(false);
    } else {
      setEditingOrder(null);
      setFormData({
        customerId: '',
        orderType: 'repair',
        deviceType: '',
        brand: '',
        model: '',
        serialNumber: '',
        deviceCondition: '',
        accessories: '',
        isWarranty: false,
        issueDescription: '',
        technicianNotes: '',
        status: 'entrada',
        externalSupplier: '',
        externalDispatchDate: '',
        partsUsed: [],
        laborCost: 0,
        partsDiscount: 0,
        paymentStatus: 'pendente',
        paymentMethod: '',
        paymentDate: '',
      });
      setSendWhatsApp(true);
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (printData) {
      setIsGeneratingPDF(true);
      setTimeout(async () => {
        try {
          const element = document.getElementById('print-root');
          if (element) {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`OS-${printData.order.id}-${printData.type}.pdf`);
          }
        } catch (error) {
          console.error('Erro ao gerar PDF:', error);
          alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
          setPrintData(null);
          setIsGeneratingPDF(false);
        }
      }, 500);
    }
  }, [printData]);

  const handlePrint = (order: ServiceOrder, type: 'entrada' | 'saida' | 'orcamento') => {
    setPrintData({ order, type });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const calculateTotalCost = () => {
    const partsCost = formData.partsUsed.reduce((acc, part) => {
      const inventoryItem = inventory.find(i => i.id === part.partId);
      return acc + (inventoryItem ? (inventoryItem.price || 0) * part.quantity : 0);
    }, 0);
    
    // Apply discount
    const discountedPartsCost = Math.max(0, partsCost - (formData.partsDiscount || 0));
    
    return discountedPartsCost + (formData.laborCost || 0);
  };

  const sendWhatsAppNotification = (phone: string, customerName: string, orderId: string, status: string) => {
    // Only numbers
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return;

    let statusText = '';
    switch (status) {
      case 'entrada': statusText = 'Entrada (Recebido)'; break;
      case 'diagnostico': statusText = 'Em Diagnóstico'; break;
      case 'orcamento': statusText = 'Aguardando Aprovação de Orçamento'; break;
      case 'aguarda_peca': statusText = 'A Aguardar Peça'; break;
      case 'pronto': statusText = 'Pronto para Levantamento'; break;
      case 'cancelado': statusText = 'Cancelado'; break;
      default: statusText = status;
    }

    const message = `Olá, ${customerName}!\n\nO status da sua ordem de serviço ${orderId} foi atualizado para: *${statusText}*.\n\nQualquer dúvida, estamos ao dispor.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open in a new tab
    window.open(url, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalCost = calculateTotalCost();

    if (editingOrder) {
      const statusChanged = formData.status !== editingOrder.status;

      updateOrder(editingOrder.id, {
        ...formData,
        totalCost,
        completedAt: formData.status === 'pronto' && editingOrder.status !== 'pronto' 
          ? new Date().toISOString() 
          : editingOrder.completedAt,
      });

      if (statusChanged && sendWhatsApp) {
        const customer = customers.find(c => c.id === formData.customerId);
        if (customer && customer.phone) {
          sendWhatsAppNotification(customer.phone, customer.name, editingOrder.id, formData.status);
        }
      }
    } else {
      const series = settings?.orderSeries || new Date().getFullYear().toString();
      let newId = `${series}-0001`;
      const seriesOrders = orders.filter(o => o.id.startsWith(`${series}-`));
      if (seriesOrders.length > 0) {
        const numericIds = seriesOrders.map(o => parseInt(o.id.split('-')[1], 10)).filter(id => !isNaN(id));
        if (numericIds.length > 0) {
          newId = `${series}-${(Math.max(...numericIds) + 1).toString().padStart(4, '0')}`;
        }
      }

      addOrder({
        id: newId,
        ...formData,
        totalCost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // We can also notify on creation
      if (sendWhatsApp) {
        const customer = customers.find(c => c.id === formData.customerId);
        if (customer && customer.phone) {
          sendWhatsAppNotification(customer.phone, customer.name, newId, formData.status);
        }
      }
    }
    handleCloseModal();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entrada': return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">Entrada</span>;
      case 'diagnostico': return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Diagnóstico</span>;
      case 'orcamento': return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Orçamento</span>;
      case 'aguarda_peca': return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">A Aguardar Peça</span>;
      case 'pronto': return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Pronto</span>;
      case 'expedido': return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">Expedido</span>;
      case 'fechado': return <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">Fechado</span>;
      case 'cancelado': return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Cancelado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ordens de Reparação</h1>
          <p className="text-sm text-slate-500">Gerencie as reparações e manutenções.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nova Reparação
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por OS, cliente ou equipamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos os Estados</option>
              <option value="entrada">Entrada</option>
              <option value="diagnostico">Diagnóstico</option>
              <option value="orcamento">Orçamento</option>
              <option value="aguarda_peca">A Aguardar Peça</option>
              <option value="expedido">Expedido p/ Fornecedor</option>
              <option value="pronto">Pronto</option>
              <option value="fechado">Fechado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">OS # / Tipo</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Equipamento/Detalhe</th>
                <th className="px-6 py-3 font-medium">Nº de Série</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Pagamento</th>
                <th className="px-6 py-3 font-medium">Valor Total</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.map((order) => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div>{order.id.toUpperCase()}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{order.orderType === 'service' ? 'Serviço' : 'Reparação'}</div>
                    </td>
                    <td className="px-6 py-4">{customer?.name || 'Desconhecido'}</td>
                    <td className="px-6 py-4">{order.orderType === 'service' && !order.brand ? '(Serviço)' : `${order.brand} ${order.model}`}</td>
                    <td className="px-6 py-4">{order.serialNumber || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      {order.paymentStatus === 'pago' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Pago</span>
                      ) : order.paymentStatus === 'cancelado' ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Cancelado</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">Pendente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(order.totalCost)}</td>
                    <td className="px-6 py-4">{format(new Date(order.createdAt), "dd/MM/yyyy", { locale: pt })}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
                          <button
                            onClick={() => handlePrint(order, 'entrada')}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 text-xs font-medium"
                            title="Imprimir Entrada"
                          >
                            Entrada
                          </button>
                          <button
                            onClick={() => handlePrint(order, 'orcamento')}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 text-xs font-medium"
                            title="Imprimir Orçamento"
                          >
                            Orç.
                          </button>
                          <button
                            onClick={() => handlePrint(order, 'saida')}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 text-xs font-medium"
                            title="Imprimir Saída"
                          >
                            Saída
                          </button>
                        </div>
                        <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
                          <button
                            onClick={() => setLabelOrder(order)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            title="Imprimir Etiqueta"
                          >
                            <Tag className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleOpenModal(order)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Tem a certeza que deseja eliminar esta OS?')) {
                              deleteOrder(order.id);
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
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Nenhuma ordem de reparação encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm z-10 shrink-0">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingOrder ? `Editar Reparação: ${editingOrder.id.toUpperCase()}` : 'Nova Ordem de Reparação'}
            </h2>
            <div className="flex items-center gap-2">
              {editingOrder && (
                <div className="flex gap-2 mr-4 border-r border-slate-200 pr-4">
                  <button type="button" onClick={() => handlePrint(editingOrder, 'entrada')} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                    <Printer className="h-4 w-4" /> Entrada
                  </button>
                  <button type="button" onClick={() => handlePrint(editingOrder, 'orcamento')} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                    <Printer className="h-4 w-4" /> Orçamento
                  </button>
                  <button type="button" onClick={() => handlePrint(editingOrder, 'saida')} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                    <Printer className="h-4 w-4" /> Saída
                  </button>
                  <button type="button" onClick={() => setLabelOrder(editingOrder)} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors ml-2">
                    <Tag className="h-4 w-4" /> Etiqueta
                  </button>
                </div>
              )}
              <button type="button" onClick={handleCloseModal} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="mx-auto max-w-5xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-medium text-slate-900">Dados do Cliente</h3>
                    {pastCustomerOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowHistoryModal('customer')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                      >
                        <Search className="h-3 w-3" /> Ver Histórico ({pastCustomerOrders.length})
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
                    <select
                      required
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Selecione um cliente...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {formData.customerId && (
                    <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 relative">
                      {!isEditingCustomer ? (
                        <>
                          <button
                            type="button"
                            onClick={handleEditCustomer}
                            className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" /> Editar
                          </button>
                          {(() => {
                            const c = customers.find(c => c.id === formData.customerId);
                            if (!c) return null;
                            return (
                              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2">
                                <p><span className="font-medium text-slate-700">NIF:</span> {c.nif || '-'}</p>
                                <p><span className="font-medium text-slate-700">Telefone:</span> {c.phone}</p>
                                <p className="col-span-2"><span className="font-medium text-slate-700">Email:</span> {c.email}</p>
                                <p className="col-span-2"><span className="font-medium text-slate-700">Morada:</span> {c.address}, {c.postalCode} {c.city}</p>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">NIF</label>
                              <input
                                type="text"
                                value={customerFormData.nif || ''}
                                onChange={(e) => setCustomerFormData({ ...customerFormData, nif: e.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">Telefone</label>
                              <input
                                type="text"
                                value={customerFormData.phone || ''}
                                onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
                              <input
                                type="email"
                                value={customerFormData.email || ''}
                                onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="mb-1 block text-xs font-medium text-slate-700">Morada</label>
                              <input
                                type="text"
                                value={customerFormData.address || ''}
                                onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">Cód. Postal</label>
                              <input
                                type="text"
                                value={customerFormData.postalCode || ''}
                                onChange={(e) => setCustomerFormData({ ...customerFormData, postalCode: e.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">Localidade</label>
                              <input
                                type="text"
                                value={customerFormData.city || ''}
                                onChange={(e) => setCustomerFormData({ ...customerFormData, city: e.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingCustomer(false)}
                              className="text-xs px-2 py-1 rounded text-slate-600 hover:bg-slate-200"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveCustomer}
                              className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Guardar Cliente
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b pb-2 pt-4">
                    <h3 className="font-medium text-slate-900">Tipo de Serviço & Equipamento</h3>
                    {pastDeviceOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowHistoryModal('device')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                      >
                        <Search className="h-3 w-3" /> Ver Histórico ({pastDeviceOrders.length})
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de Ordem</label>
                    <select
                      value={formData.orderType}
                      onChange={(e) => setFormData({ ...formData, orderType: e.target.value as 'repair' | 'service' })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="repair">Ordem de Reparação</option>
                      <option value="service">Prestação de Serviços</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Tipo {formData.orderType === 'service' && '(Opcional)'}</label>
                      <input
                        required={formData.orderType === 'repair'}
                        type="text"
                        placeholder="Ex: Telemóvel"
                        value={formData.deviceType}
                        onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Marca {formData.orderType === 'service' && '(Opcional)'}</label>
                      <input
                        required={formData.orderType === 'repair'}
                        type="text"
                        placeholder="Ex: Apple"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Modelo {formData.orderType === 'service' && '(Opcional)'}</label>
                      <input
                        required={formData.orderType === 'repair'}
                        type="text"
                        placeholder="Ex: iPhone 13"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Nº Série / IMEI</label>
                      <input
                        type="text"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Estado do Equipamento</label>
                      <input
                        type="text"
                        placeholder="Ex: Marcas de uso, ecrã riscado"
                        value={formData.deviceCondition}
                        onChange={(e) => setFormData({ ...formData, deviceCondition: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Acessórios Deixados</label>
                      <input
                        type="text"
                        placeholder="Ex: Carregador, Capa"
                        value={formData.accessories}
                        onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isWarranty}
                        onChange={(e) => setFormData({ ...formData, isWarranty: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Reparação ao abrigo da Garantia
                    </label>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{formData.orderType === 'service' ? 'Descrição do Serviço' : 'Avaria Reportada'}</label>
                    <textarea
                      required
                      value={formData.issueDescription}
                      onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900 border-b pb-2">Status e Valores</h3>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Status da OS</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="entrada">Entrada</option>
                      <option value="diagnostico">Diagnóstico</option>
                      <option value="orcamento">Orçamento</option>
                      <option value="aguarda_peca">A Aguardar Peça</option>
                      <option value="expedido">Expedido p/ Fornecedor</option>
                      <option value="pronto">Pronto</option>
                      <option value="fechado">Fechado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>

                    {formData.status === 'expedido' && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-indigo-900">Fornecedor Externo</label>
                          <input
                            type="text"
                            value={formData.externalSupplier}
                            onChange={(e) => setFormData({ ...formData, externalSupplier: e.target.value })}
                            className="w-full rounded-md border border-indigo-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 bg-white"
                            placeholder="Nome do fornecedor"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-indigo-900">Data de Expedição</label>
                          <input
                            type="date"
                            value={formData.externalDispatchDate}
                            onChange={(e) => setFormData({ ...formData, externalDispatchDate: e.target.value })}
                            className="w-full rounded-md border border-indigo-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {editingOrder && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/quote/${editingOrder.id}`;
                          navigator.clipboard.writeText(url);
                          alert('Link do orçamento copiado para a área de transferência!');
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors w-full text-center border border-blue-200"
                      >
                        Copiar Link para o Cliente (Orçamento)
                      </button>

                      {editingOrder.clientQuoteStatus && (
                        <div className={`mt-2 p-3 text-sm rounded border ${
                          editingOrder.clientQuoteStatus === 'accepted' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                        }`}>
                          <p className="font-semibold mb-1">
                            {editingOrder.clientQuoteStatus === 'accepted' ? 'Orçamento Aprovado pelo Cliente' : 'Orçamento Recusado pelo Cliente'}
                          </p>
                          <p className="text-xs mb-1 opacity-80">
                            Data: {editingOrder.clientQuoteDate ? new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(editingOrder.clientQuoteDate)) : 'Desconhecida'}
                          </p>
                          {editingOrder.clientQuoteObservation && (
                            <p className="italic text-xs mt-1 bg-white/50 p-1.5 rounded">Obs: "{editingOrder.clientQuoteObservation}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Relatório Técnico</label>
                    <textarea
                      value={formData.technicianNotes}
                      onChange={(e) => setFormData({ ...formData, technicianNotes: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700">Peças Utilizadas</label>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, partsUsed: [...formData.partsUsed, { partId: '', quantity: 1 }] })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Adicionar Peça
                      </button>
                    </div>
                    
                    {formData.partsUsed.length === 0 ? (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">Nenhuma peça adicionada.</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.partsUsed.map((part, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <select
                              value={part.partId}
                              onChange={(e) => {
                                const newParts = [...formData.partsUsed];
                                newParts[index].partId = e.target.value;
                                setFormData({ ...formData, partsUsed: newParts });
                              }}
                              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                            >
                              <option value="">Selecione...</option>
                              {inventory.map(i => (
                                <option key={i.id} value={i.id}>{i.name} - {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(i.price)}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              value={part.quantity}
                              onChange={(e) => {
                                const newParts = [...formData.partsUsed];
                                newParts[index].quantity = Number(e.target.value);
                                setFormData({ ...formData, partsUsed: newParts });
                              }}
                              className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newParts = [...formData.partsUsed];
                                newParts.splice(index, 1);
                                setFormData({ ...formData, partsUsed: newParts });
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Mão de Obra (€)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.laborCost}
                        onChange={(e) => setFormData({ ...formData, laborCost: Number(e.target.value) })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Desconto nas Peças (€)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.partsDiscount || 0}
                        onChange={(e) => setFormData({ ...formData, partsDiscount: Number(e.target.value) })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 my-4 pt-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Pagamento</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
                        <select
                          value={formData.paymentStatus || 'pendente'}
                          onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="pendente">Pendente</option>
                          <option value="pago">Pago</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Meio</label>
                        <select
                          value={formData.paymentMethod || ''}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Nenhum</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="multibanco">Multibanco</option>
                          <option value="mbway">MB Way</option>
                          <option value="transferencia">Transferência</option>
                          <option value="cartao">Cartão Crédito</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Data de Pagamento</label>
                        <input
                          type="date"
                          value={formData.paymentDate || ''}
                          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-200 mt-4 pt-4">
                    <input
                      type="checkbox"
                      id="sendWhatsApp"
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="sendWhatsApp" className="text-sm font-medium text-slate-700">
                      Enviar notificação por WhatsApp ao Guardar
                    </label>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span className="text-slate-700">Total Estimado:</span>
                      <span className="text-blue-600">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateTotalCost())}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-6 sm:p-8 border-t border-slate-100 bg-slate-50">
                <div>
                  {editingOrder && formData.status !== 'fechado' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Tem a certeza que deseja fechar esta reparação?")) {
                          const totalCost = calculateTotalCost();
                          updateOrder(editingOrder.id, {
                            ...formData,
                            status: 'fechado',
                            totalCost,
                            completedAt: editingOrder.completedAt || new Date().toISOString()
                          });
                          setIsModalOpen(false);
                          setEditingOrder(null);
                        }
                      }}
                      className="rounded-lg bg-slate-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors shadow-sm"
                    >
                      Fechar Reparação
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Guardar Reparação
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Histórico de Reparações ({showHistoryModal === 'customer' ? 'Por Cliente' : 'Por Nº Série'})
              </h2>
              <button onClick={() => setShowHistoryModal(null)} className="rounded p-1 hover:bg-slate-100 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {(showHistoryModal === 'customer' ? pastCustomerOrders : pastDeviceOrders).map(o => (
                <div key={o.id} className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-900">{o.id.toUpperCase()}</span>
                    {getStatusBadge(o.status)}
                  </div>
                  <div className="text-sm text-slate-600 mb-1">
                    <strong>Data:</strong> {format(new Date(o.createdAt), "dd/MM/yyyy", { locale: pt })}
                  </div>
                  <div className="text-sm text-slate-600 mb-1">
                    <strong>Equipamento:</strong> {o.brand} {o.model} {o.serialNumber ? `(S/N: ${o.serialNumber})` : ''}
                  </div>
                  <div className="text-sm text-slate-600 mb-1">
                    <strong>Avaria:</strong> {o.issueDescription}
                  </div>
                  {o.technicianNotes && (
                    <div className="text-sm text-slate-600 mb-1 p-2 bg-slate-50 rounded border border-slate-100">
                      <strong>Relatório de Reparação:</strong> {o.technicianNotes}
                    </div>
                  )}
                  <div className="text-sm font-medium text-slate-900 mt-2 text-right">
                    Total: {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(o.totalCost)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {printData && settings && (
        <PrintDocument
          order={printData.order}
          customer={customers.find(c => c.id === printData.order.customerId)!}
          inventory={inventory}
          settings={settings}
          type={printData.type}
        />
      )}

      {isGeneratingPDF && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="font-medium text-slate-900">A gerar PDF...</p>
          </div>
        </div>
      )}

      {labelOrder && (
        <PrintLabelModal
          order={labelOrder}
          customerName={customers.find(c => c.id === labelOrder.customerId)?.name || 'Desconhecido'}
          onClose={() => setLabelOrder(null)}
        />
      )}
    </div>
  );
}
