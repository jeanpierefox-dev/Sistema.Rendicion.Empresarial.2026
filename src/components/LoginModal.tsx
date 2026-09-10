import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { CompanySettings } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  company: CompanySettings;
  onLogin: (username: string, pass: string) => boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, company, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(username.trim(), password.trim());
    if (!success) {
      setError('Credenciales incorrectas. Verifique su usuario y contraseña autorizados.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header with Company details */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg border border-indigo-400/30 mb-3">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Building2 className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white line-clamp-1">{company.razonSocial}</h2>
          <p className="text-xs text-indigo-300 font-mono mt-0.5">RUC: {company.ruc}</p>
          <div className="mt-3 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs border border-indigo-500/30 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sistema Corporativo de Rendición de Gastos</span>
          </div>
        </div>

        {/* Login Form without exposed credentials */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Usuario Corporativo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-input-username"
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario asignado"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-input-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 transition-all font-mono"
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <span>Ingresar al Sistema</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Acceso protegido para personal autorizado de {company.razonSocial}
        </div>
      </div>
    </div>
  );
};
