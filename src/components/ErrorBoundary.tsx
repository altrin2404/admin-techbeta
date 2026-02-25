import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-red-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                            <p className="text-gray-500 mb-6">
                                The application encountered an unexpected error.
                            </p>

                            <div className="w-full bg-slate-900 text-slate-50 p-4 rounded-lg text-left overflow-auto text-xs font-mono mb-6 max-h-64">
                                <p className="text-red-400 font-bold mb-2">{this.state.error?.toString()}</p>
                                <pre>{this.state.errorInfo?.componentStack}</pre>
                            </div>

                            <Button
                                onClick={() => window.location.reload()}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold w-full"
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
