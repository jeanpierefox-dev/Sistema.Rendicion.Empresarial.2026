import React from 'react';
import {
  BarChart3,
  PieChart,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  Download,
} from 'lucide-react';
import { Rendicion, CompanySettings, CostCenter, ClasificacionGasto } from '../types';
import {
  calculateCuadre,
  exportAllRendicionesToExcel,
  formatCurrency,
} from '../utils/financial';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalyticsViewProps {
  rendiciones: Rendicion[];
  company: CompanySettings;
  costCenters: CostCenter[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  rendiciones,
  company,
  costCenters,
}) => {
  // Aggregate calculations
  const totalAsignado = rendiciones.reduce((acc, r) => acc + r.montoAsignado, 0);
  const totalRendido = rendiciones.reduce(
    (acc, r) => acc + r.items.reduce((s, it) => s + (it.montoTotal || 0), 0),
    0
  );
  const totalRestante = totalAsignado - totalRendido;

  const cuadradasCount = rendiciones.filter((r) => {
    const c = calculateCuadre(r.montoAsignado, r.items, company.toleranciaCuadre);
    return c.esCuadrado;
  }).length;

  const cuadreRate = rendiciones.length > 0 ? Math.round((cuadradasCount / rendiciones.length) * 100) : 0;

  // Breakdown by classification
  const categoryTotals: Record<string, number> = {};
  rendiciones.forEach((r) => {
    r.items.forEach((it) => {
      const cat = it.clasificacionGasto || 'Otros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (it.montoTotal || 0);
    });
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  // Breakdown by document type
  const docTypeCounts: Record<string, number> = {};
  rendiciones.forEach((r) => {
    r.items.forEach((it) => {
      docTypeCounts[it.tipoDocumento] = (docTypeCounts[it.tipoDocumento] || 0) + 1;
    });
  });

  // Export Executive PDF report
  const exportExecutivePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(company.razonSocial, 14, 11);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`RUC: ${company.ruc} | REPORTE GENERAL DE RENDICIÓN Y AUDITORÍA CONTABLE`, 14, 18);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PANEL EJECUTIVO DE RENDICIÓN DE GASTOS', 14, 35);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-PE')}`, 14, 41);

    // KPI Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 45, 182, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Monto Total Desembolsado:', 20, 53);
    doc.text('Total Rendido en Gastos:', 20, 60);
    doc.text('Tasa de Cuadre Conforme (<= S/ 2):', 20, 66);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(formatCurrency(totalAsignado), 90, 53);
    doc.setTextColor(79, 70, 229);
    doc.text(formatCurrency(totalRendido), 90, 60);
    doc.setTextColor(16, 185, 129);
    doc.text(`${cuadreRate}% (${cuadradasCount} de ${rendiciones.length} cuadradas)`, 90, 66);

    // Table of Rendiciones
    const tableData = rendiciones.map((r) => {
      const c = calculateCuadre(r.montoAsignado, r.items, company.toleranciaCuadre);
      return [
        r.codigoRendicion,
        r.colaboradorNombre,
        r.numeroTransferencia,
        r.numeroCheque,
        formatCurrency(r.montoAsignado),
        formatCurrency(c.totalRendido),
        formatCurrency(c.saldoRestante),
        c.esCuadrado ? 'CUADRADO' : 'OBSERVADO',
        r.estado.toUpperCase(),
      ];
    });

    autoTable(doc, {
      startY: 76,
      head: [[
        'Código',
        'Colaborador',
        'N° Transf.',
        'N° Cheque',
        'Asignado',
        'Rendido',
        'Restante',
        'Cuadre',
        'Estado',
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Reporte_Ejecutivo_Rendiciones_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Export Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Panel de Analítica y Auditoría Contable
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de ejecución presupuestal, estado de cuadre (tolerancia &le; S/ 2.00) y reportes automáticos
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportAllRendicionesToExcel(rendiciones, company, costCenters)}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Todo en Excel</span>
          </button>
          <button
            onClick={exportExecutivePDF}
            className="px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar Resumen PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Desembolsado
          </span>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatCurrency(totalAsignado)}
          </p>
          <span className="text-xs text-slate-500">{rendiciones.length} transferencias/cheques</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Rendido y Justificado
          </span>
          <p className="text-xl font-extrabold text-indigo-700 font-mono mt-1">
            {formatCurrency(totalRendido)}
          </p>
          <span className="text-xs text-indigo-600 font-semibold">
            {Math.round((totalRendido / (totalAsignado || 1)) * 100)}% de fondos justificados
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Saldo Restante Neto
          </span>
          <p className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
            {formatCurrency(totalRestante)}
          </p>
          <span className="text-xs text-emerald-600 font-semibold">Remanente a liquidar</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Cumplimiento Regla Cuadre (≤ S/ 2)
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-xl font-extrabold text-slate-900 font-mono">
              {cuadreRate}%
            </p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {cuadradasCount} / {rendiciones.length} cuadradas
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Tolerancia máx S/ 2.00 respetada</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gastos por Clasificación */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <span>Gastos por Clasificación y Tipo de Consumo</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Suma Total</span>
          </div>

          <div className="space-y-2.5">
            {sortedCategories.map(([cat, total]) => {
              const pct = totalRendido > 0 ? Math.round((total / totalRendido) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(total)}</span>
                      <span className="text-slate-400 text-[10px] w-8 text-right font-semibold">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ejecución por Centro de Costos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Ejecución Presupuestal por Centro de Costos</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">vs Límite</span>
          </div>

          <div className="space-y-3">
            {costCenters.map((cc) => {
              const pct = Math.min(100, Math.round((cc.spentAmount / cc.budgetLimit) * 100));
              return (
                <div key={cc.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{cc.code}</span> -{' '}
                      <span className="text-slate-600">{cc.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(cc.spentAmount)}
                      </span>{' '}
                      / <span className="font-mono text-slate-500">{formatCurrency(cc.budgetLimit)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
