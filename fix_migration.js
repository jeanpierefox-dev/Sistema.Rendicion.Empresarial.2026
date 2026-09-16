import fs from 'fs';

let content = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const newSaveToCloudCore = `
    // Save core state (everything except rendiciones) to the main document
    // MIGRATION: Only delete rendiciones from the main document IF we are actively saving them to the subcollection right now.
    // Otherwise, we might delete them before they get migrated!
    const docData: any = {
      ...coreState,
      lastUpdated: new Date().toISOString(),
    };
    
    if (rendiciones) {
       docData.rendiciones = deleteField();
    }

    if (Object.keys(coreState).length > 0 || rendiciones) {
      await setDoc(
        docRef,
        docData,
        { merge: true }
      );
    }
`;

content = content.replace(/\/\/\s*Save core state[\s\S]*?\{ merge: true \}\n\s*\);/, newSaveToCloudCore.trim());

fs.writeFileSync('src/lib/firebase.ts', content);
