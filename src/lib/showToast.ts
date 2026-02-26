import { toast } from "@/hooks/use-toast";

/**
 * Clean toast helper with variant-based styling.
 * Uses the radix-ui toast system with success/error/info variants.
 */
export const showToast = {
    success: (message: string, description?: string) => {
        toast({
            title: message,
            description,
            variant: "success" as any,
        });
    },
    error: (message: string, description?: string) => {
        toast({
            title: message,
            description,
            variant: "destructive",
        });
    },
    info: (message: string, description?: string) => {
        toast({
            title: message,
            description,
            variant: "info" as any,
        });
    },
};
