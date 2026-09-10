import React, { useState } from 'react';
import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ShieldCheck,
  Check,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import { Rendicion, CompanySettings } from '../types';
import { calculateCuadre, formatCurrency } from '../utils/financial';

interface CuadreModalProps {
  isOpen: boolean;
  onClose: () => void;
  rendicion: Rendicion;
  company: CompanySettings;
  onUpdateMontoAsignado?: (rendicionId: string, newMonto: number) => void;
  onAddReciboSimple: (rendicionId: string, monto: number, detalle: string) => void;
}

export const CuadreModal: React.FC<CuadreModalProps> = ({
  isOpen,
  onClose,
  rendicion,
  company,
  onUpdateMontoAsignado,
  onAddReciboSimple,
}) => {
  const cuadre = calculateCuadre(rendicion.montoAsignado, rendicion.items, company.toleranciaCuadre);
  
  // Concept for the simple receipt
  const defaultDetalle = cuadre.saldoRestante <= company.toleranciaCuadre
    ? 'Recibo Simple por gastos menores / remanente operativo para cuadre a cero'
    : 'Declaración jurada / Recibo simple de movilidad y gastos menores de comisión';

  const [detalleRecibo, setDetalleRecibo] = useState(defaultDetalle);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const isZero = cuadre.saldoRestante === 0;
  const isPositiveRestante = cuadre.saldoRestante > 0;
  const isWithinTolerance = isPositiveRestante && cuadre.saldoRestante <= company.toleranciaCuadre;
  const isOverspent = cuadre.saldoRestante < 0;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/40 border border-indigo-400/40 text-emerald-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-1.5">
                <span>Ajuste y Cuadre de Rendición</span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/10 text-indigo-200">
                  {rendicion.codigoRendicion}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Verifique si la rendición queda en cero o emita un recibo simple del restante
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
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-slate-800 text-xs">
          {successNotice ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-center space-y-2 animate-fadeIn">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm">¡Operación Completada con Éxito!</p>
              <p className="text-xs">{successNotice}</p>
            </div>
          ) : (
            <>
              {/* Financial Balance Summary Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <span>Balance Financiero de la Planilla</span>
                  <span className="text-slate-500 font-normal normal-case">
                    Tolerancia máx: S/ {company.toleranciaCuadre.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Desembolsado</span>
                    <span className="text-sm sm:text-base font-mono font-extrabold text-slate-900 block mt-0.5">
                      {formatCurrency(rendicion.montoAsignado)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Rendido</span>
                    <span className="text-sm sm:text-base font-mono font-extrabold text-indigo-700 block mt-0.5">
                      {formatCurrency(cuadre.totalRendido)}
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border shadow-xs ${
                      isZero
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : isWithinTolerance
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : isPositiveRestante
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <span className="text-[10px] font-semibold block uppercase">Saldo Restante</span>
                    <span className="text-sm sm:text-base font-mono font-extrabold block mt-0.5">
                      {formatCurrency(cuadre.saldoRestante)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CASE 1: EXACTLY ZERO */}
              {isZero && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>¡Rendición Perfectamente Cuadrada a Cero (S/ 0.00)!</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    El monto desembolsado y la suma de comprobantes coinciden al 100%. No se requiere ningún ajuste adicional ni emisión de recibos.
                  </p>
                </div>
              )}

              {/* CASE 2: POSITIVE REMAINING (e.g. S/ 2.00 or within tolerance or surplus) */}
              {isPositiveRestante && (
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

              {/* CASE 3: OVERSPENT / SOBREGIRO (saldoRestante < 0) */}
              {isOverspent && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start space-x-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-bold text-xs">
                        Gastos Exceden el Fondo Desembolsado en {formatCurrency(Math.abs(cuadre.saldoRestante))}
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Los comprobantes reportados suman <strong>{formatCurrency(cuadre.totalRendido)}</strong>, mientras que el fondo asignado fue de <strong>{formatCurrency(rendicion.montoAsignado)}</strong>. Para cuadrar la rendición a cero, nivele el fondo desembolsado al total rendido.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAjustarDesembolso}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Nivelar Desembolso a {formatCurrency(cuadre.totalRendido)} y Cuadrar a Cero</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
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
