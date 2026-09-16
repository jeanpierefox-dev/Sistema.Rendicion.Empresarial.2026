import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The earlier regex probably messed up lines. Let's do a direct replacement for lines 275-283
content = content.replace(
  /\(error\) => \{\n\s*console\.warn\('Estado del canal de sincronización Firestore:', error\);\n\s*setCloudStatus\('error'\); showToast\('Error', .*?, 'alert'\); \}\n\s*\);\n\s*\} catch \(e\) \{\n\s*console\.warn\('Error inicializando suscriptor de la nube:', e\);\n\s*setCloudStatus\('error'\); showToast\('Error', .*?, 'alert'\); \}/,
  `(error) => {
          console.warn('Estado del canal de sincronización Firestore:', error);
          setCloudStatus('error'); showToast('Error', error?.message || 'Error de sincronización', 'alert'); }
      );
    } catch (e) {
      console.warn('Error inicializando suscriptor de la nube:', e);
      setCloudStatus('error'); showToast('Error', (e as Error)?.message || 'Error de sincronización', 'alert'); }`
);

fs.writeFileSync('src/App.tsx', content);
