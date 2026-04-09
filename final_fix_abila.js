import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyByAKtb64avuvVWHQWu5yDUpCe-DZCAick",
    authDomain: "techbeta2k26.firebaseapp.com",
    projectId: "techbeta2k26",
    storageBucket: "techbeta2k26.firebasestorage.app",
    messagingSenderId: "643189801345",
    appId: "1:643189801345:web:25b0f35155587f8d2b2880",
    measurementId: "G-Z8X5VQGLFV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function finalFix() {
    console.log("Signing in as Admin...");
    try {
        await signInWithEmailAndPassword(auth, "admin@techbeta2k26.firebaseapp.com", "222324");
        console.log("Logged in successfully!");
        
        const docRef = doc(db, "registrations", "9CPASACC2qFerrFjPknkI");
        console.log("Updating Abila's payment to 20000 paise (₹ 200)...");
        
        await updateDoc(docRef, {
            totalAmount: 20000,
            upiName: "Manual Adjustment"
        });
        
        console.log("Success! Payment updated.");
    } catch (e) {
        console.error("Error:", e.message || e);
    }
    process.exit(0);
}

finalFix();
