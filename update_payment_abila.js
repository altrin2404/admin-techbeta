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
const COLLECTION_NAME = "registrations";
const DOC_ID = "9CPASACC2qFerrFjPknkI";

async function updatePayment() {
    console.log(`Updating payment for Abila (${DOC_ID})...`);
    
    try {
        const docRef = doc(db, COLLECTION_NAME, DOC_ID);
        await updateDoc(docRef, {
            totalAmount: 200
        });
        console.log("Payment updated successfully to 200 RS.");
    } catch (error) {
        console.error("Error updating payment:", error);
    }
    
    process.exit(0);
}

updatePayment();
