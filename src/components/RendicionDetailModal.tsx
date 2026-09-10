import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  ScanText,
  Download,
  Building2,
  Calendar,
  CreditCard,
  Landmark,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Check,
  Ban,
  Receipt,
  Trash2,
  ExternalLink,
  ShieldCheck,
  PenTool,
  FileCheck,
  ArrowDownUp,
  Sparkles,
  Scale,
} from 'lucide-react';
import {
  Rendicion,
  CompanySettings,
  CostCenter,
  User as UserType,
  ExpenseItem,
} from '../types';
import {
  calculateCuadre,
  exportRendicionToExcel,
  exportRendicionToPDF,
  exportAccountingFile,
  formatCurrency,
} from '../utils/financial';
import { CuadreWidget } from './CuadreWidget';
import { SignaturePadModal } from './SignaturePadModal';
import { CuadreModal } from './CuadreModal';

interface RendicionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rendicion: Rendicion;
  company: CompanySettings;
  costCenter?: CostCenter;
  currentUser: UserType | null;
  onOpenOcr: () => void;
  onDeleteExpense: (expenseId: string) => void;
  onSubmitForApproval: (rendicionId: string) => void;
  onApproveRendicion: (rendicionId: string, comment: string, firmaAprobadorUrl?: string) => void;
  onObserveRendicion: (rendicionId: string, comment: string) => void;
  onLiquidateRendicion: (rendicionId: string, comment: string) => void;
  onUpdateSignatures?: (
    rendicionId: string,
    signatures: {
      firmaResponsable?: string;
      fechaFirmaResponsable?: string;
      firmaAprobador?: string;
      fechaFirmaAprobador?: string;
    }
  ) => void;
  onUpdateMontoAsignado?: (rendicionId: string, newMonto: number) => void;
  onUpdateItems?: (rendicionId: string, updatedItems: ExpenseItem[]) => void;
}

