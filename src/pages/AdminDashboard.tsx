import { useState, useEffect, Suspense, lazy, useMemo } from "react";
import {
    LogOut, ShieldCheck, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import ExcelJS from "exceljs"; // moved to dynamic import
import { toast } from "sonner";
import {
    subscribeToRegistrations,
    updateRegistrationStatus,
    deleteRegistration,
    type Registration
} from "@/lib/registrationService";
import { sendVerificationEmail } from "@/lib/emailService";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import QRScannerDialog from "@/components/QRScannerDialog";
import { useDebounce } from "@/hooks/use-debounce";

// Lazy Loaded Components for Performance
const AdminLogin = lazy(() => import("@/components/admin/AdminLogin"));
const AdminMainDashboard = lazy(() => import("@/components/admin/AdminMainDashboard"));
const AdminAttendanceMode = lazy(() => import("@/components/admin/AdminAttendanceMode"));

const ADMIN_EMAIL_DOMAIN = "techbeta2k26.firebaseapp.com";

const AdminDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [adminMode, setAdminMode] = useState<'none' | 'dashboard' | 'attendance'>('none');
    const [activeEvent, setActiveEvent] = useState<string>("");
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [recentScans, setRecentScans] = useState<{ name: string, event: string, status: 'success' | 'error', time: string, message: string }[]>([]);
    const [scannedParticipant, setScannedParticipant] = useState<Registration | null>(null);
    const [scannedMemberIndex, setScannedMemberIndex] = useState<number>(-1);

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

    const handleLogin = async (username: string, password: string, mode: 'dashboard' | 'attendance') => {
        setIsLoginLoading(true);
        try {
            const email = `${username}@${ADMIN_EMAIL_DOMAIN}`;
            await signInWithEmailAndPassword(auth, email, password);
            setAdminMode(mode);
            toast.success(`Login Successful: ${mode === 'dashboard' ? 'Dashboard' : 'Attendance'}`);
        } catch (error: any) {
            console.error("Login error:", error);
            const code = error?.code || "unknown";
            toast.error(`Login failed: ${code}`);
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setAdminMode('none');
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const result = await updateRegistrationStatus(id, newStatus);
        if (result.success) {
            toast.success(`Status updated to ${newStatus}`);
            if (newStatus === "Verified") {
                const participant = registrations.find(r => r.id === id);
                console.log("Updating status to Verified for participant:", participant);
                if (participant) {
                    const toastId = toast.loading("Sending verification emails...");
                    console.log("Member details for email:", participant.members);
                    const membersToNotify = participant.members || [{
                        name: participant.name, email: participant.email, events: participant.events
                    }];
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
                        await new Promise(r => setTimeout(r, 800)); // Slightly longer delay to avoid potential rate limits
                    }
                    toast.dismiss(toastId);
                    if (successCount === membersToNotify.length) {
                        toast.success(`Sent all ${successCount} verification emails!`);
                    } else {
                        toast.error(`Sent ${successCount}/${membersToNotify.length} emails. Some failed.`);
                    }
                    console.log(`Email sending process complete: ${successCount} successful.`);
                } else {
                    console.error("Participant not found in state after status update!");
                }
            }
        } else {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this registration?")) return;
        const result = await deleteRegistration(id);
        if (result.success) toast.success("Deleted successfully");
        else toast.error("Failed to delete");
    };

    const exportAllParticipantsExcel = async () => {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("All Participants");

        worksheet.columns = [
            { header: "QR Code", key: "qr", width: 15 },
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

        toast.loading("Generating All Participants report...");

        for (const reg of registrations) {
            const members = reg.members || [{
                name: reg.name, department: reg.department, year: (reg as any).year, college: reg.college, phone: reg.phone, email: reg.email, events: reg.events
            }];

            for (let i = 0; i < members.length; i++) {
                const m = members[i];
                const row = worksheet.addRow({
                    name: m.name,
                    department: m.department,
                    year: m.year || "N/A",
                    college: m.college,
                    phone: m.phone,
                    email: m.email,
                    events: Array.isArray(m.events) ? m.events.join("; ") : (m.events || ""),
                    status: reg.status
                });

                row.height = 80;
                row.alignment = { vertical: 'middle' };

                try {
                    const qrData = JSON.stringify({ id: reg.id, index: i, name: m.name, events: m.events });
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&margin=0`;

                    const response = await fetch(qrUrl);
                    const arrayBuffer = await response.arrayBuffer();

                    const imageId = workbook.addImage({
                        buffer: arrayBuffer,
                        extension: 'png',
                    });

                    worksheet.addImage(imageId, {
                        tl: { col: 0.1, row: row.number - 0.95 },
                        ext: { width: 100, height: 100 }
                    });
                } catch (error) {
                    console.error("QR embedding failed:", error);
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
        toast.dismiss();
        toast.success("Excel report exported!");
    };

    const exportMasterExcel = async (includeAttendance: boolean = false) => {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        const allEvents = Array.from(new Set(registrations.flatMap(reg =>
            reg.members ? reg.members.flatMap(m => m.events) : reg.events
        ))).sort();

        toast.loading(`Generating ${includeAttendance ? 'Attendance Sheets' : 'Master Sheets'}...`);

        for (const eventName of allEvents) {
            const worksheet = workbook.addWorksheet(eventName.substring(0, 31).replace(/[\\/?*[\]]/g, ""));
            const columns = [
                { header: "QR Code", key: "qr", width: 15 },
                { header: "Team", key: "team", width: 10 },
                { header: "Name", key: "name", width: 20 },
                { header: "Dept", key: "department", width: 15 },
                { header: "College", key: "college", width: 25 },
                { header: "Phone", key: "phone", width: 15 },
                { header: "Email", key: "email", width: 30 }
            ];

            if (includeAttendance) {
                columns.push({ header: "Attendance", key: "attendance", width: 20 });
            }

            worksheet.columns = columns;

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            let teamCounter = 1;
            for (const reg of registrations) {
                const members = reg.members || [{
                    name: reg.name, email: reg.email, phone: reg.phone, college: reg.college, department: reg.department, events: reg.events, attendance: (reg as any).attendance
                }];
                const participating = members.filter((m: any) => (Array.isArray(m.events) ? m.events : [m.events]).includes(eventName));

                if (participating.length > 0) {
                    for (const m of participating) {
                        const originalIndex = reg.members ? reg.members.findIndex(member => member.name === m.name) : 0;
                        const attendanceInfo = m.attendance?.[eventName];
                        const rowData: any = {
                            team: teamCounter,
                            name: m.name,
                            department: m.department,
                            college: m.college,
                            phone: m.phone,
                            email: m.email
                        };

                        if (includeAttendance) {
                            rowData.attendance = attendanceInfo?.attended ? `Present (${new Date(attendanceInfo.timestamp).toLocaleTimeString()})` : "Absent";
                        }

                        const row = worksheet.addRow(rowData);

                        row.height = 80;
                        row.alignment = { vertical: 'middle' };

                        try {
                            const qrData = JSON.stringify({ id: reg.id, index: originalIndex, name: m.name, events: m.events });
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&margin=0`;

                            const response = await fetch(qrUrl);
                            const arrayBuffer = await response.arrayBuffer();

                            const imageId = workbook.addImage({
                                buffer: arrayBuffer,
                                extension: 'png',
                            });

                            worksheet.addImage(imageId, {
                                tl: { col: 0.1, row: row.number - 0.95 },
                                ext: { width: 100, height: 100 }
                            });
                        } catch (error) {
                            console.error("QR embedding failed:", error);
                        }
                    }
                    teamCounter++;
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
        toast.dismiss();
        toast.success(includeAttendance ? "Attendance sheets exported!" : "Master sheets exported!");
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
                toast.success(`Attendance marked: ${updatedMembers[memberIndex].name}`);
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
            toast.error("Failed to mark attendance");
        }
    };

    const handleRemoveAttendance = async (participantId: string, memberIndex: number, eventName: string) => {
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
                toast.success(`Attendance removed: ${updatedMembers[memberIndex].name}`);
            }
        } catch (error) {
            console.error("Failed to remove attendance:", error);
            toast.error("Failed to remove attendance");
        }
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
                toast.error("Payment not verified!");
                return;
            }

            if (adminMode === 'attendance') {
                setIsScannerOpen(false); // Close scanner on successful read
                if (activeEvent) {
                    const member = participant.members ? participant.members[data.index] : null;
                    if (member) {
                        const memberEvents = Array.isArray(member.events) ? member.events : [member.events];
                        if (!memberEvents.includes(activeEvent)) {
                            toast.error(`${member.name} is not registered for ${activeEvent}`);
                            setRecentScans(prev => [{
                                name: member.name,
                                event: activeEvent,
                                status: 'error' as const,
                                time: new Date().toLocaleTimeString(),
                                message: 'Not Registered'
                            }, ...prev].slice(0, 5));
                        } else if (member.attendance?.[activeEvent]?.attended) {
                            toast.info("Already marked present");
                        }
                    }
                }
            }
        } catch (e: any) {
            toast.error(e.message || "Scan failed");
        }
    };

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const filteredRegistrations = useMemo(() => {
        if (!debouncedSearchQuery) return registrations;
        const query = debouncedSearchQuery.toLowerCase();
        return registrations.filter(reg =>
            reg.name.toLowerCase().includes(query) ||
            reg.college.toLowerCase().includes(query) ||
            reg.transactionId?.toLowerCase().includes(query)
        );
    }, [registrations, debouncedSearchQuery]);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || adminMode === 'none') {
        return (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-purple-600" /></div>}>
                <AdminLogin onLogin={handleLogin} isLoading={isLoginLoading} />
            </Suspense>
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
                <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-purple-600" /></div>}>
                    {adminMode === 'attendance' ? (
                        <AdminAttendanceMode
                            activeEvent={activeEvent}
                            setActiveEvent={setActiveEvent}
                            registrations={registrations}
                            setIsScannerOpen={setIsScannerOpen}
                            exportMasterExcel={() => exportMasterExcel(true)}
                            setAdminMode={setAdminMode}
                            recentScans={recentScans}
                            handleScan={handleScan}
                            scannedParticipant={scannedParticipant}
                            setScannedParticipant={setScannedParticipant}
                            scannedMemberIndex={scannedMemberIndex}
                            setScannedMemberIndex={setScannedMemberIndex}
                            onMarkAttendance={handleMarkAttendance}
                            onRemoveAttendance={handleRemoveAttendance}
                        />
                    ) : (
                        <AdminMainDashboard
                            registrations={registrations}
                            filteredRegistrations={filteredRegistrations}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            isScannerOpen={isScannerOpen}
                            setIsScannerOpen={setIsScannerOpen}
                            exportAllParticipantsExcel={exportAllParticipantsExcel}
                            exportMasterExcel={() => exportMasterExcel(false)}
                            handleScan={handleScan}
                            updateStatus={updateStatus}
                            handleDelete={handleDelete}
                            scannedParticipant={scannedParticipant}
                            setScannedParticipant={setScannedParticipant}
                            scannedMemberIndex={scannedMemberIndex}
                            setScannedMemberIndex={setScannedMemberIndex}
                            onRemoveAttendance={handleRemoveAttendance}
                            setAdminMode={setAdminMode}
                        />
                    )}
                </Suspense>

                <QRScannerDialog
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScan={handleScan}
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
