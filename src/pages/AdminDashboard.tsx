import { useState, useEffect, useMemo } from "react";
import {
    LogOut, ShieldCheck, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import ExcelJS from "exceljs"; // moved to dynamic import
import QRCode from "qrcode";
import { showToast } from "@/lib/showToast";
import {
    subscribeToRegistrations,
    updateRegistrationStatus,
    deleteRegistration,
    type Registration,
    type TeamMember
} from "@/lib/registrationService";
import { sendVerificationEmail } from "@/lib/emailService";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import QRScannerDialog from "@/components/QRScannerDialog";
import PINVerificationDialog from "@/components/PINVerificationDialog";
import { useDebounce } from "@/hooks/use-debounce";

// Lazy Loaded Components for Performance
import AdminLogin from "@/components/admin/AdminLogin";
import AdminMainDashboard from "@/components/admin/AdminMainDashboard";
import AdminAttendanceMode from "@/components/admin/AdminAttendanceMode";
import AdminGeneralAttendance from "@/components/admin/AdminGeneralAttendance";

const ADMIN_EMAIL_DOMAIN = "techbeta2k26.firebaseapp.com";

const ALLOWED_EVENTS = ["FutureMinds", "Webfusion", "PromptStorm", "Postercraft", "LogoHub", "VIBE CODING"];

const AdminDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginPin, setLoginPin] = useState("");
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [adminMode, setAdminMode] = useState<'none' | 'dashboard' | 'attendance' | 'event-attendance'>('none');
    const [activeEvent, setActiveEvent] = useState<string>("");
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFilter, setSearchFilter] = useState("all");

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [recentScans, setRecentScans] = useState<{ name: string, event: string, status: 'success' | 'error', time: string, message: string }[]>([]);
    const [scannedParticipant, setScannedParticipant] = useState<Registration | null>(null);
    const [scannedMemberIndex, setScannedMemberIndex] = useState<number>(-1);

    const [pinDialog, setPinDialog] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onVerified: () => void;
    }>({
        isOpen: false,
        title: "",
        description: "",
        onVerified: () => { }
    });

    useEffect(() => {
        let unsubscribeFirestore: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
            setIsAuthLoading(false);

            if (user) {
                unsubscribeFirestore = subscribeToRegistrations((data) => {
                    setRegistrations(data);
                });
            } else {
                if (unsubscribeFirestore) {
                    unsubscribeFirestore();
                    unsubscribeFirestore = null;
                }
                setRegistrations([]);
                setAdminMode('none');
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
        };
    }, []);

    const handleLogin = async (username: string, password: string, mode: 'dashboard' | 'attendance' | 'event-attendance') => {
        setIsLoginLoading(true);
        try {
            const email = `${username}@${ADMIN_EMAIL_DOMAIN}`;
            await signInWithEmailAndPassword(auth, email, password);
            setLoginPin(password);
            setAdminMode(mode);
            let modeTitle = "Dashboard";
            if (mode === 'attendance') modeTitle = "Attendance";
            if (mode === 'event-attendance') modeTitle = "Event Attendance";
            showToast.success(`Login Successful: ${modeTitle}`);
        } catch (error: any) {
            console.error("Login error:", error);
            const code = error?.code || "unknown";
            showToast.error(`Login failed: ${code}`);
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setLoginPin("");
        setAdminMode('none');
    };

    // registrations arrive from Firestore as desc (newest first);
    // reversing gives oldest-first order for Excel serial numbers.
    // By default, only include Verified and Pending Verification — exclude Payment Initiated (drafts).
    const getChronologicalFilteredRegistrations = (list?: Registration[]) => (list || filteredRegistrations)
        .slice() // create a copy before reverse
        .reverse();

    const updateStatus = async (id: string, newStatus: string) => {
        const result = await updateRegistrationStatus(id, newStatus);
        if (result.success) {
            showToast.success(`Status updated to ${newStatus}`);
            if (newStatus === "Verified") {
                const participant = registrations.find(r => r.id === id);
                console.log("Updating status to Verified for participant:", participant);
                if (participant) {
                    const membersToNotify = participant.members || [{
                        name: participant.name, email: participant.email, phone: participant.phone, college: participant.college, department: participant.department, year: (participant as any).year, events: participant.events
                    }];
                    const isMultiple = membersToNotify.length > 1;
                    showToast.info(isMultiple ? "Sending verification emails" : "Sending verification email", isMultiple ? `Delivering to ${membersToNotify.length} members of ${participant.name}'s team...` : `Delivering to ${membersToNotify[0].name}...`);
                    console.log("Final notify list:", membersToNotify);
                    let successCount = 0;
                    for (let i = 0; i < membersToNotify.length; i++) {
                        const m = membersToNotify[i];
                        const qrData = JSON.stringify({ id: participant.id, index: i, name: m.name, events: m.events });
                        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
                        console.log(`Sending email to ${m.name} (${m.email}) with index ${i}`);
                        const emailResult = await sendVerificationEmail(m.name, m.email, participant.transactionId, qrCodeUrl);
                        console.log(`Email result for ${m.name}:`, emailResult);
                        if (emailResult.success) successCount++;
                        await new Promise(r => setTimeout(r, 800));
                    }
                    if (successCount === membersToNotify.length) {
                        showToast.success(isMultiple ? "All emails sent" : "Email sent", isMultiple ? `${successCount} verification emails delivered successfully.` : `Verification email delivered to ${membersToNotify[0].name}.`);
                    } else {
                        showToast.error("Some emails failed", `${successCount} of ${membersToNotify.length} emails sent. Please retry the failed ones.`);
                    }
                    console.log(`Email sending process complete: ${successCount} successful.`);
                } else {
                    console.error("Participant not found in state after status update!");
                }
            }
        } else {
            showToast.error("Failed to update status");
        }
    };

    const verifyMember = async (id: string, memberIndex: number) => {
        const participant = registrations.find(r => r.id === id);
        if (!participant) return;

        const members = participant.members || [{
            name: participant.name, email: participant.email, phone: participant.phone,
            college: participant.college, department: participant.department, year: (participant as any).year,
            events: participant.events, isVerified: participant.status === "Verified"
        }];

        const member = members[memberIndex];
        if (member.isVerified) {
            showToast.info("Participant is already verified");
            return;
        }

        const updatedMembers = [...members];
        updatedMembers[memberIndex] = { ...member, isVerified: true };

        // Always use updateRegistrationMembers
        const result = await import('@/lib/registrationService').then(m => m.updateRegistrationMembers(id, updatedMembers));

        if (result.success) {
            showToast.success(`Verified ${member.name}`);

            if (participant.status !== "Verified") {
                updateRegistrationStatus(id, "Verified");
            }

            const qrData = JSON.stringify({ id: participant.id, index: memberIndex, name: member.name, events: member.events });
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

            showToast.info("Sending verification email", `Delivering to ${member.name}...`);
            const emailResult = await sendVerificationEmail(member.name, member.email, participant.transactionId, qrCodeUrl);
            if (emailResult.success) {
                showToast.success("Email sent", `Verification email delivered to ${member.name}.`);
            } else {
                showToast.error("Email failed", `Failed to send email to ${member.name}.`);
            }
        } else {
            showToast.error("Failed to verify participant");
        }
    };

    const handleDelete = async (id: string, memberIndex?: number) => {
        const executeDelete = async () => {
            if (!window.confirm("Are you sure you want to delete this participant? This action cannot be undone.")) return;

            if (memberIndex !== undefined) {
                const reg = registrations.find(r => r.id === id);
                if (reg && reg.members && reg.members.length > 1) {
                    const updatedMembers = [...reg.members];
                    updatedMembers.splice(memberIndex, 1);
                    const result = await import('@/lib/registrationService').then(m => m.updateRegistrationMembers(id, updatedMembers));
                    if (result.success) {
                        showToast.success("Participant removed successfully");
                    } else {
                        showToast.error("Failed to remove participant");
                    }
                    return;
                }
            }

            const result = await deleteRegistration(id);
            if (result.success) {
                showToast.success("Registration deleted successfully");
            } else {
                showToast.error("Failed to delete registration");
            }
        };

        setPinDialog({
            isOpen: true,
            title: "Confirm Deletion",
            description: "Deleting a participant requires admin authorization.",
            onVerified: executeDelete
        });
    };

    const exportAllParticipantsExcel = async () => {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("All Participants");

        worksheet.columns = [
            { header: "QR Code", key: "qr", width: 15 },
            { header: "S.No", key: "sno", width: 10 },
            { header: "Name", key: "name", width: 20 },
            { header: "Dept", key: "department", width: 15 },
            { header: "Year", key: "year", width: 10 },
            { header: "College", key: "college", width: 25 },
            { header: "Phone", key: "phone", width: 15 },
            { header: "Email", key: "email", width: 30 },
            { header: "Events", key: "events", width: 40 },
            { header: "Status", key: "status", width: 15 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        showToast.info("Generating All Participants report...");

        // Use currently filtered registrations, reversed for oldest-first S.No
        const sortedRegistrations = getChronologicalFilteredRegistrations();

        let snoCounter = 1;
        for (const reg of sortedRegistrations) {
            const members = reg.members || [{
                name: reg.name, department: reg.department, year: (reg as any).year, college: reg.college, phone: reg.phone, email: reg.email, events: reg.events
            }];

            for (let i = 0; i < members.length; i++) {
                const m = members[i];
                const row = worksheet.addRow({
                    sno: snoCounter++,
                    name: m.name,
                    department: m.department,
                    year: m.year || "N/A",
                    college: m.college,
                    phone: m.phone,
                    email: m.email,
                    events: Array.isArray(m.events) ? m.events.filter((e: string) => ALLOWED_EVENTS.includes(e)).join("; ") : (ALLOWED_EVENTS.includes(m.events) ? m.events : ""),
                    status: reg.status
                });

                row.height = 80;
                row.alignment = { vertical: 'middle' };

                try {
                    const qrData = JSON.stringify({ id: reg.id, index: i, name: m.name, events: m.events });
                    const dataUrl = await QRCode.toDataURL(qrData, { width: 150, margin: 0 });
                    const base64 = dataUrl.split(',')[1];

                    const imageId = workbook.addImage({
                        base64: base64,
                        extension: 'png',
                    });

                    worksheet.addImage(imageId, {
                        tl: { col: 0.1, row: row.number - 0.95 },
                        ext: { width: 100, height: 100 }
                    });
                } catch (error) {
                    console.error(`QR embedding failed for ${m.name}:`, error);
                    row.getCell('qr').value = 'QR Failed';
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `techbeta_all_participants.xlsx`;
        a.click();
        showToast.success("Excel report exported!");
    };

    const exportMasterExcel = async (includeAttendance: boolean = false) => {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        const allEvents = Array.from(new Set(filteredRegistrations.flatMap(reg =>
            reg.members ? reg.members.flatMap(m => m.events || []) : (reg.events || [])
        ))).filter((e: string) => ALLOWED_EVENTS.includes(e)).sort();

        showToast.info(`Generating ${includeAttendance ? 'Attendance Sheets' : 'Master Sheets'}...`);

        for (const eventName of allEvents) {
            // Clean sheet name (max 31 chars, no special chars)
            const sheetName = eventName.substring(0, 31).replace(/[\\/?*[\]]/g, "");
            const worksheet = workbook.addWorksheet(sheetName);

            const columns = [
                { header: "QR Code", key: "qr", width: 15 },
                { header: "S.No", key: "sno", width: 10 },
                { header: "Name", key: "name", width: 25 },
                { header: "Dept", key: "department", width: 20 },
                { header: "College", key: "college", width: 30 },
                { header: "Phone", key: "phone", width: 20 },
                { header: "Email", key: "email", width: 35 }
            ];

            if (includeAttendance) {
                columns.push({ header: "Attendance", key: "attendance", width: 25 });
            }

            worksheet.columns = columns;

            // Style header row
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 25;
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1E40AF' }
                };
            });

            let snoCounter = 1;

            const sortedRegistrations = getChronologicalFilteredRegistrations();

            for (const reg of sortedRegistrations) {
                const members = reg.members || [{
                    name: reg.name, 
                    email: reg.email, 
                    phone: reg.phone, 
                    college: reg.college, 
                    department: reg.department, 
                    events: reg.events, 
                    attendance: (reg as any).attendance, 
                    participationType: (reg as any).participationType,
                    teamName: (reg as any).teamName
                }] as any[];

                const isTeamGroupedEvent = ["FutureMinds", "Postercraft"].includes(eventName);

                if (isTeamGroupedEvent) {
                    const teamsMap = new Map<string, any[]>();
                    const individuals: any[] = [];

                    for (const m of members) {
                        const participation = (Array.isArray(m.events) ? m.events : [m.events]).includes(eventName);
                        if (!participation) continue;

                        const type = m.participationType?.[eventName];
                        const tName = m.teamName?.[eventName];

                        if (type === "Team" && tName) {
                            if (!teamsMap.has(tName)) {
                                teamsMap.set(tName, []);
                            }
                            teamsMap.get(tName)!.push(m);
                        } else {
                            individuals.push(m);
                        }
                    }

                    for (const [tName, teamMembers] of teamsMap.entries()) {
                        const rowData: any = {
                            sno: snoCounter++,
                            name: `${tName}: ${teamMembers.map(m => m.name).join(", ")}`,
                            department: Array.from(new Set(teamMembers.map(m => m.department))).join(", "),
                            college: teamMembers[0].college,
                            phone: teamMembers.map(m => m.phone).join(", "),
                            email: teamMembers.map(m => m.email).join(", ")
                        };

                        if (includeAttendance) {
                            rowData.attendance = teamMembers.map(m => {
                                const info = m.attendance?.[eventName];
                                return info?.attended ? `${m.name}: P` : `${m.name}: A`;
                            }).join(" | ");
                        }

                        const row = worksheet.addRow(rowData);
                        row.height = 100;
                        row.alignment = { vertical: 'middle', wrapText: true };
                        
                        worksheet.getColumn('qr').width = Math.max(worksheet.getColumn('qr').width || 15, teamMembers.length * 15);

                        for (let t = 0; t < teamMembers.length; t++) {
                            const tm = teamMembers[t];
                            const originalIndex = reg.members ? reg.members.findIndex(member => member.name === tm.name) : t;
                            
                            try {
                                const qrData = JSON.stringify({ id: reg.id, index: originalIndex, name: tm.name, events: tm.events });
                                const dataUrl = await QRCode.toDataURL(qrData, { width: 150, margin: 0 });
                                const base64 = dataUrl.split(',')[1];
                                const imageId = workbook.addImage({ base64, extension: 'png' });
                                
                                worksheet.addImage(imageId, {
                                    tl: { col: (t / teamMembers.length) + 0.02, row: row.number - 0.95 },
                                    ext: { width: 90, height: 90 }
                                });
                            } catch (error) {
                                console.error(`QR embedding failed for ${tm.name}:`, error);
                            }
                        }
                    }

                    for (const m of individuals) {
                        const rowData: any = { sno: snoCounter++, name: m.name, department: m.department, college: m.college, phone: m.phone, email: m.email };
                        if (includeAttendance) {
                            const info = m.attendance?.[eventName];
                            rowData.attendance = info?.attended ? `Present (${new Date(info.timestamp).toLocaleTimeString()})` : "Absent";
                        }
                        const row = worksheet.addRow(rowData);
                        row.height = 80;
                        row.alignment = { vertical: 'middle' };
                        try {
                            const originalIndex = reg.members ? reg.members.findIndex(member => member.name === m.name) : 0;
                            const qrData = JSON.stringify({ id: reg.id, index: originalIndex, name: m.name, events: m.events });
                            const dataUrl = await QRCode.toDataURL(qrData, { width: 150, margin: 0 });
                            const base64 = dataUrl.split(',')[1];
                            const imageId = workbook.addImage({ base64, extension: 'png' });
                            worksheet.addImage(imageId, {
                                tl: { col: 0.1, row: row.number - 0.95 },
                                ext: { width: 90, height: 90 }
                            });
                        } catch (error) {
                            row.getCell('qr').value = 'QR Failed';
                        }
                    }
                } else {
                    const participating = members.filter((m: any) => (Array.isArray(m.events) ? m.events : [m.events]).includes(eventName));
                    if (participating.length > 0) {
                        for (const m of participating) {
                            const originalIndex = reg.members ? reg.members.findIndex(member => member.name === m.name) : 0;
                            const attendanceInfo = m.attendance?.[eventName];
                            const rowData: any = { sno: snoCounter++, name: m.name, department: m.department, college: m.college, phone: m.phone, email: m.email };
                            if (includeAttendance) {
                                rowData.attendance = attendanceInfo?.attended ? `Present (${new Date(attendanceInfo.timestamp).toLocaleTimeString()})` : "Absent";
                            }
                            const row = worksheet.addRow(rowData);
                            row.height = 80;
                            row.alignment = { vertical: 'middle' };
                            try {
                                const qrData = JSON.stringify({ id: reg.id, index: originalIndex, name: m.name, events: m.events });
                                const dataUrl = await QRCode.toDataURL(qrData, { width: 150, margin: 0 });
                                const base64 = dataUrl.split(',')[1];
                                const imageId = workbook.addImage({ base64, extension: 'png' });
                                worksheet.addImage(imageId, {
                                    tl: { col: 0.1, row: row.number - 0.95 },
                                    ext: { width: 90, height: 90 }
                                });
                            } catch (error) {
                                row.getCell('qr').value = 'QR Failed';
                            }
                        }
                    }
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = includeAttendance ? `techbeta_attendance_sheets.xlsx` : `techbeta_master_sheets.xlsx`;
        a.click();
        showToast.success(includeAttendance ? "Attendance sheets exported!" : "Master sheets exported!");
    };

    const exportGeneralAttendanceExcel = async () => {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("General Attendance");
        const ATTENDANCE_KEY = "General";

        worksheet.columns = [
            { header: "QR Code", key: "qr", width: 15 },
            { header: "S.No", key: "sno", width: 10 },
            { header: "Name", key: "name", width: 25 },
            { header: "Dept", key: "department", width: 20 },
            { header: "College", key: "college", width: 30 },
            { header: "Phone", key: "phone", width: 20 },
            { header: "Email", key: "email", width: 35 },
            { header: "Status", key: "status", width: 15 },
            { header: "Check-in Time", key: "time", width: 25 }
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2563EB' } // Blue theme for general
            };
        });

        showToast.info("Generating General Attendance report...");

        // Use currently filtered registrations, reversed for oldest-first S.No
        const sortedRegistrations = getChronologicalFilteredRegistrations();

        let snoCounter = 1;
        for (const reg of sortedRegistrations) {
            const members = reg.members || [{
                name: reg.name, department: reg.department, college: reg.college, phone: reg.phone, email: reg.email, events: reg.events, attendance: (reg as any).attendance
            }];

            for (let i = 0; i < members.length; i++) {
                const m = members[i];
                const attendanceInfo = m.attendance?.[ATTENDANCE_KEY];
                
                const row = worksheet.addRow({
                    sno: snoCounter++,
                    name: m.name,
                    department: m.department,
                    college: m.college,
                    phone: m.phone,
                    email: m.email,
                    status: attendanceInfo?.attended ? "Present" : "Absent",
                    time: attendanceInfo?.attended ? new Date(attendanceInfo.timestamp).toLocaleString() : "N/A"
                });

                row.height = 80;
                row.alignment = { vertical: 'middle' };

                try {
                    const qrData = JSON.stringify({ id: reg.id, index: i, name: m.name, events: m.events });
                    const dataUrl = await QRCode.toDataURL(qrData, { width: 150, margin: 0 });
                    const base64 = dataUrl.split(',')[1];

                    const imageId = workbook.addImage({
                        base64: base64,
                        extension: 'png',
                    });

                    worksheet.addImage(imageId, {
                        tl: { col: 0.1, row: row.number - 0.95 },
                        ext: { width: 90, height: 90 }
                    });
                } catch (error) {
                    console.error(`QR embedding failed for ${m.name}:`, error);
                    row.getCell('qr').value = 'QR Failed';
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `techbeta_general_attendance.xlsx`;
        a.click();
        showToast.success("General attendance report exported!");
    };

    const handleMarkAttendance = async (participantId: string, memberIndex: number, eventName: string) => {
        try {
            const participant = registrations.find(r => r.id === participantId);
            if (!participant || !participant.members) return;

            const updatedMembers = [...participant.members];
            if (!updatedMembers[memberIndex].attendance?.[eventName]?.attended) {
                updatedMembers[memberIndex] = {
                    ...updatedMembers[memberIndex],
                    attendance: {
                        ...updatedMembers[memberIndex].attendance,
                        [eventName]: { attended: true, timestamp: new Date().toISOString() }
                    }
                };
                const { updateRegistrationMembers } = await import("@/lib/registrationService");
                await updateRegistrationMembers(participant.id, updatedMembers);
                showToast.success(`Attendance marked: ${updatedMembers[memberIndex].name}`);
                setRecentScans(prev => [{
                    name: updatedMembers[memberIndex].name,
                    event: eventName,
                    status: 'success' as const,
                    time: new Date().toLocaleTimeString(),
                    message: 'Present'
                }, ...prev].slice(0, 5));
                setScannedParticipant(null);
                setScannedMemberIndex(-1);
            }
        } catch (error) {
            console.error("Failed to mark attendance:", error);
            showToast.error("Failed to mark attendance");
        }
    };

    const handleRemoveAttendance = async (participantId: string, memberIndex: number, eventName: string) => {
        const executeRemove = async () => {
            try {
                const participant = registrations.find(r => r.id === participantId);
                if (!participant || !participant.members) return;

                const updatedMembers = [...participant.members];
                if (updatedMembers[memberIndex].attendance?.[eventName]) {
                    const newAttendance = { ...updatedMembers[memberIndex].attendance };
                    delete newAttendance[eventName];

                    updatedMembers[memberIndex] = {
                        ...updatedMembers[memberIndex],
                        attendance: newAttendance
                    };

                    const { updateRegistrationMembers } = await import("@/lib/registrationService");
                    await updateRegistrationMembers(participant.id, updatedMembers);
                    showToast.success(`Attendance removed: ${updatedMembers[memberIndex].name}`);
                }
            } catch (error) {
                console.error("Failed to remove attendance:", error);
                showToast.error("Failed to remove attendance");
            }
        };

        setPinDialog({
            isOpen: true,
            title: "Remove Attendance",
            description: `Authorizing removal of attendance for ${eventName}.`,
            onVerified: executeRemove
        });
    };

    const handleScan = async (decodedText: string) => {
        try {
            const data = JSON.parse(decodedText);
            if (!data.id) throw new Error("Invalid QR format");
            const participant = registrations.find(r => r.id === data.id);
            if (!participant) throw new Error("Participant not found");

            setScannedParticipant(participant);
            if (data.index !== undefined) setScannedMemberIndex(data.index);

            if (participant.status !== "Verified") {
                showToast.error("Payment not verified!");
                return;
            }

            if (adminMode === 'attendance' || adminMode === 'event-attendance') {
                setIsScannerOpen(false); // Close scanner on successful read
                if (activeEvent) {
                    const member = participant.members ? participant.members[data.index] : null;
                    if (member) {
                        const memberEvents = Array.isArray(member.events) ? member.events : [member.events];
                        if (!memberEvents.includes(activeEvent)) {
                            showToast.error(`${member.name} is not registered for ${activeEvent}`);
                            setRecentScans(prev => [{
                                name: member.name,
                                event: activeEvent,
                                status: 'error' as const,
                                time: new Date().toLocaleTimeString(),
                                message: 'Not Registered'
                            }, ...prev].slice(0, 5));
                        } else if (member.attendance?.[activeEvent]?.attended) {
                            showToast.info("Already marked present");
                        }
                    }
                }
            }
        } catch (e: any) {
            showToast.error(e.message || "Scan failed");
        }
    };

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const filteredRegistrations = useMemo(() => {
        const query = (debouncedSearchQuery || "").toLowerCase().trim();
        
        // Filter logic
        const baseRegistrations = registrations.filter(r => {
            if (searchFilter === 'initiated') return (r.status === 'Payment Initiated' || r.transactionId === 'PAYMENT_INITIATED') && r.status !== 'Verified';
            return (r.status === "Verified") || ((r.status === "Pending Verification") && r.transactionId !== 'PAYMENT_INITIATED');
        });
        
        // Return everything if no query exists
        if (!query && (searchFilter === "all" || searchFilter === "initiated")) return baseRegistrations;

        return baseRegistrations.reduce((acc: Registration[], reg) => {
            const members: TeamMember[] = reg.members || [{
                name: reg.name, 
                department: reg.department, 
                college: reg.college, 
                year: (reg as any).year || "",
                phone: reg.phone, 
                email: reg.email, 
                events: reg.events, 
                isVerified: reg.status === "Verified"
            }];

            const filteredMembers = members.filter(m => {
                const isMemberVerified = m.isVerified;
                
                // 1. Status Filter (Verified / Pending)
                if (searchFilter === "verified" && !isMemberVerified) return false;
                if (searchFilter === "pending" && isMemberVerified) return false;

                // 2. Search Query (matches against everything)
                if (!query) return true;

                const eventList = Array.isArray(m.events) ? m.events : (m.events ? [m.events] : []);
                const matchesEvent = eventList.some(e => e?.toLowerCase().includes(query));
                
                const matchesName = m.name?.toLowerCase().includes(query);
                const matchesCollege = m.college?.toLowerCase().includes(query);
                const matchesDept = m.department?.toLowerCase().includes(query);
                const matchesPhone = m.phone?.toLowerCase().includes(query);
                const matchesEmail = m.email?.toLowerCase().includes(query);
                const matchesTxId = reg.transactionId?.toLowerCase().includes(query);
                const matchesUpi = reg.upiName?.toLowerCase().includes(query);
                const matchesRegDate = reg.registrationDate && (
                    reg.registrationDate?.toLowerCase().includes(query) ||
                    new Date(reg.registrationDate).toLocaleDateString().toLowerCase().includes(query)
                );

                return !!(matchesName || matchesCollege || matchesDept || matchesPhone || matchesEmail || matchesEvent || matchesTxId || matchesUpi || matchesRegDate);
            });

            if (filteredMembers.length > 0) {
                // Return a clone of the registration with only the filtered members
                acc.push({ ...reg, members: filteredMembers });
            }

            return acc;
        }, []);
    }, [registrations, debouncedSearchQuery, searchFilter]);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || adminMode === 'none') {
        return (
            <AdminLogin onLogin={handleLogin} isLoading={isLoginLoading} />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-purple-600 p-1.5 rounded-lg shadow-lg shadow-purple-100 italic">
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tighter text-slate-800">ADMIN <span className="text-purple-600">CONSOLE</span></span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 font-bold"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
            </nav>

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                    {adminMode === 'event-attendance' ? (
                        <AdminAttendanceMode
                            activeEvent={activeEvent}
                            setActiveEvent={setActiveEvent}
                            registrations={registrations}
                            setIsScannerOpen={setIsScannerOpen}
                            exportMasterExcel={() => exportMasterExcel(true)}
                            recentScans={recentScans}
                            handleScan={handleScan}
                            scannedParticipant={scannedParticipant}
                            setScannedParticipant={setScannedParticipant}
                            scannedMemberIndex={scannedMemberIndex}
                            setScannedMemberIndex={setScannedMemberIndex}
                            onMarkAttendance={handleMarkAttendance}
                            onRemoveAttendance={handleRemoveAttendance}
                        />
                    ) : adminMode === 'attendance' ? (
                        <AdminGeneralAttendance
                            registrations={registrations}
                            setIsScannerOpen={setIsScannerOpen}
                            scannedParticipant={scannedParticipant}
                            setScannedParticipant={setScannedParticipant}
                            scannedMemberIndex={scannedMemberIndex}
                            setScannedMemberIndex={setScannedMemberIndex}
                            onMarkAttendance={handleMarkAttendance}
                            onRemoveAttendance={handleRemoveAttendance}
                            onExportExcel={exportGeneralAttendanceExcel}
                        />
                    ) : (
                        <AdminMainDashboard
                            registrations={registrations}
                            filteredRegistrations={filteredRegistrations}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchFilter={searchFilter}
                            setSearchFilter={setSearchFilter}
                            isScannerOpen={isScannerOpen}
                            setIsScannerOpen={setIsScannerOpen}
                            exportAllParticipantsExcel={exportAllParticipantsExcel}
                            exportMasterExcel={() => exportMasterExcel(false)}
                            handleScan={handleScan}
                            updateStatus={updateStatus}
                            verifyMember={verifyMember}
                            handleDelete={handleDelete}
                            scannedParticipant={scannedParticipant}
                            setScannedParticipant={setScannedParticipant}
                            scannedMemberIndex={scannedMemberIndex}
                            setScannedMemberIndex={setScannedMemberIndex}
                            onRemoveAttendance={handleRemoveAttendance}
                        />
                    )}

                <QRScannerDialog
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScan={handleScan}
                />

                <PINVerificationDialog
                    isOpen={pinDialog.isOpen}
                    onClose={() => setPinDialog(prev => ({ ...prev, isOpen: false }))}
                    title={pinDialog.title}
                    description={pinDialog.description}
                    onVerify={(pin) => {
                        if (pin === loginPin) {
                            pinDialog.onVerified();
                            setPinDialog(prev => ({ ...prev, isOpen: false }));
                        } else {
                            showToast.error("Incorrect Security PIN");
                        }
                    }}
                />
            </main>
        </div>
    );
};

const AdminDashboardWithBoundary = () => (
    <ErrorBoundary>
        <AdminDashboard />
    </ErrorBoundary>
);

export default AdminDashboardWithBoundary;
