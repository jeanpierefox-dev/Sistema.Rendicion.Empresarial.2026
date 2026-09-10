import React, { useState } from 'react';
import {
  PlusCircle,
  FileSpreadsheet,
  FileText,
  Search,
  CreditCard,
  Landmark,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  PenTool,
  Calendar,
  User,
  ArrowUpDown,
} from 'lucide-react';
import { Rendicion, CompanySettings, CostCenter, User as UserType } from '../types';
import { calculateCuadre, exportRendicionToExcel, exportRendicionToPDF, formatCurrency } from '../utils/financial';
import { CuadreWidget } from './CuadreWidget';

interface RendicionesListViewProps {
  rendiciones: Rendicion[];
  company: CompanySettings;
  costCenters: CostCenter[];
  currentUser: UserType | null;
  onSelectRendicion: (rendicion: Rendicion) => void;
  onOpenNewModal: () => void;
}

export const RendicionesListView: React.FC<RendicionesListViewProps> = ({
  rendiciones,
  company,
  costCenters,
  currentUser,
  onSelectRendicion,
  onOpenNewModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'fecha_desc' | 'fecha_asc' | 'monto_desc' | 'codigo'>('fecha_desc');

  const filtered = rendiciones.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.codigoRendicion.toLowerCase().includes(q) ||
      r.titulo.toLowerCase().includes(q) ||
      r.colaboradorNombre.toLowerCase().includes(q) ||
      (r.responsableRendicion && r.responsableRendicion.toLowerCase().includes(q)) ||
      (r.nombreDestinatario && r.nombreDestinatario.toLowerCase().includes(q)) ||
      r.numeroTransferencia.toLowerCase().includes(q) ||
      r.numeroCheque.toLowerCase().includes(q) ||
      r.banco.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'todos' || r.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'fecha_desc') {
      const dateA = new Date(a.fechaRendicion || a.fechaCreacion).getTime();
      const dateB = new Date(b.fechaRendicion || b.fechaCreacion).getTime();
      return dateB - dateA;
    }
    if (sortBy === 'fecha_asc') {
      const dateA = new Date(a.fechaRendicion || a.fechaCreacion).getTime();
      const dateB = new Date(b.fechaRendicion || b.fechaCreacion).getTime();
      return dateA - dateB;
    }
    if (sortBy === 'monto_desc') {
      return b.montoAsignado - a.montoAsignado;
    }
    return a.codigoRendicion.localeCompare(b.codigoRendicion);
  });

  return (
    <div className="space-y-4">
      {/* Top Banner with Action Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Planillas de Rendición de Gastos y Desembolsos
          </h2>
          <p className="text-xs text-slate-500">
            Control contable de cuentas de origen/destino, transferencias, cheques, firmas digitales y cuadre con remanente máx. de 2 soles
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-nueva-rendicion"
            onClick={onOpenNewModal}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Rendición</span>
          </button>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, responsable, destinatario, cheque o transferencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="fecha_desc">Fecha: Más reciente</option>
            <option value="fecha_asc">Fecha: Más antiguo</option>
            <option value="monto_desc">Monto desembolsado</option>
            <option value="codigo">Código planilla</option>
          </select>
        </div>

        {/* Status filter buttons */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'pendiente_aprobacion', label: 'Pendientes' },
            { key: 'aprobada', label: 'Aprobadas' },
            { key: 'liquidada', label: 'Liquidadas' },
            { key: 'observada', label: 'Observadas' },
            { key: 'borrador', label: 'Borradores' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st.key
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card View (optimized for mobile phones) */}
      <div className="block lg:hidden space-y-3">
        {sorted.length === 0 ? (
          <div className="py-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No se encontraron rendiciones que coincidan con los filtros.
          </div>
        ) : (
          sorted.map((rend) => {
            const cuadre = calculateCuadre(
              rend.montoAsignado,
              rend.items,
              company.toleranciaCuadre
            );
            const cc = costCenters.find((c) => c.id === rend.centroCostosId);

            return (
              <div
                key={rend.id}
                onClick={() => onSelectRendicion(rend)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 active:bg-slate-50 transition-colors cursor-pointer"
              >
                {/* Header: Code & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {rend.codigoRendicion}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      rend.estado === 'liquidada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rend.estado === 'aprobada'
                        ? 'bg-blue-100 text-blue-800'
                        : rend.estado === 'pendiente_aprobacion'
                        ? 'bg-amber-100 text-amber-800'
                        : rend.estado === 'observada'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rend.estado.replace('_', ' ')}
                  </span>
                </div>

                {/* Title & Responsable */}
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{rend.titulo}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Responsable: <strong className="text-slate-800">{rend.responsableRendicion || rend.colaboradorNombre}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Destinatario: {rend.nombreDestinatario || rend.colaboradorNombre} • {rend.departamento}
                  </p>
                </div>

                {/* Bank / Transfer & Cheque */}
                <div className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      {rend.tipoDesembolso === 'Cheque' ? 'Cheque N°' : 'Transferencia N°'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {rend.tipoDesembolso === 'Cheque' ? (rend.numeroCheque || 'S/N') : (rend.numeroTransferencia || 'S/N')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Desembolsado</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(rend.montoAsignado)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Rendido</span>
                      <span className="font-mono font-extrabold text-indigo-700">{formatCurrency(cuadre.totalRendido)}</span>
                    </div>
                  </div>
                </div>

                {/* Cuadre widget */}
                <CuadreWidget cuadre={cuadre} tolerancia={company.toleranciaCuadre} compact />

                {/* Digital signatures status & Action buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className={`flex items-center space-x-0.5 ${rend.firmaResponsable ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <PenTool className="w-3 h-3" />
                      <span>Firma Rendidor: {rend.firmaResponsable ? '✓' : '—'}</span>
                    </span>
                    <span className={`flex items-center space-x-0.5 ${rend.firmaAprobador ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <ShieldCheck className="w-3 h-3" />
                      <span>Firma Gerente: {rend.firmaAprobador ? '✓' : '—'}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => exportRendicionToPDF(rend, company, cc)}
                      className="p-1 text-slate-500 hover:text-rose-600 rounded"
                      title="Descargar PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => exportRendicionToExcel(rend, company, cc)}
                      className="p-1 text-slate-500 hover:text-emerald-600 rounded"
                      title="Descargar Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop / PC Table View */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3">Título / Destinatario</th>
                <th className="py-3 px-3">Responsable Rendición</th>
                <th className="py-3 px-3">Desembolso (TRF / Cheque)</th>
                <th className="py-3 px-3 text-right">Asignado</th>
                <th className="py-3 px-3 text-right">Rendido</th>
                <th className="py-3 px-3 text-right">Restante</th>
                <th className="py-3 px-3 text-center">Cuadre (≤ S/ 2)</th>
                <th className="py-3 px-3 text-center">Firmas</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                    No se encontraron rendiciones que coincidan con la búsqueda o filtro.
                  </td>
                </tr>
              ) : (
                sorted.map((rend) => {
                  const cuadre = calculateCuadre(
                    rend.montoAsignado,
                    rend.items,
                    company.toleranciaCuadre
                  );
                  const cc = costCenters.find((c) => c.id === rend.centroCostosId);

                  return (
                    <tr
                      key={rend.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectRendicion(rend)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {rend.codigoRendicion}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-bold text-slate-900 line-clamp-1">{rend.titulo}</p>
                        <span className="text-[10px] text-slate-500">
                          Dest: <strong className="text-slate-700">{rend.nombreDestinatario || rend.colaboradorNombre}</strong> | {rend.fechaRendicion || rend.fechaCreacion}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">
                          {rend.responsableRendicion || rend.colaboradorNombre}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {cc ? `${cc.code} ${cc.department}` : rend.departamento}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {rend.tipoDesembolso === 'Cheque' ? (
                          <div className="font-mono text-[11px]">
                            <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase inline-block">
                              Cheque
                            </span>
                            <div className="font-bold text-slate-900 mt-0.5">{rend.numeroCheque || 'S/N'}</div>
                          </div>
                        ) : (
                          <div className="font-mono text-[11px]">
                            <span className="text-[10px] text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold uppercase inline-block">
                              Transferencia
                            </span>
                            <div className="font-bold text-slate-900 mt-0.5">{rend.numeroTransferencia || 'S/N'}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(rend.montoAsignado)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-indigo-700 whitespace-nowrap">
                        {formatCurrency(cuadre.totalRendido)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            cuadre.esCuadrado
                              ? 'text-emerald-700'
                              : cuadre.estadoTipo === 'saldo_devolver'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }
                        >
                          {formatCurrency(cuadre.saldoRestante)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <CuadreWidget cuadre={cuadre} tolerancia={company.toleranciaCuadre} compact />
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center text-[10px]">
                          <span className={rend.firmaResponsable ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                            Rend: {rend.firmaResponsable ? '✓' : 'Pend'}
                          </span>
                          <span className={rend.firmaAprobador ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                            Ger: {rend.firmaAprobador ? '✓' : 'Pend'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            rend.estado === 'liquidada'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : rend.estado === 'aprobada'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : rend.estado === 'pendiente_aprobacion'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : rend.estado === 'observada'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {rend.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td
                        className="py-3 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onSelectRendicion(rend)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded cursor-pointer"
                            title="Ver detalle de gastos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportRendicionToPDF(rend, company, cc)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded cursor-pointer"
                            title="Descargar PDF Oficial"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportRendicionToExcel(rend, company, cc)}
                            className="p-1 text-slate-500 hover:text-emerald-600 rounded cursor-pointer"
                            title="Descargar Excel"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
