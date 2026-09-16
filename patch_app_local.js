import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const truncateLargeImages = `
    const saved = localStorage.getItem('corpgastos_company');
    if (saved) {
      try {
        const parsed: CompanySettings = JSON.parse(saved);
        if (parsed.logoUrl && parsed.logoUrl.length > 300000) {
           console.warn('Logo too large, clearing to avoid firebase limits');
           parsed.logoUrl = '';
           localStorage.setItem('corpgastos_company', JSON.stringify(parsed));
        }
        return parsed;
`;

content = content.replace(/const saved = localStorage\.getItem\('corpgastos_company'\);\n\s*if \(saved\) \{\n\s*try \{\n\s*const parsed: CompanySettings = JSON\.parse\(saved\);/, truncateLargeImages.trim());

// Also for users avatars
const truncateUsersImages = `
    const saved = localStorage.getItem('corpgastos_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        parsed.forEach(u => {
           if (u.avatar && u.avatar.length > 300000) {
              u.avatar = '';
           }
        });
        localStorage.setItem('corpgastos_users', JSON.stringify(parsed));
        return parsed;
`;

content = content.replace(/const saved = localStorage\.getItem\('corpgastos_users'\);\n\s*if \(saved\) \{\n\s*try \{\n\s*return JSON\.parse\(saved\);/, truncateUsersImages.trim());

fs.writeFileSync('src/App.tsx', content);
