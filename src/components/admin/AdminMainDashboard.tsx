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
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";
import { type Registration } from "@/lib/registrationService";
import { Loader2 } from "lucide-react";

const ALLOWED_EVENTS = ["FutureMinds", "Webfusion", "PromptStorm", "Postercraft", "LogoHub"];

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
    searchFilter: string;
    setSearchFilter: (filter: string) => void;
    isScannerOpen: boolean;
    setIsScannerOpen: (isOpen: boolean) => void;
    exportAllParticipantsExcel: () => void;
    exportMasterExcel: () => void;
    handleScan: (decodedText: string) => Promise<void>;
    updateStatus: (id: string, newStatus: string) => Promise<void>;
    verifyMember: (id: string, memberIndex: number) => Promise<void>;
    handleDelete: (id: string, memberIndex?: number) => Promise<void>;
    scannedParticipant: Registration | null;
    setScannedParticipant: (participant: Registration | null) => void;
    scannedMemberIndex: number;
    setScannedMemberIndex: (index: number) => void;
    onRemoveAttendance: (participantId: string, memberIndex: number, eventName: string) => Promise<void>;
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
    searchFilter,
    setSearchFilter,
    isScannerOpen: _isScannerOpen,
    setIsScannerOpen,
    exportAllParticipantsExcel,
    exportMasterExcel,
    handleScan: _handleScan,
    updateStatus,
    verifyMember,
    handleDelete,
    scannedParticipant,
    setScannedParticipant,
    scannedMemberIndex,
    setScannedMemberIndex,
    onRemoveAttendance,
}: AdminMainDashboardProps) => {

    const [qrDialogRegistration, setQrDialogRegistration] = useState<Registration | null>(null);

    const stats = useMemo(() => {
        let totalMembers = 0;
        let verifiedCount = 0;
        let pendingCount = 0;

        registrations.forEach(reg => {
            if (reg.status === "Rejected") return;

            const members = reg.members || [{
                name: reg.name,
                isVerified: reg.status === "Verified"
            }];

            totalMembers += members.length;
            members.forEach(m => {
                if (m.isVerified) {
                    verifiedCount++;
                } else {
                    pendingCount++;
                }
            });
        });

        return { 
            totalMembers, 
            verifiedRevenueCount: verifiedCount * 200, 
            pendingCount 
        };
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

            <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Management Console</h2>
                    <p className="text-xs font-medium text-slate-400">Manage registrations, payments and QR tickets</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">

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
                            {scannedParticipant?.status === "Verified" ? "Admit Participant" : "Verify Participant"}
                        </DialogTitle>
                    </div>
                    <div className="p-6 space-y-4">
                        {(() => {
                            const m = scannedMemberIndex >= 0 && scannedParticipant?.members
                                ? scannedParticipant.members[scannedMemberIndex]
                                : {
                                    name: scannedParticipant?.name,
                                    college: scannedParticipant?.college,
                                    department: scannedParticipant?.department,
                                    phone: scannedParticipant?.phone,
                                    year: (scannedParticipant as any)?.year,
                                    events: scannedParticipant?.events,
                                    attendance: (scannedParticipant as any)?.attendance
                                };

                            if (!m) return null;

                            return (
                                <>
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-slate-900">{m.name}</h3>
                                        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{m.college}</p>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-slate-700">Contact</span>
                                            <span className="text-slate-400">{m.phone}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">{m.department}</span>
                                            <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{m.year || "Year N/A"}</span>
                                        </div>

                                        <div className="flex flex-col gap-1 text-sm pt-2 border-t border-slate-100 mt-2">
                                            <span className="text-slate-400 font-bold uppercase text-[10px]">Events</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(typeof m.events === 'string' ? [m.events] : (m.events || [])).filter((e: string) => ALLOWED_EVENTS.includes(e)).map((e: string, idx: number) => {
                                                    const colors = [
                                                        "bg-blue-100 text-blue-800 border-blue-200",
                                                        "bg-purple-100 text-purple-800 border-purple-200",
                                                        "bg-pink-100 text-pink-800 border-pink-200",
                                                        "bg-orange-100 text-orange-800 border-orange-200",
                                                        "bg-teal-100 text-teal-800 border-teal-200",
                                                        "bg-indigo-100 text-indigo-800 border-indigo-200",
                                                    ];
                                                    const colorIndex = (e.length + e.charCodeAt(0)) % colors.length;
                                                    const isAttended = (m.attendance as any)?.[e]?.attended;

                                                    return (
                                                        <span
                                                            key={idx}
                                                            className={`text-[10px] font-bold px-2 py-1 rounded border ${colors[colorIndex]} flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap`}
                                                            onClick={(evt) => {
                                                                if (isAttended && scannedParticipant) {
                                                                    evt.stopPropagation();
                                                                    if (confirm(`Remove attendance for ${m.name} in ${e}?`)) {
                                                                        onRemoveAttendance(scannedParticipant.id, scannedMemberIndex, e);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            {e}
                                                            {isAttended && <CheckCircle size={10} className="text-green-600" />}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        <div className="flex flex-col gap-2">
                            {(() => {
                                const m = scannedMemberIndex >= 0 && scannedParticipant?.members
                                    ? scannedParticipant.members[scannedMemberIndex]
                                    : null;

                                const isVerified = m?.isVerified;

                                return !isVerified ? (
                                    <Button
                                        onClick={() => {
                                            if (scannedParticipant && scannedMemberIndex >= 0) {
                                                verifyMember(scannedParticipant.id, scannedMemberIndex);
                                                setScannedParticipant(null);
                                                setScannedMemberIndex(-1);
                                            } else if (scannedParticipant) {
                                                updateStatus(scannedParticipant.id, "Verified");
                                                setScannedParticipant(null);
                                                setScannedMemberIndex(-1);
                                            }
                                        }}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6 text-lg rounded-2xl shadow-lg shadow-green-200"
                                    >
                                        <CheckCircle className="mr-2 h-6 w-6" /> Admit Participant
                                    </Button>
                                ) : (
                                    <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
                                        <p className="font-bold text-green-700 flex items-center justify-center gap-2">
                                            <CheckCircle className="h-5 w-5" /> Participant Already Verified
                                        </p>
                                    </div>
                                );
                            })()}

                            <Button onClick={() => {
                                setScannedParticipant(null);
                                setScannedMemberIndex(-1);
                            }} variant="outline" className="w-full font-bold text-slate-600 border-2 rounded-2xl py-6">
                                Cancel
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
                        Registered Participants
                    </h2>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder={`Search by ${searchFilter === 'all' ? 'everything' : searchFilter}...`}
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-9 bg-slate-50/50 border-slate-200 text-slate-900"
                            />
                        </div>
                        <Select value={searchFilter} onValueChange={setSearchFilter}>
                            <SelectTrigger className="w-[110px] bg-slate-50/50 border-slate-200 text-slate-600 focus:ring-purple-500 rounded-lg h-10">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    <SelectValue placeholder="Filter" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                <SelectItem value="all" className="focus:bg-purple-50 focus:text-purple-700 cursor-pointer rounded-lg font-medium text-slate-700 data-[state=checked]:bg-purple-100 data-[state=checked]:text-purple-800">All</SelectItem>
                                <SelectItem value="verified" className="focus:bg-purple-50 focus:text-purple-700 cursor-pointer rounded-lg font-medium text-slate-700 data-[state=checked]:bg-purple-100 data-[state=checked]:text-purple-800">Verified</SelectItem>
                                <SelectItem value="pending" className="focus:bg-purple-50 focus:text-purple-700 cursor-pointer rounded-lg font-medium text-slate-700 data-[state=checked]:bg-purple-100 data-[state=checked]:text-purple-800">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr className="border-b border-slate-100">
                                <th className="text-slate-500 font-semibold px-6 py-4 whitespace-nowrap text-xs uppercase tracking-wider">S.No</th>
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
                                (() => {
                                    let snoCounter = 1;
                                    return filteredRegistrations.flatMap((reg) => {
                                        const members = reg.members || [{
                                            name: reg.name,
                                            department: reg.department,
                                            college: reg.college,
                                            phone: reg.phone,
                                            email: reg.email,
                                            events: reg.events
                                        }];

                                        // Using map here results in array of arrays. The outer flatMap flattens the first level,
                                        // so we get a single 1D array of <tr> elements.
                                        return members.flatMap((m: any, index: number) => {
                                            const currentSno = snoCounter++;
                                            return (
                                                <tr
                                                    key={`${reg.id}-${index}`}
                                                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                                    onClick={() => {
                                                        setScannedParticipant(reg);
                                                        setScannedMemberIndex(index);
                                                    }}
                                                >
                                                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500 font-medium">
                                                        {currentSno}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900 flex items-center gap-2 group-hover:text-primary transition-colors">
                                                            {m.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-medium">{m.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-slate-700 truncate max-w-[150px]" title={m.college}>{m.college}</div>
                                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{m.department}</div>
                                                    </td>
                                                    <td className="px-6 py-4 hidden lg:table-cell">
                                                        <div className="flex flex-wrap gap-1">
                                                            {(Array.isArray(m.events) ? m.events : [m.events]).filter((e: string) => ALLOWED_EVENTS.includes(e)).slice(0, 2).map((e: string, i: number) => (
                                                                <span key={i} className="text-[9px] font-black uppercase bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 whitespace-nowrap">{e}</span>
                                                            ))}
                                                            {(Array.isArray(m.events) ? m.events : [m.events]).filter((e: string) => ALLOWED_EVENTS.includes(e)).length > 2 && (
                                                                <span className="text-[10px] text-slate-300 font-bold">+{(Array.isArray(m.events) ? m.events : [m.events]).filter((e: string) => ALLOWED_EVENTS.includes(e)).length - 2}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 hidden lg:table-cell">
                                                        <div className="text-[10px] font-mono text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">{reg.transactionId || 'CASH/GUEST'}</div>
                                                        {reg.upiName && <div className="text-[9px] text-primary font-black uppercase mt-1 tracking-tight">{reg.upiName}</div>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${m.isVerified
                                                            ? 'bg-green-50 text-green-700 border-green-100'
                                                            : 'bg-orange-50 text-orange-700 border-orange-100'
                                                            }`}>
                                                            {m.isVerified ? 'VERIFIED' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            setScannedParticipant(reg);
                                                            setScannedMemberIndex(index);
                                                        }} className="h-8 w-8 text-primary hover:bg-primary/10">
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

                                                        {!m.isVerified && (
                                                            <Button onClick={() => verifyMember(reg.id, index)} variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-50" title="Verify Participant">
                                                                <CheckCircle size={14} />
                                                            </Button>
                                                        )}
                                                        <Button onClick={() => handleDelete(reg.id, index)} variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50" title="Delete Participant">
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })
                                })()
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
