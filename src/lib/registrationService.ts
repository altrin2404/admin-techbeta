import { db } from "./firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";

export interface TeamMember {
    name: string;
    email: string;
    phone: string;
    college: string;
    department: string;
    year: string;
    events: string[];
    attendance?: { [eventName: string]: { attended: boolean; timestamp: string } };
}

export interface Registration {
    id: string; // Document ID
    name: string; // Team Lead Name
    college: string; // Team Lead College (kept for backward compatibility/indexing)
    department: string; // Team Lead Dept (kept for backward compatibility/indexing)
    email: string; // Team Lead Email
    phone: string; // Team Lead Phone
    members?: TeamMember[]; // Array of team members
    events: string[];
    transactionId: string;
    upiName?: string;
    status: 'Pending Verification' | 'Verified' | 'Rejected';
    registrationDate: string; // ISO String
    timestamp: any; // Firestore server timestamp
}

const COLLECTION_NAME = "registrations";

// Sanitize user input: trim, remove HTML tags, limit length
const sanitizeInput = (value: string, maxLength: number = 200): string => {
    if (!value || typeof value !== 'string') return '';
    return value
        .replace(/<[^>]*>/g, '')   // Remove HTML tags
        .replace(/[<>]/g, '')       // Remove leftover angle brackets
        .trim()
        .substring(0, maxLength);
};

const sanitizeMembers = (members: TeamMember[]): TeamMember[] => {
    return members.map(m => ({
        ...m,
        name: sanitizeInput(m.name, 100),
        email: sanitizeInput(m.email, 100),
        phone: sanitizeInput(m.phone, 15),
        college: sanitizeInput(m.college, 150),
        department: sanitizeInput(m.department, 100),
        year: sanitizeInput(m.year, 20),
        events: (m.events || []).map(e => sanitizeInput(e, 50)),
    }));
};

export const addRegistration = async (data: Omit<Registration, "id" | "status" | "registrationDate" | "timestamp">) => {
    try {
        const sanitizedData = {
            ...data,
            name: sanitizeInput(data.name, 100),
            email: sanitizeInput(data.email, 100),
            phone: sanitizeInput(data.phone, 15),
            college: sanitizeInput(data.college, 150),
            department: sanitizeInput(data.department, 100),
            transactionId: sanitizeInput(data.transactionId, 50),
            upiName: data.upiName ? sanitizeInput(data.upiName, 100) : undefined,
            events: (data.events || []).map(e => sanitizeInput(e, 50)),
            members: data.members ? sanitizeMembers(data.members) : undefined,
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...sanitizedData,
            status: "Pending Verification",
            registrationDate: new Date().toISOString(),
            timestamp: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error adding registration: ", error);
        return { success: false, error };
    }
};

export const subscribeToRegistrations = (callback: (data: Registration[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const registrations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Registration[];
        callback(registrations);
    });
};

export const updateRegistrationStatus = async (id: string, status: string) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { status });
        return { success: true };
    } catch (error) {
        console.error("Error updating status: ", error);
        return { success: false, error };
    }
};

export const deleteRegistration = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true };
    } catch (error) {
        console.error("Error deleting registration: ", error);
        return { success: false, error };
    }
};

export const markMemberAttendance = async (_registrationId: string, _memberIndex: number, _eventName: string, _attended: boolean = true) => {
    try {
        // We need to get the current data to update the specific member in the array
        // However, for efficiency in a live scan, we might want to use a more targeted update if possible
        // But Firestore doesn't easily support updating a specific index in an array without rewriting the array
        // or using some tricks. Since team sizes are small (2-5), rewriting the array is acceptable.

        // This is a helper that would be called after fetching the latest registration data in the component
        // or we fetch it here.
        return { success: false, error: "Use updateRegistrationMembers helper" };
    } catch (error) {
        console.error("Error marking attendance: ", error);
        return { success: false, error };
    }
};

export const updateRegistrationMembers = async (registrationId: string, members: TeamMember[]) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, registrationId);
        await updateDoc(docRef, { members });
        return { success: true };
    } catch (error) {
        console.error("Error updating members: ", error);
        return { success: false, error };
    }
};
