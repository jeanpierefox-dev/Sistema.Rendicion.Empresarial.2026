import React, { useState, useRef } from 'react';
import {
  X,
  Shield,
  Edit2,
  Plus,
  Save,
  Trash2,
  Upload,
  Camera,
  FolderOpen,
  AlertTriangle,
  Search,
  CheckCircle2,
  User as UserIcon,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
  onAddUser: (newUser: User) => void;
  onDeleteUser: (userId: string) => void;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
            Solo el Administrador General tiene permisos para crear, editar o eliminar usuarios del sistema.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
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
    setFormError(null);
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingUserId(null);
    setFormError(null);
    setFormData({
      username: '',
      password: '1234',
      name: '',
      email: '',
      role: 'rendidor',
      department: 'Operaciones',
      dni: '',
      cargo: 'Supervisor de Área',
      cuentaBancaria: '',
      avatar: DEFAULT_AVATAR,
    });
  };

  // Image Upload Handler (from local computer folder)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Por favor seleccione un archivo de imagen válido (JPG, PNG, WebP o GIF).');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setFormError('El tamaño de la imagen no debe superar los 6MB.');
      return;
    }

    setFormError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, avatar: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input value so re-uploading the same file works
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Validate form fields
  const validateForm = (isNew: boolean): boolean => {
    if (!formData.name || !formData.name.trim()) {
      setFormError('El nombre completo es obligatorio.');
      return false;
    }
    if (!formData.username || !formData.username.trim()) {
      setFormError('El usuario de acceso es obligatorio.');
      return false;
    }

    const cleanUsername = formData.username.trim().toLowerCase();
    // Check if username already exists for other users
    const exists = users.some(
      (u) => u.username.toLowerCase() === cleanUsername && (isNew || u.id !== editingUserId)
    );
    if (exists) {
      setFormError(`El usuario "${cleanUsername}" ya se encuentra registrado.`);
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSaveEdit = () => {
    if (!editingUserId || !validateForm(false)) return;
    const existing = users.find((u) => u.id === editingUserId);
    if (!existing) return;

    const updated: User = {
      ...existing,
      ...formData,
      username: (formData.username || existing.username).trim().toLowerCase(),
      name: (formData.name || existing.name).trim(),
      email: (formData.email || `${formData.username}@empresa.pe`).trim(),
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

  const handleSaveNew = () => {
    if (!validateForm(true)) return;

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
      cargo: formData.cargo || 'Supervisor de Área',
      cuentaBancaria: formData.cuentaBancaria || '',
      avatar: formData.avatar || DEFAULT_AVATAR,
    };

    onAddUser(newUser);
    setIsAdding(false);
    setFormData({});
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    onDeleteUser(userToDelete.id);
    if (editingUserId === userToDelete.id) {
      setEditingUserId(null);
      setFormData({});
    }
    setUserToDelete(null);
  };

  // Filtered user list
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.dni && u.dni.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/40 text-indigo-300 border border-indigo-500/40">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Gestión de Usuarios y Permisos</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 uppercase">
                  Control Total
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Crear, editar y eliminar usuarios, asignar roles y cargar fotos de perfil desde archivos locales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar & Search */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, usuario o rol..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 shrink-0">
              {filteredUsers.length} de {users.length} usuarios
            </span>
          </div>

          {!isAdding && !editingUserId && (
            <button
              id="btn-crear-nuevo-usuario"
              onClick={handleStartAdd}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer active:scale-98 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Usuario</span>
            </button>
          )}
        </div>

        {/* Scrollable area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 text-xs">
          {/* Add or Edit Form */}
          {(isAdding || editingUserId) && (
            <div className="p-4 sm:p-5 bg-indigo-50/70 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200/80">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                    {isAdding ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-indigo-950 uppercase tracking-wider">
                      {isAdding ? 'Formulario: Crear Nuevo Usuario' : `Editar Usuario: ${formData.name || ''}`}
                    </h4>
                    <p className="text-[11px] text-indigo-700">
                      Complete los datos del colaborador y seleccione una foto desde su equipo
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingUserId(null);
                    setFormData({});
                    setFormError(null);
                  }}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-white rounded-md border border-slate-300 bg-white/60 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* PHOTO UPLOADER SECTION (Colocar foto desde la carpeta) */}
              <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Fotografía del Usuario (Cargar desde Carpeta Local)</span>
                  </label>
                  {formData.avatar && formData.avatar.startsWith('data:image') && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Foto local cargada</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Preview & Dropzone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-4 transition-all shrink-0 shadow-md flex items-center justify-center ${
                      isDragging
                        ? 'border-indigo-600 ring-4 ring-indigo-400 bg-indigo-100'
                        : 'border-white ring-2 ring-indigo-300 hover:ring-indigo-500 bg-slate-100'
                    }`}
                    title="Haga clic o arrastre una imagen para cambiar la foto"
                  >
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserIcon className="w-10 h-10 text-slate-400" />
                    )}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity p-1 text-center">
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-bold uppercase tracking-tight leading-none">
                        Cambiar Foto
                      </span>
                    </div>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="input-user-avatar-file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        id="btn-subir-foto-carpeta"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Subir Foto desde Carpeta</span>
                      </button>

                      {formData.avatar !== DEFAULT_AVATAR && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: DEFAULT_AVATAR })}
                          className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Restaurar por defecto</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Formatos soportados: <strong>JPG, PNG, WebP</strong>. Puede hacer clic en el botón o arrastrar la imagen directamente sobre el círculo.
                    </p>

                    {/* Quick Preset Avatars */}
                    <div className="flex items-center space-x-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium mr-1">Predefinidos:</span>
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: url })}
                          className={`w-6 h-6 rounded-full overflow-hidden border transition-transform hover:scale-110 cursor-pointer ${
                            formData.avatar === url ? 'ring-2 ring-indigo-600 scale-105' : 'border-slate-300 opacity-70'
                          }`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej. Juan Carlos Pérez"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Usuario de Acceso *</label>
                  <input
                    type="text"
                    required
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ej. jperez"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Contraseña de Acceso *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Rol en el Sistema *</label>
                  <select
                    value={formData.role || 'rendidor'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="admin">Administrador General & Contralor</option>
                    <option value="gerente">Gerente de Área (Aprobador)</option>
                    <option value="rendidor">Supervisor Técnico (Rendidor)</option>
                    <option value="contador">Auditor Contable & Tesorería</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">DNI del Colaborador</label>
                  <input
                    type="text"
                    value={formData.dni || ''}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="45892019"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Cargo / Puesto</label>
                  <input
                    type="text"
                    value={formData.cargo || ''}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="ej. Supervisor de Mantenimiento"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Departamento / Área</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="ej. Operaciones"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Cuenta Bancaria Destino (para abono de rendiciones)
                  </label>
                  <input
                    type="text"
                    value={formData.cuentaBancaria || ''}
                    onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
                    placeholder="ej. BCP Cta Ahorros Soles 194-48291048-0-91"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-indigo-200/80 flex items-center justify-between">
                <div>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = users.find((u) => u.id === editingUserId);
                        if (target) setUserToDelete(target);
                      }}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar Este Usuario</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingUserId(null);
                      setFormData({});
                      setFormError(null);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    id="btn-guardar-usuario"
                    onClick={isAdding ? handleSaveNew : handleSaveEdit}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isAdding ? 'Crear Usuario' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Foto & Usuario</th>
                    <th className="py-3 px-3.5">Nombre Completo</th>
                    <th className="py-3 px-3.5">Rol Jerárquico</th>
                    <th className="py-3 px-3.5">DNI & Cargo</th>
                    <th className="py-3 px-3.5 font-mono">Cuenta Bancaria</th>
                    <th className="py-3 px-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No se encontraron usuarios con el criterio de búsqueda "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = currentUser?.id === u.id;
                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            editingUserId === u.id ? 'bg-indigo-50/70 font-medium' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5">
                            <div className="flex items-center space-x-2.5">
                              <div className="relative group">
                                <img
                                  src={u.avatar || DEFAULT_AVATAR}
                                  alt={u.name}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-indigo-200 shadow-xs shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                {u.avatar && u.avatar.startsWith('data:image') && (
                                  <span
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"
                                    title="Foto local cargada"
                                  />
                                )}
                              </div>
                              <div className="font-mono font-bold text-indigo-700">
                                @{u.username}
                                {isSelf && (
                                  <span className="ml-1.5 px-1.5 py-0.2 text-[9px] bg-indigo-100 text-indigo-800 rounded font-sans font-bold">
                                    Tú
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3.5 font-semibold text-slate-900">
                            <div>{u.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                          </td>

                          <td className="py-3 px-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                                u.role === 'admin'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : u.role === 'gerente'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : u.role === 'contador'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 text-slate-600">
                            <div className="font-mono">{u.dni ? `DNI: ${u.dni}` : 'DNI: N/A'}</div>
                            <div className="text-[10px] text-slate-400">
                              {u.cargo} • {u.department}
                            </div>
                          </td>

                          <td className="py-3 px-3.5 font-mono text-[11px] text-slate-700">
                            {u.cuentaBancaria || (
                              <span className="text-slate-400 italic">No registrada</span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(u)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar datos y foto del usuario"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setUserToDelete(u)}
                                disabled={isSelf}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isSelf
                                    ? 'text-slate-300 cursor-not-allowed opacity-50'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={
                                  isSelf
                                    ? 'No puedes eliminar tu propia sesión activa'
                                    : 'Eliminar usuario de la plataforma'
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Las contraseñas y fotos de los usuarios se guardan de forma segura en la base de datos corporativa.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Cerrar Gestión
          </button>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 p-5 max-w-md w-full space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">¿Eliminar este Usuario?</h4>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
              <img
                src={userToDelete.avatar || DEFAULT_AVATAR}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-900">{userToDelete.name}</p>
                <p className="text-slate-500 font-mono">@{userToDelete.username}</p>
                <p className="text-indigo-600 font-semibold">{userToDelete.roleLabel}</p>
              </div>
            </div>

            {currentUser?.id === userToDelete.id ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                <strong>Operación Bloqueada:</strong> No puedes eliminar tu propio usuario mientras tienes la sesión activa.
              </div>
            ) : userToDelete.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                <strong>Operación Bloqueada:</strong> Este usuario es el único Administrador General. Debe existir al menos un administrador en el sistema.
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Confirma que desea eliminar permanentemente a <strong>{userToDelete.name}</strong> (@{userToDelete.username})? El usuario ya no podrá ingresar a la plataforma.
              </p>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-user"
                disabled={
                  currentUser?.id === userToDelete.id ||
                  (userToDelete.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1)
                }
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
