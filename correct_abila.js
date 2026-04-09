import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
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

async function findAndUpdate() {
    try {
        await signInWithEmailAndPassword(auth, "admin@techbeta2k26.firebaseapp.com", "222324");
        console.log("Logged in!");

        const q = query(collection(db, "registrations"), where("name", "==", "A.Abila"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.log("No record found for 'A.Abila'.");
        } else {
            for (const document of snapshot.docs) {
                console.log(`Updating record ${document.id}...`);
                await updateDoc(doc(db, "registrations", document.id), {
                    totalAmount: 20000,
                    upiName: "On-Spot Manual Fix"
                });
                console.log(`Success! Updated ${document.id} to 20000 paise (₹ 200).`);
            }
        }
    } catch (e) {
        console.error("Error:", e.message || e);
    }
    process.exit(0);
}

findAndUpdate();
