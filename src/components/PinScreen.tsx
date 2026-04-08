import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface PinScreenProps {
  onSuccess: () => void;
}

export function PinScreen({ onSuccess }: PinScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '9816') {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h1>
        <p className="text-slate-500 mb-8">Por favor, insira o código de acesso para continuar.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              className={`w-full text-center text-3xl tracking-[0.5em] rounded-xl border ${error ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-300 bg-slate-50 text-slate-900'} px-4 py-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono`}
              placeholder="••••"
              maxLength={4}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2">Código incorreto. Tente novamente.</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
