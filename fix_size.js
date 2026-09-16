import fs from 'fs';

let content = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const newSaveToCloudCore = `
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
`;

content = content.replace(/const docData: any = \{[\s\S]*?\{ merge: true \}\n\s*\);\n\s*\}/, newSaveToCloudCore.trim());

fs.writeFileSync('src/lib/firebase.ts', content);
