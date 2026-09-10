import React, { useState, useRef } from 'react';
import {
  X,
  Building2,
  Upload,
  Image,
  Save,
  FileCode,
  Shield,
  CreditCard,
  Plus,
  Trash2,
  Landmark,
} from 'lucide-react';
import { CompanySettings, BankAccount } from '../types';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  company,
  onSave,
}) => {
  const [formData, setFormData] = useState<CompanySettings>({ ...company });
  const [previewLogo, setPreviewLogo] = useState(company.logoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New account form state
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newBanco, setNewBanco] = useState('BCP - Banco de Crédito del Perú');
  const [newTipo, setNewTipo] = useState('Corriente Soles');
  const [newNumero, setNewNumero] = useState('');
  const [newCci, setNewCci] = useState('');
  const [newTitular, setNewTitular] = useState(company.razonSocial);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreviewLogo(base64);
        setFormData((prev) => ({ ...prev, logoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetLogo = (color: string, label: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="24" fill="${color}"/><text x="60" y="72" font-size="34" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${label}</text></svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setPreviewLogo(dataUri);
    setFormData((prev) => ({ ...prev, logoUrl: dataUri }));
  };

  const handleAddAccount = () => {
    if (!newNumero.trim()) {
      alert('Por favor ingrese el número de cuenta.');
      return;
    }

    const newAcc: BankAccount = {
      id: `cta-${Date.now()}`,
      banco: newBanco,
      tipoCuenta: newTipo,
      numeroCuenta: newNumero.trim(),
      cci: newCci.trim() || undefined,
      titular: newTitular.trim() || formData.razonSocial,
    };

    setFormData((prev) => ({
      ...prev,
      cuentasOrigenDisponibles: [...(prev.cuentasOrigenDisponibles || []), newAcc],
    }));

    setNewNumero('');
    setNewCci('');
    setIsAddingAccount(false);
  };

  const handleRemoveAccount = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      cuentasOrigenDisponibles: (prev.cuentasOrigenDisponibles || []).filter((a) => a.id !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold">Identidad Corporativa y Cuentas Bancarias</h3>
              <p className="text-xs text-slate-400">
                Logotipo, datos SUNAT, cuentas de origen para rendición y regla de cuadre
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Logo Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Logo de la Empresa (Aparece en reportes PDF, Excel y membretes)
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                {previewLogo ? (
                  <img
                    src={previewLogo}
                    alt="Logo Preview"
                    className="w-full h-full object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Image className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Imagen de Logo</span>
                </button>
                <div className="flex items-center space-x-1 flex-wrap gap-1">
                  <span className="text-[10px] text-slate-500">O presets:</span>
                  <button
                    type="button"
                    onClick={() => handlePresetLogo('#2563eb', 'CA')}
                    className="px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded font-bold"
                  >
                    Azul CA
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetLogo('#0f766e', 'CORP')}
                    className="px-1.5 py-0.5 text-[10px] bg-teal-700 text-white rounded font-bold"
                  >
                    Verde CORP
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetLogo('#4338ca', 'ANDINA')}
                    className="px-1.5 py-0.5 text-[10px] bg-indigo-700 text-white rounded font-bold"
                  >
                    Indigo
                  </button>
                  {previewLogo && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewLogo('');
                        setFormData((prev) => ({ ...prev, logoUrl: '' }));
                      }}
                      className="px-1.5 py-0.5 text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Razón Social */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre o Razón Social de la Empresa *
            </label>
            <input
              type="text"
              required
              value={formData.razonSocial}
              onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-900"
            />
          </div>

          {/* RUC & Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RUC Tributario (11 dígitos) *
              </label>
              <input
                type="text"
                required
                maxLength={11}
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dirección Fiscal / Sede Central
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
            />
          </div>

          {/* Cuentas Bancarias de Origen Disponibles */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Landmark className="w-4 h-4 text-indigo-600" />
                <span>Cuentas de Origen Bancarias de la Empresa</span>
              </span>
              {!isAddingAccount && (
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(true)}
                  className="px-2 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar Cuenta</span>
                </button>
              )}
            </div>

            {/* Account List */}
            <div className="space-y-1.5">
              {(formData.cuentasOrigenDisponibles || []).map((cta) => (
                <div
                  key={cta.id}
                  className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{cta.banco}</span>
                    <span className="text-slate-500 ml-1">({cta.tipoCuenta})</span>
                    <div className="font-mono text-[11px] text-indigo-700">
                      Cta: {cta.numeroCuenta} {cta.cci ? `| CCI: ${cta.cci}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAccount(cta.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Eliminar cuenta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* New account subform */}
            {isAddingAccount && (
              <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-200 space-y-2 text-xs">
                <h5 className="font-bold text-indigo-950">Nueva Cuenta Bancaria de Origen</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Banco</label>
                    <select
                      value={newBanco}
                      onChange={(e) => setNewBanco(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium"
                    >
                      <option value="BCP - Banco de Crédito del Perú">BCP - Banco de Crédito</option>
                      <option value="BBVA Perú">BBVA Continental</option>
                      <option value="Interbank">Interbank</option>
                      <option value="Scotiabank Perú">Scotiabank</option>
                      <option value="Banco de la Nación">Banco de la Nación</option>
                      <option value="BanBif">BanBif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Tipo</label>
                    <select
                      value={newTipo}
                      onChange={(e) => setNewTipo(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded"
                    >
                      <option value="Corriente Soles">Corriente Soles</option>
                      <option value="Ahorros Soles">Ahorros Soles</option>
                      <option value="Corriente Dólares">Corriente Dólares</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">N° Cuenta *</label>
                    <input
                      type="text"
                      value={newNumero}
                      onChange={(e) => setNewNumero(e.target.value)}
                      placeholder="191-23847291-0-12"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">CCI (Opcional)</label>
                    <input
                      type="text"
                      value={newCci}
                      onChange={(e) => setNewCci(e.target.value)}
                      placeholder="002-191-0023847291012-54"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingAccount(false)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAccount}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
                  >
                    Guardar Cuenta
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Regla de Cuadre y Sistema Contable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tolerancia de Cuadre (S/.)</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  max="10"
                  value={formData.toleranciaCuadre}
                  onChange={(e) =>
                    setFormData({ ...formData, toleranciaCuadre: parseFloat(e.target.value) || 2.0 })
                  }
                  className="w-24 px-2 py-1 text-sm bg-white border border-emerald-300 rounded font-bold text-emerald-900 font-mono outline-none"
                />
                <span className="text-xs text-emerald-700 font-semibold">Soles máx.</span>
              </div>
              <p className="text-[10px] text-emerald-600 mt-1">
                Regla corporativa: Rendición conforme hasta tener un remanente máximo de 2 soles.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1">
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sistema Contable Destino</span>
              </label>
              <select
                value={formData.sistemaContableExport}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sistemaContableExport: e.target.value as any,
                  })
                }
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded font-semibold text-slate-800 outline-none"
              >
                <option value="CONCAR">CONCAR SQL / CBCO</option>
                <option value="SIIGO">SIIGO Cloud Contable</option>
                <option value="SAP">SAP Business One / ERP</option>
                <option value="SUNAT_PLE">SUNAT PLE 8.1 Registro Compras</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Estructura de exportación automática.
              </p>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
