import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Users, Wrench, CheckCircle, Clock, DollarSign, Bell, AlertTriangle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { orders, customers, inventory, fetchData } = useStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingOrders = orders.filter(o => o.status === 'entrada' || o.status === 'diagnostico' || o.status === 'orcamento').length;
  const inProgressOrders = orders.filter(o => o.status === 'aguarda_peca' || o.status === 'expedido').length;
  const completedOrders = orders.filter(o => o.status === 'pronto').length;
  const closedOrders = orders.filter(o => o.status === 'fechado').length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const recentQuoteResponses = [...orders].filter(o => {
    if (!o.clientQuoteStatus || !o.clientQuoteDate) return false;
    const date = new Date(o.clientQuoteDate);
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  const lowStockThreshold = 2;
  const lowStockItems = inventory.filter(item => item.quantity <= lowStockThreshold);

  const notifications = [
    ...recentQuoteResponses.map(order => {
      const customer = customers.find(c => c.id === order.customerId);
      return {
        id: `quote-${order.id}`,
        type: 'quote',
        title: `Orçamento ${order.clientQuoteStatus === 'accepted' ? 'Aceite' : 'Recusado'} - OS #${order.id.toUpperCase().substring(0,8)}`,
        description: `Cliente: ${customer?.name}${order.clientQuoteObservation ? ` | Obs: "${order.clientQuoteObservation}"` : ''}`,
        date: new Date(order.clientQuoteDate!),
        status: order.clientQuoteStatus === 'accepted' ? 'success' : 'danger',
        link: '/orders'
      };
    }),
    ...lowStockItems.map(item => ({
      id: `stock-${item.id}`,
      type: 'stock',
      title: `Aviso de Stock Pendente: ${item.name}`,
      description: `Quantidade atual (${item.quantity} un.) é baixa.`,
      date: new Date(item.createdAt || new Date()),
      status: 'warning',
      link: '/inventory'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalRevenue = orders
    .filter(o => o.status === 'pronto' || o.status === 'fechado')
    .reduce((acc, order) => acc + order.totalCost, 0);

  const monthlyRevenue = orders
    .filter(o => {
      if (o.status !== 'pronto' && o.status !== 'fechado') return false;
      const orderDate = new Date(o.completedAt || o.updatedAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    })
    .reduce((acc, order) => acc + order.totalCost, 0);

  const monthlyPartsCost = orders
    .filter(o => {
      if (o.status !== 'pronto' && o.status !== 'fechado') return false;
      const orderDate = new Date(o.completedAt || o.updatedAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    })
    .reduce((acc, order) => {
      const partsCost = order.partsUsed?.reduce((sum, part) => {
        const item = inventory.find(i => i.id === part.partId);
        return sum + (item ? (item.cost || 0) * part.quantity : 0);
      }, 0) || 0;
      return acc + partsCost;
    }, 0);

  const monthlyProfit = monthlyRevenue - monthlyPartsCost;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'entrada': return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">Entrada</span>;
      case 'diagnostico': return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Diagnóstico</span>;
      case 'orcamento': return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Orçamento</span>;
      case 'aguarda_peca': return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">A Aguardar</span>;
      case 'expedido': return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">Expedido</span>;
      case 'pronto': return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Pronto</span>;
      case 'fechado': return <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">Fechado</span>;
      case 'cancelado': return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Cancelado</span>;
      default: return null;
    }
  };

  // Prepara dados do gráfico de equipamento
  const deviceCounts = orders.reduce((acc, order) => {
    const type = order.deviceType || 'Outro';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceData = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

  const pt_months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const chartData = pt_months.map((month, index) => {
    const mOrders = orders.filter(o => {
      if (o.status !== 'pronto' && o.status !== 'fechado') return false;
      const date = new Date(o.completedAt || o.updatedAt);
      return date.getMonth() === index && date.getFullYear() === currentYear;
    });
    
    // Revenue from this month (labor + parts)
    const rev = mOrders.reduce((sum, order) => {
      let tC = Number(order.laborCost) || 0;
      order.partsUsed?.forEach(p => {
        const item = inventory.find(i => i.id === p.partId);
        if (item) tC += item.price * p.quantity;
      });
      tC -= (Number(order.partsDiscount) || 0);
      return sum + tC;
    }, 0);

    // Cost from this month (parts cost)
    const cost = mOrders.reduce((acc, order) => {
      const pCost = order.partsUsed?.reduce((sum, part) => {
        const item = inventory.find(i => i.id === part.partId);
        return sum + (item ? (item.cost || 0) * part.quantity : 0);
      }, 0) || 0;
      return acc + pCost;
    }, 0);

    return { name: month, Vendas: rev, Lucro: rev - cost };
  });

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { name: 'Em Aberto', value: pendingOrders + inProgressOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Prontas', value: completedOrders, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Fechadas', value: closedOrders, icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-100' },
    { name: 'Faturação (Mês)', value: new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(monthlyRevenue), icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral da sua assistência técnica.</p>
      </div>

      {notifications.length > 0 && (
        <div className="bg-white border text-sm border-blue-200 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Central de Notificações ({notifications.length})</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {notifications.map(notif => (
                <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {notif.status === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                        {notif.status === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                        {notif.status === 'danger' && <XCircle className="h-5 w-5 text-red-500" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{notif.title}</h4>
                        <p className="text-slate-600 mt-1">{notif.description}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {format(notif.date, "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                        </p>
                      </div>
                    </div>
                    <Link to={notif.link} className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap">
                      Ver Mais
                    </Link>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="flex items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-medium text-slate-900">Ordens de Reparação Recentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">OS #</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Equipamento</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentOrders.map((order) => {
                  const customer = customers.find(c => c.id === order.customerId);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{order.id.toUpperCase()}</td>
                      <td className="px-6 py-4">{customer?.name || 'Desconhecido'}</td>
                      <td className="px-6 py-4">{order.brand} {order.model}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4">{format(new Date(order.createdAt), "dd/MM/yyyy", { locale: pt })}</td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhuma ordem de reparação encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-medium text-slate-900">Reparações por Equipamento</h2>
          </div>
          <div className="p-6 flex-1 min-h-[350px]">
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} un.`, 'Quantidade']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <Wrench className="h-10 w-10 mb-4 opacity-20" />
                <p>Sem dados suficientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-medium text-slate-900">Vendas e Lucro (Evolução Anual)</h2>
          </div>
          <div className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-200)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-slate-500)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-slate-500)' }} tickFormatter={(val) => `${val}€`} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-slate-50)' }} 
                  formatter={(value: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)}
                  contentStyle={{ backgroundColor: 'var(--color-white)', borderColor: 'var(--color-slate-200)', color: 'var(--color-slate-900)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
