import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ShieldCheck,
  Receipt,
  ArrowRight,
  PlusCircle,
  Inbox,
  Check,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Rendicion, CompanySettings, ExpenseItem } from '../types';
import { calculateCuadre, formatCurrency } from '../utils/financial';

interface CuadreModalProps {
  isOpen: boolean;
  onClose: () => void;
  rendicion: Rendicion;
  company: CompanySettings;
  onUpdateMontoAsignado?: (rendicionId: string, newMonto: number) => void;
  onAddReciboSimple: (rendicionId: string, monto: number, detalle: string) => void;
  onCuadreWithSurplus?: (
    rendicionId: string,
    retainedItems: ExpenseItem[],
    surplusItems: ExpenseItem[],
    createNewNow: boolean,
    reciboSimpleMonto?: number,
    reciboSimpleDetalle?: string
  ) => void;
}

export const CuadreModal: React.FC<CuadreModalProps> = ({
  isOpen,
  onClose,
  rendicion,
  company,
  onUpdateMontoAsignado,
  onAddReciboSimple,
  onCuadreWithSurplus,
}) => {
  const cuadre = calculateCuadre(rendicion.montoAsignado, rendicion.items, company.toleranciaCuadre);

  // Concept for simple receipt when positive remainder
  const defaultDetalle =
    cuadre.saldoRestante <= company.toleranciaCuadre
      ? 'Recibo Simple por gastos menores / remanente operativo para cuadre a cero'
      : 'Declaración jurada / Recibo simple de movilidad y gastos menores de comisión';

  const [detalleRecibo, setDetalleRecibo] = useState(defaultDetalle);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Active view tab when overspent: 'separar_sobrantes' or 'nivelar'
  const isOverspent = cuadre.saldoRestante < 0;
  const [activeTab, setActiveTab] = useState<'separar_sobrantes' | 'recibo_nivelar'>(
    isOverspent ? 'separar_sobrantes' : 'recibo_nivelar'
  );

  // Selection of item IDs to retain in this rendition
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  // Option to auto-generate simple receipt for any minor residual (<= tolerancia)
  const [incluirReciboSimpleRemanente, setIncluirReciboSimpleRemanente] = useState(true);

  // Auto-select items that fit into montoAsignado greedily on mount or when rendicion items change
  useEffect(() => {
    if (!isOpen) return;

    if (rendicion.items.length === 0) {
      setSelectedItemIds(new Set());
      return;
    }

    // If overspent, pick items chronologically or optimally up to montoAsignado
    let currentSum = 0;
    const initialSelected = new Set<string>();

    for (const item of rendicion.items) {
      if (currentSum + item.montoTotal <= rendicion.montoAsignado + 0.001) {
        initialSelected.add(item.id);
        currentSum += item.montoTotal;
      }
    }

    // If no single item fits or sum is 0, select at least the first item
    if (initialSelected.size === 0 && rendicion.items.length > 0) {
      initialSelected.add(rendicion.items[0].id);
    }

    setSelectedItemIds(initialSelected);
    setActiveTab(rendicion.items.reduce((s, i) => s + i.montoTotal, 0) > rendicion.montoAsignado ? 'separar_sobrantes' : 'recibo_nivelar');
  }, [isOpen, rendicion.id, rendicion.items, rendicion.montoAsignado]);

  // Derived lists
  const retainedItems = useMemo(() => {
    return rendicion.items.filter((item) => selectedItemIds.has(item.id));
  }, [rendicion.items, selectedItemIds]);

  const surplusItems = useMemo(() => {
    return rendicion.items.filter((item) => !selectedItemIds.has(item.id));
  }, [rendicion.items, selectedItemIds]);

  const subtotalRetained = useMemo(() => {
    return Number(retainedItems.reduce((acc, it) => acc + it.montoTotal, 0).toFixed(2));
  }, [retainedItems]);

  const subtotalSurplus = useMemo(() => {
    return Number(surplusItems.reduce((acc, it) => acc + it.montoTotal, 0).toFixed(2));
  }, [surplusItems]);

  const saldoPlanillaAjustada = Number((rendicion.montoAsignado - subtotalRetained).toFixed(2));
  const puedeAplicarReciboRemanente =
    saldoPlanillaAjustada > 0 && saldoPlanillaAjustada <= company.toleranciaCuadre;

  if (!isOpen) return null;

  const isZero = cuadre.saldoRestante === 0;
  const isPositiveRestante = cuadre.saldoRestante > 0;
  const isWithinTolerance = isPositiveRestante && cuadre.saldoRestante <= company.toleranciaCuadre;

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedItemIds(new Set(rendicion.items.map((i) => i.id)));
  };

  const handleAutoSelectOptimal = () => {
    let currentSum = 0;
    const optimal = new Set<string>();
    for (const item of rendicion.items) {
      if (currentSum + item.montoTotal <= rendicion.montoAsignado + 0.001) {
        optimal.add(item.id);
        currentSum += item.montoTotal;
      }
    }
    setSelectedItemIds(optimal);
  };

  // Handler for Cuadre with Surplus separation
  const handleExecuteCuadreWithSurplus = (createNewNow: boolean) => {
    if (retainedItems.length === 0) {
      alert('Debe mantener al menos un comprobante en la rendición actual.');
      return;
    }

    if (subtotalRetained > rendicion.montoAsignado) {
      alert(
        `Los documentos seleccionados para esta planilla (S/ ${subtotalRetained.toFixed(2)}) aún superan el monto asignado (S/ ${rendicion.montoAsignado.toFixed(2)}). Desmarque comprobantes adicionales para que queden fuera del cuadro.`
      );
      return;
    }

    const reciboMonto =
      incluirReciboSimpleRemanente && puedeAplicarReciboRemanente
        ? saldoPlanillaAjustada
        : undefined;

    const reciboDet = reciboMonto
      ? `Recibo Simple por remanente de cuadre a cero (S/ ${reciboMonto.toFixed(2)})`
      : undefined;

    if (onCuadreWithSurplus) {
      onCuadreWithSurplus(
        rendicion.id,
        retainedItems,
        surplusItems,
        createNewNow,
        reciboMonto,
        reciboDet
      );
      setSuccessNotice(
        createNewNow
          ? `¡Rendición cuadrada! Se retuvieron ${retainedItems.length} comprobantes (S/ ${subtotalRetained.toFixed(2)}) y se trasladan ${surplusItems.length} comprobantes sobrantes (S/ ${subtotalSurplus.toFixed(2)}) a la nueva rendición.`
          : `¡Rendición cuadrada! Se separaron ${surplusItems.length} comprobantes sobrantes (S/ ${subtotalSurplus.toFixed(2)}) que quedan guardados en la Bandeja de Pendientes.`
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      onClose();
    }
  };

  const handleCreateRecibo = () => {
    if (cuadre.saldoRestante <= 0) return;
    onAddReciboSimple(
      rendicion.id,
      cuadre.saldoRestante,
      detalleRecibo.trim() || 'Recibo Simple por gastos menores / remanente de comisión'
    );
    setSuccessNotice(
      `¡Recibo simple generado por S/ ${cuadre.saldoRestante.toFixed(2)}! La planilla ha quedado cuadrada exactamente a S/ 0.00.`
    );
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  const handleAjustarDesembolso = () => {
    onUpdateMontoAsignado?.(rendicion.id, cuadre.totalRendido);
    setSuccessNotice(
      `Se ajustó el desembolso a S/ ${cuadre.totalRendido.toFixed(2)}. La planilla ahora está cuadrada a S/ 0.00.`
    );
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/40 border border-indigo-400/40 text-emerald-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <span>Ajuste y Cuadre de Rendición</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-indigo-200 font-bold">
                  {rendicion.codigoRendicion}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                Cuadre a cero, separación de documentos sobrantes fuera de planilla y emisión de recibos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-5 space-y-4 overflow-y-auto text-slate-800 text-xs flex-1">
          {successNotice ? (
            <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-center space-y-3 animate-fadeIn">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="font-bold text-base">¡Operación de Cuadre Exitosa!</p>
              <p className="text-xs max-w-md mx-auto leading-relaxed">{successNotice}</p>
            </div>
          ) : (
            <>
              {/* Financial Balance Summary Banner */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <span>Balance General de la Rendición</span>
                  <span className="text-slate-500 font-normal normal-case">
                    Tolerancia máx: S/ {company.toleranciaCuadre.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Desembolsado</span>
                    <span className="text-xs sm:text-base font-mono font-extrabold text-slate-900 block mt-0.5">
                      {formatCurrency(rendicion.montoAsignado)}
                    </span>
                  </div>

                  <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Comprobantes</span>
                    <span className="text-xs sm:text-base font-mono font-extrabold text-indigo-700 block mt-0.5">
                      {formatCurrency(cuadre.totalRendido)}
                    </span>
                  </div>

                  <div
                    className={`p-2 sm:p-2.5 rounded-lg border shadow-xs ${
                      isZero
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : isWithinTolerance
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : isPositiveRestante
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <span className="text-[10px] font-semibold block uppercase">
                      {cuadre.saldoRestante < 0 ? 'Exceso de Gastos' : 'Saldo Restante'}
                    </span>
                    <span className="text-xs sm:text-base font-mono font-extrabold block mt-0.5">
                      {cuadre.saldoRestante < 0
                        ? `+${formatCurrency(Math.abs(cuadre.saldoRestante))}`
                        : formatCurrency(cuadre.saldoRestante)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs when overspent */}
              {isOverspent && (
                <div className="flex border-b border-slate-200 space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('separar_sobrantes')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      activeTab === 'separar_sobrantes'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>⚡ Separar Sobrantes para Nueva Rendición</span>
                    <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
                      Recomendado
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('recibo_nivelar')}
                    className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'recibo_nivelar'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Nivelar Desembolso</span>
                  </button>
                </div>
              )}

              {/* TAB 1: SEPARACIÓN DE DOCUMENTOS SOBRANTES */}
              {(activeTab === 'separar_sobrantes' || isOverspent) && activeTab !== 'recibo_nivelar' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-amber-950">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-xs">
                        Los documentos registrados ({formatCurrency(cuadre.totalRendido)}) superan el monto desembolsado ({formatCurrency(rendicion.montoAsignado)})
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Seleccione cuáles comprobantes pertenecen a esta rendición para <strong>cuadrarla a S/ {rendicion.montoAsignado.toFixed(2)}</strong>. Los documentos desmarcados quedarán <strong>fuera del cuadro</strong> y se trasladarán a una nueva rendición o quedarán en la bandeja pendiente.
                      </p>
                    </div>
                  </div>

                  {/* Interactive Item Sorter */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 uppercase tracking-wider">
                        Seleccionar comprobantes a mantener en esta planilla
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={handleAutoSelectOptimal}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded text-[10px] cursor-pointer"
                          title="Seleccionar automáticamente los que suman hasta el monto asignado"
                        >
                          ⚡ Auto-ajustar Óptimo
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded text-[10px] cursor-pointer"
                        >
                          Marcar Todos
                        </button>
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {rendicion.items.map((item) => {
                        const isChecked = selectedItemIds.has(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleItemSelection(item.id)}
                            className={`p-2.5 flex items-center justify-between transition-colors cursor-pointer select-none ${
                              isChecked
                                ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                                : 'bg-slate-50/50 hover:bg-slate-100 opacity-65'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Handled by container
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-900 truncate">
                                    {item.razonSocial || item.detalle}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 font-mono">
                                    {item.tipoDocumento} • {item.numeroComprobante}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {item.fecha} — {item.clasificacionGasto}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  isChecked ? 'text-indigo-900' : 'text-slate-400 line-through'
                                }`}
                              >
                                {formatCurrency(item.montoTotal)}
                              </span>
                              <span
                                className={`block text-[9px] font-semibold uppercase ${
                                  isChecked ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {isChecked ? 'En Planilla' : 'Queda Fuera (Sobrante)'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Subtotal of selection preview */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Comprobantes en planilla ({retainedItems.length}):</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(subtotalRetained)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Saldo en esta rendición:</span>
                          <span
                            className={`font-mono font-extrabold text-xs px-1.5 py-0.5 rounded ${
                              saldoPlanillaAjustada === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : saldoPlanillaAjustada > 0 && saldoPlanillaAjustada <= company.toleranciaCuadre
                                ? 'bg-emerald-100 text-emerald-800'
                                : saldoPlanillaAjustada > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {saldoPlanillaAjustada === 0
                              ? 'S/ 0.00 (Cuadrada)'
                              : saldoPlanillaAjustada > 0
                              ? `Restan S/ ${saldoPlanillaAjustada.toFixed(2)}`
                              : `Excede en S/ ${Math.abs(saldoPlanillaAjustada).toFixed(2)}`}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-200/80 space-y-1">
                        <div className="flex justify-between items-center text-indigo-950 font-bold">
                          <span className="flex items-center space-x-1">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Documentos Sobrantes ({surplusItems.length}):</span>
                          </span>
                          <span className="font-mono text-sm text-indigo-700">
                            {formatCurrency(subtotalSurplus)}
                          </span>
                        </div>
                        <p className="text-[10px] text-indigo-800">
                          Estos {surplusItems.length} comprobantes quedan fuera de esta rendición para alimentar una nueva.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recibo simple check if minor remainder (<= 2 soles) */}
                  {puedeAplicarReciboRemanente && (
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-2">
                      <label className="flex items-center space-x-2 text-xs text-emerald-950 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={incluirReciboSimpleRemanente}
                          onChange={(e) => setIncluirReciboSimpleRemanente(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300 cursor-pointer"
                        />
                        <span className="font-medium">
                          Generar Recibo Simple por el remanente de <strong>{formatCurrency(saldoPlanillaAjustada)}</strong> para cuadrar exactamente a <strong>S/ 0.00</strong>
                        </span>
                      </label>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold shrink-0">
                        Tol: S/ {company.toleranciaCuadre.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons for Separation */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      id="btn-cuadrar-crear-nueva-rendicion"
                      disabled={subtotalRetained > rendicion.montoAsignado || surplusItems.length === 0}
                      onClick={() => handleExecuteCuadreWithSurplus(true)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98 ${
                        subtotalRetained > rendicion.montoAsignado || surplusItems.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-300" />
                      <span>⚡ Cuadrar Rendición y Crear Nueva Rendición con los Sobrantes ({formatCurrency(subtotalSurplus)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      id="btn-cuadrar-guardar-sobrantes-bandeja"
                      disabled={subtotalRetained > rendicion.montoAsignado || surplusItems.length === 0}
                      onClick={() => handleExecuteCuadreWithSurplus(false)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        subtotalRetained > rendicion.montoAsignado || surplusItems.length === 0
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      <Inbox className="w-4 h-4 text-slate-600" />
                      <span>Cuadrar y Guardar los Sobrantes ({surplusItems.length} docs) en Bandeja de Pendientes</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2 or POSITIVE REMAINDER: RECIBO SIMPLE / NIVELAR */}
              {(activeTab === 'recibo_nivelar' || (!isOverspent && isPositiveRestante)) && (
                <div className="space-y-4">
                  {/* Diagnosis message */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-start space-x-2.5 ${
                      isWithinTolerance
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${isWithinTolerance ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <div className="space-y-1">
                      <p className="font-bold text-xs">
                        {isWithinTolerance
                          ? `Restante de ${formatCurrency(cuadre.saldoRestante)} (Dentro del margen normativo de S/ 2.00)`
                          : `Restante de ${formatCurrency(cuadre.saldoRestante)} por liquidar`}
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Para cuadrar la rendición a <strong>cero absoluto (S/ 0.00)</strong>, puede generar automáticamente un <strong>Recibo Simple / Declaración Jurada</strong> por el restante de <strong>{formatCurrency(cuadre.saldoRestante)}</strong> que justificará el saldo en la planilla.
                      </p>
                    </div>
                  </div>

                  {/* Action 1: Generar Recibo Simple del Restante */}
                  <div className="p-4 bg-indigo-50/70 border-2 border-indigo-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-indigo-950 font-bold text-xs">
                        <Receipt className="w-4 h-4 text-indigo-600" />
                        <span>Opción Recomendada: Recibo Simple del Restante</span>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-600 text-white font-mono font-bold rounded text-[11px]">
                        +{formatCurrency(cuadre.saldoRestante)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                        Concepto / Glosa del Recibo Simple *
                      </label>
                      <input
                        type="text"
                        value={detalleRecibo}
                        onChange={(e) => setDetalleRecibo(e.target.value)}
                        placeholder="ej. Recibo simple por gastos menores / remanente operativo"
                        className="w-full px-3 py-2 text-xs bg-white border border-indigo-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-indigo-700 mt-1">
                        Se registrará a nombre de {rendicion.responsableRendicion || rendicion.colaboradorNombre} con fecha {rendicion.fechaRendicion}.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateRecibo}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Generar Recibo Simple por {formatCurrency(cuadre.saldoRestante)} y Cuadrar a Cero</span>
                    </button>
                  </div>

                  {/* Action 2: Alternatively, level the desembolso */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold text-slate-800 text-xs block">
                        ¿Prefiere ajustar el fondo sin emitir recibo?
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Ajusta el desembolso al total rendido ({formatCurrency(cuadre.totalRendido)}), dejando el remanente en S/ 0.00.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAjustarDesembolso}
                      className="shrink-0 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 cursor-pointer shadow-xs transition-colors"
                    >
                      Ajustar Desembolso a {formatCurrency(cuadre.totalRendido)}
                    </button>
                  </div>
                </div>
              )}

              {/* EXACT ZERO CONFIRMATION */}
              {isZero && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-emerald-900 font-bold text-sm">
                    ¡La rendición ya se encuentra exactamente cuadrada a cero (S/ 0.00)!
                  </p>
                  <p className="text-xs text-emerald-700">
                    Los comprobantes rinden exactamente el total desembolsado ({formatCurrency(rendicion.montoAsignado)}).
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            {isZero || successNotice ? 'Aceptar y Cerrar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};
