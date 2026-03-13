import { ScanLine, QrCode, Download, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Registration } from "@/lib/registrationService";
import { useMemo } from "react";

interface AdminGeneralAttendanceProps {
    registrations: Registration[];
    setIsScannerOpen: (isOpen: boolean) => void;
    scannedParticipant: Registration | null;
    setScannedParticipant: (participant: Registration | null) => void;
    scannedMemberIndex: number;
    setScannedMemberIndex: (index: number) => void;
    onMarkAttendance: (participantId: string, memberIndex: number, eventName: string) => Promise<void>;
    onRemoveAttendance: (participantId: string, memberIndex: number, eventName: string) => Promise<void>;
    onExportExcel: () => Promise<void>;
}

const AdminGeneralAttendance = ({
    registrations,
    setIsScannerOpen,
    scannedParticipant,
    setScannedParticipant,
    scannedMemberIndex,
    setScannedMemberIndex,
    onMarkAttendance,
    onRemoveAttendance,
    onExportExcel
}: AdminGeneralAttendanceProps) => {

    const ATTENDANCE_KEY = "General";

    const presentCount = useMemo(() => {
        return registrations.reduce((acc, reg) =>
            acc + (reg.members?.filter(m => m.attendance?.[ATTENDANCE_KEY]?.attended).length || 0), 0
        );
    }, [registrations]);

    const presentMembers = useMemo(() => {
        return registrations.flatMap(reg => {
            if (!reg.members) return [];
            return reg.members
                .map((m, idx) => ({ ...m, regId: reg.id, memberIndex: idx }))
                .filter(m => m.attendance?.[ATTENDANCE_KEY]?.attended);
        }).sort((a, b) => {
            const timeA = new Date(a.attendance?.[ATTENDANCE_KEY]?.timestamp || 0).getTime();
            const timeB = new Date(b.attendance?.[ATTENDANCE_KEY]?.timestamp || 0).getTime();
            return timeB - timeA;
        });
    }, [registrations]);

    const currentScannedMember = (scannedParticipant && scannedMemberIndex !== -1)
        ? scannedParticipant.members?.[scannedMemberIndex]
        : null;

    const isAlreadyMarked = currentScannedMember?.attendance?.[ATTENDANCE_KEY]?.attended;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {scannedParticipant && currentScannedMember && (
                <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-200 animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-white/20 p-4 rounded-full mb-4">
                            <Users className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-1">{currentScannedMember.name}</h2>
                        <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-6">
                            {scannedParticipant.college}
                        </p>

                        <div className="w-full max-w-sm bg-white/10 rounded-2xl p-4 mb-6 border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black uppercase text-blue-200">Mode</span>
                                <span className="font-bold">General Attendance</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-blue-200">Status</span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isAlreadyMarked ? 'bg-green-400 text-green-900' : 'bg-orange-400 text-orange-900'}`}>
                                    {isAlreadyMarked ? 'ALREADY PRESENT' : 'READY TO MARK'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full max-w-sm">
                            <Button
                                onClick={() => onMarkAttendance(scannedParticipant.id, scannedMemberIndex, ATTENDANCE_KEY)}
                                disabled={isAlreadyMarked}
                                className="flex-1 h-14 bg-white text-blue-600 hover:bg-blue-50 font-black text-lg rounded-2xl shadow-xl transition-transform active:scale-95 disabled:opacity-50"
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
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border p-8 shadow-sm flex flex-col items-center text-center">
                <div className="bg-blue-100 p-4 rounded-full mb-6">
                    <ScanLine className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Main Attendance</h2>
                <p className="text-slate-500 max-w-md mb-8">Scan participants to record their general presence at the event.</p>

                <div className="w-full max-w-md space-y-4">
                    <Button
                        onClick={() => setIsScannerOpen(true)}
                        className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-transform active:scale-95"
                    >
                        <QrCode className="h-6 w-6" />
                        Open Scanner
                    </Button>

                    <Button
                        onClick={onExportExcel}
                        variant="outline"
                        className="w-full h-12 border-2 border-green-100 text-green-600 hover:bg-green-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        <Download className="h-4 w-4" />
                        Export Attendance Report
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        Live General Attendance
                    </h3>
                    <div className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
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
                                            {new Date(member.attendance?.[ATTENDANCE_KEY]?.timestamp || 0).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (confirm(`Remove general attendance for ${member.name}?`)) {
                                            onRemoveAttendance(member.regId, member.memberIndex, ATTENDANCE_KEY);
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
        </div>
    );
};

export default AdminGeneralAttendance;
