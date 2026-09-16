import fs from 'fs';

let content = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const newOnSnapshot = `
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
`;

content = content.replace(/const unsubscribeMain = onSnapshot\([\s\S]*?if \(onError\) onError\(error\);\n\s*\}\n\s*\);/, newOnSnapshot.trim());

fs.writeFileSync('src/lib/firebase.ts', content);
