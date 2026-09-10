import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, ArrowDownRight, Scale, ShieldCheck } from 'lucide-react';
import { CuadreResult } from '../types';
import { formatCurrency } from '../utils/financial';

interface CuadreWidgetProps {
  cuadre: CuadreResult;
  tolerancia?: number;
  compact?: boolean;
}

export const CuadreWidget: React.FC<CuadreWidgetProps> = ({
  cuadre,
  tolerancia = 2.0,
  compact = false,
}) => {
  const { montoAsignado, totalRendido, saldoRestante, esCuadrado, estadoTipo } = cuadre;

  const percentage = montoAsignado > 0 ? Math.min(100, Math.round((totalRendido / montoAsignado) * 100)) : 0;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
          esCuadrado
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : estadoTipo === 'saldo_devolver'
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}
      >
        {esCuadrado ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        ) : estadoTipo === 'saldo_devolver' ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        )}
        <span>
          {esCuadrado
            ? `Cuadrado (Restante ${formatCurrency(saldoRestante)})`
            : estadoTipo === 'saldo_devolver'
            ? `Por Devolver (${formatCurrency(saldoRestante)})`
            : `Sobregiro (${formatCurrency(Math.abs(saldoRestante))})`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-all shadow-sm ${
        esCuadrado
          ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border-emerald-300'
          : estadoTipo === 'saldo_devolver'
          ? 'bg-gradient-to-br from-amber-50/90 to-yellow-50/50 border-amber-300'
          : 'bg-gradient-to-br from-rose-50/90 to-red-50/50 border-rose-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <div
            className={`p-2 rounded-lg ${
              esCuadrado
                ? 'bg-emerald-600 text-white'
                : estadoTipo === 'saldo_devolver'
                ? 'bg-amber-500 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-slate-900">
                Cuadre Financiero de Rendición
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/80 border border-slate-300 text-slate-700">
                Tolerancia Máx: S/ {tolerancia.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Regla empresarial: Conciliación válida hasta tener un remanente máximo de 2 soles.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 shadow-xs ${
            esCuadrado
              ? 'bg-emerald-600 text-white border-emerald-700'
              : estadoTipo === 'saldo_devolver'
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {esCuadrado ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>
            {estadoTipo === 'exacto'
              ? 'CUADRE EXACTO AL 100%'
              : estadoTipo === 'dentro_limite_2soles'
              ? 'CUADRE CONFORME (<= S/ 2.00)'
              : estadoTipo === 'saldo_devolver'
              ? 'REQUIERE DEVOLUCIÓN DE FONDOS'
              : 'SOBREGIRO PRESUPUESTAL'}
          </span>
        </div>
      </div>

      {/* Grid of Key Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/80 backdrop-blur-xs rounded-lg p-3 border border-slate-200">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Monto Asignado (Transferencia/Cheque)
          </span>
          <span className="text-base font-extrabold text-slate-900 font-mono">
            {formatCurrency(montoAsignado)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Rendido (Comprobantes)
          </span>
          <span className="text-base font-extrabold text-indigo-700 font-mono">
            {formatCurrency(totalRendido)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Saldo Restante a Liquidar
          </span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-base font-extrabold font-mono ${
                esCuadrado
                  ? 'text-emerald-700'
                  : estadoTipo === 'saldo_devolver'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {formatCurrency(saldoRestante)}
            </span>
            {esCuadrado && saldoRestante > 0 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                ≤ S/ {tolerancia.toFixed(2)} OK
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress & Diagnostic Message */}
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
          <span>Ejecución del fondo: {percentage}%</span>
          <span className="font-semibold text-slate-800">{cuadre.mensaje}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              percentage > 100
                ? 'bg-rose-500'
                : percentage >= 99
                ? 'bg-emerald-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
