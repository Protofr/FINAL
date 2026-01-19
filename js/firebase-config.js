// Firebase configuration from your provided config.ts
const firebaseConfig = {
  projectId: "studio-827832535-418ad",
  appId: "1:183831292675:web:a42d5fa86a6ed004651736",
  apiKey: "AIzaSyCA1rv5fCUWBRr2p2mh8muB2TZr7mp3FrY",
  authDomain: "studio-827832535-418ad.firebaseapp.com",
  storageBucket: "studio-827832535-418ad.firebasestorage.app",
  measurementId: "",
  messagingSenderId: "183831292675"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();

// Ensure Firebase Auth persists across page reloads / browser restarts
// (LOCAL uses IndexedDB/localStorage, not cookies)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Firebase auth persistence set to LOCAL (will survive reloads/restarts).");
  })
  .catch(err => {
    console.warn("Failed to set auth persistence:", err);
  });

// Export Firebase services globally for use in other JS files
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseFirestore = firestore;
window.firebaseFieldValue = firebase.firestore.FieldValue; // Expose FieldValue for arrayUnion, etc.

console.log("Firebase initialized.");