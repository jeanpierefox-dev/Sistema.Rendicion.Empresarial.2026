import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  Ban,
  Building,
  CreditCard,
  Landmark,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Eye,
} from 'lucide-react';
import { Rendicion, CompanySettings, CostCenter, User } from '../types';
import { calculateCuadre, formatCurrency } from '../utils/financial';
import { CuadreWidget } from './CuadreWidget';

interface HierarchicalApprovalViewProps {
  rendiciones: Rendicion[];
  company: CompanySettings;
  costCenters: CostCenter[];
  currentUser: User | null;
  onSelectRendicion: (rendicion: Rendicion) => void;
  onApprove: (id: string, comment: string) => void;
  onObserve: (id: string, comment: string) => void;
  isMobileMode: boolean;
  setIsMobileMode: (val: boolean) => void;
}

export const HierarchicalApprovalView: React.FC<HierarchicalApprovalViewProps> = ({
  rendiciones,
  company,
  costCenters,
  currentUser,
  onSelectRendicion,
  onApprove,
  onObserve,
  isMobileMode,
  setIsMobileMode,
}) => {
  const [filter, setFilter] = useState<'pendientes' | 'todas'>('pendientes');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [actionType, setActionType] = useState<'aprobar' | 'observar'>('aprobar');

  const pendingList = rendiciones.filter((r) => r.estado === 'pendiente_aprobacion');
  const displayList = filter === 'pendientes' ? pendingList : rendiciones;

  const handleAction = (id: string, type: 'aprobar' | 'observar') => {
    setActiveCommentId(id);
    setActionType(type);
    setCommentText(
      type === 'aprobar'
        ? 'Aprobado desde dispositivo móvil corporativo. Comprobantes y cuadre verificados.'
        : 'Observado: Favor verificar los comprobantes adjuntos.'
    );
  };

  const confirmAction = () => {
    if (!activeCommentId) return;
    if (actionType === 'aprobar') {
      onApprove(activeCommentId, commentText);
    } else {
      onObserve(activeCommentId, commentText);
    }
    setActiveCommentId(null);
    setCommentText('');
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Centro de Aprobación Jerárquica Móvil
            </h3>
            <p className="text-xs text-slate-500">
              Aprobación ágil para Gerentes y Directores con notificación en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter toggle */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFilter('pendientes')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === 'pendientes'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes ({pendingList.length})
            </button>
            <button
              onClick={() => setFilter('todas')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === 'todas'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({rendiciones.length})
            </button>
          </div>

          {/* Smartphone container toggle */}
          <button
            onClick={() => setIsMobileMode(!isMobileMode)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center space-x-1.5 transition-all ${
              isMobileMode
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{isMobileMode ? 'Vista Expandida' : 'Simulador Móvil'}</span>
          </button>
        </div>
      </div>

      {/* Main Approval Body (either simulated mobile phone frame or responsive grid) */}
      <div className={isMobileMode ? 'flex justify-center py-4' : ''}>
        <div
          className={
            isMobileMode
              ? 'w-full max-w-sm bg-slate-900 p-3 rounded-[36px] shadow-2xl border-4 border-slate-800'
              : 'space-y-3'
          }
        >
          {/* Simulated Mobile Status bar if in mobile mode */}
          {isMobileMode && (
            <div className="px-4 py-2 text-white flex items-center justify-between text-[11px] font-mono">
              <span>9:41</span>
              <div className="w-16 h-4 bg-slate-800 rounded-full mx-auto" />
              <span>5G 100%</span>
            </div>
          )}

          <div
            className={
              isMobileMode
                ? 'bg-slate-50 rounded-[28px] p-3 space-y-3 max-h-[640px] overflow-y-auto'
                : 'grid grid-cols-1 md:grid-cols-2 gap-4'
            }
          >
            {displayList.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">
                  ¡Al día! No hay solicitudes pendientes de aprobación
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Todas las rendiciones han sido revisadas o liquidadas.
                </p>
              </div>
            ) : (
              displayList.map((rend) => {
                const cuadre = calculateCuadre(
                  rend.montoAsignado,
                  rend.items,
                  company.toleranciaCuadre
                );
                const cc = costCenters.find((c) => c.id === rend.centroCostosId);

                return (
                  <div
                    key={rend.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {rend.codigoRendicion}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            rend.estado === 'pendiente_aprobacion'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : rend.estado === 'aprobada'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : rend.estado === 'liquidada'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {rend.estado.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">
                        {rend.titulo}
                      </h4>

                      <p className="text-xs text-slate-600 mb-2">
                        Colaborador: <strong className="text-slate-800">{rend.colaboradorNombre}</strong> ({rend.departamento})
                      </p>

                      {/* Financial info block */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-3">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            N° Transferencia
                          </span>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {rend.numeroTransferencia}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            N° de Cheque
                          </span>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {rend.numeroCheque}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Monto Desembolsado
                          </span>
                          <span className="font-mono font-extrabold text-slate-900">
                            {formatCurrency(rend.montoAsignado)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Total Comprobantes
                          </span>
                          <span className="font-mono font-extrabold text-indigo-700">
                            {formatCurrency(cuadre.totalRendido)}
                          </span>
                        </div>
                      </div>

                      {/* Cuadre summary badge */}
                      <div className="mb-3">
                        <CuadreWidget cuadre={cuadre} tolerancia={company.toleranciaCuadre} compact />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => onSelectRendicion(rend)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver {rend.items.length} Comprobantes</span>
                        </button>

                        {rend.estado === 'pendiente_aprobacion' && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleAction(rend.id, 'observar')}
                              className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Observar
                            </button>
                            <button
                              onClick={() => handleAction(rend.id, 'aprobar')}
                              className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center space-x-1 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprobar</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inline Comment Confirmation Form */}
                      {activeCommentId === rend.id && (
                        <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 animate-fadeIn">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {actionType === 'aprobar'
                              ? 'Comentario de Aprobación Jerárquica'
                              : 'Motivo de Observación / Rechazo'}
                          </label>
                          <textarea
                            rows={2}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-slate-300 rounded font-normal text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
                          />
                          <div className="flex justify-end space-x-1.5">
                            <button
                              onClick={() => setActiveCommentId(null)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={confirmAction}
                              className={`px-3 py-1 text-xs font-bold text-white rounded shadow-sm ${
                                actionType === 'aprobar'
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : 'bg-rose-600 hover:bg-rose-700'
                              }`}
                            >
                              Confirmar {actionType === 'aprobar' ? 'Aprobación' : 'Observación'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
