import fs from 'fs';

let content = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf-8');

if (!content.includes('compressImage')) {
  content = content.replace(/import \{ .* \} from 'lucide-react';/, "$&\nimport { compressImage } from '../lib/imageUtils';");
  
  const newUpload = `
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 400, 400, 0.8);
        setPreviewAvatar(base64);
        setFormData((prev) => ({ ...prev, avatar: base64 }));
      } catch (err) {
         console.error(err);
      }
    }
  };
  `;
  
  content = content.replace(/const handleAvatarUpload = \([\s\S]*?reader\.readAsDataURL\(file\);\n\s*\}\n\s*\};/, newUpload.trim());
  fs.writeFileSync('src/components/UserManagementModal.tsx', content);
}
