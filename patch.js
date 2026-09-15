import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/setCloudStatus\('error'\);\s*?\}\);/g, "setCloudStatus('error'); showToast('Error', err?.message || 'Error', 'alert'); });");
code = code.replace(/setCloudStatus\('error'\);\s*?\}/g, "setCloudStatus('error'); showToast('Error', 'Sincronizacion rechazada, revise conexión.', 'alert'); }");

fs.writeFileSync('src/App.tsx', code);
