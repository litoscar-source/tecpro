import { useStore } from '../store/useStore';
import { Users, Wrench, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export function Dashboard() {
  const { orders, customers } = useStore();

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'waiting_parts').length;
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, order) => acc + order.totalCost, 0);

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { name: 'OS Pendentes', value: pendingOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Em Curso', value: inProgressOrders, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Concluídas', value: completedOrders, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Faturação Total', value: new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalRevenue), icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Pendente</span>;
      case 'in_progress': return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Em Curso</span>;
      case 'waiting_parts': return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">A Aguardar Peça</span>;
      case 'completed': return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Concluído</span>;
      case 'canceled': return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Cancelado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral da sua assistência técnica.</p>
      </div>

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

        <div className="col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-medium text-slate-900">Resumo de Clientes</h2>
          </div>
          <div className="p-6 flex flex-col items-center justify-center h-64">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
              <Users className="h-10 w-10" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{customers.length}</p>
            <p className="text-sm text-slate-500 mt-1">Clientes Cadastrados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
