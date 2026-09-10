import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Shield,
  Edit2,
  Plus,
  Save,
  Trash2,
  Key,
  Lock,
  CreditCard,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
  onAddUser: (newUser: User) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onUpdateUser,
  onAddUser,
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Acceso Denegado</h3>
          <p className="text-xs text-slate-600">
            Solo el Administrador General tiene permisos para editar o gestionar los usuarios del sistema.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const handleStartEdit = (u: User) => {
    setEditingUserId(u.id);
    setFormData({ ...u });
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (!editingUserId || !formData.name || !formData.username) return;
    const existing = users.find((u) => u.id === editingUserId);
    if (!existing) return;

    const updated: User = {
      ...existing,
      ...formData,
      roleLabel:
        formData.role === 'admin'
          ? 'Administrador General & Contralor'
          : formData.role === 'gerente'
          ? 'Gerente de Área (Aprobador)'
          : formData.role === 'contador'
          ? 'Auditor Contable & Tesorería'
          : 'Supervisor Técnico (Rendidor)',
    } as User;

    onUpdateUser(updated);
    setEditingUserId(null);
    setFormData({});
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingUserId(null);
    setFormData({
      username: '',
      password: '1234',
      name: '',
      email: '',
      role: 'rendidor',
      department: 'Operaciones',
      dni: '',
      cargo: 'Colaborador',
      cuentaBancaria: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });
  };

  const handleSaveNew = () => {
    if (!formData.name || !formData.username) {
      alert('Por favor ingrese el nombre y el usuario.');
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: (formData.username || '').trim().toLowerCase(),
      password: formData.password || '1234',
      name: (formData.name || '').trim(),
      email: (formData.email || `${formData.username}@empresa.pe`).trim(),
      role: (formData.role as UserRole) || 'rendidor',
      roleLabel:
        formData.role === 'admin'
          ? 'Administrador General & Contralor'
          : formData.role === 'gerente'
          ? 'Gerente de Área (Aprobador)'
          : formData.role === 'contador'
          ? 'Auditor Contable & Tesorería'
          : 'Supervisor Técnico (Rendidor)',
      department: formData.department || 'Operaciones',
      dni: formData.dni || '',
      cargo: formData.cargo || 'Colaborador',
      cuentaBancaria: formData.cuentaBancaria || '',
      avatar: formData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    onAddUser(newUser);
    setIsAdding(false);
    setFormData({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Gestión de Usuarios y Permisos</h3>
              <p className="text-xs text-slate-400">
                Módulo exclusivo de Administración para edición de credenciales, roles y cuentas bancarias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            {users.length} usuarios registrados en la plataforma
          </span>
          {!isAdding && !editingUserId && (
            <button
              onClick={handleStartAdd}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          )}
        </div>

        {/* Scrollable list or form */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Add or Edit Form */}
          {(isAdding || editingUserId) && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  {isAdding ? 'Crear Nuevo Usuario' : 'Editar Datos del Usuario'}
                </h4>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingUserId(null);
                    setFormData({});
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar edición
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej. Juan Pérez Ramos"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Usuario de Acceso *</label>
                  <input
                    type="text"
                    required
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ej. jperez"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contraseña *</label>
                  <input
                    type="text"
                    required
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="1234"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rol en el Sistema *</label>
                  <select
                    value={formData.role || 'rendidor'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900"
                  >
                    <option value="admin">Administrador General & Contralor</option>
                    <option value="gerente">Gerente de Área (Aprobador)</option>
                    <option value="rendidor">Supervisor Técnico (Rendidor)</option>
                    <option value="contador">Auditor Contable & Tesorería</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DNI del Colaborador</label>
                  <input
                    type="text"
                    value={formData.dni || ''}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="45892019"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cargo / Puesto</label>
                  <input
                    type="text"
                    value={formData.cargo || ''}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="ej. Supervisor de Mantenimiento"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="ej. Operaciones"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cuenta Bancaria Destino (para rendición)
                  </label>
                  <input
                    type="text"
                    value={formData.cuentaBancaria || ''}
                    onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
                    placeholder="ej. BCP Cta Ahorros 194-48291048-0-91"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingUserId(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={isAdding ? handleSaveNew : handleSaveEdit}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center space-x-1 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </div>
          )}

          {/* User List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">Nombre Completo</th>
                    <th className="py-2.5 px-3">Rol</th>
                    <th className="py-2.5 px-3">DNI / Cargo</th>
                    <th className="py-2.5 px-3 font-mono">Cuenta Bancaria</th>
                    <th className="py-2.5 px-3 font-mono">Clave</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {u.username}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <img
                            src={u.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-rose-100 text-rose-800'
                              : u.role === 'gerente'
                              ? 'bg-blue-100 text-blue-800'
                              : u.role === 'contador'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>DNI: {u.dni || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{u.cargo || u.department}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        {u.cuentaBancaria || 'No registrada'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        •••• (editable)
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                          title="Editar Datos de Usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg"
          >
            Cerrar Gestión de Usuarios
          </button>
        </div>
      </div>
    </div>
  );
};
