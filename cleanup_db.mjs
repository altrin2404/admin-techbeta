import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";

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
const db = getFirestore(app);

async function cleanup() {
    try {
        const q = query(collection(db, "registrations"), where("name", "==", "TEST_DUMMY"));
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.size} dummy records to delete.`);
        
        for (const d of querySnapshot.docs) {
            await deleteDoc(doc(db, "registrations", d.id));
            console.log(`Deleted record: ${d.id}`);
        }
    } catch (e) {
        console.error("Cleanup failed:", e);
    }
    process.exit(0);
}

cleanup();
