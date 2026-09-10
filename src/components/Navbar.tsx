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
  Receipt,
  CheckCheck,
  BarChart3,
  Layers,
  Cloud,
  RefreshCw,
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
  cloudStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime?: string | null;
  onManualSync?: () => void;
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
  cloudStatus = 'synced',
  lastSyncTime,
  onManualSync,
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
            className="flex items-center space-x-3 cursor-pointer select-none group"
            onClick={() => setActiveTab('rendiciones')}
          >
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt="Logo Corporativo"
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-xl bg-white p-1 ring-1 ring-white/20 shadow-xs group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white line-clamp-1 group-hover:text-indigo-200 transition-colors">
                  {company.razonSocial}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-indigo-500/25 text-indigo-200 rounded-md border border-indigo-400/30 font-mono tracking-wider">
                  RUC {company.ruc}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium hidden xs:flex items-center space-x-1.5 line-clamp-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 inline-block animate-pulse" />
                <span>Plataforma Corporativa de Rendición & Gastos</span>
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            <button
              id="nav-tab-rendiciones"
              onClick={() => setActiveTab('rendiciones')}
              className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'rendiciones'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-400 shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white font-semibold'
              }`}
            >
              <Receipt className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Rendiciones & Gastos</span>
            </button>
            <button
              id="nav-tab-aprobaciones"
              onClick={() => setActiveTab('aprobaciones')}
              className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'aprobaciones'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-400 shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white font-semibold'
              }`}
            >
              <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Aprobaciones</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                Móvil
              </span>
            </button>
            <button
              id="nav-tab-centros"
              onClick={() => setActiveTab('centros_costos')}
              className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'centros_costos'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-400 shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white font-semibold'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Límites & CC</span>
            </button>
            <button
              id="nav-tab-analitica"
              onClick={() => setActiveTab('analitica')}
              className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'analitica'
                  ? 'bg-slate-800 text-white border-b-2 border-indigo-400 shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white font-semibold'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Analítica & Reportes</span>
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
                  title="Gestión de Usuarios (Crear, Editar, Eliminar y Fotos)"
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-bold shadow-xs active:scale-95"
                >
                  <Users className="w-4 h-4 text-indigo-300" />
                  <span>Usuarios</span>
                </button>

                <button
                  id="btn-restaurar-sistema"
                  onClick={onOpenRestoreSystem}
                  title="Restaurar Sistema a Valores de Fábrica (Exclusivo Administrador)"
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-bold shadow-xs active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-rose-300" />
                  <span>Restaurar</span>
                </button>
              </>
            )}

            {/* Mobile View Simulator Toggle */}
            <button
              id="btn-toggle-mobile-view"
              onClick={() => setIsMobileMode(!isMobileMode)}
              title="Alternar Vista Móvil de Aprobación"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all border cursor-pointer active:scale-95 ${
                isMobileMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Vista Móvil</span>
            </button>

            {/* Cloud Sync Status Indicator */}
            <button
              id="btn-cloud-sync"
              onClick={onManualSync}
              title={
                cloudStatus === 'syncing'
                  ? 'Sincronizando datos con la nube Firestore...'
                  : cloudStatus === 'error'
                  ? 'Error al conectar con la nube. Clic para reintentar.'
                  : `Nube Firestore Activa. ${lastSyncTime ? `Última sincronización: ${lastSyncTime}` : 'Sincronizado'}. Clic para refrescar.`
              }
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all border cursor-pointer active:scale-95 ${
                cloudStatus === 'syncing'
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 animate-pulse'
                  : cloudStatus === 'error'
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
              }`}
            >
              {cloudStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300 shrink-0" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="hidden md:inline text-xs">
                {cloudStatus === 'syncing' ? 'Sincronizando...' : 'Nube'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 hidden sm:inline-block" />
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
                  className="flex items-center space-x-2.5 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-400/50 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-white tracking-tight leading-snug">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-indigo-300 font-semibold tracking-wider uppercase leading-none mt-0.5">
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
      <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 px-2 py-1.5 flex items-center justify-around overflow-x-auto text-xs gap-1">
        <button
          onClick={() => setActiveTab('rendiciones')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer flex items-center space-x-1.5 transition-colors ${
            activeTab === 'rendiciones'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Rendiciones</span>
        </button>
        <button
          onClick={() => setActiveTab('aprobaciones')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer flex items-center space-x-1.5 transition-colors ${
            activeTab === 'aprobaciones'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Aprobaciones</span>
        </button>
        <button
          onClick={() => setActiveTab('centros_costos')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer flex items-center space-x-1.5 transition-colors ${
            activeTab === 'centros_costos'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Límites & CC</span>
        </button>
        <button
          onClick={() => setActiveTab('analitica')}
          className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer flex items-center space-x-1.5 transition-colors ${
            activeTab === 'analitica'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analítica</span>
        </button>
      </div>
    </header>
  );
};
