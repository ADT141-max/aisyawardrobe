import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyAtiK53dCj69ec0BRCwz4uJNuCAsV9dlUE",
  authDomain: "aisyawardrobe01.firebaseapp.com",
  projectId: "aisyawardrobe01",
  storageBucket: "aisyawardrobe01.firebasestorage.app",
  messagingSenderId: "87038023584",
  appId: "1:87038023584:web:bb193e8cb3f4970bcd76c5",
  measurementId: "G-M28EY2ZYDG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const dbFirestore = getFirestore(app);

// Optimasi Tagihan Server: Simpan data di Cache Lokal HP/Laptop
enableIndexedDbPersistence(dbFirestore).catch((err) => {
  console.warn("Fitur penghematan cache lokal gagal dimuat:", err.code);
});

// Ekstraksi ID Murni agar lolos dari Firebase Security Rules & SDK Segments Error
export const getDocRef = () => {
    let rawAppId = 'aisya-wardrobe-core';
    if (typeof window !== 'undefined' && window.__app_id) {
        rawAppId = window.__app_id;
    } else if (typeof __app_id !== 'undefined') {
        rawAppId = __app_id;
    }
    
    // Potong ID hanya pada bagian utamanya (sebelum tanda garis miring / filepath)
    const cleanAppId = String(rawAppId).split('/')[0];
    
    return doc(dbFirestore, 'artifacts', cleanAppId, 'public', 'data', 'aisya_database', 'main_state');
};