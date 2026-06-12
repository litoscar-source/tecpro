import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, Edit2, Trash2, X, Eye, Printer, Tag } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ServiceOrder, OrderStatus, Customer } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { PrintDocument } from '../components/PrintDocument';
import { PrintLabelModal } from '../components/PrintLabelModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function Orders() {
  const { orders, customers, inventory, settings, addOrder, updateOrder, deleteOrder, updateCustomer, addCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [isFormReadOnly, setIsFormReadOnly] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('resumo');
  
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerFormData, setCustomerFormData] = useState<Partial<Customer>>({});

  const [showHistoryModal, setShowHistoryModal] = useState<'customer' | 'device' | null>(null);
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

  const [printData, setPrintData] = useState<{ order: ServiceOrder, type: 'entrada' | 'saida' | 'orcamento' } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [labelOrder, setLabelOrder] = useState<ServiceOrder | null>(null);
  const submitActionRef = useRef<'save_and_close' | 'save_and_stay' | 'register_and_print' | 'register_and_repair' | 'save'>('save_and_close');

  const [formData, setFormData] = useState({
    customerId: '',
    orderType: 'repair' as 'repair' | 'service',
    deliveryMethod: 'client' as 'client' | 'carrier',
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
    externalReturnDate: '',
    partsUsed: [] as { partId: string; quantity: number }[],
    laborCost: '' as number | '',
    partsDiscount: '' as number | '',
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
      setIsFormReadOnly(true);
      setFormData({
        customerId: order.customerId,
        orderType: order.orderType || 'repair',
        deliveryMethod: order.deliveryMethod || 'client',
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
        entryCondition: order.entryCondition || 'sujeito a custos',
        repairLocation: order.repairLocation || 'interna',
        testsPerformed: order.testsPerformed || '',
        resolutionType: order.resolutionType || '',
        externalSupplier: order.externalSupplier || '',
        externalDispatchDate: order.externalDispatchDate || '',
        externalReturnDate: order.externalReturnDate || '',
        partsUsed: order.partsUsed || [],
        laborCost: order.laborCost === 0 ? '' : order.laborCost,
        partsDiscount: order.partsDiscount === 0 ? '' : order.partsDiscount,
        paymentStatus: order.paymentStatus || 'pendente',
        paymentMethod: order.paymentMethod || '',
        paymentDate: order.paymentDate || '',
      });
      setSendWhatsApp(false);
    } else {
      setEditingOrder(null);
      setIsFormReadOnly(false);
      setFormData({
        customerId: '',
        orderType: 'repair',
        deliveryMethod: 'client',
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
        entryCondition: 'sujeito a custos',
        repairLocation: 'interna',
        testsPerformed: '',
        resolutionType: '',
        externalSupplier: '',
        externalDispatchDate: '',
        partsUsed: [],
        laborCost: '',
        partsDiscount: '',
        paymentStatus: 'pendente',
        paymentMethod: '',
        paymentDate: '',
      });
      setSendWhatsApp(false);
    }
    setActiveTab('resumo');
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
      if (part.isManual) {
        return acc + ((part.manualPrice || 0) * part.quantity);
      } else {
        const inventoryItem = inventory.find(i => i.id === part.partId);
        return acc + (inventoryItem ? (inventoryItem.price || 0) * part.quantity : 0);
      }
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

    const companyPrefix = settings?.companyName ? `*${settings.companyName}* - ` : '';
    const message = `${companyPrefix}Olá, ${customerName}!\n\nO status da sua ordem de serviço ${orderId} foi atualizado para: *${statusText}*.\n\nQualquer dúvida, estamos ao dispor.`;
    const url = `https://wa.me/351${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open in a new tab
    window.open(url, '_blank');
  };

  const renderTabWhatsAppButton = () => {
    if (!editingOrder) return null;
    return (
      <button
        type="button"
        onClick={() => {
          const customer = customers.find(c => c.id === formData.customerId);
          if (customer && customer.phone) {
            sendWhatsAppNotification(customer.phone, customer.name, editingOrder.id, formData.status);
          } else {
            alert('Cliente sem número de telefone associado.');
          }
        }}
        className="mt-2 flex items-center justify-center gap-2 w-full text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        Enviar Estado no WhatsApp
      </button>
    );
  };

  const handleCreateQuickCustomer = () => {
    if (!newCustomerData.name) {
      alert("O nome do cliente é obrigatório.");
      return;
    }
    const newId = crypto.randomUUID();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalCost = calculateTotalCost();
    let currentOrderId = '';
    let isNewProcess = false;

    if (editingOrder) {
      currentOrderId = editingOrder.id;
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
      isNewProcess = true;
      const series = settings?.orderSeries || new Date().getFullYear().toString();
      let newId = `${series}-0001`;
      const seriesOrders = orders.filter(o => o.id.startsWith(`${series}-`));
      if (seriesOrders.length > 0) {
        const numericIds = seriesOrders.map(o => parseInt(o.id.split('-')[1], 10)).filter(id => !isNaN(id));
        if (numericIds.length > 0) {
          newId = `${series}-${(Math.max(...numericIds) + 1).toString().padStart(4, '0')}`;
        }
      }

      currentOrderId = newId;
      addOrder({
        id: newId,
        ...formData,
        totalCost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      if (sendWhatsApp) {
        const customer = customers.find(c => c.id === formData.customerId);
        if (customer && customer.phone) {
          sendWhatsAppNotification(customer.phone, customer.name, newId, formData.status);
        }
      }
    }

    if (submitActionRef.current === 'save_and_stay') {
      const savedOrder = !isNewProcess ? orders.find(o => o.id === currentOrderId) : { id: currentOrderId, ...formData, totalCost, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setEditingOrder(savedOrder as ServiceOrder);
      setIsFormReadOnly(true);
      setShowSavedSuccess(true);
      setTimeout(() => setShowSavedSuccess(false), 3000);
    } else if (submitActionRef.current === 'register_and_print') {
      const savedOrder = { id: currentOrderId, ...formData, totalCost, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ServiceOrder;
      handlePrint(savedOrder, 'entrada');
      handleCloseModal();
    } else if (submitActionRef.current === 'register_and_repair') {
      const savedOrder = { id: currentOrderId, ...formData, totalCost, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ServiceOrder;
      setEditingOrder(savedOrder);
      setIsFormReadOnly(false);
      setShowSavedSuccess(true);
      setTimeout(() => setShowSavedSuccess(false), 3000);
      setActiveTab('reparacao');
    } else {
      handleCloseModal();
    }
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
                  <tr 
                    key={order.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onDoubleClick={() => handleOpenModal(order)}
                  >
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
                    <td className="px-6 py-4 font-medium">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(order.totalCost))}</td>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingOrder ? `Editar Reparação: ${editingOrder.id.toUpperCase()}` : 'Nova Ordem de Reparação'}
              </h2>
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Estado:</span>
                <select
                  value={formData.status}
                  disabled={isFormReadOnly}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                  className="rounded-md border-slate-200 bg-white px-3 py-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold shadow-sm text-blue-700 disabled:opacity-75 disabled:bg-slate-50"
                >
                  <option value="entrada">Entrada</option>
                  <option value="diagnostico">Em Diagnóstico</option>
                  <option value="orcamento">Orçamento</option>
                  <option value="aguarda_peca">A Aguardar Peça</option>
                  <option value="expedido">Expedido p/ Forn.</option>
                  <option value="pronto">Pronto</option>
                  <option value="fechado">Fechado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editingOrder && (
                <div className="flex gap-2 mr-4 border-r border-slate-200 pr-4">
                  <button type="button" onClick={() => {
                    const customer = customers.find(c => c.id === formData.customerId);
                    if (customer && customer.phone) {
                      sendWhatsAppNotification(customer.phone, customer.name, editingOrder.id, formData.status);
                    } else {
                      alert('Cliente sem número de telefone associado.');
                    }
                  }} className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors mr-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    WhatsApp
                  </button>
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
              <div className="flex items-center px-4 sm:px-8 border-b border-slate-200 bg-slate-50 overflow-x-auto custom-scrollbar">
                <div className="flex w-full min-w-max">
                  {[
                    { id: 'resumo', label: '1. Receção de Equipamento', desc: 'Cliente e Avaria' },
                    { id: 'reparacao', label: '2. Intervenção Técnica', desc: 'Peças e Mão de Obra', disabled: !editingOrder },
                    { id: 'testes', label: '3. Controlo de Qualidade', desc: 'Checklist e Testes', disabled: formData.status === 'entrada' },
                    { id: 'fecho', label: '4. Fecho de Processo', desc: 'Resolução e Pagamento', disabled: formData.status === 'entrada' }
                  ].map((tab, idx) => (
                    <button
                      key={tab.id}
                      type="button"
                      disabled={tab.disabled}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex-1 flex flex-col items-start px-4 py-4 text-left transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? 'border-blue-600 bg-white'
                          : 'border-transparent text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed'
                      }`}
                    >
                      <span className={`text-sm font-bold ${activeTab === tab.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {tab.label}
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5">{tab.desc}</span>
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-slate-50/50">
                  {activeTab === 'resumo' && (
                <fieldset disabled={isFormReadOnly} className="min-w-0 border-0 p-0 m-0">
                  <div className="max-w-4xl mx-auto space-y-8 pb-8">
                    {/* Section 1: Detalhes do Processo */}
                    <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h3 className="font-semibold text-slate-900 text-lg">1. Detalhes de Receção</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Condição</label>
                          <select
                            value={formData.entryCondition}
                            onChange={(e) => setFormData({ ...formData, entryCondition: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="sujeito a custos">Sujeito a Custos</option>
                            <option value="reclamacao">Reclamação</option>
                            <option value="garantia">Garantia</option>
                            <option value="para_orcamento">Para Orçamento</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo Processo</label>
                          <select
                            value={formData.orderType}
                            onChange={(e) => setFormData({ ...formData, orderType: e.target.value as 'repair' | 'service' })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="repair">Reparação</option>
                            <option value="service">Prestação de Serviço</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Método Entrega</label>
                          <select
                            value={formData.deliveryMethod}
                            onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as 'client' | 'carrier' })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="client">Pelo Cliente</option>
                            <option value="carrier">Transportadora</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* Section 2: Cliente */}
                    <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h3 className="font-semibold text-slate-900 text-lg">2. Identificação do Cliente</h3>
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

                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">Pesquisar ou Selecionar Cliente</label>
                        {!showNewCustomerForm && (
                          <button
                            type="button"
                            onClick={() => { setShowNewCustomerForm(true); setFormData({ ...formData, customerId: '' }); }}
                            className="text-sm bg-slate-100 text-blue-700 hover:bg-slate-200 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Plus className="h-4 w-4" /> Novo Cliente
                          </button>
                        )}
                      </div>
                      
                      {!showNewCustomerForm ? (
                        <select
                          required
                          value={formData.customerId}
                          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
                        >
                          <option value="">Insira o nome, NIF ou telefone...</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} - {c.phone} {c.nif && `(NIF: ${c.nif})`}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-4">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-slate-700">Nome Completo <span className="text-red-500">*</span></label>
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
                              <label className="mb-1 block text-xs font-medium text-slate-700">NIF</label>
                              <input
                                type="text"
                                value={newCustomerData.nif}
                                onChange={(e) => setNewCustomerData({ ...newCustomerData, nif: e.target.value })}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 shadow-sm"
                              />
                            </div>
                            <div className="sm:col-span-2">
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
                              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                            >
                              Guardar e Selecionar Cliente
                            </button>
                          </div>
                        </div>
                      )}

                      {formData.customerId && !showNewCustomerForm && (
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 relative">
                          {!isEditingCustomer ? (
                            <>
                              <button
                                type="button"
                                onClick={handleEditCustomer}
                                className="absolute top-3 right-3 text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm"
                              >
                                <Edit2 className="h-3 w-3" /> Editar
                              </button>
                              {(() => {
                                const c = customers.find(c => c.id === formData.customerId);
                                if (!c) return null;
                                return (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4">
                                    <p><span className="font-medium text-slate-700 block text-xs mb-0.5">NIF</span> {c.nif || '-'}</p>
                                    <p><span className="font-medium text-slate-700 block text-xs mb-0.5">Telefone</span> {c.phone || '-'}</p>
                                    <p className="md:col-span-2"><span className="font-medium text-slate-700 block text-xs mb-0.5">Email</span> {c.email || '-'}</p>
                                    <p className="md:col-span-4"><span className="font-medium text-slate-700 block text-xs mb-0.5">Morada</span> {c.address ? `${c.address}, ${c.postalCode} ${c.city}` : '-'}</p>
                                  </div>
                                );
                              })()}
                            </>
                          ) : (
                            <div className="space-y-4">
                              <h4 className="font-medium text-slate-900 border-b border-slate-200 pb-1">Atualizar Dados do Cliente</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-slate-700">NIF</label>
                                  <input
                                    type="text"
                                    value={customerFormData.nif || ''}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, nif: e.target.value })}
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-slate-700">Telefone</label>
                                  <input
                                    type="text"
                                    value={customerFormData.phone || ''}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
                                  <input
                                    type="email"
                                    value={customerFormData.email || ''}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs font-medium text-slate-700">Morada</label>
                                  <input
                                    type="text"
                                    value={customerFormData.address || ''}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-slate-700">Cód. Postal</label>
                                  <input
                                    type="text"
                                    value={customerFormData.postalCode || ''}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, postalCode: e.target.value })}
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-slate-700">Localidade</label>
                                  <input
                                    type="text"
                                    value={customerFormData.city || ''}
                                    onChange={(e) => setCustomerFormData({ ...customerFormData, city: e.target.value })}
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setIsEditingCustomer(false)}
                                  className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveCustomer}
                                  className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                  Guardar Cliente
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </section>

                    {/* Section 3: Equipamento e Avaria */}
                    <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h3 className="font-semibold text-slate-900 text-lg">3. Equipamento e Condições</h3>
                        {pastDeviceOrders.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowHistoryModal('device')}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                          >
                            <Search className="h-3 w-3" /> Histórico deste Equipamento ({pastDeviceOrders.length})
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de Equipamento {formData.orderType === 'service' && '(Opcional)'}</label>
                          <input
                            required={formData.orderType === 'repair'}
                            list="device-types-list"
                            type="text"
                            placeholder="Ex: Telemóvel"
                            value={formData.deviceType}
                            onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <datalist id="device-types-list">
                            {settings?.deviceTypes?.map(t => (
                              <option key={t} value={t} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Marca {formData.orderType === 'service' && '(Opcional)'}</label>
                          <input
                            required={formData.orderType === 'repair'}
                            list="brands-list"
                            type="text"
                            placeholder="Ex: Apple"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <datalist id="brands-list">
                            {settings?.brands?.map(b => (
                              <option key={b} value={b} />
                            ))}
                          </datalist>
                        </div>
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Nº Série / IMEI</label>
                          <input
                            type="text"
                            value={formData.serialNumber}
                            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Acessórios Deixados</label>
                          <input
                            type="text"
                            placeholder="Ex: Carregador, Capa, Embalagem"
                            value={formData.accessories}
                            onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-slate-700">Estado Físico do Equipamento</label>
                        <input
                          type="text"
                          placeholder="Ex: Marcas de uso gerais, ecrã com risco profundo no canto superior"
                          value={formData.deviceCondition}
                          onChange={(e) => setFormData({ ...formData, deviceCondition: e.target.value })}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          {formData.orderType === 'service' ? 'Descrição do Serviço Pretendido' : 'Avaria Reportada pelo Cliente'} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          value={formData.issueDescription}
                          onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          rows={4}
                          placeholder="Descreva detalhadamente o problema relatado..."
                        />
                      </div>

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <label className="flex items-center gap-3 text-sm font-medium text-amber-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isWarranty}
                            onChange={(e) => setFormData({ ...formData, isWarranty: e.target.checked })}
                            className="h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                          />
                          Equipamento ao abrigo da Garantia
                        </label>
                      </div>
                    </section>
                  </div>
                </fieldset>
                )}

            {activeTab === 'reparacao' && (
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex sm:flex-row flex-col sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Estado Atual: <span className="text-blue-700 uppercase">{formData.status.replace('_', ' ')}</span></h4>
                    <p className="text-xs text-slate-500">Pode alterar o estado na aba de Receção, ou enviar o estado atual via WhatsApp.</p>
                  </div>
                  <div className="shrink-0 w-full sm:w-auto">
                    {renderTabWhatsAppButton()}
                  </div>
                </div>
                {formData.status === 'entrada' ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Processo não iniciado</h3>
                    <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                      O processo encontra-se no estado de entrada. Inicie o processo para aceder às opções de diagnóstico e reparação.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setIsFormReadOnly(false); setFormData({ ...formData, status: 'diagnostico' }); }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Iniciar Reparação
                    </button>
                  </div>
                ) : (
                  <fieldset disabled={isFormReadOnly} className="min-w-0 border-0 p-0 m-0"><div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Tipo de Reparação</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={formData.repairLocation === 'interna'}
                            onChange={() => setFormData({ ...formData, repairLocation: 'interna' as 'interna' | 'externa' })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Interna</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={formData.repairLocation === 'externa'}
                            onChange={() => setFormData({ ...formData, repairLocation: 'externa' as 'interna' | 'externa' })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Externa</span>
                        </label>
                      </div>
                    </div>

                {formData.repairLocation === 'externa' && (
                  <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-col gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-indigo-900">Fornecedor Externo / Parceiro</label>
                      <input
                        type="text"
                        value={formData.externalSupplier}
                        onChange={(e) => setFormData({ ...formData, externalSupplier: e.target.value })}
                        className="w-full max-w-md rounded-md border border-indigo-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
                        placeholder="Nome da empresa ou fornecedor..."
                      />
                    </div>

                    <div className="flex gap-4 items-center">
                      {!formData.externalDispatchDate ? (
                         <button
                           type="button"
                           disabled={!formData.externalSupplier}
                           onClick={() => setFormData({
                             ...formData,
                             status: 'expedido',
                             externalDispatchDate: new Date().toISOString().split('T')[0]
                           })}
                           className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           Expedir Equipamento
                         </button>
                      ) : (
                        <div className="bg-white border text-indigo-800 border-indigo-200 px-4 py-2 rounded-lg text-sm flex gap-2 items-center">
                          <span className="font-semibold text-indigo-600">Expedido a:</span> {new Date(formData.externalDispatchDate).toLocaleDateString()}
                        </div>
                      )}

                      {formData.externalDispatchDate && !formData.externalReturnDate ? (
                         <button
                           type="button"
                           onClick={() => setFormData({
                             ...formData,
                             status: 'diagnostico',
                             externalReturnDate: new Date().toISOString().split('T')[0]
                           })}
                           className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition space-x-2"
                         >
                           Rececionar Equipamento
                         </button>
                      ) : formData.externalReturnDate ? (
                        <div className="bg-white border text-emerald-800 border-emerald-200 px-4 py-2 rounded-lg text-sm flex gap-2 items-center">
                          <span className="font-semibold text-emerald-600">Rececionado a:</span> {new Date(formData.externalReturnDate).toLocaleDateString()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {(formData.repairLocation === 'interna' || (formData.repairLocation === 'externa' && formData.externalReturnDate)) && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Relatório Técnico / Reparação</label>
                      <textarea
                        value={formData.technicianNotes}
                        onChange={(e) => setFormData({ ...formData, technicianNotes: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        rows={4}
                        placeholder="Descrição do trabalho efetuado..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1 mt-4">
                        <label className="block text-sm font-medium text-slate-700">Peças Utilizadas & Componentes</label>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, partsUsed: [...formData.partsUsed, { partId: '', quantity: 1, isManual: false }] })}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Do Inventário
                          </button>
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, partsUsed: [...formData.partsUsed, { partId: '', quantity: 1, isManual: true, manualName: '', manualPrice: 0 }] })}
                            className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                          >
                            + Manual
                          </button>
                        </div>
                      </div>
                      
                      {formData.partsUsed.length === 0 ? (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">Nenhuma peça adicionada.</p>
                      ) : (
                        <div className="space-y-2">
                          {formData.partsUsed.map((part, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              {!part.isManual ? (
                                <select
                                  value={part.partId}
                                  onChange={(e) => {
                                    const newParts = [...formData.partsUsed];
                                    newParts[index].partId = e.target.value;
                                    setFormData({ ...formData, partsUsed: newParts });
                                  }}
                                  className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                >
                                  <option value="">Selecione do inventário...</option>
                                  {inventory.map(i => (
                                    <option key={i.id} value={i.id}>{i.name} - {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(i.price)}</option>
                                  ))}
                                </select>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Nome da peça"
                                    value={part.manualName || ''}
                                    onChange={(e) => {
                                      const newParts = [...formData.partsUsed];
                                      newParts[index].manualName = e.target.value;
                                      setFormData({ ...formData, partsUsed: newParts });
                                    }}
                                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Preço €"
                                    value={part.manualPrice || 0}
                                    onChange={(e) => {
                                      const newParts = [...formData.partsUsed];
                                      newParts[index].manualPrice = Number(e.target.value);
                                      setFormData({ ...formData, partsUsed: newParts });
                                    }}
                                    className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                  />
                                </>
                              )}
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
                                placeholder="Qtd"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newParts = [...formData.partsUsed];
                                  newParts.splice(index, 1);
                                  setFormData({ ...formData, partsUsed: newParts });
                                }}
                                className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"
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

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span className="text-slate-700">Total Estimado de Reparação:</span>
                        <span className="text-blue-600">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateTotalCost())}</span>
                      </div>
                    </div>
                  </>
                )}

                {formData.repairLocation === 'externa' && !formData.externalReturnDate && (
                  <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 text-sm mt-4">
                    Os campos de relatório técnico, mão de obra e peças só estarão disponíveis após preencher a <strong>Data de Receção</strong> do equipamento.
                  </div>
                )}
                </div>
                </fieldset>
                )}
              </div>
            )}

            {activeTab === 'testes' && (
              <fieldset disabled={isFormReadOnly} className="min-w-0 border-0 p-0 m-0">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-900 border-b pb-2 mb-4">Testes Efetuados</h3>
                  <textarea
                    value={formData.testsPerformed}
                    onChange={(e) => setFormData({ ...formData, testsPerformed: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    rows={6}
                    placeholder="Registe aqui os testes efetuados ao equipamento (ex: WiFi, Bluetooth, Câmaras, Bateria)..."
                  />
                </div>
              </div>
              </fieldset>
            )}

            {activeTab === 'fecho' && (
              <fieldset disabled={isFormReadOnly} className="min-w-0 border-0 p-0 m-0">
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex sm:flex-row flex-col sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Estado Atual: <span className="text-blue-700 uppercase">{formData.status.replace('_', ' ')}</span></h4>
                    <p className="text-xs text-slate-500">Notifique o cliente antes do fecho do processo.</p>
                  </div>
                  <div className="shrink-0 w-full sm:w-auto">
                    {renderTabWhatsAppButton()}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900 border-b pb-2">Resolução</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Resolução do Processo</label>
                      <select
                        value={formData.resolutionType}
                        onChange={(e) => setFormData({ ...formData, resolutionType: e.target.value })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Nenhuma / Em Curso</option>
                        <option value="reparacao_efetuada">Reparação Efetuada</option>
                        <option value="orcamento_recusado">Orçamento Recusado</option>
                        <option value="sem_reparacao">Sem Reparação Possível</option>
                        <option value="sem_resposta">Sem Resposta do Cliente</option>
                        <option value="reparacao_garantia">Reparação em Garantia</option>
                        <option value="cortesia">Cortesia</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 mt-6 pt-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Informação de Pagamento</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Estado Pgt.</label>
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
                      <label className="mb-1 block text-sm font-medium text-slate-700">Método Pgt.</label>
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

                {editingOrder && (
                  <div className="border-t border-slate-200 mt-6 pt-6 flex flex-col gap-2">
                    <h3 className="font-medium text-slate-900 border-b pb-2 mb-2">Comunicação</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/quote/${editingOrder.id}`;
                        navigator.clipboard.writeText(url);
                        alert('Link do orçamento copiado para a área de transferência!');
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded transition-colors w-full text-center border border-blue-200"
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

                <div className="flex items-center gap-2 border-t border-slate-200 mt-6 pt-6">
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

                {editingOrder && formData.status !== 'fechado' && (
                  <div className="border-t border-slate-200 mt-6 pt-6 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Tem a certeza que deseja fechar esta reparação de forma definitiva?")) {
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
                      className="rounded-lg bg-red-600 px-8 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-sm w-full sm:w-auto"
                    >
                      Fechar Processo Definitivamente
                    </button>
                    <p className="text-xs text-slate-500 mt-2">Esta ação marcará a ordem de serviço como fechada e removerá o estado de pendência.</p>
                  </div>
                )}
              </div>
              </fieldset>
            )}
          </div>
          
          <div className="flex justify-between items-center p-6 sm:px-8 sm:py-4 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-10">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  >
                    {!editingOrder || !isFormReadOnly ? 'Cancelar' : 'Sair'}
                  </button>
                  {showSavedSuccess && (
                     <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                       <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Gravado
                     </span>
                  )}
                </div>
                <div className="flex gap-3">
                  {!editingOrder ? (
                    <>
                      <button
                        type="submit"
                        onClick={() => submitActionRef.current = 'save_and_stay'}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Registar
                      </button>
                      <button
                        type="submit"
                        onClick={() => submitActionRef.current = 'register_and_print'}
                        className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        Registar e Imprimir
                      </button>
                      <button
                        type="submit"
                        onClick={() => submitActionRef.current = 'register_and_repair'}
                        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Registar e Reparar
                      </button>
                    </>
                  ) : isFormReadOnly ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePrint(editingOrder!, 'entrada')}
                        className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" /> Imprimir
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFormReadOnly(false)}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Editar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="submit"
                        onClick={() => submitActionRef.current = 'save_and_stay'}
                        className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                      >
                        Guardar
                      </button>
                      <button
                        type="submit"
                        onClick={() => submitActionRef.current = 'save_and_close'}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                      >
                        Guardar e Fechar
                      </button>
                    </>
                  )}
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
                    Total: {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(o.totalCost))}
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
          customer={customers.find(c => c.id === printData.order.customerId) || { name: 'Cliente Removido' } as Customer}
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
