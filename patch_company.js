import fs from 'fs';

let content = fs.readFileSync('src/components/CompanySettingsModal.tsx', 'utf-8');

if (!content.includes('compressImage')) {
  content = content.replace(/import \{ .* \} from 'lucide-react';/, "$&\nimport { compressImage } from '../lib/imageUtils';");
  
  const newUpload = `
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 400, 400, 0.8);
        setPreviewLogo(base64);
        setFormData((prev) => ({ ...prev, logoUrl: base64 }));
      } catch (error) {
        console.error('Error compressing image:', error);
      }
    }
  };
  `;
  
  content = content.replace(/const handleLogoUpload = \([\s\S]*?reader\.readAsDataURL\(file\);\n\s*\}\n\s*\};/, newUpload.trim());
  fs.writeFileSync('src/components/CompanySettingsModal.tsx', content);
}
