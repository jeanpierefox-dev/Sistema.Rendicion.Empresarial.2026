import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Download,
  Wallet,
  PiggyBank,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Save,
  Search,
  Filter,
  ArrowUpRight,
  Receipt,
  Users,
} from 'lucide-react';
import { CostCenter, Rendicion, ExpenseItem } from '../types';
import { formatCurrency } from '../utils/financial';
import * as XLSX from 'xlsx';

interface CostCenterLimitsViewProps {
  costCenters: CostCenter[];
  rendiciones: Rendicion[];
  onAddCostCenter: (newCC: Omit<CostCenter, 'id' | 'spentAmount'>) => void;
  onEditCostCenter?: (id: string, updated: Partial<CostCenter>) => void;
  onDeleteCostCenter?: (id: string) => void;
}

const MONTHS = [
  { index: 1, name: 'Enero', short: 'Ene' },
  { index: 2, name: 'Febrero', short: 'Feb' },
  { index: 3, name: 'Marzo', short: 'Mar' },
  { index: 4, name: 'Abril', short: 'Abr' },
  { index: 5, name: 'Mayo', short: 'May' },
  { index: 6, name: 'Junio', short: 'Jun' },
  { index: 7, name: 'Julio', short: 'Jul' },
  { index: 8, name: 'Agosto', short: 'Ago' },
  { index: 9, name: 'Setiembre', short: 'Set' },
  { index: 10, name: 'Octubre', short: 'Oct' },
  { index: 11, name: 'Noviembre', short: 'Nov' },
  { index: 12, name: 'Diciembre', short: 'Dic' },
];

