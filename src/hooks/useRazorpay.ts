import { useState, useEffect } from "react";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Check if script is already loaded
        if (document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`)) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setError(new Error("Failed to load Razorpay SDK"));

        document.body.appendChild(script);

        return () => {
            // Optional: Cleanup if needed, but usually we want to keep the script
            // document.body.removeChild(script);
        };
    }, []);

    return { isLoaded, error };
};
