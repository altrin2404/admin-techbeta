import axios from 'axios';

const SERVICE_ID = "service_zhauh4p";
const TEMPLATE_ID = "template_unfu8bk";
const PUBLIC_KEY = "eT0YTxHkG0KjnuAOZ";

const participants = {"Shalu":{"id":"Rh7TtP14du9MxukJi7nn","email":"shalurs2007@gmail.com","events":["LogoHub"]},"P Akshitha":{"id":"qX97GP2YfUeXm2ZeQALm","email":"akshi464413@gmail.com","events":["VIBE CODING"]},"Varshaa A.S":{"id":"YXhGNno7TxP9W1ZDfk7v","email":"varshasvam16@gmail.com","events":["FutureMinds"]},"Anndrea 30":{"id":"kKCkC8AOXPBAFi0jfpQ5","email":"reya3052006@gmail.com","events":["Postercraft","FutureMinds"]},"Annet Cathrine A":{"id":"xViwdkHqdwL8IKc83nSI","email":"annetcathrine7@gmail.com","events":["VIBE CODING"]},"Sharmiya p m":{"id":"ioGv80lE1uOq05BN8PrW","email":"sharmiyapm2007@gmail.com","events":["LogoHub"]},"Divina sp":{"id":"cdjHt2mrEtWxmxADEeZL","email":"divisp008@gmail.com","events":["LogoHub"]},"Jennifer JV":{"id":"bLoBuZhQsuVzuUMfhVi3","email":"jenniferjv2025@gmail.com","events":["LogoHub"]},"Mijoera sm":{"id":"nZqQrdItNh3kdAhNuZH9","email":"mijoeramelooni@gmail.com","events":["LogoHub"]},"Shajisha.S":{"id":"jIPwKEVKV1tHREDc6oh4","email":"shajisha1310@gmail.com","events":["FutureMinds"]},"Vinothini R":{"id":"xsq4Ad5MUqURaW9nbQQn","email":"vinopanda2526@gmail.com","events":["VIBE CODING"]},"Aswini T":{"id":"jnzSMx9PaI4TUAWonZCk","email":"aswinithiagarajan2006@gmail.com","events":["FutureMinds"]},"K. Shenbaga Arasi":{"id":"wfhchzLT7iAcHXUnfk1I","email":"arasikannan1707@gmail.com","events":["LogoHub"]}};

async function sendEmails() {
    console.log(`Starting bulk email dispatch for ${Object.keys(participants).length} participants...`);

    for (const [name, data] of Object.entries(participants)) {
        try {
            const qrData = JSON.stringify({
                id: data.id,
                index: 0,
                name: name,
                events: data.events
            });
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

            console.log(`Sending email to ${name} (${data.email})...`);

            const payload = {
                service_id: SERVICE_ID,
                template_id: TEMPLATE_ID,
                user_id: PUBLIC_KEY,
                template_params: {
                    to_name: name,
                    to_email: data.email,
                    transaction_id: "ON_SPOT_MANUAL",
                    qr_code_url: qrCodeUrl,
                    event_date: "March 27, 2026",
                    event_time: "09:00 AM",
                    event_venue: "Rock Auditorium, SXCCE, Nagercoil",
                    message: "Congratulations! Your registration for TechBeta'26 has been verified. Please show the QR code below at the registration desk."
                }
            };

            const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload);
            console.log(`Successfully sent to ${name}: ${response.data}`);
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Failed to send email to ${name}:`, error.response ? error.response.data : error.message);
        }
    }

    console.log("Bulk email dispatch completed!");
}

sendEmails();
