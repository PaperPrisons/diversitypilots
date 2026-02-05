// scripts/firebase.js
// Initialize Firebase (Compat SDK). Replace the config below with your Firebase project settings.
// Get config from: Firebase Console → Project Settings → Your apps → Firebase SDK snippet (Config).

(function(){
  if (window.firebaseInitialized) return;

  const firebaseConfig = {
    apiKey: "AIzaSyCgZXZlsj6phh-P8h2HMXYRX3yNH9-FQ90",
  authDomain: "diversitypilots-6eaa2.firebaseapp.com",
  projectId: "diversitypilots-6eaa2",
  storageBucket: "diversitypilots-6eaa2.firebasestorage.app",
  messagingSenderId: "755498707275",
  appId: "1:755498707275:web:b89b60443069dc428b60ce",
  measurementId: "G-KS4MYHE4ZD"
  };

  try {
    window.firebaseApp = firebase.initializeApp(firebaseConfig);
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();
    window.firebaseStorage = firebase.storage();
    window.firebaseInitialized = true;
    console.log('[Firebase] initialized');
  } catch (e) {
    console.error('[Firebase] init failed:', e);
  }
})();
