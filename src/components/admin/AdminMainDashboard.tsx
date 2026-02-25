import { useState, memo, useMemo, useCallback } from "react";
import {
    Users, Layers, Clock, Search, ScanLine, Download, ChevronDown,
    FileText, CheckCircle, Trash2, QrCode, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";
import { type Registration } from "@/lib/registrationService";
import { Loader2 } from "lucide-react";

// Sub-component for QR Code to avoid re-renders
const QRCodeImage = memo(({ data }: { data: string }) => {
    const [loading, setLoading] = useState(true);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}&margin=0`;

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-[1px]">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                    <span className="text-[10px] text-slate-400 font-medium tracking-tight">Generating QR...</span>
                </div>
            )}
            <img
                src={qrUrl}
                alt="QR Code"
                className={`w-full h-full object-contain transition-all duration-500 ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                onLoad={() => setLoading(false)}
            />
        </div>
    );
});

QRCodeImage.displayName = "QRCodeImage";

interface AdminMainDashboardProps {
    registrations: Registration[];
    filteredRegistrations: Registration[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isScannerOpen: boolean;
    setIsScannerOpen: (isOpen: boolean) => void;
    exportAllParticipantsExcel: () => void;
    exportMasterExcel: () => void;
    handleScan: (decodedText: string) => Promise<void>;
    updateStatus: (id: string, newStatus: string) => Promise<void>;
    handleDelete: (id: string) => Promise<void>;
    scannedParticipant: Registration | null;
    setScannedParticipant: (participant: Registration | null) => void;
    scannedMemberIndex: number;
    setScannedMemberIndex: (index: number) => void;
    onRemoveAttendance: (participantId: string, memberIndex: number, eventName: string) => Promise<void>;
    setAdminMode: (mode: 'none' | 'dashboard' | 'attendance') => void;
}

const QRDisplayDialog = ({
    registration,
    onClose
}: {
    registration: Registration | null;
    onClose: () => void;
}) => {
    if (!registration) return null;

    const members = registration.members || [{
        name: registration.name,
        events: registration.events
    }];

    return (
        <Dialog open={!!registration} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-md bg-white rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl outline-none">
                <DialogTitle className="sr-only">QR Codes for {registration.name}</DialogTitle>
                <div className="flex flex-col items-center w-full px-4 py-10 relative">
                    {/* Status Badge */}
                    <div className="mb-8 w-full flex justify-center">
                        <span className={`text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${registration.status === 'Verified'
                            ? 'bg-green-50 text-green-600 border-green-100'
                            : 'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                            {registration.status.toUpperCase()}
                        </span>
                    </div>

                    <div className="w-full max-w-[340px] sm:max-w-xs mx-auto">
                        <Carousel opts={{ loop: true }} className="w-full">
                            <CarouselContent className="ml-0">
                                {members.map((m, i) => (
                                    <CarouselItem key={i} className="pl-0 flex flex-col items-center justify-center">
                                        <div className="bg-white p-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-50 mb-6 flex items-center justify-center mx-auto transition-transform duration-500 hover:scale-[1.02]">
                                            <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
                                                <QRCodeImage
                                                    data={JSON.stringify({
                                                        id: registration.id,
                                                        index: i,
                                                        name: m.name,
                                                        events: m.events
                                                    })}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <h4 className="font-black text-xl text-slate-800 tracking-tight">{m.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Member {i + 1} of {members.length}
                                            </p>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                            {members.length > 1 && (
                                <div className="flex justify-center gap-4 mt-8">
                                    <CarouselPrevious className="static h-10 w-10 translate-y-0 border-slate-100 bg-white text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all shadow-sm" />
                                    <CarouselNext className="static h-10 w-10 translate-y-0 border-slate-100 bg-white text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all shadow-sm" />
                                </div>
                            )}
                        </Carousel>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="mt-8 text-slate-400 font-bold hover:text-slate-600 hover:bg-transparent"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const AdminMainDashboard = ({
    registrations,
    filteredRegistrations,
    searchQuery,
    setSearchQuery,
    isScannerOpen: _isScannerOpen,
    setIsScannerOpen,
    exportAllParticipantsExcel,
    exportMasterExcel,
    handleScan: _handleScan,
    updateStatus,
    handleDelete,
    scannedParticipant,
    setScannedParticipant,
    scannedMemberIndex,
    setScannedMemberIndex,
    onRemoveAttendance,
    setAdminMode
}: AdminMainDashboardProps) => {

    const [qrDialogRegistration, setQrDialogRegistration] = useState<Registration | null>(null);

    const stats = useMemo(() => {
        const totalMembers = registrations.reduce((acc, curr) => acc + (curr.members ? curr.members.length : 1), 0);
        const verifiedRevenueCount = registrations.filter(r => r.status === "Verified").reduce((acc, curr) => acc + (curr.members ? curr.members.length : 1), 0);
        const pendingCount = registrations.filter(r => r.status === "Pending Verification").length;
        return { totalMembers, verifiedRevenueCount, pendingCount };
    }, [registrations]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, [setSearchQuery]);

    return (
        <div className="animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border flex items-center gap-4 transition-transform hover:scale-[1.02]">
                    <Users className="text-blue-500 h-8 w-8" />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Total Registrations</p>
                        <p className="text-2xl font-black">{stats.totalMembers}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border flex items-center gap-4 transition-transform hover:scale-[1.02]">
                    <Layers className="text-purple-500 h-8 w-8" />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Revenue</p>
                        <p className="text-2xl font-black">₹ {stats.verifiedRevenueCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border flex items-center gap-4 transition-transform hover:scale-[1.02]">
                    <Clock className="text-orange-500 h-8 w-8" />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
                        <p className="text-2xl font-black">{stats.pendingCount}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search Team Lead, College or TxID..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10 h-10 bg-slate-50/50"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="ghost"
                        onClick={() => setAdminMode('attendance')}
                        className="text-purple-600 font-bold border-2 border-purple-100 hover:bg-purple-50"
                    >
                        <QrCode className="h-4 w-4 mr-2" /> Switch to Attendance
                    </Button>
                    <Button onClick={() => setIsScannerOpen(true)} className="bg-purple-600 hover:bg-purple-700 font-bold h-10 shadow-lg shadow-purple-100">
                        <ScanLine className="h-4 w-4 mr-2" /> Scan Ticket
                    </Button>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="font-bold gap-2 h-10">
                            <Download className="h-4 w-4" /> Export Data <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200">
                        <DropdownMenuItem onClick={exportAllParticipantsExcel} className="cursor-pointer font-medium text-slate-700">
                            <FileText className="mr-2 h-4 w-4 text-blue-500" />
                            All Participants (XLSX)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportMasterExcel} className="cursor-pointer font-medium text-slate-700">
                            <Layers className="mr-2 h-4 w-4 text-green-500" />
                            Master Sheet (XLSX)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Scanned/Selected Participant Details Dialog */}
            <Dialog open={!!scannedParticipant} onOpenChange={(open) => {
                if (!open) {
                    setScannedParticipant(null);
                    setScannedMemberIndex(-1);
                }
            }}>
                <DialogContent className="max-w-md bg-white border-2 border-purple-500 rounded-3xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                    <div className="bg-purple-600 p-6 flex flex-col items-center justify-center text-white">
                        <CheckCircle className="h-12 w-12 mb-2" />
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-center">
                            {scannedParticipant?.status === "Verified" ? "Admit Team" : "Verify Team"}
                        </DialogTitle>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-900">{scannedParticipant?.name}</h3>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{scannedParticipant?.college}</p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Team Size</span>
                                <span className="font-mono font-bold text-slate-800">{scannedParticipant?.members?.length || 1} Members</span>
                            </div>

                            {scannedParticipant?.members && (
                                <div className="pt-2 border-t border-slate-200 mt-2">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Team Members</p>
                                    <ul className="space-y-3">
                                        {scannedParticipant.members.map((m, i) => (
                                            <li
                                                key={i}
                                                className={`text-xs p-2 rounded-lg transition-all ${scannedMemberIndex === i
                                                    ? "bg-green-100 border-2 border-green-500 shadow-md transform scale-105"
                                                    : "bg-slate-100 border border-transparent"
                                                    }`}
                                            >
                                                <div className="flex justify-between mb-1">
                                                    <span className={`font-bold ${scannedMemberIndex === i ? "text-green-800" : "text-slate-700"}`}>
                                                        {m.name} {scannedMemberIndex === i && <span className="text-[9px] bg-green-200 text-green-800 px-1 rounded ml-2">MATCH</span>}
                                                    </span>
                                                    <span className="text-slate-400">{m.phone}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-500">
                                                    <span>{m.department} • {m.year || "Year N/A"}</span>
                                                    <span>{m.college}</span>
                                                </div>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {(typeof m.events === 'string' ? [m.events] : (m.events || [])).map((e: string, idx: number) => {
                                                        const colors = [
                                                            "bg-blue-100 text-blue-700 border-blue-200",
                                                            "bg-purple-100 text-purple-700 border-purple-200",
                                                            "bg-pink-100 text-pink-700 border-pink-200",
                                                            "bg-orange-100 text-orange-700 border-orange-200",
                                                            "bg-teal-100 text-teal-700 border-teal-200",
                                                            "bg-indigo-100 text-indigo-700 border-indigo-200",
                                                        ];
                                                        const colorIndex = (e.length + e.charCodeAt(0)) % colors.length;
                                                        const isAttended = m.attendance?.[e]?.attended;

                                                        return (
                                                            <span
                                                                key={idx}
                                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colors[colorIndex]} flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
                                                                onClick={(evt) => {
                                                                    if (isAttended) {
                                                                        evt.stopPropagation();
                                                                        if (confirm(`Remove attendance for ${m.name} in ${e}?`)) {
                                                                            onRemoveAttendance(scannedParticipant.id, i, e);
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                {e}
                                                                {isAttended && <CheckCircle size={8} className="text-green-600" />}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex flex-col gap-1 text-sm pt-2 border-t border-slate-100 mt-2">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Events</span>
                                <div className="flex flex-wrap gap-1">
                                    {(scannedParticipant?.events || []).map((e, i) => (
                                        <span key={i} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">{e}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {scannedParticipant?.status === "Pending Verification" ? (
                                <Button
                                    onClick={() => {
                                        if (scannedParticipant) {
                                            updateStatus(scannedParticipant.id, "Verified");
                                            setScannedParticipant(null);
                                            setScannedMemberIndex(-1);
                                        }
                                    }}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12 text-lg shadow-lg shadow-green-200"
                                >
                                    Verify & Admit Team
                                </Button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 p-3 rounded-xl font-bold border border-green-200">
                                    <CheckCircle size={18} /> Team Already Verified
                                </div>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setScannedParticipant(null);
                                    setScannedMemberIndex(-1);
                                }}
                                className="w-full font-bold"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Participants Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-primary" />
                        Registered Teams
                    </h2>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search participants..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-9 bg-slate-50/50 border-slate-200 text-slate-900"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr className="border-b border-slate-100">
                                <th className="text-slate-500 font-semibold px-6 py-4 whitespace-nowrap text-xs uppercase tracking-wider">Team ID</th>
                                <th className="text-slate-500 font-semibold px-6 py-4 whitespace-nowrap text-xs uppercase tracking-wider">Members</th>
                                <th className="text-slate-500 font-semibold px-6 py-4 whitespace-nowrap text-xs uppercase tracking-wider">College</th>
                                <th className="text-slate-500 font-semibold px-6 py-4 whitespace-nowrap hidden lg:table-cell text-xs uppercase tracking-wider">Events</th>
                                <th className="text-slate-500 font-semibold px-6 py-4 whitespace-nowrap hidden lg:table-cell text-xs uppercase tracking-wider">Payment</th>
                                <th className="text-slate-500 font-semibold px-6 py-4 whitespace-nowrap text-xs uppercase tracking-wider">Status</th>
                                <th className="text-slate-500 font-semibold text-right px-6 py-4 whitespace-nowrap text-xs uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRegistrations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="h-40 text-center text-slate-500 font-medium">
                                        No participants found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredRegistrations.map((reg) => (
                                    <tr
                                        key={reg.id}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        onClick={() => setScannedParticipant(reg)}
                                    >
                                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500 font-medium">
                                            #{reg.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 flex items-center gap-2 group-hover:text-primary transition-colors">
                                                {reg.name}
                                                {reg.members && reg.members.length > 1 && (
                                                    <span className="text-[10px] bg-primary/5 text-primary px-1.5 py-0.5 rounded-full font-black border border-primary/10">
                                                        +{reg.members.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-medium">{reg.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-slate-700 truncate max-w-[150px]" title={reg.college}>{reg.college}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{reg.department}</div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {(Array.isArray(reg.events) ? reg.events : [reg.events]).slice(0, 2).map((e: string, i: number) => (
                                                    <span key={i} className="text-[9px] font-black uppercase bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 whitespace-nowrap">{e}</span>
                                                ))}
                                                {(Array.isArray(reg.events) ? reg.events : [reg.events]).length > 2 && (
                                                    <span className="text-[10px] text-slate-300 font-bold">+{(Array.isArray(reg.events) ? reg.events : [reg.events]).length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="text-[10px] font-mono text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">{reg.transactionId || 'CASH/GUEST'}</div>
                                            {reg.upiName && <div className="text-[9px] text-primary font-black uppercase mt-1 tracking-tight">{reg.upiName}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${reg.status === 'Verified'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-orange-50 text-orange-700 border-orange-100'
                                                }`}>
                                                {reg.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" onClick={() => setScannedParticipant(reg)} className="h-8 w-8 text-primary hover:bg-primary/10">
                                                <ScanLine size={14} />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                                                onClick={() => setQrDialogRegistration(reg)}
                                            >
                                                <QrCode size={14} />
                                            </Button>

                                            {reg.status !== "Verified" && (
                                                <Button onClick={() => updateStatus(reg.id, "Verified")} variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-50">
                                                    <CheckCircle size={14} />
                                                </Button>
                                            )}
                                            <Button onClick={() => handleDelete(reg.id)} variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50">
                                                <Trash2 size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <QRDisplayDialog
                registration={qrDialogRegistration}
                onClose={() => setQrDialogRegistration(null)}
            />
        </div>
    );
};

export default AdminMainDashboard;
