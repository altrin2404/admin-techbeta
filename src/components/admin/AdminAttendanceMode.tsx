import { ScanLine, QrCode, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/showToast";
import { type Registration } from "@/lib/registrationService";

interface AdminAttendanceModeProps {
    activeEvent: string;
    setActiveEvent: (event: string) => void;
    registrations: Registration[];
    setIsScannerOpen: (isOpen: boolean) => void;
    exportMasterExcel: () => void;
    setAdminMode: (mode: 'none' | 'dashboard' | 'attendance') => void;
    recentScans: { name: string, event: string, status: 'success' | 'error', time: string, message: string }[];
    handleScan: (decodedText: string) => Promise<void>;
    scannedParticipant: Registration | null;
    setScannedParticipant: (participant: Registration | null) => void;
    scannedMemberIndex: number;
    setScannedMemberIndex: (index: number) => void;
    onMarkAttendance: (participantId: string, memberIndex: number, eventName: string) => Promise<void>;
    onRemoveAttendance: (participantId: string, memberIndex: number, eventName: string) => Promise<void>;
}

const AdminAttendanceMode = ({
    activeEvent,
    setActiveEvent,
    registrations,
    setIsScannerOpen,
    exportMasterExcel,
    setAdminMode,
    recentScans: _recentScans,
    handleScan: _handleScan,
    scannedParticipant,
    setScannedParticipant,
    scannedMemberIndex,
    setScannedMemberIndex,
    onMarkAttendance,
    onRemoveAttendance
}: AdminAttendanceModeProps) => {

    // Extract unique events for the dropdown
    const availableEvents = Array.from(new Set(registrations.flatMap(reg =>
        reg.members
            ? reg.members.flatMap(m => m.events)
            : reg.events
    ))).sort();

    const presentCount = registrations.reduce((acc, reg) =>
        acc + (reg.members?.filter(m => m.attendance?.[activeEvent]?.attended).length || 0), 0
    );

    const presentMembers = registrations.flatMap(reg => {
        if (!reg.members) return [];
        return reg.members
            .map((m, idx) => ({ ...m, regId: reg.id, memberIndex: idx }))
            .filter(m => m.attendance?.[activeEvent]?.attended);
    }).sort((a, b) => {
        const timeA = new Date(a.attendance?.[activeEvent]?.timestamp || 0).getTime();
        const timeB = new Date(b.attendance?.[activeEvent]?.timestamp || 0).getTime();
        return timeB - timeA;
    });

    const currentScannedMember = (scannedParticipant && scannedMemberIndex !== -1)
        ? scannedParticipant.members?.[scannedMemberIndex]
        : null;

    const isAlreadyMarked = currentScannedMember?.attendance?.[activeEvent]?.attended;
    const isRegisteredForEvent = currentScannedMember?.events?.includes(activeEvent);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {scannedParticipant && currentScannedMember && (
                <div className="bg-purple-600 rounded-3xl p-8 text-white shadow-2xl shadow-purple-200 animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-white/20 p-4 rounded-full mb-4">
                            <QrCode className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-1">{currentScannedMember.name}</h2>
                        <p className="text-purple-100 font-bold uppercase tracking-widest text-xs mb-6">
                            {scannedParticipant.college}
                        </p>

                        <div className="w-full max-w-sm bg-white/10 rounded-2xl p-4 mb-6 border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black uppercase text-purple-200">Event</span>
                                <span className="font-bold">{activeEvent}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-purple-200">Status</span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isAlreadyMarked ? 'bg-green-400 text-green-900' : 'bg-orange-400 text-orange-900'}`}>
                                    {isAlreadyMarked ? 'ALREADY PRESENT' : 'READY TO MARK'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full max-w-sm">
                            <Button
                                onClick={() => onMarkAttendance(scannedParticipant.id, scannedMemberIndex, activeEvent)}
                                disabled={isAlreadyMarked || !isRegisteredForEvent}
                                className="flex-1 h-14 bg-white text-purple-600 hover:bg-purple-50 font-black text-lg rounded-2xl shadow-xl transition-transform active:scale-95 disabled:opacity-50"
                            >
                                Mark Present
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setScannedParticipant(null);
                                    setScannedMemberIndex(-1);
                                }}
                                className="h-14 px-6 border-2 border-white/20 text-white hover:bg-white/10 font-bold rounded-2xl"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </div>
                        {!isRegisteredForEvent && isRegisteredForEvent !== undefined && (
                            <p className="mt-4 text-red-200 text-xs font-bold uppercase tracking-wider">
                                Participant is not registered for this event!
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border p-8 shadow-sm flex flex-col items-center text-center">
                <div className="bg-purple-100 p-4 rounded-full mb-6">
                    <ScanLine className="h-10 w-10 text-purple-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Event Attendance</h2>
                <p className="text-slate-500 max-w-md mb-8">Select your venue&apos;s event and scan participants as they arrive.</p>

                <div className="w-full max-w-md space-y-4">
                    <div className="text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block">Active Event / Venue</label>
                        <select
                            value={activeEvent}
                            onChange={(e) => setActiveEvent(e.target.value)}
                            className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-slate-700 focus:outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select Event...</option>
                            {availableEvents.map(event => (
                                <option key={event} value={event}>{event}</option>
                            ))}
                        </select>
                    </div>

                    <Button
                        onClick={() => {
                            if (!activeEvent) {
                                showToast.error("Please select an event first!");
                                return;
                            }
                            setIsScannerOpen(true);
                        }}
                        disabled={!activeEvent}
                        className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-purple-100 flex items-center justify-center gap-3 transition-transform active:scale-95"
                    >
                        <QrCode className="h-6 w-6" />
                        Open Scanner
                    </Button>

                    <Button
                        onClick={exportMasterExcel}
                        variant="outline"
                        className="w-full h-12 border-2 border-green-100 text-green-600 hover:bg-green-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        <Download className="h-4 w-4" />
                        Export Attendance Report
                    </Button>

                    <div className="pt-4 flex flex-col gap-2">
                        <Button variant="ghost" onClick={() => setAdminMode('dashboard')} className="text-slate-400 font-bold">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Switch to Dashboard
                        </Button>
                    </div>
                </div>
            </div>

            {activeEvent && (
                <div className="bg-white rounded-3xl border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            Live Attendance: {activeEvent}
                        </h3>
                        <div className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase">
                            {presentCount} Present
                        </div>
                    </div>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {presentMembers.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
                                Scanned participants will appear here.
                            </div>
                        ) : (
                            presentMembers.map((member, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-green-50 border-green-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 text-sm">{member.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-green-600">
                                                Present
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                {new Date(member.attendance?.[activeEvent]?.timestamp || 0).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm(`Remove attendance for ${member.name}?`)) {
                                                onRemoveAttendance(member.regId, member.memberIndex, activeEvent);
                                            }
                                        }}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 font-bold text-xs"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAttendanceMode;
