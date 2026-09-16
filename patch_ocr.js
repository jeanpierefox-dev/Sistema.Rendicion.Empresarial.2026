import fs from 'fs';

let content = fs.readFileSync('src/components/OcrUploadModal.tsx', 'utf-8');

if (!content.includes('compressImage')) {
  content = content.replace(/import \{ .* \} from 'lucide-react';/, "$&\nimport { compressImage } from '../lib/imageUtils';");
  
  const newUpload = `
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    try {
       const base64 = await compressImage(file, 1200, 1200, 0.85);
       setPreviewUrl(base64);
       triggerOcrProcessing(base64, file.type);
    } catch(err) {
       console.error(err);
    }
  };
  `;
  
  content = content.replace(/const handleFileChange = \([\s\S]*?reader\.readAsDataURL\(file\);\n\s*\};/, newUpload.trim());
  fs.writeFileSync('src/components/OcrUploadModal.tsx', content);
}

let content2 = fs.readFileSync('src/components/EditExpenseModal.tsx', 'utf-8');

if (!content2.includes('compressImage')) {
  content2 = content2.replace(/import \{ .* \} from 'lucide-react';/, "$&\nimport { compressImage } from '../lib/imageUtils';");
  
  const newUpload2 = `
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 1200, 1200, 0.85);
        setPreviewUrl(base64);
        setFormData((prev) => ({ ...prev, comprobanteUrl: base64 }));
      } catch (err) {
        console.error(err);
      }
    }
  };
  `;
  
  content2 = content2.replace(/const handleFileChange = \([\s\S]*?reader\.readAsDataURL\(file\);\n\s*\}\n\s*\};/, newUpload2.trim());
  fs.writeFileSync('src/components/EditExpenseModal.tsx', content2);
}

