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

const participants = [
    {
        name: "Ebishin.R",
        email: "ebishinr0402@gmail.com",
        phone: "9344107720",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["VIBE CODING"]
    },
    {
        name: "ASWINTH. R",
        email: "ashaswinth007@gmail.com",
        phone: "9042572763",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["VIBE CODING"]
    },
    {
        name: "Akshay.s.v",
        email: "svakshayakshay@gmail.com",
        phone: "8903937516",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["VIBE CODING"]
    },
    {
        name: "Dharshana T.S",
        email: "dharshanats5@gmail.com",
        phone: "8438041319",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["VIBE CODING"]
    },
    {
        name: "Abina T",
        email: "abinaarun06@gmail.com",
        phone: "6382768463",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["VIBE CODING"]
    },
    {
        name: "Abishek K S",
        email: "abishekks686@gmail.com",
        phone: "9360767330",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["VIBE CODING"]
    },
    {
        name: "Kirubha J Wilson",
        email: "funaann084@gmail.com",
        phone: "9442055847",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["FutureMinds", "PromptStorm", "VIBE CODING"]
    },
    {
        name: "Auslin Rijo",
        email: "rr5027475@gmail.com",
        phone: "7604968028",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["VIBE CODING"]
    },
    {
        name: "Atharsh.s.v",
        email: "atharshsv1@gmail.com",
        phone: "9345688293",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["VIBE CODING"]
    },
    {
        name: "Jerlin Sharon.J",
        email: "jerlinsharon.j@gmail.com",
        phone: "8122088185",
        college: "Marthandam College of Engineering and Technology",
        department: "Computer Science and Engineering",
        year: "3rd Year",
        events: ["FutureMinds"]
    },
    {
        name: "R.R.Ramya",
        email: "ramyaramya15082005@gmail.com",
        phone: "8220785941",
        college: "MACET",
        department: "CSE",
        year: "3rd Year",
        events: ["VIBE CODING"]
    }
];

async function importParticipants() {
    console.log(`Starting import of ${participants.length} participants...`);
    
    for (const p of participants) {
        try {
            const registrationData = {
                name: p.name,
                email: p.email,
                phone: p.phone,
                college: p.college,
                department: p.department,
                events: p.events,
                transactionId: "ON_SPOT_PAYMENT",
                upiName: "On-Spot Registration",
                status: "Pending Verification",
                registrationDate: new Date().toISOString(),
                timestamp: serverTimestamp(),
                totalAmount: 0, // Admin will confirm final amount
                members: [
                    {
                        name: p.name,
                        email: p.email,
                        phone: p.phone,
                        college: p.college,
                        department: p.department,
                        year: p.year,
                        events: p.events,
                        isVerified: false
                    }
                ]
            };
            
            const docRef = await addDoc(collection(db, COLLECTION_NAME), registrationData);
            console.log(`Added: ${p.name} (ID: ${docRef.id})`);
        } catch (error) {
            console.error(`Error adding ${p.name}:`, error);
        }
    }
    
    console.log("Import completed!");
    process.exit(0);
}

importParticipants();
