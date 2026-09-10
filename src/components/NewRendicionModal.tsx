import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Landmark,
  Building,
  UserCheck,
  CreditCard,
  PenTool,
  Calendar,
  FileCheck2,
  Plus,
  Check,
} from 'lucide-react';
import { Rendicion, CostCenter, User, CompanySettings, DestinatarioAccount } from '../types';
import { SignaturePadModal } from './SignaturePadModal';

interface NewRendicionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (rendicionData: Omit<Rendicion, 'id' | 'items' | 'historialAprobacion'>) => void;
  costCenters: CostCenter[];
  currentUser: User | null;
  allUsers: User[];
  company: CompanySettings;
  nextCode: string;
  destinatarioAccounts?: DestinatarioAccount[];
  onAddDestinatarioAccount?: (account: DestinatarioAccount) => void;
}

export const NewRendicionModal: React.FC<NewRendicionModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  costCenters,
  currentUser,
  allUsers,
  company,
  nextCode,
  destinatarioAccounts = [],
  onAddDestinatarioAccount,
}) => {
  const [titulo, setTitulo] = useState('');
  const [colaboradorId, setColaboradorId] = useState(currentUser?.id || allUsers[0]?.id || 'usr-3');
  const [responsableRendicion, setResponsableRendicion] = useState(currentUser?.name || allUsers[0]?.name || '');
  const [nombreDestinatario, setNombreDestinatario] = useState(currentUser?.name || allUsers[0]?.name || '');
  const [cuentaDestino, setCuentaDestino] = useState(currentUser?.cuentaBancaria || '');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [referenciaRendicion, setReferenciaRendicion] = useState('');
  const [fechaRendicion, setFechaRendicion] = useState(new Date().toISOString().split('T')[0]);
  const [centroCostosId, setCentroCostosId] = useState(costCenters[0]?.id || 'cc-1');

  // Banking accounts
  const defaultCuentaOrigen = company.cuentasOrigenDisponibles?.[0]
    ? `${company.cuentasOrigenDisponibles[0].banco} - ${company.cuentasOrigenDisponibles[0].numeroCuenta}`
    : 'BCP Cta Cte 191-23847291-0-12 (Empresa)';
  const [cuentaOrigen, setCuentaOrigen] = useState(defaultCuentaOrigen);
  const [customCuentaOrigen, setCustomCuentaOrigen] = useState('');

  // Payment method: strictly Transferencia Bancaria OR Cheque
  const [tipoDesembolso, setTipoDesembolso] = useState<'Transferencia Bancaria' | 'Cheque'>('Transferencia Bancaria');
  const [numeroTransferencia, setNumeroTransferencia] = useState(`TRF-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [numeroCheque, setNumeroCheque] = useState(`CHQ-${Math.floor(10000 + Math.random() * 90000)}`);
  const [banco, setBanco] = useState('BCP - Banco de Crédito del Perú');
  const [montoAsignado, setMontoAsignado] = useState<number>(1500.00);
  const [fechaDesembolso, setFechaDesembolso] = useState(new Date().toISOString().split('T')[0]);

  // Digital Signature
  const [firmaResponsable, setFirmaResponsable] = useState<string | undefined>(undefined);
  const [fechaFirmaResponsable, setFechaFirmaResponsable] = useState<string | undefined>(undefined);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // New recipient account modal state
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccNombre, setNewAccNombre] = useState('');
  const [newAccDni, setNewAccDni] = useState('');
  const [newAccBanco, setNewAccBanco] = useState('BCP - Banco de Crédito del Perú');
  const [newAccTipo, setNewAccTipo] = useState('Ahorros');
  const [newAccNumero, setNewAccNumero] = useState('');
  const [newAccCci, setNewAccCci] = useState('');
  const [newAccAlias, setNewAccAlias] = useState('');

  // Sync selected user details and recipient accounts
  useEffect(() => {
    const user = allUsers.find((u) => u.id === colaboradorId);
    if (user) {
      setResponsableRendicion(user.name);
      // Look for a matching registered account for this user
      const matchingAccount = destinatarioAccounts.find(
        (acc) =>
          acc.nombreDestinatario.trim().toLowerCase() === user.name.trim().toLowerCase() ||
          (user.dni && acc.dniRuc === user.dni)
      );
      if (matchingAccount) {
        setSelectedAccountId(matchingAccount.id);
        setNombreDestinatario(matchingAccount.nombreDestinatario);
        setCuentaDestino(`${matchingAccount.banco} - ${matchingAccount.numeroCuenta} (${matchingAccount.tipoCuenta})`);
        setBanco(matchingAccount.banco);
      } else {
        setNombreDestinatario(user.name);
        if (user.cuentaBancaria) {
          setCuentaDestino(user.cuentaBancaria);
        }
      }
    }
  }, [colaboradorId, allUsers, destinatarioAccounts]);

  // When recipient account is picked from dropdown
  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    if (!accountId) return;
    const acc = destinatarioAccounts.find((a) => a.id === accountId);
    if (acc) {
      setNombreDestinatario(acc.nombreDestinatario);
      setCuentaDestino(`${acc.banco} - ${acc.numeroCuenta} (${acc.tipoCuenta})`);
      setBanco(acc.banco);
    }
  };

  const handleCreateNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccNombre.trim() || !newAccNumero.trim()) {
      alert('Por favor ingrese el nombre del destinatario y el número de cuenta.');
      return;
    }

    const newAccount: DestinatarioAccount = {
      id: `dest-${Date.now()}`,
      nombreDestinatario: newAccNombre.trim(),
      dniRuc: newAccDni.trim() || undefined,
      banco: newAccBanco,
      tipoCuenta: newAccTipo,
      numeroCuenta: newAccNumero.trim(),
      cci: newAccCci.trim() || undefined,
      alias: newAccAlias.trim() || `${newAccBanco} ${newAccTipo}`,
    };

    onAddDestinatarioAccount?.(newAccount);

    // Auto-select newly created account
    setSelectedAccountId(newAccount.id);
    setNombreDestinatario(newAccount.nombreDestinatario);
    setCuentaDestino(`${newAccount.banco} - ${newAccount.numeroCuenta} (${newAccount.tipoCuenta})`);
    setBanco(newAccount.banco);

    // Reset and close sub-form
    setShowNewAccountForm(false);
    setNewAccNumero('');
    setNewAccCci('');
    setNewAccAlias('');
  };

  if (!isOpen) return null;

  const selectedColaborador = allUsers.find((u) => u.id === colaboradorId) || currentUser;
  const selectedCostCenter = costCenters.find((c) => c.id === centroCostosId);

  const finalCuentaOrigen =
    cuentaOrigen === 'OTRO' && customCuentaOrigen.trim()
      ? customCuentaOrigen.trim()
      : cuentaOrigen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || montoAsignado <= 0) {
      alert('Por favor ingrese el título y un monto asignado válido.');
      return;
    }

    onCreate({
      codigoRendicion: nextCode,
      titulo: titulo.trim(),
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaDesembolso,
      fechaRendicion,
      colaboradorId,
      colaboradorNombre: selectedColaborador?.name || 'Colaborador',
      responsableRendicion: responsableRendicion.trim() || selectedColaborador?.name || 'Responsable',
      nombreDestinatario: nombreDestinatario.trim() || selectedColaborador?.name || 'Destinatario',
      cuentaOrigen: finalCuentaOrigen,
      cuentaDestino: cuentaDestino.trim(),
      referenciaRendicion: referenciaRendicion.trim(),
      departamento: selectedCostCenter?.department || 'Operaciones',
      centroCostosId,
      tipoDesembolso,
      numeroTransferencia: tipoDesembolso === 'Transferencia Bancaria' ? numeroTransferencia.trim() : '',
      numeroCheque: tipoDesembolso === 'Cheque' ? numeroCheque.trim() : '',
      banco,
      montoAsignado: Number(montoAsignado),
      estado: 'borrador',
      firmaResponsable,
      fechaFirmaResponsable,
    });

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Apertura y Registro de Rendición de Gastos</h3>
                <p className="text-xs text-slate-400">
                  Cuentas de origen/destino, destinatario de fondos, transferencia/cheque y firmas
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

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {/* Row 1: Código, Título y Fecha de Rendición */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código Rendición
                </label>
                <input
                  type="text"
                  disabled
                  value={nextCode}
                  className="w-full px-2.5 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título / Asunto de la Rendición *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Comisión Técnica Supervisión Planta Arequipa"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de la Rendición *
                </label>
                <input
                  type="date"
                  required
                  value={fechaRendicion}
                  onChange={(e) => setFechaRendicion(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Row 2: Responsable de la Rendición según Usuario Ingresado */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Responsable & Usuario de la Rendición</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  El responsable se vincula automáticamente con el usuario ingresado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Usuario del Sistema / Rendidor *
                  </label>
                  <select
                    value={colaboradorId}
                    onChange={(e) => setColaboradorId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.roleLabel} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsable Formal de la Rendición *
                  </label>
                  <input
                    type="text"
                    required
                    value={responsableRendicion}
                    onChange={(e) => setResponsableRendicion(e.target.value)}
                    placeholder="Nombre y Apellidos completos del responsable"
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Centro de costos & Referencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Centro de Costos *
                </label>
                <select
                  value={centroCostosId}
                  onChange={(e) => setCentroCostosId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.code} - {cc.name} ({cc.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referencia de la Rendición / Glosa
                </label>
                <input
                  type="text"
                  value={referenciaRendicion}
                  onChange={(e) => setReferenciaRendicion(e.target.value)}
                  placeholder="ej. Anticipo viáticos supervisión técnica en planta"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Row 4: Cuentas Bancarias de Origen y Selección / Creación de Cuentas de Destinatario */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Landmark className="w-4 h-4 text-indigo-600" />
                  <span>Cuentas Bancarias y Destinatario de Fondos</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewAccNombre(responsableRendicion || selectedColaborador?.name || '');
                    setNewAccDni(selectedColaborador?.dni || '');
                    setShowNewAccountForm(true);
                  }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Crear Cuenta al Destinatario</span>
                </button>
              </div>

              {/* Modal / Subform to create new recipient account */}
              {showNewAccountForm && (
                <div className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950">
                      Registrar Nueva Cuenta para Destinatario
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewAccountForm(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Nombre Completo del Destinatario *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nombre y Apellidos"
                        value={newAccNombre}
                        onChange={(e) => setNewAccNombre(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        DNI / RUC (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="ej. 45892019"
                        value={newAccDni}
                        onChange={(e) => setNewAccDni(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Banco *
                      </label>
                      <select
                        value={newAccBanco}
                        onChange={(e) => setNewAccBanco(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                      >
                        <option value="BCP - Banco de Crédito del Perú">BCP - Banco de Crédito del Perú</option>
                        <option value="BBVA Continental">BBVA Continental</option>
                        <option value="Interbank">Interbank</option>
                        <option value="Scotiabank Perú">Scotiabank Perú</option>
                        <option value="Banco de la Nación">Banco de la Nación</option>
                        <option value="BanBif">BanBif</option>
                        <option value="Pichincha">Banco Pichincha</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Tipo Cuenta
                        </label>
                        <select
                          value={newAccTipo}
                          onChange={(e) => setNewAccTipo(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                        >
                          <option value="Ahorros">Ahorros</option>
                          <option value="Corriente">Corriente</option>
                          <option value="CCI">CCI Interbancario</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Alias / Referencia
                        </label>
                        <input
                          type="text"
                          placeholder="ej. BCP Haberes"
                          value={newAccAlias}
                          onChange={(e) => setNewAccAlias(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Número de Cuenta Bancaria *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ej. 194-48291048-0-91"
                          value={newAccNumero}
                          onChange={(e) => setNewAccNumero(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Código Interbancario (CCI Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="ej. 002-194-0048291048091-23"
                          value={newAccCci}
                          onChange={(e) => setNewAccCci(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewAccountForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewAccount}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow-sm flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar y Seleccionar Cuenta</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Selector de Cuenta de Destinatario */}
              <div className="p-3 bg-white rounded-xl border border-indigo-200">
                <label className="block text-xs font-bold text-indigo-950 mb-1">
                  Seleccionar Cuenta de Destinatario Registrada (Auto-completado directo)
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => handleSelectAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Seleccione una cuenta para cargar datos directos del destinatario --</option>
                  {destinatarioAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.banco}] {acc.numeroCuenta} — {acc.nombreDestinatario} ({acc.tipoCuenta} {acc.alias ? `• ${acc.alias}` : ''})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Al seleccionar una cuenta, se autocompletan inmediatamente el nombre completo del destinatario y los datos de destino.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cuenta de Origen */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cuenta de Origen de la Empresa *
                  </label>
                  <select
                    value={cuentaOrigen}
                    onChange={(e) => setCuentaOrigen(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-900 outline-none"
                  >
                    {company.cuentasOrigenDisponibles?.map((cta) => (
                      <option
                        key={cta.id}
                        value={`${cta.banco} - ${cta.numeroCuenta} (${cta.tipoCuenta})`}
                      >
                        {cta.banco} - {cta.numeroCuenta} ({cta.tipoCuenta})
                      </option>
                    ))}
                    <option value="OTRO">Otra cuenta de origen bancaria...</option>
                  </select>

                  {cuentaOrigen === 'OTRO' && (
                    <input
                      type="text"
                      placeholder="Ingrese banco y N° de cuenta de origen"
                      value={customCuentaOrigen}
                      onChange={(e) => setCustomCuentaOrigen(e.target.value)}
                      className="w-full mt-1.5 px-2.5 py-1.5 text-xs bg-white border border-indigo-400 rounded-lg font-mono text-slate-900"
                    />
                  )}
                </div>

                {/* Cuenta y Nombre de Destinatario */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo del Destinatario de Fondos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo de quien recibe los fondos"
                    value={nombreDestinatario}
                    onChange={(e) => setNombreDestinatario(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cuenta de Destino (Banco y N° de Cuenta) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. BCP Ahorros 194-48291048-0-91"
                  value={cuentaDestino}
                  onChange={(e) => setCuentaDestino(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              {/* Método de Desembolso: STRICTLY Transferencia Bancaria OR Cheque */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Método de Desembolso *
                  </label>
                  <select
                    value={tipoDesembolso}
                    onChange={(e) => setTipoDesembolso(e.target.value as 'Transferencia Bancaria' | 'Cheque')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-400 rounded-lg font-bold text-slate-900 outline-none"
                  >
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                {tipoDesembolso === 'Transferencia Bancaria' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      N° de Operación / Transferencia Bancaria *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="TRF-90234182"
                      value={numeroTransferencia}
                      onChange={(e) => setNumeroTransferencia(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      N° de Cheque Emitido *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="CHQ-0045812"
                      value={numeroCheque}
                      onChange={(e) => setNumeroCheque(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-indigo-950 mb-1">
                    Monto Desembolsado (S/.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={montoAsignado}
                    onChange={(e) => setMontoAsignado(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-sm bg-white border-2 border-indigo-500 rounded-lg font-mono font-extrabold text-indigo-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Firma Digital del Responsable */}
            <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-950">
                  <PenTool className="w-4 h-4 text-indigo-600" />
                  <span>Firma Digital del Responsable de la Rendición</span>
                </div>
                <p className="text-[11px] text-indigo-800">
                  Puede estampar la firma digital en este momento o al enviar la rendición.
                </p>
                {firmaResponsable && (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Firma digital registrada ({fechaFirmaResponsable})</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {firmaResponsable ? (
                  <div className="flex items-center space-x-2">
                    <img
                      src={firmaResponsable}
                      alt="Firma"
                      className="h-10 border border-slate-300 bg-white rounded p-1 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignaturePad(true)}
                      className="px-2.5 py-1 text-xs text-indigo-600 hover:bg-indigo-100 rounded cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1 cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Firmar Digitalmente</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear Rendición y Aperturar Planilla</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePadModal
          isOpen={showSignaturePad}
          onClose={() => setShowSignaturePad(false)}
          title="Firma Digital - Responsable de la Rendición"
          signerName={responsableRendicion || selectedColaborador?.name || 'Responsable'}
          signerRole={selectedColaborador?.roleLabel || 'Responsable'}
          onSaveSignature={(sigUrl) => {
            setFirmaResponsable(sigUrl);
            setFechaFirmaResponsable(new Date().toLocaleString('es-PE'));
            setShowSignaturePad(false);
          }}
        />
      )}
    </>
  );
};