export const CostCenterLimitsView: React.FC<CostCenterLimitsViewProps> = ({
  costCenters,
  rendiciones,
  onAddCostCenter,
  onEditCostCenter,
  onDeleteCostCenter,
}) => {
  // Available Years detected from rendiciones
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);

    rendiciones.forEach((r) => {
      const dateStr = r.fechaRendicion || r.fechaDesembolso || r.fechaCreacion || '';
      if (dateStr) {
        const y = parseInt(dateStr.split('-')[0], 10);
        if (!isNaN(y) && y > 2000 && y < 2100) {
          yearsSet.add(y);
        }
      }
      (r.items || []).forEach((item) => {
        if (item.fecha) {
          const y = parseInt(item.fecha.split('-')[0], 10);
          if (!isNaN(y) && y > 2000 && y < 2100) {
            yearsSet.add(y);
          }
        }
      });
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [rendiciones]);

  // Selected Year & Month (0 = Todo el año, 1..12 = Enero..Diciembre)
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return availableYears[0] || new Date().getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Todo el Año

  // Sub-view: 'resumen_cc' | 'matriz_mensual' | 'saldos_restantes'
  const [activeSubTab, setActiveSubTab] = useState<'resumen_cc' | 'matriz_mensual' | 'saldos_restantes'>('resumen_cc');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Cost Center modal state
  const [isAddingCC, setIsAddingCC] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDepartment, setNewDepartment] = useState('Operaciones');

  // Edit Cost Center state
  const [editingCCId, setEditingCCId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

  // Expanded CC for monthly breakdown in summary view
  const [expandedCCId, setExpandedCCId] = useState<string | null>(null);

  // --- Financial & Monthly Computations ---
  // Helper to get date components
  const parseExpenseDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!isNaN(year) && !isNaN(month)) {
        return { year, month };
      }
    }
    return null;
  };

  // Detailed parsed Rendiciones with real amounts and dates
  const parsedRendiciones = useMemo(() => {
    return rendiciones.map((r) => {
      const dateStr = r.fechaRendicion || r.fechaDesembolso || r.fechaCreacion || '';
      const dateInfo = parseExpenseDate(dateStr) || { year: selectedYear, month: 1 };
      const totalRendido = Number(
        (r.items || []).reduce((acc, it) => acc + (Number(it.montoTotal) || 0), 0).toFixed(2)
      );
      const montoAsignado = Number((r.montoAsignado || 0).toFixed(2));
      // Saldo restante: unspent remaining balance
      const saldoRestante = Math.max(0, Number((montoAsignado - totalRendido).toFixed(2)));

      return {
        ...r,
        year: dateInfo.year,
        month: dateInfo.month,
        totalRendido,
        montoAsignado,
        saldoRestante,
      };
    });
  }, [rendiciones, selectedYear]);

  // Cost Center Monthly Statistics for selectedYear
  const costCentersStats = useMemo(() => {
    return costCenters.map((cc) => {
      // 12 months array for this CC
      const monthlySpent = Array(13).fill(0); // index 1..12
      const monthlySaldoRestante = Array(13).fill(0);
      const monthlyRendicionesCount = Array(13).fill(0);

      // Iterate through rendiciones
      parsedRendiciones.forEach((r) => {
        // If rendicion matches CC
        const rendMatchesCC = r.centroCostosId === cc.id;

        // Sum items for this CC
        (r.items || []).forEach((item) => {
          const itemCCId = item.centroCostosId || r.centroCostosId;
          if (itemCCId === cc.id) {
            const itemDate = parseExpenseDate(item.fecha) || { year: r.year, month: r.month };
            if (itemDate.year === selectedYear) {
              const m = itemDate.month >= 1 && itemDate.month <= 12 ? itemDate.month : 1;
              monthlySpent[m] += Number(item.montoTotal) || 0;
            }
          }
        });

        // Sum saldos restantes for this CC (attributed to the rendicion's CC)
        if (rendMatchesCC && r.year === selectedYear) {
          const m = r.month >= 1 && r.month <= 12 ? r.month : 1;
          monthlySaldoRestante[m] += r.saldoRestante;
          monthlyRendicionesCount[m] += 1;
        }
      });

      // Total Year Spent
      const totalYearSpent = Number(
        monthlySpent.slice(1).reduce((acc, val) => acc + val, 0).toFixed(2)
      );
      // Total Year Saldo Restante
      const totalYearSaldoRestante = Number(
        monthlySaldoRestante.slice(1).reduce((acc, val) => acc + val, 0).toFixed(2)
      );
      const totalYearRendiciones = monthlyRendicionesCount.slice(1).reduce((acc, val) => acc + val, 0);

      // Month specific values
      const monthSpent = selectedMonth === 0 ? totalYearSpent : Number(monthlySpent[selectedMonth].toFixed(2));
      const monthSaldoRestante =
        selectedMonth === 0 ? totalYearSaldoRestante : Number(monthlySaldoRestante[selectedMonth].toFixed(2));
      const monthRendiciones =
        selectedMonth === 0 ? totalYearRendiciones : monthlyRendicionesCount[selectedMonth];

      return {
        ...cc,
        monthlySpent,
        monthlySaldoRestante,
        monthlyRendicionesCount,
        totalYearSpent,
        totalYearSaldoRestante,
        totalYearRendiciones,
        monthSpent,
        monthSaldoRestante,
        monthRendiciones,
      };
    });
  }, [costCenters, parsedRendiciones, selectedYear, selectedMonth]);

  // Global Corporate Metrics for selectedYear and selectedMonth
  const globalMetrics = useMemo(() => {
    const totalSpentYear = costCentersStats.reduce((acc, cc) => acc + cc.totalYearSpent, 0);
    const totalSpentMonth = costCentersStats.reduce((acc, cc) => acc + cc.monthSpent, 0);

    const totalSaldoRestanteYear = costCentersStats.reduce((acc, cc) => acc + cc.totalYearSaldoRestante, 0);
    const totalSaldoRestanteMonth = costCentersStats.reduce((acc, cc) => acc + cc.monthSaldoRestante, 0);

    // Sum of assigned funds for the year
    const rendsInYear = parsedRendiciones.filter((r) => r.year === selectedYear);
    const totalAsignadoYear = rendsInYear.reduce((acc, r) => acc + r.montoAsignado, 0);

    const rendsInMonth =
      selectedMonth === 0
        ? rendsInYear
        : rendsInYear.filter((r) => r.month === selectedMonth);
    const totalAsignadoMonth = rendsInMonth.reduce((acc, r) => acc + r.montoAsignado, 0);

    // Count of rendiciones with a positive saldo restante
    const rendsWithSaldoRestanteMonth = rendsInMonth.filter((r) => r.saldoRestante > 0).length;
    const rendsWithSaldoRestanteYear = rendsInYear.filter((r) => r.saldoRestante > 0).length;

    return {
      totalSpentYear: Number(totalSpentYear.toFixed(2)),
      totalSpentMonth: Number(totalSpentMonth.toFixed(2)),
      totalSaldoRestanteYear: Number(totalSaldoRestanteYear.toFixed(2)),
      totalSaldoRestanteMonth: Number(totalSaldoRestanteMonth.toFixed(2)),
      totalAsignadoYear: Number(totalAsignadoYear.toFixed(2)),
      totalAsignadoMonth: Number(totalAsignadoMonth.toFixed(2)),
      rendsWithSaldoRestanteMonth,
      rendsWithSaldoRestanteYear,
      totalRendicionesPeriodo: rendsInMonth.length,
    };
  }, [costCentersStats, parsedRendiciones, selectedYear, selectedMonth]);

  // Filtered Cost Centers based on search input
  const filteredCostCenters = useMemo(() => {
    if (!searchTerm.trim()) return costCentersStats;
    const term = searchTerm.toLowerCase();
    return costCentersStats.filter(
      (cc) =>
        cc.name.toLowerCase().includes(term) ||
        cc.code.toLowerCase().includes(term) ||
        cc.department.toLowerCase().includes(term)
    );
  }, [costCentersStats, searchTerm]);

  // Rendiciones with Saldo Restante for the dedicated Tab
  const rendicionesWithSaldo = useMemo(() => {
    return parsedRendiciones
      .filter((r) => {
        if (r.year !== selectedYear) return false;
        if (selectedMonth !== 0 && r.month !== selectedMonth) return false;
        return r.saldoRestante > 0;
      })
      .sort((a, b) => b.saldoRestante - a.saldoRestante);
  }, [parsedRendiciones, selectedYear, selectedMonth]);

  // Handlers for Cost Center Create & Edit
  const handleCreateCC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;
    onAddCostCenter({
      code: newCode.trim(),
      name: newName.trim(),
      department: newDepartment.trim(),
      budgetLimit: 0, // No limit required, just sum
    });
    setNewCode('');
    setNewName('');
    setNewDepartment('Operaciones');
    setIsAddingCC(false);
  };

  const handleStartEdit = (cc: CostCenter) => {
    setEditingCCId(cc.id);
    setEditCode(cc.code);
    setEditName(cc.name);
    setEditDepartment(cc.department);
  };

  const handleSaveEdit = (id: string) => {
    if (onEditCostCenter && editCode.trim() && editName.trim()) {
      onEditCostCenter(id, {
        code: editCode.trim(),
        name: editName.trim(),
        department: editDepartment.trim(),
      });
    }
    setEditingCCId(null);
  };

  // Export Monthly Consolidation to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Resumen por Área
    const monthLabel = selectedMonth === 0 ? 'Todo el Año' : MONTHS[selectedMonth - 1]?.name;
    const summaryData = costCentersStats.map((cc) => ({
      'Código': cc.code,
      'Centro de Costos': cc.name,
      'Departamento': cc.department,
      [`Gasto ${monthLabel} (${selectedYear})`]: cc.monthSpent,
      [`Gasto Anual ${selectedYear}`]: cc.totalYearSpent,
      [`Saldo Restante ${monthLabel}`]: cc.monthSaldoRestante,
      [`Saldo Restante Anual`]: cc.totalYearSaldoRestante,
      'N° Rendiciones': cc.monthRendiciones,
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_CC');

    // Sheet 2: Matriz Mensual Ene - Dic
    const matrixData = costCentersStats.map((cc) => {
      const row: Record<string, any> = {
        'Código': cc.code,
        'Centro de Costos': cc.name,
        'Departamento': cc.department,
      };
      MONTHS.forEach((m) => {
        row[m.name] = cc.monthlySpent[m.index];
      });
      row[`Total Gasto ${selectedYear}`] = cc.totalYearSpent;
      row[`Total Saldo Restante ${selectedYear}`] = cc.totalYearSaldoRestante;
      return row;
    });
    const wsMatrix = XLSX.utils.json_to_sheet(matrixData);
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriz_Mes_a_Mes');

    // Sheet 3: Detalle de Saldos Restantes
    const saldosData = rendicionesWithSaldo.map((r) => {
      const cc = costCenters.find((c) => c.id === r.centroCostosId);
      return {
        'Código Rendición': r.codigoRendicion,
        'Fecha': r.fechaRendicion || r.fechaDesembolso,
        'Mes': MONTHS[r.month - 1]?.name || '',
        'Colaborador / Responsable': r.colaboradorNombre,
        'Centro de Costos': cc ? `${cc.code} - ${cc.name}` : r.departamento,
        'Monto Asignado (S/.)': r.montoAsignado,
        'Total Rendido / Gastado (S/.)': r.totalRendido,
        'Saldo Restante / Remanente (S/.)': r.saldoRestante,
        'Estado': r.estado,
      };
    });
    const wsSaldos = XLSX.utils.json_to_sheet(saldosData);
    XLSX.utils.book_append_sheet(wb, wsSaldos, 'Saldos_Restantes');

    XLSX.writeFile(wb, `Reporte_Gastos_CC_Meses_${selectedYear}.xlsx`);
  };

  const activeMonthName = selectedMonth === 0 ? 'Todo el Año' : MONTHS[selectedMonth - 1]?.name;

  return (
    <div className="space-y-5">
      {/* Top Header & Context Description */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Control de Gastos por Centro de Costos & Saldos Restantes</span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Sin Límites • Suma Real
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidación y acumulación mensual de gastos por área operativa, con balance independiente de saldos restantes
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="btn-export-cc-excel"
              onClick={handleExportExcel}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Descargar reporte mensual y saldos restantes en Excel"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            <button
              id="btn-add-cc"
              onClick={() => setIsAddingCC(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Centro de Costos</span>
            </button>
          </div>
        </div>

        {/* Year and Month Selectors */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Year selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Año Fiscal:</span>
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedYear === yr
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Month selector tabs */}
          <div className="flex items-center overflow-x-auto pb-1 max-w-full space-x-1 text-xs">
            <button
              onClick={() => setSelectedMonth(0)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs shrink-0 transition-all cursor-pointer ${
                selectedMonth === 0
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Todo el Año
            </button>
            {MONTHS.map((m) => {
              const hasExpensesInMonth = costCentersStats.some((cc) => cc.monthlySpent[m.index] > 0);
              return (
                <button
                  key={m.index}
                  onClick={() => setSelectedMonth(m.index)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer relative ${
                    selectedMonth === m.index
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : hasExpensesInMonth
                      ? 'bg-slate-100 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <span>{m.short}</span>
                  {hasExpensesInMonth && selectedMonth !== m.index && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards: Gastos y Saldos Restantes en el Mes y en el Año */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Gasto del Periodo Seleccionado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gasto {selectedMonth === 0 ? `Total del Año ${selectedYear}` : `Mes de ${activeMonthName}`}
            </span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-2 tracking-tight">
            {formatCurrency(globalMetrics.totalSpentMonth)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{globalMetrics.totalRendicionesPeriodo} rendición(es)</span>
            <span className="font-semibold text-indigo-600">Suma real sin límite</span>
          </div>
        </div>

        {/* Card 2: Gasto Total Anual Acumulado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gasto Acumulado Año {selectedYear}
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-900 font-mono mt-2 tracking-tight">
            {formatCurrency(globalMetrics.totalSpentYear)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{costCenters.length} Centros de Costos</span>
            <span className="font-medium text-slate-600">100% de operaciones</span>
          </div>
        </div>

        {/* Card 3: Saldo Restante del Mes Seleccionado */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Saldo Restante • {selectedMonth === 0 ? 'Mes Actual' : activeMonthName}
            </span>
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-2 tracking-tight">
            {formatCurrency(globalMetrics.totalSaldoRestanteMonth)}
          </p>
          <div className="flex items-center justify-between text-xs text-emerald-700 mt-2 pt-2 border-t border-emerald-200/60 font-medium">
            <span>Remanente no gastado</span>
            <span>{globalMetrics.rendsWithSaldoRestanteMonth} rendición(es)</span>
          </div>
        </div>

        {/* Card 4: Saldo Restante Total del Año */}
        <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
              Saldo Restante Total Año {selectedYear}
            </span>
            <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-indigo-800 font-mono mt-2 tracking-tight">
            {formatCurrency(globalMetrics.totalSaldoRestanteYear)}
          </p>
          <div className="flex items-center justify-between text-xs text-indigo-700 mt-2 pt-2 border-t border-indigo-200/60 font-medium">
            <span>Total restante acumulado</span>
            <span>{globalMetrics.rendsWithSaldoRestanteYear} en todo el año</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Navigation sub-tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('resumen_cc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'resumen_cc'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sumatoria por Centro de Costos
            </button>
            <button
              onClick={() => setActiveSubTab('matriz_mensual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'matriz_mensual'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriz Mes a Mes (Ene - Dic)
            </button>
            <button
              onClick={() => setActiveSubTab('saldos_restantes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'saldos_restantes'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Saldos Restantes ({rendicionesWithSaldo.length})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar área o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* TAB 1: Resumen por Centro de Costos */}
        {activeSubTab === 'resumen_cc' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Centro de Costos / Área</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4 text-center">N° Rendiciones</th>
                  <th className="py-3 px-4 text-right bg-slate-800/80">
                    Gasto {selectedMonth === 0 ? 'Periodo' : activeMonthName} (S/.)
                  </th>
                  <th className="py-3 px-4 text-right">Gasto Anual {selectedYear} (S/.)</th>
                  <th className="py-3 px-4 text-right text-emerald-300 bg-slate-800/80">
                    Saldo Restante Mes (S/.)
                  </th>
                  <th className="py-3 px-4 text-right text-emerald-300">
                    Saldo Restante Año (S/.)
                  </th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCostCenters.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No se encontraron centros de costos con los criterios de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredCostCenters.map((cc) => {
                    const isEditing = editingCCId === cc.id;
                    const isExpanded = expandedCCId === cc.id;

                    return (
                      <React.Fragment key={cc.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editCode}
                                onChange={(e) => setEditCode(e.target.value)}
                                className="px-2 py-1 text-xs border border-indigo-400 rounded w-24 font-mono"
                              />
                            ) : (
                              cc.code
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-2 py-1 text-xs border border-indigo-400 rounded w-full font-semibold"
                              />
                            ) : (
                              <div>
                                <span className="font-bold text-slate-900">{cc.name}</span>
                                <button
                                  onClick={() => setExpandedCCId(isExpanded ? null : cc.id)}
                                  className="ml-2 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                                >
                                  {isExpanded ? 'Ocultar Meses' : 'Ver 12 Meses'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editDepartment}
                                onChange={(e) => setEditDepartment(e.target.value)}
                                className="px-2 py-1 text-xs border border-indigo-400 rounded w-full"
                              />
                            ) : (
                              cc.department
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-medium text-slate-600">
                            {cc.monthRendiciones}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-950 bg-slate-50/50">
                            {formatCurrency(cc.monthSpent)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(cc.totalYearSpent)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 bg-slate-50/50">
                            {formatCurrency(cc.monthSaldoRestante)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            {formatCurrency(cc.totalYearSaldoRestante)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => handleSaveEdit(cc.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Guardar Cambios"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingCCId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => handleStartEdit(cc)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                  title="Modificar Denominación"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteCostCenter && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`¿Eliminar el centro de costos ${cc.code} - ${cc.name}?`)) {
                                        onDeleteCostCenter(cc.id);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                    title="Eliminar Centro de Costos"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Expanded 12 Months Breakdown Row */}
                        {isExpanded && (
                          <tr className="bg-indigo-50/30 border-y border-indigo-100">
                            <td colSpan={9} className="p-4">
                              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-indigo-900">
                                    Desglose Mensual {selectedYear} • {cc.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    Total Anual Gastado: {formatCurrency(cc.totalYearSpent)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 text-center">
                                  {MONTHS.map((m) => {
                                    const spentInM = cc.monthlySpent[m.index];
                                    const remInM = cc.monthlySaldoRestante[m.index];
                                    return (
                                      <div
                                        key={m.index}
                                        className={`p-2 rounded-lg border text-xs ${
                                          spentInM > 0
                                            ? 'bg-indigo-50/50 border-indigo-200'
                                            : 'bg-slate-50 border-slate-200 text-slate-400'
                                        }`}
                                      >
                                        <p className="font-bold text-[11px] text-slate-700">{m.name}</p>
                                        <p className="font-mono font-bold text-slate-900 mt-0.5">
                                          {formatCurrency(spentInM)}
                                        </p>
                                        {remInM > 0 && (
                                          <p className="text-[10px] text-emerald-700 font-mono font-semibold mt-0.5">
                                            Rest: {formatCurrency(remInM)}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
              {/* Table Footer with Totals */}
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-[11px]">
                    Total General Empresa ({selectedYear})
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold">
                    {globalMetrics.totalRendicionesPeriodo}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-indigo-950 bg-slate-200/50">
                    {formatCurrency(globalMetrics.totalSpentMonth)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-900">
                    {formatCurrency(globalMetrics.totalSpentYear)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800 bg-slate-200/50">
                    {formatCurrency(globalMetrics.totalSaldoRestanteMonth)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800">
                    {formatCurrency(globalMetrics.totalSaldoRestanteYear)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TAB 2: Matriz Mes a Mes (Ene - Dic) */}
        {activeSubTab === 'matriz_mensual' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 sticky left-0 bg-slate-900 z-10">Centro de Costos</th>
                  {MONTHS.map((m) => (
                    <th key={m.index} className="py-3 px-2 text-right">
                      {m.short}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right bg-slate-800">Total Anual (S/.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCostCenters.map((cc) => (
                  <tr key={cc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 sticky left-0 bg-white shadow-xs">
                      <span className="font-mono text-indigo-700 font-bold mr-1">{cc.code}</span>
                      <span className="truncate max-w-[150px] inline-block align-bottom">{cc.name}</span>
                    </td>
                    {MONTHS.map((m) => {
                      const amount = cc.monthlySpent[m.index];
                      return (
                        <td
                          key={m.index}
                          className={`py-2.5 px-2 text-right font-mono text-[11px] ${
                            amount > 0 ? 'font-bold text-slate-900 bg-indigo-50/20' : 'text-slate-300'
                          }`}
                        >
                          {amount > 0 ? formatCurrency(amount) : '-'}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-indigo-950 bg-slate-50">
                      {formatCurrency(cc.totalYearSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td className="py-3 px-3 uppercase text-[11px] sticky left-0 bg-slate-100">Total Mensual</td>
                  {MONTHS.map((m) => {
                    const monthTotal = costCentersStats.reduce((acc, cc) => acc + cc.monthlySpent[m.index], 0);
                    return (
                      <td key={m.index} className="py-3 px-2 text-right font-mono font-extrabold text-[11px]">
                        {monthTotal > 0 ? formatCurrency(monthTotal) : '-'}
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-900 bg-slate-200/60">
                    {formatCurrency(globalMetrics.totalSpentYear)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TAB 3: Control de Saldos Restantes (Mes y Año) */}
        {activeSubTab === 'saldos_restantes' && (
          <div>
            <div className="p-4 bg-emerald-50/40 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <PiggyBank className="w-4 h-4 text-emerald-600" />
                  <span>Saldos Restantes No Gastados (Remanentes de Rendiciones)</span>
                </h4>
                <p className="text-xs text-emerald-800">
                  Diferencia a favor de la empresa entre el fondo desembolsado y los comprobantes presentados
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="text-slate-600">
                  Total Restante Periodo:{' '}
                  <strong className="text-emerald-700">{formatCurrency(globalMetrics.totalSaldoRestanteMonth)}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">
                  Total Restante Año {selectedYear}:{' '}
                  <strong className="text-indigo-800">{formatCurrency(globalMetrics.totalSaldoRestanteYear)}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Código Rendición</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Colaborador / Responsable</th>
                    <th className="py-3 px-4">Centro de Costos</th>
                    <th className="py-3 px-4 text-right">Monto Asignado (S/.)</th>
                    <th className="py-3 px-4 text-right">Total Rendido (S/.)</th>
                    <th className="py-3 px-4 text-right text-emerald-300 font-extrabold bg-slate-800">
                      Saldo Restante (S/.)
                    </th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rendicionesWithSaldo.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold text-slate-600">No hay saldos restantes en el periodo seleccionado</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Todas las rendiciones cuadraron exactamente o no dejaron fondos pendientes de devolución.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    rendicionesWithSaldo.map((r) => {
                      const cc = costCenters.find((c) => c.id === r.centroCostosId);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {r.codigoRendicion}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono">
                            {r.fechaRendicion || r.fechaDesembolso}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {r.colaboradorNombre}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {cc ? `${cc.code} - ${cc.name}` : r.departamento}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                            {formatCurrency(r.montoAsignado)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                            {formatCurrency(r.totalRendido)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/50">
                            {formatCurrency(r.saldoRestante)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                r.estado === 'aprobada' || r.estado === 'liquidada'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {rendicionesWithSaldo.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 uppercase text-[11px]">
                        Total Saldos Restantes ({activeMonthName} {selectedYear})
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {formatCurrency(
                          rendicionesWithSaldo.reduce((acc, r) => acc + r.montoAsignado, 0)
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {formatCurrency(
                          rendicionesWithSaldo.reduce((acc, r) => acc + r.totalRendido, 0)
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800 bg-emerald-100/50">
                        {formatCurrency(
                          rendicionesWithSaldo.reduce((acc, r) => acc + r.saldoRestante, 0)
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Cost Center Modal */}
      {isAddingCC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold">Nuevo Centro de Costos</h3>
              </div>
              <button
                onClick={() => setIsAddingCC(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCC} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código (ej. CC-606) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="CC-606"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Denominación / Nombre del Centro de Costos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Mantenimiento y Maquinaria Pesada"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Departamento / Área *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Operaciones Mina"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 leading-relaxed">
                Este centro de costos acumulará y sumará todos los gastos reales de sus rendiciones sin restricciones de límites presupuestales.
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCC(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  Registrar Centro de Costos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
