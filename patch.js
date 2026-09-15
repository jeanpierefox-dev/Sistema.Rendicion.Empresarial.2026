import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/setCloudStatus\('error'\);\s*showToast\('Error',\s*'Sincronizacion rechazada, revise conexión.',\s*'alert'\);\s*\}/g, "setCloudStatus('error'); showToast('Error', err?.message || 'Error de sincronización', 'alert'); }");
fs.writeFileSync('src/App.tsx', code);
