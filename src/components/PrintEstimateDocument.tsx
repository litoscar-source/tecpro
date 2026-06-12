import React from 'react';
import { CompanySettings, InventoryItem } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface PrintEstimateDocumentProps {
  items: { 
    id: string; 
    isManual: boolean; 
    partId: string; 
    manualName: string; 
    manualPrice: number; 
    quantity: number 
  }[];
  inventory: InventoryItem[];
  settings: CompanySettings;
  laborTime: number;
  laborCostPerHour: number;
  taxRate: number;
  profitMargin: number;
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

export function PrintEstimateDocument({ 
  items, 
  inventory, 
  settings,
  laborTime,
  laborCostPerHour,
  taxRate,
  profitMargin
}: PrintEstimateDocumentProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const calculateSubtotalItems = () => {
    return items.reduce((acc, item) => {
      let costPrice = item.manualPrice;
      if (!item.isManual) {
        if (!item.partId) return acc;
        const invItem = inventory.find(i => i.id === item.partId);
        if (invItem) costPrice = invItem.price;
        else return acc;
      }
      const sellingPrice = costPrice * (1 + profitMargin / 100);
      return acc + (sellingPrice * item.quantity);
    }, 0);
  };

  const laborCost = laborTime * laborCostPerHour;
  const partsCost = calculateSubtotalItems();
  const subtotal = partsCost + laborCost;
  const taxes = subtotal * (taxRate / 100);
  const total = subtotal + taxes;

  return (
    <div 
      id="print-estimate-root" 
      className="p-6 font-sans text-xs flex flex-col"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '800px',
        minHeight: '1123px',
        zIndex: -1000,
        backgroundColor: colors.white,
        color: colors.black,
        pointerEvents: 'none'
      }}
    >
      <div className="flex-1">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 mb-4 border-b-2" style={{ borderColor: colors.slate800 }}>
          <div className="flex items-start gap-4" style={{ width: '100%' }}>
            {settings.logo && (
              <img src={settings.logo} alt="Logótipo" style={{ maxHeight: '64px', maxWidth: '200px' }} />
            )}
            <div style={{ flex: 1 }}>
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
            <h2 className="text-xl font-bold uppercase" style={{ color: colors.slate800 }}>Estimativa de Orçamento</h2>
            <p className="text-base font-medium mt-1">Nº: EST-{format(new Date(), "yyyyMMdd-HHmm")}</p>
            <p style={{ color: colors.slate600 }}>Data: {format(new Date(), "dd/MM/yyyy", { locale: pt })}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-bold pb-1 mb-2 uppercase border-b" style={{ borderColor: colors.slate300 }}>
            Proposta de Intervenção
          </h3>
          
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
              {items.map((item, idx) => {
                let name = item.manualName;
                let costPrice = item.manualPrice;
                if (!item.isManual) {
                  const invItem = inventory.find(i => i.id === item.partId);
                  name = invItem ? invItem.name : 'Peça Desconhecida';
                  costPrice = invItem ? invItem.price : 0;
                }
                const sellingPrice = costPrice * (1 + profitMargin / 100);
                const totalLine = sellingPrice * item.quantity;

                return (
                  <tr key={idx} className="border-b" style={{ borderColor: colors.slate200 }}>
                    <td className="py-1 px-2">{name || 'Artigo sem nome'}</td>
                    <td className="py-1 px-2 text-center">{item.quantity}</td>
                    <td className="py-1 px-2 text-right">{formatCurrency(sellingPrice)}</td>
                    <td className="py-1 px-2 text-right">{formatCurrency(totalLine)}</td>
                  </tr>
                );
              })}
              {laborCost > 0 && (
                <tr className="border-b" style={{ borderColor: colors.slate200 }}>
                  <td className="py-1 px-2">Mão de Obra / Serviço Técnico ({laborTime}h)</td>
                  <td className="py-1 px-2 text-center">1</td>
                  <td className="py-1 px-2 text-right">{formatCurrency(laborCost)}</td>
                  <td className="py-1 px-2 text-right">{formatCurrency(laborCost)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end mt-3">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-600">Subtotal Líquido:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-600">Impostos ({taxRate}%):</span>
                <span>{formatCurrency(taxes)}</span>
              </div>
              <div className="flex justify-between py-1 mt-1 text-sm font-bold border-t-2" style={{ borderColor: colors.slate800 }}>
                <span>Valor Total Estimado:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <p className="text-[10px] mt-1 text-right" style={{ color: colors.slate500 }}>
                * Documento informativo. Estimativa sujeita a validação técnica.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="mt-6 text-[10px] text-justify" style={{ color: colors.slate500 }}>
          <h4 className="font-bold mb-1 uppercase">Notas sobre a Estimativa</h4>
            <p>
              1. Este orçamento é uma estimativa baseada na simulação inicial. Valores podem ser ajustados caso sejam identificados danos reais ou ocultos durante diagnóstico presencial.
            </p>
            <p>
              2. Os valores apresentados incluem taxa de IVA a {taxRate}% em vigor, salvo erro tipográfico.
            </p>
          {settings.includeTermsInPdf && settings.repairTerms && (
            <div className="mt-2 text-justify whitespace-pre-wrap">
              <h5 className="font-bold mb-1 uppercase">Condições Gerais de Reparação</h5>
              <p>{settings.repairTerms}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
