import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const truncateSurplusImages = `
    const saved = localStorage.getItem('corpgastos_surplus_expenses');
    if (saved) {
      try {
        const parsed: SurplusExpenseItem[] = JSON.parse(saved);
        parsed.forEach(s => {
           if (s.comprobanteUrl && s.comprobanteUrl.length > 300000) {
              s.comprobanteUrl = '';
           }
        });
        localStorage.setItem('corpgastos_surplus_expenses', JSON.stringify(parsed));
        return parsed;
`;

content = content.replace(/const saved = localStorage\.getItem\('corpgastos_surplus_expenses'\);\n\s*if \(saved\) \{\n\s*try \{\n\s*return JSON\.parse\(saved\);/, truncateSurplusImages.trim());

fs.writeFileSync('src/App.tsx', content);
