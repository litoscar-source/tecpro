import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wrench, Package, Settings, LogOut, Calendar, X, BarChart2, Calculator } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Ordens de Reparação', path: '/orders', icon: Wrench },
  { name: 'Agenda', path: '/agenda', icon: Calendar },
  { name: 'Clientes', path: '/customers', icon: Users },
  { name: 'Stock', path: '/inventory', icon: Package },
  { name: 'Relatórios', path: '/reports', icon: BarChart2 },
  { name: 'Calculadora de Orçamentos', path: '/calculator', icon: Calculator },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl md:shadow-none">
      <div className="flex h-16 shrink-0 items-center justify-between px-4 md:justify-center border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-400">
          <Wrench className="h-6 w-6 shrink-0" />
          <span className="truncate">PHONELAB repair</span>
        </div>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="md:hidden p-1 text-slate-400 hover:text-white rounded-md">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-slate-800 p-4 shrink-0 space-y-2">
        <Link
          to="/settings"
          onClick={onCloseMobile}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            location.pathname === '/settings'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings className="h-5 w-5 shrink-0" />
          Configurações
        </Link>
        <button 
          onClick={() => {
            sessionStorage.removeItem('isAuthenticated');
            window.location.reload();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sair
        </button>
      </div>
    </div>
  );
}
