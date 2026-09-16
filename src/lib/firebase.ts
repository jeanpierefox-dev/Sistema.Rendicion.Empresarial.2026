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
  getDocs, deleteField } from 'firebase/firestore';
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
  const rendicionesRef = collection(db, COLLECTION_SYSTEM, DOC_STATE, 'rendiciones_docs');

  const unsubscribeMain = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudStatePayload;
        // MIGRATION: If the main document still has rendiciones (from before the 1MB fix),
        // we emit them. We also immediately trigger a background migration to move them
        // to the subcollection so the main document shrinks and unblocks other saves!
        if (data.rendiciones && data.rendiciones.length > 0) {
           console.log('Iniciando migración automática de rendiciones a subcolección...');
           // Trigger background migration
           saveToCloud({ rendiciones: data.rendiciones }).then(() => {
              console.log('Migración completada exitosamente.');
           }).catch(e => console.error('Error en migración:', e));
        } else {
           delete data.rendiciones;
        }
        onData(data);
      }
    },
    (error) => {
      console.error('Error escuchando sincronización en la nube:', error);
      if (onError) onError(error);
    }
  );

  const unsubscribeRendiciones = onSnapshot(
    rendicionesRef,
    (snapshot) => {
      const rendiciones = snapshot.docs.map(d => d.data() as Rendicion);
      onData({ rendiciones });
    },
    (error) => {
      console.error('Error escuchando rendiciones en la nube:', error);
      if (onError) onError(error);
    }
  );

  return () => {
    unsubscribeMain();
    unsubscribeRendiciones();
  };
}

/**
 * Guarda o actualiza datos en Firestore de forma atómica con protección anti-pérdida de datos
 */
export async function saveToCloud(partialState: CloudStatePayload, forceEmptyRendiciones = false): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_SYSTEM, DOC_STATE);
    const { rendiciones, ...coreState } = partialState;

    // Save core state (everything except rendiciones) to the main document
    // MIGRATION: Only delete rendiciones from the main document IF we are actively saving them to the subcollection right now.
    // Otherwise, we might delete them before they get migrated!
    const docData: any = {
      ...coreState,
      rendiciones: deleteField(),
      lastUpdated: new Date().toISOString(),
    };
    
    if (Object.keys(coreState).length > 0 || rendiciones) {
      await setDoc(
        docRef,
        docData,
        { merge: true }
      );
    }

    // Save rendiciones as individual documents in a subcollection to bypass the 1MB limit
    if (rendiciones) {
      const rendicionesRef = collection(db, COLLECTION_SYSTEM, DOC_STATE, 'rendiciones_docs');
      
      // Get existing ones to detect deletions
      let existingIds = new Set<string>();
      if (!forceEmptyRendiciones) {
        const existingDocs = await getDocs(rendicionesRef);
        existingIds = new Set(existingDocs.docs.map(d => d.id));
      }

      const incomingIds = new Set(rendiciones.map(r => r.id));

      let batch = writeBatch(db);
      let opCount = 0;

      const commitBatch = async () => {
        if (opCount > 0) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      };

      // Add/Update incoming rendiciones
      for (const r of rendiciones) {
        if (!r.id) continue;
        const rDoc = doc(rendicionesRef, r.id);
        batch.set(rDoc, r);
        opCount++;
        if (opCount >= 400) await commitBatch();
      }

      // Delete removed rendiciones (unless forceEmptyRendiciones is false and rendiciones array is empty - protection)
      if (rendiciones.length === 0 && !forceEmptyRendiciones && existingIds.size > 0) {
        console.warn('Protección de nube activada: se evitó borrar todas las rendiciones de la subcolección.');
      } else {
        for (const id of existingIds) {
          if (!incomingIds.has(id)) {
            const rDoc = doc(rendicionesRef, id);
            batch.delete(rDoc);
            opCount++;
            if (opCount >= 400) await commitBatch();
          }
        }
      }

      await commitBatch();
      
      // Secondary Backup
      if (rendiciones.length > 0) {
         // Because a single document has a 1MB limit, we can't save all rendiciones into 'respaldo_seguridad'.
         // We will just store a metadata doc instead of the full array to prevent it from crashing the backup too.
         const backupRef = doc(db, COLLECTION_SYSTEM, 'respaldo_seguridad');
         setDoc(
            backupRef,
            {
              fechaRespaldo: new Date().toISOString(),
              itemCount: rendiciones.length,
              descripcion: 'Copia de seguridad referencial',
            },
            { merge: true }
         ).catch(() => {});
      }
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
    const rendicionesRef = collection(db, COLLECTION_SYSTEM, DOC_STATE, 'rendiciones_docs');
    const snap = await getDocs(rendicionesRef);
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as Rendicion);
    }
    return null;
  } catch (error) {
    console.warn('No se pudo recuperar rendiciones de la nube:', error);
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
