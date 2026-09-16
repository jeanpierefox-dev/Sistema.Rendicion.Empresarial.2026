import fs from 'fs';

let content = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

// Replace imports to include writeBatch, collection, getDocs
content = content.replace(
  /import \{\s*getFirestore,\s*doc,\s*setDoc,\s*getDoc,\s*onSnapshot,\s*collection,\s*getDocFromServer,\s*writeBatch,?\s*\} from 'firebase\/firestore';/,
  `import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  getDocFromServer,
  writeBatch,
  getDocs,
} from 'firebase/firestore';`
);

fs.writeFileSync('src/lib/firebase.ts', content);
