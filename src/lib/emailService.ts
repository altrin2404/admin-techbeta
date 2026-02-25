
import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface EmailParams {
    to_name: string;
    to_email: string;
    transaction_id: string;
    qr_code_url: string;
    event_date: string;
    event_time: string;
    event_venue: string;
    message: string;
}

// Initialize EmailJS
emailjs.init(PUBLIC_KEY);

export const sendVerificationEmail = async (
    toName: string,
    toEmail: string,
    transactionId: string,
    qrCodeUrl: string
) => {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.error("EmailJS credentials missing!", { SERVICE_ID, TEMPLATE_ID, hasPublicKey: !!PUBLIC_KEY });
        return { success: false, error: "Email configuration missing" };
    }

    try {
        console.log("Attempting to send email with params:", { toName, toEmail, transactionId });
        const params: EmailParams = {
            to_name: toName,
            to_email: toEmail,
            transaction_id: transactionId,
            qr_code_url: qrCodeUrl,
            event_date: "March 13, 2026",
            event_time: "09:00 AM",
            event_venue: "Rock Auditorium, SXCCE, Nagercoil",
            message: "Congratulations! Your registration for TechBeta'26 has been verified. Please show the QR code below at the registration desk."
        };

        const response = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            params as any, // Cast to any because emailjs expects a record
            PUBLIC_KEY
        );
        console.log("EmailJS Response:", response);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to send email. Full error object:", error);
        return { success: false, error: error?.text || error?.message || JSON.stringify(error) };
    }
};
