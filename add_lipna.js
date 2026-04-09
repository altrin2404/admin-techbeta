import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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

async function addLipna() {
    console.log("Adding participant: A Lipna Thanusha...");
    
    try {
        const registrationData = {
            name: "A Lipna Thanusha",
            email: "lipnalipna639@gmail.com",
            phone: "9566708968",
            college: "DMI engineering college",
            department: "AI DS",
            events: ["VIBE CODING"],
            transactionId: "PAYMENT_INITIATED",
            upiName: "Razorpay Online",
            status: "Verified",
            registrationDate: "2026-04-09T10:59:06.342Z",
            timestamp: serverTimestamp(),
            totalAmount: 20000,
            members: [
                {
                    name: "A Lipna Thanusha",
                    email: "lipnalipna639@gmail.com",
                    phone: "9566708968",
                    college: "DMI engineering college",
                    department: "AI DS",
                    year: "2nd Year",
                    events: ["VIBE CODING"],
                    isVerified: true
                }
            ]
        };
        
        const docRef = await addDoc(collection(db, COLLECTION_NAME), registrationData);
        console.log(`Successfully added: A Lipna Thanusha (ID: ${docRef.id})`);
    } catch (error) {
        console.error("Error adding participant:", error);
    }
    
    console.log("Operation completed!");
    process.exit(0);
}

addLipna();
