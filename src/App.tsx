import React, { useState, useEffect, useRef } from 'react';
import {
  INITIAL_COMPANY,
  INITIAL_USERS,
  INITIAL_COST_CENTERS,
  INITIAL_RENDICIONES,
  INITIAL_NOTIFICATIONS,
  INITIAL_DESTINATARIO_ACCOUNTS,
} from './initialData';
import {
  User,
  CompanySettings,
  CostCenter,
  Rendicion,
  AppNotification,
  ExpenseItem,
  DestinatarioAccount,
  SurplusExpenseItem,
} from './types';
import {
  subscribeToCloudState,
  saveToCloud,
  CloudStatePayload,
} from './lib/firebase';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { UserManagementModal } from './components/UserManagementModal';
import { RendicionesListView } from './components/RendicionesListView';
import { RendicionDetailModal } from './components/RendicionDetailModal';
import { OcrUploadModal } from './components/OcrUploadModal';
import { NewRendicionModal } from './components/NewRendicionModal';
import { RestoreSystemModal } from './components/RestoreSystemModal';
import { CostCenterLimitsView } from './components/CostCenterLimitsView';
import { HierarchicalApprovalView } from './components/HierarchicalApprovalView';
import { AnalyticsView } from './components/AnalyticsView';
import { CheckCircle2, AlertTriangle, Bell, Shield, Plus, Camera, Cloud, RefreshCw } from 'lucide-react';

