import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 465, // Port 465 is SSL and often more reliable on Render
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 20000, // Increase to 20 seconds
    greetingTimeout: 20000,
    socketTimeout: 30000,
    debug: true,
    logger: true
})

export default transporter