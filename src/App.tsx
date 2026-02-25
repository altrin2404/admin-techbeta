import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";

import ErrorBoundary from "@/components/ErrorBoundary";
import AdminDashboard from "./pages/AdminDashboard";

const App = () => (
    <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
    }}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary>
                <AdminDashboard />
            </ErrorBoundary>
        </TooltipProvider>
    </BrowserRouter>
);

export default App;
