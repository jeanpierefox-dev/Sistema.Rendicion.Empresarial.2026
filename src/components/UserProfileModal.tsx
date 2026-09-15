import React, { useState, useRef, useEffect } from 'react';
import { X, UserIcon, Shield, UploadCloud, Link as LinkIcon, Edit2, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import type { User } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData(currentUser);
      setShowPassword(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username) return;

    onUpdateUser({
      ...currentUser,
      ...formData,
      name: formData.name,
      username: formData.username,
    } as User);
    
    onClose();
  };

  const handleChange = (field: keyof User, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-indigo-600 border-b border-indigo-700 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-white/20 text-white backdrop-blur-md border border-white/20">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Mi Perfil y Configuración
              </h2>
              <p className="text-[10px] sm:text-xs text-indigo-200 font-medium tracking-wide">
                Configura tu cuenta bancaria y datos personales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            
            {/* Foto de Perfil */}
            <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="relative group shrink-0 mx-auto sm:mx-0">
                <img
                  src={formData.avatar || currentUser.avatar}
                  alt="Avatar"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-indigo-200 shadow-md group-hover:opacity-60 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/60 rounded-full transition-opacity cursor-pointer"
                >
                  <UploadCloud className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] text-white font-bold">Cambiar</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Foto de Perfil</h3>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Haz clic en tu foto para subir una desde tu dispositivo, o elige una de las fotos predeterminadas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_AVATARS.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Preset ${i}`}
                      onClick={() => handleChange('avatar', url)}
                      className={`w-8 h-8 rounded-full object-cover cursor-pointer border-2 transition-transform hover:scale-110 ${
                        formData.avatar === url ? 'border-indigo-600 shadow-md' : 'border-transparent'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Credenciales de Acceso */}
            <div className="col-span-1 md:col-span-2 border border-slate-200 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Credenciales de Acceso</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Usuario (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username || ''}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="ej. jperez"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-10"
                      placeholder="Dejar en blanco para no cambiar"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Solo si deseas cambiar tu contraseña actual.</p>
                </div>
              </div>
            </div>

            {/* Datos Personales */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="ej. Juan Pérez"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="ej. juan@empresa.com"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Documento (DNI/CE)
                </label>
                <input
                  type="text"
                  value={formData.dni || ''}
                  onChange={(e) => handleChange('dni', e.target.value)}
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="ej. 76543210"
                />
              </div>
            </div>

            {/* Datos Corporativos y Bancarios */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cuenta Bancaria Personal
                </label>
                <input
                  type="text"
                  value={formData.cuentaBancaria || ''}
                  onChange={(e) => handleChange('cuentaBancaria', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono"
                  placeholder="ej. BCP 193-12345678-0-99"
                />
                <p className="text-[10px] text-slate-500 mt-1">Donde se depositarán tus reembolsos de rendición.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cargo (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.cargo || ''}
                  onChange={(e) => handleChange('cargo', e.target.value)}
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="ej. Ejecutivo de Ventas"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex justify-between items-center">
                  <span>Departamento / Área</span>
                  <Shield className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="text"
                  value={formData.department || ''}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-500 font-medium cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-500 mt-1">Solo el administrador puede cambiar tu área o rol.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg flex items-center space-x-2 transition-colors cursor-pointer shadow-md hover:shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Mi Perfil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
