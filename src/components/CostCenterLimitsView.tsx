import React, { useState } from 'react';
import {
  PieChart,
  DollarSign,
  Plus,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Building,
  Save,
  X,
} from 'lucide-react';
import { CostCenter } from '../types';
import { formatCurrency } from '../utils/financial';

interface CostCenterLimitsViewProps {
  costCenters: CostCenter[];
  onUpdateLimit: (id: string, newLimit: number) => void;
  onAddCostCenter: (newCC: Omit<CostCenter, 'id' | 'spentAmount'>) => void;
}

export const CostCenterLimitsView: React.FC<CostCenterLimitsViewProps> = ({
  costCenters,
  onUpdateLimit,
  onAddCostCenter,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<number>(0);

  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDepartment, setNewDepartment] = useState('Operaciones');
  const [newBudget, setNewBudget] = useState<number>(10000);

  const totalBudget = costCenters.reduce((acc, cc) => acc + cc.budgetLimit, 0);
  const totalSpent = costCenters.reduce((acc, cc) => acc + cc.spentAmount, 0);
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const handleStartEdit = (cc: CostCenter) => {
    setEditingId(cc.id);
    setEditLimitValue(cc.budgetLimit);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateLimit(id, editLimitValue);
    setEditingId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName || newBudget <= 0) return;
    onAddCostCenter({
      code: newCode.trim(),
      name: newName.trim(),
      department: newDepartment.trim(),
      budgetLimit: Number(newBudget),
    });
    setIsAdding(false);
    setNewCode('');
    setNewName('');
    setNewBudget(10000);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Presupuesto Límite Global Autorizado
          </span>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatCurrency(totalBudget)}
          </p>
          <span className="text-xs text-slate-500">{costCenters.length} centros de costos activos</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Rendido y Comprometido
          </span>
          <p className="text-xl font-extrabold text-indigo-700 font-mono mt-1">
            {formatCurrency(totalSpent)}
          </p>
          <span className="text-xs text-indigo-600 font-semibold">{overallPercentage}% del presupuesto asignado</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Saldo Presupuestal Disponible
          </span>
          <p className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
            {formatCurrency(totalBudget - totalSpent)}
          </p>
          <span className="text-xs text-emerald-600 font-semibold">Fondos disponibles para rendir</span>
        </div>
      </div>

      {/* Main Table & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Límites de Gasto por Departamento y Centro de Costos
            </h3>
            <p className="text-xs text-slate-500">
              Control presupuestal automático para impedir sobregiros operacionales
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Centro de Costos</span>
          </button>
        </div>

        {/* Add New Cost Center Form */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-4 bg-indigo-50/50 border-b border-indigo-100 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Código (ej. CC-606)</label>
              <input
                type="text"
                required
                placeholder="CC-606"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Centro de Costos</label>
              <input
                type="text"
                required
                placeholder="ej. Marketing y Publicidad Digital"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Límite de Gasto (S/.)</label>
              <input
                type="number"
                required
                value={newBudget}
                onChange={(e) => setNewBudget(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Centro de Costos / Denominación</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4 text-right">Límite de Gasto (S/.)</th>
                <th className="py-3 px-4 text-right">Ejecutado (S/.)</th>
                <th className="py-3 px-4 text-right">Disponible (S/.)</th>
                <th className="py-3 px-4 w-44">% Utilizado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {costCenters.map((cc) => {
                const percent = Math.min(100, Math.round((cc.spentAmount / cc.budgetLimit) * 100));
                const isOver = percent >= 90;
                const isWarning = percent >= 75 && percent < 90;

                return (
                  <tr key={cc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {cc.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {cc.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {cc.department}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {editingId === cc.id ? (
                        <div className="flex items-center justify-end space-x-1">
                          <input
                            type="number"
                            value={editLimitValue}
                            onChange={(e) => setEditLimitValue(parseFloat(e.target.value) || 0)}
                            className="w-24 px-1.5 py-0.5 text-xs border border-indigo-500 rounded font-mono font-bold text-right"
                          />
                          <button
                            onClick={() => handleSaveEdit(cc.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Guardar"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span>{formatCurrency(cc.budgetLimit)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-950">
                      {formatCurrency(cc.spentAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(cc.budgetLimit - cc.spentAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold">
                          <span
                            className={
                              isOver
                                ? 'text-rose-700'
                                : isWarning
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }
                          >
                            {percent}%
                          </span>
                          {isOver && (
                            <span className="text-rose-600 text-[10px] font-bold flex items-center space-x-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Alerta</span>
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isOver
                                ? 'bg-rose-600'
                                : isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleStartEdit(cc)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="Modificar Límite Presupuestal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
