import React, { useState } from 'react';
import {
  Building2,
  Bell,
  LogOut,
  Sliders,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  ShieldCheck,
  Users,
  RotateCcw,
} from 'lucide-react';
import { User, CompanySettings, AppNotification } from '../types';

interface NavbarProps {
  currentUser: User | null;
  company: CompanySettings;
  activeTab: 'rendiciones' | 'aprobaciones' | 'centros_costos' | 'analitica';
  setActiveTab: (tab: 'rendiciones' | 'aprobaciones' | 'centros_costos' | 'analitica') => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onOpenUserManagement: () => void;
  onOpenRestoreSystem: () => void;
  onLogout: () => void;
  onSwitchUser: (username: string) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  allUsers: User[];
  isMobileMode: boolean;
  setIsMobileMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  company,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenUserManagement,
  onOpenRestoreSystem,
  onLogout,
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
  allUsers,
  isMobileMode,
  setIsMobileMode,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.leido).length;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Corporate Strip */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Company Brand & Logo */}
          <div
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('rendiciones')}
          >
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt="Logo Corporativo"
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded bg-white p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-inner font-bold text-lg shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white line-clamp-1">
                  {company.razonSocial}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 font-mono">
                  RUC {company.ruc}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden xs:block line-clamp-1">
                Rendición de Gastos y Desembolsos
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              id="nav-tab-rendiciones"
              onClick={() => setActiveTab('rendiciones')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'rendiciones'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              Rendiciones & Comprobantes
            </button>
            <button
              id="nav-tab-aprobaciones"
              onClick={() => setActiveTab('aprobaciones')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'aprobaciones'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <span>Aprobación Jerárquica</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/30 text-amber-300 rounded-full">
                Móvil
              </span>
            </button>
            <button
              id="nav-tab-centros"
              onClick={() => setActiveTab('centros_costos')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'centros_costos'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              Límites & Centros de Costos
            </button>
            <button
              id="nav-tab-analitica"
              onClick={() => setActiveTab('analitica')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'analitica'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              Analítica & Reportes
            </button>
          </nav>

          {/* Right actions: User Management (Admin only), Mobile View, Settings, Notifications, Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* User Management and Restore buttons (Exclusively visible/accessible for Admin) */}
            {isAdmin && (
              <>
                <button
                  id="btn-user-management"
                  onClick={onOpenUserManagement}
                  title="Gestión de Usuarios (Exclusivo Administrador)"
                  className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden xl:inline text-xs font-semibold">Usuarios</span>
                </button>

                <button
                  id="btn-restaurar-sistema"
                  onClick={onOpenRestoreSystem}
                  title="Restaurar Sistema a Valores de Fábrica (Exclusivo Administrador)"
                  className="p-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden xl:inline text-xs font-semibold">Restaurar</span>
                </button>
              </>
            )}

            {/* Mobile View Simulator Toggle */}
            <button
              id="btn-toggle-mobile-view"
              onClick={() => setIsMobileMode(!isMobileMode)}
              title="Alternar Vista Móvil de Aprobación"
              className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all border cursor-pointer ${
                isMobileMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Vista Móvil</span>
            </button>

            {/* Company Settings */}
            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              title="Configuración de la Empresa, Cuentas Bancarias y Logo"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                id="btn-toggle-notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white relative transition-colors cursor-pointer"
                title="Notificaciones en tiempo real"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden">
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-sm">Notificaciones en Tiempo Real</span>
                    </div>
                    <span className="text-xs bg-indigo-600/60 px-2 py-0.5 rounded-full text-indigo-100 font-medium">
                      {unreadCount} pendientes
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-500">No hay notificaciones.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            if (n.rendicionId) setActiveTab('rendiciones');
                          }}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.leido ? 'bg-indigo-50/50 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-1.5">
                              {n.tipo === 'aprobacion' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : n.tipo === 'observacion' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ) : (
                                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              )}
                              <span className="font-bold text-slate-900">{n.titulo}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                          </div>
                          <p className="mt-1 text-slate-600 text-[11px] leading-relaxed pl-5">
                            {n.mensaje}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                    <span className="text-[10px] text-slate-500">
                      Alertas automáticas para aprobaciones y auditoría contable
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Current User & Role Switcher */}
            {currentUser && (
              <div className="relative">
                <button
                  id="btn-user-profile"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-600"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-semibold text-white leading-none">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-indigo-400 font-medium leading-tight">
                      {currentUser.roleLabel}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Sesión Actual</p>
                      <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-xs text-indigo-600 font-semibold">{currentUser.roleLabel}</p>
                      <span className="inline-flex items-center mt-1 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                        Usuario: {currentUser.username}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="p-2 border-b border-slate-100 bg-indigo-50/50 space-y-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenUserManagement();
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-indigo-900 hover:bg-indigo-100 flex items-center space-x-2 cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>Panel de Gestión de Usuarios</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenRestoreSystem();
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-rose-800 hover:bg-rose-100 flex items-center space-x-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4 text-rose-600" />
                          <span>Restaurar Sistema (Valores de Fábrica)</span>
                        </button>
                      </div>
                    )}

                    <div className="p-2 border-b border-slate-100">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Cambiar Usuario / Rol Jerárquico:
                      </p>
                      {allUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u.username);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            currentUser.username === u.username
                              ? 'bg-indigo-50 text-indigo-900 font-semibold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="leading-tight">{u.name}</p>
                            <p className="text-[10px] text-slate-500">{u.roleLabel}</p>
                          </div>
                          {currentUser.username === u.username && (
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 px-2 py-1 flex items-center justify-around overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('rendiciones')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap cursor-pointer ${
            activeTab === 'rendiciones' ? 'bg-indigo-600 text-white' : 'text-slate-300'
          }`}
        >
          Rendiciones
        </button>
        <button
          onClick={() => setActiveTab('aprobaciones')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap cursor-pointer ${
            activeTab === 'aprobaciones' ? 'bg-indigo-600 text-white' : 'text-slate-300'
          }`}
        >
          Aprobación Móvil
        </button>
        <button
          onClick={() => setActiveTab('centros_costos')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap cursor-pointer ${
            activeTab === 'centros_costos' ? 'bg-indigo-600 text-white' : 'text-slate-300'
          }`}
        >
          Límites & CC
        </button>
        <button
          onClick={() => setActiveTab('analitica')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap cursor-pointer ${
            activeTab === 'analitica' ? 'bg-indigo-600 text-white' : 'text-slate-300'
          }`}
        >
          Analítica
        </button>
      </div>
    </header>
  );
};
