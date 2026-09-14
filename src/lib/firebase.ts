import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CompanySettings, User, CostCenter, Rendicion, AppNotification, SurplusExpenseItem, DestinatarioAccount } from '../types';

// Inicializar la aplicación Firebase si no está ya inicializada
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Conectar a la base de datos Firestore especificada en la configuración
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== ''
    ? firebaseConfig.firestoreDatabaseId
    : '(default)'
);

// Autenticación anónima para garantizar sesión en cualquier dispositivo móvil o de escritorio
export const auth = getAuth(app);
signInAnonymously(auth).catch((err) => {
  console.warn('Advertencia al autenticar sesión anónima de Firebase:', err);
});

// Verificación obligatoria de conexión con el servidor Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'status'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('El cliente Firestore está en modo offline o esperando conexión.');
      return false;
    }
    // Si no existe el documento o responde, la conexión está operativa
    return true;
  }
}

// Ejecutar prueba de conexión al inicio
testFirestoreConnection();

// Constantes de colecciones
const COLLECTION_SYSTEM = 'sistema_rendiciones';
const DOC_STATE = 'estado_global';

export interface CloudStatePayload {
  company?: CompanySettings;
  users?: User[];
  costCenters?: CostCenter[];
  rendiciones?: Rendicion[];
  surplusExpenses?: SurplusExpenseItem[];
  destinatarioAccounts?: DestinatarioAccount[];
  notifications?: AppNotification[];
  lastUpdated?: string;
  lastUpdatedBy?: string;
}

/**
 * Escucha cambios en tiempo real en la nube desde cualquier dispositivo
 */
export function subscribeToCloudState(
  onData: (state: CloudStatePayload) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(db, COLLECTION_SYSTEM, DOC_STATE);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudStatePayload;
        onData(data);
      }
    },
    (error) => {
      console.error('Error escuchando sincronización en la nube:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Guarda o actualiza datos en Firestore de forma atómica con protección anti-pérdida de datos
 */
export async function saveToCloud(partialState: CloudStatePayload, forceEmptyRendiciones = false): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_SYSTEM, DOC_STATE);

    // Protección anti-pérdida multi-dispositivo y anti-borrado accidental:
    // Si un dispositivo nuevo, pestaña o proceso intenta guardar rendiciones vacías pero en la nube ya hay datos,
    // preservamos los datos remotos en vez de borrarlos.
    if (!forceEmptyRendiciones) {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remoteData = snap.data() as CloudStatePayload;
        if (partialState.rendiciones && partialState.rendiciones.length === 0 && remoteData.rendiciones && remoteData.rendiciones.length > 0) {
          console.warn('Protección de nube activada: se evitó sobreescribir rendiciones existentes en la nube con estado vacío.');
          delete partialState.rendiciones;
        }
        if (partialState.surplusExpenses && partialState.surplusExpenses.length === 0 && remoteData.surplusExpenses && remoteData.surplusExpenses.length > 0) {
          delete partialState.surplusExpenses;
        }
      }
    }

    await setDoc(
      docRef,
      {
        ...partialState,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    // Respaldo de seguridad permanente secundario en Firestore
    if (partialState.rendiciones && partialState.rendiciones.length > 0) {
      const backupRef = doc(db, COLLECTION_SYSTEM, 'respaldo_seguridad');
      setDoc(
        backupRef,
        {
          rendiciones: partialState.rendiciones,
          fechaRespaldo: new Date().toISOString(),
          itemCount: partialState.rendiciones.length,
          descripcion: 'Copia de seguridad permanente contra pérdida de datos',
        },
        { merge: true }
      ).catch((e) => console.warn('Advertencia al sincronizar respaldo secundario Firestore:', e));
    }
  } catch (error) {
    console.error('Error al guardar datos en la nube Firestore:', error);
    throw error;
  }
}

/**
 * Recupera el respaldo de seguridad permanente de rendiciones desde Firestore
 */
export async function fetchBackupRendiciones(): Promise<Rendicion[] | null> {
  try {
    const backupRef = doc(db, COLLECTION_SYSTEM, 'respaldo_seguridad');
    const snap = await getDoc(backupRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.rendiciones && Array.isArray(data.rendiciones) && data.rendiciones.length > 0) {
        return data.rendiciones as Rendicion[];
      }
    }
    return null;
  } catch (error) {
    console.warn('No se pudo recuperar el respaldo secundario de la nube:', error);
    return null;
  }
}

/**
 * Carga inicial desde Firestore (útil para arranques limpios en nuevos dispositivos móviles)
 */
export async function fetchInitialCloudState(): Promise<CloudStatePayload | null> {
  try {
    const docRef = doc(db, COLLECTION_SYSTEM, DOC_STATE);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as CloudStatePayload;
    }
    return null;
  } catch (error) {
    console.warn('No se pudo recuperar el estado inicial de la nube (usando almacenamiento local):', error);
    return null;
  }
}
