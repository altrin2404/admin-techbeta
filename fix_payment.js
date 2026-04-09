import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

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

async function fixPayment() {
    console.log("Updating Abila payment to 200 RS (20000 paise)...");
    try {
        const docRef = doc(db, "registrations", "9CPASACC2qFerrFjPknkI");
        await updateDoc(docRef, {
            totalAmount: 20000
        });
        console.log("Success! Payment updated to 200 RS.");
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

fixPayment();
