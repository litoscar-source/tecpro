import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calculator as CalculatorIcon, Plus, Trash2, Printer } from 'lucide-react';

export function Calculator() {
  const { inventory, settings } = useStore();
  const [items, setItems] = useState<{ id: string; partId: string; quantity: number }[]>([]);
  const [laborTime, setLaborTime] = useState<number>(1);
  const [laborCostPerHour, setLaborCostPerHour] = useState<number>(35);
  const [taxRate, setTaxRate] = useState<number>(23); // IVA PT
  const [profitMargin, setProfitMargin] = useState<number>(30); // Default profit margin on cost

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), partId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: 'partId' | 'quantity', value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateSubtotalItems = () => {
    return items.reduce((acc, item) => {
      if (!item.partId) return acc;
      const invItem = inventory.find(i => i.id === item.partId);
      if (!invItem) return acc;
      // applies markup
      const sellingPrice = invItem.price * (1 + profitMargin / 100);
      return acc + (sellingPrice * item.quantity);
    }, 0);
  };

  const calculateSubtotalLabor = () => {
    return laborTime * laborCostPerHour;
  };

  const calculateSubtotal = () => {
    return calculateSubtotalItems() + calculateSubtotalLabor();
  };

  const calculateTaxes = () => {
    return calculateSubtotal() * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalculatorIcon className="h-6 w-6" />
          Calculadora de Orçamentos
        </h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Printer className="h-5 w-5" /> Imprimir Estimativa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Items Section */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex-1">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900">Peças & Componentes</h2>
              <button 
                onClick={handleAddItem}
                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="h-4 w-4" /> Adicionar Peça
              </button>
            </div>
            <div className="p-6">
              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Sem peças adicionadas. Clique em "Adicionar Peça" para começar.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => {
                    const invItem = inventory.find(i => i.id === item.partId);
                    const costPrice = invItem ? invItem.price : 0;
                    const sellingPrice = costPrice * (1 + profitMargin / 100);
                    const totalLine = sellingPrice * item.quantity;
                    
                    return (
                      <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Peça / Componente</label>
                          <select
                            value={item.partId}
                            onChange={(e) => updateItem(item.id, 'partId', e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          >
                            <option value="">Selecione uma peça...</option>
                            {inventory.map(i => (
                              <option key={i.id} value={i.id}>{i.name} (Custo: {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(i.price)})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Qtd</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value) || 1)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="w-32 text-right">
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Venda Unit.</label>
                          <div className="font-semibold text-slate-800 text-sm mt-2">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(sellingPrice)}
                          </div>
                        </div>
                        <div className="w-32 text-right">
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Total Linha</label>
                          <div className="font-semibold text-slate-800 text-sm mt-2">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalLine)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="mt-6 text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Configuration */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-lg font-medium text-slate-900">Configuração de Custos</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Mão de Obra Estimada (Horas)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={laborTime}
                  onChange={(e) => setLaborTime(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Custo Hora de Trabalho (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={laborCostPerHour}
                  onChange={(e) => setLaborCostPerHour(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <hr className="border-slate-200 my-2" />
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Margem de Lucro nas Peças (%)</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Taxa IVA (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-slate-200 bg-slate-900 shadow-sm overflow-hidden text-white">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-6">Resumo Estimado</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Subtotal Peças:</span>
                  <span className="font-medium text-white">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateSubtotalItems())}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Subtotal Mão de Obra:</span>
                  <span className="font-medium text-white">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateSubtotalLabor())}</span>
                </div>
                <div className="border-t border-slate-700 pt-3 flex justify-between items-center text-slate-300">
                  <span>Subtotal Líquido:</span>
                  <span className="font-medium text-white">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Impostos Estimados ({taxRate}%):</span>
                  <span className="font-medium text-white">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateTaxes())}</span>
                </div>
                
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-medium text-slate-300">Valor Total Estimado</span>
                    <span className="text-3xl font-bold text-blue-400">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
