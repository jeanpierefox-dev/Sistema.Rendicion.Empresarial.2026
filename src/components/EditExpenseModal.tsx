import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileEdit,
  Save,
  Upload,
  ExternalLink,
  Trash2,
  Receipt,
  Calendar,
  Building,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { ExpenseItem, TipoDocumento, ClasificacionGasto, CostCenter } from '../types';
import { formatCurrency } from '../utils/financial';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseItem: ExpenseItem | null;
  onSave: (updatedItem: ExpenseItem) => void;
  costCenters: CostCenter[];
  defaultCostCenterId?: string;
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

  const [formError, setFormError] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form when expenseItem changes
  useEffect(() => {
    if (expenseItem) {
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
    }
  }, [expenseItem, defaultCostCenterId, costCenters]);

  if (!isOpen || !expenseItem) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedMonto = parseFloat(montoTotal);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      setFormError('El monto total debe ser un valor numérico mayor a cero.');
      return;
    }

    if (!numeroComprobante.trim()) {
      setFormError('El número de comprobante es obligatorio (ej. F001-0038910).');
      return;
    }

    if (!razonSocial.trim()) {
      setFormError('La razón social o nombre del proveedor es obligatorio.');
      return;
    }

    if (!fecha.trim()) {
      setFormError('La fecha de emisión del documento es obligatoria.');
      return;
    }

    const updated: ExpenseItem = {
      ...expenseItem,
      fecha: fecha.trim(),
      tipoDocumento,
      numeroComprobante: numeroComprobante.trim().toUpperCase(),
      ruc: ruc.trim(),
      razonSocial: razonSocial.trim(),
      detalle: detalle.trim() || 'Gasto registrado',
      clasificacionGasto,
      centroCostosId: centroCostosId || costCenters[0]?.id || 'cc-1',
      montoTotal: Number(parsedMonto.toFixed(2)),
      comprobanteUrl: comprobanteUrl || undefined,
      ocrVerificado,
    };

    onSave(updated);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <FileEdit className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold">Editar Comprobante de Pago</h3>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 text-xs font-mono font-bold">
                    Ítem #{expenseItem.itemNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Modifique los datos fiscales, montos o imagen de este comprobante
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

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Comprobante Escaneado / Voucher Preview Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>Soporte Digital del Comprobante (Foto / Voucher)</span>
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
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-lg p-3 bg-white text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-700">
                    Haga clic aquí para adjuntar o tomar foto del comprobante
                  </p>
                  <p className="text-[10px] text-slate-400">JPG, PNG o PDF escaneado</p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>

            {/* Grid Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Tipo de Documento */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tipo de Documento *
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

              {/* N° Comprobante */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  N° Comprobante / Serie-Correlativo *
                </label>
                <input
                  type="text"
                  required
                  value={numeroComprobante}
                  onChange={(e) => setNumeroComprobante(e.target.value.toUpperCase())}
                  placeholder="ej. F001-0038910 o REC-001"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Fecha de Emisión */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fecha de Emisión del Documento *
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* RUC / Identificación Fiscal */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  RUC del Proveedor (o DNI)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                  placeholder="ej. 20601928410"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Razón Social / Proveedor */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Razón Social / Proveedor / Establecimiento *
                </label>
                <input
                  type="text"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                  placeholder="ej. RESTAURANTE EL TABLÓN S.A.C."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              {/* Detalle / Concepto */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Detalle / Concepto del Gasto
                </label>
                <textarea
                  rows={2}
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Describa el motivo o bienes adquiridos..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Clasificación de Gasto */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Clasificación de Gasto *
                </label>
                <select
                  value={clasificacionGasto}
                  onChange={(e) => setClasificacionGasto(e.target.value as ClasificacionGasto)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CLASIFICACIONES_GASTO.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Centro de Costos */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Centro de Costos Imputable *
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

              {/* Monto Total Directo (Sin Subtotal ni IGV conforme directiva) */}
              <div className="sm:col-span-2 p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-indigo-950 text-xs">
                      Monto Total Rendido (S/.) *
                    </label>
                    <p className="text-[11px] text-indigo-700">
                      Importe final pagado (Directiva empresarial: Solo Monto Total)
                    </p>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-500 text-sm">
                      S/
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={montoTotal}
                      onChange={(e) => setMontoTotal(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-indigo-300 rounded-lg font-mono font-extrabold text-indigo-950 text-base outline-none focus:ring-2 focus:ring-indigo-600 text-right"
                    />
                  </div>
                </div>
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
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-guardar-edicion-comprobante"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
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
              {numeroComprobante} - {razonSocial}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
