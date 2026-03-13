import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

interface PINVerificationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (pin: string) => void;
    title?: string;
    description?: string;
}

const PINVerificationDialog = ({
    isOpen,
    onClose,
    onVerify,
    title = "Security Verification",
    description = "Please enter your admin PIN to confirm this action."
}: PINVerificationDialogProps) => {
    const [pin, setPin] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onVerify(pin);
        setPin(""); // Clear for security
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-white text-slate-900 border-none rounded-3xl pb-8 shadow-2xl">
                <DialogHeader className="items-center text-center pt-4">
                    <div className="bg-purple-100 p-4 rounded-full mb-4">
                        <Lock className="h-8 w-8 text-purple-600" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-800">{title}</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="relative group">
                        <Input
                            type="password"
                            placeholder="------"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            autoFocus
                            className={`h-14 bg-slate-50 border-2 border-slate-100 focus:border-purple-600 rounded-2xl text-center text-2xl font-black transition-all ${pin ? 'tracking-[0.8em]' : 'tracking-normal'}`}
                        />
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                            <Lock className="h-5 w-5" />
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0 mt-2">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={onClose}
                            className="flex-1 h-12 font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg shadow-purple-100"
                        >
                            Confirm Action
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default PINVerificationDialog;
