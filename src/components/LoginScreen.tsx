import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: (token: string, user: any) => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token: require2FA ? token : undefined })
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess(data.token, data.user);
      } else {
        if (data.require2FA) {
          setRequire2FA(true);
        } else {
          setError(data.error || 'Erro de autenticação');
        }
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">PhoneLab Repair</h1>
        <p className="text-slate-500 mb-8">Por favor, inicie sessão para continuar.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {!require2FA ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="admin@phonelab.pt"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código 2FA (App Autenticador)</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 tracking-widest text-center text-xl font-mono"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm py-2 text-center">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition-colors mt-2"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
