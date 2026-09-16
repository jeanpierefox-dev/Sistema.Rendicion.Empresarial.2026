import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Line 271
content = content.replace(
  /\.catch\(\(err\) => \{\n\s*console\.warn\('Advertencia al sembrar datos iniciales en Firestore:', err\);\n\s*setCloudStatus\('error'\); showToast\('Error', .*?, 'alert'\); \}\);/,
  `.catch((err) => {
                  console.warn('Advertencia al sembrar datos iniciales en Firestore:', err);
                  setCloudStatus('error'); showToast('Error', err?.message || 'Error', 'alert'); });`
);

// Line 317
content = content.replace(
  /\} catch \(err\) \{\n\s*console\.warn\('No se pudo sincronizar con Firestore:', err\);\n\s*setCloudStatus\('error'\); showToast\('Error', .*?, 'alert'\); \}/,
  `} catch (err) {
        console.warn('No se pudo sincronizar con Firestore:', err);
        setCloudStatus('error'); showToast('Error', (err as Error)?.message || 'Error de sincronización', 'alert'); }`
);

fs.writeFileSync('src/App.tsx', content);
