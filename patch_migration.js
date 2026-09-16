import fs from 'fs';

let content = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

// We will replace the onSnapshot for docRef to support migration
const newOnSnapshot = `
  const unsubscribeMain = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudStatePayload;
        // MIGRATION: If the main document still has rendiciones (from before the 1MB fix),
        // we emit them. The UI will eventually call saveToCloud which will move them 
        // to the subcollection and we can safely delete them from the main doc later.
        if (data.rendiciones && data.rendiciones.length > 0) {
           // Keep it so the app loads them
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
`;

content = content.replace(/const unsubscribeMain = onSnapshot\([\s\S]*?if \(onError\) onError\(error\);\n\s*\}\n\s*\);/, newOnSnapshot.trim());


// We should also delete the rendiciones from the main document when we save to the subcollection to free up space!
const newSaveToCloudCore = `
    // Save core state (everything except rendiciones) to the main document
    // We also explicitly remove rendiciones from the main document to free up the 1MB quota
    await setDoc(
      docRef,
      {
        ...coreState,
        rendiciones: deleteField(),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
`;

// To use deleteField, we must import it.
if (!content.includes('deleteField')) {
    content = content.replace(/getDocs,?\s*\} from 'firebase\/firestore';/, `getDocs, deleteField } from 'firebase/firestore';`);
}

content = content.replace(/\/\/\s*Save core state[\s\S]*?\{ merge: true \}\n\s*\);\n\s*\}/, newSaveToCloudCore.trim());


fs.writeFileSync('src/lib/firebase.ts', content);
