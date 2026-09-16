import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileEdit,
  Save,
  PlusCircle,
  ExternalLink,
  Trash2,
  Receipt,
  Calendar,
  Building,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import { ExpenseItem, TipoDocumento, ClasificacionGasto, CostCenter } from '../types';
import { formatCurrency } from '../utils/financial';
import { compressImage } from '../lib/imageUtils';


interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseItem: ExpenseItem | null;
  onSave: (updatedItem: ExpenseItem, continueAdding?: boolean) => void;
  costCenters: CostCenter[];
  defaultCostCenterId?: string;
  isNewMode?: boolean;
  montoAsignado?: number;
  totalRendidoActual?: number;
}

const TIPOS_DOCUMENTO: TipoDocumento[] = [
  'Factura Electrónica',
  'Boleta Electrónica',
  'Recibo por Honorarios',
  'Recibo Simple',
  'Ticket',
  'Voucher / Transacción',
  'Declaración Jurada',
  'Otros',
];

const CLASIFICACIONES_GASTO: ClasificacionGasto[] = [
  'Alimentación / Viáticos',
  'Transporte y Pasajes',
  'Combustible y Peajes',
  'Alojamiento / Hospedaje',
  'Materiales y Suministros',
  'Servicios de Terceros',
  'Gastos de Representación',
  'Gastos Menores / Remanente',
  'Otros Gastos',
];

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseItem,
  onSave,
  costCenters,
  defaultCostCenterId,
  isNewMode = false,
  montoAsignado,
  totalRendidoActual,
}) => {
  const [fecha, setFecha] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('Factura Electrónica');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [detalle, setDetalle] = useState('');
  const [clasificacionGasto, setClasificacionGasto] = useState<ClasificacionGasto>('Alimentación / Viáticos');
  const [centroCostosId, setCentroCostosId] = useState('');
  const [montoTotal, setMontoTotal] = useState<string>('0.00');
  const [comprobanteUrl, setComprobanteUrl] = useState<string | undefined>(undefined);
  const [ocrVerificado, setOcrVerificado] = useState(false);

  // Dynamic tracking for continuous addition
  const [currentItemNumber, setCurrentItemNumber] = useState<number>(1);
  const [currentId, setCurrentId] = useState<string>('');
  const [sessionAddedCount, setSessionAddedCount] = useState<number>(0);
  const [sessionAddedTotal, setSessionAddedTotal] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const montoInputRef = useRef<HTMLInputElement>(null);
  const numeroInputRef = useRef<HTMLInputElement>(null);

  // Sync form when modal opens or expenseItem changes
  useEffect(() => {
    if (expenseItem) {
      setCurrentId(expenseItem.id);
      setCurrentItemNumber(expenseItem.itemNumber);
      setFecha(expenseItem.fecha || new Date().toISOString().split('T')[0]);
      setTipoDocumento(expenseItem.tipoDocumento || 'Factura Electrónica');
      setNumeroComprobante(expenseItem.numeroComprobante || '');
      setRuc(expenseItem.ruc || '');
      setRazonSocial(expenseItem.razonSocial || '');
      setDetalle(expenseItem.detalle || '');
      setClasificacionGasto(expenseItem.clasificacionGasto || 'Alimentación / Viáticos');
      setCentroCostosId(expenseItem.centroCostosId || defaultCostCenterId || costCenters[0]?.id || '');
      setMontoTotal(expenseItem.montoTotal ? expenseItem.montoTotal.toFixed(2) : '0.00');
      setComprobanteUrl(expenseItem.comprobanteUrl);
      setOcrVerificado(expenseItem.ocrVerificado ?? false);
      setFormError(null);
      setSuccessMessage(null);
      setSessionAddedCount(0);
      setSessionAddedTotal(0);

      // Focus amount for quick input
      setTimeout(() => {
        if (montoInputRef.current) {
          montoInputRef.current.focus();
          montoInputRef.current.select();
        }
      }, 100);
    }
  }, [expenseItem, defaultCostCenterId, costCenters]);

  if (!isOpen || !expenseItem) return null;

  // Live Cuadre calculation
  const currentRunningRendido = (totalRendidoActual || 0) + sessionAddedTotal;
  const liveSaldoRestante = montoAsignado !== undefined ? Number((montoAsignado - currentRunningRendido).toFixed(2)) : undefined;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setFormError('Por favor seleccione un archivo de imagen válido (JPG, PNG) o PDF.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setComprobanteUrl(base64);
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setComprobanteUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process and save item
  const processSave = (continueAdding: boolean) => {
    setFormError(null);
    setSuccessMessage(null);

    const parsedMonto = parseFloat(montoTotal);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      setFormError('El monto total debe ser un número mayor a 0 para poder registrar y cuadrar el documento.');
      if (montoInputRef.current) {
        montoInputRef.current.focus();
      }
      return;
    }

    // Flexible fields: Auto-populate friendly defaults if the user leaves them blank for fast cuadre
    const finalNumero = numeroComprobante.trim()
      ? numeroComprobante.trim().toUpperCase()
      : `(S/N - ÍTEM #${currentItemNumber})`;

    const finalRazonSocial = razonSocial.trim()
      ? razonSocial.trim().toUpperCase()
      : '(POR REGISTRAR)';

    const finalFecha = fecha.trim() || new Date().toISOString().split('T')[0];
    const finalDetalle = detalle.trim() || 'Gasto registrado (datos pendientes de regularización)';

    const itemToSave: ExpenseItem = {
      ...expenseItem,
      id: currentId || `manual-${Date.now()}`,
      itemNumber: currentItemNumber,
      fecha: finalFecha,
      tipoDocumento,
      numeroComprobante: finalNumero,
      ruc: ruc.trim(),
      razonSocial: finalRazonSocial,
      detalle: finalDetalle,
      clasificacionGasto,
      centroCostosId: centroCostosId || defaultCostCenterId || costCenters[0]?.id || 'cc-1',
      montoTotal: Number(parsedMonto.toFixed(2)),
      comprobanteUrl: comprobanteUrl || undefined,
      ocrVerificado,
    };

    if (continueAdding) {
      // Save item and keep modal open for next document
      onSave(itemToSave, true);

      const addedAmount = Number(parsedMonto.toFixed(2));
      const nextNumber = currentItemNumber + 1;
      setSessionAddedCount((prev) => prev + 1);
      setSessionAddedTotal((prev) => Number((prev + addedAmount).toFixed(2)));

      setSuccessMessage(
        `✓ Documento guardado con éxito por S/ ${addedAmount.toFixed(2)}. Formulario restablecido a cero para ingresar el siguiente documento.`
      );

      // Reset form to zero/empty
      setMontoTotal('0.00');
      setNumeroComprobante('');
      setRuc('');
      setRazonSocial('');
      setDetalle('');
      setComprobanteUrl(undefined);
      setOcrVerificado(false);
      setCurrentItemNumber(nextNumber);
      setCurrentId(`manual-${Date.now()}`);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Auto-focus monto input for instantaneous typing of next receipt
      setTimeout(() => {
        if (montoInputRef.current) {
          montoInputRef.current.focus();
          montoInputRef.current.select();
        }
      }, 50);
    } else {
      // Save and close
      onSave(itemToSave, false);
      onClose();
    }
  };

  const handleApplyRemainingBalance = () => {
    if (liveSaldoRestante !== undefined && liveSaldoRestante > 0) {
      setMontoTotal(liveSaldoRestante.toFixed(2));
      if (montoInputRef.current) {
        montoInputRef.current.focus();
        montoInputRef.current.select();
      }
    }
  };

  const isAddMode = isNewMode || expenseItem.id.startsWith('manual-');

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                {isAddMode ? <PlusCircle className="w-5 h-5" /> : <FileEdit className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold">
                    {isAddMode ? 'Registrar Comprobante / Cuadre Rápido' : 'Editar Comprobante de Pago'}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 text-xs font-mono font-bold">
                    Ítem #{currentItemNumber}
                  </span>
                  {sessionAddedCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 text-xs font-bold">
                      {sessionAddedCount} {sessionAddedCount === 1 ? 'agregado' : 'agregados'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {isAddMode
                    ? 'Ingrese los documentos para cuadrar la rendición. Solo el monto es obligatorio; los demás datos pueden completarse luego.'
                    : 'Modifique los datos fiscales, montos o imagen de este comprobante'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuadre Bar Banner (If Monto Asignado is known) */}
          {montoAsignado !== undefined && liveSaldoRestante !== undefined && (
            <div className="bg-indigo-950 px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 border-b border-indigo-900 text-xs">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div>
                  <span className="text-indigo-300 text-[11px] block">Monto Asignado:</span>
                  <span className="font-mono font-bold">{formatCurrency(montoAsignado)}</span>
                </div>
                <div>
                  <span className="text-indigo-300 text-[11px] block">Rendido Actual:</span>
                  <span className="font-mono font-bold text-slate-200">{formatCurrency(currentRunningRendido)}</span>
                </div>
                <div>
                  <span className="text-indigo-300 text-[11px] block">Saldo por Rendir / Cuadre:</span>
                  <span
                    className={`font-mono font-extrabold ${
                      liveSaldoRestante === 0
                        ? 'text-emerald-400'
                        : liveSaldoRestante > 0
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(liveSaldoRestante)}
                  </span>
                </div>
              </div>

              {liveSaldoRestante > 0 && isAddMode && (
                <button
                  type="button"
                  onClick={handleApplyRemainingBalance}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                  title="Copiar saldo restante al campo monto para cuadre exacto"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Usar Saldo Restante ({formatCurrency(liveSaldoRestante)})</span>
                </button>
              )}
            </div>
          )}

          {/* Form Content */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processSave(false);
            }}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          >
            {/* Success Message Banner for Continuous Adding */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">{successMessage}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    El formulario está listo y en cero para ingresar el documento #{currentItemNumber}.
                  </p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Highlighted Monto Total Box (Primary field for fast cuadre) */}
            <div className="p-3.5 bg-indigo-50/80 rounded-xl border-2 border-indigo-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block font-bold text-indigo-950 text-xs flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <span>Monto Total Rendido (S/.) * [OBLIGATORIO PARA CUADRE]</span>
                  </label>
                  <p className="text-[11px] text-indigo-700">
                    Importe final pagado (Directiva empresarial: Solo Monto Total)
                  </p>
                </div>
                <div className="relative w-full sm:w-52">
                  <span className="absolute left-3 top-2 font-bold text-slate-500 text-base">S/</span>
                  <input
                    ref={montoInputRef}
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={montoTotal}
                    onChange={(e) => setMontoTotal(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-indigo-400 rounded-lg font-mono font-extrabold text-indigo-950 text-lg outline-none focus:ring-2 focus:ring-indigo-600 text-right shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Comprobante Escaneado / Voucher Preview Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>Soporte Digital del Comprobante (Foto / Voucher - Opcional)</span>
                </label>
                {comprobanteUrl && (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Archivo adjunto
                  </span>
                )}
              </div>

              {comprobanteUrl ? (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div
                      onClick={() => setShowImagePreview(true)}
                      className="w-12 h-12 rounded bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-85 transition-opacity shrink-0"
                      title="Clic para ampliar comprobante"
                    >
                      <img
                        src={comprobanteUrl}
                        alt="Comprobante"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {numeroComprobante || 'Comprobante escaneado'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowImagePreview(true)}
                        className="text-[11px] text-indigo-600 hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
                      >
                        <span>Ver en tamaño completo</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 cursor-pointer transition-colors"
                      title="Reemplazar por otra foto o escaneo"
                    >
                      Reemplazar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                      title="Quitar archivo adjunto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Adjuntar Foto / Escaneo / PDF</span>
                  </button>
                  <span className="text-[11px] text-slate-400 italic">
                    (Puede cuadrar primero y adjuntar fotos después)
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
              />
            </div>

            {/* Grid of Fields (Tax and Accounting Data) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Tipo de Documento */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tipo de Documento</span>
                </label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Número de Comprobante (Opcional para cuadre rápido) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>N° Comprobante / Serie-Correlativo</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional para cuadre</span>
                </label>
                <input
                  ref={numeroInputRef}
                  type="text"
                  placeholder="ej. F001-004523 (o dejar en blanco)"
                  value={numeroComprobante}
                  onChange={(e) => setNumeroComprobante(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              {/* Fecha de Emisión */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Fecha de Emisión</span>
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* RUC del Proveedor */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>RUC / DNI del Proveedor</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="ej. 20601234567"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Razón Social / Proveedor (Opcional para cuadre rápido) */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Razón Social / Nombre del Proveedor o Establecimiento</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional para cuadre</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. GRIFO PRIMAX S.A.C. / RESTAURANTE EL PAISITA (o dejar en blanco)"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              {/* Detalle o Concepto */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Detalle / Concepto del Gasto</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. Consumo de alimentos almuerzo de trabajo"
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Clasificación de Gasto */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Clasificación del Gasto</span>
                </label>
                <select
                  value={clasificacionGasto}
                  onChange={(e) => setClasificacionGasto(e.target.value as ClasificacionGasto)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CLASIFICACIONES_GASTO.map((clasif) => (
                    <option key={clasif} value={clasif}>
                      {clasif}
                    </option>
                  ))}
                </select>
              </div>

              {/* Centro de Costos */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Centro de Costos Imputable
                </label>
                <select
                  value={centroCostosId}
                  onChange={(e) => setCentroCostosId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.code} - {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* OCR Verificado Checkbox */}
              <div className="sm:col-span-2 flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={ocrVerificado}
                    onChange={(e) => setOcrVerificado(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Comprobante verificado con soporte físico / OCR</span>
                </label>
                {ocrVerificado && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verificado</span>
                  </span>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                {isAddMode ? (
                  <span className="text-slate-600">
                    Total ingresado en sesión:{' '}
                    <strong className="font-mono text-slate-900">{formatCurrency(sessionAddedTotal)}</strong>
                  </span>
                ) : (
                  <span>Editando ítem #{expenseItem.itemNumber}</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  {isAddMode && sessionAddedCount > 0 ? 'Terminar / Cerrar' : 'Cancelar'}
                </button>

                {isAddMode ? (
                  <>
                    {/* Botón principal: Guardar y Resetear a cero para el siguiente */}
                    <button
                      type="button"
                      id="btn-guardar-y-agregar-otro"
                      onClick={() => processSave(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                      title="Guarda este comprobante y limpia el formulario a cero para ingresar el siguiente documento inmediatamente"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Guardar y Agregar Siguiente (+)</span>
                    </button>

                    {/* Botón secundario: Guardar y Salir */}
                    <button
                      type="button"
                      id="btn-guardar-y-salir"
                      onClick={() => processSave(false)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar y Salir</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    id="btn-guardar-edicion-comprobante"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Fullscreen Image Preview Submodal */}
      {showImagePreview && comprobanteUrl && (
        <div
          onClick={() => setShowImagePreview(false)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden p-2 flex flex-col items-center">
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 z-10"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={comprobanteUrl}
              alt="Comprobante en tamaño completo"
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <p className="text-xs text-slate-300 mt-2 font-mono">
              {numeroComprobante || 'Documento'} - {razonSocial || 'Proveedor'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
