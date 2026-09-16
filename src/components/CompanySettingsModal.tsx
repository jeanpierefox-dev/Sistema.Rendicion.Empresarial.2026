import React, { useState, useEffect, useRef } from 'react';
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
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { CompanySettings, BankAccount, DestinatarioAccount } from '../types';
import { compressImage } from '../lib/imageUtils';


interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanySettings;
  destinatarioAccounts: DestinatarioAccount[];
  onSave: (settings: CompanySettings, destinatarios: DestinatarioAccount[]) => void;
  onClearAllDestinatarioAccounts?: () => void;
  onClearAllCompanyAccounts?: () => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  company,
  destinatarioAccounts,
  onSave,
  onClearAllDestinatarioAccounts,
  onClearAllCompanyAccounts,
}) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'destinatarios'>('empresa');
  const [formData, setFormData] = useState<CompanySettings>({ ...company });
  const [localDestinatarios, setLocalDestinatarios] = useState<DestinatarioAccount[]>([...destinatarioAccounts]);
  const [previewLogo, setPreviewLogo] = useState(company.logoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New company origin account form state
  const [isAddingCompanyAccount, setIsAddingCompanyAccount] = useState(false);
  const [newCtaBanco, setNewCtaBanco] = useState('BCP - Banco de Crédito del Perú');
  const [newCtaTipo, setNewCtaTipo] = useState('Corriente Soles');
  const [newCtaNumero, setNewCtaNumero] = useState('');
  const [newCtaCci, setNewCtaCci] = useState('');
  const [newCtaTitular, setNewCtaTitular] = useState(company.razonSocial);

  // New recipient account form state
  const [isAddingDestinatario, setIsAddingDestinatario] = useState(false);
  const [newDestNombre, setNewDestNombre] = useState('');
  const [newDestDniRuc, setNewDestDniRuc] = useState('');
  const [newDestBanco, setNewDestBanco] = useState('BCP - Banco de Crédito del Perú');
  const [newDestTipo, setNewDestTipo] = useState('Ahorros');
  const [newDestNumero, setNewDestNumero] = useState('');
  const [newDestCci, setNewDestCci] = useState('');
  const [newDestAlias, setNewDestAlias] = useState('');

  // Confirmation state for clearing
  const [confirmClearCompanyAccounts, setConfirmClearCompanyAccounts] = useState(false);
  const [confirmClearDestinatarios, setConfirmClearDestinatarios] = useState(false);

  // Resync with props when opened or when props change
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...company,
        cuentasOrigenDisponibles: company.cuentasOrigenDisponibles || [],
      });
      setLocalDestinatarios([...destinatarioAccounts]);
      setPreviewLogo(company.logoUrl || '');
      setNewCtaTitular(company.razonSocial || '');
      setConfirmClearCompanyAccounts(false);
      setConfirmClearDestinatarios(false);
    }
  }, [isOpen, company, destinatarioAccounts]);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 400, 400, 0.8);
        setPreviewLogo(base64);
        setFormData((prev) => ({ ...prev, logoUrl: base64 }));
      } catch (error) {
        console.error('Error compressing image:', error);
      }
    }
  };

  const handlePresetLogo = (color: string, label: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="24" fill="${color}"/><text x="60" y="72" font-size="34" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${label}</text></svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setPreviewLogo(dataUri);
    setFormData((prev) => ({ ...prev, logoUrl: dataUri }));
  };

  // --- Company Origin Accounts Management ---
  const handleAddCompanyAccount = () => {
    if (!newCtaNumero.trim()) {
      alert('Por favor ingrese el número de cuenta de la empresa.');
      return;
    }

    const newAcc: BankAccount = {
      id: `cta-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      banco: newCtaBanco,
      tipoCuenta: newCtaTipo,
      numeroCuenta: newCtaNumero.trim(),
      cci: newCtaCci.trim() || undefined,
      titular: newCtaTitular.trim() || formData.razonSocial,
    };

    setFormData((prev) => ({
      ...prev,
      cuentasOrigenDisponibles: [...(prev.cuentasOrigenDisponibles || []), newAcc],
    }));

    setNewCtaNumero('');
    setNewCtaCci('');
    setIsAddingCompanyAccount(false);
  };

  const handleRemoveCompanyAccount = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      cuentasOrigenDisponibles: (prev.cuentasOrigenDisponibles || []).filter((a) => a.id !== id),
    }));
  };

  const handleExecuteClearCompanyAccounts = () => {
    setFormData((prev) => ({
      ...prev,
      cuentasOrigenDisponibles: [],
    }));
    setConfirmClearCompanyAccounts(false);
    onClearAllCompanyAccounts?.();
  };

  // --- Destinatarios Accounts Management ---
  const handleAddDestinatarioAccount = () => {
    if (!newDestNombre.trim() || !newDestNumero.trim()) {
      alert('Por favor ingrese el nombre del destinatario y el número de cuenta.');
      return;
    }

    const newAcc: DestinatarioAccount = {
      id: `dest-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nombreDestinatario: newDestNombre.trim(),
      dniRuc: newDestDniRuc.trim() || undefined,
      banco: newDestBanco,
      tipoCuenta: newDestTipo,
      numeroCuenta: newDestNumero.trim(),
      cci: newDestCci.trim() || undefined,
      alias: newDestAlias.trim() || `${newDestBanco} ${newDestTipo}`,
    };

    setLocalDestinatarios((prev) => [newAcc, ...prev]);

    setNewDestNombre('');
    setNewDestDniRuc('');
    setNewDestNumero('');
    setNewDestCci('');
    setNewDestAlias('');
    setIsAddingDestinatario(false);
  };

  const handleRemoveDestinatarioAccount = (id: string) => {
    setLocalDestinatarios((prev) => prev.filter((a) => a.id !== id));
  };

  const handleExecuteClearDestinatarios = () => {
    setLocalDestinatarios([]);
    setConfirmClearDestinatarios(false);
    onClearAllDestinatarioAccounts?.();
  };

  // Submit and save both company settings and destinatarios to cloud & local storage
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, localDestinatarios);
    onClose();
  };

  const companyAccountsCount = (formData.cuentasOrigenDisponibles || []).length;
  const destinatariosCount = localDestinatarios.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/30 rounded-lg text-indigo-400 border border-indigo-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configuración Corporativa & Cuentas Bancarias</h3>
              <p className="text-xs text-slate-400">
                Gestione la identidad de su empresa, cuentas de origen y cuentas de destinatarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('empresa')}
            className={`pb-2.5 px-3.5 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'empresa'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Datos Empresa & Cuentas de Origen</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-mono">
              {companyAccountsCount} ctas
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('destinatarios')}
            className={`pb-2.5 px-3.5 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'destinatarios'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Cuentas de Destinatarios</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
              {destinatariosCount} cuentas
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'empresa' ? (
            <>
              {/* Logo Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Logo de la Empresa (Membretes de Rendición, PDF y Excel)
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
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen de Logo</span>
                      </button>
                      {previewLogo && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewLogo('');
                            setFormData((prev) => ({ ...prev, logoUrl: '' }));
                          }}
                          className="px-2 py-1 text-xs text-rose-600 hover:underline font-semibold"
                        >
                          Quitar Logo
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 flex-wrap gap-1">
                      <span className="text-[10px] text-slate-500">O presets directos:</span>
                      <button
                        type="button"
                        onClick={() => handlePresetLogo('#1e293b', 'CORP')}
                        className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-white rounded font-bold"
                      >
                        Gris Corp
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetLogo('#2563eb', 'EMP')}
                        className="px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded font-bold"
                      >
                        Azul Emp
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetLogo('#0f766e', 'SOL')}
                        className="px-1.5 py-0.5 text-[10px] bg-teal-700 text-white rounded font-bold"
                      >
                        Teal Sol
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Razón Social */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre o Razón Social de la Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  placeholder="ej. MI EMPRESA S.A.C."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-900"
                />
              </div>

              {/* RUC & Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RUC Tributario SUNAT (11 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="20XXXXXXXXX"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / Celular de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="(01) 000-0000 / 999-999-999"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección Fiscal / Sede Central
                </label>
                <input
                  type="text"
                  placeholder="Av. Principal 123, Oficina 401, Lima - Perú"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                />
              </div>

              {/* Cuentas Bancarias de Origen Disponibles */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Landmark className="w-4 h-4 text-indigo-600" />
                      <span>Cuentas de Origen Bancarias de la Empresa</span>
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Cuentas corrientes o de ahorros desde donde la empresa realiza los desembolsos.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {companyAccountsCount > 0 && !confirmClearCompanyAccounts && (
                      <button
                        type="button"
                        onClick={() => setConfirmClearCompanyAccounts(true)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                        title="Borrar todas las cuentas registradas de la empresa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Borrar Todas las Cuentas</span>
                      </button>
                    )}
                    {!isAddingCompanyAccount && (
                      <button
                        type="button"
                        onClick={() => setIsAddingCompanyAccount(true)}
                        className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Cuenta de Empresa</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirm Clear Alert for Company Accounts */}
                {confirmClearCompanyAccounts && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-900">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>¿Confirmar eliminación de todas las cuentas bancarias de la empresa para ingresar propias?</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmClearCompanyAccounts(false)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteClearCompanyAccounts}
                        className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded hover:bg-rose-700 shadow-xs"
                      >
                        Sí, Borrar Todo
                      </button>
                    </div>
                  </div>
                )}

                {/* Account List */}
                <div className="space-y-2">
                  {companyAccountsCount === 0 ? (
                    <div className="p-4 bg-white rounded-lg border border-dashed border-slate-300 text-center">
                      <p className="text-xs text-slate-500 font-medium">
                        No hay cuentas bancarias de la empresa configuradas.
                      </p>
                      <p className="text-[11px] text-indigo-600 mt-0.5">
                        Haga clic en "+ Agregar Cuenta de Empresa" para añadir sus números de cuenta propios.
                      </p>
                    </div>
                  ) : (
                    (formData.cuentasOrigenDisponibles || []).map((cta) => (
                      <div
                        key={cta.id}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            <Landmark className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-900">{cta.banco}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
                                {cta.tipoCuenta}
                              </span>
                            </div>
                            <div className="font-mono text-xs font-semibold text-indigo-700 mt-0.5">
                              Cta: {cta.numeroCuenta} {cta.cci ? `| CCI: ${cta.cci}` : ''}
                            </div>
                            {cta.titular && (
                              <div className="text-[10px] text-slate-400">
                                Titular: {cta.titular}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompanyAccount(cta.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Eliminar esta cuenta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* New company account subform */}
                {isAddingCompanyAccount && (
                  <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2.5 text-xs">
                    <h5 className="font-bold text-indigo-950 flex items-center space-x-1.5">
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Nueva Cuenta Bancaria de Origen de la Empresa</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Banco *</label>
                        <select
                          value={newCtaBanco}
                          onChange={(e) => setNewCtaBanco(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                        >
                          <option value="BCP - Banco de Crédito del Perú">BCP - Banco de Crédito del Perú</option>
                          <option value="BBVA Continental">BBVA Continental</option>
                          <option value="Interbank">Interbank</option>
                          <option value="Scotiabank Perú">Scotiabank Perú</option>
                          <option value="Banco de la Nación">Banco de la Nación</option>
                          <option value="BanBif">BanBif</option>
                          <option value="Banco Pichincha">Banco Pichincha</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo de Cuenta</label>
                        <select
                          value={newCtaTipo}
                          onChange={(e) => setNewCtaTipo(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="Corriente Soles">Corriente Soles</option>
                          <option value="Ahorros Soles">Ahorros Soles</option>
                          <option value="Corriente Dólares">Corriente Dólares</option>
                          <option value="Ahorros Dólares">Ahorros Dólares</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Número de Cuenta *</label>
                        <input
                          type="text"
                          required
                          value={newCtaNumero}
                          onChange={(e) => setNewCtaNumero(e.target.value)}
                          placeholder="ej. 191-23847291-0-12"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">CCI (Opcional)</label>
                        <input
                          type="text"
                          value={newCtaCci}
                          onChange={(e) => setNewCtaCci(e.target.value)}
                          placeholder="ej. 002-191-0023847291012-54"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Titular de la Cuenta</label>
                      <input
                        type="text"
                        value={newCtaTitular}
                        onChange={(e) => setNewCtaTitular(e.target.value)}
                        placeholder="Razón Social de la empresa"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingCompanyAccount(false)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCompanyAccount}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                      >
                        Guardar Cuenta de Empresa
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
                      className="w-24 px-2.5 py-1.5 text-sm bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900 font-mono outline-none"
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
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none"
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
            </>
          ) : (
            /* TAB: Cuentas de Destinatarios */
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Directorio de Cuentas de Destinatarios</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Cuentas bancarias de colaboradores o destinatarios para autocompletar transferencias en nuevas rendiciones.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {destinatariosCount > 0 && !confirmClearDestinatarios && (
                      <button
                        type="button"
                        onClick={() => setConfirmClearDestinatarios(true)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                        title="Borrar todas las cuentas de destinatarios registradas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Borrar Todas las Cuentas</span>
                      </button>
                    )}
                    {!isAddingDestinatario && (
                      <button
                        type="button"
                        onClick={() => setIsAddingDestinatario(true)}
                        className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Destinatario</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirm Clear Destinatarios Alert */}
                {confirmClearDestinatarios && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-900">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>¿Confirmar eliminación de todas las cuentas de destinatarios para ingresar las propias de su empresa?</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmClearDestinatarios(false)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteClearDestinatarios}
                        className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded hover:bg-rose-700 shadow-xs"
                      >
                        Sí, Borrar Todo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Subform to Add Destinatario */}
              {isAddingDestinatario && (
                <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2.5 text-xs">
                  <h5 className="font-bold text-emerald-950 flex items-center space-x-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Registrar Nueva Cuenta Bancaria de Destinatario</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nombre Completo del Destinatario *
                      </label>
                      <input
                        type="text"
                        required
                        value={newDestNombre}
                        onChange={(e) => setNewDestNombre(e.target.value)}
                        placeholder="ej. Juan Carlos Pérez Gómez"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        DNI o RUC del Destinatario (Opcional)
                      </label>
                      <input
                        type="text"
                        value={newDestDniRuc}
                        onChange={(e) => setNewDestDniRuc(e.target.value)}
                        placeholder="ej. 45892019"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Banco *</label>
                      <select
                        value={newDestBanco}
                        onChange={(e) => setNewDestBanco(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      >
                        <option value="BCP - Banco de Crédito del Perú">BCP - Banco de Crédito del Perú</option>
                        <option value="BBVA Continental">BBVA Continental</option>
                        <option value="Interbank">Interbank</option>
                        <option value="Scotiabank Perú">Scotiabank Perú</option>
                        <option value="Banco de la Nación">Banco de la Nación</option>
                        <option value="BanBif">BanBif</option>
                        <option value="Banco Pichincha">Banco Pichincha</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo de Cuenta</label>
                      <select
                        value={newDestTipo}
                        onChange={(e) => setNewDestTipo(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      >
                        <option value="Ahorros">Ahorros</option>
                        <option value="Corriente">Corriente</option>
                        <option value="CCI">CCI Interbancario</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Alias / Referencia</label>
                      <input
                        type="text"
                        value={newDestAlias}
                        onChange={(e) => setNewDestAlias(e.target.value)}
                        placeholder="ej. Cta Sueldos o BCP Personal"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Número de Cuenta Bancaria *</label>
                      <input
                        type="text"
                        required
                        value={newDestNumero}
                        onChange={(e) => setNewDestNumero(e.target.value)}
                        placeholder="ej. 194-48291048-0-91"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Código Interbancario CCI (Opcional)</label>
                      <input
                        type="text"
                        value={newDestCci}
                        onChange={(e) => setNewDestCci(e.target.value)}
                        placeholder="ej. 002-194-0048291048091-23"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingDestinatario(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDestinatarioAccount}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                    >
                      Registrar Cuenta de Destinatario
                    </button>
                  </div>
                </div>
              )}

              {/* Destinatarios List */}
              <div className="space-y-2">
                {destinatariosCount === 0 ? (
                  <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-700 font-bold">
                      No hay cuentas de destinatarios registradas.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                      Todas las cuentas de prueba han sido limpiadas. Ahora puede registrar las cuentas bancarias de los destinatarios y colaboradores según los datos reales de su empresa.
                    </p>
                  </div>
                ) : (
                  localDestinatarios.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{acc.nombreDestinatario}</span>
                            {acc.dniRuc && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                Doc: {acc.dniRuc}
                              </span>
                            )}
                            {acc.alias && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded font-medium">
                                {acc.alias}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-slate-600 font-medium">{acc.banco}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-mono font-semibold text-emerald-800">
                              Cta: {acc.numeroCuenta}
                            </span>
                            {acc.cci && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-mono text-slate-500">CCI: {acc.cci}</span>
                              </>
                            )}
                            <span className="text-slate-400">({acc.tipoCuenta})</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDestinatarioAccount(acc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar esta cuenta de destinatario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-200 mt-2">
            <p className="text-[11px] text-slate-500">
              {activeTab === 'empresa'
                ? `Cuentas de empresa: ${companyAccountsCount}`
                : `Cuentas de destinatarios: ${destinatariosCount}`} • Se guardará en la nube Firestore
            </p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
