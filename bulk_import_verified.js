import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
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
const COLLECTION_NAME = "registrations";

const participants = [
    { name: "Varshaa A.S", dept: "Computer science and engineering", year: "2nd Year", college: "Arunachala college of engineering for women", phone: "9787303940", email: "varshasvam16@gmail.com", events: ["FutureMinds"] },
    { name: "Aswini T", dept: "Electronic and Communication engineering", year: "2nd Year", college: "Arunachala college of engineering for women", phone: "8072709411", email: "aswinithiagarajan2006@gmail.com", events: ["FutureMinds"] },
    { name: "Annet Cathrine A", dept: "IT", year: "1st Year", college: "St.Xavier’s Catholic college of engineering", phone: "9487132510", email: "annetcathrine7@gmail.com", events: ["VIBE CODING"] },
    { name: "Divina sp", dept: "IT", year: "1st Year", college: "St.Xavier's catholic College of engineering,chunankadai", phone: "8056568722", email: "divisp008@gmail.com", events: ["LogoHub"] },
    { name: "Shalu", dept: "IT(Information Technology)", year: "1st Year", college: "St.xavier catholic college of engineering", phone: "6382753097", email: "shalurs2007@gmail.com", events: ["LogoHub"] },
    { name: "Mijoera sm", dept: "IT", year: "1st Year", college: "St.Xavier's catholic College of engineering,chunankadai", phone: "9384733077", email: "mijoeramelooni@gmail.com", events: ["LogoHub"] },
    { name: "Jennifer JV", dept: "Information Technology", year: "1st Year", college: "St Xavier's catholic College of engineering", phone: "8754283494", email: "jenniferjv2025@gmail.com", events: ["LogoHub"] },
    { name: "Sharmiya p m", dept: "IT", year: "1st Year", college: "St.Xavier's catholic college of engineering", phone: "8526046857", email: "sharmiyapm2007@gmail.com", events: ["LogoHub"] },
    { name: "Shajisha.S", dept: "Artificial intelligence and data science", year: "1st Year", college: "St.Xavier's catholic college of engineering", phone: "9578834426", email: "shajisha1310@gmail.com", events: ["FutureMinds"] },
    { name: "Vinothini R", dept: "CSE", year: "2nd Year", college: "Cape institute of technology", phone: "7418119683", email: "vinopanda2526@gmail.com", events: ["VIBE CODING"] },
    { name: "K. Shenbaga Arasi", dept: "Mechanical", year: "1st Year", college: "Anna university regional campus Tirunelveli", phone: "6385933016", email: "arasikannan1707@gmail.com", events: ["LogoHub"] },
    { name: "P Akshitha", dept: "Information Technology", year: "2nd Year", college: "CAPE Institute Of Technology", phone: "7904096579", email: "akshi464413@gmail.com", events: ["VIBE CODING"] },
    { name: "Anndrea 30", dept: "IT", year: "2nd Year", college: "Arunachala college of engineering for women", phone: "9597802079", email: "reya3052006@gmail.com", events: ["Postercraft", "FutureMinds"] }
];

async function bulkImport() {
    console.log("Signing in as Admin...");
    try {
        await signInWithEmailAndPassword(auth, "admin@techbeta2k26.firebaseapp.com", "222324");
        console.log("Logged in!");

        console.log(`Starting import of ${participants.length} participants...`);
        for (const p of participants) {
            const amount = p.events.length * 20000; // 200 RS per event in paise
            const registrationData = {
                name: p.name,
                email: p.email,
                phone: p.phone,
                college: p.college,
                department: p.dept,
                events: p.events,
                transactionId: "ON_SPOT_MANUAL",
                upiName: "On-Spot Verified",
                status: "Verified",
                registrationDate: new Date().toISOString(),
                timestamp: serverTimestamp(),
                totalAmount: amount,
                members: [
                    {
                        name: p.name,
                        email: p.email,
                        phone: p.phone,
                        college: p.college,
                        department: p.dept,
                        year: p.year,
                        events: p.events,
                        isVerified: true
                    }
                ]
            };
            const docRef = await addDoc(collection(db, COLLECTION_NAME), registrationData);
            console.log(`Added Verified: ${p.name} (ID: ${docRef.id})`);
        }
        console.log("Bulk import completed!");
    } catch (e) {
        console.error("Error:", e.message || e);
    }
    process.exit(0);
}

bulkImport();
