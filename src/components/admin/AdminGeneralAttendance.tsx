import { ScanLine, QrCode, Download, ArrowLeft, Users, Mail, Phone, GraduationCap, Building2, Calendar, Tag } from "lucide-react";
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
                .map((m, idx) => ({ ...m, regId: reg.id, memberIndex: idx, college: reg.college }))
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
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl shadow-blue-200 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="relative flex flex-col items-center text-center">
                        {/* Header with icon */}
                        <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
                            <Users className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-1">{currentScannedMember.name}</h2>
                        <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-6">
                            {scannedParticipant.college}
                        </p>

                        {/* Ticket Details Grid */}
                        <div className="w-full max-w-md bg-white/10 rounded-2xl p-5 mb-6 border border-white/10 backdrop-blur-sm space-y-3">
                            {/* Department & Year */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-blue-200 flex-shrink-0" />
                                    <div className="text-left">
                                        <span className="text-[9px] font-black uppercase text-blue-300 block">Department</span>
                                        <span className="text-sm font-bold">{currentScannedMember.department || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-3.5 w-3.5 text-blue-200 flex-shrink-0" />
                                    <div className="text-left">
                                        <span className="text-[9px] font-black uppercase text-blue-300 block">Year</span>
                                        <span className="text-sm font-bold">{currentScannedMember.year || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/10"></div>

                            {/* Phone & Email */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-blue-200 flex-shrink-0" />
                                    <div className="text-left">
                                        <span className="text-[9px] font-black uppercase text-blue-300 block">Phone</span>
                                        <span className="text-sm font-bold">{currentScannedMember.phone || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-blue-200 flex-shrink-0" />
                                    <div className="text-left">
                                        <span className="text-[9px] font-black uppercase text-blue-300 block">Email</span>
                                        <span className="text-xs font-bold break-all">{currentScannedMember.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/10"></div>

                            {/* Registered Events */}
                            <div className="flex items-start gap-2">
                                <Tag className="h-3.5 w-3.5 text-blue-200 flex-shrink-0 mt-0.5" />
                                <div className="text-left">
                                    <span className="text-[9px] font-black uppercase text-blue-300 block mb-1">Registered Events</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(Array.isArray(currentScannedMember.events) ? currentScannedMember.events : [currentScannedMember.events]).map((event, idx) => (
                                            <span key={idx} className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                                                {event}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/10"></div>

                            {/* Mode & Status */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-blue-200 flex-shrink-0" />
                                    <span className="text-[9px] font-black uppercase text-blue-300">Mode</span>
                                </div>
                                <span className="font-bold text-sm">General Attendance</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-blue-300 ml-5">Status</span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isAlreadyMarked ? 'bg-green-400 text-green-900' : 'bg-orange-400 text-orange-900'}`}>
                                    {isAlreadyMarked ? 'ALREADY PRESENT' : 'READY TO MARK'}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
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
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-slate-800 text-sm">{member.name}</span>
                                    <span className="text-[10px] text-slate-500">{member.college} · {member.department}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-black uppercase text-green-600">
                                            Present
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            {new Date(member.attendance?.[ATTENDANCE_KEY]?.timestamp || 0).toLocaleTimeString()}
                                        </span>
                                        {member.phone && (
                                            <span className="text-[10px] text-slate-400">· {member.phone}</span>
                                        )}
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
