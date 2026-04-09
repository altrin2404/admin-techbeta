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

const participant = {
    name: "A.Abila",
    email: "abila6902@gmail.com",
    phone: "7358410822",
    college: "Arunachala College of Engineering for Women",
    department: "B.Tech IT",
    year: "2nd Year",
    events: ["FutureMinds", "Postercraft"]
};

async function importAbila() {
    console.log(`Starting import for ${participant.name}...`);
    
    try {
        const registrationData = {
            name: participant.name,
            email: participant.email,
            phone: participant.phone,
            college: participant.college,
            department: participant.department,
            events: participant.events,
            transactionId: "ON_SPOT_PAYMENT",
            upiName: "On-Spot Registration",
            status: "Pending Verification",
            registrationDate: new Date().toISOString(),
            timestamp: serverTimestamp(),
            totalAmount: 0, 
            members: [
                {
                    name: participant.name,
                    email: participant.email,
                    phone: participant.phone,
                    college: participant.college,
                    department: participant.department,
                    year: participant.year,
                    events: participant.events,
                    isVerified: false
                }
            ]
        };
        
        const docRef = await addDoc(collection(db, COLLECTION_NAME), registrationData);
        console.log(`Added: ${participant.name} (ID: ${docRef.id})`);
    } catch (error) {
        console.error(`Error adding ${participant.name}:`, error);
    }
    
    console.log("Import completed!");
    process.exit(0);
}

importAbila();
