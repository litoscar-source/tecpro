import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { BarChart2, PieChart, TrendingUp, Calendar as CalendarIcon, DollarSign, Package } from 'lucide-react';
import { format, subMonths, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';

export function Reports() {
  const { orders, inventory } = useStore();
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Calculate Part Margins
  const calculatePartMargins = () => {
    let totalRevenue = 0;
    let totalCost = 0;

    const partsData = inventory.map(item => {
      const margin = item.price - item.cost;
      const marginPercent = item.cost > 0 ? (margin / item.cost) * 100 : 100;
      return {
        ...item,
        margin,
        marginPercent
      };
    }).sort((a, b) => b.marginPercent - a.marginPercent);

    return partsData;
  };

  const calculateFinancialBalance = () => {
    let revenue = 0;
    let laborRevenue = 0;
    let partsRevenue = 0;
    let partsCost = 0;
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    const closedOrders = orders.filter(o => 
      o.status === 'fechado' &&
      o.completedAt &&
      isAfter(new Date(o.completedAt), startDate) &&
      isBefore(new Date(o.completedAt), endDate)
    );

    closedOrders.forEach(o => {
      const labor = Number(o.laborCost) || 0;
      laborRevenue += labor;
      revenue += labor;

      o.partsUsed.forEach(p => {
        const item = inventory.find(i => i.id === p.partId);
        if (item) {
          const itemRev = item.price * p.quantity;
          const itemCost = item.cost * p.quantity;
          partsRevenue += itemRev;
          partsCost += itemCost;
          revenue += itemRev;
        }
      });
      // apply parts discount
      const discount = Number(o.partsDiscount) || 0;
      revenue -= discount;
      partsRevenue -= discount;
    });

    return {
      totalOrders: closedOrders.length,
      revenue,
      partsRevenue,
      partsCost,
      laborRevenue,
      partsProfit: partsRevenue - partsCost,
      totalProfit: (partsRevenue - partsCost) + laborRevenue
    };
  };

  const partsMargins = calculatePartMargins();
  const balance = calculateFinancialBalance();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Relatórios Financeiros</h1>
        <p className="text-sm text-slate-500">Métricas, lucros e balancetes.</p>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data de Fim</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balancete por Datas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Balancete no Período</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Ordens Fechadas</p>
                <p className="text-2xl font-bold text-slate-900">{balance.totalOrders}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Faturação Total</p>
                <p className="text-2xl font-bold text-blue-700">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(balance.revenue)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Receita Mão de Obra</span>
                <span className="font-medium">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(balance.laborRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Receita de Peças</span>
                <span className="font-medium">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(balance.partsRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-red-600">Custo de Peças</span>
                <span className="font-medium text-red-600">-{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(balance.partsCost)}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-900 font-bold">Lucro Estimado</span>
                <span className="font-bold text-emerald-600 text-lg">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(balance.totalProfit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Margem de Peças */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
            <Package className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Margem por Peça (Top)</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium text-right">Custo</th>
                  <th className="px-4 py-3 font-medium text-right">P. Venda</th>
                  <th className="px-4 py-3 font-medium text-right">Margem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partsMargins.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 truncate max-w-[150px]" title={item.name}>{item.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(item.cost)}</td>
                    <td className="px-4 py-3 text-right">{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(item.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.marginPercent > 50 ? 'bg-emerald-100 text-emerald-800' :
                        item.marginPercent > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.marginPercent.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {partsMargins.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">Nenhuma peça registada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
