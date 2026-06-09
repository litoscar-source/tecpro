import { Bell, Search, User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {onMenuToggle && (
          <button 
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        <div className="relative w-full max-w-[150px] sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hidden sm:block">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        
        <div className="flex items-center gap-2 md:gap-3 sm:border-l sm:pl-4 pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-medium text-slate-700">Admin</span>
            <span className="text-xs text-slate-500">Técnico Principal</span>
          </div>
        </div>
      </div>
    </header>
  );
}
