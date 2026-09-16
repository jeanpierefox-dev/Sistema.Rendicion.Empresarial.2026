import fs from 'fs';

let content = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

// Ensure we have getDocs imported
if (!content.includes('getDocs')) {
    content = content.replace(
        /import \{\s*getFirestore,\s*doc,\s*setDoc,\s*getDoc,\s*onSnapshot,\s*collection,\s*getDocFromServer,\s*writeBatch,\s*\} from 'firebase\/firestore';/,
        `import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocFromServer, writeBatch, getDocs } from 'firebase/firestore';`
    );
}

// Replace subscribeToCloudState
const newSubscribe = `
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
        // Don't overwrite rendiciones if they are being fetched from the subcollection
        delete data.rendiciones;
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
`;

content = content.replace(/export function subscribeToCloudState\([\s\S]*?return onSnapshot\([\s\S]*?\n\}/, newSubscribe.trim());


const newSaveToCloud = `
export async function saveToCloud(partialState: CloudStatePayload, forceEmptyRendiciones = false): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_SYSTEM, DOC_STATE);
    const { rendiciones, ...coreState } = partialState;

    // Save core state (everything except rendiciones) to the main document
    if (Object.keys(coreState).length > 0) {
      await setDoc(
        docRef,
        {
          ...coreState,
          lastUpdated: new Date().toISOString(),
        },
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
`;

content = content.replace(/export async function saveToCloud\([\s\S]*?throw error;\n  \}\n\}/, newSaveToCloud.trim());

// We also need to fix fetchBackupRendiciones to pull from the subcollection or return null.
const newFetchBackup = `
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
`;

content = content.replace(/export async function fetchBackupRendiciones\([\s\S]*?return null;\n  \}\n\}/, newFetchBackup.trim());

fs.writeFileSync('src/lib/firebase.ts', content);
