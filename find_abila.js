import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

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
const COLLECTION_NAME = "registrations";

async function findAbila() {
    console.log("Searching for A.Abila...");
    try {
        const q = query(collection(db, COLLECTION_NAME), where("name", "==", "A.Abila"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log("No record found with name 'A.Abila'.");
        } else {
            querySnapshot.forEach((doc) => {
                console.log(`Found ID: ${doc.id}`);
                console.log("Data:", JSON.stringify(doc.data(), null, 2));
            });
        }
    } catch (error) {
        console.error("Error searching:", error);
    }
    process.exit(0);
}

findAbila();
