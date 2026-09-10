import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  AlertTriangle,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface RestoreSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestore: (mode: 'initial_demo' | 'clean_slate') => void;
}

export const RestoreSystemModal: React.FC<RestoreSystemModalProps> = ({
  isOpen,
  onClose,
  onConfirmRestore,
}) => {
  const [selectedMode, setSelectedMode] = useState<'initial_demo' | 'clean_slate'>('initial_demo');
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'RESTAURAR';

  const handleExecute = () => {
    if (!isConfirmed) return;
    onConfirmRestore(selectedMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <span>Restaurar Sistema (Exclusivo Administrador)</span>
              </h3>
              <p className="text-[11px] text-rose-200">
                Restablecer base de datos local y códigos correlativos
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
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs">¡Advertencia de Seguridad!</p>
              <p className="text-[11px] leading-relaxed">
                Esta acción restablecerá el almacenamiento local del sistema. Podrá elegir entre restaurar los datos de ejemplo iniciales (iniciando correlativos desde <strong>REND-001</strong>) o iniciar el sistema completamente en blanco.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-900">
              Seleccione el modo de restauración:
            </label>

            {/* Option 1: Initial Demo Data */}
            <div
              onClick={() => setSelectedMode('initial_demo')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
                selectedMode === 'initial_demo'
                  ? 'border-indigo-600 bg-indigo-50/60'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <Database className={`w-5 h-5 mt-0.5 shrink-0 ${selectedMode === 'initial_demo' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  Restaurar Datos de Demostración (Correlativos desde REND-001)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Carga las 4 rendiciones predefinidas numeradas correlativamente como <strong>REND-001</strong>, <strong>REND-002</strong>, <strong>REND-003</strong> y <strong>REND-004</strong>, listas con sus comprobantes y centros de costos.
                </p>
              </div>
            </div>

            {/* Option 2: Clean Slate */}
            <div
              onClick={() => setSelectedMode('clean_slate')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
                selectedMode === 'clean_slate'
                  ? 'border-indigo-600 bg-indigo-50/60'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <Trash2 className={`w-5 h-5 mt-0.5 shrink-0 ${selectedMode === 'clean_slate' ? 'text-rose-600' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  Sistema en Blanco (0 Rendiciones, primer código REND-001)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Elimina todas las rendiciones existentes. La siguiente rendición que se registre comenzará estrictamente desde el código <strong>REND-001</strong>. Mantiene usuarios y configuración base.
                </p>
              </div>
            </div>
          </div>

          {/* Security confirmation input */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Para confirmar, escriba la palabra <span className="font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">RESTAURAR</span> a continuación:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escriba RESTAURAR para habilitar"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 uppercase outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleExecute}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
              isConfirmed
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-98'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Confirmar y Restaurar Sistema</span>
          </button>
        </div>
      </div>
    </div>
  );
};
