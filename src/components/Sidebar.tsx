import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wrench, Package, Settings, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Ordens de Reparação', path: '/orders', icon: Wrench },
  { name: 'Clientes', path: '/customers', icon: Users },
  { name: 'Stock', path: '/inventory', icon: Package },
  { name: 'Configurações', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-400">
          <Wrench className="h-6 w-6" />
          <span>TechAssist Pro</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-slate-800 p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );
}