export default function App() {
  // Local storage hydrated states for users
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('corpgastos_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('corpgastos_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_USERS[0]; // Default: admin
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const [company, setCompany] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('corpgastos_company');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_COMPANY;
  });

  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => {
    const saved = localStorage.getItem('corpgastos_cost_centers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_COST_CENTERS;
  });

  const [rendiciones, setRendiciones] = useState<Rendicion[]>(() => {
    const saved = localStorage.getItem('corpgastos_rendiciones');
    if (saved) {
      try {
        const parsed: Rendicion[] = JSON.parse(saved);
        return parsed.map((r) => {
          if (r.codigoRendicion.startsWith('REND-2025-')) {
            const suffix = r.codigoRendicion.replace('REND-2025-', '');
            return { ...r, codigoRendicion: `REND-${suffix}` };
          }
          return r;
        });
      } catch (e) {}
    }
    return INITIAL_RENDICIONES;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('corpgastos_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [destinatarioAccounts, setDestinatarioAccounts] = useState<DestinatarioAccount[]>(() => {
    const saved = localStorage.getItem('corpgastos_destinatario_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_DESTINATARIO_ACCOUNTS;
  });

  const [activeTab, setActiveTab] = useState<'rendiciones' | 'aprobaciones' | 'centros_costos' | 'analitica'>('rendiciones');
  const [selectedRendicionId, setSelectedRendicionId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isMobileMode, setIsMobileMode] = useState(false);

  // Estado para documentos sobrantes (gastos excedentes que quedan fuera del cuadre para nuevas rendiciones)
  const [surplusExpenses, setSurplusExpenses] = useState<SurplusExpenseItem[]>(() => {
    const saved = localStorage.getItem('corpgastos_surplus_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [surplusForNewRendicion, setSurplusForNewRendicion] = useState<SurplusExpenseItem[]>([]);

  // Cloud Firestore synchronization state
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const isSyncingFromCloud = useRef(false);
  const hasLoadedInitialCloud = useRef(false);
  const cloudSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string; type: 'success' | 'alert' } | null>(null);

  // Real-time Cloud Synchronization Listener (Multi-device access from any phone or PC)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToCloudState(
        (cloudData) => {
          if (cloudData && (cloudData.rendiciones || cloudData.users || cloudData.company)) {
            isSyncingFromCloud.current = true;
            if (cloudData.company) setCompany(cloudData.company);
            if (cloudData.users && cloudData.users.length > 0) setUsers(cloudData.users);
            if (cloudData.costCenters && cloudData.costCenters.length > 0) setCostCenters(cloudData.costCenters);
            if (cloudData.rendiciones) setRendiciones(cloudData.rendiciones);
            if (cloudData.surplusExpenses) setSurplusExpenses(cloudData.surplusExpenses);
            if (cloudData.destinatarioAccounts) setDestinatarioAccounts(cloudData.destinatarioAccounts);
            if (cloudData.notifications) setNotifications(cloudData.notifications);

            hasLoadedInitialCloud.current = true;
            setCloudStatus('synced');
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setTimeout(() => {
              isSyncingFromCloud.current = false;
            }, 350);
          } else {
            // First time running on Firestore: seed initial data to the cloud ONLY if never loaded
            if (!hasLoadedInitialCloud.current) {
              hasLoadedInitialCloud.current = true;
              saveToCloud({
                company,
                users,
                costCenters,
                rendiciones,
                surplusExpenses,
                destinatarioAccounts,
                notifications,
              })
                .then(() => {
                  setCloudStatus('synced');
                  setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                })
                .catch((err) => {
                  console.warn('Advertencia al sembrar datos iniciales en Firestore:', err);
                  setCloudStatus('offline');
                });
            }
          }
        },
        (error) => {
          console.warn('Estado del canal de sincronización Firestore:', error);
          setCloudStatus('offline');
        }
      );
    } catch (e) {
      console.warn('Error inicializando suscriptor de la nube:', e);
      setCloudStatus('offline');
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Function to dispatch updates to Firestore safely without race conditions
  const dispatchCloudSave = (partial?: Partial<CloudStatePayload>) => {
    if (isSyncingFromCloud.current || !hasLoadedInitialCloud.current) return;
    setCloudStatus('syncing');

    if (cloudSaveTimer.current) {
      clearTimeout(cloudSaveTimer.current);
    }

    cloudSaveTimer.current = setTimeout(async () => {
      try {
        await saveToCloud({
          company,
          users,
          costCenters,
          rendiciones,
          surplusExpenses,
          destinatarioAccounts,
          notifications,
          ...partial,
        });
        setCloudStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.warn('No se pudo sincronizar con Firestore:', err);
        setCloudStatus('offline');
      }
    }, 400);
  };

  // Manual cloud refresh / synchronization
  const handleManualSync = async () => {
    setCloudStatus('syncing');
    try {
      await saveToCloud({
        company,
        users,
        costCenters,
        rendiciones,
        surplusExpenses,
        destinatarioAccounts,
        notifications,
      });
      setCloudStatus('synced');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
      showToast(
        'Nube Sincronizada',
        `Datos asegurados en Firebase Firestore. Accesible desde cualquier dispositivo móvil o PC (${timeStr})`
      );
    } catch (err) {
      setCloudStatus('error');
      showToast('Error de Conexión', 'No se pudo conectar con Firestore en este momento.', 'alert');
    }
  };

  // Persistence to localStorage (Local cache for instant offline startup)
  useEffect(() => {
    localStorage.setItem('corpgastos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('corpgastos_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('corpgastos_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('corpgastos_company', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('corpgastos_cost_centers', JSON.stringify(costCenters));
  }, [costCenters]);

  useEffect(() => {
    localStorage.setItem('corpgastos_rendiciones', JSON.stringify(rendiciones));
  }, [rendiciones]);

  useEffect(() => {
    localStorage.setItem('corpgastos_surplus_expenses', JSON.stringify(surplusExpenses));
  }, [surplusExpenses]);

  useEffect(() => {
    localStorage.setItem('corpgastos_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('corpgastos_destinatario_accounts', JSON.stringify(destinatarioAccounts));
  }, [destinatarioAccounts]);

  const handleAddDestinatarioAccount = (account: DestinatarioAccount) => {
    const updated = [account, ...destinatarioAccounts];
    setDestinatarioAccounts(updated);
    dispatchCloudSave({ destinatarioAccounts: updated });
    showToast('Cuenta de Destinatario Registrada', `Se guardó la cuenta de ${account.nombreDestinatario} (${account.banco})`);
  };

  const showToast = (title: string, body: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ title, body, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Authentication Handlers
  const handleLogin = (username: string, pass: string): boolean => {
    const found = users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        (u.password ? u.password === pass : pass === '1234')
    );
    if (found) {
      setCurrentUser(found);
      setIsLoginModalOpen(false);
      showToast('Bienvenido al Sistema', `Ha iniciado sesión como ${found.name} (${found.roleLabel})`);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleSwitchUser = (username: string) => {
    const user = users.find((u) => u.username === username);
    if (user) {
      setCurrentUser(user);
      showToast('Rol Actualizado', `Sesión activa cambiada a: ${user.name} (${user.roleLabel})`);
    }
  };

  // User Management Handlers (Admin Only)
  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    dispatchCloudSave({ users: updatedUsers });
    showToast('Usuario Actualizado', `Se guardaron los cambios para ${updatedUser.name}`);
  };

  const handleAddUser = (newUser: User) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    dispatchCloudSave({ users: updatedUsers });
    showToast('Usuario Creado', `Se registró al usuario ${newUser.name} (${newUser.username})`);
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser?.id === userId) {
      showToast('Acción No Permitida', 'No puedes eliminar tu propio usuario en la sesión activa.', 'alert');
      return;
    }
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        showToast('Acción Denegada', 'No es posible eliminar el único administrador del sistema.', 'alert');
        return;
      }
    }

    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);
    dispatchCloudSave({ users: updatedUsers });
    showToast('Usuario Eliminado', `Se eliminó al usuario ${targetUser.name} (@${targetUser.username})`);
  };

  // Rendiciones Handlers
  const handleCreateRendicion = (
    data: Omit<Rendicion, 'id' | 'items' | 'historialAprobacion'>,
    initialItems?: ExpenseItem[]
  ) => {
    const formattedInitialItems: ExpenseItem[] = (initialItems || []).map((it, idx) => ({
      ...it,
      itemNumber: idx + 1,
    }));

    const newRend: Rendicion = {
      ...data,
      id: `rend-${Date.now()}`,
      items: formattedInitialItems,
      historialAprobacion: [
        {
          id: `h-${Date.now()}`,
          nivel: 'Nivel 1 - Apertura de Rendición',
          usuarioNombre: currentUser?.name || data.colaboradorNombre,
          usuarioRol: currentUser?.roleLabel || 'Colaborador',
          fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          accion: 'creada',
          comentario: `Apertura con fondo asignado por ${data.tipoDesembolso} (${data.numeroTransferencia || data.numeroCheque || 'S/N'})${
            formattedInitialItems.length > 0 ? ` e incorporación de ${formattedInitialItems.length} comprobantes iniciales.` : '.'
          }`,
        },
      ],
    };

    // If initial items were taken from surplus, remove them from global surplusExpenses
    let updatedSurplus = [...surplusExpenses];
    if (formattedInitialItems.length > 0) {
      const addedIds = new Set(formattedInitialItems.map((it) => it.id));
      updatedSurplus = updatedSurplus.filter((s) => !addedIds.has(s.id));
      setSurplusExpenses(updatedSurplus);
    }

    const updatedRendiciones = [newRend, ...rendiciones];
    setRendiciones(updatedRendiciones);
    setSelectedRendicionId(newRend.id);
    setSurplusForNewRendicion([]);

    dispatchCloudSave({
      rendiciones: updatedRendiciones,
      surplusExpenses: updatedSurplus,
    });

    showToast(
      'Rendición Creada',
      `Se generó la rendición ${newRend.codigoRendicion}${
        formattedInitialItems.length > 0
          ? ` con ${formattedInitialItems.length} comprobante(s) asignados.`
          : '. Ahora puede cargar comprobantes mediante OCR.'
      }`
    );
  };

  const handleAddExpense = (expenseData: Omit<ExpenseItem, 'id' | 'itemNumber'>) => {
    if (!selectedRendicionId) return;

    let updatedRendiciones: Rendicion[] = [];
    setRendiciones((prev) => {
      updatedRendiciones = prev.map((rend) => {
        if (rend.id !== selectedRendicionId) return rend;
        const nextItemNumber = rend.items.length + 1;
        const newItem: ExpenseItem = {
          ...expenseData,
          id: `item-${Date.now()}`,
          itemNumber: nextItemNumber,
        };
        return {
          ...rend,
          items: [...rend.items, newItem],
        };
      });
      return updatedRendiciones;
    });

    // Update cost center spent amount
    let updatedCostCenters: CostCenter[] = [];
    setCostCenters((prev) => {
      updatedCostCenters = prev.map((cc) => {
        if (cc.id === expenseData.centroCostosId) {
          return {
            ...cc,
            spentAmount: Number((cc.spentAmount + expenseData.montoTotal).toFixed(2)),
          };
        }
        return cc;
      });
      return updatedCostCenters;
    });

    dispatchCloudSave({
      rendiciones: updatedRendiciones,
      costCenters: updatedCostCenters,
    });

    showToast(
      'Comprobante Agregado',
      `Se añadió ${expenseData.tipoDocumento} ${expenseData.numeroComprobante} por S/ ${expenseData.montoTotal.toFixed(2)}`
    );
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!selectedRendicionId) return;

    let updatedRendiciones: Rendicion[] = [];
    let updatedCostCenters: CostCenter[] = [];

    setRendiciones((prev) => {
      updatedRendiciones = prev.map((rend) => {
        if (rend.id !== selectedRendicionId) return rend;
        const itemToDelete = rend.items.find((i) => i.id === expenseId);
        if (itemToDelete) {
          // Adjust CC spent amount
          setCostCenters((ccs) => {
            updatedCostCenters = ccs.map((cc) =>
              cc.id === itemToDelete.centroCostosId
                ? { ...cc, spentAmount: Math.max(0, Number((cc.spentAmount - itemToDelete.montoTotal).toFixed(2))) }
                : cc
            );
            return updatedCostCenters;
          });
        }
        const updatedItems = rend.items
          .filter((i) => i.id !== expenseId)
          .map((item, idx) => ({ ...item, itemNumber: idx + 1 }));
        return { ...rend, items: updatedItems };
      });
      return updatedRendiciones;
    });

    dispatchCloudSave({
      rendiciones: updatedRendiciones,
      costCenters: updatedCostCenters.length > 0 ? updatedCostCenters : costCenters,
    });

    showToast('Comprobante Eliminado', 'Se ha removido el gasto y recalculado el cuadre.', 'alert');
  };

  // Cuadrar Rendición separando documentos sobrantes para nuevas rendiciones
  const handleCuadreWithSurplus = (
    rendicionId: string,
    retainedItems: ExpenseItem[],
    surplusItems: ExpenseItem[],
    createNewNow: boolean,
    reciboSimpleMonto?: number,
    reciboSimpleDetalle?: string
  ) => {
    const target = rendiciones.find((r) => r.id === rendicionId);
    if (!target) return;

    let finalItems = [...retainedItems];

    // Si se especificó un recibo simple para cuadre exacto
    if (reciboSimpleMonto && reciboSimpleMonto > 0) {
      const reciboSimpleItem: ExpenseItem = {
        id: `recibo-simple-${Date.now()}`,
        itemNumber: finalItems.length + 1,
        fecha: new Date().toISOString().split('T')[0],
        tipoDocumento: 'Recibo Simple',
        numeroComprobante: `REC-AJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        ruc: company.ruc,
        razonSocial: 'COMPENSACIÓN POR CUADRE CONTABLE',
        detalle: reciboSimpleDetalle || 'Ajuste provisional para cuadre exacto de caja',
        clasificacionGasto: 'Gastos Menores / Remanente',
        centroCostosId: target.centroCostosId || costCenters[0]?.id || 'cc-1',
        montoTotal: Number(reciboSimpleMonto.toFixed(2)),
      };
      finalItems.push(reciboSimpleItem);
    }

    // Renumerar items retenidos correlativamente
    finalItems = finalItems.map((it, idx) => ({ ...it, itemNumber: idx + 1 }));

    // Convertir documentos sobrantes para el bolsón global
    const newSurplusItems: SurplusExpenseItem[] = surplusItems.map((item) => ({
      ...item,
      origenRendicionId: target.id,
      origenCodigoRendicion: target.codigoRendicion,
      fechaSeparacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
      motivoExclusion: `Sobrante del cuadre de ${target.codigoRendicion}`,
    }));

    const updatedSurplus = [...newSurplusItems, ...surplusExpenses];
    setSurplusExpenses(updatedSurplus);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedRendiciones = rendiciones.map((rend) => {
      if (rend.id !== rendicionId) return rend;
      const newHist = {
        id: `h-${Date.now()}`,
        nivel: 'Nivel 1 - Cuadre y Separación de Sobrantes',
        usuarioNombre: currentUser?.name || 'Usuario',
        usuarioRol: currentUser?.roleLabel || 'Colaborador',
        fecha: nowStr,
        accion: 'creada' as const,
        comentario: `Se cuadró la rendición reteniendo ${finalItems.length} comprobantes y liberando ${surplusItems.length} comprobantes sobrantes para una nueva rendición.`,
      };
      return {
        ...rend,
        items: finalItems,
        historialAprobacion: [...rend.historialAprobacion, newHist],
      };
    });

    setRendiciones(updatedRendiciones);

    dispatchCloudSave({
      rendiciones: updatedRendiciones,
      surplusExpenses: updatedSurplus,
    });

    showToast(
      'Rendición Cuadrada',
      `Se cuadró ${target.codigoRendicion}. ${surplusItems.length} comprobante(s) quedaron disponibles en el bolsón de sobrantes.`
    );

    if (createNewNow && newSurplusItems.length > 0) {
      setSelectedRendicionId(null);
      setSurplusForNewRendicion(newSurplusItems);
      setIsNewModalOpen(true);
    }
  };

  // Mover un comprobante individual de una rendición al bolsón de documentos sobrantes
  const handleMoveItemToSurplus = (rendicionId: string, expenseId: string) => {
    const target = rendiciones.find((r) => r.id === rendicionId);
    if (!target) return;

    const itemToMove = target.items.find((it) => it.id === expenseId);
    if (!itemToMove) return;

    const newSurplusItem: SurplusExpenseItem = {
      ...itemToMove,
      origenRendicionId: target.id,
      origenCodigoRendicion: target.codigoRendicion,
      fechaSeparacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
      motivoExclusion: `Separado de ${target.codigoRendicion}`,
    };

    const updatedSurplus = [newSurplusItem, ...surplusExpenses];
    setSurplusExpenses(updatedSurplus);

    const updatedItems = target.items
      .filter((it) => it.id !== expenseId)
      .map((it, idx) => ({ ...it, itemNumber: idx + 1 }));

    const updatedRendiciones = rendiciones.map((rend) => {
      if (rend.id !== rendicionId) return rend;
      return {
        ...rend,
        items: updatedItems,
      };
    });

    setRendiciones(updatedRendiciones);

    dispatchCloudSave({
      rendiciones: updatedRendiciones,
      surplusExpenses: updatedSurplus,
    });

    showToast(
      'Comprobante Movido a Sobrantes',
      `Se retiró ${itemToMove.tipoDocumento} ${itemToMove.numeroComprobante} (S/ ${itemToMove.montoTotal.toFixed(2)}) y quedó listo para una nueva rendición.`
    );
  };

  // Eliminar un comprobante del bolsón de documentos sobrantes
  const handleDeleteSurplusItem = (id: string) => {
    const updatedSurplus = surplusExpenses.filter((s) => s.id !== id);
    setSurplusExpenses(updatedSurplus);
    dispatchCloudSave({ surplusExpenses: updatedSurplus });
    showToast('Documento Sobrante Eliminado', 'Se retiró el comprobante del bolsón de sobrantes.', 'alert');
  };

  const handleSubmitForApproval = (rendicionId: string) => {
    const target = rendiciones.find((r) => r.id === rendicionId);
    let updatedRendiciones: Rendicion[] = [];
    setRendiciones((prev) => {
      updatedRendiciones = prev.map((rend) => {
        if (rend.id !== rendicionId) return rend;
        const newHist = {
          id: `h-${Date.now()}`,
          nivel: 'Nivel 2 - Solicitud de Aprobación',
          usuarioNombre: currentUser?.name || rend.colaboradorNombre,
          usuarioRol: currentUser?.roleLabel || 'Colaborador',
          fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          accion: 'enviada' as const,
          comentario: 'Solicitud enviada para revisión jerárquica de Gerencia.',
        };
        return {
          ...rend,
          estado: 'pendiente_aprobacion',
          historialAprobacion: [...rend.historialAprobacion, newHist],
        };
      });
      return updatedRendiciones;
    });

    // Add real-time notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: 'Ahora',
      titulo: 'Nueva Rendición Pendiente de Aprobación',
      mensaje: `La rendición ${target?.codigoRendicion} ha sido enviada por ${currentUser?.name} para su visto bueno.`,
      tipo: 'rendicion_nueva',
      leido: false,
      rendicionId,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);

    dispatchCloudSave({
      rendiciones: updatedRendiciones,
      notifications: updatedNotifs,
    });

    showToast(
      'Solicitud Enviada',
      'La rendición ha sido enviada a la bandeja de Aprobación Jerárquica Móvil.'
    );
  };

  const handleApproveRendicion = (
    rendicionId: string,
    comment: string,
    firmaAprobadorUrl?: string
  ) => {
    const target = rendiciones.find((r) => r.id === rendicionId);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let updatedRendiciones: Rendicion[] = [];
    setRendiciones((prev) => {
      updatedRendiciones = prev.map((rend) => {
        if (rend.id !== rendicionId) return rend;
        const newHist = {
          id: `h-${Date.now()}`,
          nivel: 'Nivel 2 - Gerencia de Área / Aprobador',
          usuarioNombre: currentUser?.name || 'Gerencia',
          usuarioRol: currentUser?.roleLabel || 'Gerente Aprobador',
          fecha: nowStr,
          accion: 'aprobada' as const,
          comentario: comment,
        };
        return {
          ...rend,
          estado: 'aprobada',
          aprobadoPor: currentUser?.name,
          fechaAprobacion: nowStr,
          firmaAprobador: firmaAprobadorUrl || rend.firmaAprobador,
          fechaFirmaAprobador: firmaAprobadorUrl ? new Date().toLocaleString('es-PE') : rend.fechaFirmaAprobador,
          historialAprobacion: [...rend.historialAprobacion, newHist],
        };
      });
      return updatedRendiciones;
    });

    // Add real-time notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: 'Ahora mismo',
      titulo: 'Rendición Aprobada por Gerencia',
      mensaje: `La rendición ${target?.codigoRendicion || ''} fue aprobada por ${currentUser?.name}. Pasa a Contabilidad para liquidación.`,
      tipo: 'aprobacion',
      leido: false,
      rendicionId,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);

    dispatchCloudSave({
      rendiciones: updatedRendiciones,
      notifications: updatedNotifs,
    });

    showToast(
      'Rendición Aprobada',
      `Aprobación registrada exitosamente por ${currentUser?.name}. Se emitió notificación en tiempo real.`
    );
  };

  const handleObserveRendicion = (rendicionId: string, comment: string) => {
    const target = rendiciones.find((r) => r.id === rendicionId);
    let updatedRendiciones: Rendicion[] = [];
    setRendiciones((prev) => {
      updatedRendiciones = prev.map((rend) => {
        if (rend.id !== rendicionId) return rend;
        const newHist = {
          id: `h-${Date.now()}`,
          nivel: 'Nivel 2 - Observación de Auditoría',
          usuarioNombre: currentUser?.name || 'Gerencia',
          usuarioRol: currentUser?.roleLabel || 'Gerente',
          fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          accion: 'observada' as const,
          comentario: comment,
        };
        return {
          ...rend,
          estado: 'observada',
          observaciones: comment,
          historialAprobacion: [...rend.historialAprobacion, newHist],
        };
      });
      return updatedRendiciones;
    });

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: 'Ahora mismo',
      titulo: 'Rendición Observada',
      mensaje: `La rendición ${target?.codigoRendicion || ''} ha sido observada: "${comment}"`,
      tipo: 'observacion',
      leido: false,
      rendicionId,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);

    dispatchCloudSave({
      rendiciones: updatedRendiciones,
      notifications: updatedNotifs,
    });

    showToast(
      'Rendición Observada',
      'Se ha notificado al colaborador para subsanar comprobantes.',
      'alert'
    );
  };

  const handleLiquidateRendicion = (rendicionId: string, comment: string) => {
    const target = rendiciones.find((r) => r.id === rendicionId);
    let updatedRendiciones: Rendicion[] = [];
    setRendiciones((prev) => {
      updatedRendiciones = prev.map((rend) => {
        if (rend.id !== rendicionId) return rend;
        const newHist = {
          id: `h-${Date.now()}`,
          nivel: 'Nivel 3 - Contabilidad y Tesorería',
          usuarioNombre: currentUser?.name || 'Contabilidad',
          usuarioRol: currentUser?.roleLabel || 'Auditor Contable',
          fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          accion: 'liquidada' as const,
          comentario: comment,
        };
        return {
          ...rend,
          estado: 'liquidada',
          historialAprobacion: [...rend.historialAprobacion, newHist],
        };
      });
      return updatedRendiciones;
    });

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: 'Ahora mismo',
      titulo: 'Rendición Liquidada y Conciliada',
      mensaje: `La rendición ${target?.codigoRendicion || ''} ha sido liquidada con éxito por Contabilidad. Asiento generado en ${company.sistemaContableExport}.`,
      tipo: 'aprobacion',
      leido: false,
      rendicionId,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);

    dispatchCloudSave({
      rendiciones: updatedRendiciones,
      notifications: updatedNotifs,
    });

    showToast(
      'Rendición Liquidada',
      `Conciliación y cierre contable completado en ${company.sistemaContableExport}.`
    );
  };

  const handleUpdateSignatures = (
    rendicionId: string,
    signatures: {
      firmaResponsable?: string;
      fechaFirmaResponsable?: string;
      firmaAprobador?: string;
      fechaFirmaAprobador?: string;
    }
  ) => {
    let updatedRendiciones: Rendicion[] = [];
    setRendiciones((prev) => {
      updatedRendiciones = prev.map((rend) => {
        if (rend.id !== rendicionId) return rend;
        return {
          ...rend,
          firmaResponsable: signatures.firmaResponsable ?? rend.firmaResponsable,
          fechaFirmaResponsable: signatures.fechaFirmaResponsable ?? rend.fechaFirmaResponsable,
          firmaAprobador: signatures.firmaAprobador ?? rend.firmaAprobador,
          fechaFirmaAprobador: signatures.fechaFirmaAprobador ?? rend.fechaFirmaAprobador,
        };
      });
      return updatedRendiciones;
    });
    dispatchCloudSave({ rendiciones: updatedRendiciones });
    showToast('Firma Registrada', 'La firma digital fue estampada y guardada correctamente.');
  };

  const handleUpdateMontoAsignado = (rendicionId: string, newMonto: number) => {
    let updatedRendiciones: Rendicion[] = [];
    setRendiciones((prev) => {
      updatedRendiciones = prev.map((rend) => {
        if (rend.id !== rendicionId) return rend;
        return {
          ...rend,
          montoAsignado: newMonto,
        };
      });
      return updatedRendiciones;
    });
    dispatchCloudSave({ rendiciones: updatedRendiciones });
    showToast(
      'Rendición Cuadrada',
      `Se ajustó el desembolso a S/ ${newMonto.toFixed(2)} para cuadrar la rendición según directiva contable.`
    );
  };

  const handleUpdateItems = (rendicionId: string, updatedItems: ExpenseItem[]) => {
    let updatedRendiciones: Rendicion[] = [];
    setRendiciones((prev) => {
      updatedRendiciones = prev.map((rend) => {
        if (rend.id !== rendicionId) return rend;
        return {
          ...rend,
          items: updatedItems,
        };
      });
      return updatedRendiciones;
    });
    dispatchCloudSave({ rendiciones: updatedRendiciones });
    showToast(
      'Comprobantes Ordenados',
      'Se reordenaron los comprobantes según la fecha de emisión del documento y se renumeraron correlativamente.'
    );
  };

  const handleUpdateCostCenterLimit = (id: string, newLimit: number) => {
    let updatedCostCenters: CostCenter[] = [];
    setCostCenters((prev) => {
      updatedCostCenters = prev.map((cc) => (cc.id === id ? { ...cc, budgetLimit: newLimit } : cc));
      return updatedCostCenters;
    });
    dispatchCloudSave({ costCenters: updatedCostCenters });
    showToast('Límite Actualizado', 'El nuevo límite presupuestal ha sido registrado.');
  };

  const handleAddCostCenter = (newCC: Omit<CostCenter, 'id' | 'spentAmount'>) => {
    const cc: CostCenter = {
      ...newCC,
      id: `cc-${Date.now()}`,
      spentAmount: 0,
    };
    const updated = [...costCenters, cc];
    setCostCenters(updated);
    dispatchCloudSave({ costCenters: updated });
    showToast('Centro de Costos Creado', `Se agregó ${cc.code} - ${cc.name}`);
  };

  // Function to calculate next rendicion code starting from 1 (e.g. REND-001)
  const computeNextRendicionCode = (list: Rendicion[]): string => {
    if (!list || list.length === 0) return 'REND-001';
    let maxCodeNum = 0;
    list.forEach((r) => {
      const match = r.codigoRendicion.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxCodeNum) {
          maxCodeNum = num;
        }
      }
    });
    const nextNum = maxCodeNum > 0 ? maxCodeNum + 1 : list.length + 1;
    return `REND-${String(nextNum).padStart(3, '0')}`;
  };

  const handleConfirmRestore = (mode: 'initial_demo' | 'clean_slate') => {
    if (currentUser?.role !== 'admin') {
      showToast('Acceso Denegado', 'Solo el administrador puede restaurar el sistema.');
      return;
    }

    // Clear relevant localStorage keys
    localStorage.removeItem('corpgastos_rendiciones');
    localStorage.removeItem('corpgastos_surplus_expenses');
    localStorage.removeItem('corpgastos_cost_centers');
    localStorage.removeItem('corpgastos_company');
    localStorage.removeItem('corpgastos_destinatario_accounts');
    localStorage.removeItem('corpgastos_notifications');

    if (mode === 'clean_slate') {
      // Clean slate: 0 rendiciones, next code strictly starts from REND-001
      const resetCostCenters = INITIAL_COST_CENTERS.map((c) => ({ ...c, spentAmount: 0 }));
      const newNotifs: AppNotification[] = [
        {
          id: `notif-${Date.now()}`,
          timestamp: 'Hace unos momentos',
          titulo: 'Sistema Restaurado en Blanco',
          mensaje: 'El sistema ha sido reiniciado en blanco por el Administrador. El próximo código correlativo iniciará en REND-001.',
          tipo: 'aprobacion',
          leido: false,
        },
      ];
      setRendiciones([]);
      setSurplusExpenses([]);
      setCostCenters(resetCostCenters);
      setCompany(INITIAL_COMPANY);
      setDestinatarioAccounts(INITIAL_DESTINATARIO_ACCOUNTS);
      setNotifications(newNotifs);
      saveToCloud({
        rendiciones: [],
        surplusExpenses: [],
        costCenters: resetCostCenters,
        company: INITIAL_COMPANY,
        destinatarioAccounts: INITIAL_DESTINATARIO_ACCOUNTS,
        notifications: newNotifs,
      }, true);
      showToast('Sistema en Blanco', 'Base de datos reiniciada. El próximo registro será REND-001.');
    } else {
      // Reset to initial demo with codes starting at REND-001
      setRendiciones(INITIAL_RENDICIONES);
      setSurplusExpenses([]);
      setCostCenters(INITIAL_COST_CENTERS);
      setCompany(INITIAL_COMPANY);
      setDestinatarioAccounts(INITIAL_DESTINATARIO_ACCOUNTS);
      setNotifications(INITIAL_NOTIFICATIONS);
      saveToCloud({
        rendiciones: INITIAL_RENDICIONES,
        surplusExpenses: [],
        costCenters: INITIAL_COST_CENTERS,
        company: INITIAL_COMPANY,
        destinatarioAccounts: INITIAL_DESTINATARIO_ACCOUNTS,
        notifications: INITIAL_NOTIFICATIONS,
      }, true);
      showToast('Sistema Restaurado', 'Se cargaron los datos de ejemplo iniciales (REND-001 al REND-004).');
    }
    setSelectedRendicionId(null);
  };

  const selectedRendicion = rendiciones.find((r) => r.id === selectedRendicionId);
  const nextRendCode = computeNextRendicionCode(rendiciones);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        company={company}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenRestoreSystem={() => setIsRestoreModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        notifications={notifications}
        onMarkNotificationRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
          )
        }
        allUsers={users}
        isMobileMode={isMobileMode}
        setIsMobileMode={setIsMobileMode}
        cloudStatus={cloudStatus}
        lastSyncTime={lastSyncTime}
        onManualSync={handleManualSync}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-20 sm:pb-8">
        {activeTab === 'rendiciones' && (
          <RendicionesListView
            rendiciones={rendiciones}
            company={company}
            costCenters={costCenters}
            currentUser={currentUser}
            onSelectRendicion={(r) => setSelectedRendicionId(r.id)}
            onOpenNewModal={() => {
              setSurplusForNewRendicion([]);
              setIsNewModalOpen(true);
            }}
            surplusExpenses={surplusExpenses}
            onOpenNewWithSurplus={(items) => {
              setSurplusForNewRendicion(items);
              setIsNewModalOpen(true);
            }}
            onDeleteSurplusItem={handleDeleteSurplusItem}
          />
        )}

        {activeTab === 'aprobaciones' && (
          <HierarchicalApprovalView
            rendiciones={rendiciones}
            company={company}
            costCenters={costCenters}
            currentUser={currentUser}
            onSelectRendicion={(r) => setSelectedRendicionId(r.id)}
            onApprove={(id, comment) => handleApproveRendicion(id, comment)}
            onObserve={(id, comment) => handleObserveRendicion(id, comment)}
            isMobileMode={isMobileMode}
            setIsMobileMode={setIsMobileMode}
          />
        )}

        {activeTab === 'centros_costos' && (
          <CostCenterLimitsView
            costCenters={costCenters}
            onUpdateLimit={handleUpdateCostCenterLimit}
            onAddCostCenter={handleAddCostCenter}
          />
        )}

        {activeTab === 'analitica' && (
          <AnalyticsView
            rendiciones={rendiciones}
            company={company}
            costCenters={costCenters}
          />
        )}
      </main>

      {/* Mobile Floating Quick Actions (for mobile devices) */}
      <div className="sm:hidden fixed bottom-4 right-4 z-40 flex flex-col items-end space-y-2">
        <button
          id="btn-mobile-ocr"
          onClick={() => setIsOcrModalOpen(true)}
          title="Escanear Comprobante con Cámara o Archivo"
          className="px-3.5 py-2.5 bg-slate-900 text-white rounded-full shadow-lg border border-slate-700 flex items-center space-x-2 text-xs font-bold active:scale-95 transition-transform"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>Escanear</span>
        </button>
        <button
          id="btn-mobile-new-rendicion"
          onClick={() => setIsNewModalOpen(true)}
          title="Crear Nueva Rendición"
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center space-x-2 text-xs font-bold active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>+ Rendición</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">{company.razonSocial}</span>
            <span>•</span>
            <span>RUC {company.ruc}</span>
          </div>
          <div>
            Sistema de Rendición y Cuadre de Gastos • Integración SUNAT & Sistemas Contables ({company.sistemaContableExport})
          </div>
        </div>
      </footer>

      {/* Real-Time Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`p-4 rounded-xl shadow-2xl border flex items-start space-x-3 max-w-sm ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-rose-950 text-white border-rose-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold text-white">{toastMessage.title}</p>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                {toastMessage.body}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || !currentUser}
        company={company}
        onLogin={handleLogin}
      />

      {/* Company Settings & Logo Modal */}
      <CompanySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        company={company}
        onSave={(updated) => {
          setCompany(updated);
          showToast('Configuración Guardada', 'Se actualizaron los datos y el logo corporativo.');
        }}
      />

      {/* User Management Modal (Admin only) */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        users={users}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* New Rendición Modal */}
      <NewRendicionModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setSurplusForNewRendicion([]);
        }}
        onCreate={handleCreateRendicion}
        costCenters={costCenters}
        currentUser={currentUser}
        allUsers={users}
        company={company}
        nextCode={nextRendCode}
        destinatarioAccounts={destinatarioAccounts}
        onAddDestinatarioAccount={handleAddDestinatarioAccount}
        availableSurplus={surplusExpenses}
        preselectedSurplus={surplusForNewRendicion}
      />

      {/* Selected Rendición Detail Modal */}
      {selectedRendicion && (
        <RendicionDetailModal
          isOpen={!!selectedRendicion}
          onClose={() => setSelectedRendicionId(null)}
          rendicion={selectedRendicion}
          company={company}
          costCenter={costCenters.find((c) => c.id === selectedRendicion.centroCostosId)}
          currentUser={currentUser}
          onOpenOcr={() => setIsOcrModalOpen(true)}
          onDeleteExpense={handleDeleteExpense}
          onSubmitForApproval={handleSubmitForApproval}
          onApproveRendicion={handleApproveRendicion}
          onObserveRendicion={handleObserveRendicion}
          onLiquidateRendicion={handleLiquidateRendicion}
          onUpdateSignatures={handleUpdateSignatures}
          onUpdateMontoAsignado={handleUpdateMontoAsignado}
          onUpdateItems={handleUpdateItems}
          onCuadreWithSurplus={handleCuadreWithSurplus}
          onMoveItemToSurplus={handleMoveItemToSurplus}
        />
      )}

      {/* OCR Ticket / Receipt Scanner Modal */}
      <OcrUploadModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onAddExpense={handleAddExpense}
        costCenters={costCenters}
        defaultCostCenterId={selectedRendicion?.centroCostosId || costCenters[0]?.id || 'cc-1'}
      />

      {/* Restore System Modal (Exclusively for Admin) */}
      <RestoreSystemModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirmRestore={handleConfirmRestore}
      />
    </div>
  );
}
