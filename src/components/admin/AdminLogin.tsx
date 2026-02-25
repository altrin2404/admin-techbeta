import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface AdminLoginProps {
    onLogin: (username: string, password: string, mode: 'dashboard' | 'attendance') => Promise<void>;
    isLoading: boolean;
}

const AdminLogin = ({ onLogin, isLoading }: AdminLoginProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.MouseEvent, mode: 'dashboard' | 'attendance') => {
        e.preventDefault();
        if (!username || !password) return;
        await onLogin(username, password, mode);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-black/5">
                    <div className="flex flex-col items-center mb-8">
                        <ShieldCheck className="h-12 w-12 text-purple-600 mb-4" />
                        <h1 className="text-2xl font-bold text-slate-800">Admin Control</h1>
                    </div>
                    <div className="space-y-4">
                        <Input
                            placeholder="ID"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <Button
                                onClick={(e) => handleSubmit(e, 'dashboard')}
                                className="h-11 bg-purple-600 hover:bg-purple-700 font-bold"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "1. Dashboard"}
                            </Button>
                            <Button
                                onClick={(e) => handleSubmit(e, 'attendance')}
                                variant="outline"
                                className="h-11 border-purple-600 text-purple-600 hover:bg-purple-50 font-bold"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "2. Attendance"}
                            </Button>
                        </div>
                    </div>
                    <Link to="/" className="mt-6 text-sm text-slate-400 text-center block">← Back to Website</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
