import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    console.log("Fetching doc...");
    const snap = await getDoc(doc(db, 'sistema_rendiciones', 'estado_global'));
    console.log("Success! exists:", snap.exists());
    process.exit(0);
  } catch(e) {
    console.error("FAILED:", e);
    process.exit(1);
  }
}
run();