export const RendicionDetailModal: React.FC<RendicionDetailModalProps> = ({
  isOpen,
  onClose,
  rendicion,
  company,
  costCenter,
  currentUser,
  onOpenOcr,
  onDeleteExpense,
  onSubmitForApproval,
  onApproveRendicion,
  onObserveRendicion,
  onLiquidateRendicion,
  onUpdateSignatures,
  onUpdateMontoAsignado,
  onUpdateItems,
}) => {
  const [approvalComment, setApprovalComment] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState<null | 'aprobar' | 'observar' | 'liquidar'>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Sorting & Cuadre State
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [showCuadreModal, setShowCuadreModal] = useState<boolean>(false);

  // Signatures dialog state
  const [signingRole, setSigningRole] = useState<'responsable' | 'aprobador' | null>(null);
  const [tempApprovalFirma, setTempApprovalFirma] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const cuadre = calculateCuadre(rendicion.montoAsignado, rendicion.items, company.toleranciaCuadre);

  const canApprove =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'gerente' ||
    currentUser?.role === 'contador';

  const canLiquidate =
    currentUser?.role === 'admin' || currentUser?.role === 'contador';

  const canEdit =
    rendicion.estado === 'borrador' || rendicion.estado === 'observada';

  const handleSortItemsByDate = () => {
    if (!rendicion.items || rendicion.items.length === 0) return;
    const sorted = [...rendicion.items].sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });
    const renumbered = sorted.map((item, idx) => ({
      ...item,
      itemNumber: idx + 1,
    }));
    setSortAsc(!sortAsc);
    onUpdateItems?.(rendicion.id, renumbered);
  };

  const handleAddReciboSimple = (rendicionId: string, monto: number, detalle: string) => {
    const newReceiptNumber = `REC-${String(rendicion.items.length + 1).padStart(3, '0')}`;
    const newItem: ExpenseItem = {
      id: `item-recibo-${Date.now()}`,
      itemNumber: rendicion.items.length + 1,
      fecha: rendicion.fechaRendicion || new Date().toISOString().split('T')[0],
      tipoDocumento: 'Recibo Simple',
      numeroComprobante: newReceiptNumber,
      ruc: company.ruc || '20601928471',
      razonSocial: rendicion.responsableRendicion || rendicion.colaboradorNombre || 'Responsable de Rendición',
      detalle: detalle.trim() || 'Recibo simple por gastos menores / remanente operativo (Cuadre a cero)',
      clasificacionGasto: 'Gastos Menores / Remanente',
      centroCostosId: rendicion.centroCostosId,
      montoTotal: Number(monto.toFixed(2)),
      ocrVerificado: true,
    };
    const updatedItems = [...rendicion.items, newItem];
    onUpdateItems?.(rendicionId, updatedItems);
  };

  const handleActionSubmit = () => {
    if (showApprovalDialog === 'aprobar') {
      onApproveRendicion(
        rendicion.id,
        approvalComment || 'Aprobado conforme con comprobantes y cuadre válido.',
        tempApprovalFirma || rendicion.firmaAprobador
      );
    } else if (showApprovalDialog === 'observar') {
      onObserveRendicion(rendicion.id, approvalComment || 'Observación registrada en la documentación.');
    } else if (showApprovalDialog === 'liquidar') {
      onLiquidateRendicion(rendicion.id, approvalComment || 'Liquidado e integrado a contabilidad.');
    }
    setShowApprovalDialog(null);
    setApprovalComment('');
    setTempApprovalFirma(undefined);
  };

  const handleSaveSignature = (sigUrl: string) => {
    const timestamp = new Date().toLocaleString('es-PE');
    if (signingRole === 'responsable') {
      onUpdateSignatures?.(rendicion.id, {
        firmaResponsable: sigUrl,
        fechaFirmaResponsable: timestamp,
      });
    } else if (signingRole === 'aprobador') {
      setTempApprovalFirma(sigUrl);
      onUpdateSignatures?.(rendicion.id, {
        firmaAprobador: sigUrl,
        fechaFirmaAprobador: timestamp,
      });
    }
    setSigningRole(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col max-h-[96vh]">
          {/* Header Strip */}
          <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-3">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt="Logo"
                  className="w-10 h-10 object-contain rounded bg-white p-1"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-indigo-400 font-mono tracking-wider">
                    {rendicion.codigoRendicion}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      rendicion.estado === 'liquidada'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : rendicion.estado === 'aprobada'
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                        : rendicion.estado === 'pendiente_aprobacion'
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        : rendicion.estado === 'observada'
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-500/30 text-slate-300 border border-slate-500/40'
                    }`}
                  >
                    {rendicion.estado.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">{rendicion.titulo}</h2>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                onClick={() => exportRendicionToExcel(rendicion, company, costCenter)}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
                title="Descargar Planilla en Excel (Monto Total sin Subtotal/IGV)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Excel</span>
              </button>

              <button
                onClick={() => exportRendicionToPDF(rendicion, company, costCenter)}
                className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
                title="Descargar Planilla en PDF oficial con Firmas Digitales"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden md:inline">PDF</span>
              </button>

              <button
                onClick={() => exportAccountingFile(rendicion, company.sistemaContableExport)}
                className="px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
                title={`Exportar TXT/CSV para ${company.sistemaContableExport}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{company.sistemaContableExport}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Metadata Cards Grid - Updated with Accounts, Destinatario, Responsable, Referencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Box 1: Responsable, Destinatario y Fecha */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Responsable & Destinatario
                </span>
                <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                  {rendicion.responsableRendicion || rendicion.colaboradorNombre}
                </p>
                <p className="text-slate-600 text-[11px]">
                  Destinatario: <strong className="text-slate-800">{rendicion.nombreDestinatario || rendicion.colaboradorNombre}</strong>
                </p>
                <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-500 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-indigo-600" />
                  <span>Fecha Rendición: <strong>{rendicion.fechaRendicion || rendicion.fechaCreacion}</strong></span>
                </div>
              </div>

              {/* Box 2: Cuenta Origen de Empresa & Banco */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center space-x-1">
                  <Landmark className="w-3 h-3 text-indigo-600" />
                  <span>Cuenta de Origen (Empresa)</span>
                </span>
                <p className="font-mono font-bold text-slate-900 text-xs line-clamp-2">
                  {rendicion.cuentaOrigen || 'Cta. Principal BCP'}
                </p>
                <p className="text-slate-500 text-[11px]">{rendicion.banco}</p>
                <div className="pt-1 border-t border-slate-200 text-[11px] text-indigo-700 font-semibold">
                  {rendicion.departamento} ({costCenter ? costCenter.code : rendicion.centroCostosId})
                </div>
              </div>

              {/* Box 3: Cuenta Destino & Cheque/Transferencia */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center space-x-1">
                  <CreditCard className="w-3 h-3 text-indigo-600" />
                  <span>Cuenta Destino & Desembolso</span>
                </span>
                <p className="font-mono font-bold text-slate-900 text-xs line-clamp-1">
                  {rendicion.cuentaDestino || 'Cuenta asignada del colaborador'}
                </p>
                <div className="text-[11px] text-slate-800 font-semibold">
                  {rendicion.tipoDesembolso === 'Cheque' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-mono text-[11px]">
                      Cheque: {rendicion.numeroCheque || 'Sin N° registrado'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 font-mono text-[11px]">
                      Transferencia: {rendicion.numeroTransferencia || 'Sin N° registrado'}
                    </span>
                  )}
                </div>
                <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500 line-clamp-1">
                  Ref: {rendicion.referenciaRendicion || 'Comisión operativa'}
                </div>
              </div>

              {/* Box 4: Monto Desembolsado */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-1">
                <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                  Fondo Total Desembolsado
                </span>
                <p className="font-mono font-extrabold text-indigo-950 text-lg sm:text-xl">
                  {formatCurrency(rendicion.montoAsignado)}
                </p>
                <p className="text-indigo-700 text-[11px] font-medium">Soles (PEN)</p>
                <div className="pt-1 border-t border-indigo-200 text-[11px] text-indigo-800 font-semibold flex items-center justify-between">
                  <span>{rendicion.items.length} Comprobantes</span>
                  <span>Desemb: {rendicion.fechaDesembolso}</span>
                </div>
              </div>
            </div>

            {/* Cuadre Status Widget (With max 2 soles remaining) */}
            <CuadreWidget cuadre={cuadre} tolerancia={company.toleranciaCuadre} />

            {/* Cuadre Action Controller (ÚNICO BOTÓN DE CUADRE) */}
            {canEdit && (
              <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl text-white shadow-md border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-emerald-300 border border-indigo-500/30 shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                        Ajuste y Cuadre de Rendición
                      </h4>
                      {cuadre.saldoRestante === 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded">
                          Cuadrada a Cero (S/ 0.00)
                        </span>
                      ) : cuadre.saldoRestante > 0 && cuadre.saldoRestante <= company.toleranciaCuadre ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded">
                          Restante S/ {cuadre.saldoRestante.toFixed(2)} (Dentro de S/ 2.00)
                        </span>
                      ) : cuadre.saldoRestante > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold rounded">
                          Restante S/ {cuadre.saldoRestante.toFixed(2)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold rounded">
                          Exceso S/ {Math.abs(cuadre.saldoRestante).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Verifique el balance y emita un recibo simple del restante si tiene hasta 2 soles para cuadrar a cero
                    </p>
                  </div>
                </div>

                {/* Único botón de cuadre solicitado */}
                <button
                  type="button"
                  id="btn-ajustar-cuadrar-unico"
                  onClick={() => setShowCuadreModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Scale className="w-4 h-4 text-emerald-300" />
                  <span>⚡ Ajustar y Cuadrar Rendición</span>
                </button>
              </div>
            )}

            {/* Observations Alert if any */}
            {rendicion.observaciones && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Observación de Auditoría:</strong> {rendicion.observaciones}
                </div>
              </div>
            )}

            {/* Digital Signatures Cards Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <PenTool className="w-4 h-4 text-indigo-600" />
                  <span>Firmas Digitales de Conformidad</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Estampadas en la planilla oficial de auditoría interna
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Signature 1: Responsable de la Rendición */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">
                      Firma Responsable de Rendición
                    </span>
                    {rendicion.firmaResponsable ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Firmado</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <div className="h-20 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center p-2">
                    {rendicion.firmaResponsable ? (
                      <img
                        src={rendicion.firmaResponsable}
                        alt="Firma Responsable"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Sin firma digital registrada
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">
                      {rendicion.responsableRendicion || rendicion.colaboradorNombre}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSigningRole('responsable')}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
                    >
                      {rendicion.firmaResponsable ? 'Modificar Firma' : 'Firmar Ahora'}
                    </button>
                  </div>
                </div>

                {/* Signature 2: Administrador o Gerente de la Empresa */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">
                      Firma Gerente / Administrador
                    </span>
                    {rendicion.firmaAprobador ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aprobado y Firmado</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <div className="h-20 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center p-2">
                    {rendicion.firmaAprobador ? (
                      <img
                        src={rendicion.firmaAprobador}
                        alt="Firma Aprobador"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Requiere aprobación de Gerencia o Administración
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">
                      {rendicion.aprobadoPor || 'Aprobador Autorizado'}
                    </span>
                    {canApprove && (
                      <button
                        type="button"
                        onClick={() => setSigningRole('aprobador')}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
                      >
                        {rendicion.firmaAprobador ? 'Actualizar Firma' : 'Estampar Firma'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Comprobantes Table Header & OCR Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Comprobantes de Pago Registrados (Solo Monto Total)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Sin subtotal ni IGV conforme a directiva empresarial de rendición total
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleSortItemsByDate}
                  disabled={rendicion.items.length === 0}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Ordena todos los comprobantes según la fecha de emisión del documento"
                >
                  <ArrowDownUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ordenar por Fecha ({sortAsc ? 'Más antiguo ⬆' : 'Más reciente ⬇'})</span>
                </button>

                {canEdit && (
                  <button
                    onClick={onOpenOcr}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <ScanText className="w-4 h-4" />
                    <span>Cargar Ticket / Comprobante (OCR)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Detailed Expense Table (Subtotal and IGV completely removed) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">Ítem</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Documento</th>
                      <th className="py-2.5 px-3 font-mono">N° Comprobante</th>
                      <th className="py-2.5 px-3">RUC / Razón Social</th>
                      <th className="py-2.5 px-3">Detalle / Concepto</th>
                      <th className="py-2.5 px-3">Clasificación</th>
                      <th className="py-2.5 px-3 text-right">Monto Total (S/.)</th>
                      {canEdit && <th className="py-2.5 px-3 text-center w-12">Acción</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {rendicion.items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canEdit ? 9 : 8}
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          No hay comprobantes registrados aún. Utilice el botón "Cargar Ticket / Comprobante (OCR)" para agregar gastos.
                        </td>
                      </tr>
                    ) : (
                      rendicion.items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                            {it.itemNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                            {it.fecha}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">
                              {it.tipoDocumento}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {it.numeroComprobante}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 line-clamp-1">{it.razonSocial}</div>
                            <div className="text-[10px] text-slate-500 font-mono">RUC: {it.ruc}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 max-w-xs">
                            <p className="line-clamp-2">{it.detalle}</p>
                            {it.comprobanteUrl && (
                              <button
                                onClick={() => setSelectedPreviewImage(it.comprobanteUrl || null)}
                                className="text-[10px] text-indigo-600 hover:underline flex items-center space-x-0.5 mt-0.5 cursor-pointer"
                              >
                                <span>Ver comprobante escaneado</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {it.clasificacionGasto}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                            {formatCurrency(it.montoTotal)}
                          </td>
                          {canEdit && (
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => onDeleteExpense(it.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {rendicion.items.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={7} className="py-2.5 px-3 text-right text-slate-700 uppercase tracking-wider text-[11px]">
                          Total Gastos Rendidos:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-indigo-900 text-sm">
                          {formatCurrency(cuadre.totalRendido)}
                        </td>
                        {canEdit && <td></td>}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Historial de Aprobación Jerárquica */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Trazabilidad y Aprobación Jerárquica</span>
              </h4>
              <div className="space-y-2">
                {rendicion.historialAprobacion.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-start justify-between"
                  >
                    <div className="flex items-start space-x-2">
                      <div
                        className={`p-1 rounded-full text-white mt-0.5 ${
                          h.accion === 'liquidada'
                            ? 'bg-emerald-600'
                            : h.accion === 'aprobada'
                            ? 'bg-blue-600'
                            : h.accion === 'observada'
                            ? 'bg-rose-500'
                            : 'bg-indigo-600'
                        }`}
                      >
                        {h.accion === 'aprobada' || h.accion === 'liquidada' ? (
                          <Check className="w-3 h-3" />
                        ) : h.accion === 'observada' ? (
                          <Ban className="w-3 h-3" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {h.nivel}: {h.accion.toUpperCase()}
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          Por: <strong className="text-slate-800">{h.usuarioNombre}</strong> ({h.usuarioRol})
                        </p>
                        {h.comentario && (
                          <p className="text-slate-500 italic mt-0.5 text-[11px] bg-slate-50 p-1 rounded">
                            "{h.comentario}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{h.fecha}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dialog for Commenting & Approving/Observing */}
          {showApprovalDialog && (
            <div className="p-4 bg-slate-100 border-t border-slate-200 animate-fadeIn">
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                {showApprovalDialog === 'aprobar'
                  ? 'Confirmar Aprobación de Rendición'
                  : showApprovalDialog === 'observar'
                  ? 'Registrar Observación / Rechazo'
                  : 'Liquidar y Conciliar Rendición Contablemente'}
              </h4>
              <textarea
                rows={2}
                placeholder="Ingrese un comentario u observación para el expediente digital..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 mb-2"
              />

              {showApprovalDialog === 'aprobar' && (
                <div className="mb-3 flex items-center space-x-3 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">Firma de Gerencia:</span>
                  {rendicion.firmaAprobador || tempApprovalFirma ? (
                    <div className="flex items-center space-x-2">
                      <img
                        src={tempApprovalFirma || rendicion.firmaAprobador}
                        alt="Firma"
                        className="h-8 border border-slate-200 rounded p-0.5 bg-white"
                      />
                      <span className="text-[11px] text-emerald-600 font-bold">✓ Firma Lista</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSigningRole('aprobador')}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded flex items-center space-x-1"
                    >
                      <PenTool className="w-3 h-3" />
                      <span>Estampar Firma Digital Ahora</span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalDialog(null);
                    setTempApprovalFirma(undefined);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleActionSubmit}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded text-white cursor-pointer ${
                    showApprovalDialog === 'observar'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  Confirmar Acción
                </button>
              </div>
            </div>
          )}

          {/* Footer Workflow Buttons */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="text-xs text-slate-600">
              Usuario activo: <strong className="text-slate-900">{currentUser?.name}</strong> ({currentUser?.roleLabel})
            </div>

            <div className="flex items-center space-x-2">
              {/* Colaborador sending for approval */}
              {canEdit && (
                <button
                  onClick={() => onSubmitForApproval(rendicion.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar para Aprobación</span>
                </button>
              )}

              {/* Gerente / Admin Approving or Observing */}
              {canApprove && rendicion.estado === 'pendiente_aprobacion' && (
                <>
                  <button
                    onClick={() => setShowApprovalDialog('observar')}
                    className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Observar / Rechazar
                  </button>
                  <button
                    onClick={() => setShowApprovalDialog('aprobar')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aprobar Rendición</span>
                  </button>
                </>
              )}

              {/* Contador / Admin Liquidating */}
              {canLiquidate && rendicion.estado === 'aprobada' && (
                <button
                  onClick={() => setShowApprovalDialog('liquidar')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Liquidar y Cerrar Rendición</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>

        {/* Image Preview Submodal if clicked */}
        {selectedPreviewImage && (
          <div
            onClick={() => setSelectedPreviewImage(null)}
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="max-w-md w-full bg-white p-2 rounded-xl overflow-hidden shadow-2xl">
              <img src={selectedPreviewImage} alt="Comprobante" className="w-full h-auto object-contain rounded" />
              <p className="text-center text-xs text-slate-500 mt-2 font-semibold">
                Haga clic en cualquier lugar para cerrar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cuadre Modal */}
      {showCuadreModal && (
        <CuadreModal
          isOpen={showCuadreModal}
          onClose={() => setShowCuadreModal(false)}
          rendicion={rendicion}
          company={company}
          onUpdateMontoAsignado={onUpdateMontoAsignado}
          onAddReciboSimple={handleAddReciboSimple}
        />
      )}

      {/* Signature Pad Modal for Responsable or Aprobador */}
      {signingRole && (
        <SignaturePadModal
          isOpen={!!signingRole}
          onClose={() => setSigningRole(null)}
          title={
            signingRole === 'responsable'
              ? 'Firma Digital - Responsable de la Rendición'
              : 'Firma Digital - Gerencia / Administración'
          }
          signerName={
            signingRole === 'responsable'
              ? rendicion.responsableRendicion || rendicion.colaboradorNombre
              : currentUser?.name || 'Aprobador Autorizado'
          }
          signerRole={
            signingRole === 'responsable'
              ? 'Responsable / Rendidor'
              : currentUser?.roleLabel || 'Gerente / Administrador'
          }
          onSaveSignature={handleSaveSignature}
        />
      )}
    </>
  );
};
