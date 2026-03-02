import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";

import { Suspense, lazy } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const PageLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-200">
        <Loader2 className="h-8 w-8 animate-spin" />
    </div>
);

const App = () => (
    <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
    }}>
        <TooltipProvider>
            <Toaster />
            <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                </Suspense>
            </ErrorBoundary>
        </TooltipProvider>
    </BrowserRouter>
);

export default App;
