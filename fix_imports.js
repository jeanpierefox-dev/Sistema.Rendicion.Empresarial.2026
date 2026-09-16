import fs from 'fs';

const files = [
  'src/components/CompanySettingsModal.tsx',
  'src/components/UserManagementModal.tsx',
  'src/components/UserProfileModal.tsx',
  'src/components/OcrUploadModal.tsx',
  'src/components/EditExpenseModal.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (!content.includes("import { compressImage }")) {
    // find the last import and add it after
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf(';', lastImportIndex);
    
    if (endOfLastImport !== -1) {
       const before = content.slice(0, endOfLastImport + 1);
       const after = content.slice(endOfLastImport + 1);
       content = before + "\nimport { compressImage } from '../lib/imageUtils';\n" + after;
       fs.writeFileSync(file, content);
       console.log("Fixed", file);
    }
  }
}
