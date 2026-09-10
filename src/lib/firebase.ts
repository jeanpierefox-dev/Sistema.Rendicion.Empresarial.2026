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
import { CompanySettings, User, CostCenter, Rendicion, AppNotification } from '../types';

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
  notifications?: AppNotification[];
  lastUpdated?: string;
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
 * Guarda o actualiza datos en Firestore de forma atómica
 */
export async function saveToCloud(partialState: CloudStatePayload): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_SYSTEM, DOC_STATE);
    await setDoc(
      docRef,
      {
        ...partialState,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error al guardar datos en la nube Firestore:', error);
    throw error;
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
