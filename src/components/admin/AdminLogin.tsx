import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface AdminLoginProps {
    onLogin: (username: string, password: string, mode: 'dashboard' | 'attendance' | 'event-attendance') => Promise<void>;
    isLoading: boolean;
}

const AdminLogin = ({ onLogin, isLoading }: AdminLoginProps) => {
    const [selectedMode, setSelectedMode] = useState<'dashboard' | 'attendance' | 'event-attendance' | null>(null);
    const [pin, setPin] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMode || !pin) return;

        // For Dashboard we might use "admin", for Event Attendance we might use "attendance"
        // For the new "Attendance" (empty) option, we'll use a placeholder or the same as others if needed
        const username = selectedMode === 'dashboard' ? 'admin' : 'attendance';
        await onLogin(username, pin, selectedMode);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-black/5">
                    <div className="flex flex-col items-center mb-8">
                        <ShieldCheck className="h-12 w-12 text-purple-600 mb-4" />
                        <h1 className="text-2xl font-bold text-slate-800">Admin Control</h1>
                        <p className="text-slate-500 mt-2 text-sm text-center">
                            Select the portal you want to access
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!selectedMode ? (
                            <motion.div
                                key="mode-selection"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <Button
                                    onClick={() => setSelectedMode('dashboard')}
                                    className="w-full h-14 bg-purple-600 hover:bg-purple-700 font-bold text-lg"
                                >
                                    1. Dashboard
                                </Button>
                                <Button
                                    onClick={() => setSelectedMode('attendance')}
                                    variant="outline"
                                    className="w-full h-14 border-purple-600 text-purple-600 hover:bg-purple-50 font-bold text-lg"
                                >
                                    2. Attendance
                                </Button>
                                <Button
                                    onClick={() => setSelectedMode('event-attendance')}
                                    variant="outline"
                                    className="w-full h-14 border-purple-600 text-purple-600 hover:bg-purple-50 font-bold text-lg"
                                >
                                    3. Event Attendance
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="pin-entry"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setSelectedMode(null);
                                                setPin("");
                                            }}
                                            className="h-8 w-8"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                        <h2 className="font-semibold text-slate-700 capitalize">
                                            {selectedMode} Access
                                        </h2>
                                    </div>
                                    <Input
                                        type="password"
                                        placeholder="Enter 6-Digit PIN"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        className="text-center text-2xl tracking-[0.5em] h-14 font-bold"
                                        required
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 font-bold"
                                        disabled={isLoading || pin.length < 6}
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify PIN"}
                                    </Button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
