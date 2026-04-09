import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
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

async function findCorrectAbila() {
    console.log("Signing in as Admin...");
    try {
        await signInWithEmailAndPassword(auth, "admin@techbeta2k26.firebaseapp.com", "222324");
        console.log("Logged in!");

        console.log("Searching for 'A.Abila'...");
        const q = query(collection(db, "registrations"), where("name", "==", "A.Abila"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.log("Not found with 'A.Abila'. Trying 'Abila'...");
            const q2 = query(collection(db, "registrations"), where("name", ">=", "Abila"), where("name", "<=", "Abila\uf8ff"));
            const s2 = await getDocs(q2);
            if (s2.empty) {
                console.log("No Abila found at all.");
            } else {
                s2.forEach(doc => console.log(`Found: ${doc.id} - ${doc.data().name}`));
            }
        } else {
            snapshot.forEach(doc => console.log(`Found: ${doc.id} - ${doc.data().name}`));
        }
    } catch (e) {
        console.error("Error:", e.message || e);
    }
    process.exit(0);
}

findCorrectAbila();
