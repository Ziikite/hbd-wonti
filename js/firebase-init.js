const firebaseConfig = {
  apiKey: "AIzaSyD3yKfoyGX9ez7Otxo106SdRq1cH8sZqmw",
  authDomain: "wonti-f6c61.firebaseapp.com",
  projectId: "wonti-f6c61",
  storageBucket: "wonti-f6c61.firebasestorage.app",
  messagingSenderId: "223297037043",
  appId: "1:223297037043:web:e23b8fd996ecc6329c4d86",
  measurementId: "G-N01QVY94FC"
};

firebase.initializeApp(firebaseConfig);
const db      = firebase.firestore();
const storage = firebase.storage();
