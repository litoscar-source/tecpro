import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Building2, AlertCircle, CheckCircle, X } from 'lucide-react';

export function PublicQuote() {
  const { id } = useParams<{ id: string }>();
  const { orders, customers, settings, updateOrder, inventory, isLoading } = useStore();
  const [observation, setObservation] = useState('');
  
  const [showConfirmModal, setShowConfirmModal] = useState<'accepted' | 'rejected' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const order = orders.find(o => o.id === id);
  const customer = order ? customers.find(c => c.id === order.customerId) : null;
  
  useEffect(() => {
    // If we had a real backend, we'd fetch the specific order here.
    // Given the local architecture, we read from SQLite via the store.
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!order || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-sm w-full">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-900">Documento não encontrado</h2>
          <p className="text-slate-500 mt-2">Verifique o link ou contacte-nos para mais informações.</p>
        </div>
      </div>
    );
  }

  // Se não estiver em orçamento
  if (order.status !== 'orcamento' && !order.clientQuoteStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-sm w-full">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-900">Reparação em curso</h2>
          <p className="text-slate-500 mt-2">Esta ordem de serviço já não se encontra na fase de orçamento.</p>
          <div className="mt-4 text-left">
            <p className="text-sm"><strong>OS:</strong> {order.id}</p>
            <p className="text-sm"><strong>Equipamento:</strong> {order.brand} {order.model}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleResponse = () => {
    if (showConfirmModal) {
      updateOrder(order.id, {
        clientQuoteStatus: showConfirmModal,
        clientQuoteObservation: observation,
        clientQuoteDate: new Date().toISOString(),
        // Ao aceitar o orçamento, pode passar automaticamente de status
        status: showConfirmModal === 'accepted' ? 'aguarda_peca' : 'cancelado'
      });
      setShowConfirmModal(null);
      setSuccessMessage(`Orçamento ${showConfirmModal === 'accepted' ? 'aceite' : 'recusado'} com sucesso.`);
    }
  };

  const calculatePartsCost = () => {
    return order.partsUsed.reduce((acc, part) => {
      const inventoryItem = inventory.find((i: any) => i.id === part.partId);
      return acc + (inventoryItem ? (inventoryItem.price || 0) * part.quantity : 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
          {settings.logo ? (
            <img src={settings.logo} alt="Logótipo" className="h-16 mx-auto mb-4 object-contain" />
          ) : (
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{settings.companyName}</h1>
          <p className="text-slate-500 mt-1">{order.orderType === 'service' ? 'Orçamento de Serviço' : 'Orçamento para Reparação'}</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">OS: {order.id.toUpperCase()}</h2>
              <p className="text-sm text-slate-500 mt-1">{new Date(order.createdAt).toLocaleDateString('pt-PT')}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-900">{customer?.name || 'Cliente Removido'}</p>
              <p className="text-sm text-slate-500">{customer?.phone || ''}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">{order.orderType === 'service' ? 'Serviço/Equipamento' : 'Equipamento'}</h3>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {order.orderType === 'service' && !order.brand ? 'Prestação de Serviço' : `${order.brand} ${order.model} ${order.serialNumber ? `(${order.serialNumber})` : ''}`}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 mb-2">{order.orderType === 'service' ? 'Descrição do Serviço' : 'Diagnóstico / Avaria'}</h3>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                {order.issueDescription}
              </p>
            </div>
            
            {order.technicianNotes && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Relatório do Técnico</h3>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {order.technicianNotes}
                </p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-medium text-slate-900 mb-4">Valores</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Peças Estimadas</span>
                  <span className="text-slate-900">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculatePartsCost())}</span>
                </div>
                {order.partsDiscount ? (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(order.partsDiscount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-slate-600">Mão de Obra Estimada</span>
                  <span className="text-slate-900">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(order.laborCost))}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-100">
                  <span className="text-slate-900">Total Estimado</span>
                  <span className="text-blue-600">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(order.totalCost))}</span>
                </div>
              </div>
            </div>

            {order.clientQuoteStatus ? (
              <div className={`mt-8 p-4 rounded-lg font-medium text-center ${
                order.clientQuoteStatus === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                O orçamento foi {order.clientQuoteStatus === 'accepted' ? 'Aprovado' : 'Recusado'}.
                {order.clientQuoteObservation && (
                  <p className="mt-2 text-sm font-normal italic">
                    "{order.clientQuoteObservation}"
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações / Mensagem (Opcional)</label>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Tem alguma dúvida ou observação sobre o orçamento?"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowConfirmModal('accepted')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" /> Aceitar Orçamento
                  </button>
                  <button
                    onClick={() => setShowConfirmModal('rejected')}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
                  >
                    <X className="h-5 w-5" /> Recusar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 p-6 text-center transform transition-all">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${showConfirmModal === 'accepted' ? 'bg-emerald-100' : 'bg-red-100'} mb-4`}>
              {showConfirmModal === 'accepted' ? (
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar Ação</h3>
            <p className="text-sm text-slate-500 mb-6">
              Tem a certeza que deseja {showConfirmModal === 'accepted' ? 'aceitar' : 'recusar'} o orçamento da ordem de serviço {order.id}?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleResponse}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  showConfirmModal === 'accepted' ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                Sim, {showConfirmModal === 'accepted' ? 'Aceitar' : 'Recusar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 p-6 text-center transform transition-all">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Sucesso</h3>
            <p className="text-sm text-slate-500 mb-6">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="px-6 py-2 text-sm font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
