import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Calculator as CalculatorIcon, Plus, Trash2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PrintEstimateDocument } from '../components/PrintEstimateDocument';

export function Calculator() {
  const { inventory, settings } = useStore();
  const [items, setItems] = useState<{ 
    id: string; 
    isManual: boolean; 
    partId: string; 
    manualName: string; 
    manualPrice: number; 
    quantity: number 
  }[]>([]);
  const [laborTime, setLaborTime] = useState<number>(1);
  const [laborCostPerHour, setLaborCostPerHour] = useState<number>(settings?.defaultLaborCostPerHour ?? 35);
  const [taxRate, setTaxRate] = useState<number>(23); // IVA PT
  const [profitMargin, setProfitMargin] = useState<number>(settings?.defaultProfitMargin ?? 30);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [triggerPrint, setTriggerPrint] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), isManual: false, partId: '', manualName: '', manualPrice: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof typeof items[0], value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  useEffect(() => {
    if (triggerPrint) {
      setIsGeneratingPDF(true);
      setTimeout(async () => {
        try {
          const element = document.getElementById('print-estimate-root');
          if (element) {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Estimativa-${new Date().toISOString().slice(0,10)}.pdf`);
          }
        } catch (error) {
          console.error('Erro ao gerar PDF:', error);
          alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
          setIsGeneratingPDF(false);
          setTriggerPrint(false);
        }
      }, 500);
    }
  }, [triggerPrint]);

  const calculateSubtotalItems = () => {
    return items.reduce((acc, item) => {
      let costPrice = item.manualPrice;
      if (!item.isManual) {
        if (!item.partId) return acc;
        const invItem = inventory.find(i => i.id === item.partId);
        if (invItem) costPrice = invItem.price;
        else return acc;
      }
      // applies markup
      const sellingPrice = costPrice * (1 + profitMargin / 100);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalculatorIcon className="h-6 w-6" />
          Calculadora de Orçamentos
        </h1>
        <button
          onClick={() => {
            if (items.length === 0 && laborTime === 0) {
              alert("Adicione artigos ou mão de obra antes de imprimir.");
              return;
            }
            setTriggerPrint(true);
          }}
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
                    let costPrice = item.manualPrice;
                    if (!item.isManual && item.partId) {
                      const invItem = inventory.find(i => i.id === item.partId);
                      if (invItem) costPrice = invItem.price;
                    }
                    const sellingPrice = costPrice * (1 + profitMargin / 100);
                    const totalLine = sellingPrice * item.quantity;
                    
                    return (
                      <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex-1 w-full">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-slate-500 block">Peça / Componente</label>
                            <label className="text-xs flex items-center gap-1 text-blue-600 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={item.isManual} 
                                onChange={(e) => updateItem(item.id, 'isManual', e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                              />
                              Inserção Manual
                            </label>
                          </div>
                          
                          {item.isManual ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Nome da peça"
                                value={item.manualName}
                                onChange={(e) => updateItem(item.id, 'manualName', e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                              />
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Custo"
                                  value={item.manualPrice || ''}
                                  onChange={(e) => updateItem(item.id, 'manualPrice', Number(e.target.value) || 0)}
                                  className="w-full rounded-md border border-slate-300 pl-3 pr-8 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                                />
                                <span className="absolute right-3 top-2 text-slate-400 text-sm">€</span>
                              </div>
                            </div>
                          ) : (
                            <select
                              value={item.partId}
                              onChange={(e) => updateItem(item.id, 'partId', e.target.value)}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                            >
                              <option value="">Selecione uma peça do inventário...</option>
                              {inventory.map(i => (
                                <option key={i.id} value={i.id}>{i.name} (Custo: {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(i.price)})</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-start">
                          <div className="w-20">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Qtd</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value) || 1)}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          <div className="w-24 text-right">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Venda Unit.</label>
                            <div className="font-semibold text-slate-800 text-sm mt-2">
                              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(sellingPrice)}
                            </div>
                          </div>
                          <div className="w-24 text-right">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Total Linha</label>
                            <div className="font-semibold text-slate-800 text-sm mt-2">
                              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalLine)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="mt-6 text-slate-400 hover:text-red-500 p-1 shrink-0"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
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

      {triggerPrint && settings && (
        <PrintEstimateDocument 
          items={items}
          inventory={inventory}
          settings={settings}
          laborTime={laborTime}
          laborCostPerHour={laborCostPerHour}
          taxRate={taxRate}
          profitMargin={profitMargin}
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
    </div>
  );
}
