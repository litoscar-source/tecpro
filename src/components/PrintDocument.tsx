import React from 'react';
import { Customer, ServiceOrder, CompanySettings, InventoryItem } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface PrintDocumentProps {
  order: ServiceOrder;
  customer: Customer;
  inventory: InventoryItem[];
  settings: CompanySettings;
  type: 'entrada' | 'saida' | 'orcamento';
}

const colors = {
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  slate900: '#0f172a',
  white: '#ffffff',
  black: '#000000',
};

export function PrintDocument({ order, customer, inventory, settings, type }: PrintDocumentProps) {
  const getDocumentTitle = () => {
    switch (type) {
      case 'entrada': return 'Folha de Reparação - Entrada';
      case 'saida': return 'Folha de Reparação - Saída';
      case 'orcamento': return 'Orçamento de Reparação';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const partsCost = order.partsUsed.reduce((acc, part) => {
    const item = inventory.find(i => i.id === part.partId);
    return acc + (item ? item.price * part.quantity : 0);
  }, 0);

  return (
    <div 
      id="print-root" 
      className="p-6 font-sans text-xs flex flex-col"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '800px',
        minHeight: '1123px',
        zIndex: -1000,
        backgroundColor: colors.white,
        color: colors.black
      }}
    >
      <div className="flex-1">
        {/* Header */}
      <div className="flex justify-between items-start pb-4 mb-4 border-b-2" style={{ borderColor: colors.slate800 }}>
        <div className="flex items-start gap-4">
          {settings.logo && (
            <img src={settings.logo} alt="Logótipo" className="h-12 w-12 object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.slate900 }}>{settings.companyName}</h1>
            <p className="mt-1" style={{ color: colors.slate600 }}>{settings.legalName}</p>
            <div className="mt-1" style={{ color: colors.slate600 }}>
              <p>{settings.address}</p>
              <p>{settings.postalCode} {settings.city} | NIF: {settings.nif}</p>
              <p>Tel: {settings.phone} | Email: {settings.email}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase" style={{ color: colors.slate800 }}>{getDocumentTitle()}</h2>
          <p className="text-base font-medium mt-1">OS Nº: {order.id.toUpperCase()}</p>
          <p style={{ color: colors.slate600 }}>Data de Entrada: {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: pt })}</p>
          {type === 'saida' && order.completedAt && (
            <p style={{ color: colors.slate600 }}>Data de Saída: {format(new Date(order.completedAt), "dd/MM/yyyy", { locale: pt })}</p>
          )}
          {type !== 'saida' && (
            <p style={{ color: colors.slate600 }}>Data de Impressão: {format(new Date(), "dd/MM/yyyy", { locale: pt })}</p>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-4">
        <h3 className="text-base font-bold pb-1 mb-2 uppercase border-b" style={{ borderColor: colors.slate300 }}>Dados do Cliente</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><span className="font-semibold">Nome:</span> {customer.name}</p>
            <p><span className="font-semibold">NIF:</span> {customer.nif || 'N/A'}</p>
            <p><span className="font-semibold">Email:</span> {customer.email}</p>
          </div>
          <div>
            <p><span className="font-semibold">Telefone:</span> {customer.phone}</p>
            <p><span className="font-semibold">Morada:</span> {customer.address}</p>
            <p><span className="font-semibold">Localidade:</span> {customer.postalCode} {customer.city}</p>
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="mb-4">
        <h3 className="text-base font-bold pb-1 mb-2 uppercase border-b" style={{ borderColor: colors.slate300 }}>Dados do Equipamento</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><span className="font-semibold">Equipamento:</span> {order.deviceType}</p>
            <p><span className="font-semibold">Marca/Modelo:</span> {order.brand} {order.model}</p>
            <p><span className="font-semibold">Estado:</span> {order.deviceCondition || 'N/A'}</p>
          </div>
          <div>
            <p><span className="font-semibold">Nº Série/IMEI:</span> {order.serialNumber || 'N/A'}</p>
            <p><span className="font-semibold">Acessórios:</span> {order.accessories || 'Nenhum'}</p>
            <p><span className="font-semibold">Garantia:</span> {order.isWarranty ? 'Sim' : 'Não'}</p>
          </div>
        </div>
        <div className="mt-2">
          <p className="font-semibold">Avaria Reportada:</p>
          <div className="p-2 rounded mt-1 min-h-[40px] border" style={{ backgroundColor: colors.slate50, borderColor: colors.slate200 }}>
            {order.issueDescription}
          </div>
        </div>
      </div>

      {/* Technical Details (For Saida and Orcamento) */}
      {(type === 'saida' || type === 'orcamento') && (
        <div className="mb-4">
          <h3 className="text-base font-bold pb-1 mb-2 uppercase border-b" style={{ borderColor: colors.slate300 }}>
            {type === 'orcamento' ? 'Proposta de Intervenção' : 'Relatório Técnico'}
          </h3>
          
          {order.technicianNotes && (
            <div className="mb-3">
              <p className="font-semibold">Notas Técnicas:</p>
              <div className="p-2 rounded mt-1 min-h-[40px] border" style={{ backgroundColor: colors.slate50, borderColor: colors.slate200 }}>
                {order.technicianNotes}
              </div>
            </div>
          )}

          <table className="w-full text-left border-collapse mt-2">
            <thead>
              <tr className="border-b" style={{ backgroundColor: colors.slate100, borderColor: colors.slate300 }}>
                <th className="py-1 px-2 font-semibold">Descrição</th>
                <th className="py-1 px-2 font-semibold text-center">Qtd</th>
                <th className="py-1 px-2 font-semibold text-right">Preço Unit.</th>
                <th className="py-1 px-2 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.partsUsed.map((part, idx) => {
                const item = inventory.find(i => i.id === part.partId);
                const price = item ? item.price : 0;
                const total = price * part.quantity;
                return (
                  <tr key={idx} className="border-b" style={{ borderColor: colors.slate200 }}>
                    <td className="py-1 px-2">{item ? item.name : 'Peça Desconhecida'}</td>
                    <td className="py-1 px-2 text-center">{part.quantity}</td>
                    <td className="py-1 px-2 text-right">{formatCurrency(price)}</td>
                    <td className="py-1 px-2 text-right">{formatCurrency(total)}</td>
                  </tr>
                );
              })}
              {order.laborCost > 0 && (
                <tr className="border-b" style={{ borderColor: colors.slate200 }}>
                  <td className="py-1 px-2">Mão de Obra / Serviço Técnico</td>
                  <td className="py-1 px-2 text-center">1</td>
                  <td className="py-1 px-2 text-right">{formatCurrency(order.laborCost)}</td>
                  <td className="py-1 px-2 text-right">{formatCurrency(order.laborCost)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end mt-3">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span className="font-semibold">Subtotal Peças:</span>
                <span>{formatCurrency(partsCost)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold">Mão de Obra:</span>
                <span>{formatCurrency(order.laborCost)}</span>
              </div>
              <div className="flex justify-between py-1 mt-1 text-sm font-bold border-t-2" style={{ borderColor: colors.slate800 }}>
                <span>Total:</span>
                <span>{formatCurrency(order.totalCost)}</span>
              </div>
              {type === 'orcamento' && (
                <p className="text-[10px] mt-1 text-right" style={{ color: colors.slate500 }}>Orçamento válido por 15 dias.</p>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      <div className="mt-auto pt-6">
        {/* Terms and Conditions */}
      <div className="mt-6 text-[10px] text-justify" style={{ color: colors.slate500 }}>
        <h4 className="font-bold mb-1 uppercase">Termos e Condições</h4>
        {type === 'entrada' && (
          <p>
            1. O cliente declara que os dados fornecidos são verdadeiros. 2. A empresa não se responsabiliza por dados armazenados no equipamento; o cliente deve realizar backup prévio. 3. Equipamentos não levantados após 90 dias da notificação de conclusão serão considerados abandonados. 4. O diagnóstico inicial pode sofrer alterações após análise técnica detalhada.
          </p>
        )}
        {type === 'orcamento' && (
          <p>
            1. Este orçamento é uma estimativa baseada na análise inicial. Valores podem ser ajustados caso sejam identificados danos ocultos durante a reparação. 2. A aprovação deste orçamento autoriza o início imediato dos trabalhos.
          </p>
        )}
        {type === 'saida' && (
          <p>
            1. O equipamento foi testado e entregue em pleno funcionamento das reparações efetuadas. 2. Garantia de 90 dias sobre as peças substituídas e mão de obra aplicada, não cobrindo danos por mau uso, quedas ou líquidos.
          </p>
        )}
      </div>

      {/* Signatures */}
      <div className="mt-8 grid grid-cols-2 gap-16">
        <div className="text-center">
          <div className="pt-2 border-t" style={{ borderColor: colors.slate400 }}>
            <p className="font-semibold">{settings.companyName}</p>
            <p className="text-[10px]" style={{ color: colors.slate500 }}>Técnico Responsável</p>
          </div>
        </div>
        <div className="text-center">
          <div className="pt-2 border-t" style={{ borderColor: colors.slate400 }}>
            <p className="font-semibold">{customer.name}</p>
            <p className="text-[10px]" style={{ color: colors.slate500 }}>Assinatura do Cliente</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
